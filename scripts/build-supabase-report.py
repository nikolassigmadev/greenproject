#!/usr/bin/env python3
"""
Generates docs/goodscan-technical-breakdown.pdf — a full behind-the-scenes
technical report on the GoodScan project, focused on the Supabase/Postgres
data layer.

Run:  python3 scripts/build-supabase-report.py
"""

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, CondPageBreak, HRFlowable,
)

# ── Brand palette ────────────────────────────────────────────────────────────
GREEN = colors.HexColor("#00A344")
GREEN_LT = colors.HexColor("#E8F6EE")
INK = colors.HexColor("#141B17")
INK2 = colors.HexColor("#3F4A44")
MUTED = colors.HexColor("#77837C")
HAIR = colors.HexColor("#DFE5E1")
CODE_BG = colors.HexColor("#F4F6F5")
AMBER = colors.HexColor("#B4690E")
AMBER_LT = colors.HexColor("#FDF3E3")
RED = colors.HexColor("#B3261E")
RED_LT = colors.HexColor("#FCECEA")
BLUE_LT = colors.HexColor("#EDF3FA")
BLUE = colors.HexColor("#1B4F91")

PAGE_W, PAGE_H = A4
MARGIN = 17 * mm
CONTENT_W = PAGE_W - 2 * MARGIN

ss = getSampleStyleSheet()


def S(name, **kw):
    base = kw.pop("parent", ss["Normal"])
    return ParagraphStyle(name, parent=base, **kw)


body = S("body", fontName="Helvetica", fontSize=9.3, leading=13.6,
         textColor=INK2, spaceAfter=6)
body_tight = S("body_tight", parent=body, spaceAfter=2)
lead = S("lead", fontName="Helvetica", fontSize=10.6, leading=15.5,
         textColor=INK, spaceAfter=9)

h1 = S("h1", fontName="Helvetica-Bold", fontSize=19, leading=23,
       textColor=INK, spaceBefore=2, spaceAfter=3)
h1_kicker = S("h1_kicker", fontName="Helvetica-Bold", fontSize=8,
              leading=10, textColor=GREEN, spaceAfter=3)
h2 = S("h2", fontName="Helvetica-Bold", fontSize=12.5, leading=16,
       textColor=INK, spaceBefore=13, spaceAfter=5)
h3 = S("h3", fontName="Helvetica-Bold", fontSize=10, leading=13,
       textColor=INK, spaceBefore=9, spaceAfter=3)

code = S("code", fontName="Courier", fontSize=7.6, leading=10.4,
         textColor=INK, spaceAfter=0, spaceBefore=0)
code_sm = S("code_sm", parent=code, fontSize=7.0, leading=9.6)

th = S("th", fontName="Helvetica-Bold", fontSize=7.6, leading=9.8,
       textColor=colors.white)
td = S("td", fontName="Helvetica", fontSize=7.6, leading=10.0, textColor=INK2)
td_b = S("td_b", parent=td, fontName="Helvetica-Bold", textColor=INK)
td_c = S("td_c", parent=td, fontName="Courier", fontSize=7.2, textColor=INK)

cap = S("cap", fontName="Helvetica-Oblique", fontSize=7.6, leading=10,
        textColor=MUTED, spaceAfter=8, spaceBefore=2)

bullet = S("bullet", parent=body, leftIndent=11, bulletIndent=2, spaceAfter=3.5)


def P(t, st=body):
    return Paragraph(t, st)


def bullets(items, st=bullet):
    return [Paragraph(f"<bullet>&bull;</bullet>&nbsp;{i}", st) for i in items]


def codeblock(lines, style=code, bg=CODE_BG, border=HAIR):
    """A monospaced block in a shaded box."""
    rows = [[Paragraph(ln.replace(" ", "&nbsp;") or "&nbsp;", style)] for ln in lines]
    t = Table(rows, colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.5, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 1.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.2),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return [Spacer(1, 3), t, Spacer(1, 7)]


def datatable(header, rows, widths, zebra=True):
    data = [[Paragraph(h, th) for h in header]]
    for r in rows:
        data.append([c if isinstance(c, Paragraph) else Paragraph(str(c), td) for c in r])
    t = Table(data, colWidths=widths, repeatRows=1)
    st = [
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, HAIR),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("BOX", (0, 0), (-1, -1), 0.5, HAIR),
    ]
    if zebra:
        for i in range(1, len(data)):
            if i % 2 == 0:
                st.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#FAFBFA")))
    t.setStyle(TableStyle(st))
    return [t, Spacer(1, 8)]


def callout(title, text, tone="info"):
    palette = {
        "info": (BLUE_LT, BLUE),
        "good": (GREEN_LT, GREEN),
        "warn": (AMBER_LT, AMBER),
        "bad": (RED_LT, RED),
    }[tone]
    bg, accent = palette
    ttl = S("ct", fontName="Helvetica-Bold", fontSize=8.6, leading=11.4,
            textColor=accent, spaceAfter=2.5)
    bt = S("cb", fontName="Helvetica", fontSize=8.6, leading=12.2, textColor=INK2)
    inner = [Paragraph(title, ttl), Paragraph(text, bt)]
    t = Table([[inner]], colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 2.4, accent),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return [Spacer(1, 3), t, Spacer(1, 9)]


def section(kicker, title):
    # Only break to a new page when there isn't room for a header plus real
    # content — otherwise sections flow, so no page is left half empty.
    return [
        CondPageBreak(72 * mm),
        Spacer(1, 10),
        Paragraph(kicker.upper(), h1_kicker),
        Paragraph(title, h1),
        HRFlowable(width="100%", thickness=1.6, color=GREEN,
                   spaceBefore=3, spaceAfter=10),
    ]


# ── Page furniture ───────────────────────────────────────────────────────────
def page_chrome(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(MUTED)
        canvas.drawString(MARGIN, PAGE_H - MARGIN + 6 * mm,
                          "GoodScan  |  Technical Breakdown & Supabase Data Layer")
        canvas.setStrokeColor(HAIR)
        canvas.setLineWidth(0.4)
        canvas.line(MARGIN, PAGE_H - MARGIN + 4.4 * mm,
                    PAGE_W - MARGIN, PAGE_H - MARGIN + 4.4 * mm)
        canvas.line(MARGIN, MARGIN - 4 * mm, PAGE_W - MARGIN, MARGIN - 4 * mm)
        canvas.setFont("Helvetica", 7)
        canvas.drawString(MARGIN, MARGIN - 8.5 * mm, "Generated 15 Aug 2026")
        canvas.setFont("Helvetica-Bold", 7.5)
        canvas.setFillColor(INK)
        canvas.drawRightString(PAGE_W - MARGIN, MARGIN - 8.5 * mm, str(doc.page))
    canvas.restoreState()


def cover_chrome(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(INK)
    canvas.rect(0, PAGE_H - 108 * mm, PAGE_W, 108 * mm, stroke=0, fill=1)
    canvas.setFillColor(GREEN)
    canvas.rect(0, PAGE_H - 111 * mm, PAGE_W, 3 * mm, stroke=0, fill=1)
    # scan-frame mark
    x, y, s, arm = MARGIN, PAGE_H - 42 * mm, 15 * mm, 5 * mm
    canvas.setStrokeColor(GREEN)
    canvas.setLineWidth(2.0)
    canvas.setLineCap(1)
    for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1)):
        cx = x + dx * s
        cy = y + dy * s
        canvas.line(cx, cy, cx + (arm if dx == 0 else -arm), cy)
        canvas.line(cx, cy, cx, cy + (arm if dy == 0 else -arm))
    canvas.setLineWidth(2.4)
    canvas.line(x + s * 0.26, y + s * 0.52, x + s * 0.44, y + s * 0.33)
    canvas.line(x + s * 0.44, y + s * 0.33, x + s * 0.76, y + s * 0.70)

    # Title block — drawn on the canvas so it lands inside the dark band.
    ty = PAGE_H - 62 * mm
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 30)
    canvas.drawString(MARGIN, ty, "GoodScan")
    canvas.setFont("Helvetica", 13)
    canvas.setFillColor(colors.HexColor("#C6D1CA"))
    canvas.drawString(MARGIN, ty - 9.5 * mm, "Technical Breakdown & the Supabase Data Layer")
    canvas.setFont("Helvetica", 9.5)
    canvas.setFillColor(colors.HexColor("#8A968E"))
    canvas.drawString(MARGIN, ty - 15.5 * mm,
                      "Everything behind the scenes: what is captured, how it travels,")
    canvas.drawString(MARGIN, ty - 20.2 * mm,
                      "where it lands, and why.")
    canvas.setFont("Courier", 8)
    canvas.setFillColor(colors.HexColor("#71807A"))
    for i, ln in enumerate([
        "repo     github.com/nikolassigmadev/greenproject",
        "branch   fix/verdict-coherence   (clean, 438 commits)",
        "runtime  https://goodscan.shop   |   com.goodscan.app",
        "scope    47,700 LOC TypeScript   +   2,195-line Express server",
    ]):
        canvas.drawString(MARGIN, ty - (30 + i * 4.6) * mm, ln)
    canvas.restoreState()


