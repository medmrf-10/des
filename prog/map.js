/* برمج — خريطة الإتقان: عقد مهارات مترابطة تُفتح بالترتيب وتقيس تقدمك من كل أدوات المنصة */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const read = k => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
const v1 = read('prog_v1'), projMap = read('prog_proj'), labMap = read('prog_lab'),
  dbg = read('prog_debug'), ref = read('prog_refact'), tw = read('prog_testw'),
  pat = read('prog_patterns'), sqlMap = read('prog_sql'), rx = read('prog_regex'),
  rd = read('prog_read'), bo = read('prog_bigo'), gf = read('prog_git'), ad = read('prog_api');
const doneMap = v1.done || {};
const REV = read('prog_review'), EXAM = read('prog_exam'), LV = read('prog_level');

/* فهرس الدروس: id → موقعها */
const LIDX = {};
TRACKS.forEach(t => t.lessons.forEach((l, i) => { LIDX[l.id] = { t, i, l }; }));
const range = (p, n) => Array.from({ length: n }, (_, i) => p + (i + 1));
const lessPct = ids => Math.round(100 * ids.filter(id => doneMap[id]).length / ids.length);
const okPct = (map, ids) => Math.round(100 * ids.filter(id => { const v = map[id]; return v === true || (v && v.ok); }).length / ids.length);
/* أدوات «سلسلة/دقة» لا تخزن لكل عنصر: تغطية × دقة */
const accPct = (o, n) => { const a = o.answered || 0; return a ? Math.round(100 * (o.correct / a) * Math.min(1, a / n)) : 0; };
/* خطوات المشاريع المنجزة من 49 */
const projDone = Object.keys(projMap).reduce((n, p) => n + Object.keys(projMap[p] || {}).filter(i => projMap[p][i]).length, 0);
const projPct = Math.min(100, Math.round(100 * projDone / 49));
const dueNow = Object.values(REV).filter(d => d && d.nextReview && new Date(d.nextReview).getTime() <= Date.now()).length;

const DBG = ['off1', 'off2', 'sc1', 'sc2', 'async1', 'async2', 'dom1', 'dom2', 'co1', 'lp1'];
const HUNT = range('h', 12).map(x => 'hunt:' + x);
const READS = ['hoist1', 'co1', 'str1', 'red1', 'cl1', 'cl2', 'ds1', 'th1', 'th2', 'async1', 'async2', 'async3'];
const REFS = ['magic', 'nest', 'long', 'dup', 'bool', 'loop', 'str', 'sw', 'var', 'arg'];
const PATS = ['factory', 'module', 'observer', 'strategy', 'decorator', 'adapter', 'builder', 'command'];
const TESTS = ['sum', 'fizz', 'pal', 'clone', 'group', 'deb', 'bs', 'lru', 'camel', 'range'];
const SQLS = ['sel1', 'wh1', 'ord1', 'lim1', 'jn1', 'grp1', 'hv1', 'sub1', 'upd1', 'del1'];
const RXS = ['word', 'digits', 'ardigits', 'anchor', 'end', 'either', 'email', 'date', 'tag', 'price', 'hex', 'dupe'];
const LABS = ['v1', 'v2', 'c1', 'c2', 'l1', 'l2', 'f1', 'f2', 'a1', 'a2', 'o1', 'b1'];

