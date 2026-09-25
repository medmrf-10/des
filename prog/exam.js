/* برمج — امتحان المسار التراكمي: أسئلة عشوائية من quiz[] كل درس، نتيجة ومراجعة */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const BEST_KEY = 'prog_exam_best';
const NQ = () => 10 + Math.floor(Math.random() * 6); // 10-15 سؤالاً

const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const best = () => { try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}'); } catch (e) { return {}; } };
const saveBest = b => localStorage.setItem(BEST_KEY, JSON.stringify(b));

let exam = null; // {track, qs:[{q,o,a,lesson}], i, answers:[idx|null], t0}

/* تجميع أسئلة المسار */
function pool(t) {
  const out = [];
  t.lessons.forEach(l => (l.quiz || []).forEach(q => out.push({ q: q.q, o: q.o, a: q.a, lesson: l.t })));
  return out;
}
function shuf(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = r[i]; r[i] = r[j]; r[j] = t; }
  return r;
}

function setBar(p) { $('#examBar').style.width = Math.round(p) + '%'; }

/* ---------- شاشة اختيار المسار ---------- */
function renderPick() {
  setBar(0);
  const B = best();
  $('#examBody').innerHTML = `
    <h3 class="sec-h">اختر المسار</h3>
    <div class="c-grid">
      ${TRACKS.map(t => {
        const n = pool(t).length;
        const b = B[t.id];
        return `<div class="track free-card ex-track" data-t="${t.id}" ${n < 10 ? 'style="opacity:.45;pointer-events:none"' : ''}>
          <div class="track-head"><div class="t-info">
            <h3>${escH(t.name)}</h3>
            <div class="t-desc">${n} سؤالاً متاحاً · ${t.lessons.length} درساً${n < 10 ? ' — (يحتاج 10+ للامتحان)' : ''}</div>
            ${b ? `<div class="ex-best">أفضل نتيجة: <b>${b.best}%</b> (${b.n}/${b.tot}) — آخر محاولة ${escH(b.date)}</div>` : ''}
          </div></div>
        </div>`;
      }).join('')}
    </div>`;
  document.querySelectorAll('.ex-track').forEach(el => el.onclick = () => startExam(el.dataset.t));
}

/* ---------- توليد الامتحان ---------- */
function startExam(tid) {
  const t = TRACKS.find(x => x.id === tid);
  const qs = shuf(pool(t)).slice(0, NQ());
  exam = { track: t, qs, i: 0, answers: new Array(qs.length).fill(null), t0: Date.now() };
  renderQ();
}

/* ---------- سؤال بسؤال ---------- */
function renderQ() {
  const ex = exam, q = ex.qs[ex.i], n = ex.qs.length;
  setBar(ex.i / n * 100);
  $('#examBody').innerHTML = `
    <div class="ex-head">
      <span class="ex-count">السؤال ${ex.i + 1} / ${n}</span>
      <span class="ex-src">${escH(q.lesson)}</span>
    </div>
    <div class="ex-q">${q.q}</div>
    <div class="ex-opts">
      ${q.o.map((o, oi) => `<button class="ex-opt" data-i="${oi}">${o}</button>`).join('')}
    </div>`;
  document.querySelectorAll('.ex-opt').forEach(b => b.onclick = () => answer(+b.dataset.i, b));
}

function answer(oi, btn) {
  const ex = exam, q = ex.qs[ex.i];
  if (ex.answers[ex.i] !== null) return;
  ex.answers[ex.i] = oi;
  document.querySelectorAll('.ex-opt').forEach(b => {
    const i = +b.dataset.i;
    if (i === q.a) b.classList.add('ok');
    else if (i === oi) b.classList.add('bad');
    b.disabled = true;
  });
  setTimeout(() => {
    if (ex.i + 1 < ex.qs.length) { ex.i++; renderQ(); } else finishExam();
  }, 950);
}

/* ---------- النتيجة ---------- */
function finishExam() {
  const ex = exam, n = ex.qs.length;
  setBar(100);
  let ok = 0;
  const wrong = {};
  ex.qs.forEach((q, qi) => {
    if (ex.answers[qi] === q.a) ok++;
    else (wrong[q.lesson] = wrong[q.lesson] || []).push(q);
  });
  const pct = Math.round(ok / n * 100);

  /* حفظ أفضل نتيجة + تاريخ المحاولة */
  const B = best(), tid = ex.track.id;
  const date = new Date().toISOString().slice(0, 10);
  const prev = B[tid];
  B[tid] = { best: prev && prev.best > pct ? prev.best : pct, n: ok, tot: n, date, last: pct };
  saveBest(B);
  const isBest = !prev || pct >= prev.best;

  $('#examBody').innerHTML = `
    <div class="ex-result">
      <div class="ex-score ${pct >= 70 ? 'pass' : 'fail'}">${pct}%</div>
      <div class="ex-sub">${ok} / ${n} إجابة صحيحة${isBest ? ' — <b>أفضل نتيجة لك!</b>' : ` (أفضل نتيجة: ${B[tid].best}%)`}</div>
      ${Object.keys(wrong).length ? `
        <h3 class="sec-h">راجع هذه الدروس</h3>
        ${Object.keys(wrong).map(ls => `
          <div class="ex-wrong">
            <div class="ex-w-lesson">${escH(ls)} <span class="c-cnt">${wrong[ls].length} خطأ</span></div>
            ${wrong[ls].map(q => `
              <div class="ex-w-item">
                <div class="ex-w-q">${q.q}</div>
                <div class="ex-w-a">الصحيحة: ${q.o[q.a]}</div>
              </div>`).join('')}
          </div>`).join('')}
      ` : '<div class="ex-perfect">امتحان مثالي — لا شيء للمراجعة 🎓</div>'}
      <div class="ex-actions">
        <button class="btn" id="exAgain">ابدأ امتحان آخر ⟳</button>
        <button class="btn ghost" id="exPick">غيّر المسار</button>
      </div>
    </div>`;
  $('#exAgain').onclick = () => startExam(tid);
  $('#exPick').onclick = renderPick;
}

renderPick();
})();