doc = BaseDocTemplate(
    "docs/goodscan-technical-breakdown.pdf",
    pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=MARGIN + 4 * mm, bottomMargin=MARGIN + 2 * mm,
    title="GoodScan — Technical Breakdown & Supabase Data Layer",
    author="Engineering",
    subject="Full behind-the-scenes architecture report",
)
frame = Frame(MARGIN, MARGIN + 2 * mm, CONTENT_W,
              PAGE_H - MARGIN * 2 - 6 * mm, id="main")
cover_frame = Frame(MARGIN, MARGIN, CONTENT_W, PAGE_H - 118 * mm, id="cover")
doc.addPageTemplates([
    PageTemplate(id="cover", frames=[cover_frame], onPage=cover_chrome),
    PageTemplate(id="main", frames=[frame], onPage=page_chrome),
])

story = []

# ═════════════════════════════════════════════════════════════ COVER ═════════
cover_title = S("cover_title", fontName="Helvetica-Bold", fontSize=27,
                leading=31, textColor=colors.white, spaceAfter=6)
cover_sub = S("cover_sub", fontName="Helvetica", fontSize=11.6, leading=16.5,
              textColor=colors.HexColor("#B9C4BD"), spaceAfter=4)
cover_meta = S("cover_meta", fontName="Courier", fontSize=8,
               leading=12, textColor=colors.HexColor("#7E8A83"))

# The title block itself is painted by cover_chrome() onto the dark band above;
# the frame below carries only the contents list.
story += [
    Spacer(1, 14 * mm),
    Paragraph("CONTENTS", S("cov_k", fontName="Helvetica-Bold", fontSize=8,
                            leading=10, textColor=GREEN, spaceAfter=7)),
]

# Cover contents block
toc_rows = [
    ["01", "The product in one page", "What GoodScan does and how a scan becomes a verdict"],
    ["02", "System architecture", "Frontend, proxy backend, five persistence stores"],
    ["03", "The data layer map", "Which store owns what, and why there are five"],
    ["04", "Supabase: connection & bootstrap", "Pooler, TLS, self-applying schema, defensive init"],
    ["05", "ai_scans: the main table", "All 20 columns, every source, every cap"],
    ["06", "The four write triggers", "Exactly when a row appears in Supabase"],
    ["07", "The journey of one payload", "Client -> HTTP -> sanitiser -> INSERT, end to end"],
    ["08", "The sanitisation gauntlet", "Six functions that stand between users and the DB"],
    ["09", "unmet_ethical_demand", "The view that turns logs into a business asset"],
    ["10", "community_flags", "Crowdsourced flags, sourcing bar, moderation sync"],
    ["11", "What never reaches Supabase", "The privacy boundary, enumerated"],
    ["12", "Operations & failure modes", "Migration, reading data, resilience, risks"],
]
rows = []
for n, t, d in toc_rows:
    rows.append([
        Paragraph(f"<font color='#00A344'><b>{n}</b></font>",
                  S("tocn", fontName="Helvetica-Bold", fontSize=8.4, textColor=GREEN)),
        Paragraph(f"<b>{t}</b>", S("toct", fontName="Helvetica-Bold",
                                   fontSize=8.6, leading=11.4, textColor=INK)),
        Paragraph(d, S("tocd", fontName="Helvetica", fontSize=8.2, leading=11.4,
                       textColor=MUTED)),
    ])
tt = Table(rows, colWidths=[10 * mm, 52 * mm, CONTENT_W - 62 * mm])
tt.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 2.6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 2.6),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
]))
story += [tt, PageBreak()]

story.append(Spacer(0, 0))
doc.handle_nextPageTemplate("main")

# ═══════════════════════════════════════════════ 01 THE PRODUCT ══════════════
story += section("01", "The product in one page")
story += [P(
    "GoodScan is an <b>ethical shopping scanner</b>. A shopper points a phone at a grocery product; "
    "the app identifies it, cross-references it against a dozen hand-curated ethics datasets, and returns "
    "a single top-line verdict — <b>Buy, Consider, Caution, or Avoid</b> — weighted by the priorities that "
    "specific shopper declared during onboarding. The whole point of the app is the moment after the verdict: "
    "a <b>Buy / Skip decision bar</b>, and a <b>better swap</b> if we have one to offer.", lead)]

story += [P("That last sentence is what makes the data layer interesting. GoodScan does not just log "
            "<i>what people scanned</i>. It logs <i>what they decided</i>, <i>why the product was flagged</i>, "
            "and <i>whether we had an ethical alternative to offer them in their market</i>. That triple is the "
            "raw material for the only genuinely proprietary dataset the project produces.")]

story += callout(
    "The one-sentence version of the data strategy",
    "Every scan writes a row that says: <i>a real shopper, in a real place, met a product with a real ethical "
    "problem — and here is whether the market could offer them a way out, and what they did about it.</i> "
    "Aggregate that and you have a live map of unmet ethical demand.",
    tone="good")

story += [P("Pipeline, compressed:", h3)]
story += codeblock([
    "  camera photo / barcode / typed query",
    "        |",
    "        +-- 2D barcode?  gs1.ts pulls the GTIN out of a QR or GS1 DataMatrix",
    "        +-- 1D barcode?  barcodeValidator.ts (EAN-13/8, UPC-A, ISBN)",
    "        +-- photo?       OpenAI Vision ('scan-product') -> Product / Brand / Barcode",
    "        |",
    "        v",
    "  Open Food Facts lookup or search  (proxied, never called from the browser)",
    "        |",
    "        +-- productRelevance.ts   distinctive vs. brand tokens, strong brand anchor",
    "        +-- visualMatch.ts        local colour histogram, then ONE AI call if unsure",
    "        |",
    "        v",
    "  getVerdict()  +  personalizedScore()   ->   BUY / CONSIDER / CAUTION / AVOID",
    "        |",
    "        v",
    "  DecisionBar: Buy or Skip     ->   THIS is what gets logged to Supabase",
])

