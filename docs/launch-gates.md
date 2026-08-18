# Launch gates

Things that block shipping and **cannot be fixed by committing code**. Each one
is a console setting, a form, or a human check. They're collected here because
every one of them is the kind of item that gets discovered the morning of
submission and costs a day.

Status legend: `[ ]` not done · `[x]` done · `[?]` needs a human to confirm

---

## 1. EU Digital Services Act — trader status

`[ ]` **Declare non-trader in App Store Connect and Google Play.**

Since Feb 2025 both stores block submission to EU territories until trader
status is declared. GoodScan is free with no in-app purchases and no ads, so
"non-trader" is the correct declaration.

- App Store Connect → App Information → **Trader Status**
- Play Console → Policy → **App content** → Trader status

If this is ever wrong-way-round (declaring non-trader while taking money), the
app is removed from EU storefronts, so revisit it the day any monetisation
lands.

## 2. OpenAI hard spend cap

`[ ]` **Set a monthly budget limit in the OpenAI dashboard.**

Billing → Limits → set both a *soft* (email alert) and a **hard** monthly cap.

`OPENAI_DAILY_CALL_BUDGET` and `OPENAI_DAILY_CALLS_PER_USER` are now enforced in
`server.js`, and they are real protection — but their counters live in memory.
A crash-loop resets them, and two instances behind a load balancer each get
their own budget. The dashboard cap is the only ceiling a restart cannot
defeat. Do not treat the code as a substitute for it.

## 3. Privacy declarations must match the policy

`[ ]` **App Store Connect → App Privacy**
`[ ]` **Play Console → Data safety**

These are cross-checked against `src/pages/Privacy.tsx` and against
`ios/App/App/PrivacyInfo.xcprivacy`. All three have to agree. Do **not** tick
"no data collected" — the policy admits to retaining a downscaled copy of every
scan photo plus a persistent random device ID.

Declare, all marked **linked to the user** (the random device ID is a persistent
handle, and we tell users to email it to us for erasure — which is an admission
the data is linked to it):

| Category | Apple type | Purpose |
| --- | --- | --- |
| User Content | Photos or Videos | App Functionality, Analytics |
| Identifiers | Device ID | App Functionality, Analytics |
| Usage Data | Product Interaction | App Functionality, Analytics |
| Other | Other Data Types (priorities, region) | App Functionality, Product Personalization |

Tracking: **No.** No ad SDK, no third-party analytics, no cross-app tracking.

Play's Data Safety form additionally asks whether data is *encrypted in
transit* (yes, HTTPS) and whether users can *request deletion* (yes — see below).

## 4. Data deletion path

`[x]` Implemented — `Privacy.tsx` → "Turning It Off, and Deleting What We Hold".
Users copy their device ID from Settings → Anonymous scan data and email
`contact@goodscan.shop`. Erasure is keyed on `anon_id`, which is indexed in the
`scans` table.

`[?]` **Confirm `contact@goodscan.shop` is actually monitored.** A deletion path
that reaches an unread mailbox is worse than none — it's a published promise
with nothing behind it, and it's the first thing a regulator tests.

## 5. Six citations need a human browser check

`[ ]` See [`source-link-check.md`](source-link-check.md).

Four of the six (dol.gov ×2, NYT ×2) plus OECD Watch and the Washington Post
cocoa investigation return 403/timeout to automated checking — WAF behaviour,
not proof they're dead. They back published forced-labour and child-labour
findings against named companies, so they need one pass in a real browser.

If any is genuinely dead, the flag depending on it flips to `pending_review` and
stops rendering. Do not go looking for a replacement link that supports a
conclusion we already published.

## 6. Server environment

`[ ]` **`ADMIN_PASSWORD_HASH` set in production.** There is deliberately no
fallback: unset means every `/api/admin/*` route returns 503 and login is
impossible. The server prints `Admin Configured: NO` at boot — check the logs
after deploy. Generate with `./scripts/make-admin-hash.sh`.

`[ ]` **`DATABASE_URL` set in production.** Postgres is where scan records
survive. See gate 7.

After deploying, confirm it in one request — no shell access needed:

```sh
curl -s https://goodscan.shop/api/health
```

```json
{ "openaiConfigured": true, "databaseUrlConfigured": true,
  "scanLoggingPostgres": true, "scanLoggingSqlite": true,
  "adminConfigured": true }
```

`scanLoggingPostgres: false` means scans are returning 200 and writing nothing
to Supabase. If `databaseUrlConfigured` is also false the variable never
reached the process; if it's true, the connection itself is failing and the
boot log has the reason.

`[?]` **Confirm the old OpenAI key is revoked.** A key was committed to git
history on a public remote; rotation was recommended 2026-07-02 and has not
been confirmed. Rotating the Supabase password was recommended at the same
time. Git history is public — the old key is still readable in it forever, so
revocation is the only fix.

## 7. Storage durability

`[ ]` **Confirm whether the Hostinger filesystem survives restarts and
redeploys.**

Everything with real user consequences is now mirrored to Postgres
(`DATABASE_URL`), so this gate is much less sharp than it was — but it still
needs answering.

**Durable (Postgres-backed, survives a wiped filesystem):**

- `ai_scans` — rich scan log
- `community_flags` — submissions **and moderation state**
- `push_subscriptions` — Web Push subscribers
- `store_sightings` — per-chain availability

**Still file-only under `data/` — losing these costs analytics, not users:**

- `scans.db` — SQLite scan counter
- `openai-logs.jsonl`, `client-errors.jsonl`

Test it anyway: submit a community flag, redeploy, check it's still in the
moderation queue. That one test tells you whether the filesystem persists and
whether the Postgres mirror is doing its job. If flags survive but the JSONL is
empty, the mirror saved you and the remaining file-only items should move too.

The reason this mattered: a lost push subscriber is *silent*. No error, no
failed request — the user just stops getting the alerts they opted into, and
nobody reports a bug for a notification that never arrives.

## 8. Metadata consistency

`[x]` `CFBundleDisplayName` and `CFBundleName` are both `GoodScan`.
`[x]` `TARGETED_DEVICE_FAMILY = "1"` — iPhone only, no iPad screenshots needed.
`[x]` `PrivacyInfo.xcprivacy` present **and registered in `project.pbxproj`**.

Bundle ID is `com.goodscan.app`, changed from `com.scan2source.app` on
2026-08-18 — before first submission, which is the only moment it is safe to
change. It is PERMANENT from the first upload onward: after that, a new bundle
ID means a new store listing with no reviews, ratings or install base.
