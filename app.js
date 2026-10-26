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
let meta = null, sel = null, offset = 0, connected = false;
// Barcha tablar rasmlari oldindan obuna qilinadi va tayyor <img> holida saqlanadi:
// tabga o'tish tarmoqni kutmaydi (operator 2026-10-26: "bo'limlarga juda sekin o'tvotti").
const shots = {};          // i -> {v, t, el}
const subscribed = new Set();

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
function subscribeAll() {
  if (!meta || !meta.tabs) return;
  for (const t of meta.tabs) {
    if (subscribed.has(t.i)) continue;
    subscribed.add(t.i);
    onValue(ref(db, "sky/img/" + t.i), (s) => {
      const d = s.val();
      if (!d || !d.jpg) return;
      const im = new Image();
      im.className = "shot";
      im.alt = t.name;
      im.decoding = "async";
      im.onload = () => {
        shots[t.i] = { v: d.v, t: d.t, el: im };
        if (t.i === sel) { drawShot(); drawState(); }
      };
      im.src = "data:image/jpeg;base64," + d.jpg;
    });
  }
}
function choose(i) {
  sel = i;
  try { localStorage.setItem("tab", String(i)); } catch (e) { /* */ }
  drawTabs();
  drawShot();
  drawState();
}
function drawTabs() {
  if (!meta || !meta.tabs) return;
  for (const id of ["tabs", "ctabs"]) {
    $(id).replaceChildren(...meta.tabs.map((t) => {
      const b = el("button", t.i === sel ? "on" : "", t.name);
      b.type = "button";
      b.onclick = (e) => { e.stopPropagation(); if (t.i !== sel) choose(t.i); if (cinema()) showControls(); };
      return b;
    }));
  }
}
function drawState() {
  const p = [];
  if (!connected) p.push(el("span", "stale", "Internet aloqasi yo'q — qayta ulanmoqda · Reconnecting…"));
  if (meta) {
    const upd = (now() - meta.updated) / 1000;
    if (upd > STALE_S) p.push(el("span", "stale", "Dastur hozir ma'lumot yubormayapti · The station is offline"));
    else if (meta.minimized) p.push(el("span", "stale",
      "Kompyuterda dastur oynasi yig'ilgan — rasmlar vaqtincha yangilanmaydi · The app window is minimized"));
    const shot = shots[sel];
    if (shot && shot.t) {
      const age = Math.max(0, Math.round((now() - shot.t) / 1000));
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
  const shot = shots[sel];
  if (!shot) {
    wrap.replaceChildren(el("div", "empty",
      "Bu bo'lim tez orada paydo bo'ladi (dastur bo'limlarni navbat bilan yuboradi) · This section will appear shortly"));
    return;
  }
  const old = wrap.querySelector("img");
  if (old === shot.el) return;
  if (old && old.classList.contains("zoom")) shot.el.classList.add("zoom");
  shot.el.onclick = () => { if (!cinema()) shot.el.classList.toggle("zoom"); };
  wrap.replaceChildren(shot.el);
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
  subscribeAll();
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
// ── Kino rejimi: rasm butun ekranni to'ldiradi (operator 2026-10-26) ──
// Telefon yonboshga burilsa o'zi yoqiladi; "To'liq ekran" tugmasi brauzer panellarini ham yashiradi
// (Android: ekran yonboshga qulflanadi; iPhone: tik holatda rasm 90° buriladi).
const phoneLandscape = matchMedia("(orientation: landscape) and (max-height: 540px)");
let manual = false, hideTimer = null;
const cinema = () => document.body.classList.contains("cinema");
function setCinema(on) {
  document.body.classList.toggle("cinema", on);
  $("cine").hidden = !on;
  if (on) showControls(); else clearTimeout(hideTimer);
}
function showControls() {
  $("cine").classList.remove("fade");
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => $("cine").classList.add("fade"), 4000);
}
async function enterFull() {
  manual = true;
  setCinema(true);
  const d = document.documentElement;
  try {
    if (d.requestFullscreen) await d.requestFullscreen({ navigationUI: "hide" });
    else if (d.webkitRequestFullscreen) d.webkitRequestFullscreen();
  } catch (e) { /* iPhone: faqat CSS rejim */ }
  try { await screen.orientation.lock("landscape"); } catch (e) { /* qo'llanmasa — rasm CSS bilan buriladi */ }
}
function exitFull() {
  manual = false;
  try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* */ }
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
  setCinema(phoneLandscape.matches);
}
function onFsChange() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement && manual) {
    manual = false;
    setCinema(phoneLandscape.matches);
  }
}
document.addEventListener("fullscreenchange", onFsChange);
document.addEventListener("webkitfullscreenchange", onFsChange);
phoneLandscape.addEventListener("change", () => { if (!manual) setCinema(phoneLandscape.matches); });
if (phoneLandscape.matches) setCinema(true);
$("fsbtn").onclick = enterFull;
document.addEventListener("keydown", (e) => {
  if (!cinema() || !meta || !meta.tabs) return;
  if (e.key === "Escape" && manual) exitFull();
  else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    const n = meta.tabs.length;
    choose((sel + (e.key === "ArrowRight" ? 1 : -1) + n) % n);
    showControls();
  }
});
$("cexit").onclick = (e) => { e.stopPropagation(); exitFull(); };
$("wrap").addEventListener("click", () => {
  if (!cinema()) return;
  if ($("cine").classList.contains("fade")) showControls(); else $("cine").classList.add("fade");
});
// Surish: chapga -> keyingi bo'lim, o'ngga -> oldingi (kino rejimida).
let touch0 = null;
$("wrap").addEventListener("touchstart", (e) => {
  touch0 = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
}, { passive: true });
$("wrap").addEventListener("touchend", (e) => {
  if (!cinema() || !touch0 || !meta || !meta.tabs) return;
  const t = e.changedTouches[0];
  let dx = t.clientX - touch0.x, dy = t.clientY - touch0.y;
  if (!phoneLandscape.matches && matchMedia("(orientation: portrait)").matches) [dx, dy] = [dy, -dx];
  touch0 = null;
  if (Math.abs(dx) < 60 || Math.abs(dx) < 1.5 * Math.abs(dy)) return;
  const n = meta.tabs.length;
  choose((sel + (dx < 0 ? 1 : -1) + n) % n);
  showControls();
}, { passive: true });

$("qrbtn").onclick = () => showQr(true);
$("qr").onclick = () => showQr(false);
if (new URLSearchParams(location.search).get("qr") === "1") showQr(true);
