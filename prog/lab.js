/* برمج — المختبر: 12 تحدياً JS باختبارات مخفية، النجاح في prog_lab */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const LS = 'prog_lab';
let labState = {};
try { labState = JSON.parse(localStorage.getItem(LS) || '{}') || {}; } catch (e) { labState = {}; }
const save = () => localStorage.setItem(LS, JSON.stringify(labState));

/* التحديات — lk: رابط الدرس المرتبط #l=tid:li */
const CHALLENGES = [
  { id: 'v1', cat: 'متغيرات', lk: 'js:1', t: 'تبادل قيمتين',
    d: 'لديك متغيران a=3 و b=7. بدّل قيمتيهما بحيث تصبح a=7 و b=3 دون إعادة الإسناد الحرفي لهما.',
    start: 'let a = 3, b = 7;\n// بدّل القيمتين هنا\n',
    tests: [{ t: s => s.a === 7 && s.b === 3, m: 'a=7 و b=3 بعد التبادل' }] },
  { id: 'v2', cat: 'متغيرات', lk: 'js:1', t: 'جملة ترحيب',
    d: 'عرّف متغير name بأي اسم، ثم أنشئ متغير greeting يحوي «أهلاً <name>!».',
    start: 'let name = "سارة";\n// أنشئ greeting\n',
    tests: [{ t: s => typeof s.greeting === 'string' && /^أهلاً .+!$/.test(s.greeting) && s.greeting.includes(s.name), m: 'greeting = "أهلاً <name>!"' }] },
  { id: 'c1', cat: 'شروط', lk: 'js:3', t: 'الأكبر من الثلاثة',
    d: 'عرّف متغير biggest بأكبر قيمة من المتغيرات x=12 و y=27 و z=9.',
    start: 'let x = 12, y = 27, z = 9;\n// عرّف biggest\n',
    tests: [{ t: s => s.biggest === 27, m: 'biggest = 27' }] },
  { id: 'c2', cat: 'شروط', lk: 'js:3', t: 'زوجي أم فردي؟',
    d: 'اكتب تعبيراً يخزّن في isEven القيمة true إن كان n زوجياً وfalse إن كان فردياً. (n=8 في البداية)',
    start: 'let n = 8;\n// عرّف isEven\n',
    tests: [
      { t: s => s.isEven === true, m: 'isEven = true عند n=8' },
      { t: s => { const f = new Function('n', s._src.split('\n').slice(1).join('\n') + '; return isEven;'); return f(7) === false; }, m: 'isEven = false عند n=7' }] },
  { id: 'l1', cat: 'حلقات', lk: 'js:6', t: 'مجموع 1..100',
    d: 'احسب مجموع الأعداد من 1 إلى 100 وخزّنه في total.',
    start: 'let total = 0;\n// اجمع 1..100\n',
    tests: [{ t: s => s.total === 5050, m: 'total = 5050' }] },
  { id: 'l2', cat: 'حلقات', lk: 'js:6', t: 'عدّ تنازلي',
    d: 'املأ مصفوفة countdown بالأعداد 10..1 تنازلياً بحلقة.',
    start: 'let countdown = [];\n// املأها 10,9,...,1\n',
    tests: [{ t: s => JSON.stringify(s.countdown) === JSON.stringify([10,9,8,7,6,5,4,3,2,1]), m: 'countdown = [10..1]' }] },
  { id: 'f1', cat: 'دوال', lk: 'js:8', t: 'دالة المربع',
    d: 'اكتب دالة square(n) تعيد مربع العدد.',
    start: 'function square(n) {\n  // أعد n*n\n}\n',
    tests: [{ t: s => s.square(5) === 25 && s.square(9) === 81, m: 'square(5)=25 و square(9)=81' }] },
  { id: 'f2', cat: 'دوال', lk: 'js:8', t: 'أقصر أم أطول',
    d: 'اكتب دالة longer(a,b) تعيد أطول النصين (أو أياً منهما إن تساويا).',
    start: 'function longer(a, b) {\n  // أعد الأطول\n}\n',
    tests: [{ t: s => s.longer('abc', 'xy') === 'abc' && s.longer('no', 'yes') === 'yes', m: 'longer تعيد الأطول' }] },
  { id: 'a1', cat: 'مصفوفات', lk: 'js:7', t: 'أكبر رقم',
    d: '��عثر على أكبر رقم في المصفوفة nums وخزّنه في max.',
    start: 'let nums = [4, 19, 7, 33, 12];\n// عرّف max\n',
    tests: [{ t: s => s.max === 33, m: 'max = 33' }] },
  { id: 'a2', cat: 'مصفوفات', lk: 'js:7', t: 'مضاعفة الأعداد',
    d: 'أنشئ مصفوفة doubled تحوي ضعف كل عنصر في nums.',
    start: 'let nums = [1, 2, 3, 4];\n// أنشئ doubled\n',
    tests: [{ t: s => JSON.stringify(s.doubled) === JSON.stringify([2,4,6,8]), m: 'doubled = [2,4,6,8]' }] },
  { id: 'o1', cat: 'كائنات', lk: 'jsm:5', t: 'بطاقة مستخدم',
    d: 'أنشئ كائناً user فيه name و age، ثم خزّن في tag نصاً «name (age)».',
    start: 'let user = { name: "خالد", age: 30 };\n// أنشئ tag\n',
    tests: [{ t: s => s.tag === 'خالد (30)', m: 'tag = "خالد (30)"' }] },
  { id: 'b1', cat: 'خطأ شائع', lk: 'js:1', t: 'أصلح التجميع',
    d: 'الكود التالي يطبع "35" بدل 8 — أصلحه بحيث يجمع العددين حسابياً (ستحتاج تحويل النص).',
    start: 'let a = "3", b = 5;\nlet sum = a + b; // خطأ: 35\n// أصلح sum\n',
    tests: [{ t: s => s.sum === 8, m: 'sum = 8 (تحويل النص لعدد)' }] },
];