/* عقد المهارات: req يجب ≥40% لتُفتح، sig = مصادر الإتقان، proj = مشروع مقترح */
const SKILLS = [
  { id: 'core', icon: '🧱', name: 'أساسيات JavaScript', req: [],
    sig: [{ t: 'دروس الأساسيات', pct: lessPct(range('j', 14)) }, { t: 'تحديات المختبر الأولى', pct: okPct(labMap, ['v1', 'v2', 'c1', 'c2']) }],
    tools: [['الدروس', 'index.html'], ['المختبر', 'lab.html']],
    proj: { t: 'عدّاد + قائمة مهام', d: 'متغيرات وشروط وحلقات ودوال في صفحة واحدة بلا مكتبات.' } },
  { id: 'webui', icon: '🖥️', name: 'واجهة الويب وDOM', req: ['core'],
    sig: [{ t: 'دروس HTML/CSS وDOM', pct: lessPct([...range('h', 6), ...range('c', 6), 'j5', 'j6', 'm1', 'm2', 'm3']) }],
    tools: [['الدروس', 'index.html'], ['المُنشِئ', 'playground.html']],
    proj: { t: 'موقعك الشخصي', d: 'صفحة تعريف + نموذج تواصل + قائمة هوايات منسّقة بالفلكس.' } },
  { id: 'mid', icon: '⚡', name: 'JavaScript متوسط', req: ['core'],
    sig: [{ t: 'دروس JS المتوسط', pct: lessPct(Array.from({ length: 10 }, (_, i) => 'm' + (i + 4))) }, { t: 'اقرأ الكود', pct: okPct(rd, READS) }],
    tools: [['الدروس', 'index.html'], ['اقرأ الكود', 'code_reading.html']],
    proj: { t: 'تطبيق ملاحظات', d: 'JSON + localStorage + fetch وasync/await وواجهة كاملة.' } },
  { id: 'py', icon: '🐍', name: 'أساسيات Python', req: ['core'],
    sig: [{ t: 'دروس بايثون', pct: lessPct(range('p', 8)) }],
    tools: [['الدروس', 'index.html']],
    proj: { t: 'سكربت تحليل نص', d: 'اقرأ ملفاً واستخرج إحصاءات: كلمات وتكرارات وأطول جملة.' } },
  { id: 'solve', icon: '🧩', name: 'حلّ المسائل', req: ['core'],
    sig: [{ t: 'تحديات المختبر', pct: okPct(labMap, LABS) }],
    tools: [['المختبر', 'lab.html']],
    proj: { t: 'أكمل الـ12 تحدياً', d: 'كل تحدٍّ في المختبر يقيس مهارة — أنجزها كلها بلا حلول.' } },
  { id: 'git', icon: '🌿', name: 'Git وواجهات API', req: ['core'],
    sig: [{ t: 'تدفق Git', pct: accPct(gf, 10) }, { t: 'مصمّم API', pct: accPct(ad, 8) }],
    tools: [['تدفق Git', 'git_flow.html'], ['مصمّم API', 'api_design.html']],
    proj: { t: 'انشر مشروعاً على GitHub', d: 'commit صغيرة متكررة + README + فرع وPR واحد على الأقل.' } },
  { id: 'debug', icon: '🐛', name: 'التنقيح', req: ['solve'],
    sig: [{ t: 'المُنقِّح', pct: okPct(dbg, DBG) }, { t: 'صائد الأخطاء', pct: okPct(dbg, HUNT) }],
    tools: [['المُنقِّح', 'debugger.html'], ['صائد الأخطاء', 'debug_hunt.html']],
    proj: { t: 'يوم تنقيح', d: 'خذ مشروعاً قديماً وأصلح فيه 3 أخطاء حقيقية موثّقة.' } },
  { id: 'sql', icon: '🗄️', name: 'قواعد البيانات', req: ['mid'],
    sig: [{ t: 'مختبر SQL', pct: okPct(sqlMap, SQLS) }],
    tools: [['مختبر SQL', 'sql_lab.html']],
    proj: { t: 'لوحة إحصاءات', d: 'جدولان مترابطان + استعلامات GROUP BY تعرض أرقاماً حية.' } },
  { id: 'rx', icon: '🔎', name: 'الريجيكس', req: ['solve'],
    sig: [{ t: 'مختبر الريجيكس', pct: okPct(rx, RXS) }],
    tools: [['مختبر الريجيكس', 'regex.html']],
    proj: { t: 'مُنقّي مدخلات', d: 'نموذج يتحقق من البريد والتاريخ والأرقام العربية قبل الإرسال.' } },
  { id: 'bigo', icon: '📈', name: 'تعقيد الخوارزميات', req: ['solve'],
    sig: [{ t: 'حاسبة التعقيد', pct: accPct(bo, 12) }],
    tools: [['حاسبة التعقيد', 'big_o.html']],
    proj: { t: 'سباق خوارزميتين', d: 'قِس زمن بحث خطي وثنائي على مليون عنصر واعرض الفرق.' } },
  { id: 'clean', icon: '✨', name: 'كود نظيف وأنماط', req: ['mid'],
    sig: [{ t: 'المُعيد', pct: okPct(ref, REFS) }, { t: 'أنماط التصميم', pct: okPct(pat, PATS) }],
    tools: [['المُعيد', 'refactor.html'], ['الأنماط', 'patterns.html']],
    proj: { t: 'أعد هيكلة مشروعك', d: 'قسّم أطول دالة عندك واستبدل switch بجدول — وثّق قبل/بعد.' } },
  { id: 'test', icon: '🧪', name: 'كتابة الاختبارات', req: ['clean'],
    sig: [{ t: 'كاتب الاختبارات', pct: okPct(tw, TESTS) }],
    tools: [['كاتب الاختبارات', 'test_writer.html']],
    proj: { t: 'غطِّ مشروعاً بالاختبارات', d: 'لخمس دوال في أحد مشاريعك: حالة عادية + حدّ + حالة فاشلة.' } },
  { id: 'proj', icon: '🏗️', name: 'المشاريع', req: ['webui', 'mid'],
    sig: [{ t: 'خطوات المشاريع', pct: projPct }],
    tools: [['المشاريع', 'project.html'], ['المُنشِئ', 'playground.html']],
    proj: { t: 'مشروع التخرّج', d: 'تطبيق كامل: واجهة + منطق + تخزين + اختبار — انشره برابط.' } }
];

