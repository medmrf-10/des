/* برمج — مراجعة متباعدة: أسئلة غير متقنة/لم تُجب مجدولة بـFSRS في prog_review */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const LS = 'prog_v1', LR = 'prog_review';
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DAY = 24 * 60 * 60 * 1000;

let state = {};
try { state = JSON.parse(localStorage.getItem(LS) || '{}') || {}; } catch (e) { state = {}; }
const doneMap = state.done || {}, quizMap = state.quiz || {};
let deck = {};
try { deck = JSON.parse(localStorage.getItem(LR) || '{}') || {}; } catch (e) { deck = {}; }
const saveDeck = () => localStorage.setItem(LR, JSON.stringify(deck));

/* تجميع البطاقات: أسئلة دروس بدأها المستخدم وأُجيبت خطأ أو لم تُجب.
   لا نخزن لكل-سؤال إجابة — أي سؤال في درس إشارته done/quiz يدخل الرزنامة. */
const CARDS = [];
TRACKS.forEach(t => t.lessons.forEach(l => {
  if (!l.quiz || !l.quiz.length) return;
  const started = doneMap[l.id] || quizMap[l.id];
  if (!started) return;
  const qrec = quizMap[l.id] || {};
  l.quiz.forEach((q, qi) => CARDS.push({ id: l.id + ':' + qi, lid: l.id, lt: l.t, tn: t.name, q }));
}));
/* إرفاق tid/li/nq لكل بطاقة قبل التجميع */
CARDS.forEach(c => {
  TRACKS.forEach(t => { const i = t.lessons.findIndex(l => l.id === c.lid); if (i >= 0) { c.tid = t.id; c.li = i; } });
  const t = TRACKS.find(t => t.id === c.tid);
  c.nq = t.lessons[c.li].quiz.length;
});

const now = Date.now();
const all = CARDS.map(c => {
  const d = deck[c.id] || null;
  return { c, d, due: !d || !d.nextReview || new Date(d.nextReview).getTime() <= now };
});
const pool = all.filter(x => {
  const qrec = quizMap[x.c.lid] || {};
  const n = x.c.nq;
  return !qrec.best || qrec.best < n || (x.d && x.d.nextReview);
});
const dueList = pool.filter(x => x.due).sort((a, b) => {
  const ta = a.d && a.d.nextReview ? new Date(a.d.nextReview).getTime() : 0;
  const tb = b.d && b.d.nextReview ? new Date(b.d.nextReview).getTime() : 0;
  return ta - tb;
});
const upcoming = pool.filter(x => !x.due && x.d && x.d.nextReview)
  .sort((a, b) => new Date(a.d.nextReview) - new Date(b.d.nextReview));

function fmtDate(ts) {
  const d = Math.ceil((new Date(ts) - now) / DAY);
  return d <= 0 ? 'اليوم' : d === 1 ? 'غداً' : `بعد ${d} أيام`;
}

const QUALS = [
  { q: 0, t: 'نسيت كلياً' }, { q: 1, t: 'نسيت أغلبه' }, { q: 2, t: 'صعب جداً' },
  { q: 3, t: 'تذكرت بصعوبة' }, { q: 4, t: 'تذكرت جيداً' }, { q: 5, t: 'سهل جداً' },
];

let cur = null, revealed = false;

function renderHead() {
  const perLesson = {};
  dueList.forEach(x => { (perLesson[x.c.lt] = perLesson[x.c.lt] || []).push(1); });
  const weakLessons = Object.keys(perLesson);
  const nextUp = upcoming.slice(0, 5);
  return `<div class="rv-head">
    <div class="rv-stat"><b>${dueList.length}</b><span>مستحق اليوم</span></div>
    <div class="rv-stat"><b>${pool.length}</b><span>في الرزنامة</span></div>
    <div class="rv-stat"><b>${weakLessons.length}</b><span>درساً يحتاج إعادة</span></div>
    ${nextUp.length ? `<div class="rv-next">أقرب استحقاقات: ${nextUp.map(x => `${escH(x.c.lt)} (${fmtDate(x.d.nextReview)})`).join(' · ')}</div>` : ''}
  </div>`;
}

function render() {
  const el = $('#revBody');
  if (!CARDS.length) {
    el.innerHTML = `<div class="rv-empty">لا أسئلة مراجعة بعد — أكمل دروساً وأجب على أسئلتها في تبويب المراجعة لتظهر هنا.</div>`;
    return;
  }
  if (!cur) {
    el.innerHTML = renderHead() + (dueList.length
      ? `<div class="rv-start"><button class="btn" id="rvGo">ابدأ جلسة المراجعة (${dueList.length} بطاقة)</button></div>`
      : `<div class="rv-empty">لا مستحقات اليوم — أحسنت! عُد غداً.</div>`);
    const b = $('#rvGo'); if (b) b.onclick = () => { cur = dueList.slice(); revealed = false; render(); };
    return;
  }
  if (!cur.length) { cur = null; render(); return; }
  const { c } = cur[0];
  const q = c.q;
  let html = renderHead() + `<div class="rv-card">
    <div class="rv-meta">${escH(c.tn)} · ${escH(c.lt)} <a class="rv-open" href="index.html#l=${c.tid}:${c.li}">↗</a></div>
    <div class="rv-q">${q.q}</div>
    <div class="rv-opts">${q.o.map((o, i) => `<div class="rv-opt ${revealed ? (i === q.a ? 'ok' : 'dim') : ''}">${o}</div>`).join('')}</div>`;
  if (!revealed) {
    html += `<button class="btn" id="rvShow">أظهر الجواب</button>`;
  } else {
    html += `<div class="rv-rate">قيّم تذكرك:
      <div class="rv-quals">${QUALS.map(x => `<button class="rv-q-btn" data-q="${x.q}">${x.t}<i>${x.q}</i></button>`).join('')}</div>
    </div>`;
  }
  html += `</div>`;
  el.innerHTML = html;
  const show = $('#rvShow');
  if (show) show.onclick = () => { revealed = true; render(); };
  el.querySelectorAll('.rv-q-btn').forEach(b => b.onclick = () => rate(+b.dataset.q));
}

function rate(q) {
  const { c } = cur[0];
  const d = deck[c.id] || { repetitions: 0, ease: 2.5, interval: 0, lastReview: null };
  const r = FSRS.schedule({ repetitions: d.repetitions, ease: d.ease, interval: d.interval, lastReview: d.lastReview, quality: q });
  deck[c.id] = {
    repetitions: r.repetitions, ease: r.newEase, interval: r.newInterval,
    lastReview: new Date().toISOString(), nextReview: r.nextReview, lapses: r.lapses || 0,
  };
  saveDeck();
  cur.shift(); revealed = false;
  render();
}

render();
})();
