// "I'm in this shop. What should I buy?"
//
// Four steps, in the order a person actually answers them: country, city, shop,
// product. Each one only appears once the previous is settled, so the screen is
// never a wall of empty inputs.
//
// The whole page is built around one constraint: we do not know what is on the
// shelf. Nobody does, without a retailer partnership. So it promises "usually
// stocked here" and never "in stock", and every availability claim carries a
// "how do we know?" naming its source. Legal notes live in RetailerDisclaimer
// and render with the results rather than being buried in settings.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Store, MapPin, ChevronDown, Loader2, Check, Globe } from 'lucide-react';
import { DS } from '@/styles/design-tokens';
import { BackButton } from '@/components/BackButton';
import { ShelfPickCard } from '@/components/ShelfPickCard';
import { RetailerDisclaimer } from '@/components/RetailerDisclaimer';
import { getRetailersForCountry, type Retailer } from '@/data/retailers';
import { loadRetailer, saveRetailer, RETAILER_EVENT } from '@/utils/selectedRetailer';
import { COUNTRIES, loadRegion, saveRegion, REGION_EVENT, type UserRegion } from '@/utils/userRegion';
import { loadPriorities } from '@/utils/userPreferences';
import { searchShelf, POPULAR_CATEGORIES, type ShelfResult } from '@/services/supermarket';

