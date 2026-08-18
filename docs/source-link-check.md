# Brand-flag source link check

**Checked:** 2026-08-17
**Scope:** every `FlagSource.url` in `src/data/brandFlags.v2.ts`

We publish forced-labour and child-labour findings against named companies
(Nestlé, Lindt, Mitr Phol, Central Romana and others). The rule this file
exists to enforce is simple: **a flag ships only if a reader who doubts it can
click through and check it.** A citation that 404s is worse than no citation,
because it implies there was something to find.

## Headline numbers

| Result | Count |
| --- | --- |
| URLs in `brandFlags.v2.ts` | 49 |
| Unique URLs after dedupe | 34 |
| Generated per-company URLs (`bhrrcProfile()`) | 6 |
| **Confirmed live (HTTP 200)** | **34** |
| Blocked to automated checking | 6 |
| Dead / wrong | 0 |
| Empty (`""`) | 0 |

An April 2026 completion report used to claim every URL was `""`. That was true
when written and stopped being true when Phase 2 populated them — but the doc
was never updated, and it got read back to us twice as the project's single
biggest launch risk. It has since been deleted (it survives in git history), and
this file is the replacement: the measurement rather than the assertion.

## Blocked to automated checking — NOT verified, and not claimed to be

These six returned `403 Forbidden` or timed out to both `curl` and an automated
fetcher. That is bot mitigation (WAF / paywall edge), not evidence the page is
missing — but this project's standard is a checked link, not a confident
memory, so they are recorded as **unverified** rather than folded into the
green number above.

| Status | URL |
| --- | --- |
| 403 | `dol.gov/agencies/ilab/reports/child-labor/list-of-goods` |
| 403 | `dol.gov/newsroom/releases/whd/whd20230217-1` |
| 403 | `nytimes.com/2021/02/14/world/asia/india-sugar-eli-lilly.html` |
| 403 | `nytimes.com/2023/09/23/us/politics/child-labor-tyson-perdue.html` |
| 403 | `oecdwatch.org/complaint/somo-vs-illycaffe-s-p-a/` |
| 000 | `washingtonpost.com/graphics/2019/business/hershey-nestle-mars-chocolate-child-labor-west-africa/` |

**These need one human pass in a real browser before launch.** If any is dead,
the rule is that the flag depending on it flips to `pending_review` and stops
rendering — not that we find a different link to justify a conclusion we
already published.

Note the two `dol.gov` entries returned 200 earlier the same day through a
different fetcher while building `src/data/supplyChain/sources.ts`. Same URL,
same day, two different answers, purely from how the request was made. That is
the reason this file separates "confirmed" from "could not check" instead of
collapsing both into a pass.

## Generated URLs

`bhrrcProfile(slug, company)` builds a Business & Human Rights Resource Centre
dossier URL per company rather than pointing six flags at the BHRRC homepage. A
naive scrape of the source text sees only the template
(`.../companies/${slug}/`) and reports a 404 — a false alarm worth knowing
about if you re-run this. The evaluated URLs were checked individually:

`chiquita`, `dole`, `fresh-del-monte-produce`, `godiva`, `starbucks`,
`tata-group` — all 200.

## Reproducing

```sh
grep -oh "https://[^']*" src/data/brandFlags.v2.ts | sort -u | while read -r u; do
  printf '%s  %s\n' \
    "$(curl -s -o /dev/null -w '%{http_code}' -L --max-time 25 \
        -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' "$u")" "$u"
done
```

Run the `bhrrcProfile` slugs separately; the template is not a URL.
