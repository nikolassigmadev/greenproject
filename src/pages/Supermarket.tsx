// "I'm in this shop. What should I buy?"
//
// Setup is country -> city -> shop, asked in that order and then got out of the
// way: once all three are answered they fold into a single line you can tap to
// change. The three-card stack was most of the screen, and it was permanent
// furniture for something you answer once and then want to forget.
//
// The whole page is built around one constraint: we do not know what is on the
// shelf. Nobody does, without a retailer partnership. So it promises "usually
// stocked here" and never "in stock", and every availability claim carries a
// "how do we know?" naming its source. Legal notes live in RetailerDisclaimer
// and render with the results rather than being buried in settings.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Store, MapPin, ChevronDown, Loader2, Check, Globe, SlidersHorizontal } from 'lucide-react';
import { DS } from '@/styles/design-tokens';
import { BackButton } from '@/components/BackButton';
import { Collapse } from '@/components/Collapse';
import { ShelfPickCard } from '@/components/ShelfPickCard';
import { RetailerDisclaimer } from '@/components/RetailerDisclaimer';
import { getRetailersForCountry, type Retailer } from '@/data/retailers';
import { isFullCoverageMarket } from '@/data/ethicalAlternatives';
import { loadRetailer, saveRetailer, RETAILER_EVENT } from '@/utils/selectedRetailer';
import { COUNTRIES, loadRegion, saveRegion, REGION_EVENT, type UserRegion } from '@/utils/userRegion';
import { loadPriorities, PRIORITIES_EVENT } from '@/utils/userPreferences';
import {
  searchShelf, POPULAR_CATEGORIES, activePriorityLabels, type ShelfResult,
} from '@/services/supermarket';

type OpenStep = 'country' | 'city' | 'shop' | null;