story += [P("Scan-to-verdict latency was taken from roughly 13 seconds to 3.5&ndash;4.5 seconds by moving vision to "
            "gpt-4.1-mini, parallelising the Open Food Facts search strategies, time-boxing the visual match, and "
            "rendering the detail page before all enrichment resolves.")]

# ═══════════════════════════════════════════ 02 ARCHITECTURE ═════════════════
story += section("02", "System architecture")

story += [P("Three tiers. The browser never holds a secret and never talks to a third party directly.", body)]

story += codeblock([
    "  +--------------------------------------------------------------------+",
    "  |  CLIENT   Vite + React 18 + TS   (PWA, install-gated on mobile)     |",
    "  |           Capacitor 8 wraps the same bundle for iOS / Android       |",
    "  |           All personal state in localStorage. No account. No login. |",
    "  +--------------------------------------------------------------------+",
    "                    |  HTTPS, JSON only",
    "                    v",
    "  +--------------------------------------------------------------------+",
    "  |  SERVER   server.js  -  Express 5 proxy on goodscan.shop            |",
    "  |           Holds OPENAI_API_KEY and DATABASE_URL.                    |",
    "  |           Origin allowlist, 6 rate limiters, tiered body caps.      |",
    "  |           Also serves the built SPA from dist/.                     |",
    "  +--------------------------------------------------------------------+",
    "         |              |                |                 |",
    "         v              v                v                 v",
    "     OpenAI API   Open Food Facts   SQLite (local)   POSTGRES / SUPABASE",
    "     (vision +     (product data,    data/scans.db    ai_scans",
    "      chat)         proxied)         'most scanned'   community_flags",
    "                                     counter          unmet_ethical_demand",
])

story += [P("Why a proxy at all", h3)]
story += bullets([
    "<b>Secrets.</b> The OpenAI key and the database URL exist only in the server process. A decompiled "
    "Android bundle yields nothing.",
    "<b>CORS.</b> Open Food Facts' Search-a-licious endpoint sends no CORS headers, so it is physically "
    "impossible to call from a browser. The proxy is the only route.",
    "<b>Prompt control.</b> All seven vision prompts and three chat prompts live server-side, so they can be "
    "tuned and redeployed without shipping a new app build.",
    "<b>Rate limiting and abuse control</b> sit in front of a metered paid API.",
    "<b>Observability.</b> The proxy is the natural chokepoint at which to log — which is exactly what the "
    "Supabase layer exploits.",
])

story += [P("Request-hardening at the edge", h3)]
story += datatable(
    ["Control", "Detail"],
    [
        [Paragraph("<b>Origin allowlist</b>", td_b),
         "Explicit list; unknown origins rejected before any handler runs."],
        [Paragraph("<b>trust proxy = 1</b>", td_b),
         "Exactly one reverse-proxy hop (Hostinger). Without this every visitor shares the "
         "proxy IP and one user could exhaust everyone's rate limit."],
        [Paragraph("<b>Six rate limiters</b>", td_b),
         "openai, search, auth, community-flag, scan (60/min), client-error — each scoped to its route group."],
        [Paragraph("<b>Tiered body caps</b>", td_b),
         "16 KB push / 4 KB small / 2 MB global / 4 MB scan / 10 MB image. A route gets the "
         "smallest parser that can serve it."],
        [Paragraph("<b>Admin sessions</b>", td_b),
         "bcrypt password check, in-memory token, 4-hour TTL, separate auth limiter."],
    ],
    [34 * mm, CONTENT_W - 34 * mm])

# ═════════════════════════════════════════ 03 DATA LAYER MAP ═════════════════
story += section("03", "The data layer map")
story += [P("Five distinct stores. Each exists because it answers a question the others cannot.", lead)]

story += datatable(
    ["Store", "Location", "Holds", "Why it is separate"],
    [
        [Paragraph("<b>localStorage</b>", td_b), "On device",
         "Priorities, region, dietary rules, watchlist, basket, scan history, decisions, streaks",
         "Privacy-first. This is the user's own data and it never has to leave the phone for "
         "the app to work fully offline."],
        [Paragraph("<b>SQLite</b>", td_b), Paragraph("data/scans.db", td_c),
         "barcode, name, brand, eco_grade, country, anon_id, ts",
         "A fast, dependency-light 'most-scanned products' counter. Survives if Postgres is "
         "unreachable. Deliberately thin."],
        [Paragraph("<b>Postgres<br/>(Supabase)</b>", td_b), "Hosted, ap-northeast-1",
         Paragraph("<b>ai_scans</b> (rich per-scan log incl. photo + full model output), "
                   "<b>community_flags</b>, <b>unmet_ethical_demand</b> view", td),
         "The analytical store. Everything worth querying later, including the unmet-demand "
         "signal that is the product's strategic asset."],
        [Paragraph("<b>JSONL files</b>", td_b), Paragraph("data/*.jsonl", td_c),
         "openai-logs, community-flags, client-errors, push-subscriptions",
         "On-disk backup and append-only audit trail. OpenAI purges its own dashboard logs "
         "after 30 days; this is the permanent record."],
        [Paragraph("<b>Bundle data</b>", td_b), Paragraph("src/data/*.ts", td_c),
         "35 brand flags, 55 chocolate entries, 26 verified-ethics brands, beef/egg/sugar/commodity datasets",
         "The ethics knowledge base ships <i>with the app</i>, so verdicts render instantly and "
         "work with no network."],
    ],
    [22 * mm, 25 * mm, 52 * mm, CONTENT_W - 99 * mm])

story += callout(
    "The important distinction",
    "SQLite answers <i>\"what do people scan?\"</i>. Supabase answers <i>\"what happened, to whom, where, "
    "why, and what did they do next?\"</i> Only one of those is worth building a company on.",
    tone="info")

story += [P("Note the deliberate asymmetry: a failed scan is written to Postgres but "
            "<b>not</b> to SQLite. Unresolved junk (\"Unknown product\", a stray typed query) would pollute "
            "the most-scanned leaderboard, so failures live only in the analytical store where they "
            "are debugging material rather than noise.")]

# ══════════════════════════════ 04 SUPABASE CONNECTION ═══════════════════════
story += section("04", "Supabase: connection &amp; bootstrap")

story += [P("The entire Postgres integration lives in one 351-line module, "
            "<font face='Courier' size=8.6>db/scanStore.js</font>, plus a single env var. There is no "
            "Supabase client library, no PostgREST, no row-level security, no Supabase Auth. "
            "It is plain <font face='Courier' size=8.6>pg</font> over a connection string.", lead)]

story += [P("Connection string shape", h3)]
story += codeblock([
    "DATABASE_URL=postgresql://postgres.<project-ref>:<password>",
    "             @aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres",
])
story += [P("Port 5432 on the <font face='Courier' size=8.6>pooler</font> host is Supabase's "
            "<b>session pooler</b> — a full-featured session that supports prepared statements and "
            "everything the <font face='Courier' size=8.6>pg</font> driver expects, unlike the "
            "transaction pooler on 6543. The credential currently sits in "
            "<font face='Courier' size=8.6>.env.production</font>, which is gitignored.", body)]

story += callout(
    "Deliberately provider-agnostic",
    "The module's own header states: <i>\"Works against any Postgres connection string — Supabase, Neon, "
    "Railway, Aiven — via the single DATABASE_URL env var. No lock-in to any one provider.\"</i> "
    "Supabase is the current host, not a dependency. Swapping to Neon is a one-line env change.",
    tone="good")

