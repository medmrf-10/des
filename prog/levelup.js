/* برمج — تدرّج: 6 مستويات لكل مسار بمتطلبات (ساعات/دروس/مشاريع/امتحان)، تلوّن المُحقَّق */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const read = k => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
const readArr = k => { try { const v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };

const state = read('prog_v1'), doneMap = state.done || {};
const projMap = read('prog_proj'), examBest = read('prog_exam_best'), examAtt = readArr('prog_exam');
const HRS_PER_LESSON = 0.5; /* تقدير نصف ساعة لكل درس */

const LEVELS = [
  { name: 'مبتدئ', frac: 0.05, steps: 0, exam: 0 },
  { name: 'ممارس', frac: 0.25, steps: 2, exam: 0 },
  { name: 'متوسط', frac: 0.50, steps: 4, exam: 50 },
  { name: 'ماهر', frac: 0.70, steps: 6, exam: 60 },
  { name: 'محترف', frac: 0.90, steps: 8, exam: 75 },
  { name: 'متقن', frac: 1.00, steps: 10, exam: 85 },
];

/* خطوات مشاريع كل مسار — معرّف المشروع يبدأ ببادئة المسار */
function stepsOf(tid) {
  return Object.keys(projMap).filter(p => p.startsWith(tid))
    .reduce((n, p) => n + Object.keys(projMap[p]).filter(i => projMap[p][i]).length, 0);
}
function examPct(tid) {
  let pct = 0;
  const b = examBest[tid];
  if (b) pct = Math.min(100, b.tot && b.best <= b.tot ? Math.round(b.best / b.tot * 100) : Math.round(b.best));
  examAtt.forEach(a => { if (a.score && a.n) pct = Math.max(pct, Math.round(a.score / a.n * 100)); });
  return pct;
}

const rows = TRACKS.map(t => {
  const nL = t.lessons.length;
  const done = t.lessons.filter(l => doneMap[l.id]).length;
  const hrs = Math.round(done * HRS_PER_LESSON * 10) / 10;
  const st = stepsOf(t.id), ex = examPct(t.id);
  const lv = LEVELS.map((L, i) => {
    const reqL = Math.max(1, Math.ceil(nL * L.frac));
    const met = { lessons: done >= reqL, steps: st >= L.steps, exam: ex >= L.exam };
    const need = [];
    if (L.frac > 0) need.push(`دروس ≥ ${reqL}`);
    if (L.steps > 0) need.push(`مهام مشاريع ≥ ${L.steps}`);
    if (L.exam > 0) need.push(`امتحان ≥ ${L.exam}%`);
    return { ...L, i, reqL, met, need, ok: met.lessons && met.steps && met.exam };
  });
  let lvl = -1;
  lv.forEach(L => { if (L.ok) lvl = L.i; });
  return { t, nL, done, hrs, st, ex, lv, lvl };
});
localStorage.setItem('prog_level', JSON.stringify(rows.reduce((o, r) => { o[r.t.id] = r.lvl; return o; }, {})));

/* مقارنة المسارات */
$('#lvCompare').innerHTML = `
  <h3 class="sec-h">مقارنة المسارات</h3>
  <div class="lv-cmp">${rows.map(r => `
    <div class="lv-cmp-row">
      <span class="lv-cmp-n">${escH(r.t.name)}</span>
      <div class="lv-cmp-track">${LEVELS.map((L, i) => `<i class="lv-cmp-seg ${i <= r.lvl ? 'on' : ''}" title="${escH(L.name)}"></i>`).join('')}</div>
      <b class="lv-cmp-l">${r.lvl < 0 ? '—' : escH(LEVELS[r.lvl].name)}</b>
    </div>`).join('')}</div>`;

/* سلّم كل مسار */
$('#lvTracks').innerHTML = rows.map(r => `
  <div class="lv-track">
    <div class="lv-track-h">
      <h3>${escH(r.t.name)}</h3>
      <span class="lv-track-m">${r.done}/${r.nL} درساً · ${r.hrs}س · ${r.st} مهمة مشاريع · امتحان ${r.ex}%</span>
    </div>
    <div class="lv-ladder">${r.lv.map(L => `
      <div class="lv-node ${L.ok ? 'ok' : L.i === r.lvl + 1 ? 'next' : ''}">
        <div class="lv-dot">${L.ok ? '✓' : L.i + 1}</div>
        <div class="lv-name">${escH(L.name)}</div>
        <div class="lv-req">${L.need.length ? L.need.join('<br>') : 'نقطة البداية'}</div>
        <div class="lv-met">${L.ok ? '' : L.need.map((_, j) => {
          const parts = [];
          if (L.frac > 0 && !L.met.lessons) parts.push('دروس');
          if (L.steps > 0 && !L.met.steps) parts.push('مشاريع');
          if (L.exam > 0 && !L.met.exam) parts.push('امتحان');
          return parts.length ? `<i>ناقص: ${parts.join(' + ')}</i>` : '';
        }).filter(Boolean).join('')}</div>
      </div>`).join('<div class="lv-link ' + '"></div>')}</div>
  </div>`).join('');

/* تلوين الروابط بين العقد المحققة */
document.querySelectorAll('.lv-ladder').forEach(lad => {
  const nodes = lad.querySelectorAll('.lv-node');
  const links = lad.querySelectorAll('.lv-link');
  links.forEach((lk, i) => {
    if (nodes[i] && nodes[i].classList.contains('ok') && nodes[i + 1] && nodes[i + 1].classList.contains('ok')) lk.classList.add('ok');
  });
});
})();
