/* برمج — كاتب الاختبارات: 10 دوال، لكل 6 اختبارات مرشّحة — بعضها يبدو صحيحاً لكنه غلط؛ اختر الصحيحة ثم نفّذها فعلياً */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
let st = {};
try { st = JSON.parse(localStorage.getItem('prog_testw') || '{}') || {}; } catch (e) { st = {}; }
const save = () => localStorage.setItem('prog_testw', JSON.stringify(st));
const doneCount = () => FNS.filter(f => st[f.id] && st[f.id].ok).length;

const FNS = [
{ id: 'sum', cat: 'أرقام ومصفوفات', t: 'sum — جمع مصفوفة', d: 'تعيد مجموع عناصر مصفوفة أرقام.',
  code: `function sum(arr) {\n  let s = 0;\n  for (const x of arr) s += x;\n  return s;\n}`,
  tests: [
    { l: 'مجموع [1,2,3] يساوي 6', e: 'return sum([1,2,3]) === 6', ok: true, w: '' },
    { l: 'المصفوفة الفارغة تعيد 0', e: 'return sum([]) === 0', ok: true, w: '' },
    { l: 'مجموع [1,2,3] يساوي 5', e: 'return sum([1,2,3]) === 5', ok: false, w: 'الناتج الفعلي 6 — الاختبار يتوقع قيمة خاطئة (خلل off-by-one في التوقع).' },
    { l: 'sum(["a","b"]) === "ab"', e: 'return sum(["a","b"]) === "ab"', ok: false, w: 's يبدأ رقماً 0 — 0+"a" = "0a" فالناتج "0ab" لا "ab". اختبار يتجاهل نوع القيمة الابتدائية.' },
    { l: 'السوالب: sum([-1,-2]) === -3', e: 'return sum([-1,-2]) === -3', ok: true, w: '' },
    { l: 'الناتج نص: sum([1,2]) === "3"', e: 'return sum([1,2]) === "3"', ok: false, w: 'تعيد الرقم 3 لا النص "3" — === ترفض اختلاف النوع.' },
  ] },
{ id: 'fizz', cat: 'أرقام ومصفوفات', t: 'fizzbuzz — القابلية للقسمة', d: 'FizzBuzz عند %15، Fizz عند %3، Buzz عند %5، وإلا الرقم نفسه.',
  code: `function fizzbuzz(n) {\n  if (n % 15 === 0) return 'FizzBuzz';\n  if (n % 3 === 0) return 'Fizz';\n  if (n % 5 === 0) return 'Buzz';\n  return n;\n}`,
  tests: [
    { l: 'fizzbuzz(3) === "Fizz"', e: 'return fizzbuzz(3) === "Fizz"', ok: true, w: '' },
    { l: 'fizzbuzz(15) === "Fizz"', e: 'return fizzbuzz(15) === "Fizz"', ok: false, w: '15 تقسم على 15 أولاً فتعيد "FizzBuzz" — ترتيب الفحص هو الفخ.' },
    { l: 'fizzbuzz(5) === "Buzz"', e: 'return fizzbuzz(5) === "Buzz"', ok: true, w: '' },
    { l: 'fizzbuzz(7) === 7', e: 'return fizzbuzz(7) === 7', ok: true, w: '' },
    { l: 'fizzbuzz(7) === "7"', e: 'return fizzbuzz(7) === "7"', ok: false, w: 'تعيد الرقم 7 لا النص — اختلاف النوع يفشل ===.' },
    { l: 'fizzbuzz(0) === "FizzBuzz"', e: 'return fizzbuzz(0) === "FizzBuzz"', ok: true, w: 'صحيح وإن بدا غريباً — 0 % 15 === 0 رياضياً فيعيد FizzBuzz. اختبار حدّي يكشف سلوكاً غير مقصود غالباً.' },
  ] },
{ id: 'pal', cat: 'نصوص', t: 'isPalindrome — المتلازمة', d: 'تفحص إن كانت السلسلة تُقرأ بالمقلوب مثل أصلها.',
  code: `function isPalindrome(s) {\n  return s === s.split('').reverse().join('');\n}`,
  tests: [
    { l: 'isPalindrome("aba") === true', e: 'return isPalindrome("aba") === true', ok: true, w: '' },
    { l: 'isPalindrome("ab") === false', e: 'return isPalindrome("ab") === false', ok: true, w: '' },
    { l: 'isPalindrome("") === false', e: 'return isPalindrome("") === false', ok: false, w: 'الفارغة مقلوبها نفسها → true. السلسلة الفارغة متلازمة تافهة — فخ حدّي شهير.' },
    { l: 'isPalindrome("Abba") === true', e: 'return isPalindrome("Abba") === true', ok: false, w: 'المقارنة حساسة لحالة الأحرف — "Abba" مقلوبها "abbA" ≠ — تعيد false.' },
    { l: 'isPalindrome("a") === true', e: 'return isPalindrome("a") === true', ok: true, w: '' },
    { l: 'isPalindrome(121) === true', e: 'return isPalindrome(121) === true', ok: false, w: 'رمزياً صحيح لكنه يستدعي .split على رقم → TypeError. اختبار يكسر العقد: المدخل يجب أن يكون نصاً.' },
  ] },
{ id: 'clone', cat: 'كائنات', t: 'deepClone — نسخ عميق', d: 'تنسخ الكائن بالكامل عبر JSON (دون مراجع مشتركة).',
  code: `function deepClone(o) {\n  return JSON.parse(JSON.stringify(o));\n}`,
  tests: [
    { l: 'deepClone({a:1}).a === 1', e: 'return deepClone({a:1}).a === 1', ok: true, w: '' },
    { l: 'النسخة هي نفس الكائن: deepClone(o) === o', e: 'const o = {a:1}; return deepClone(o) === o', ok: false, w: 'عكس الغرض تماماً — النسخة كائن جديد بمرجع مختلف؛ === دائماً false.' },
    { l: 'العمق: تعديل النسخة لا يمس الأصل', e: 'const o = {n:{x:1}}; const c = deepClone(o); c.n.x = 9; return o.n.x === 1', ok: true, w: 'الاختبار الجوهري للنسخ العميق — الكائن المتداخل منفصل فعلاً.' },
    { l: 'تنسخ الدوال: typeof clone.f === "function"', e: 'const c = deepClone({f:function(){return 1}}); return typeof c.f === "function"', ok: false, w: 'JSON.stringify يسقط الدوال — c.f = undefined. قيد معروف للنسخة العميق عبر JSON.' },
    { l: 'يحفظ Date ككائن: clone.d instanceof Date', e: 'const c = deepClone({d:new Date(0)}); return c.d instanceof Date', ok: false, w: 'Date تتحول لنص ISO — instanceof Date = false. قيد آخر لـJSON.' },
    { l: 'مصفوفات: deepClone([1,2,3]).length === 3', e: 'return deepClone([1,2,3]).length === 3', ok: true, w: '' },
  ] },
{ id: 'group', cat: 'كائنات', t: 'groupBy — تجميع بمفتاح', d: 'تجمّع مصفوفة كائنات في مجموعات حسب قيمة مفتاح.',
  code: `function groupBy(arr, k) {\n  const r = {};\n  for (const o of arr) {\n    const g = o[k];\n    (r[g] || (r[g] = [])).push(o);\n  }\n  return r;\n}`,
  tests: [
    { l: 'مفتاحان: r.a.length === 1', e: 'const r = groupBy([{t:"a"},{t:"b"}], "t"); return r.a.length === 1', ok: true, w: '' },
    { l: 'تكرار المفتاح يجمع: r.a.length === 2', e: 'const r = groupBy([{t:"a"},{t:"a"}], "t"); return r.a.length === 2', ok: true, w: '' },
    { l: 'r.a[0] === "a"', e: 'const r = groupBy([{t:"a"}], "t"); return r.a[0] === "a"', ok: false, w: 'r.a مصفوفة كائنات — r.a[0] هو {t:"a"} نفسه لا القيمة "a". فخ شائع.' },
    { l: 'مفتاح غائب يجمّع تحت "undefined"', e: 'const r = groupBy([{x:1}], "t"); return r.undefined.length === 1', ok: true, w: 'صحيح ومفاجئ — o["t"] غير موجود فيُستخدم المفتاح النصي "undefined". سلوك قد لا تريده لكنه حقيقي.' },
    { l: 'مصفوفة فارغة تعطي مجموعة فارغة: r.a === []', e: 'const r = groupBy([], "t"); return Array.isArray(r.a)', ok: false, w: 'r = {} بلا مفاتيح إطلاقاً — r.a === undefined لا []. المجموعات تُنشأ عند أول عنصر فقط.' },
    { l: 'ثلاثة عناصر، مفتاحان: Object.keys(r).length === 2', e: 'const r = groupBy([{t:"a"},{t:"b"},{t:"a"}], "t"); return Object.keys(r).length === 2', ok: true, w: '' },
  ] },
{ id: 'deb', cat: 'أداء وتحكم', t: 'debounce — تأخير النداءات', d: 'تغلّف دالة فلا تُنفَّذ إلا بعد سكوت ms عن آخر نداء (trailing).',
  code: `function debounce(fn, ms) {\n  let t;\n  return (...a) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...a), ms);\n  };\n}`,
  tests: [
    { l: 'اندفاعة 3 نداءات ← تنفيذ واحد بعد الهدوء', e: 'let c = 0; const d = debounce(() => c++, 20); d(); d(); d(); await sleep(50); return c === 1', ok: true, w: '' },
    { l: 'لا تنفيذ فوري: c === 0 بعد d() مباشرة', e: 'let c = 0; const d = debounce(() => c++, 20); d(); return c === 0', ok: true, w: 'trailing — لا شيء ينفذ حتى تنقضي المهلة.' },
    { l: 'ثلاثة نداءات ← ثلاثة تنفيذات: c === 3', e: 'let c = 0; const d = debounce(() => c++, 20); d(); d(); d(); await sleep(50); return c === 3', ok: false, w: 'كل نداء يمحو المؤقت السابق — ينفذ الأخير فقط مرة واحدة → c === 1.' },
    { l: 'آخر وسائط تفوز: d(5) ثم d(7) ← c === 7', e: 'let c = 0; const d = debounce(x => c += x, 20); d(5); d(7); await sleep(50); return c === 7', ok: true, w: 'المنفّذ الوحيد يحمل وسائط آخر نداء.' },
    { l: 'تعيد دالة مُغلَّفة: typeof d === "function"', e: 'const d = debounce(() => 1, 20); return typeof d === "function"', ok: true, w: '' },
    { l: 'نداءان بفاصل 10ms (أقل من المهلة 20ms) ← تنفيذان', e: 'let c = 0; const d = debounce(() => c++, 20); d(); await sleep(10); d(); await sleep(50); return c === 2', ok: false, w: 'الثاني يمحو مؤقت الأول قبل انقضائه → تنفيذ واحد → c === 1. الفاصل أقل من ms فيُدمَجان.' },
  ] },
{ id: 'bs', cat: 'أرقام ومصفوفات', t: 'binarySearch — بحث ثنائي', d: 'تعيد فهرس العنصر في مصفوفة مرتّبة تصاعدياً، أو -1.',
  code: `function binarySearch(a, x) {\n  let lo = 0, hi = a.length - 1;\n  while (lo <= hi) {\n    const m = (lo + hi) >> 1;\n    if (a[m] === x) return m;\n    if (a[m] < x) lo = m + 1; else hi = m - 1;\n  }\n  return -1;\n}`,
  tests: [
    { l: 'binarySearch([1,3,5,7], 5) === 2', e: 'return binarySearch([1,3,5,7], 5) === 2', ok: true, w: '' },
    { l: 'غائب: binarySearch([1,3,5,7], 4) === -1', e: 'return binarySearch([1,3,5,7], 4) === -1', ok: true, w: '' },
    { l: 'الحد الأدنى: binarySearch([1,3,5,7], 1) === 0', e: 'return binarySearch([1,3,5,7], 1) === 0', ok: true, w: '' },
    { l: 'binarySearch([5,3,1], 5) === 0', e: 'return binarySearch([5,3,1], 5) === 0', ok: false, w: 'يبدو منطقياً لكن المدخل غير مرتب تصاعدياً — الشرط المسبق مكسور، والنتيجة الفعلية -1. الاختبار يجب أن يحترم العقد.' },
    { l: 'فارغة: binarySearch([], 9) === -1', e: 'return binarySearch([], 9) === -1', ok: true, w: '' },
    { l: 'binarySearch([1,3,5], 5) === 3', e: 'return binarySearch([1,3,5], 5) === 3', ok: false, w: 'تعيد الفهرس 2 لا الموضع البشري 3 — فخ فهرسة vs عدّ.' },
  ] },
{ id: 'lru', cat: 'كائنات', t: 'lru — كاش الأقدم استخداماً', d: 'كاش بسعة محدودة يطرد أقدم عنصر غير مستخدم مؤخراً.',
  code: `function lru(cap) {\n  const m = new Map();\n  return {\n    get(k) {\n      if (!m.has(k)) return -1;\n      const v = m.get(k);\n      m.delete(k); m.set(k, v);\n      return v;\n    },\n    set(k, v) {\n      if (m.has(k)) m.delete(k);\n      else if (m.size >= cap) m.delete(m.keys().next().value);\n      m.set(k, v);\n    }\n  };\n}`,
  tests: [
    { l: 'تخزين واسترجاع: get("a") === 1', e: 'const c = lru(2); c.set("a",1); c.set("b",2); return c.get("a") === 1', ok: true, w: '' },
    { l: 'بعد set ثالث يبقى a: get("a") === 1', e: 'const c = lru(2); c.set("a",1); c.set("b",2); c.set("c",3); return c.get("a") === 1', ok: false, w: 'a هو الأقدم فيُطرد عند set("c") — get("a") === -1. الاختبار يتجاهل الطرد.' },
    { l: 'الكتابة على مفتاح قائم تُحدّثه: get("a") === 9', e: 'const c = lru(2); c.set("a",1); c.set("a",9); return c.get("a") === 9', ok: true, w: '' },
    { l: 'get يحدّث الانتازة: a يُنعش فيُطرد b', e: 'const c = lru(2); c.set("a",1); c.set("b",2); c.get("a"); c.set("c",3); return c.get("b") === -1', ok: true, w: 'دقيق وصحيح — قراءة a جدّدتها فأصبح b الأقدم وطُرد.' },
    { l: 'المفتاح الغائب يعيد undefined', e: 'const c = lru(2); c.set("a",1); return c.get("z") === undefined', ok: false, w: 'العقد يحدد sentinel === -1 لا undefined — تفصيلة توقيع مهمة.' },
    { l: 'نفس السيناريو لكن يدّعي طرد a: get("a") === -1', e: 'const c = lru(2); c.set("a",1); c.set("b",2); c.get("a"); c.set("c",3); return c.get("a") === -1', ok: false, w: 'بالعكس — a نُعّشت بالقراءة فبقيت (=== 1)، والمطرود هو b. فخ تتبع الدقائق.' },
  ] },
{ id: 'camel', cat: 'نصوص', t: 'camelize — نمط kebab إلى camel', d: 'تحوّل "border-width" إلى "borderWidth".',
  code: `function camelize(s) {\n  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());\n}`,
  tests: [
    { l: 'camelize("a-b") === "aB"', e: 'return camelize("a-b") === "aB"', ok: true, w: '' },
    { l: 'camelize("a-b-c") === "aBC"', e: 'return camelize("a-b-c") === "aBC"', ok: true, w: '' },
    { l: 'شرطتان متتاليتان: camelize("a--b") === "aB"', e: 'return camelize("a--b") === "aB"', ok: false, w: 'النمط يطلب حرفاً صغيراً بعد الشرطة — الشرطة الأولى يتبعها "-" فتبقى: الناتج "a-B".' },
    { l: 'شرطة بادئة: camelize("-a") === "A"', e: 'return camelize("-a") === "A"', ok: true, w: 'النمط لا يمانع البداية — "-a" → "A". حالة حدّية صحيحة.' },
    { l: 'حرف كبير بعد الشرطة: camelize("a-B") === "aB"', e: 'return camelize("a-B") === "aB"', ok: false, w: '[a-z] صغيرة فقط — "a-B" لا يتغير إطلاقاً.' },
    { l: 'بلا شرطات: camelize("abc") === "abc"', e: 'return camelize("abc") === "abc"', ok: true, w: '' },
  ] },
{ id: 'range', cat: 'أرقام ومصفوفات', t: 'range — توليد مجال', d: 'range(3) → [0,1,2] وrange(a,b) → [a..b-1] بنهاية حصرية.',
  code: `function range(a, b) {\n  if (b === undefined) { b = a; a = 0; }\n  const r = [];\n  for (let i = a; i < b; i++) r.push(i);\n  return r;\n}`,
  tests: [
    { l: 'range(3).length === 3', e: 'return range(3).length === 3', ok: true, w: '' },
    { l: 'range(1,4).length === 3', e: 'return range(1,4).length === 3', ok: true, w: '' },
    { l: 'النهاية حصرية: range(1,4) لا تشمل 4', e: 'return !range(1,4).includes(4)', ok: true, w: '' },
    { l: 'range(3)[0] === 1', e: 'return range(3)[0] === 1', ok: false, w: 'يبدأ من 0 — [0,1,2] فيكون [0]===0. فخ off-by-one في التوقع.' },
    { l: 'مجال تنازلي: range(5,1).length === 4', e: 'return range(5,1).length === 4', ok: false, w: 'الحلقة i<b لا تدور أصلاً — الناتج [] بطول 0. الدالة لا تدعم التنازلي.' },
    { l: 'range(0).length === 0', e: 'return range(0).length === 0', ok: true, w: '' },
  ] },
];

