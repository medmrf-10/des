/* برمج — متتبع المشاريع: مسار ← مشروع ← مهام محفوظة + صفحة «أعمالي» بالنسب */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const read = k => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
const state = read('prog_v1'), doneMap = state.done || {};
let proj = read('prog_proj');
const save = () => localStorage.setItem('prog_proj', JSON.stringify(proj));

const getTrack = id => TRACKS.find(t => t.id === id);
const lidOf = (tid, li) => { const t = getTrack(tid); return t && t.lessons[li] ? t.lessons[li].id : null; };

/* نفس قائمة proj.js — تتشارك prog_proj معه */
const PROJECTS = [
  { id: 'web1', track: 'web', title: 'صفحة تعريف شخصية',
    desc: 'صفحة من أنت: عنوان، فقرة تعريفية، صورة، قائمة هوايات، وتنسيقات ألوان وصناديق.',
    req: ['web:0', 'web:1', 'web:2', 'web:3', 'web:5', 'web:7'],
    steps: ['عنوان رئيسي باسمك وعنوان فرعي بوصفك', 'فقرة تعريفية من سطرين', 'صورة أو رابط خارجي', 'قائمة غير مرتبة بثلاث هوايات', 'لون خلفية + padding/border للصندوق الرئيسي'] },
  { id: 'web2', track: 'web', title: 'نموذج تواصل بسيط',
    desc: 'نموذج اتصال بحقول نصية وزر، مرتّب بـFlexbox ومعرّف بكلاسات.',
    req: ['web:4', 'web:8', 'web:9'],
    steps: ['حقل اسم + حقل بريد + textarea رسالة', 'كلاسات ومعرفات لكل حقل', 'زر إرسال منسّق', 'ترتيب الحقول بـFlexbox عمودياً'] },
  { id: 'web3', track: 'web', title: 'صفحة مقال منسّقة',
    desc: 'مقال قصير بعناوين متدرجة وفقرات واقتباس، بخطوط وألوان متناسقة.',
    req: ['web:1', 'web:3', 'web:5', 'web:6'],
    steps: ['h1 للعنوان وh2 للأقسام', 'ثلاث فقرات على الأقل', 'قائمة نقاط للأفكار الرئيسية', 'لون نص وخلفية وحجم خط منسّق'] },
  { id: 'js1', track: 'js', title: 'عدّاد تفاعلي',
    desc: 'عدّاد بزرين (+ و −) يحدّث رقماً على الصفحة مباشرة.',
    req: ['js:1', 'js:2', 'js:3', 'js:4', 'js:5'],
    steps: ['متغير count وعنصر يعرضه', 'دالة زيادة ودالة إنقاص', 'ربط الزرين بـonclick أو addEventListener', 'تحديث نص العنصر عند كل ضغطة'] },
  { id: 'js2', track: 'js', title: 'قائمة مهام',
    desc: 'إضافة مهام وحذفها وإظهار عددها — تطبيق DOM ومصفوفات كامل.',
    req: ['js:4', 'js:6', 'js:7', 'js:11', 'js:12'],
    steps: ['حقل إدخال + زر «أضف»', 'مصفوفة تخزّن المهام', 'forEach يرسم القائمة بعد كل تغيير', 'زر حذف لكل مهمة'] },
  { id: 'js3', track: 'js', title: 'اختبار قصير',
    desc: 'أسئلة اختيار متعدد بنتيجة نهائية — شروط ومصفوفات ودوال.',
    req: ['js:3', 'js:6', 'js:7', 'js:8'],
    steps: ['مصفوفة أسئلة {سؤال، خيارات، صحيحة}', 'عرض سؤالاً بسؤال', 'عدّاد نتيجة بالشروط', 'إظهار الدرجة النهائية'] },
  { id: 'py1', track: 'py', title: 'آلة حاسبة نصية',
    desc: 'تقرأ عددين وعملية وتطبع الناتج — إدخال وشروط.',
    req: ['py:0', 'py:1', 'py:2', 'py:3'],
    steps: ['input() يقرأ عددين', 'input() يقرأ العملية (+ − × ÷)', 'if/elif تختار العملية', 'print الناتج'] },
  { id: 'py2', track: 'py', title: 'لعبة تخمين رقم',
    desc: 'البرنامج يختار رقماً والمستخدم يخمّنه مع تلميحات أكبر/أصغر.',
    req: ['py:1', 'py:2', 'py:3', 'py:4'],
    steps: ['رقم سري ثابت أو عشوائي (import random)', 'حلقة تكرار للمحاولات', 'تلميح «أكبر»/«أصغر» بالشروط', 'عدّاد محاولات + رسالة فوز'] },
  { id: 'py3', track: 'py', title: 'مدير ملاحظات نصي',
    desc: 'قائمة ملاحظات: إضافة وعرض وحذف عبر دوال وقوائم.',
    req: ['py:4', 'py:5', 'py:6', 'py:7'],
    steps: ['قائمة notes فارغة', 'دالة إضافة ودالة عرض ودالة حذف', 'قائمة أوامر: أضف/اعرض/احذف/اخرج', 'طباعة منسّقة بـf-string'] },
  { id: 'jsm1', track: 'jsm', title: 'تطبيق قائمة تسوق',
    desc: 'قائمة تسوق ديناميكية: إضافة عناصر بـcreateElement وحذفها وتحديدها.',
    req: ['jsm:0', 'jsm:1', 'jsm:2', 'jsm:3', 'jsm:6'],
    steps: ['createElement لكل عنصر جديد', 'addEventListener للإضافة والحذف', 'تفويض أحداث على قائمة العناصر', 'حفظ القائمة في localStorage'] },
  { id: 'jsm2', track: 'jsm', title: 'جالب بيانات',
    desc: 'واجهة تجلب بيانات ويعرضها — fetch وasync/await ومعالجة أخطاء.',
    req: ['jsm:5', 'jsm:7', 'jsm:8', 'jsm:9'],
    steps: ['fetch لمصدر بيانات (نقطة /api التجريبية أو خارجية)', 'async/await مع try/catch', 'عرض النتائج كبطاقات', 'حالة تحميل أثناء الجلب'] },
  { id: 'jsm3', track: 'jsm', title: 'منشئ بطاقات ديناميكي',
    desc: 'مصفوفة كائنات تتحول لبطاقات مرسومة — map/filter وclass.',
    req: ['jsm:0', 'jsm:3', 'jsm:4', 'jsm:10'],
    steps: ['مصفوفة كائنات بيانات', 'map تحوّل كل كائن لبطاقة HTML', 'filter للبحث أو الفرز', 'class للهيكل (اختياري)'] },
];

