// One recommended product, as seen by someone standing in a shop.
//
// Three things stay visually separate, because collapsing them is how this
// feature would start lying:
//   1. what the product IS         (brand, verdict)
//   2. WHY                          (plain-English reasons, good and bad)
//   3. how likely it is to be HERE  (availability, with its confidence)
//
// The breakdown deliberately leads with sentences rather than figures. "3.28 kg
// CO2e per kg" is a unit, not an insight — most people cannot tell whether that
// is good, and a number nobody can interpret is decoration. The exact figures
// and their baseline are one tap away for anyone who wants to check us.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, MapPin, ChevronDown, Minus, Plus } from 'lucide-react';
import { DS } from '@/styles/design-tokens';
import type { ShelfPick } from '@/services/supermarket';
import type { Retailer } from '@/data/retailers';
import type { AvailabilityConfidence } from '@/services/retailers';
import { recordSighting, hasConfirmed } from '@/utils/storeSightings';
import { addToBasket, loadBasket } from '@/utils/basketStorage';
import { getLaborAllegationCount } from '@/utils/laborCheck';
import { toast } from 'sonner';

const CONFIDENCE_STYLE: Record<AvailabilityConfidence, { fg: string; bg: string; dashed: boolean }> = {
  confirmed_here: { fg: DS.good, bg: DS.goodBg, dashed: false },
  seen_at_chain: { fg: DS.ink, bg: DS.bg, dashed: false },
  sold_in_market: { fg: DS.muted, bg: DS.bg, dashed: false },
  unknown: { fg: DS.muted, bg: 'transparent', dashed: true },
};

/** Plain wording for the top-line verdict. "CONSIDER" is not a word people use. */
const VERDICT_TEXT: Record<string, { label: string; color: string; bg: string }> = {
  BUY: { label: 'Good pick', color: DS.good, bg: DS.goodBg },
  CONSIDER: { label: 'Decent, with trade-offs', color: DS.warn, bg: DS.warnBg },
  CAUTION: { label: 'Worth thinking twice', color: DS.warn, bg: DS.warnBg },
  AVOID: { label: 'We would skip this', color: DS.bad, bg: DS.badBg },
  UNKNOWN: { label: 'Not enough data', color: DS.muted, bg: DS.bg },
};

interface Props {
  pick: ShelfPick;
  retailer: Retailer;
  countryCode: string | null;
  city?: string | null;
}

