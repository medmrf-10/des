/* برمج — خريطة الإتقان: شجرة مسارات ← دروس بحلقات SVG ملوّنة بمستوى الإتقان */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const read = k => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
const state = read('prog_v1'), projMap = read('prog_proj'), labMap = read('prog_lab'), revMap = read('prog_review');
const doneMap = state.done || {}, quizMap = state.quiz || {}, coursesMap = state.courses || {};

/* إتقان الدرس: 70% إتمامه + 30% أفضل نتيجة مراجعته */
function lessonPct(l) {
  const d = doneMap[l.id] ? 1 : 0;
  const nq = (l.quiz || []).length;
  const q = nq && quizMap[l.id] ? quizMap[l.id].best / nq : 0;
  return Math.round(d * 70 + q * 30);
}
function colorOf(p) { return p >= 80 ? 'green' : p >= 40 ? 'gold' : 'gray'; }
function ring(pct, cls, r) {
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return `<svg class="mp-ring ${cls}" viewBox="0 0 ${r * 2 + 8} ${r * 2 + 8}" width="${r * 2 + 8}" height="${r * 2 + 8}">
    <circle class="mp-bg" cx="${r + 4}" cy="${r + 4}" r="${r}" fill="none" stroke-width="4"/>
    <circle class="mp-fg" cx="${r + 4}" cy="${r + 4}" r="${r}" fill="none" stroke-width="4"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" stroke-linecap="round"
      transform="rotate(-90 ${r + 4} ${r + 4})"/>
    <text x="${r + 4}" y="${r + 8}" text-anchor="middle" class="mp-txt">${pct}%</text>
  </svg>`;
}

/* بطاقات مراجعة مستحقة لكل درس */
const now = Date.now();
const dueByLid = {};
Object.keys(revMap).forEach(k => {
  const d = revMap[k];
  if (d && d.nextReview && new Date(d.nextReview).getTime() <= now) {
    const lid = k.split(':')[0];
    dueByLid[lid] = (dueByLid[lid] || 0) + 1;
  }
});

/* مشاريع كل مسار: خطوات منجزة/كلية (نفس قائمة proj.js — نقرأ عدد المشاريع المبدوءة فقط) */
const projStepsDone = Object.keys(projMap).reduce((n, p) => n + Object.keys(projMap[p]).filter(i => projMap[p][i]).length, 0);
const labDone = Object.keys(labMap).filter(k => labMap[k]).length;

/* تجميع الشجرة */
const tracks = TRACKS.map(t => {
  const ps = t.lessons.map(lessonPct);
  const pct = Math.round(ps.reduce((a, b) => a + b, 0) / ps.length);
  return { t, ps, pct, done: t.lessons.filter(l => doneMap[l.id]).length };
});
const overall = Math.round(tracks.reduce((a, x) => a + x.pct, 0) / tracks.length);

/* أقرب 3 دروس متبقية — أول غير مكتملة في أكثر المسارات تقدماً */
const remaining = [];
tracks.slice().sort((a, b) => b.pct - a.pct).forEach(({ t }) => {
  t.lessons.forEach((l, i) => { if (!doneMap[l.id] && remaining.length < 3) remaining.push({ t, l, i }); });
});

$('#mapHead').innerHTML = `
  <div class="mp-head">
    <div class="mp-overall">
      ${ring(overall, colorOf(overall), 34)}
      <div><b>${overall}%</b><span>الإتقان الكلي</span></div>
    </div>
    <div class="mp-extras">
      <span>مشاريع: ${projStepsDone} خطوة منجزة</span> ·
      <span>مختبر: ${labDone}/12 تحدياً</span> ·
      <span>مراجعة مستحقة: ${Object.values(dueByLid).reduce((a, b) => a + b, 0)} بطاقة</span>
    </div>
    ${remaining.length ? `<div class="mp-next">��قرب متبقية: ${remaining.map(x => `<a href="index.html#l=${x.t.id}:${x.i}">${escH(x.l.t)} <i>(${escH(x.t.name)})</i></a>`).join(' · ')}</div>` : '<div class="mp-next">كل الدروس مكتملة 🎓</div>'}
  </div>`;

$('#mapBody').innerHTML = tracks.map(({ t, ps, pct, done }) => `
  <div class="mp-track">
    <button class="mp-t-node" data-t="${t.id}">
      ${ring(pct, colorOf(pct), 24)}
      <div class="mp-t-info"><h3>${escH(t.name)}</h3><span>${done}/${t.lessons.length} درساً</span></div>
    </button>
    <div class="mp-lessons">
      ${t.lessons.map((l, i) => {
        const p = ps[i];
        const due = dueByLid[l.id] || 0;
        return `<button class="mp-node ${colorOf(p)}" data-t="${t.id}" data-i="${i}" title="${escH(l.t)}">
          ${ring(p, colorOf(p), 18)}
          <span class="mp-n-name">${escH(l.t)}</span>
          ${due ? `<i class="mp-due" title="${due} بطاقات مستحقة">🔔${due}</i>` : ''}
        </button>`;
      }).join('')}
    </div>
  </div>`).join('');

$('#mapBody').addEventListener('click', e => {
  const n = e.target.closest('.mp-node');
  if (!n) return;
  const t = TRACKS.find(x => x.id === n.dataset.t), i = +n.dataset.i, l = t.lessons[i];
  const p = lessonPct(l), qz = quizMap[l.id], nq = (l.quiz || []).length;
  const due = dueByLid[l.id] || 0;
  const d = $('#mapDetail');
  d.hidden = false;
  d.innerHTML = `
    <div class="mp-d">
      <div class="mp-d-h">${ring(p, colorOf(p), 24)}<div><h3>${escH(l.t)}</h3><span>${escH(t.name)} · الدرس ${i + 1}/${t.lessons.length}</span></div></div>
      <div class="mp-d-rows">
        <div>الحالة: <b class="${doneMap[l.id] ? 'mp-ok' : ''}">${doneMap[l.id] ? 'منجز ✓' : 'متبقٍ'}</b></div>
        <div>المراجعة: <b>${qz ? `أفضل ${qz.best}/${nq}` : 'لم تُجرَ'}</b></div>
        <div>بطاقات مستحقة: <b>${due}</b></div>
      </div>
      <div class="mp-d-act">
        <a class="btn sm" href="index.html#l=${t.id}:${i}">${doneMap[l.id] ? 'أعد الدرس' : 'تابع الدرس'} ←</a>
        <a class="btn ghost sm" href="review.html">المراجعة المتباعدة</a>
        <a class="btn ghost sm" href="lab.html">المختبر</a>
      </div>
    </div>`;
  d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
})();