const UNLOCK = 40;
const pctOf = s => Math.round(s.sig.reduce((a, x) => a + x.pct, 0) / s.sig.length);
const meta = {};
SKILLS.forEach(s => { meta[s.id] = s; s.pct = pctOf(s); });
SKILLS.forEach(s => { s.open = s.req.every(r => (meta[r].pct || 0) >= UNLOCK); s.master = s.open && s.pct >= 80; });

const go = x => meta[x].req.length ? 1 + Math.max(...meta[x].req.map(go)) : 0;
const depth = id => go(id);
const layers = [];
SKILLS.forEach(s => { const d = depth(s.id); (layers[d] = layers[d] || []).push(s); });

/* حلقة SVG */
function ring(pct, cls, r) {
  const c = 2 * Math.PI * r, off = c * (1 - pct / 100);
  return `<svg class="mp-ring ${cls}" viewBox="0 0 ${r * 2 + 8} ${r * 2 + 8}" width="${r * 2 + 8}" height="${r * 2 + 8}">
    <circle class="mp-bg" cx="${r + 4}" cy="${r + 4}" r="${r}" fill="none" stroke-width="4"/>
    <circle class="mp-fg" cx="${r + 4}" cy="${r + 4}" r="${r}" fill="none" stroke-width="4"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" stroke-linecap="round"
      transform="rotate(-90 ${r + 4} ${r + 4})"/>
    <text x="${r + 4}" y="${r + 8}" text-anchor="middle" class="mp-txt">${pct}%</text></svg>`;
}
const colorOf = p => p >= 80 ? 'green' : p >= 40 ? 'gold' : 'gray';
const stateOf = s => !s.open ? 'lock' : s.master ? 'green' : s.pct >= 40 ? 'gold' : 'gray';

/* الرأس */
const overall = Math.round(SKILLS.reduce((a, s) => a + s.pct, 0) / SKILLS.length);
const mastered = SKILLS.filter(s => s.master).length;
const nextSkill = SKILLS.filter(s => s.open && !s.master).sort((a, b) => a.pct - b.pct)[0];
$('#mapHead').innerHTML = `
  <div class="mp-head">
    <div class="mp-overall">${ring(overall, colorOf(overall), 34)}
      <div><b>${overall}%</b><span>إتقان الخريطة</span></div></div>
    <div class="mp-extras">
      <span>مهارات متقنة: ${mastered}/${SKILLS.length}</span> ·
      <span>مراجعة مستحقة: ${dueNow} بطاقة</span> ·
      <span>مشاريع: ${projDone}/49 خطوة</span>
    </div>
    <div class="mp-next">${nextSkill
      ? `خطوتك التالية: أتقن <b>${escH(nextSkill.icon)} ${escH(nextSkill.name)}</b> (${nextSkill.pct}%) — ${escH(nextSkill.proj.t)}`
      : 'أتقنت الخريطة كلها 🎓'}</div>
  </div>`;