export default function Supermarket() {
  const [region, setRegion] = useState<UserRegion | null>(() => loadRegion());
  const [retailer, setRetailer] = useState<Retailer | null>(() => loadRetailer(loadRegion()?.countryCode));
  const [cityDraft, setCityDraft] = useState(() => loadRegion()?.city ?? '');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ShelfResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => {
    document.title = 'Shop ethically — GoodScan';
    return () => { document.title = 'GoodScan'; };
  }, []);

  useEffect(() => {
    const sync = () => {
      const r = loadRegion();
      setRegion(r);
      setRetailer(loadRetailer(r?.countryCode));
    };
    window.addEventListener(REGION_EVENT, sync);
    window.addEventListener(RETAILER_EVENT, sync);
    return () => {
      window.removeEventListener(REGION_EVENT, sync);
      window.removeEventListener(RETAILER_EVENT, sync);
    };
  }, []);

  const chains = useMemo(() => getRetailersForCountry(region?.countryCode), [region?.countryCode]);
  const hasCity = !!region?.city;

  // Guards against out-of-order responses.
  //
  // A shelf search fans out to dozens of Open Food Facts lookups and can take
  // seconds. Switch shops mid-flight and the older request finishes last,
  // overwriting the newer result — the header said "Tesco" while the list said
  // "6 picks for Asda", with availability computed for the wrong chain. On a
  // feature whose whole job is "is this here?", that is a wrong answer, not a
  // cosmetic glitch. Only the newest request may write.
  const reqRef = useRef(0);

  const run = async (q: string, forRetailer: Retailer | null = retailer) => {
    const term = q.trim();
    if (!term || !forRetailer) return;
    const token = ++reqRef.current;
    setLoading(true);
    setResult(null);
    try {
      const res = await searchShelf(term, forRetailer, {
        region, priorities: loadPriorities(), limit: 6,
      });
      if (token === reqRef.current) setResult(res);
    } catch {
      if (token === reqRef.current) setResult(null);
    } finally {
      if (token === reqRef.current) setLoading(false);
    }
  };

  const pickCountry = (code: string, name: string) => {
    // Changing country invalidates both the city and the shop — a Tesco in
    // Indonesia is not a shop anyone can walk into.
    saveRegion({ countryCode: code, country: name });
    setRegion(loadRegion());
    setRetailer(null);
    setCityDraft('');
    setResult(null);
    setCountryOpen(false);
  };

  const saveCity = () => {
    if (!region) return;
    saveRegion({ countryCode: region.countryCode, country: region.country, city: cityDraft.trim() });
    setRegion(loadRegion());
  };

  const pickChain = (r: Retailer) => {
    saveRetailer(r.id);
    setRetailer(r);
    setShopOpen(false);
    // Any result on screen belongs to the previous shop.
    setResult(null);
    // Pass the new chain explicitly — `retailer` state hasn't updated yet.
    if (query.trim()) void run(query, r);
  };

  return (
    <div style={{ minHeight: '100dvh', background: DS.bg, fontFamily: DS.font, color: DS.ink }}>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: 'max(56px, calc(env(safe-area-inset-top,0px) + 16px)) 16px 140px' }}>
        <div style={{ marginBottom: 14 }}><BackButton /></div>

        <header style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: DS.muted, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
            In the shop
          </p>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 8px' }}>
            What should I buy here?
          </h1>
          <p style={{ fontSize: 13.5, color: DS.muted, lineHeight: 1.5, margin: 0 }}>
            Tell us where you're shopping, then search anything — we'll rank what's cleanest and
            explain why in plain English.
          </p>
        </header>

        {/* ── 1. Country ── */}
        <Step n="1" title="Country" done={!!region}>
          <Row
            onClick={() => setCountryOpen((v) => !v)}
            expanded={countryOpen}
            icon={<Globe style={{ width: 18, height: 18, color: DS.muted }} />}
            title={region ? region.country : 'Choose your country'}
            subtitle={region ? 'Sets which shops and products we show' : undefined}
          />
          {countryOpen && (
            <Panel>
              {COUNTRIES.map((c, i) => (
                <PanelButton
                  key={c.code}
                  first={i === 0}
                  selected={region?.countryCode === c.code}
                  onClick={() => pickCountry(c.code, c.name)}
                  left={<span>{c.flag} {c.name}</span>}
                />
              ))}
            </Panel>
          )}
        </Step>

        {/* ── 2. City ── */}
        {region && (
          <Step n="2" title="City" done={hasCity}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={cityDraft}
                onChange={(e) => setCityDraft(e.target.value)}
                onBlur={saveCity}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveCity(); } }}
                placeholder={`e.g. ${exampleCity(region.countryCode)}`}
                aria-label="City"
                style={{
                  flex: 1, height: 50, borderRadius: 14, border: 'none', outline: 'none',
                  background: DS.card, padding: '0 15px', minWidth: 0,
                  fontFamily: DS.font, fontSize: 15, color: DS.ink,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
                }}
              />
              {cityDraft.trim() && cityDraft.trim() !== region.city && (
                <button
                  type="button"
                  onClick={saveCity}
                  style={{
                    flexShrink: 0, height: 50, padding: '0 16px', borderRadius: 14, border: 'none',
                    background: DS.ink, color: DS.card, cursor: 'pointer',
                    fontFamily: DS.font, fontSize: 14, fontWeight: 700,
                  }}
                >
                  Save
                </button>
              )}
            </div>
            <p style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.5, margin: '7px 2px 0' }}>
              Optional. We use it to label your results and to tell other shoppers near you what's
              been spotted — never to locate you.
            </p>
          </Step>
        )}

        {/* ── 3. Shop ── */}
        {region && (
          <Step n="3" title="Shop" done={!!retailer}>
            <Row
              onClick={() => setShopOpen((v) => !v)}
              expanded={shopOpen}
              icon={<Store style={{ width: 18, height: 18, color: DS.muted }} />}
              title={retailer ? retailer.name : 'Choose a shop'}
              subtitle={
                <>
                  <MapPin style={{ width: 10, height: 10, display: 'inline', marginRight: 3 }} />
                  {region.city ? `${region.city}, ` : ''}{region.country}
                </>
              }
            />
            {shopOpen && (
              <Panel>
                {chains.length === 0 ? (
                  <p style={{ fontSize: 12.5, color: DS.muted, padding: 16, margin: 0, lineHeight: 1.55 }}>
                    We don't have chains listed for {region.country} yet. Searching still works — you
                    just won't get shop-specific availability.
                  </p>
                ) : chains.map((r, i) => (
                  <PanelButton
                    key={r.id}
                    first={i === 0}
                    selected={retailer?.id === r.id}
                    onClick={() => pickChain(r)}
                    left={<span>{r.name}</span>}
                    right={<span style={{ fontSize: 10.5, color: DS.muted, textTransform: 'capitalize' }}>{r.kind}</span>}
                  />
                ))}
              </Panel>
            )}
          </Step>
        )}

        {/* ── 4. Product ── */}
        {region && retailer && (
          <Step n="4" title="What are you after?" done={false}>
            <form onSubmit={(e) => { e.preventDefault(); void run(query); }} style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, background: DS.card, borderRadius: 14, padding: '0 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                <Search style={{ width: 16, height: 16, color: DS.muted, flexShrink: 0 }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="oat milk, peanut butter, chocolate…"
                  aria-label="What are you looking for?"
                  style={{
                    flex: 1, height: 50, border: 'none', outline: 'none', background: 'transparent',
                    fontFamily: DS.font, fontSize: 15, color: DS.ink, minWidth: 0,
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!query.trim() || loading}
                style={{
                  flexShrink: 0, height: 50, padding: '0 18px', borderRadius: 14, border: 'none',
                  background: DS.ink, color: DS.card, fontFamily: DS.font, fontSize: 14, fontWeight: 700,
                  cursor: !query.trim() || loading ? 'default' : 'pointer',
                  opacity: !query.trim() || loading ? 0.5 : 1,
                }}
              >
                {loading ? <Loader2 style={{ width: 16, height: 16, animation: 'gs-spin 1s linear infinite' }} /> : 'Find'}
              </button>
            </form>

            {!result && !loading && (
              <>
                <p style={{ fontSize: 11.5, color: DS.muted, margin: '10px 2px 8px' }}>
                  Search anything. These categories are the ones we hand-check:
                </p>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {POPULAR_CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => { setQuery(c.label); void run(c.label); }}
                      style={{
                        background: DS.card, border: `1px solid ${DS.hair}`, borderRadius: 999,
                        padding: '7px 13px', cursor: 'pointer', fontFamily: DS.font,
                        fontSize: 12.5, fontWeight: 600, color: DS.ink,
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </Step>
        )}

        {/* ── Results ── */}
        {loading && (
          <p style={{ fontSize: 13, color: DS.muted, textAlign: 'center', padding: '24px 0' }}>
            Checking what {retailer?.name} is likely to carry…
          </p>
        )}

        {result && !loading && (
          <section style={{ marginTop: 6 }}>
            {result.empty ? (
              <div style={{ background: DS.card, borderRadius: 16, padding: 18, textAlign: 'center' }}>
                <p style={{ fontSize: 14.5, fontWeight: 700, color: DS.ink, margin: '0 0 5px' }}>
                  Nothing found for “{result.query}”
                </p>
                <p style={{ fontSize: 12.5, color: DS.muted, lineHeight: 1.55, margin: 0 }}>
                  Try a simpler word — “milk” rather than “Oatly Barista 1L”. That's a gap in the
                  product database, not a verdict on the aisle.
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 12.5, color: DS.muted, margin: '0 0 10px', lineHeight: 1.5 }}>
                  {result.picks.length} {result.picks.length === 1 ? 'pick' : 'picks'} for{' '}
                  <strong style={{ color: DS.ink }}>{result.retailer.name}</strong>
                  {region?.city ? ` in ${region.city}` : ''}, best-evidenced availability first.
                  {result.source === 'search' && (
                    <>
                      {' '}These come from a product search, not our hand-checked list —
                      scored on the data we hold.
                    </>
                  )}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.picks.map((p) => (
                    <ShelfPickCard
                      key={p.key}
                      pick={p}
                      retailer={result.retailer}
                      countryCode={region?.countryCode ?? null}
                      city={region?.city ?? null}
                    />
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop: 16 }}>
              <RetailerDisclaimer retailer={result.retailer} />
            </div>
          </section>
        )}
      </main>

      <style>{`@keyframes gs-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Small building blocks ────────────────────────────────────────────────────

function Step({ n, title, done, children }: { n: string; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '0 2px 8px' }}>
        <span
          style={{
            width: 18, height: 18, borderRadius: 999, flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: done ? DS.good : DS.hair, color: done ? '#fff' : DS.muted,
            fontSize: 10, fontWeight: 800,
          }}
        >
          {done ? <Check style={{ width: 10, height: 10 }} strokeWidth={4} /> : n}
        </span>
        <span style={{ fontSize: 11, fontWeight: 800, color: DS.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {title}
        </span>
      </div>
      {children}
    </section>
  );
}

function Row({ onClick, expanded, icon, title, subtitle }: {
  onClick: () => void; expanded: boolean; icon: React.ReactNode;
  title: string; subtitle?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 11,
        background: DS.card, border: 'none', borderRadius: 16, padding: '14px 16px',
        cursor: 'pointer', fontFamily: DS.font, textAlign: 'left',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
      }}
    >
      <span style={{ flexShrink: 0, display: 'inline-flex' }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: DS.ink }}>{title}</span>
        {subtitle && (
          <span style={{ display: 'block', fontSize: 11.5, color: DS.muted, marginTop: 1 }}>{subtitle}</span>
        )}
      </span>
      <ChevronDown style={{ width: 16, height: 16, color: DS.muted, flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }} />
    </button>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: 8, background: DS.card, borderRadius: 16, overflow: 'hidden',
      maxHeight: 320, overflowY: 'auto',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
    }}>
      {children}
    </div>
  );
}

function PanelButton({ first, selected, onClick, left, right }: {
  first: boolean; selected: boolean; onClick: () => void;
  left: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, padding: '12px 16px', cursor: 'pointer', textAlign: 'left',
        background: selected ? DS.goodBg : 'transparent',
        border: 'none', borderTop: first ? 'none' : `1px solid ${DS.hair}`,
        fontFamily: DS.font, fontSize: 14, fontWeight: 600, color: DS.ink,
      }}
    >
      {left}
      {right}
    </button>
  );
}

/** A recognisable city so the placeholder reads as an example, not a demand. */
function exampleCity(code: string): string {
  const map: Record<string, string> = {
    GB: 'London', US: 'Chicago', ID: 'Denpasar', FR: 'Lyon', DE: 'Hamburg',
    NL: 'Utrecht', ES: 'Seville', IT: 'Bologna', AU: 'Melbourne', CA: 'Toronto',
    IE: 'Cork', NZ: 'Wellington', BE: 'Ghent', CH: 'Bern', AT: 'Graz',
    PT: 'Porto', SE: 'Malmö', NO: 'Bergen', DK: 'Aarhus', FI: 'Tampere', PL: 'Kraków',
  };
  return map[code] ?? 'your city';
}
