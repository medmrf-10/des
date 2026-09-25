/* برمج — مشاريع مصغّرة: بطاقات مشاريع لكل مسار، تُفتح عند 60%+ من دروسها المطلوبة */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const LS = 'prog_v1', LP = 'prog_proj';
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let state = {};
try { state = JSON.parse(localStorage.getItem(LS) || '{}') || {}; } catch (e) { state = {}; }
const doneMap = state.done || {};
let projState = {};
try { projState = JSON.parse(localStorage.getItem(LP) || '{}') || {}; } catch (e) { projState = {}; }
const saveProj = () => localStorage.setItem(LP, JSON.stringify(projState));

const getTrack = id => TRACKS.find(t => t.id === id);
const lidOf = (tid, li) => { const t = getTrack(tid); return t && t.lessons[li] ? t.lessons[li].id : null; };

/* المشاريع — req: [tid:li] الدروس المطلوبة، steps: خطوات التحقيق */
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

function projOf(p) {
  const reqs = p.req.map(r => { const [tid, li] = r.split(':'); return { tid, li: +li, lid: lidOf(tid, +li) }; });
  const tot = reqs.length;
  const dn = reqs.filter(r => r.lid && doneMap[r.lid]).length;
  const pct = Math.round(dn / tot * 100);
  const steps = projState[p.id] || {};
  const stDone = Object.keys(steps).filter(k => steps[k]).length;
  return { reqs, tot, dn, pct, unlocked: pct >= 60, steps, stDone };
}

const TRACK_GROUPS = [
  { tid: 'web', name: 'أساسيات HTML وCSS' },
  { tid: 'js', name: 'أساسيات JavaScript' },
  { tid: 'py', name: 'أساسيات Python' },
  { tid: 'jsm', name: 'JavaScript متوسط' },
];

function render() {
  const el = $('#projBody');
  el.innerHTML = TRACK_GROUPS.map(g => {
    const ps = PROJECTS.filter(p => p.track === g.tid);
    if (!ps.length) return '';
    return `<h3 class="sec-h">${escH(g.name)}</h3><div class="pj-grid">${ps.map(p => card(p)).join('')}</div>`;
  }).join('');
}

function card(p) {
  const m = projOf(p);
  const reqList = m.reqs.map(r => {
    const t = getTrack(r.tid), l = t.lessons[r.li];
    const dn = r.lid && doneMap[r.lid];
    return `<a class="pj-req ${dn ? 'ok' : ''}" href="index.html#l=${r.tid}:${r.li}" title="${escH(t.name)}">${dn ? '✓' : '○'} ${escH(l.t)}</a>`;
  }).join('');
  const stepsHtml = p.steps.map((s, i) => {
    const on = m.steps[i];
    return `<label class="pj-step ${m.unlocked ? '' : 'lock'}" data-p="${p.id}" data-i="${i}">
      <input type="checkbox" ${on ? 'checked' : ''} ${m.unlocked ? '' : 'disabled'}> <span>${escH(s)}</span>
    </label>`;
  }).join('');
  return `<div class="pj-card ${m.unlocked ? 'open' : 'lock'}">
    <div class="pj-head">
      <div class="pj-title">${m.unlocked ? '🔓' : '🔒'} ${escH(p.title)}</div>
      <div class="pj-pct">${m.dn}/${m.tot} درساً · ${m.pct}%</div>
    </div>
    <div class="pj-desc">${escH(p.desc)}</div>
    <div class="track-bar" style="margin:10px 0"><i style="width:${m.pct}%"></i></div>
    ${m.unlocked ? '' : '<div class="pj-locknote">أكمل 60% من الدروس المطلوبة ليفتح المشروع — الدروس بالأسفل:</div>'}
    <div class="pj-reqs">${reqList}</div>
    <div class="pj-steps"><div class="pj-steps-h">خطوات التحقيق ${m.stDone}/${p.steps.length}</div>${stepsHtml}</div>
  </div>`;
}

$('#projBody').addEventListener('change', e => {
  const lb = e.target.closest('.pj-step');
  if (!lb) return;
  const pid = lb.dataset.p, i = lb.dataset.i;
  if (!projState[pid]) projState[pid] = {};
  projState[pid][i] = e.target.checked;
  saveProj();
  render();
});

render();
})();
