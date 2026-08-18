// Where this product came from — as far as anyone will actually say.
//
// A canvas globe, NOT an iframe: this sits inside a scrolling verdict page, and
// an iframe would fight the page for touch events.
//
// The render rules are the feature (docs/SUPPLY_CHAIN_INVARIANTS.md):
//   solid arc   = declared
//   dashed arc  = inferred
//   no arc      = unknown, shown as a "not disclosed" chip instead
//
// No moving dots along arcs. An animated line reads as "tracking" — as though we
// know a shipment's path. We know a commodity's likely region. A great-circle
// arc here is a visual connector, not a claimed route, and the legend says so.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Globe2, Info } from 'lucide-react';
import { DS } from '@/styles/design-tokens';
import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';
import type { UserRegion } from '@/utils/userRegion';
import { resolveSupplyChain } from '@/services/supplyChain/resolve';
import type { SupplyChainNode } from '@/services/supplyChain/types';
import landPolygons from '@/data/supplyChain/landPolygons.json';
import { BASE_SOURCES, SOURCES_VERIFIED_ON } from '@/data/supplyChain/sources';

const LAND = landPolygons as [number, number][][][];
const RAD = Math.PI / 180;

/** Orthographic projection. Returns null for points on the far side. */
function project(
  lon: number, lat: number, rotLon: number, rotLat: number,
  cx: number, cy: number, r: number,
): { x: number; y: number } | null {
  const l = (lon + rotLon) * RAD;
  const p = lat * RAD;
  const p0 = rotLat * RAD;
  const cosC = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  if (cosC < 0) return null; // behind the globe
  return {
    x: cx + r * Math.cos(p) * Math.sin(l),
    y: cy - r * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)),
  };
}

/** Great-circle interpolation, so an arc bends the way the earth does. */
function greatCircle(
  a: { lon: number; lat: number }, b: { lon: number; lat: number }, steps = 48,
): { lon: number; lat: number }[] {
  const φ1 = a.lat * RAD, λ1 = a.lon * RAD, φ2 = b.lat * RAD, λ2 = b.lon * RAD;
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2,
  ));
  if (!d || !Number.isFinite(d)) return [a, b];
  const out: { lon: number; lat: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    out.push({
      lat: Math.atan2(z, Math.sqrt(x * x + y * y)) / RAD,
      lon: Math.atan2(y, x) / RAD,
    });
  }
  return out;
}

interface Props {
  product: OpenFoodFactsResult;
  region: UserRegion | null;
}

