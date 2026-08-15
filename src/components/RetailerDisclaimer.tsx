// The legal footing for naming somebody else's shop.
//
// Four distinct exposures, and they need four distinct answers rather than one
// vague "information may be inaccurate" line:
//
//  1. TRADE MARK / PASSING OFF. Using a retailer's name to say which shop the
//     user is in is nominative fair use — it is the only practical way to
//     identify the shop. What converts that into a problem is implying a
//     relationship. So: name only, never a logo, never their brand colours, and
//     an explicit statement that there is no affiliation.
//
//  2. DEFAMATION / MALICIOUS FALSEHOOD. The genuine risk in this feature. Our
//     ethical flags attach to the company that MAKES a product, with sources.
//     They say nothing about the shop that sells it. "Tesco stocks a product
//     whose manufacturer is flagged" is a sourced fact about a manufacturer;
//     "Tesco is unethical" is an unsourced claim about a retailer and is what
//     gets a letter. The code enforces this — retailers carry no score, no
//     verdict and no flag — and this notice states it in the open.
//
//  3. MISLEADING THE CONSUMER. Claiming stock we cannot know about would be a
//     false statement capable of affecting a purchasing decision. Hence: no
//     stock claims anywhere, and each availability badge explains its own
//     provenance.
//
//  4. DATABASE RIGHTS / LICENCE. Product data is Open Food Facts under ODbL,
//     which requires attribution. We do not scrape retailer sites, which is
//     what would engage their terms of use and, in the UK/EU, the sui generis
//     database right.

import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { DS } from '@/styles/design-tokens';
import type { Retailer } from '@/data/retailers';
import { OFF_ATTRIBUTION } from '@/services/supermarket';

export function RetailerDisclaimer({ retailer }: { retailer: Retailer }) {
  return (
    <div
      style={{
        border: `1px solid ${DS.hair}`, borderRadius: 14,
        background: 'transparent', padding: '13px 15px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
        <Scale style={{ width: 13, height: 13, color: DS.muted }} />
        <span style={{ fontSize: 11.5, fontWeight: 800, color: DS.ink }}>
          What this page is and isn't
        </span>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Point>
          <strong style={{ color: DS.ink2 }}>We are not affiliated with {retailer.name}.</strong>{' '}
          We name the chain only so you can tell us which shop you're standing in. No partnership,
          sponsorship or endorsement is implied in either direction.
        </Point>
        <Point>
          <strong style={{ color: DS.ink2 }}>This is not stock information.</strong>{' '}
          No shop publishes live inventory we can lawfully use. Everything here is "this chain
          usually carries this", drawn from Open Food Facts entries and other shoppers. Tap
          "How do you know?" on any result to see exactly where that came from.
        </Point>
        <Point>
          <strong style={{ color: DS.ink2 }}>Our flags are about manufacturers, never retailers.</strong>{' '}
          Where we report an ethical concern, it concerns the company that makes the product and is
          backed by the sources on our{' '}
          <Link to="/methodology" style={{ color: DS.ink, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 2 }}>
            methodology page
          </Link>
          . We make no claim about {retailer.name}'s own conduct, buying standards or ethics.
        </Point>
        <Point>
          <strong style={{ color: DS.ink2 }}>Comparisons name their baseline.</strong>{' '}
          Impact figures compare a product against the average for its category, with the sample
          size and date shown. Carbon numbers are Agribalyse life-cycle estimates for a type of
          product, not measurements of an individual item.
        </Point>
        <Point>{OFF_ATTRIBUTION}</Point>
      </ul>

      <p style={{ fontSize: 10.5, color: DS.muted, lineHeight: 1.5, margin: '9px 0 0' }}>
        Shop names are the trade marks of their respective owners, used here descriptively to
        identify the retailer. Spotted something wrong?{' '}
        <a href="mailto:contact@goodscan.shop" style={{ color: DS.ink, fontWeight: 600 }}>
          Tell us
        </a>{' '}
        and we'll correct or remove it.
      </p>
    </div>
  );
}

function Point({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
      <span aria-hidden="true" style={{ flexShrink: 0, marginTop: 6, width: 4, height: 4, borderRadius: 999, background: DS.muted }} />
      <span style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.55 }}>{children}</span>
    </li>
  );
}