export function ShelfPickCard({ pick, retailer, countryCode, city }: Props) {
  const navigate = useNavigate();
  // Already on the list, or already confirmed as seen here — either way the
  // button has nothing left to ask for.
  const [confirmed, setConfirmed] = useState(() => {
    if (!pick.barcode) return false;
    return loadBasket().some((b) => b.barcode === pick.barcode)
      || hasConfirmed(pick.barcode, retailer.id);
  });
  const [showDetail, setShowDetail] = useState(false);

  const availStyle = CONFIDENCE_STYLE[pick.availability.confidence];
  const verdict = VERDICT_TEXT[pick.verdict] ?? VERDICT_TEXT.UNKNOWN;

  /**
   * Adds to the shopping list AND records the sighting.
   *
   * These were two separate asks of the user — "add this" and "confirm you saw
   * it here" — and only one of them is a thing anybody wants to do in an aisle.
   * Putting it on the list IS evidence they saw it, so the sighting comes along
   * for free and the button asks for the thing they actually came to do.
   */
  const addToCart = () => {
    if (!pick.barcode) return;
    addToBasket({
      barcode: pick.barcode,
      productName: pick.productName || 'Unknown product',
      brand: pick.brand,
      imageUrl: pick.imageUrl,
      ecoscoreGrade: pick.product?.ecoscoreGrade ?? null,
      ecoscoreScore: pick.product?.ecoscoreScore ?? null,
      nutriscoreGrade: pick.product?.nutriscoreGrade ?? null,
      laborAllegations: getLaborAllegationCount(pick.brand, pick.productName),
      co2Per100g: pick.product?.carbonFootprint100g ?? null,
    });
    recordSighting({
      barcode: pick.barcode,
      retailerId: retailer.id,
      countryCode: countryCode ?? '',
      city: city ?? null,
    });
    setConfirmed(true);
    toast.success('Added to your list', {
      description: `Also noted as seen at ${retailer.name}.`,
      action: { label: 'View list', onClick: () => navigate('/dashboard') },
    });
  };

  return (
    <div
      style={{
        background: DS.card, borderRadius: 18, padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
      }}
    >
      {/* Identity + verdict */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {pick.imageUrl ? (
          <img
            src={pick.imageUrl}
            alt=""
            loading="lazy"
            style={{ width: 54, height: 54, borderRadius: 12, objectFit: 'contain', background: DS.bg, flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: 54, height: 54, borderRadius: 12, background: DS.bg, flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: DS.ink, margin: 0, lineHeight: 1.25 }}>
            {pick.brand}
          </p>
          <p style={{ fontSize: 12, color: DS.muted, margin: '2px 0 6px', lineHeight: 1.4 }}>
            {pick.productName}
          </p>
          <span
            style={{
              display: 'inline-block', fontSize: 11.5, fontWeight: 800,
              color: verdict.color, background: verdict.bg,
              borderRadius: 999, padding: '3px 10px',
            }}
          >
            {verdict.label}
          </span>
        </div>
      </div>

      {/* Why — the breakdown, as sentences. */}
      {pick.reasons.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pick.reasons.slice(0, showDetail ? undefined : 3).map((r, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <ReasonMark tone={r.tone} />
              <span style={{ fontSize: 12.5, color: DS.ink2, lineHeight: 1.5 }}>{r.text}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Availability */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11.5, fontWeight: 700, color: availStyle.fg, background: availStyle.bg,
            borderRadius: 999, padding: '4px 10px',
            border: availStyle.dashed ? `1px dashed ${DS.hair}` : 'none',
          }}
        >
          <MapPin style={{ width: 11, height: 11 }} />
          {pick.availability.label}
        </span>
        <button
          type="button"
          onClick={() => setShowDetail((v) => !v)}
          aria-expanded={showDetail}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontFamily: DS.font, fontSize: 11.5, fontWeight: 600, color: DS.muted,
          }}
        >
          {showDetail ? 'Less' : 'How do we know?'}
          <ChevronDown style={{ width: 12, height: 12, transform: showDetail ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }} />
        </button>
      </div>

      {/* The receipts — exact figures and where they came from. */}
      {showDetail && (
        <div style={{ marginTop: 10, background: DS.bg, borderRadius: 12, padding: '11px 13px' }}>
          <p style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.55, margin: 0 }}>
            {pick.availability.explain}
          </p>
          {pick.comparison && !pick.comparison.insufficientData && (
            <p style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.55, margin: '8px 0 0' }}>
              {pick.comparison.co2SavedKg != null && (
                <>
                  Carbon: {Math.abs(pick.comparison.co2SavedKg)} kg CO₂e per kg{' '}
                  {pick.comparison.co2SavedKg > 0 ? 'below' : 'above'} the category average of{' '}
                  {pick.comparison.baseline.meanCo2Kg?.toFixed(1)} kg.{' '}
                </>
              )}
              {pick.comparison.statement} Carbon figures are Agribalyse life-cycle estimates for this
              kind of product, not measurements of this exact item.
            </p>
          )}
          {!pick.vetted && (
            <p style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.55, margin: '8px 0 0' }}>
              This came from a search rather than our vetted list — it scored well on the data we
              hold, but no one has hand-checked this brand.
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {pick.barcode && (
          <button
            type="button"
            onClick={() => navigate(`/product-off/${pick.barcode}`)}
            style={{
              flex: 1, height: 40, borderRadius: 11, cursor: 'pointer',
              border: 'none', background: DS.ink, color: DS.card,
              fontFamily: DS.font, fontSize: 13, fontWeight: 700,
            }}
          >
            Full breakdown
          </button>
        )}
        <button
          type="button"
          onClick={addToCart}
          disabled={confirmed || !pick.barcode}
          style={{
            flexShrink: 0, height: 40, padding: '0 14px', borderRadius: 11,
            cursor: confirmed || !pick.barcode ? 'default' : 'pointer',
            border: `1px solid ${confirmed ? DS.good : DS.hair}`,
            background: confirmed ? DS.goodBg : 'transparent',
            color: confirmed ? DS.good : DS.ink,
            fontFamily: DS.font, fontSize: 12.5, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            opacity: !pick.barcode ? 0.4 : 1,
            transition: 'background .2s ease, color .2s ease',
          }}
        >
          {confirmed
            ? <><Check style={{ width: 13, height: 13 }} strokeWidth={3} /> On your list</>
            : <><Plus style={{ width: 13, height: 13 }} strokeWidth={2.6} /> Add to cart</>}
        </button>
      </div>
    </div>
  );
}

/** A tick, a cross or a dash — readable before any text is. */
function ReasonMark({ tone }: { tone: 'good' | 'bad' | 'neutral' }) {
  const size = { width: 13, height: 13, flexShrink: 0, marginTop: 2 };
  if (tone === 'good') return <Check style={{ ...size, color: DS.good }} strokeWidth={3} />;
  if (tone === 'bad') {
    return (
      <span
        aria-hidden="true"
        style={{
          ...size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: DS.bad, fontWeight: 900, fontSize: 13, lineHeight: 1,
        }}
      >
        ✕
      </span>
    );
  }
  return <Minus style={{ ...size, color: DS.muted }} strokeWidth={3} />;
}