story += [P("Pool configuration", h3)]
story += datatable(
    ["Setting", "Value", "Reasoning"],
    [
        [Paragraph("max", td_c), "5", "Small ceiling — this is a logging workload, not a request path. "
                                      "Keeps well inside Supabase pooler limits."],
        [Paragraph("idleTimeoutMillis", td_c), "30,000", "Releases idle connections back to the pooler."],
        [Paragraph("connectionTimeoutMillis", td_c), "8,000", "Bounded so a network stall cannot pile up."],
        [Paragraph("ssl", td_c), Paragraph("auto", td_b),
         "TLS on unless the host is localhost/127.0.0.1. Override with DATABASE_SSL=false for local dev. "
         "rejectUnauthorized is false because Supabase's pooler presents a chain Node does not ship."],
        [Paragraph("pool.on('error')", td_c), Paragraph("logged", td_b),
         "Background connection drops are surfaced to the console, never thrown — an unhandled pool error "
         "would take the whole server down."],
    ],
    [32 * mm, 18 * mm, CONTENT_W - 50 * mm])

story += [P("Self-applying schema", h3)]
story += [P("On startup, <font face='Courier' size=8.6>initScanStore()</font> executes one multi-statement "
            "SQL blob against the database. It is written to be <b>fully idempotent</b> — "
            "<font face='Courier' size=8.6>CREATE TABLE IF NOT EXISTS</font>, "
            "<font face='Courier' size=8.6>ADD COLUMN IF NOT EXISTS</font>, "
            "<font face='Courier' size=8.6>DROP COLUMN IF EXISTS</font>, "
            "<font face='Courier' size=8.6>CREATE INDEX IF NOT EXISTS</font>, "
            "<font face='Courier' size=8.6>CREATE OR REPLACE VIEW</font> — so a deploy against an old, a "
            "current, or an entirely empty database all converge to the same state with no migration tool, "
            "no version table, and no manual step.")]

story += [P("It also actively <i>removes</i> five columns that were tried and abandoned: "
            "<font face='Courier' size=8.6>carbon_footprint_100g</font>, "
            "<font face='Courier' size=8.6>image_hash</font>, "
            "<font face='Courier' size=8.6>image_url</font>, "
            "<font face='Courier' size=8.6>model</font>, "
            "<font face='Courier' size=8.6>query</font>, "
            "<font face='Courier' size=8.6>ocr_text</font>. The schema garbage-collects itself.")]

story += callout(
    "Fails soft, always",
    "If <font face='Courier' size=8.4>DATABASE_URL</font> is unset, init logs a warning and returns. If the "
    "connection fails, it logs, sets <font face='Courier' size=8.4>ready = false</font>, nulls the pool, and "
    "returns. Every write path is gated on <font face='Courier' size=8.4>if (!ready || !pool) return;</font>. "
    "<b>The server runs perfectly with no database at all</b> — you simply lose analytics. This is the same "
    "defensive pattern used for the SQLite store, which can also fail to load its native module on a given host.",
    tone="good")

# ═══════════════════════════════════ 05 ai_scans ═════════════════════════════
story += section("05", "ai_scans — the main table")
story += [P("One row per meaningful scan event. Twenty columns. This is where the substance is.", lead)]

story += datatable(
    ["Column", "Type", "What it actually contains", "Cap / rule"],
    [
        [Paragraph("id", td_c), "BIGSERIAL", "Primary key.", "—"],
        [Paragraph("user_id", td_c), "TEXT",
         Paragraph("A <b>randomly generated UUID</b> created on first use and kept in localStorage "
                   "(<font face='Courier' size=7>goodscan-anon-id</font>). Lets you count unique scanners "
                   "and follow one device's journey. Not derived from any personal identifier.", td),
         "64 chars"],
        [Paragraph("source", td_c), "TEXT",
         Paragraph("<font face='Courier' size=7>'scan'</font> or <font face='Courier' size=7>'decision'</font> "
                   "— set server-side based on whether a buy/skip was attached.", td), "64"],
        [Paragraph("product_name", td_c), "TEXT", "Resolved product name (post Open Food Facts match).", "300"],
        [Paragraph("brand", td_c), "TEXT", "Resolved brand.", "200"],
        [Paragraph("barcode", td_c), "TEXT", "EAN-13 / EAN-8 / UPC-A when one was read or resolved.", "64"],
        [Paragraph("eco_grade", td_c), "TEXT", "Eco-Score letter A-E (or A-plus).", "4"],
        [Paragraph("country", td_c), "TEXT",
         Paragraph("Country code from the region the user <b>set themselves</b> in onboarding.", td), "64"],
        [Paragraph("city", td_c), "TEXT", "Optional city, same explicit source.", "120"],
        [Paragraph("off_url", td_c), "TEXT",
         Paragraph("<b>Derived server-side</b>, not sent by the client: "
                   "<font face='Courier' size=7>world.openfoodfacts.org/product/{barcode}</font>. "
                   "Makes every row one click from the source record.", td), "derived"],
        [Paragraph("openai_response", td_c), "TEXT",
         Paragraph("The <i>trimmed</i> string vision produced, e.g. "
                   "<font face='Courier' size=7>\"Cadbury Dairy Milk Caramel\"</font> — exactly what was "
                   "handed to the Open Food Facts search.", td), "500"],
        [Paragraph("full_openai_<br/>response", td_c), "TEXT",
         Paragraph("The <b>complete raw model output</b> before trimming, e.g. the whole "
                   "<font face='Courier' size=7>Product: / Brand: / Barcode:</font> block. This is the "
                   "column that makes mis-identifications forensically debuggable.", td),
         Paragraph("<b>20,000</b>", td_b)],
        [Paragraph("bought", td_c), "TEXT",
         Paragraph("<font face='Courier' size=7>'YES'</font> bought / <font face='Courier' size=7>'NO'</font> "
                   "skipped / <font face='Courier' size=7>null</font> no decision. <b>The conversion signal.</b>", td),
         "enum"],
        [Paragraph("priorities", td_c), "JSONB",
         Paragraph("Snapshot of the shopper's weights <i>at scan time</i>: "
                   "<font face='Courier' size=7>{environment, laborRights, animalWelfare, nutrition}</font>, "
                   "each 0-100. Preserves why the verdict came out as it did even after they change settings.", td),
         "0-100 ints"],
        [Paragraph("category", td_c), "TEXT",
         "Swap-catalog category, e.g. chocolate, coffee, eggs. One of 22.", "64"],
        [Paragraph("verdict", td_c), "TEXT",
         Paragraph("The verdict <b>actually shown</b>: BUY | CONSIDER | CAUTION | AVOID | UNKNOWN.", td),
         "enum-checked"],
        [Paragraph("primary_concern", td_c), "TEXT",
         Paragraph("Worst concern found: labor | boycott | animal_welfare | eco. Null when clean.", td),
         "enum-checked"],
        [Paragraph("swap_available", td_c), "BOOLEAN",
         Paragraph("<b>Was a region-available ethical alternative on offer?</b> The single most "
                   "commercially interesting boolean in the schema.", td), "tri-state"],
        [Paragraph("image", td_c), "TEXT",
         Paragraph("<b>The actual photo the shopper took</b>, inline as base64 JPEG (no data: prefix). "
                   "512 px, quality 0.72.", td),
         Paragraph("<b>3M chars<br/>(~2.25 MB)</b>", td_b)],
        [Paragraph("resolved", td_c), "BOOLEAN",
         Paragraph("<font face='Courier' size=7>false</font> = the scan never matched a product. "
                   "These rows are the misses worth fixing.", td), "default true"],
        [Paragraph("created_at", td_c), "TIMESTAMPTZ", "Server clock, defaults to now().", "—"],
    ],
    [24 * mm, 20 * mm, CONTENT_W - 67 * mm, 23 * mm])