let selTrack = 'all', selProj = null;

function projMeta(p) {
  const reqs = p.req.map(r => { const [tid, li] = r.split(':'); return { tid, li: +li, lid: lidOf(tid, +li) }; });
  const dn = reqs.filter(r => r.lid && doneMap[r.lid]).length;
  const reqPct = Math.round(dn / reqs.length * 100);
  const steps = proj[p.id] || {};
  const stDone = Object.keys(steps).filter(i => steps[i]).length;
  const stPct = Math.round(stDone / p.steps.length * 100);
  return { reqs, dn, reqPct, stDone, stPct, unlocked: reqPct >= 60, pct: stPct };
}

/* ---------- «أعمالي» — المشاريع ذات التقدم ---------- */
function renderMine() {
  const mine = PROJECTS.map(p => ({ p, m: projMeta(p) })).filter(x => x.m.stDone > 0);
  $('#pjMine').innerHTML = mine.length ? `
    <h3 class="sec-h">أعمالي</h3>
    <div class="ptr-mine">${mine.map(({ p, m }) => `
      <button class="ptr-chip" data-p="${p.id}">
        <span class="ptr-chip-t">${escH(p.title)}</span>
        <span class="track-bar sm"><i style="width:${m.pct}%"></i></span>
        <b>${m.pct}%</b>
      </button>`).join('')}</div>` : `
    <h3 class="sec-h">أعمالي</h3>
    <p class="ptr-empty">لم تبدأ مشروعاً بعد — اختر مساراً ثم مشروعاً وعلّم مهامه المنجزة.</p>`;
}

