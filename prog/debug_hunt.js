/* برمج — صائد الأخطاء: 12 مقتطفاً معطوباً — اعثر على البق قبل كشفه + شرح «لماذا» */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let st = {};
try { st = JSON.parse(localStorage.getItem('prog_debug') || '{}') || {}; } catch (e) { st = {}; }
const save = () => localStorage.setItem('prog_debug', JSON.stringify(st));

/* {code, opts:[خيارات «أين البق؟»], a: correctIdx, why: الشرح} */
const HUNTS = [
  { id: 'h1', cat: 'خارج الحدود', t: 'الشرط المتساوي',
    code: `const items = ['a', 'b', 'c'];\nfor (let i = 0; i <= items.length; i++) {\n  console.log(items[i]); // يطبع undefined آخر مرة\n}`,
    opts: ['items.length يجب أن يكون +1', 'i <= items.length يتجاوز آخر فهرس', 'console.log داخل حلقة خطأ', 'لا بق — الكود صحيح'],
    a: 1,
    why: 'الفهارس 0..length-1؛ الشرط <= يشمل i=3 الذي لا عنصر له فيطبع undefined — الصحيح i < length أو i <= length-1.' },
  { id: 'h2', cat: 'خارج الحدود', t: 'سطر الحذف',
    code: `const list = [1, 2, 3, 4];\nfor (let i = 0; i < list.length; i++) {\n  if (list[i] % 2 === 0) list.splice(i, 1); // يقفز عنصراً بعد الحذف\n}`,
    opts: ['splice يغيّر الطول فيتحرك الفهرس فوق عنصر', 'i % 2 خطأ حسابي', 'list ثابتة لا يمكن تعديلها', 'لا بق — الكود صحيح'],
    a: 0,
    why: 'عند حذف list[i] ينزلق كل ما بعده يساراً وتتقدم i فيُتخطّى العنصر التالي — الحل: التراجع بالفهرس i-- أو filter.' },
  { id: 'h3', cat: 'تغيير', t: 'الفرز المدمر',
    code: `const orig = [3, 1, 2];\nconst sorted = orig.sort();\nconsole.log(orig); // [1,2,3] — المصفوفة الأصلية تغيّرت!`,
    opts: ['sort() لا يعمل على أرقام', 'sort() يعدّل المصفوفة نفسها ويعيدها', 'const تمنع التغيير فالبق في sort', 'لا بق — الترتيب صحيح'],
    a: 1,
    why: 'sort() يعدّل in-place ويعيد نفس المصفوفة لا نسخة — فorig تشير لنفسها. الحل: [...orig].sort() أو toSorted().' },
  { id: 'h4', cat: 'تغيير', t: 'المعامل المرجعي',
    code: `function addPrice(cart, item) {\n  cart.push(item);\n  return cart.length;\n}\nconst my = [];\naddPrice(my, 'x');\nconsole.log(my); // ['x'] — الدالة لوّثت قائمتي!`,
    opts: ['push خطأ — يجب concat', 'الدالة تعدّل cart المرجعي المشترك', 'const my تمنع push', 'لا بق — الكود صحيح'],
    a: 1,
    why: 'المصفوفات تُمرّر بالمرجع — cart وmy اسم لكائن واحد فpush يظهر في الخارج. الحل: انسخ داخل الدالة [...cart, item].' },
  { id: 'h5', cat: 'نطاق', t: 'var في الزمن',
    code: `for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 100); // يطبع 3 ثلاث مرات\n}`,
    opts: ['setTimeout لا يعمل في حلقة', 'var مشتركة فالدالة ترى i النهائية =3', 'i تُعاد لصفراً كل دورة', 'لا بق — يطبع 0,1,2'],
    a: 1,
    why: 'var واحدة مشتركة بين الدورات؛ setTimeout تنفّذ بعد انتهاء الحلقة فترى i=3. الحل: let (نطاق جديد لكل دورة) أو IIFE تلتقط القيمة.' },
  { id: 'h6', cat: 'نطاق', t: 'الظل المخفي',
    code: `let x = 10;\nfunction f() {\n  console.log(x);\n  let x = 20; // يخطئ: TDZ\n}`,
    opts: ['x داخل الدالة لم تُعرَّف بعد — temporal dead zone', 'x الخارجية تُقرأ فيطبع 10', 'let غير صالحة داخل دالة', 'لا بق — يطبع 20'],
    a: 0,
    why: 'let x الداخلية تحجب الخارجية من بداية الدالة (hoisting) لكن قبل تعريفها x في منطقة ميتة زمنياً — ReferenceError لا 10.' },
  { id: 'h7', cat: 'async', t: 'الترتيب المفقود',
    code: `async function load() {\n  const user = fetch('/api/user').then(r => r.json());\n  const posts = fetch('/api/posts').then(r => r.json());\n  render(user.name, posts[0].title); // Promise لا بيانات!\n}`,
    opts: ['fetch تحتاج await قبل استعمال النتيجة', 'render تُستدعى مبكراً فقط', 'r.json() غير ضرورية', 'لا بق — الترتيب صحيح'],
    a: 0,
    why: 'fetch().then() تعيد Promise لا البيانات — user.name يكون undefined. الحل: const [user,posts] = await Promise.all([...]) أو await لكل.' },
  { id: 'h8', cat: 'async', t: 'السباق المجهول',
    code: `let data;\nfetch('/api/config').then(r => { data = r; });\nconsole.log(data); // undefined دائماً`,
    opts: ['console.log يسبق اكتمال fetch', 'let data خطأ — يجب const', 'fetch تمنع التخزين الخارجي', 'لا بق — الكود صحيح'],
    a: 0,
    why: 'fetch غير متزامن — .then يُكمل data لاحقاً لكن console.log ينفّذ فوراً قبل الرد. الحل: اطبع داخل .then أو await.' },
  { id: 'h9', cat: 'أرقام', t: 'الفاصلة العائمة',
    code: `const sum = 0.1 + 0.2;\nif (sum === 0.3) {\n  console.log('صحيح');\n} else {\n  console.log('لا'); // تُنفَّذ هذه!\n}`,
    opts: ['الجمع خطأ — استعمل + +', 'المقارنة === لا تعمل مع كسور', 'sum هو 0.30000000000000004 بالثنائي', 'لا بق — يطبع صحيح'],
    a: 2,
    why: 'الكسور العشرية تُخزَّن ثنائياً بلا دقة كاملة — 0.1+0.2 = 0.30000000000000004. الحل: Math.abs(sum-0.3) < EPSILON أو ضرب ×10.' },
  { id: 'h10', cat: 'أرقام', t: 'النص الرقمي',
    code: `const a = '5';\nconst b = '3';\nconsole.log(a + b); // '53' لا 8`,
    opts: ['+ يجمع نصوصاً لا أرقاماً', 'يجب استعمال parseInt في الطباعة', 'console.log يُنصّ كل شيء', 'لا بق — يطبع 8'],
    a: 0,
    why: 'المعامل + على سلسلة يدمج نصاً. الحل: حوّل أولاً Number(a)+Number(b) أو +a + +b.' },
  { id: 'h11', cat: 'منطق', t: 'العائد المنسي',
    code: `function add(a, b) {\n  a + b; // لا return\n}\nconsole.log(add(2, 3)); // undefined`,
    opts: ['الدالة تحسب لكنها لا تعيد — return مفقود', 'a+b ليست تعبيراً صالحاً', 'console.log يقرأ undefined أولاً', 'لا بق — يطبع 5'],
    a: 0,
    why: 'الحساب يُنفَّذ ويُرمى ناتجه — بلا return ترجع الدالة undefined. الحل: return a + b.' },
  { id: 'h12', cat: 'منطق', t: 'المقارنة الإسنادية',
    code: `let score = 0;\nif (score = 100) {\n  console.log('ممتاز!'); // تُنفَّذ دائماً\n}`,
    opts: ['if تقبل أي قيمة', 'score = 100 إسناد لا مقارنة — والقيمة صادقة', 'let تمنع الشرط', 'لا بق — score صار 100'],
    a: 1,
    why: '= يسند ويعيد القيمة (100 صادقة) فالشرط يتحقق دائماً وscore تُكتب — الحل: === أو == للمقارنة.' },
];