story += [P("Why the photo is stored", h3)]
story += [P("Storing the scanned image inline is an unusual choice and a deliberate one. The image is "
            "already compressed client-side to 512 px at quality 0.72 — and that number is itself an "
            "optimisation finding: the backend requests OpenAI's "
            "<font face='Courier' size=8.6>detail: 'low'</font> mode, which internally resizes to ~512 px and "
            "bills a <b>flat ~85 image tokens regardless of input size</b>. Shrinking further (the old "
            "256 px at q0.4) cost OCR legibility and saved nothing. So the same compressed buffer that goes "
            "to the model is the one persisted. Together with "
            "<font face='Courier' size=8.6>full_openai_response</font> and "
            "<font face='Courier' size=8.6>resolved = false</font>, every failed identification can be "
            "reproduced exactly: <i>here is the photo, here is what the model said about it, here is why it "
            "did not resolve.</i>")]

story += callout(
    "Storage reality check",
    "At the 3M-character ceiling a single row could be ~2.25 MB. A realistic 512 px q0.72 JPEG is "
    "40&ndash;80 KB base64, so ~15,000 scans per GB. Supabase's free tier is 500 MB. <b>This column is the "
    "cost driver and the first thing that will need a lifecycle policy</b> — either offload to Supabase "
    "Storage and keep a URL, or drop images older than N days once the identification work is done.",
    tone="warn")

# ═════════════════════════════ 06 WRITE TRIGGERS ═════════════════════════════
story += section("06", "The four write triggers")
story += [P("Rows do not appear on a timer. There are exactly four call sites, and each captures a "
            "different moment.", lead)]

story += datatable(
    ["#", "Trigger", "Fires from", "Row characteristics"],
    [
        ["1", Paragraph("<b>Product page opened</b>", td_b),
         Paragraph("OpenFoodFactsDetail.tsx:447", td_c),
         Paragraph("The main event. A product resolved and a verdict rendered. Carries brand, barcode, "
                   "eco grade, verdict, priorities, and — via "
                   "<font face='Courier' size=7>assessUnmetDemand()</font> — category, primary concern and "
                   "swap availability. When arrived from a camera scan, also carries the photo and both "
                   "OpenAI response fields (pulled from sessionStorage). "
                   "<font face='Courier' size=7>bought = null</font>.", td)],
        ["2", Paragraph("<b>Buy / Skip pressed</b>", td_b),
         Paragraph("DecisionBar.tsx:89", td_c),
         Paragraph("A <b>second</b> row for the same product, this time with "
                   "<font face='Courier' size=7>bought = 'YES'|'NO'</font> and "
                   "<font face='Courier' size=7>source = 'decision'</font>. The demand signals are "
                   "re-assessed at decision time. This is the conversion event.", td)],
        ["3", Paragraph("<b>Camera scan failed</b>", td_b),
         Paragraph("Scan.tsx:1331<br/>BarcodeScannerOverlay.tsx:426,432", td_c),
         Paragraph("<font face='Courier' size=7>resolved = false</font>, "
                   "<font face='Courier' size=7>verdict = 'UNKNOWN'</font>, plus the photo and the raw model "
                   "output. Never written to SQLite. Pure debugging corpus.", td)],
        ["4", Paragraph("<b>Text search found nothing</b>", td_b),
         Paragraph("Scan.tsx:1745<br/>BarcodeScannerOverlay.tsx:474", td_c),
         Paragraph("<font face='Courier' size=7>resolved = false</font> with the raw typed text, and the "
                   "AI-cleaned form recorded alongside as "
                   "<font face='Courier' size=7>typed: \"x\" -&gt; cleaned: \"y\"</font>. Shows what people "
                   "look for that the database cannot serve.", td)],
    ],
    [7 * mm, 33 * mm, 40 * mm, CONTENT_W - 80 * mm])

story += [P("The two-row pattern is intentional", h3)]
story += [P("A shopper who scans and then skips produces two rows: one at "
            "<font face='Courier' size=8.6>source = 'scan'</font> and one at "
            "<font face='Courier' size=8.6>source = 'decision'</font>. This is not duplication — it "
            "separates <i>exposure</i> from <i>conversion</i>. You can compute a skip rate per brand, per "
            "verdict, per concern type, and measure whether showing an AVOID verdict actually changes "
            "behaviour. Collapsing them into one row would destroy that.")]

story += [P("Client-side guarantees on every trigger", h3)]
story += bullets([
    "<b>Fire-and-forget.</b> <font face='Courier' size=8.6>void fetch(...)</font> with a "
    "<font face='Courier' size=8.6>.catch(() =&gt; {})</font>. Logging can never block or break a scan.",
    "<b>4-second timeout</b> via <font face='Courier' size=8.6>AbortSignal.timeout(4000)</font>.",
    "<b>Conditional keepalive.</b> <font face='Courier' size=8.6>keepalive: body.length &lt; 60_000</font> — "
    "keepalive lets a log survive page navigation, but browsers <i>reject</i> keepalive bodies over 64 KB "
    "outright. A photo-bearing payload blows past that, so image logs must go as a normal fetch or they "
    "silently never leave the device. This is a real bug that was found and fixed.",
    "<b>Opt-out honoured.</b> <font face='Courier' size=8.6>goodscan-scan-logging-optout</font> in "
    "localStorage short-circuits the whole function. (No UI exposes it yet — worth adding.)",
    "<b>Whole body wrapped in try/catch.</b> The comment reads: <i>\"never let logging break a scan\"</i>.",
])

# ═══════════════════════════ 07 PAYLOAD JOURNEY ══════════════════════════════
story += section("07", "The journey of one payload")
story += [P("End to end, for a single scan of a flagged chocolate bar in the UK.", lead)]

story += codeblock([
    "STEP 1  --  CLIENT assembles the body   (src/utils/scanLogger.ts)",
    "",
    "  region      = loadRegion()          // explicit, user-set. NEVER IP-derived.",
    "  priorities  = loadPriorities()      // current weights snapshot",
    "  demand      = assessUnmetDemand(product, priorities, region.countryCode)",
    "",
    "  POST https://goodscan.shop/api/scans",
    "  {",
    "    name: 'Dairy Milk Caramel', brand: 'Cadbury', barcode: '7622210449283',",
    "    ecoGrade: 'd',  verdict: 'AVOID',  bought: 'NO',",
    "    country: 'GB',  city: 'Manchester',  anonId: '9f2c...-uuid',",
    "    priorities: { environment: 50, laborRights: 100, animalWelfare: 50, nutrition: 50 },",
    "    category: 'chocolate',  primaryConcern: 'labor',  swapAvailable: true,",
    "    openaiResponse: 'Cadbury Dairy Milk Caramel',",
    "    fullOpenaiResponse: 'Product: Dairy Milk Caramel\\nBrand: Cadbury\\nBarcode: 762221...',",
    "    image: '/9j/4AAQSkZJRgABA...'  // 512px q0.72 JPEG base64",
    "    resolved: true",
    "  }",
], style=code_sm)

