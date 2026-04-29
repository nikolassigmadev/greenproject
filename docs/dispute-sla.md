# Dispute & Correction SLA

## Who can submit

Anyone — users, researchers, the brand itself, or any third party — can report an issue with a brand flag using the in-app "Report an issue" button on any flag.

## What you can report

| Issue type | Description |
|------------|-------------|
| `incorrect_flag` | The flag is factually wrong — the event did not happen, or the brand is misidentified |
| `outdated_source` | A source URL is dead, or the underlying finding has been corrected or retracted |
| `missing_context` | Important context is absent (e.g., the brand remediated and we have not noted it) |
| `brand_response` | An official brand statement or evidence of remediation |
| `other` | Anything else |

## What we commit to

| Commitment | Timeframe |
|------------|-----------|
| Acknowledge receipt (automated) | Immediate |
| Human review begins | Within 14 days of submission |
| Decision communicated (if email provided) | Within 14 days |
| Flag updated or archived (if warranted) | Within 14 days of decision |

## What counts as grounds for updating a flag

We will update or archive a flag if:

1. **The source is demonstrably incorrect** — the underlying document does not say what the flag claims, or the brand is misidentified.
2. **A source has been formally retracted** — the publisher has issued a correction or retraction.
3. **Material remediation is documented** — the brand provides tier-1 or tier-2 evidence (not a press release alone) that the specific conduct described in the flag has been meaningfully addressed.
4. **A tier-1 source contradicts the flag** — e.g., a court ruling finds in the brand's favour on the specific allegation.

## What does NOT constitute grounds for removal

- Brand disagreement without supporting evidence
- A press release asserting the flag is wrong
- Improvement in unrelated areas
- Passage of time alone (a 2002 finding remains documented fact even if the practice has since stopped; the flag may be updated to note the date and remediation, but not deleted)

## Process

1. Reporter submits via in-app form
2. Submission stored locally and/or routed to `VITE_DISPUTE_ENDPOINT` / `VITE_DISPUTE_EMAIL`
3. Admin reviews in `/admin/disputes`
4. If warranted: flag `status` updated to `disputed` while under review, then `verified` (updated) or `archived`
5. Reporter notified by email if provided

## Contact

Set `VITE_DISPUTE_EMAIL` in your environment to configure the email address for submissions without a backend wired.