export default function Supermarket() {
  const [region, setRegion] = useState<UserRegion | null>(() => loadRegion());
  const [retailer, setRetailer] = useState<Retailer | null>(() => loadRetailer(loadRegion()?.countryCode));
  const [priorities, setPriorities] = useState(() => loadPriorities());
  const [cityDraft, setCityDraft] = useState(() => loadRegion()?.city ?? '');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ShelfResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Which step is expanded. Only ever one, so the setup can't grow back into a
  // wall. Starts on the first unanswered step.
  const [openStep, setOpenStep] = useState<OpenStep>(() => {
    const r = loadRegion();
    if (!r) return 'country';
    if (!loadRetailer(r.countryCode)) return 'shop';
    return null;
  });
  const [setupOpen, setSetupOpen] = useState(() => !loadRetailer(loadRegion()?.countryCode));

  useEffect(() => {
    document.title = 'Shop ethically — GoodScan';
    return () => { document.title = 'GoodScan'; };
  }, []);

  useEffect(() => {
    const sync = () => {
      const r = loadRegion();
      setRegion(r);
      setRetailer(loadRetailer(r?.countryCode));
      setPriorities(loadPriorities());
    };
    window.addEventListener(REGION_EVENT, sync);
    window.addEventListener(RETAILER_EVENT, sync);
    window.addEventListener(PRIORITIES_EVENT, sync);
    return () => {
      window.removeEventListener(REGION_EVENT, sync);
      window.removeEventListener(RETAILER_EVENT, sync);
      window.removeEventListener(PRIORITIES_EVENT, sync);
    };
  }, []);

  const chains = useMemo(() => getRetailersForCountry(region?.countryCode), [region?.countryCode]);
  const ready = !!region && !!retailer;
  const priorityLabels = useMemo(() => activePriorityLabels(priorities), [priorities]);

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
    // Changing country invalidates both city and shop — a Tesco in Indonesia is
    // not a shop anyone can walk into.
    saveRegion({ countryCode: code, country: name });
    setRegion(loadRegion());
    setRetailer(null);
    setCityDraft('');
    setResult(null);
    setOpenStep('city');   // walk them forward rather than closing on them
  };

  const saveCity = () => {
    if (!region) return;
    saveRegion({ countryCode: region.countryCode, country: region.country, city: cityDraft.trim() });
    setRegion(loadRegion());
    setOpenStep('shop');
  };

  const pickChain = (r: Retailer) => {
    saveRetailer(r.id);
    setRetailer(r);
    setResult(null);
    setOpenStep(null);
    setSetupOpen(false);   // setup is done — fold it away
    if (query.trim()) void run(query, r);
  };

  const toggle = (step: OpenStep) => setOpenStep((cur) => (cur === step ? null : step));

  return (
    <div style={{ minHeight: '100dvh', background: DS.bg, fontFamily: DS.font, color: DS.ink }}>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: 'max(56px, calc(env(safe-area-inset-top,0px) + 16px)) 16px 140px' }}>
        <div style={{ marginBottom: 14 }}><BackButton /></div>

        <header style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: DS.muted, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
            In the shop
          </p>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 8px' }}>
            What should I buy here?
          </h1>
          <p style={{ fontSize: 13.5, color: DS.muted, lineHeight: 1.5, margin: 0 }}>
            Search anything — we'll rank what's cleanest for the things you care about, and explain
            why in plain English.
          </p>
        </header>

        {/* ── Setup: one line when done, three steps when not ── */}
        {ready && (
          <button
            type="button"
            onClick={() => setSetupOpen((v) => !v)}
            aria-expanded={setupOpen}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              background: DS.card, border: 'none', borderRadius: 14,
              padding: '11px 14px', marginBottom: setupOpen ? 10 : 14,
              cursor: 'pointer', fontFamily: DS.font, textAlign: 'left',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
            }}
          >
            <Store style={{ width: 15, height: 15, color: DS.muted, flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: DS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {retailer!.name}
              <span style={{ fontWeight: 500, color: DS.muted }}>
                {' · '}{region!.city ? `${region!.city}, ` : ''}{region!.country}
              </span>
            </span>
            <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 700, color: DS.muted }}>
              {setupOpen ? 'Done' : 'Change'}
            </span>
            <ChevronDown style={{ width: 15, height: 15, color: DS.muted, flexShrink: 0, transform: setupOpen ? 'rotate(180deg)' : 'none', transition: 'transform .26s cubic-bezier(0.4,0,0.2,1)' }} />
          </button>
        )}

        <Collapse open={!ready || setupOpen}>
          <div style={{ paddingBottom: 4 }}>
            {/* 1. Country */}
            <Step n="1" title="Country" done={!!region}>
              <Row
                onClick={() => toggle('country')}
                expanded={openStep === 'country'}
                icon={<Globe style={{ width: 18, height: 18, color: DS.muted }} />}
                title={region ? `${flagFor(region.countryCode)} ${region.country}` : 'Choose your country'}
                subtitle={region ? undefined : 'Sets which shops and products we show'}
              />
              <Collapse open={openStep === 'country'}>
                <Panel>
                  {/* Researched markets first, and every row says which it is.
                      Offering 21 countries while only two have real local data
                      is a promise we can't keep silently. */}
                  {[...COUNTRIES]
                    .sort((a, b) =>
                      Number(isFullCoverageMarket(b.code)) - Number(isFullCoverageMarket(a.code)),
                    )
                    .map((c, i) => {
                      const full = isFullCoverageMarket(c.code);
                      return (
                        <PanelButton
                          key={c.code}
                          first={i === 0}
                          selected={region?.countryCode === c.code}
                          onClick={() => pickCountry(c.code, c.name)}
                          left={<span>{c.flag} {c.name}</span>}
                          right={
                            <span
                              style={{
                                fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                                color: full ? DS.good : DS.muted,
                                background: full ? DS.goodBg : 'transparent',
                                border: full ? 'none' : `1px dashed ${DS.hair}`,
                                borderRadius: 999, padding: '3px 8px',
                              }}
                            >
                              {full ? 'Full coverage' : 'Limited data'}
                            </span>
                          }
                        />
                      );
                    })}
                </Panel>
              </Collapse>
            </Step>

            {/* 2. City */}
            <Collapse open={!!region}>
              {region && (
                <Step n="2" title="City" done={!!region.city}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={cityDraft}
                      onChange={(e) => setCityDraft(e.target.value)}
                      onBlur={saveCity}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveCity(); } }}
                      placeholder={`e.g. ${exampleCity(region.countryCode)}`}
                      aria-label="City"
                      style={{
                        flex: 1, height: 48, borderRadius: 14, border: 'none', outline: 'none',
                        background: DS.card, padding: '0 15px', minWidth: 0,
                        fontFamily: DS.font, fontSize: 15, color: DS.ink,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={saveCity}
                      style={{
                        flexShrink: 0, height: 48, padding: '0 16px', borderRadius: 14, border: 'none',
                        background: cityDraft.trim() && cityDraft.trim() !== region.city ? DS.ink : DS.hair,
                        color: cityDraft.trim() && cityDraft.trim() !== region.city ? DS.card : DS.muted,
                        cursor: 'pointer', fontFamily: DS.font, fontSize: 13.5, fontWeight: 700,
                        transition: 'background .2s ease, color .2s ease',
                      }}
                    >
                      {region.city && cityDraft.trim() === region.city ? 'Saved' : 'Save'}
                    </button>
                  </div>
                  <p style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.5, margin: '7px 2px 0' }}>
                    Optional — labels your results and helps shoppers near you. Never used to locate you.
                  </p>
                </Step>
              )}
            </Collapse>

            {/* 3. Shop */}
            <Collapse open={!!region}>
              {region && (
                <Step n="3" title="Shop" done={!!retailer}>
                  <Row
                    onClick={() => toggle('shop')}
                    expanded={openStep === 'shop'}
                    icon={<Store style={{ width: 18, height: 18, color: DS.muted }} />}
                    title={retailer ? retailer.name : 'Choose a shop'}
                    subtitle={retailer ? undefined : `${chains.length} chains in ${region.country}`}
                  />
                  <Collapse open={openStep === 'shop'}>
                    <Panel>
                      {chains.length === 0 ? (
                        <p style={{ fontSize: 12.5, color: DS.muted, padding: 16, margin: 0, lineHeight: 1.55 }}>
                          We don't have chains listed for {region.country} yet. Searching still works —
                          you just won't get shop-specific availability.
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
                  </Collapse>
                </Step>
              )}
            </Collapse>
          </div>
        </Collapse>

        {/* ── Search ── */}
        <Collapse open={ready}>
          {ready && (
            <div style={{ paddingTop: 2 }}>
              <form onSubmit={(e) => { e.preventDefault(); void run(query); }} style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, background: DS.card, borderRadius: 14, padding: '0 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                  <Search style={{ width: 16, height: 16, color: DS.muted, flexShrink: 0 }} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="oat milk, peanut butter, noodles…"
                    aria-label="What are you looking for?"
                    style={{
                      flex: 1, height: 52, border: 'none', outline: 'none', background: 'transparent',
                      fontFamily: DS.font, fontSize: 15.5, color: DS.ink, minWidth: 0,
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!query.trim() || loading}
                  style={{
                    flexShrink: 0, height: 52, padding: '0 20px', borderRadius: 14, border: 'none',
                    background: DS.ink, color: DS.card, fontFamily: DS.font, fontSize: 14.5, fontWeight: 700,
                    cursor: !query.trim() || loading ? 'default' : 'pointer',
                    opacity: !query.trim() || loading ? 0.45 : 1,
                    transition: 'opacity .2s ease',
                  }}
                >
                  {loading ? <Loader2 style={{ width: 16, height: 16, animation: 'gs-spin 1s linear infinite' }} /> : 'Find'}
                </button>
              </form>

              {/* What the ranking is actually optimising for. */}
              <Link
                to="/preferences"
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, marginTop: 10,
                  textDecoration: 'none', padding: '2px 2px',
                }}
              >
                <SlidersHorizontal style={{ width: 12, height: 12, color: DS.muted, flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.45 }}>
                  {priorityLabels.length > 0 ? (
                    <>Ranked for <strong style={{ color: DS.ink }}>{priorityLabels.join(' & ')}</strong> — change</>
                  ) : (
                    <>Ranked on balanced priorities — <strong style={{ color: DS.ink }}>set what matters to you</strong></>
                  )}
                </span>
              </Link>

              <Collapse open={!result && !loading}>
                <div style={{ paddingTop: 10 }}>
                  <p style={{ fontSize: 11.5, color: DS.muted, margin: '0 2px 8px' }}>
                    Search anything. These are the categories we hand-check:
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
                </div>
              </Collapse>
            </div>
          )}
        </Collapse>

        {/* ── Results ── */}
        {loading && (
          <p style={{ fontSize: 13, color: DS.muted, textAlign: 'center', padding: '28px 0' }}>
            Checking what {retailer?.name} is likely to carry…
          </p>
        )}

        {result && !loading && (
          <section style={{ marginTop: 18 }}>
            {result.empty ? (
              <div style={{ background: DS.card, borderRadius: 16, padding: 18, textAlign: 'center' }}>
                <p style={{ fontSize: 14.5, fontWeight: 700, color: DS.ink, margin: '0 0 5px' }}>
                  Nothing found for “{result.query}”
                </p>
                <p style={{ fontSize: 12.5, color: DS.muted, lineHeight: 1.55, margin: 0 }}>
                  Try a simpler word — “noodles” rather than “Indomie Mi Goreng 85g”. That's a gap in
                  the product database, not a verdict on the aisle.
                </p>
              </div>
            ) : (
              <>
                {/* The heading only names the shop when something actually
                    ties a result to it. Otherwise it says what these really
                    are — options sold in the country — because "6 picks for
                    Trader Joe's" over brands Trader Joe's doesn't stock is a
                    lie told by a heading, and the heading is what gets read. */}
                {result.hasChainEvidence ? (
                  <p style={{ fontSize: 12.5, color: DS.muted, margin: '0 0 10px', lineHeight: 1.5 }}>
                    {result.picks.length} {result.picks.length === 1 ? 'pick' : 'picks'} for{' '}
                    <strong style={{ color: DS.ink }}>{result.retailer.name}</strong>
                    {region?.city ? ` in ${region.city}` : ''}, best-evidenced availability first.
                    {result.source === 'search' && (
                      <> These come from a product search, not our hand-checked list.</>
                    )}
                  </p>
                ) : (
                  <div style={{
                    border: `1px dashed ${DS.hair}`, borderRadius: 12,
                    padding: '11px 13px', marginBottom: 10,
                  }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: DS.ink, margin: '0 0 4px' }}>
                      We have no {result.retailer.name}-specific data
                    </p>
                    <p style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.55, margin: 0 }}>
                      {result.mostlyOwnBrand ? (
                        <>
                          {result.retailer.name} sells mostly its own brand, and own-brand products
                          are barely covered by the open databases we use. The {result.picks.length}{' '}
                          {result.picks.length === 1 ? 'option' : 'options'} below are cleaner picks
                          sold in {region?.country ?? 'your country'} — treat them as what to look
                          for, not as what's on that shelf.
                        </>
                      ) : (
                        <>
                          Nothing links these to {result.retailer.name} specifically. They're cleaner
                          options sold in {region?.country ?? 'your country'}. If you spot one there,
                          adding it to your cart tells the next shopper.
                        </>
                      )}
                    </p>
                  </div>
                )}
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
    <section style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '0 2px 7px' }}>
        <span
          style={{
            width: 17, height: 17, borderRadius: 999, flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: done ? DS.good : DS.hair, color: done ? '#fff' : DS.muted,
            fontSize: 9.5, fontWeight: 800,
            transition: 'background .25s ease, color .25s ease',
          }}
        >
          {done ? <Check style={{ width: 10, height: 10 }} strokeWidth={4} /> : n}
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: DS.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
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
        background: DS.card, border: 'none', borderRadius: 15, padding: '13px 15px',
        cursor: 'pointer', fontFamily: DS.font, textAlign: 'left',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
      }}
    >
      <span style={{ flexShrink: 0, display: 'inline-flex' }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: DS.ink }}>{title}</span>
        {subtitle && (
          <span style={{ display: 'block', fontSize: 11.5, color: DS.muted, marginTop: 1 }}>{subtitle}</span>
        )}
      </span>
      <ChevronDown style={{ width: 15, height: 15, color: DS.muted, flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .26s cubic-bezier(0.4,0,0.2,1)' }} />
    </button>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: 7, background: DS.card, borderRadius: 15, overflow: 'hidden',
      maxHeight: 300, overflowY: 'auto',
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
        gap: 10, padding: '11px 15px', cursor: 'pointer', textAlign: 'left',
        background: selected ? DS.goodBg : 'transparent',
        border: 'none', borderTop: first ? 'none' : `1px solid ${DS.hair}`,
        fontFamily: DS.font, fontSize: 14, fontWeight: 600, color: DS.ink,
        transition: 'background .15s ease',
      }}
    >
      {left}
      {right}
    </button>
  );
}

function flagFor(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.flag ?? '';
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