/* الجسم: طبقات + SVG وصلات */
$('#mapBody').innerHTML = `<svg class="mp-edges" id="mpEdges"></svg>` + layers.map((row, li) => `
  <div class="mp-layer" data-layer="${li}">
    ${li > 0 ? `<div class="mp-ltag">الطبقة ${li}</div>` : `<div class="mp-ltag">الأساس</div>`}
    <div class="mp-row">${row.map(s => `
      <button class="mp-skill ${stateOf(s)}" data-id="${s.id}">
        ${ring(s.pct, s.open ? colorOf(s.pct) : 'gray', 22)}
        <span class="mp-s-name">${s.icon} ${escH(s.name)}</span>
        <span class="mp-s-state">${!s.open ? '🔒 تُفتح بإتقان السابقات' : s.master ? 'متقنة ✓' : 'مفتوحة'}</span>
      </button>`).join('')}
    </div>
  </div>`).join('');

function drawEdges() {
  const box = $('#mapBody'), svg = $('#mpEdges');
  const bw = box.clientWidth, bh = box.clientHeight;
  svg.setAttribute('viewBox', `0 0 ${bw} ${bh}`);
  svg.setAttribute('width', bw); svg.setAttribute('height', bh);
  const ctr = id => {
    const el = box.querySelector(`.mp-skill[data-id="${id}"]`);
    return el ? { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 } : null;
  };
  let paths = '';
  SKILLS.forEach(s => s.req.forEach(r => {
    const a = ctr(r), b = ctr(s.id); if (!a || !b) return;
    const my = (a.y + b.y) / 2, lit = (meta[r].pct || 0) >= UNLOCK;
    paths += `<path class="mp-edge ${lit ? 'lit' : ''}" d="M ${a.x} ${a.y} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}"/>`;
  }));
  svg.innerHTML = paths;
}
requestAnimationFrame(drawEdges);
window.addEventListener('resize', drawEdges);

/* لوحة تفاصيل العقدة */
$('#mapBody').addEventListener('click', e => {
  const n = e.target.closest('.mp-skill'); if (!n) return;
  const s = meta[n.dataset.id], d = $('#mapDetail');
  const missing = SKILLS.filter(x => x.req.includes(s.id)); /* تعتمد عليها */
  /* دروس متبقية مرتبطة بالعقدة */
  const lids = [];
  if (s.id === 'core') lids.push(...range('j', 14));
  if (s.id === 'webui') lids.push(...range('h', 6), ...range('c', 6), 'j5', 'j6', 'm1', 'm2', 'm3');
  if (s.id === 'mid') lids.push(...Array.from({ length: 10 }, (_, i) => 'm' + (i + 4)));
  if (s.id === 'py') lids.push(...range('p', 8));
  const rem = lids.filter(id => !doneMap[id]).slice(0, 3).map(id => LIDX[id]).filter(Boolean);
  d.hidden = false;
  d.innerHTML = `
    <div class="mp-d">
      <div class="mp-d-h">${ring(s.pct, s.open ? colorOf(s.pct) : 'gray', 26)}
        <div><h3>${s.icon} ${escH(s.name)}</h3>
        <span>${!s.open ? '🔒 مقفلة — أكمل المتطلبات أولاً' : s.master ? 'مهارة متقنة ✓' : 'مفتوحة — واصل'}</span></div></div>
      <div class="mp-d-rows">
        ${s.sig.map(sg => `<div class="mp-d-row"><span>${escH(sg.t)}</span><span class="mp-d-bar"><i style="width:${sg.pct}%"></i></span><b>${sg.pct}%</b></div>`).join('')}
        ${s.req.length ? `<div class="mp-d-row"><span>المتطلبات</span><span>${s.req.map(r => `${meta[r].icon} ${escH(meta[r].name)} ${meta[r].pct}%${meta[r].pct >= UNLOCK ? ' ✓' : ' 🔒'}`).join(' · ')}</span></div>` : ''}
        ${missing.length ? `<div class="mp-d-row"><span>تفتح لك</span><span>${missing.map(m => `${m.icon} ${escH(m.name)}`).join(' · ')}</span></div>` : ''}
      </div>
      <div class="mp-d-proj">🛠️ <b>مشروع مقترح:</b> ${escH(s.proj.t)} — ${escH(s.proj.d)}</div>
      ${rem.length ? `<div class="mp-d-rem">دروس متبقية: ${rem.map(x => `<a href="index.html#l=${x.t.id}:${x.i}">${escH(x.l.t)}</a>`).join(' · ')}</div>` : ''}
      <div class="mp-d-act">${s.tools.map(t => `<a class="btn sm" href="${t[1]}">${escH(t[0])} ←</a>`).join('')}</div>
    </div>`;
  d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
})();
