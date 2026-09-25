/* برمج — درس اليوم: توصية ذكية من تقدم localStorage + مراجعة سريعة */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const LS = 'prog_v1';
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let state = {};
try { state = JSON.parse(localStorage.getItem(LS) || '{}') || {}; } catch (e) { state = {}; }
const doneMap = state.done || {}, coursesMap = state.courses || {};

/* ---------- قراءة التقدم ---------- */
// دروس تفاعلية (TRACKS) — الأكثر تقدماً = أعلى نسبة إنجاز
function trackProgress(t) {
  const d = t.lessons.filter(l => doneMap[l.id]).length;
  return { done: d, total: t.lessons.length, ratio: d / t.lessons.length };
}
const stats = TRACKS.map(t => Object.assign({ t }, trackProgress(t)));
stats.sort((a, b) => b.done - a.done || b.ratio - a.ratio);
const top = stats[0];

// أول درس غير مكتمل في المسار الأكثر تقدماً
let rec = null;
if (top.done === 0) {
  const t = TRACKS[0], li = 0;
  rec = { kind: 'lesson', t, li, l: t.lessons[li], why: 'لم تبدأ بعد — هذه بدايتك.' };
} else {
  const li = top.t.lessons.findIndex(l => !doneMap[l.id]);
  rec = li >= 0
    ? { kind: 'lesson', t: top.t, li, l: top.t.lessons[li], why: `أكمل ${top.done}/${top.total} في «${top.t.name}».` }
    : { kind: 'done', t: top.t, why: `أتممت مسار «${top.t.name}» كله!` };
}

// تقدم الكورسات (checkboxes) — أكثر مسار وكورس تقدماً
let courseRec = null;
const C = window.COURSES;
if (C && C.tracks) {
  const cStats = C.tracks.map((t, ti) => {
    let done = 0, total = 0;
    t.courses.forEach(c => { const cid = c.id || ''; total += (c.chapters || []).reduce((n, ch) => n + (ch.lessons || []).length, 0); done += Object.keys(coursesMap).filter(k => k.startsWith(ti + '|' + cid + '|') && coursesMap[k]).length; });
    return { t, ti, done, total };
  }).filter(s => s.done > 0 && s.done < s.total);
  cStats.sort((a, b) => (b.done / b.total) - (a.done / a.total));
  const ct = cStats[0];
  if (ct) {
    // أول درس غير مُعلَّم في المسار
    outer: for (const c of ct.t.courses) {
      const cid = c.id || '';
      for (let chi = 0; chi < (c.chapters || []).length; chi++) {
        const ch = c.chapters[chi];
        for (let li = 0; li < (ch.lessons || []).length; li++) {
          if (!coursesMap[`${ct.ti}|${cid}|${chi}|${li}`]) {
            courseRec = { ti: ct.ti, track: ct.t.name, course: c, chapter: ch.name, lesson: ch.lessons[li] };
            break outer;
          }
        }
      }
    }
  }
}

// تقدير الوقت: من اسم الدرس «(47:34)» إن وُجد، وإلا ~10 دقائق
function estMin(name) {
  const m = String(name).match(/\((\d+):(\d{2})(?::(\d{2}))?\)/);
  if (m) return m[3] ? (+m[1] * 60 + +m[2]) : +m[1];
  const m2 = String(name).match(/\((\d+)\s*min\)/i);
  if (m2) return +m2[1];
  return 10;
}

/* ---------- مراجعة سريعة: 3 أسئلة من دروس مكتملة ---------- */
const pool = [];
TRACKS.forEach(t => t.lessons.forEach(l => {
  if (doneMap[l.id]) (l.quiz || []).forEach(q => pool.push({ q: q.q, o: q.o, a: q.a, lesson: l.t }));
}));
const revQs = pool.sort(() => Math.random() - .5).slice(0, 3);

/* ---------- العرض ---------- */
const pct = top.total ? Math.round(top.done / top.total * 100) : 0;
$('#todayBar').style.width = pct + '%';

let html = `
  <div class="tday-card">
    <div class="tday-tag">درسك اليوم</div>
    ${rec.kind === 'done'
      ? `<h2>أتممت مسار «${escH(rec.t.name)}» كله 🎓</h2>
         <p class="tday-why">جرّب مساراً جديداً أو كورساً من خارطة الكورسات.</p>`
      : `<h2>${escH(rec.l.t)}</h2>
         <div class="tday-meta">${escH(rec.t.name)} · الدرس ${rec.li + 1}/${rec.t.lessons.length} · ~${estMin(rec.l.t)} دقيقة</div>
         <p class="tday-why">${escH(rec.why)}</p>
         <a class="btn tday-open" href="index.html#l=${rec.t.id}:${rec.li}">افتح الدرس ←</a>`}
  </div>`;

if (courseRec) {
  html += `
  <div class="tday-card tday-course">
    <div class="tday-tag">في خارطة الكورسات</div>
    <h2>${escH(courseRec.lesson)}</h2>
    <div class="tday-meta">${escH(courseRec.track)} ← ${escH(courseRec.course.title || '')} ← ${escH(courseRec.chapter || '')} · ~${estMin(courseRec.lesson)} دقيقة</div>
    <a class="btn ghost tday-open" href="index.html#courses">افتح خارطة الكورسات ←</a>
  </div>`;
}

/* مراجعة سريعة */
html += `<h3 class="sec-h" style="margin-top:26px">مراجعة سريعة — أبقِ القديم حياً</h3>`;
if (!revQs.length) {
  html += `<div class="c-empty">لا مراجعة بعد — أكمل أول درس وتظهر أسئلة التثبيت هنا.</div>`;
} else {
  html += `<div id="revBox" class="tday-rev">` + revQs.map((q, i) => `
    <div class="ex-wrong" data-qi="${i}">
      <div class="ex-w-q">${i + 1}. ${q.q} <span class="c-cnt">${escH(q.lesson)}</span></div>
      <div class="tday-opts">${q.o.map((o, oi) => `<button class="ex-opt sm" data-qi="${i}" data-oi="${oi}">${o}</button>`).join('')}</div>
      <div class="ex-w-a" hidden>الصحيحة: ${q.o[q.a]}</div>
    </div>`).join('') + `
    <div class="ex-sub" id="revScore" hidden></div></div>`;
}
$('#todayBody').innerHTML = html;

/* إجابات المراجعة */
let revAns = {};
document.querySelectorAll('.tday-opts .ex-opt').forEach(b => b.onclick = () => {
  const qi = +b.dataset.qi, oi = +b.dataset.oi;
  if (revAns[qi] !== undefined) return;
  revAns[qi] = oi;
  const q = revQs[qi], box = b.closest('.ex-wrong');
  box.querySelectorAll('.ex-opt').forEach(x => {
    const i = +x.dataset.oi;
    if (i === q.a) x.classList.add('ok'); else if (i === oi) x.classList.add('bad');
    x.disabled = true;
  });
  box.querySelector('.ex-w-a').hidden = false;
  if (Object.keys(revAns).length === revQs.length) {
    const ok = revQs.filter((q, i) => revAns[i] === q.a).length;
    const s = $('#revScore');
    s.hidden = false;
    s.innerHTML = `نتيجة المراجعة: <b>${ok}/${revQs.length}</b>${ok === revQs.length ? ' — ذاكرتك قوية!' : ''}`;
  }
});
})();