let sel = 0, lastCtx = null;

function list() {
  const cats = [...new Set(CHALLENGES.map(c => c.cat))];
  $('#lbList').innerHTML = `<div class="lb-list-h">التحديات — ${Object.keys(labState).filter(k => labState[k]).length}/${CHALLENGES.length}</div>` +
    cats.map(cat => `<div class="lb-cat">${escH(cat)}</div>` +
      CHALLENGES.map((c, i) => c.cat === cat ? `<button class="lb-item ${i === sel ? 'on' : ''} ${labState[c.id] ? 'done' : ''}" data-i="${i}">${labState[c.id] ? '✓ ' : ''}${escH(c.t)}</button>` : '').join('')).join('');
  $('#labCount').textContent = `${Object.keys(labState).filter(k => labState[k]).length}/${CHALLENGES.length} تحدياً`;
  $('#labBar').style.width = Math.round(Object.keys(labState).filter(k => labState[k]).length / CHALLENGES.length * 100) + '%';
}

function lkOf(lk) { const [tid, li] = lk.split(':'); const t = TRACKS.find(x => x.id === tid); return t ? `${t.name} ← ${t.lessons[+li].t}` : ''; }

function render() {
  const c = CHALLENGES[sel];
  $('#lbMain').innerHTML = `
    <div class="lb-head">
      <span class="lb-cat-tag">${escH(c.cat)}</span>
      <h2 class="lb-t">${labState[c.id] ? '✓ ' : ''}${escH(c.t)}</h2>
      <a class="lb-lk" href="index.html#l=${c.lk}">درس مرتبط: ${escH(lkOf(c.lk))} ↗</a>
    </div>
    <p class="lb-d">${escH(c.d)}</p>
    <textarea id="lbCode" class="lb-code" dir="ltr" spellcheck="false">${escH(lastCtx && lastCtx.id === c.id ? lastCtx.src : c.start)}</textarea>
    <div class="lb-actions">
      <button class="btn" id="lbRun">تشغيل ⟵</button>
      <button class="btn ghost" id="lbTest" ${lastCtx && lastCtx.id === c.id ? '' : 'disabled'}>تحقّق بالاختبارات</button>
      <button class="btn ghost sm" id="lbReset">إعادة</button>
    </div>
    <div class="lb-out" id="lbOut">المخرجات تظهر هنا بعد التشغيل.</div>
    <div class="lb-tests" id="lbTests"></div>`;
  $('#lbRun').onclick = runCode;
  $('#lbTest').onclick = runTests;
  $('#lbReset').onclick = () => { lastCtx = null; render(); };
}

