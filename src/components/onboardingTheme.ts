// Shared visual system for the first-run flow (Add-to-Home-Screen + Onboarding).
// Scoped under `.gs-ob`, theme-aware, and sized in `svh`-based clamps so every
// slide fits the viewport with NO scrolling on any phone height.
export const OB_CSS = `
.gs-ob {
  --green:#2FD18C; --green-strong:#15B879; --green-soft:rgba(47,209,140,0.14);
  --coral:#F26A5B; --coral-soft:rgba(242,106,91,0.16);
  --leaf:#2FD18C; --leaf-soft:rgba(47,209,140,0.16);
  --violet:#B49CEB; --violet-soft:rgba(180,156,235,0.18);
  --radius-card:22px; --radius-field:18px;
  --font:"Hanken Grotesk", system-ui, -apple-system, sans-serif;
  position:fixed; top:0; left:0; right:0; bottom:0;
  height:100svh; height:100dvh; z-index:10000;
  font-family:var(--font);
  background:var(--bg); color:var(--text);
  -webkit-font-smoothing:antialiased;
  display:flex; flex-direction:column; overflow:hidden;
}
.gs-ob[data-theme="dark"] {
  --bg:#0B0C0B; --surface:#161917; --surface-2:#1E2220;
  --border:rgba(255,255,255,0.07); --border-strong:rgba(255,255,255,0.12);
  --text:#F3F5F3; --text-2:#A7AEAB; --text-3:#6E7572;
  --eyebrow:#2FD18C;
  --cta-bg:#EDEBE3; --cta-text:#11140F;
  --back-bg:#272D2A; --back-text:#E6EAE7;
  --seg-track:#0C0E0D; --field-bg:#141716;
  --icon-tile-bg:rgba(47,209,140,0.13);
}
.gs-ob[data-theme="light"] {
  --bg:#F7F8F5; --surface:#FFFFFF; --surface-2:#F2F4F0;
  --border:rgba(18,30,24,0.09); --border-strong:rgba(18,30,24,0.14);
  --text:#131A16; --text-2:#5A635E; --text-3:#939B96;
  --eyebrow:#0E9E68;
  --cta-bg:#14181A; --cta-text:#F6F8F4;
  --back-bg:#EDF0EB; --back-text:#2A322D;
  --seg-track:#EDF0EC; --field-bg:#F6F8F4;
  --icon-tile-bg:rgba(15,158,104,0.10);
  --green:#12B97C; --leaf:#12B97C; --coral:#E0584B; --violet:#8C6FD6;
  --green-soft:rgba(18,185,124,0.12); --leaf-soft:rgba(18,185,124,0.12);
  --coral-soft:rgba(224,88,75,0.12); --violet-soft:rgba(140,111,214,0.14);
}

.gs-ob * { box-sizing:border-box; }

.gs-ob .screen {
  flex:1; min-height:0; width:100%; max-width:430px; margin:0 auto;
  overflow:hidden;
  display:flex; flex-direction:column;
  padding: calc(env(safe-area-inset-top,0px) + clamp(14px, 3.2svh, 30px)) 26px
           calc(env(safe-area-inset-bottom,0px) + clamp(12px, 2svh, 18px));
}
.gs-ob .anim { display:flex; flex-direction:column; flex:1; min-height:0; animation: gs-ob-rise .45s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes gs-ob-rise { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

.gs-ob .icon-tile {
  width:clamp(44px,6.4svh,52px); height:clamp(44px,6.4svh,52px); border-radius:15px;
  display:grid; place-items:center; background:var(--icon-tile-bg); color:var(--green); flex:none;
}
.gs-ob .icon-tile svg { width:26px; height:26px; }

.gs-ob .eyebrow { display:flex; align-items:center; gap:12px; margin:0 0 clamp(8px,1.4svh,12px); }
.gs-ob .eyebrow .label {
  font-size:12.5px; font-weight:800; letter-spacing:0.13em;
  color:var(--eyebrow); text-transform:uppercase; white-space:nowrap;
}
.gs-ob .progress { display:flex; gap:5px; }
.gs-ob .progress i {
  width:22px; height:4px; border-radius:99px; display:block;
  background:color-mix(in srgb, var(--text) 13%, transparent);
}
.gs-ob .progress i.on { background:var(--green); }

.gs-ob h1.title {
  font-size:clamp(25px, 4.3svh, 33px); line-height:1.06; font-weight:800;
  letter-spacing:-0.025em; color:var(--text); margin-bottom:clamp(8px,1.4svh,12px);
}
.gs-ob p.sub {
  font-size:clamp(14px, 1.95svh, 16px); line-height:1.5; font-weight:500; color:var(--text-2); max-width:38ch;
}

.gs-ob .footer { margin-top:auto; display:flex; align-items:center; gap:12px; padding-top:clamp(12px,2.2svh,24px); }
.gs-ob .cta {
  flex:1; appearance:none; border:0; cursor:pointer; font-family:inherit;
  font-weight:800; font-size:17px; letter-spacing:-0.01em;
  background:var(--cta-bg); color:var(--cta-text);
  height:clamp(52px,6.8svh,60px); border-radius:18px;
  display:inline-flex; align-items:center; justify-content:center; gap:10px;
  box-shadow:0 8px 22px -14px rgba(0,0,0,0.5);
  transition:transform .12s ease, filter .2s ease, opacity .2s ease;
}
.gs-ob .cta:hover { filter:brightness(1.04); }
.gs-ob .cta:active { transform:translateY(1px) scale(0.995); }
.gs-ob .cta:disabled { opacity:0.45; cursor:not-allowed; box-shadow:none; }
.gs-ob .cta svg { width:19px; height:19px; }
.gs-ob .iconbtn {
  flex:none; width:clamp(52px,6.8svh,60px); height:clamp(52px,6.8svh,60px); border-radius:18px;
  border:1px solid var(--border-strong); cursor:pointer;
  background:var(--back-bg); color:var(--back-text);
  display:grid; place-items:center; transition:background .2s ease, border-color .2s ease;
}
.gs-ob .iconbtn:hover { background:color-mix(in srgb, var(--back-bg) 84%, var(--text)); border-color:color-mix(in srgb, var(--text) 24%, transparent); }
.gs-ob .iconbtn svg { width:21px; height:21px; }
.gs-ob .skip {
  flex:none; appearance:none; border:0; background:transparent; cursor:pointer;
  font-family:inherit; font-weight:700; font-size:16px; color:var(--text-3);
  padding:0 14px; height:clamp(52px,6.8svh,60px);
}
.gs-ob .skip:hover { color:var(--text-2); }

.gs-ob .hero-mark { width:clamp(54px,8.5svh,76px); height:clamp(54px,8.5svh,76px); margin:clamp(2px,0.6svh,8px) auto clamp(12px,2.6svh,30px); display:grid; place-items:center; }
.gs-ob .hero-mark svg { width:100%; height:100%; }
.gs-ob .welcome-head { text-align:center; display:flex; flex-direction:column; flex:1; min-height:0; }
.gs-ob .welcome-head h1.title { font-size:clamp(26px, 4.6svh, 34px); }
.gs-ob .welcome-head p.sub { margin:0 auto; }
.gs-ob .features { display:flex; flex-direction:column; gap:clamp(8px, 1.3svh, 13px); margin-top:clamp(14px, 3svh, 38px); text-align:left; }
.gs-ob .feature {
  display:flex; align-items:flex-start; gap:15px; padding:clamp(11px,1.7svh,17px) 18px;
  border-radius:var(--radius-card); background:var(--surface); border:1px solid var(--border);
}
.gs-ob .feature .icon-tile { width:clamp(40px,5.4svh,46px); height:clamp(40px,5.4svh,46px); border-radius:13px; background:var(--green-soft); color:var(--green); }
.gs-ob .feature .icon-tile svg { width:23px; height:23px; }
.gs-ob .feature h3 { font-size:clamp(15.5px,2.05svh,17.5px); font-weight:800; letter-spacing:-0.01em; color:var(--text); margin-bottom:3px; }
.gs-ob .feature p { font-size:clamp(13px,1.75svh,14.5px); line-height:1.4; font-weight:500; color:var(--text-2); }

.gs-ob .stack { margin-top:clamp(16px,3svh,34px); display:flex; flex-direction:column; gap:clamp(12px,2.2svh,22px); }
.gs-ob .field label {
  display:flex; align-items:center; gap:6px; font-size:12.5px; font-weight:800;
  letter-spacing:0.07em; text-transform:uppercase; color:var(--text-2); margin-bottom:10px;
}
.gs-ob .field label .opt { color:var(--text-3); font-weight:600; text-transform:none; letter-spacing:0; }
.gs-ob .field label .req { color:var(--coral); }
.gs-ob .control {
  width:100%; height:clamp(52px,6.6svh,62px); border-radius:var(--radius-field);
  background:var(--field-bg); border:1px solid var(--border-strong);
  display:flex; align-items:center; gap:12px; padding:0 18px;
  font-size:17px; font-weight:600; color:var(--text); font-family:inherit;
  cursor:pointer; outline:none; transition:border-color .2s ease, box-shadow .2s ease;
}
.gs-ob .control:hover { border-color:color-mix(in srgb, var(--green) 50%, var(--border-strong)); }
.gs-ob .control:focus-within, .gs-ob input.control:focus { border-color:var(--green); box-shadow:0 0 0 3px var(--green-soft); }
.gs-ob input.control { display:block; font-weight:500; }
.gs-ob .control::placeholder { color:var(--text-3); font-weight:500; }
.gs-ob .control .flag { font-size:21px; line-height:1; }
.gs-ob .control .chev { margin-left:auto; color:var(--text-3); display:grid; pointer-events:none; }
.gs-ob .control .chev svg { width:18px; height:18px; }
.gs-ob .control.placeholder > span:not(.chev) { color:var(--text-3); font-weight:500; }

.gs-ob .helper {
  display:flex; align-items:flex-start; gap:9px; margin-top:clamp(12px,2svh,18px); color:var(--text-2);
  font-size:14px; line-height:1.45; font-weight:500;
}
.gs-ob .helper svg { width:17px; height:17px; color:var(--green); flex:none; margin-top:1px; }

.gs-ob .priorities {
  margin-top:clamp(14px,2.6svh,30px); border-radius:var(--radius-card);
  background:var(--surface); border:1px solid var(--border); padding:6px 18px;
}
.gs-ob .prio { padding:clamp(11px,1.9svh,19px) 0; }
.gs-ob .prio + .prio { border-top:1px solid var(--border); }
.gs-ob .prio-head { display:flex; align-items:center; gap:12px; margin-bottom:clamp(9px,1.5svh,14px); }
.gs-ob .prio-head .icon-tile { width:38px; height:38px; border-radius:11px; }
.gs-ob .prio-head .icon-tile svg { width:20px; height:20px; }
.gs-ob .prio-head h3 { font-size:17px; font-weight:800; letter-spacing:-0.01em; color:var(--text); }
.gs-ob .prio.c1 .icon-tile { background:var(--coral-soft); color:var(--coral); }
.gs-ob .prio.c2 .icon-tile { background:var(--leaf-soft); color:var(--leaf); }
.gs-ob .prio.c3 .icon-tile { background:var(--violet-soft); color:var(--violet); }
.gs-ob .seg {
  display:grid; grid-template-columns:repeat(3,1fr);
  background:var(--seg-track); border-radius:14px; padding:4px; gap:3px;
}
.gs-ob .seg button {
  appearance:none; border:0; cursor:pointer; font-family:inherit; font-weight:700;
  font-size:14.5px; color:var(--text-2); height:clamp(36px,4.8svh,42px); border-radius:10px;
  background:transparent; transition:all .18s ease;
}
.gs-ob .seg button:hover { color:var(--text); }
.gs-ob .prio.c1 .seg button.on { background:var(--coral); color:#fff; box-shadow:0 6px 14px -6px var(--coral); }
.gs-ob .prio.c2 .seg button.on { background:var(--leaf); color:#04130C; box-shadow:0 6px 14px -6px var(--leaf); }
.gs-ob .prio.c3 .seg button.on { background:var(--violet); color:#fff; box-shadow:0 6px 14px -6px var(--violet); }

/* ===== Add to Home Screen ===== */
.gs-ob .a2hs { display:flex; flex-direction:column; flex:1; min-height:0; justify-content:center; }
.gs-ob .a2hs .hero-mark { margin:clamp(4px,1svh,14px) auto clamp(14px,3svh,26px); }
.gs-ob .a2hs h1.title { text-align:center; }
.gs-ob .a2hs p.sub { text-align:center; margin:0 auto; }
.gs-ob .a2hs .for-browser {
  display:flex; align-items:center; justify-content:center; gap:8px;
  font-size:12.5px; font-weight:800; letter-spacing:0.1em;
  text-transform:uppercase; color:var(--eyebrow);
  margin:clamp(16px,3.4svh,38px) 0 clamp(9px,1.5svh,14px);
}
.gs-ob .a2hs .for-browser .browser-logo { width:22px; height:22px; flex:none; display:block; }
.gs-ob .a2hs .for-browser .browser-logo svg { width:100%; height:100%; display:block; }
.gs-ob .a2hs .for-browser + .steps { margin-top:0; }
.gs-ob .a2hs .note {
  text-align:center; font-size:13.5px; line-height:1.45; font-weight:500;
  color:var(--text-2); margin:clamp(12px,2svh,18px) auto 0; max-width:34ch;
}
.gs-ob .steps {
  margin-top:clamp(16px,3.4svh,40px); display:flex; flex-direction:column; gap:clamp(9px,1.5svh,13px);
}
.gs-ob .step {
  display:flex; align-items:center; gap:15px; padding:clamp(12px,1.8svh,16px) 18px;
  border-radius:var(--radius-card); background:var(--surface); border:1px solid var(--border);
}
.gs-ob .step .num {
  flex:none; width:30px; height:30px; border-radius:9px; display:grid; place-items:center;
  background:var(--green-soft); color:var(--green); font-weight:800; font-size:15px;
}
.gs-ob .step .num svg { width:18px; height:18px; }
.gs-ob .step .txt { font-size:clamp(14px,1.95svh,15.5px); font-weight:600; line-height:1.4; color:var(--text); }
.gs-ob .step .txt b { font-weight:800; }
.gs-ob .step .txt .ios-ic { display:inline-grid; place-items:center; vertical-align:-4px; color:var(--green); margin:0 2px; }
.gs-ob .step .txt .ios-ic svg { width:17px; height:17px; }
`;
