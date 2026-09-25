/* برمج — مسارات التعلم: أعمدة بصرية لكل مسار ببطاقات ملوّنة بنسبة الإنجاز */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const LS = 'prog_v1';
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let state = {};
try { state = JSON.parse(localStorage.getItem(LS) || '{}') || {}; } catch (e) { state = {}; }
const doneMap = state.done || {}, coursesMap = state.courses || {};

/* إحصاء الكورسات: 8416 درساً */
const C = window.COURSES;
const cDoneAll = Object.keys(coursesMap).filter(k => coursesMap[k]).length;
const lDoneAll = Object.keys(doneMap).filter(k => doneMap[k]).length;
const cTotalAll = C && C.tracks ? C.tracks.reduce((n, t) => n + t.courses.reduce((m, c) => m + (c.chapters || []).reduce((x, ch) => x + (ch.lessons || []).length, 0), 0), 0) : 0;
const lTotalAll = TRACKS.reduce((n, t) => n + t.lessons.length, 0);
const allDone = cDoneAll + lDoneAll, allTot = cTotalAll + lTotalAll;
$('#pathsBar').style.width = allTot ? Math.round(allDone / allTot * 100) + '%' : '0%';

/* لون البطاقة حسب نسبة الإنجاز: 0 كحلي باهت → أخضر */
function pctColor(p) {
  if (p >= 100) return 'ok';
  if (p > 0) return 'part';
  return '';
}

$('#pathsStats').innerHTML = `
  <div class="pt-stats">
    <div class="pt-num"><b>${allDone}</b> / ${allTot} درساً مكتملاً</div>
    <div class="pt-break">تفاعلية: ${lDoneAll}/${lTotalAll} · خارطة الكورسات: ${cDoneAll}/${cTotalAll}</div>
  </div>`;

/* مساراتك التفاعلية — عمود لكل مسار، بطاقة لكل درس */
let html = `<h3 class="sec-h">مساراتك التفاعلية</h3><div class="pt-cols">`;
html += TRACKS.map(t => {
  const d = t.lessons.filter(l => doneMap[l.id]).length;
  const p = Math.round(d / t.lessons.length * 100);
  return `<div class="pt-col">
    <div class="pt-col-head">
      <span class="pt-col-name">${escH(t.name)}</span>
      <span class="pt-col-cnt">${d}/${t.lessons.length}</span>
    </div>
    <div class="track-bar"><i style="width:${p}%"></i></div>
    <div class="pt-cards">
      ${t.lessons.map((l, i) => {
        const dn = !!doneMap[l.id];
        return `<a class="pt-card ${dn ? 'ok' : ''}" href="index.html#l=${t.id}:${i}">
          <span class="pt-card-num">${dn ? '✓' : i + 1}</span>
          <span class="pt-card-t">${escH(l.t)}</span>
        </a>`;
      }).join('')}
    </div>
  </div>`;
}).join('');
html += `</div>`;

/* خارطة الكورسات — عمود لكل مسار، بطاقة لكل كورس ملوّنة بنسبته */
if (C && C.tracks && C.tracks.length) {
  html += `<h3 class="sec-h" style="margin-top:30px">خارطة الكورسات — ${cTotalAll} درساً</h3><div class="pt-cols">`;
  html += C.tracks.map((t, ti) => {
    const cards = t.courses.map((c, ci) => {
      const cid = c.id || String(ci);
      const tot = (c.chapters || []).reduce((n, ch) => n + (ch.lessons || []).length, 0);
      const dn = Object.keys(coursesMap).filter(k => k.startsWith(ti + '|' + cid + '|') && coursesMap[k]).length;
      const p = tot ? Math.round(dn / tot * 100) : 0;
      return { c, ci, tot, dn, p };
    });
    const tDone = cards.reduce((n, x) => n + x.dn, 0), tTot = cards.reduce((n, x) => n + x.tot, 0);
    const tp = tTot ? Math.round(tDone / tTot * 100) : 0;
    return `<div class="pt-col">
      <div class="pt-col-head">
        <span class="pt-col-name">${escH(t.name)}</span>
        <span class="pt-col-cnt">${tDone}/${tTot}</span>
      </div>
      <div class="track-bar"><i style="width:${tp}%"></i></div>
      <div class="pt-cards">
        ${cards.map(x => `<a class="pt-card pt-course ${pctColor(x.p)}" href="index.html#courses=${ti}:${x.ci}">
          <span class="pt-card-t">${escH(x.c.title || 'كورس')}</span>
          <span class="pt-card-meta">${x.dn}/${x.tot}</span>
          <span class="pt-fill"><i style="width:${x.p}%"></i></span>
        </a>`).join('')}
      </div>
    </div>`;
  }).join('');
  html += `</div>`;
}

$('#pathsBody').innerHTML = html;
})();
