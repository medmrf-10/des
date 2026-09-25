/* برمج — المُنقِّح: 10 تحديات تنقيح — كود معطوب + فحص (console/شبكة محاكاة) + اختبارات مخفية */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let dbState = {};
try { dbState = JSON.parse(localStorage.getItem('prog_debug') || '{}') || {}; } catch (e) { dbState = {}; }
const save = () => localStorage.setItem('prog_debug', JSON.stringify(dbState));

/* كل تحدٍ: code معطوب + tests على النسخة المُصلَّحة. bug: وصف البق، tools: أي أدوات فحص تُعرض */
const BUGS = [
  { id: 'off1', cat: 'خارج الحدود', t: 'مجموع المصفوفة',
    bug: 'الحلقة تقرأ arr[5] فيُنتج NaN — الشرط يجب أن يكون i < arr.length.',
    lk: 'js:6',
    code: `function total(arr) {
  let s = 0;
  for (let i = 0; i <= arr.length; i++) s += arr[i];
  return s;
}
console.log(total([1, 2, 3, 4, 5])); // المطلوب 15`,
    tools: 'run',
    tests: [
      { t: s => s.total([1, 2, 3, 4, 5]) === 15, m: 'total([1..5]) = 15' },
      { t: s => s.total([10]) === 10, m: 'total([10]) = 10' },
      { t: s => s.total([]) === 0, m: 'total([]) = 0' }] },
  { id: 'off2', cat: 'خارج الحدود', t: 'آخر عنصر',
    bug: 'arr[arr.length] يعطي undefined — آخر فهرس هو length-1.',
    lk: 'js:7',
    code: `function last(arr) {
  return arr[arr.length];
}
console.log(last(['a', 'b', 'c'])); // المطلوب "c"`,
    tools: 'run',
    tests: [
      { t: s => s.last(['a', 'b', 'c']) === 'c', m: 'last يعيد "c"' },
      { t: s => s.last([7]) === 7, m: 'last([7]) = 7' }] },
  { id: 'sc1', cat: 'النطاق', t: 'var في حلقة',
    bug: 'var مشتركة بين التكرارات فيلتقط setTimeout القيمة النهائية — استعمل let.',
    lk: 'js:10',
    code: `function counters() {
  const out = [];
  for (var i = 0; i < 3; i++) {
    (function (j) { out.push(() => j); })(i);
    out.push(() => i); // يفترض أن يلتقط i=0,1,2
  }
  return out;
}
const fns = counters();
console.log(fns[1](), fns[3](), fns[5]()); // المطلوب 1 3 5 — المخرج 3 3 3`,
    tools: 'run',
    tests: [
      { t: s => { const f = s.counters(); return f[5]() === 5 && f[3]() === 3; }, m: 'كل دالة تلتقط قيمتها' }] },
  { id: 'sc2', cat: 'النطاق', t: 'متغير يتسرب',
    bug: 'total بلا let أصبحت عامة وتبقى بين الاستدعاءات — عرّفها محلياً.',
    lk: 'js:10',
    code: `function add(a, b) {
  total = a + b; // بق: بلا let/const
  return total;
}
add(1, 2);
console.log(typeof total !== 'undefined' ? 'تسرّبت!' : 'نظيف');`,
    tools: 'run',
    tests: [
      { t: s => s.add(2, 3) === 5 && s.add(10, 1) === 11, m: 'add تعمل' },
      { t: s => s._src.indexOf('total') > -1 && /let\s+total|const\s+total|var\s+total/.test(s._src), m: 'total معرّفة محلياً' }] },
  { id: 'async1', cat: 'async', t: 'fetch بلا انتظار',
    bug: 'load يعيد Promise بلا await — النتيجة "Promise {…}" لا البيانات. أضف async/await أو then.',
    lk: 'jsm:8',
    code: `const fetchUser = () => new Promise(r => setTimeout(() => r({ name: 'ليلى' }), 50));
async function load() {
  const u = fetchUser(); // بق: بلا await
  return u.name;
}
load().then(x => console.log(x)); // المطلوب "ليلى" — المخرج undefined`,
    tools: 'net',
    tests: [
      { t: async s => (await s.load()) === 'ليلى', m: 'load() تعيد "ليلى"' }] },
  { id: 'async2', cat: 'async', t: 'throw داخل then',
    bug: 'الخطأ داخل .then لا يُلتقط بالـtry/catch الخارجي — استعمل .catch أو await+try.',
    lk: 'jsm:9',
    code: `const getData = () => Promise.reject(new Error('فشل الشبكة'));
async function run() {
  try {
    getData().then(d => d.value); // بق: الـtry لا يلتقط رفض الـPromise
    return 'تم';
  } catch (e) {
    return 'ملتقط: ' + e.message;
  }
}
run().then(x => console.log(x));`,
    tools: 'net',
    tests: [
      { t: async s => (await s.run()) === 'ملتقط: فشل الشبكة' || (await s.run()) === 'تم', m: 'run() لا تسقط' }] },
  { id: 'dom1', cat: 'DOM', t: 'محدد خاطئ',
    bug: 'querySelector("btn") يبحث عن وسم <btn> — المطلوب "#btn" بالمعرّف.',
    lk: 'js:4',
    code: `/* HTML: <button id="btn">اضغط</button> */
const fakeDoc = { querySelector: s => s === '#btn' ? { textContent: '' } : null };
function onReady(doc) {
  const b = doc.querySelector('btn'); // بق
  if (!b) return 'لم يُوجد الزر';
  b.textContent = 'جاهز';
  return 'ربُط';
}
console.log(onReady(fakeDoc));`,
    tools: 'run',
    tests: [
      { t: s => s.onReady({ querySelector: s => s === '#btn' ? { textContent: '' } : null }) === 'ربُط', m: 'onReady يربط الزر' }] },
  { id: 'dom2', cat: 'DOM', t: 'innerHTML بدل النص',
    bug: 'innerHTML على نص المستخدم يفسّر وسومه ويفتح XSS — استعمل textContent.',
    lk: 'js:4',
    code: `function show(el, userText) {
  el.innerHTML = userText; // بق: نص المستخدم كـHTML
}
const el = {};
show(el, '<img src=x onerror=hack()>');`,
    tools: 'run',
    tests: [
      { t: s => s._src.indexOf('innerHTML') === -1, m: 'لا innerHTML على إدخال المستخدم' },
      { t: s => s._src.indexOf('textContent') > -1, m: 'استعمل textContent' }] },
  { id: 'co1', cat: 'الأنواع', t: 'جمع نصوص',
    bug: '"5" + "3" = "53" لا 8 — حوّل بالـNumber أو + أولاً.',
    lk: 'js:1',
    code: `function add(a, b) {
  return a + b; // المتصل مرّر "5" و"3" كنصوص
}
console.log(add('5', '3')); // المطلوب 8 — المخرج "53"`,
    tools: 'run',
    tests: [
      { t: s => s.add('5', '3') === 8, m: 'add("5","3") = 8' },
      { t: s => s.add(2, 2) === 4, m: 'add(2,2) = 4' }] },
  { id: 'lp1', cat: 'إغلاقات', t: 'عداد مشترك',
    bug: 'كل عداد يشارك نفس n — اجعل لكل عداد حالته الخاصة بدالة مصنع.',
    lk: 'jsm:11',
    code: `let n = 0;
function makeCounter() { // بق: n خارجية مشتركة بين العدادين
  return () => ++n;
}
const a = makeCounter(), b = makeCounter();
a(); a();
console.log(a(), b()); // المطلوب 3 1 — المخرج 3 4 (تقاسما n)`,
    tools: 'run',
    tests: [
      { t: s => { const a = s.makeCounter(), b = s.makeCounter(); a(); a(); return a() === 3 && b() === 1; }, m: 'عدّادان مستقلان' }] },
];

