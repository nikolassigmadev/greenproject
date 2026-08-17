# Research scripts

Offline analysis. **Not app code, and not in the bundle.**

- `tsconfig.app.json` includes only `src`, so nothing here is type-checked into
  the build.
- `vitest.config.ts` matches only `src/**/*.{test,spec}.{ts,tsx}`, so nothing
  here runs in the suite.
- Large downloads and generated fixtures are gitignored; the scripts and their
  written-up findings are not.

These exist to answer questions *before* feature code gets written, so a design
isn't built on an assumption about someone else's dataset. They are Python
because DuckDB makes columnar analysis over a 7.7 GB remote Parquet file a
one-liner, and none of this ever ships to a user.

## off-coverage

Measures how much location data Open Food Facts actually has, which decides the
shape of the supply-chain map (see `docs/SUPPLY_CHAIN_INVARIANTS.md`).

```bash
pip install duckdb
python3 scripts/research/off-coverage/coverage.py --limit 50000   # iterate
python3 scripts/research/off-coverage/coverage.py --full          # quotable
```

Writes `docs/supply-chain-data-coverage.md` and
`scripts/research/off-coverage/top-ingredients.json`.

**`--limit` output is not quotable.** `LIMIT n` reads the first n rows in file
order, and Open Food Facts began in France, so the head of the file is
overwhelmingly French — a 50k head sample returned 2,971 French products and
zero Indonesian ones. Only `--full` numbers go in a document.