const CATS = [...new Set(HUNTS.map(h => h.cat))];
let idx = 0;
const KEY = id => 'hunt:' + id;
const doneCount = () => HUNTS.filter(h => st[KEY(h.id)]).length;

function head() {
  const d = doneCount();
  $('#dhCount').textContent = `${d}/${HUNTS.length}`;
  $('#dhBar').style.width = Math.round(d / HUNTS.length * 100) + '%';
}

function render() {
  head();
  const h = HUNTS[idx];
  const solved = !!st[KEY(h.id)];
  $('#dhMain').innerHTML = `
    <div class="lb-head" style="margin-bottom:14px">
      <span class="lb-cat-tag">${escH(h.cat)}</span>
      <span class="dh-idx">${idx + 1}/${HUNTS.length}</span>
      <h2 class="lb-t">🔎 ${escH(h.t)}</h2>
    </div>
    <pre class="db-out dh-code" dir="ltr">${escH(h.code)}</pre>
    <div class="dh-ask">أين البقّ؟ (اختر قبل الكشف)</div>
    <div class="dh-opts">
      ${h.opts.map((o, i) => `<button class="dh-opt" data-i="${i}" ${solved ? 'disabled' : ''}>${escH(o)}</button>`).join('')}
    </div>
    <div id="dhRes"></div>
    <div class="dh-nav">
      <button class="btn ghost sm" id="dhPrev" ${idx === 0 ? 'disabled' : ''}>‹ السابق</button>
      <span class="dh-count">${doneCount()} اصطدت</span>
      <button class="btn ghost sm" id="dhNext" ${idx === HUNTS.length - 1 ? 'disabled' : ''}>التالي ›</button>
    </div>`;
  if (solved) reveal(idx, h.a, true);
  $('#dhMain').querySelectorAll('.dh-opt').forEach(b => b.onclick = () => {
    const i = +b.dataset.i;
    if (st[KEY(h.id)]) return;
    const ok = i === h.a;
    if (ok) { st[KEY(h.id)] = true; save(); }
    reveal(idx, i, false, ok);
  });
  $('#dhPrev').onclick = () => { if (idx > 0) { idx--; render(); } };
  $('#dhNext').onclick = () => { if (idx < HUNTS.length - 1) { idx++; render(); } };
}

function reveal(i, picked, silent, okNow) {
  const h = HUNTS[i];
  $('#dhMain').querySelectorAll('.dh-opt').forEach((b, bi) => {
    b.disabled = true;
    if (bi === h.a) b.classList.add('ok');
    else if (bi === picked && !silent) b.classList.add('bad');
  });
  $('#dhRes').innerHTML = `
    ${!silent ? `<div class="${okNow ? 'pn-ok' : 'pn-bad'}" style="margin-bottom:8px">${okNow ? '✓ اصطدته!' : '✗ فاتك — هذا البق:'}</div>` : ''}
    <div class="dh-why"><b>لماذا؟</b> ${escH(h.why)}</div>`;
  const c = $('#dhMain').querySelector('.dh-count'); if (c) c.textContent = `${doneCount()} اصطدت`;
  head();
}

render();
})();