function scopeOf(src) {
  const names = [...src.matchAll(/^(?:let|const|var)\s+([^;\n]+)/gm)]
    .flatMap(m => m[1].split(',').map(d => { const n = d.match(/^\s*([A-Za-z_$][\w$]*)/); return n ? n[1] : null; }).filter(Boolean))
    .concat([...src.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]))
    .filter((v, i, a) => a.indexOf(v) === i);
  return new Function(`"use strict";\n${src}\n;return { ${names.join(',')} };`)();
}
async function runBody(sc, body) {
  try {
    const f = new Function('s', 'sleep', `"use strict"; return (async () => { const { ${Object.keys(sc).join(', ')} } = s; ${body}\n })()`);
    const v = await f(sc, sleep);
    return { pass: !!v };
  } catch (e) { return { pass: false, err: String(e && e.message || e) }; }
}

let cur = 0;
function head() {
  const n = doneCount();
  $('#twCount').textContent = `${n}/${FNS.length}`;
  $('#twBar').style.width = `${n / FNS.length * 100}%`;
}
function list() {
  let html = `<div class="lb-list-h">الدوال — ${doneCount()}/${FNS.length} ✓</div>`;
  let cat = '';
  FNS.forEach((f, idx) => {
    if (f.cat !== cat) { cat = f.cat; html += `<div class="lb-cat">${cat}</div>`; }
    const ok = st[f.id] && st[f.id].ok;
    html += `<button class="lb-item ${ok ? 'ok' : ''}" data-i="${idx}">${ok ? '✓' : '🧪'} ${escH(f.t)}</button>`;
  });
  $('#twList').innerHTML = html;
  $('#twList').querySelectorAll('.lb-item').forEach(b => b.onclick = () => { cur = +b.dataset.i; render(); });
}
function render() {
  head(); list();
  const f = FNS[cur];
  const done = st[f.id] && st[f.id].ok;
  $('#twMain').innerHTML = `
    <div class="lb-head">
      <span class="lb-cat-tag">${escH(f.cat)}</span>
      <h2 class="lb-t">🧪 ${escH(f.t)}</h2>
      <div class="dh-why" style="margin-top:6px">${escH(f.d)}</div>
    </div>
    <pre class="db-out dh-code" dir="ltr">${escH(f.code)}</pre>
    <div class="dh-ask">أيّ الاختبارات الستة <b>صحيحة فعلاً</b>؟ (بعضها يبدو صحيحاً لكنه غلط — انتبه للحدود والأنواع والترتيب)</div>
    <div id="twTests">${f.tests.map((t, j) => `
      <label class="tw-test"><input type="checkbox" data-j="${j}"><span class="tw-l">${escH(t.l)}<span class="tw-e">${escH(t.e)}</span></span></label>`).join('')}
    </div>
    <div style="margin:12px 0"><button class="btn" id="twRun">نفّذ الاختبارات الستة ⟵</button></div>
    <div id="twRes">${done ? '<div class="pn-ok">✓ هذه الدالة محلولة سابقاً — جرّب مجدداً إن أردت.</div>' : ''}</div>`;

  $('#twRun').onclick = async () => {
    const sc = scopeOf(f.code);
    const picked = new Set();
    $('#twMain').querySelectorAll('input[type=checkbox]').forEach(cb => { if (cb.checked) picked.add(+cb.dataset.j); cb.disabled = true; });
    $('#twRun').disabled = true;
    let valid = 0, hits = 0;
    for (let j = 0; j < f.tests.length; j++) {
      const t = f.tests[j];
      const r = await runBody(sc, t.e);
      const row = $('#twTests').children[j];
      const claimTrue = r.pass;
      const isValidTest = t.ok;
      row.classList.add(isValidTest ? 'v-ok' : 'v-bad');
      if (!isValidTest && picked.has(j)) row.classList.add('v-pick-miss');
      const verdict = document.createElement('div');
      verdict.className = 'tw-verdict';
      verdict.textContent = isValidTest ? '✓ اختبار صحيح' : '✗ ادعاء كاذب';
      const why = document.createElement('div');
      why.className = 'tw-w';
      why.textContent = (claimTrue ? 'التنفيذ: الادعاء تحقق (true). ' : (r.err ? `التنفيذ: رمى خطأ (${r.err}). ` : 'التنفيذ: الادعاء لم يتحقق (false). ')) + (t.w || '');
      row.querySelector('.tw-l').appendChild(verdict);
      row.querySelector('.tw-l').appendChild(why);
      if (isValidTest) valid++;
      if (picked.has(j) === isValidTest) hits++;
    }
    const okAll = hits === f.tests.length;
    if (okAll) { st[f.id] = { ok: true }; save(); }
    $('#twRes').innerHTML = `
      <div class="${okAll ? 'pn-ok' : 'pn-bad'}" style="margin-top:10px">
        ${okAll ? `✓ مجموعة اختبارات مثالية — ${valid} صحيحة من 6. سُجّلت الدالة.` : `✗ أصبت ${hits}/${f.tests.length} — الاختيار الصحيح: الاختبارات الخضراء فقط. راجع الأسباب وأعد المحاولة.`}
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button class="btn ghost sm" id="twAgain">أعد المحاولة</button>
        ${cur < FNS.length - 1 ? '<button class="btn" id="twNext">التالية ⟵</button>' : ''}
      </div>`;
    $('#twAgain').onclick = render;
    const nx = $('#twNext'); if (nx) nx.onclick = () => { cur++; render(); };
    head(); list();
    const c = $('#twCount'); if (c) c.textContent = `${doneCount()}/${FNS.length}`;
  };
}
render();
})();