story += codeblock([
    "STEP 2  --  SERVER receives it   (server.js  ->  POST /api/scans)",
    "",
    "  scanLimiter   60 requests / minute / IP",
    "  scanBody      express.json({ limit: '4mb' })     // sized for the photo",
    "  guard         if (!name) -> 400",
    "",
    "  didResolve = resolved !== false;",
    "",
    "  if (didResolve) recordScan({...})   // SQLite counter -- failures excluded",
    "",
    "  logScan({                            // Postgres -- everything, incl. failures",
    "    source: bought ? 'decision' : 'scan',",
    "    userId: anonId, productName: name, ...",
    "  });",
    "",
    "  res.json({ success: true });        // returns BEFORE the INSERT completes",
], style=code_sm)

story += codeblock([
    "STEP 3  --  SANITISER + INSERT   (db/scanStore.js  ->  logScan)",
    "",
    "  if (!ready || !pool) return;                    // no DB? silently skip",
    "",
    "  barcode  = clip(rec.barcode, 64)",
    "  offUrl   = barcode ? `https://world.openfoodfacts.org/product/${barcode}` : null",
    "  bought   = (rec.bought === 'YES' || rec.bought === 'NO') ? rec.bought : null",
    "  verdict  = oneOf(rec.verdict, VERDICTS)         // else null",
    "  concern  = oneOf(rec.primaryConcern, CONCERNS)  // else null",
    "  prio     = priorityJson(rec.priorities)         // 4 numeric keys ONLY",
    "  img      = imageData(rec.image)                 // strip prefix, cap 3M",
    "",
    "  pool.query('INSERT INTO ai_scans (...19 cols...) VALUES ($1..$19)', values)",
    "      .catch(e => console.error('scanStore: insert failed --', e.message));",
    "",
    "  // NOT awaited. A DB hiccup logs to console and is swallowed.",
], style=code_sm)

story += callout(
    "Note what is NOT in the payload",
    "No name, no email, no IP, no precise coordinates, no device fingerprint, no advertising ID, no "
    "session cookie. The strongest identifier on the row is a random UUID the user's own browser minted "
    "and could clear at any time.",
    tone="good")

# ═══════════════════════════ 08 SANITISATION ═════════════════════════════════
story += section("08", "The sanitisation gauntlet")
story += [P("Six pure functions stand between arbitrary client JSON and the database. "
            "Every single column passes through one of them.", lead)]

story += datatable(
    ["Function", "Behaviour", "Protects against"],
    [
        [Paragraph("clip(s, n)", td_c),
         "Collapses all whitespace and control runs to single spaces, trims, truncates to n. "
         "Returns null for empty.",
         "Unbounded strings, control-character injection, log-line forgery, ragged data."],
        [Paragraph("clipRaw(s, n)", td_c),
         "Same but <b>preserves newlines</b>: normalises CRLF to LF, collapses spaces/tabs only, caps blank-line "
         "runs at two, then truncates.",
         "Used only for full_openai_response, where multi-line structure is the point and must stay legible."],
        [Paragraph("oneOf(s, set)", td_c),
         "Clips to 32 chars, then returns the value <b>only if it is in an allowlist</b>, else null.",
         "Junk in the heatmap dimensions. Guards verdict (5 values) and primary_concern (4 values). "
         "An attacker cannot invent a new verdict category."],
        [Paragraph("num(v, max)", td_c),
         "Coerces, then requires finite, &gt;= 0, &lt;= max.",
         "NaN, Infinity, negatives, and absurd magnitudes reaching JSONB."],
        [Paragraph("priorityJson(p)", td_c),
         Paragraph("Iterates a <b>fixed key list</b> (environment, laborRights, animalWelfare, nutrition), "
                   "runs each through num(v, 100), rounds, and rebuilds a fresh object. Unknown keys are "
                   "<b>dropped, not copied</b>.", td),
         Paragraph("The module comment is explicit: <i>\"Never stores free-text — no PII can leak in here.\"</i> "
                   "A client cannot smuggle arbitrary JSON into the JSONB column by adding keys.", td)],
        [Paragraph("imageData(s)", td_c),
         "Strips any data: URI prefix by slicing after the first comma, trims, and rejects anything over "
         "3,000,000 characters.",
         "Payload bloat and row explosion. Note it is a length check, not a format validation — see risks."],
    ],
    [27 * mm, CONTENT_W - 27 * mm - 46 * mm, 46 * mm])

story += [P("Structural safety", h3)]
story += bullets([
    "<b>Every write is a parameterised query.</b> All 19 values go in as "
    "<font face='Courier' size=8.6>$1..$19</font> bindings. There is no string concatenation into SQL "
    "anywhere in the module. SQL injection is structurally impossible on this path.",
    "<b>JSONB is cast explicitly</b> as <font face='Courier' size=8.6>$13::jsonb</font> from a "
    "<font face='Courier' size=8.6>JSON.stringify</font> of a freshly built object.",
    "<b>Enum columns are validated in application code</b>, not by a Postgres CHECK constraint — a "
    "pragmatic choice that keeps the self-applying schema simple, at the cost of the DB not enforcing it "
    "independently.",
    "<b>Nothing throws.</b> The outer <font face='Courier' size=8.6>try/catch</font> plus the promise "
    "<font face='Courier' size=8.6>.catch()</font> mean a malformed record produces a console line, "
    "not a 500.",
])

# ══════════════════════ 09 UNMET DEMAND VIEW ═════════════════════════════════
story += section("09", "unmet_ethical_demand — the payoff")
story += [P("This view is the reason the schema has the shape it has. Everything else is instrumentation; "
            "this is the asset.", lead)]

story += codeblock([
    "CREATE OR REPLACE VIEW unmet_ethical_demand AS",
    "SELECT",
    "  country,",
    "  city,",
    "  category,",
    "  primary_concern,",
    "  count(*)                                AS demand_signals,",
    "  count(*) FILTER (WHERE bought = 'NO')   AS rejected,",
    "  count(DISTINCT user_id)                 AS distinct_users,",
    "  max(created_at)                         AS last_seen",
    "FROM ai_scans",
    "WHERE category IS NOT NULL",
    "  AND primary_concern IS NOT NULL   -- the product carried a real ethical concern",
    "  AND swap_available IS NOT TRUE    -- ...and we had NO alternative to offer",
    "GROUP BY country, city, category, primary_concern",
    "ORDER BY rejected DESC, demand_signals DESC;",
])

story += [P("How to read a row", h3)]
story += [P("<font face='Courier' size=8.6>GB | Manchester | chocolate | labor | 412 | 158 | 96 | 2026-08-14</font>")]
story += [P("<i>In Manchester, 96 distinct shoppers hit chocolate carrying labour concerns 412 times, and on "
            "158 of those occasions they walked away — and we could not offer them a single ethical "
            "alternative actually sold in the UK.</i>", body)]

story += datatable(
    ["Metric", "Meaning", "Commercial reading"],
    [
        [Paragraph("<b>demand_signals</b>", td_b), "Every encounter with a flagged product where no swap existed.",
         "Total addressable frustration. Market size for this gap."],
        [Paragraph("<b>rejected</b>", td_b),
         Paragraph("The subset where the shopper actually pressed <b>Skip</b>.", td),
         Paragraph("<b>Acute unmet demand.</b> They wanted out and had nowhere to go. This is a lost sale "
                   "someone could capture. The view sorts by this first, deliberately.", td)],
        [Paragraph("<b>distinct_users</b>", td_b), "Unique devices behind the signals.",
         "Separates a genuine market from one obsessive tester."],
        [Paragraph("<b>last_seen</b>", td_b), "Most recent occurrence.", "Is this gap live or historical?"],
    ],
    [26 * mm, CONTENT_W - 26 * mm - 60 * mm, 60 * mm])

