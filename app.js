// Sky Monitor — jonli ko'rinish (GitHub Pages + Firebase Realtime Database).
// Sky Monitor (kompyuter) "sky/meta" va "sky/img/<i>" ni yozadi; bu sahifa faqat o'qiydi.
// "presence/<id>" — shu ko'ruvchi borligi (Sky Monitor kimdir ko'rayotganini biladi).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./config.js";

const PRESENCE_MS = 45000;
const STALE_S = 120;

const db = getDatabase(initializeApp(firebaseConfig));
let meta = null, sel = null, unsubImg = null, img = null, offset = 0, connected = false;

const $ = (id) => document.getElementById(id);
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
function fmt(v, d) { return v === null || v === undefined ? "—" : Number(v).toFixed(d); }
const now = () => Date.now() + offset;

// ── ko'ruvchi borligi ──
function presenceId() {
  let id = null;
  try { id = sessionStorage.getItem("pid"); } catch (e) { /* xususiy oyna */ }
  if (!id) {
    id = Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    try { sessionStorage.setItem("pid", id); } catch (e) { /* */ }
  }
  return id;
}
const me = ref(db, "presence/" + presenceId());
function beat() { if (connected) set(me, serverTimestamp()).catch(() => {}); }
onValue(ref(db, ".info/connected"), (s) => {
  connected = s.val() === true;
  if (connected) { onDisconnect(me).remove(); beat(); }
  drawState();
});
onValue(ref(db, ".info/serverTimeOffset"), (s) => { offset = s.val() || 0; });
setInterval(beat, PRESENCE_MS);

// ── tablar ──
function choose(i) {
  sel = i;
  try { localStorage.setItem("tab", String(i)); } catch (e) { /* */ }
  drawTabs();
  if (unsubImg) unsubImg();
  img = null;
  $("wrap").replaceChildren(el("div", "empty", "Yuklanmoqda… · Loading…"));
  unsubImg = onValue(ref(db, "sky/img/" + i), (s) => { img = s.val(); drawShot(); drawState(); });
}
function drawTabs() {
  if (!meta || !meta.tabs) return;
  $("tabs").replaceChildren(...meta.tabs.map((t) => {
    const b = el("button", t.i === sel ? "on" : "", t.name);
    b.type = "button";
    b.onclick = () => { if (t.i !== sel) choose(t.i); };
    return b;
  }));
}
function drawState() {
  const p = [];
  if (!connected) p.push(el("span", "stale", "Internet aloqasi yo'q — qayta ulanmoqda · Reconnecting…"));
  if (meta) {
    const upd = (now() - meta.updated) / 1000;
    if (upd > STALE_S) p.push(el("span", "stale", "Dastur hozir ma'lumot yubormayapti · The station is offline"));
    if (img && img.t) {
      const age = Math.max(0, Math.round((now() - img.t) / 1000));
      p.push(el("span", age > STALE_S ? "stale" : "live",
        `Yangilangan: ${age} s oldin · updated ${age} s ago`));
    }
    if (meta.tabs && meta.tabs[meta.current]) {
      p.push(el("span", "", meta.rotating
        ? "Ko'rgazma rejimi: bo'limlar navbat bilan yangilanadi"
        : "Kompyuterda ochiq bo'lim: " + meta.tabs[meta.current].name));
    }
    if (meta.viewers) p.push(el("span", "", `Ko'ruvchilar: ${meta.viewers}`));
  }
  if (!p.length) p.push(el("span", "", "Ulanmoqda… · Connecting…"));
  $("state").replaceChildren(...p);
}
function drawShot() {
  const wrap = $("wrap");
  if (!img || !img.jpg) {
    wrap.replaceChildren(el("div", "empty",
      "Bu bo'lim tez orada paydo bo'ladi (dastur bo'limlarni navbat bilan yuboradi) · This section will appear shortly"));
    return;
  }
  const im = new Image();
  im.className = "shot";
  im.alt = meta && meta.tabs && meta.tabs[sel] ? meta.tabs[sel].name : "Sky Monitor";
  im.onload = () => {
    const old = wrap.querySelector("img");
    if (old && old.classList.contains("zoom")) im.classList.add("zoom");
    im.onclick = () => im.classList.toggle("zoom");
    wrap.replaceChildren(im);
  };
  im.src = "data:image/jpeg;base64," + img.jpg;
}
function drawKpi() {
  const k = (meta && meta.kpi) || {};
  const rows = [["Kamera GHI", k.ghi_est, 0, "W/m²"], ["O'lchangan GHI", k.ghi_measured, 0, "W/m²"],
    ["Bulut", k.cloud_pct, 0, "%"]];
  $("kpis").replaceChildren(...rows.map((r) => {
    const e = el("span", "", r[0] + ": ");
    e.appendChild(el("b", "", fmt(r[1], r[2]) + (r[1] == null ? "" : " " + r[3])));
    return e;
  }));
}
onValue(ref(db, "sky/meta"), (s) => {
  meta = s.val();
  if (!meta) { drawState(); return; }
  if (sel === null) {
    let saved = null;
    try { saved = localStorage.getItem("tab"); } catch (e) { /* */ }
    choose(saved !== null && meta.tabs && meta.tabs[+saved] ? +saved : 0);
  } else {
    drawTabs();
  }
  drawKpi();
  drawState();
});
setInterval(drawState, 5000);

// ── QR (ko'rgazma ekrani uchun: ?qr=1 yoki "QR" tugmasi) ──
const pageUrl = location.origin + location.pathname;
let qrMade = false;
function showQr(on) {
  $("qr").hidden = !on;
  if (on && !qrMade && window.QRCode) {
    new window.QRCode($("qrcode"), { text: pageUrl, width: 512, height: 512,
      correctLevel: window.QRCode.CorrectLevel.M });
    $("qrurl").textContent = pageUrl;
    qrMade = true;
  }
}
$("qrbtn").onclick = () => showQr(true);
$("qr").onclick = () => showQr(false);
if (new URLSearchParams(location.search).get("qr") === "1") showQr(true);
