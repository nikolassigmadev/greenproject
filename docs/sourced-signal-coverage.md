# Sourced signal coverage (Phase 0)

**Measured 2026-08-18 — 300 live Open Food Facts
products across 20 categories.**

A product counts as covered if **at least one** signal fires that is backed by a
citable source. An eco grade or a Nutri-Score is not a sourced signal and does
not count here.

## The number

| Metric | Value |
| --- | --- |
| **Products with ≥1 sourced signal** | **198 / 300 — 66.0%** |
| Covered by brand research alone | 99 — 33.0% |
| Lift from the commodity/ingredient layer | +33.0 points |
| Products rescued ONLY by the parent map | 0 — 0.0% |

The second and third rows are the important ones. Brand-by-brand research alone
covers 33.0% of what people actually scan. The commodity and
ingredient layer — which needs no per-brand research at all — more than
2.0×s that, and it does so with
statements about goods rather than accusations about companies.

## Which signal is doing the work

| Signal | Products hit | Share |
| --- | --- | --- |
| commodity | 162 | 54.0% |
| labour | 92 | 30.7% |
| brandFlag | 90 | 30.0% |
| parent | 71 | 23.7% |
| ingredient | 59 | 19.7% |
| boycott | 50 | 16.7% |
| chocolate | 40 | 13.3% |
| animalWelfare | 9 | 3.0% |

## By category — where to spend the next four days

| Category | Sampled | Covered | Coverage |
| --- | --- | --- | --- |
| chocolates | 15 | 15 | 100% |
| coffees | 15 | 15 | 100% |
| teas | 15 | 15 | 100% |
| rices | 15 | 15 | 100% |
| sodas | 15 | 14 | 93% |
| ice-creams | 15 | 14 | 93% |
| breakfast-cereals | 15 | 13 | 87% |
| snacks | 15 | 13 | 87% |
| breads | 15 | 13 | 87% |
| biscuits | 15 | 12 | 80% |
| crisps | 15 | 12 | 80% |
| spreads | 15 | 8 | 53% |
| sauces | 15 | 7 | 47% |
| pastas | 15 | 6 | 40% |
| waters | 15 | 6 | 40% |
| candies | 15 | 6 | 40% |
| yogurts | 15 | 4 | 27% |
| juices | 15 | 4 | 27% |
| cheeses | 15 | 3 | 20% |
| canned-fish | 15 | 3 | 20% |

Work strictly down this table. The categories at the bottom are where research
buys coverage; the ones at the top are already done and further work there buys
nothing.

## Uncovered products (first 40)

- breakfast-cereals | BJORG | Flocons d'avoine
- breakfast-cereals | Weetabix | Original
- biscuits | Gerblé | Figue & son
- biscuits | Gerblé | Biscuit raisins
- biscuits | Henry's | Henry’s
- snacks | Ekibio, Le pain des Fleurs | Tartines craquantes au sarrasin imp
- snacks | Gerblé | Figue & son
- sodas | Oasis | 33CL CAN SLIM TROPICAL
- yogurts | Jaouda | 
- yogurts | Jaouda | Le nature
- yogurts | jaouda | jaouda Cremy
- yogurts | Jaouda | كيفير
- yogurts | Maître Fromager, gastro mixte | Goldium Blanc Nature
- yogurts | Jaouda | Yaourt Grec Muesli
- yogurts | Reina | kéfir 500g
- yogurts | Jaouda | رايبي جودة
- yogurts | Jaouda | غلال القمح
- yogurts | Tendre, jouda | Tendre nature
- yogurts | ? | delicemo
- breads | KRISPROLLS | KRISPROLLS Complets
- breads | Maître Jean Pierre | pain de mie grandes tranches spécial sandwich complet
- pastas | Lustucru | Lustucru gnocchi a poêler 520g
- pastas | Barilla | Whole Wheat Penne Rigate
- pastas | indomie | Nouilles Instantanées Goût Boeuf
- pastas | yum yum | Yum Yum Chicken Flavour
- pastas | Barilla | Penne Rigate No. 73 Durum Wheat Semolina Pasta
- pastas | Barilla | Lasagne all'uovo
- pastas | BARILLA COLLEZIONE, Barilla | Fusilli
- pastas | Giovanni Rana | Ricotta & Épinards
- pastas | Lustucru, Lustucru selection | Gnocchi aux pommes de terre
- sauces | Maille | Maille Moutarde Fine de Dijon L'Originale Bocal 360g
- sauces | Star | Ketchup star 310 g
- sauces | Solis | sauce tomate cuisinée
- sauces | Star | 
- sauces | sos | 611251753912
- sauces | Olla | Olla
- sauces | Star | Sauce algérienne
- sauces | Star | Mayonnaise
- cheeses | Milky Food Professional | Fromage Blanc Nature
- cheeses | Jaouda | Jben

## Honest limits of this measurement

**The corpus is a live API sample, not a dump.** Open Food Facts publishes full
exports under ODbL, and a dump would be the better corpus — but it is 7.7 GB and
ordered France-first, so a naive read of the head returns a French sample and a
confidently wrong number. If you want dump-based figures, stream it with column
pruning (`scripts/research/off-coverage/coverage.py` already does this) rather
than `LIMIT`-ing it.

**Scan frequency is not weighted.** Every product counts once. Real coverage
should be weighted by what people actually scan — once `ai_scans` has beta
traffic, that distribution replaces this one and the number will move, probably
upward, because people scan branded goods more than obscure ones.

**Coverage is not correctness.** This counts whether a signal fires, not whether
it is right. The contradiction hunt in `verdictPageAudit.test.ts` is the other
half, and neither substitutes for the other.

## Launch threshold

Set the bar before reading the number, or you will rationalise whatever you got:

- **≥60% of scanned products showing a sourced signal** — a judgement call about
  whether the app is useful enough to ship.
- **100% of high/critical flags carrying a live tier-1 or tier-2 URL** — not a
  judgement call. See [source-link-check.md](source-link-check.md).