story += callout(
    "Why this is defensible data",
    "Nobody else has it. Retail sales data tells you what people <b>bought</b>. Survey data tells you what "
    "people <b>say</b> they care about. This tells you what people <b>refused to buy, on ethical grounds, "
    "at the shelf, in a named city, when no alternative existed</b> — with the concern type attached. "
    "It is a direct sourcing and stocking brief: which product, which market, which ethical axis, ranked "
    "by how many shoppers already walked away.",
    tone="good")

story += [P("The supporting partial index", h3)]
story += codeblock([
    "CREATE INDEX IF NOT EXISTS idx_ai_scans_demand",
    "  ON ai_scans (country, category, primary_concern)",
    "  WHERE primary_concern IS NOT NULL AND swap_available IS NOT TRUE;",
])
story += [P("A <b>partial</b> index whose predicate mirrors the view's WHERE clause exactly. It indexes only "
            "the rows the heatmap cares about — likely a small fraction of the table — which keeps it "
            "cheap to maintain on a write-heavy log while making the aggregation fast.")]

story += [P("Where swap_available comes from", h3)]
story += [P("<font face='Courier' size=8.6>assessUnmetDemand()</font> in "
            "<font face='Courier' size=8.6>src/services/swaps/index.ts</font> diagnoses the product's worst "
            "concern, maps it to one of 22 catalog categories, then pools candidates from four sources "
            "(curated alternatives, verified-ethics brands, the chocolate directory, custom swaps) and asks "
            "whether <b>any</b> candidate simultaneously: passes "
            "<font face='Courier' size=8.6>isCandidateClean()</font> (not boycotted, no labour allegations, "
            "no critical/high welfare flag, no verified labour flag), addresses <i>this specific</i> concern "
            "type, has verifiable availability, and is sold in the user's country. Only then is "
            "<font face='Courier' size=8.6>swap_available = true</font>. The bar is deliberately high, so a "
            "<font face='Courier' size=8.6>false</font> is meaningful.")]

# ══════════════════════ 10 COMMUNITY FLAGS ═══════════════════════════════════
story += section("10", "community_flags — crowdsourced evidence")
story += [P("The second Supabase table. Users submit brand allegations at "
            "<font face='Courier' size=8.6>/submit-flag</font>; the server validates hard, writes to JSONL "
            "as the on-disk backup, and mirrors to Postgres.", lead)]

story += datatable(
    ["Column", "Contents"],
    [
        [Paragraph("id", td_c), Paragraph("Generated <font face='Courier' size=7>cf_{timestamp}_{6 random "
                                          "bytes hex}</font>. Primary key.", td)],
        [Paragraph("status", td_c), "pending_review | approved | rejected. Defaults to pending_review."],
        [Paragraph("brand_name", td_c), "2-80 characters, required."],
        [Paragraph("category", td_c), Paragraph("One of ten: forced_labour, child_labour, wage_theft, "
                                                "unsafe_conditions, union_busting, discrimination, "
                                                "supply_chain_opacity, animal_welfare, environmental_harm, "
                                                "boycott_listed.", td)],
        [Paragraph("severity", td_c), "critical | high | medium | low."],
        [Paragraph("summary", td_c), Paragraph("10-300 characters. <b>Rejected if all-caps</b> (6+ letters, "
                                               "all uppercase) — a neat low-tech rant filter.", td)],
        [Paragraph("sources", td_c), Paragraph("JSONB array of 1-5 entries, each requiring a valid http(s) "
                                               "<b>url</b>, a <b>title</b>, a <b>publisher</b>, and a "
                                               "<b>tier</b> of tier1/tier2/tier3.", td)],
        [Paragraph("submitter_email", td_c), "Optional, max 200 chars. The only optional PII field in the system."],
        [Paragraph("meets_sourcing_bar", td_c), Paragraph("<b>Computed server-side</b>, not submitted. See below.", td)],
        [Paragraph("ip_hash", td_c), Paragraph("<b>SHA-256 of (client IP + daily UTC salt)</b>. The raw IP is "
                                               "never persisted. The salt rotates at UTC midnight so hashes "
                                               "cannot be correlated across days.", td)],
        [Paragraph("moderator_note", td_c), "Up to 500 chars, set on approve/reject."],
        [Paragraph("submitted_at / moderated_at", td_c), "TIMESTAMPTZ."],
    ],
    [34 * mm, CONTENT_W - 34 * mm])

story += [P("The sourcing bar", h3)]
story += [P("A submission is scored against the identical rule the in-house flag schema uses, so community "
            "evidence and curated evidence are held to one standard:")]
story += codeblock([
    "meetsSourcingBar(sources) is TRUE when any of:",
    "",
    "  (1)  1 or more tier-1 sources                                 -- e.g. US DOL, court filing",
    "  (2)  2 or more tier-2 sources from DIFFERENT publishers       -- corroboration, not an echo",
    "  (3)  1 tier-2 source  +  2 or more tier-3 sources",
])
story += [P("Condition (2) is the sharp one: it dedupes on lowercased publisher name, so two articles "
            "syndicated from the same outlet do not count as corroboration.")]

story += [P("Anti-abuse", h3)]
story += bullets([
    "<b>Honeypot field.</b> The client posts a realistically-named "
    "<font face='Courier' size=8.6>company_website</font> field that legitimate users leave empty. Bots fill "
    "every field. On a hit the server returns <b>HTTP 200 with a fake id</b> "
    "(<font face='Courier' size=8.6>cf_ignored</font>) so spammers never learn the trap exists.",
    "<b>Dedicated rate limiter</b> separate from the general API limiters.",
    "<b>4 KB body cap</b> — no room for a payload attack.",
    "<b>Strict field-by-field validation</b> with indexed error messages "
    "(<font face='Courier' size=8.6>sources[2].tier must be...</font>).",
])

story += [P("Moderation sync", h3)]
story += [P("<font face='Courier' size=8.6>PATCH /api/admin/community-flags/:id</font> rewrites the JSONL "
            "record <i>and</i> calls <font face='Courier' size=8.6>updateCommunityFlagStatus()</font> to "
            "reflect the decision onto the Postgres row. The insert uses "
            "<font face='Courier' size=8.6>ON CONFLICT (id) DO NOTHING</font>, so replaying the JSONL is safe.")]

story += callout(
    "Dual-write, JSONL as the source of truth",
    "The admin <i>read</i> endpoint reads the JSONL file, not Postgres. Postgres is the queryable mirror. "
    "That means if a Postgres write fails silently, the two can drift — the JSONL stays correct and the "
    "database quietly misses a flag. A periodic reconciliation job (replaying the JSONL through the "
    "idempotent insert) would close this.",
    tone="warn")

# ══════════════════════ 11 PRIVACY BOUNDARY ══════════════════════════════════
story += section("11", "What never reaches Supabase")
story += [P("The privacy posture is not incidental — it is enforced in several independent places.", lead)]

story += datatable(
    ["Never transmitted", "Where it stays", "Enforced by"],
    [
        ["Scan history (the user's own timeline)", "localStorage", "userPreferences.ts — read/written on-device only"],
        ["Basket contents", "localStorage", "basketStorage.ts"],
        ["Watchlist (brands trusted / avoided)", "localStorage", "watchlist.ts"],
        ["Dietary preferences and allergens", "localStorage",
         Paragraph("dietaryPreferences.ts. Health data — deliberately never leaves the device.", td)],
        ["Buy/skip decision <i>history</i>", "localStorage",
         Paragraph("decisions.ts. Only the single boolean outcome is logged, never the log itself.", td)],
        ["Streaks, swap tracking, weekly recap", "localStorage", "Derived on-device from the above."],
        [Paragraph("<b>Any IP-derived location</b>", td_b), Paragraph("<b>Nowhere</b>", td_b),
         Paragraph("<b>Explicit project rule.</b> Country and city come only from what the user typed in "
                   "onboarding. There is no geo-IP call anywhere in the codebase.", td)],
        ["Raw client IP (community flags)", "Never persisted", "hashIp() — SHA-256 with a daily-rotating UTC salt"],
        ["OpenAI API key, DATABASE_URL", "Server process only", "Proxy architecture; client bundles contain neither"],
    ],
    [46 * mm, 30 * mm, CONTENT_W - 76 * mm])