/* ---------- تبويبات المسارات ---------- */
const TABS = [{ id: 'all', name: 'الكل' }].concat(TRACKS.map(t => ({ id: t.id, name: t.name })));
function renderTabs() {
  $('#pjTabs').innerHTML = TABS.map(t =>
    `<button class="ptab ${selTrack === t.id ? 'on' : ''}" data-t="${t.id}">${escH(t.name)}</button>`).join('');
}

/* ---------- قائمة المشاريع ---------- */
function renderList() {
  const ps = PROJECTS.filter(p => selTrack === 'all' || p.track === selTrack);
  $('#pjList').innerHTML = `<div class="ptr-grid">${ps.map(p => {
    const m = projMeta(p), tn = getTrack(p.track).name;
    return `<button class="ptr-card ${m.pct === 100 ? 'done' : ''}" data-p="${p.id}">
      <div class="ptr-card-t">${m.pct === 100 ? '🏆' : m.unlocked ? '🔓' : '🔒'} ${escH(p.title)}</div>
      <div class="ptr-card-tr">${escH(tn)}</div>
      <div class="ptr-card-d">${escH(p.desc)}</div>
      <div class="track-bar" style="margin:10px 0"><i style="width:${m.pct}%"></i></div>
      <div class="ptr-card-m">مهام: ${m.stDone}/${p.steps.length} · دروس: ${m.dn}/${m.reqs.length}</div>
    </button>`;
  }).join('')}</div>`;
}

/* ---------- تفاصيل المشروع ---------- */
function renderDetail() {
  const p = PROJECTS.find(x => x.id === selProj), d = $('#pjDetail');
  if (!p) { d.hidden = true; return; }
  const m = projMeta(p), tn = getTrack(p.track).name;
  d.hidden = false;
  d.innerHTML = `
    <div class="ptr-d">
      <div class="ptr-d-h">
        <div><h3>${escH(p.title)}</h3><span class="ptr-d-tr">${escH(tn)} · ${m.stDone}/${p.steps.length} مهمة · ${m.pct}%</span></div>
        <button class="btn ghost sm" id="pjClose">✕</button>
      </div>
      <div class="track-bar" style="margin:10px 0"><i style="width:${m.pct}%"></i></div>
      <p class="ptr-d-desc">${escH(p.desc)}</p>
      ${m.unlocked ? '' : `<div class="ptr-lock">🔒 تُفعّل المهام عند إتمام 60% من الدروس المطلوبة (${m.reqPct}% الآن):</div>`}
      <div class="ptr-reqs">${m.reqs.map(r => {
        const t = getTrack(r.tid), l = t.lessons[r.li];
        const dn = r.lid && doneMap[r.lid];
        return `<a class="pj-req ${dn ? 'ok' : ''}" href="index.html#l=${r.tid}:${r.li}">${dn ? '✓' : '○'} ${escH(l.t)}</a>`;
      }).join('')}</div>
      <div class="ptr-steps-h">المهام</div>
      <div class="ptr-steps">${p.steps.map((s, i) => `
        <label class="pj-step ${m.unlocked ? '' : 'lock'}">
          <input type="checkbox" data-i="${i}" ${(proj[p.id] || {})[i] ? 'checked' : ''} ${m.unlocked ? '' : 'disabled'}>
          <span>${escH(s)}</span>
        </label>`).join('')}</div>
      ${m.pct === 100 ? '<div class="ptr-win">🏆 مشروع منجز بالكامل!</div>' : ''}
    </div>`;
  $('#pjClose').onclick = () => { selProj = null; renderDetail(); };
  d.querySelectorAll('input[type=checkbox]').forEach(cb => cb.onchange = () => {
    if (!proj[p.id]) proj[p.id] = {};
    proj[p.id][cb.dataset.i] = cb.checked;
    save();
    renderMine(); renderList(); renderDetail();
  });
  d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

$('#pjTabs').addEventListener('click', e => {
  const b = e.target.closest('.ptab'); if (!b) return;
  selTrack = b.dataset.t; renderTabs(); renderList();
});
document.addEventListener('click', e => {
  const c = e.target.closest('.ptr-card, .ptr-chip');
  if (c) { selProj = c.dataset.p; renderDetail(); }
});

renderMine(); renderTabs(); renderList();
})();