function runCode() {
  const c = CHALLENGES[sel];
  const src = $('#lbCode').value;
  const logs = [];
  const fakeConsole = { log: (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')) };
  let env = null, err = null;
  try {
    const fn = new Function('console', `"use strict";\n${src}\n; return (typeof __env !== 'undefined') ? __env : this;`);
    env = fn.call({}, fakeConsole);
  } catch (e) { err = e; }
  lastCtx = { id: c.id, src, env, err };
  $('#lbOut').innerHTML = err
    ? `<div class="lb-err">${escH(arErr(err.message))}</div>`
    : (logs.length ? logs.map(escH).join('\n') : '<span class="lb-dim">(لا مخرجات — الكود نُفّذ بنجاح)</span>');
  $('#lbTest').disabled = false;
}

function runTests() {
  const c = CHALLENGES[sel];
  if (!lastCtx || lastCtx.id !== c.id) return;
  if (lastCtx.err) { $('#lbTests').innerHTML = `<div class="lb-err">أصلح خطأ التنفيذ أولاً: ${escH(lastCtx.err.message)}</div>`; return; }
  /* استخرج المتغيرات المعرفة: أعد تنفيذ الكود وجمع أسماء let/const/function */
  const src = lastCtx.src;
  const declNames = [...src.matchAll(/(?:let|const|var)\s+([^;\n]+)/g)]
    .flatMap(m => m[1].split(',').map(d => {
      const nm = d.match(/^\s*([A-Za-z_$][\w$]*)/);
      return nm ? nm[1] : null;
    }).filter(Boolean))
    .concat([...src.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)].map(m => m[1]));
  const logs = [];
  const fakeConsole = { log: (...a) => logs.push(a.join(' ')) };
  let scope = {};
  try {
    const ret = `; return { ${declNames.join(',')}, _src: __src };`;
    const fn = new Function('console', '__src', `"use strict";\n${src}\n${ret}`);
    scope = fn.call({}, fakeConsole, src);
  } catch (e) { $('#lbTests').innerHTML = `<div class="lb-err">${escH(e.message)}</div>`; return; }
  let pass = 0;
  const rows = c.tests.map((ts, i) => {
    let ok = false;
    try { ok = !!ts.t(scope); } catch (e) { ok = false; }
    if (ok) pass++;
    return `<div class="lb-tst ${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'} الاختبار ${i + 1}${ok ? '' : ' — ' + escH(ts.m)}</div>`;
  });
  const all = pass === c.tests.length;
  if (all && !labState[c.id]) { labState[c.id] = true; save(); list(); }
  $('#lbTests').innerHTML = rows.join('') + (all ? `<div class="lb-win">🎉 نجحت كل الاختبارات — التحدي مسجّل!</div>` : `<div class="lb-note">${pass}/${c.tests.length} اختباراً ناجحاً</div>`);
  render2fix(sel, all);
}

function render2fix(i, all) {
  /* حدّث رأس البطاقة فوراً إن اكتمل */
  if (all) { const h = document.querySelector('.lb-t'); if (h && !h.textContent.startsWith('✓')) h.textContent = '✓ ' + h.textContent; }
}

function arErr(m) {
  const map = [
    [/is not defined/, 'متغير غير معرّف — راجع الأسماء والإملاء'],
    [/Unexpected token/, 'خطأ في بناء الجملة — راجع الأقواس والفواصل'],
    [/Assignment to constant/, 'لا يمكن إعادة إسناد const — استعمل let'],
  ];
  for (const [r, ar] of map) if (r.test(m)) return m + ' — ' + ar;
  return m;
}

$('#lbList').addEventListener('click', e => {
  const b = e.target.closest('.lb-item');
  if (!b) return;
  sel = +b.dataset.i; lastCtx = null;
  list(); render();
});

list(); render();
})();