story += [P("The identity model", h3)]
story += [P("There are no accounts. No login, no email, no OAuth, no Supabase Auth. Identity is a single "
            "random UUID minted by <font face='Courier' size=8.6>crypto.randomUUID()</font> on first use and "
            "stored under <font face='Courier' size=8.6>goodscan-anon-id</font>. It is not derived from "
            "hardware, network, or anything about the person. Clearing site data mints a new one, and the "
            "old rows become permanently unlinkable.")]

story += callout(
    "Honest framing",
    "This is genuinely privacy-respecting for an analytics pipeline, but it is not anonymity. The "
    "combination of a stable device UUID, a self-declared city, timestamps, and a photograph of a product "
    "held in someone's hand is re-identifiable in principle. Two things follow: (a) the <b>image</b> column "
    "is the highest-sensitivity field in the system and deserves a retention limit; (b) the "
    "<font face='Courier' size=8.4>goodscan-scan-logging-optout</font> flag is honoured but has "
    "<b>no UI</b> — surfacing it in Preferences would make the privacy story defensible end to end.",
    tone="warn")

# ══════════════════════ 12 OPERATIONS ════════════════════════════════════════
story += section("12", "Operations, failure modes &amp; open risks")

story += [P("Getting data out", h3)]
story += datatable(
    ["Path", "Reaches", "Notes"],
    [
        [Paragraph("Supabase SQL editor", td_b), "Postgres directly",
         Paragraph("The primary analytical route. db/schema.sql ships example queries: all scans for a "
                   "product, one user's history, most-scanned, and "
                   "<font face='Courier' size=7>SELECT * FROM unmet_ethical_demand LIMIT 50</font>.", td)],
        [Paragraph("scripts/pull-scans.sh", td_b), "SQLite only",
         Paragraph("Prompts for the admin password with echo disabled, logs in, downloads "
                   "<font face='Courier' size=7>/api/admin/scans</font> to ~/Downloads, logs out, then "
                   "pretty-prints a top-25 with jq. <b>Note: this hits the SQLite counter, not Postgres.</b>", td)],
        [Paragraph("scripts/view-scans.js", td_b), "SQLite only", "Local reader for a data/scans.db file. CSV export."],
        [Paragraph("scripts/pull-flags.sh", td_b), "JSONL", "Admin-gated community-flag download."],
        [Paragraph("scripts/migrate-ai-scans.mjs", td_b), "Postgres",
         Paragraph("Optional, idempotent, additive-only migration. Reads DATABASE_URL from env, then "
                   "<font face='Courier' size=7>.env.local</font>, then "
                   "<font face='Courier' size=7>.env.production</font>. The server applies the same schema "
                   "on boot, so this only saves a restart.", td)],
    ],
    [36 * mm, 22 * mm, CONTENT_W - 58 * mm])

story += [P("Failure modes and how each is handled", h3)]
story += datatable(
    ["Failure", "Behaviour"],
    [
        ["DATABASE_URL unset", "Warning at boot. All Postgres writes no-op. App fully functional."],
        ["Supabase unreachable at boot", "init catches, ready=false, pool nulled. Writes no-op."],
        ["Connection drops later", "pool.on('error') logs. Next query fails, .catch() swallows it."],
        ["INSERT fails (constraint, size, timeout)",
         Paragraph("<font face='Courier' size=7>console.error</font>, row lost. <b>No retry, no dead-letter "
                   "queue.</b> Accepted trade-off for analytics.", td)],
        ["better-sqlite3 native module won't load", "Warning; SQLite disabled; Postgres continues."],
        [Paragraph("<b>Both</b> stores unavailable", td_b),
         Paragraph("Only then does <font face='Courier' size=7>/api/scans</font> return <b>503</b>. Otherwise "
                   "it always returns 200 without waiting for the insert.", td)],
        ["Client offline / server down", "fetch .catch() no-ops. The scan itself is unaffected."],
    ],
    [50 * mm, CONTENT_W - 50 * mm])

story += [P("Open risks, ranked", h3)]

story += callout(
    "1. Credentials  —  act on this first",
    "<font face='Courier' size=8.4>.env.production</font> holds a live-format OpenAI key and a Supabase "
    "connection string with a <b>plaintext password</b>. The <i>current</i> key is not in git history and "
    "HEAD is clean — but an <b>older key was committed</b>, in "
    "<font face='Courier' size=8.4>ADVANCED_OCR_DOCUMENTATION.md</font> and a bundled Android JS asset "
    "(commits 8f814c4, 3cad033, a3844c6), on a <b>public</b> remote. Those files were deleted later, but git "
    "history retains them. Rotation of both the key and the Supabase password was recommended and is still "
    "unconfirmed. Separately, <font face='Courier' size=8.4>ADMIN_PASSWORD_HASH</font> is still the literal "
    "placeholder <font face='Courier' size=8.4>$2b$10$REPLACE_THIS_WITH_A_REAL_HASH</font>, so admin auth "
    "silently falls back to the hash hardcoded in server.js.",
    tone="bad")

story += callout(
    "2. No row-level security, no service-role separation",
    "The app connects as the <font face='Courier' size=8.4>postgres</font> superuser role. Supabase RLS is "
    "not enabled on either table. This is defensible while the <i>only</i> client is a trusted server "
    "process — but it means that connection string is equivalent to full database access, which raises the "
    "stakes on point 1 considerably.",
    tone="bad")

story += callout(
    "3. The image column will become the cost centre",
    "No retention policy, no lifecycle rule, no offload to object storage. Rows are append-only forever. "
    "Recommended: keep images for unresolved scans (where they earn their keep) and expire them for "
    "resolved ones after ~30 days.",
    tone="warn")

story += callout(
    "4. Smaller items",
    "<b>(a)</b> Enum validation lives in app code, not DB constraints — the database will accept anything a "
    "future writer sends. <b>(b)</b> The JSONL/Postgres dual-write for community flags can drift with no "
    "reconciliation. <b>(c)</b> <font face='Courier' size=8.4>imageData()</font> checks length but not that "
    "the payload is actually valid base64 JPEG. <b>(d)</b> The opt-out flag has no UI. <b>(e)</b> "
    "<font face='Courier' size=8.4>pull-scans.sh</font> is named as though it reads the rich log but only "
    "reaches SQLite — there is no admin HTTP route onto Postgres at all.",
    tone="warn")

story += [Spacer(1, 6), HRFlowable(width="100%", thickness=0.6, color=HAIR, spaceAfter=8)]
story += [P("<b>Verified at time of writing:</b> 238 tests passing, 35 skipped (live E2E, gated behind "
            "RUN_LIVE=1), 19 test files green. Working tree clean on "
            "<font face='Courier' size=8.6>fix/verdict-coherence</font>. CI runs typecheck, eslint, vitest "
            "and build on every push and PR.", cap)]

doc.build(story)
print("Wrote docs/goodscan-technical-breakdown.pdf")