const CATS = [...new Set(BUGS.map(b => b.cat))];
let sel = 0;

/* تشغيل كود مع التقاط console + أخطاء — نفس محرك lab.js */
function execSrc(src) {
  const logs = [];
  const fake = { log: (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')), error: (...a) => logs.push('❌ ' + a.join(' ')) };
  const names = [...src.matchAll(/^(?:let|const|var)\s+([^;\n]+)/gm)]
    .flatMap(m => m[1].split(',').map(d => { const n = d.match(/^\s*([A-Za-z_$][\w$]*)/); return n ? n[1] : null; }).filter(Boolean))
    .concat([...src.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]))
    .filter((v, i, a) => a.indexOf(v) === i);
  try {
    const fn = new Function('console', '__src', `"use strict";\n${src}\n; return { ${names.join(',')}, _src: __src };`);
    return { scope: fn.call({}, fake, src), logs, err: null };
  } catch (e) { return { scope: null, logs, err: e.message }; }
}

function list() {
  const done = BUGS.filter(b => dbState[b.id]).length;
  $('#dbCount').textContent = `${done}/${BUGS.length}`;
  $('#dbBar').style.width = Math.round(done / BUGS.length * 100) + '%';
  $('#dbList').innerHTML = `<div class="lb-list-h">الأخطاء — ${done}/${BUGS.length}</div>` +
    CATS.map(cat => `<div class="lb-cat">${escH(cat)}</div>` +
      BUGS.map((b, i) => b.cat === cat ? `<button class="lb-item ${i === sel ? 'on' : ''} ${dbState[b.id] ? 'done' : ''}" data-i="${i}">${dbState[b.id] ? '✓ ' : ''}🐞 ${escH(b.t)}</button>` : '').join('')).join('');
  $('#dbList').querySelectorAll('.lb-item').forEach(b => b.onclick = () => { sel = +b.dataset.i; render(); });
}

function render() {
  const b = BUGS[sel];
  const t = TRACKS.find(x => x.id === b.lk.split(':')[0]);
  const lnk = t ? `<a class="lb-link" href="index.html#l=${b.lk}">درس مرتبط: ${escH(t.name)} ← ${escH(t.lessons[+b.lk.split(':')[1]].t)} ↗</a>` : '';
  $('#dbMain').innerHTML = `
    <div class="lb-head">
      <span class="lb-cat-tag">${escH(b.cat)}</span>
      <h2 class="lb-t">${dbState[b.id] ? '✓ ' : ''}🐞 ${escH(b.t)}</h2>
      ${lnk}
      <div class="db-bug">${escH(b.bug)}</div>
    </div>
    <div class="db-tools">
      <button class="btn ghost sm" id="dbBugRun">شغّل الكود المعطوب ⟵</button>
      ${b.tools === 'net' ? '<span class="db-net">📡 fetch موقّت بـPromise حقيقي (setTimeout/Promise.reject)</span>' : ''}
    </div>
    <pre class="db-out" id="dbBugOut" dir="ltr">مخرجات الكود المعطوب تظهر هنا.</pre>
    <div class="lb-ed-h">عدّل الكود وأصلح البق:</div>
    <textarea id="dbEd" dir="ltr" spellcheck="false">${b.code}</textarea>
    <div class="lb-act">
      <button class="btn" id="dbRun">تشغيل ⟵</button>
      <button class="btn ghost" id="dbTest" disabled>تحقّق بالاختبارات</button>
      <button class="btn ghost" id="dbReset">إعادة</button>
    </div>
    <pre class="db-out" id="dbOut" dir="ltr">المخرجات تظهر هنا بعد التشغيل.</pre>
    <div id="dbRes"></div>`;
  $('#dbBugRun').onclick = () => {
    const r = execSrc(b.code);
    $('#dbBugOut').textContent = (r.logs.join('\n') || '(لا مخرجات)') + (r.err ? '\n❌ ' + r.err : '');
  };
  $('#dbRun').onclick = () => {
    const r = execSrc($('#dbEd').value);
    window._dbg = r;
    $('#dbOut').textContent = (r.logs.join('\n') || '(لا مخرجات)') + (r.err ? '\n❌ ' + r.err : '');
    $('#dbTest').disabled = false;
  };
  $('#dbTest').onclick = async () => {
    const r = window._dbg || execSrc($('#dbEd').value);
    const box = $('#dbRes');
    if (r.err) { box.innerHTML = `<div class="lb-fail">❌ خطأ تشغيل: ${escH(r.err)}</div>`; return; }
    let all = true;
    const rows = [];
    for (const tst of b.tests) {
      let ok = false;
      try { ok = await tst.t(r.scope); } catch (e) { ok = false; }
      all = all && ok;
      rows.push(`<div class="lb-test ${ok ? 'ok' : 'fail'}">${ok ? '✓' : '✗'} ${escH(tst.m)}</div>`);
    }
    box.innerHTML = rows.join('') + (all ? '<div class="lb-win">🎉 أصلحت البق — مسجّل!</div>' : '<div class="lb-fail">بعض الاختبارات ما زالت تفشل — راجع المخرجات.</div>');
    if (all && !dbState[b.id]) { dbState[b.id] = true; save(); list(); }
  };
  $('#dbReset').onclick = () => { render(); };
}

list(); render();
})();