export function SupplyChainMap({ product, region }: Props) {
  const graph = useMemo(() => resolveSupplyChain(product, region), [product, region]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<SupplyChainNode | null>(null);

  // Start rotated to the first placed node so the interesting hemisphere faces
  // the user rather than the middle of the Pacific.
  const firstPlaced = graph.nodes.find((n) => n.lon !== null);
  const [rot, setRot] = useState({
    lon: firstPlaced?.lon != null ? -firstPlaced.lon : 20,
    lat: 12,
  });
  const drag = useRef<{ x: number; y: number; lon: number; lat: number } | null>(null);

  const placed = graph.nodes.filter((n) => n.lon !== null && n.lat !== null);
  const undisclosed = graph.nodes.filter((n) => n.lon === null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 14;
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue('--ds-ink').trim() || '#1a1a1a';
    const hair = css.getPropertyValue('--ds-hair').trim() || '#e5e5e5';
    const good = css.getPropertyValue('--ds-good').trim() || '#2e7d52';
    const bad = css.getPropertyValue('--ds-bad').trim() || '#c2402f';

    // Ocean
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = hair;
    ctx.fill();

    // Land
    ctx.fillStyle = css.getPropertyValue('--ds-card').trim() || '#fff';
    ctx.strokeStyle = hair;
    ctx.lineWidth = 0.5;
    for (const poly of LAND) {
      for (const ring of poly) {
        let started = false;
        ctx.beginPath();
        for (const [lon, lat] of ring) {
          const p = project(lon, lat, rot.lon, rot.lat, cx, cy, r);
          if (!p) { started = false; continue; }
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Arcs. Solid = declared, dashed = inferred. Never for unknown.
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    for (const e of graph.edges) {
      const a = byId.get(e.from), b = byId.get(e.to);
      if (!a?.lon || !b?.lon || a.lat === null || b.lat === null) continue;
      const pts = greatCircle(
        { lon: a.lon, lat: a.lat }, { lon: b.lon, lat: b.lat },
      );
      ctx.beginPath();
      ctx.setLineDash(e.tier === 'inferred' ? [4, 4] : []);
      ctx.strokeStyle = e.tier === 'declared' ? ink : DS.muted;
      ctx.globalAlpha = e.tier === 'declared' ? 0.85 : 0.55;
      ctx.lineWidth = e.tier === 'declared' ? 1.8 : 1.3;
      let started = false;
      for (const q of pts) {
        const p = project(q.lon, q.lat, rot.lon, rot.lat, cx, cy, r);
        if (!p) { started = false; continue; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; }
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // Nodes
    for (const n of placed) {
      const p = project(n.lon!, n.lat!, rot.lon, rot.lat, cx, cy, r);
      if (!p) continue;
      const isDest = n.kind === 'destination';
      const colour = n.tvpraFlagged ? bad : isDest ? ink : good;
      ctx.beginPath();
      ctx.arc(p.x, p.y, isDest ? 5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = colour;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = css.getPropertyValue('--ds-card').trim() || '#fff';
      ctx.stroke();
      if (selected?.id === n.id) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = colour;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }, [graph, rot, selected, placed]);

  // Drag to spin. Pointer events so it works with touch and mouse alike, and
  // touch-action:none stops the page stealing horizontal drags.
  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, lon: rot.lon, lat: rot.lat };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setRot({
      lon: d.lon + (e.clientX - d.x) * 0.5,
      lat: Math.max(-80, Math.min(80, d.lat - (e.clientY - d.y) * 0.5)),
    });
  };
  const onUp = () => { drag.current = null; };

  const tierWord = graph.bestTier === 'declared' ? 'Partly disclosed'
    : graph.bestTier === 'inferred' ? 'Not disclosed — estimated' : 'Not disclosed';

  return (
    <div style={{
      background: DS.card, borderRadius: 18, padding: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <Globe2 style={{ width: 16, height: 16, color: DS.muted }} />
        <span style={{ fontSize: 15, fontWeight: 800, color: DS.ink }}>Where it comes from</span>
        <span style={{
          marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, color: DS.muted,
          border: `1px solid ${DS.hair}`, borderRadius: 999, padding: '2px 8px',
        }}>
          {tierWord}
        </span>
      </div>
      <p style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.5, margin: '0 0 10px' }}>
        Drag to spin. Tap a point to see where the claim comes from.
      </p>

      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          width: '100%', height: 260, display: 'block', cursor: 'grab',
          touchAction: 'none',
        }}
      />

      {/* Legend — always visible. The distinction between line styles IS the feature. */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, marginBottom: 10 }}>
        <LegendItem dash={false} label="Disclosed by the product or brand" />
        <LegendItem dash label="Estimated from the company's known sourcing" />
      </div>

      {/* Every placed node, tappable. */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {placed.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => setSelected(selected?.id === n.id ? null : n)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              border: `1px ${n.tier === 'inferred' ? 'dashed' : 'solid'} ${
                selected?.id === n.id ? DS.ink : DS.hair}`,
              background: 'transparent', borderRadius: 999, padding: '5px 11px',
              cursor: 'pointer', fontFamily: DS.font, fontSize: 11.5, fontWeight: 600,
              color: DS.ink,
            }}
          >
            {n.tvpraFlagged && <span aria-hidden="true" style={{ color: DS.bad }}>⚠</span>}
            {n.label}
          </button>
        ))}
      </div>

      {/* Unknowns get a chip, never a line. Opacity is the finding. */}
      {undisclosed.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {undisclosed.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setSelected(selected?.id === n.id ? null : n)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                border: `1px dashed ${DS.hair}`, background: 'transparent',
                borderRadius: 999, padding: '5px 11px', cursor: 'pointer',
                fontFamily: DS.font, fontSize: 11.5, fontWeight: 600, color: DS.muted,
              }}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {graph.undisclosedCount > 0 && (
        <p style={{ fontSize: 11, color: DS.muted, lineHeight: 1.5, margin: '9px 0 0' }}>
          + {graph.undisclosedCount} other ingredient{graph.undisclosedCount === 1 ? '' : 's'},
          origins not disclosed.
        </p>
      )}

      {/*
        No origins at all. Previously this left a bare globe, which reads as
        "the feature is broken" rather than "there is nothing to show" — and
        those are very different messages.

        This is the honest end state for bottled water, cheese, a plain wheat
        loaf, most colas: they contain no crop whose supply is concentrated
        enough in one region to say anything useful about. The temptation is to
        put SOMETHING on the map. Wheat and dairy are grown nearly everywhere,
        so a pin would be decoration, and a pin next to a labour warning would
        be worse than decoration.
      */}
      {placed.filter((n) => n.kind === 'origin').length === 0 && (
        <p style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.55, margin: '9px 0 0' }}>
          This company hasn't disclosed where these ingredients come from, and we
          have no documented findings about its supply chain. We won't guess —
          a map built from where crops usually grow would tell you nothing about
          this product.
        </p>
      )}

      {/* The basis for whatever was tapped. */}
      {selected && (
        <div style={{ marginTop: 10, background: DS.bg, borderRadius: 12, padding: '11px 13px' }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: DS.ink, margin: '0 0 4px' }}>
            {selected.label}
          </p>
          <p style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.55, margin: 0 }}>
            {selected.basis}
          </p>
          {selected.tvpraFlagged && selected.commodity && (
            <p style={{ fontSize: 11.5, color: DS.bad, lineHeight: 1.55, margin: '7px 0 0' }}>
              The US Department of Labor lists {selected.commodity} from {selected.label} for
              child or forced labour. That is a finding about the commodity and the region —
              not an allegation about this company.
            </p>
          )}
          {selected.sources.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
              {selected.sources.map((s, i) => (
                <li key={i} style={{ fontSize: 11, color: DS.muted, lineHeight: 1.5 }}>
                  {s.url
                    ? <a href={s.url} target="_blank" rel="noopener noreferrer"
                         style={{ color: DS.ink, textDecoration: 'underline' }}>{s.label}</a>
                    : s.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p style={{
        display: 'flex', gap: 6, alignItems: 'flex-start',
        fontSize: 10.5, color: DS.muted, lineHeight: 1.5, margin: '10px 0 0',
      }}>
        <Info style={{ width: 11, height: 11, flexShrink: 0, marginTop: 2 }} />
        <span>
          Lines connect places, they don't trace a shipping route — we have no route data.
          Points mark producing <em>regions</em>, never a specific farm or factory.
        </span>
      </p>

      {/* What backs the whole picture, as opposed to any single pin. Every URL
          here was fetched and returned 200 on the date shown; a citation that
          404s is worse than none, because it implies there was something to
          check. Open Food Facts attribution is an ODbL licence condition. */}
      <details style={{ marginTop: 8 }}>
        <summary style={{
          cursor: 'pointer', fontSize: 10.5, fontWeight: 700, color: DS.muted,
          listStyle: 'none',
        }}>
          Sources for this map
        </summary>
        <ul style={{ listStyle: 'none', padding: 0, margin: '7px 0 0' }}>
          {BASE_SOURCES.map((s) => (
            <li key={s.label} style={{ fontSize: 10.5, color: DS.muted, lineHeight: 1.55, marginBottom: 3 }}>
              {s.url
                ? <a href={s.url} target="_blank" rel="noopener noreferrer"
                     style={{ color: DS.ink, textDecoration: 'underline' }}>{s.label}</a>
                : s.label}
            </li>
          ))}
          <li style={{ fontSize: 10, color: DS.muted, lineHeight: 1.5, marginTop: 5 }}>
            Links checked {SOURCES_VERIFIED_ON}. Per-point citations appear when you
            tap a point.
          </li>
        </ul>
      </details>
    </div>
  );
}

function LegendItem({ dash, label }: { dash: boolean; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <svg width="22" height="6" aria-hidden="true">
        <line
          x1="0" y1="3" x2="22" y2="3"
          stroke={dash ? DS.muted : DS.ink}
          strokeWidth={dash ? 1.3 : 1.8}
          strokeDasharray={dash ? '4 4' : undefined}
        />
      </svg>
      <span style={{ fontSize: 10.5, color: DS.muted }}>{label}</span>
    </span>
  );
}
