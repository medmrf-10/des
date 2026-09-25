/* برمج — اقرأ الكود: 12 مقتطفاً متوسطاً — خمّن الناتج قبل تشغيله حقيقةً بـeval + شرح سطر-بسطر */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let st = {};
try { st = JSON.parse(localStorage.getItem('prog_read') || '{}') || {}; } catch (e) { st = {}; }
st.__streak = st.__streak || 0; st.__best = st.__best || 0;
const save = () => localStorage.setItem('prog_read', JSON.stringify(st));
const CATN = { hoist: 'رفع', coercion: 'تحويل أنواع', string: 'سلاسل', reduce: 'reduce', closure: 'إغلاق', destruct: 'تفكيك', this: 'this', async: 'async' };

const SNIPS = [
  { id: 'hoist1', cat: 'hoist', t: 'المتغير المرفوع',
    code: `console.log(a);\nvar a = 5;\nconsole.log(a);`,
    opts: ['undefined ثم 5', '5 ثم 5', 'خطأ ReferenceError', 'a ثم 5'], a: 0,
    why: ['var a تُرفع (hoisted) لأعلى النطاق لكن قيمتها لا — فهي undefined قبل السطر الثاني.', 'بعد الإسناد تطبع 5.'] },
  { id: 'co1', cat: 'coercion', t: 'الجمع النصي',
    code: `console.log('5' + 3, '5' - 3);`,
    opts: ['53 2', '8 2', '53 53', '8 -2'], a: 0,
    why: ["+ مع سلسلة = إلصاق: '5'+3 → '53'.", "- لا معنى له نصياً فيُحوّل: '5'-3 → 2."] },
  { id: 'str1', cat: 'string', t: 'الشطر والطول',
    code: `const s = 'hello';\nconsole.log(s.slice(1, 3), s.length);`,
    opts: ['el 5', 'ell 5', 'hel 5', 'el 4'], a: 0,
    why: ['slice(1,3) يأخذ الفهرس 1 و2 دون 3 → "el".', 'length يعد كل الأحرف → 5.'] },
  { id: 'red1', cat: 'reduce', t: 'المطوية ببذرة',
    code: `const r = [1, 2, 3, 4].reduce((a, b) => a + b, 100);\nconsole.log(r);`,
    opts: ['110', '10', '100', 'NaN'], a: 0,
    why: ['البذرة 100 قيمة a الأولى — لا تُضاف عناصر زائدة.', '100+1+2+3+4 = 110.'] },
  { id: 'cl1', cat: 'closure', t: 'العداد المحبوس',
    code: `function counter() {\n  let n = 0;\n  return () => ++n;\n}\nconst f = counter();\nf(); f();\nconsole.log(f());`,
    opts: ['3', '1', '0', 'undefined'], a: 0,
    why: ['الدالة الداخلية تُغلق على n الخاصة وتبقى حية بعد خروج counter.', 'ثلاث استدعاءات × ++n → 3.'] },
  { id: 'ds1', cat: 'destruct', t: 'التفكيك بافتراضي',
    code: `const { a = 1, b = 2 } = { a: 9 };\nconsole.log(a, b);`,
    opts: ['9 2', '9 1', '1 2', '9 undefined'], a: 0,
    why: ['a وُجدت فأُخذت 9 (الافتراضي للغائب فقط).', 'b غائبة فيرجع الافتراضي 2 — لا undefined.'] },
  { id: 'cl2', cat: 'closure', t: 'فخ var في الحلقة',
    code: `const fs = [];\nfor (var i = 0; i < 3; i++) fs.push(() => i);\nconsole.log(fs.map(f => f()).join(','));`,
    opts: ['3,3,3', '0,1,2', '1,2,3', 'خطأ'], a: 0,
    why: ['var i واحدة مشتركة بين الثلاث — لا نسخة لكل دورة.', 'بعد الحلقة i=3 فيطبع الجميع 3 — let تحلها.'] },
  { id: 'th1', cat: 'this', t: 'bind يثبت السياق',
    code: `const o = { n: 5, g() { return this.n; } };\nconst h = o.g.bind({ n: 9 });\nconsole.log(o.g(), h());`,
    opts: ['5 9', '5 5', '9 9', '5 undefined'], a: 0,
    why: ['o.g() سياقه o → 5.', 'bind ربط this على {n:9} نهائياً → h()=9 مهما نُوديت.'] },
  { id: 'async1', cat: 'async', t: 'micro قبل macro',
    code: `console.log(1);\nsetTimeout(() => console.log(2));\nPromise.resolve().then(() => console.log(3));\nconsole.log(4);`,
    opts: ['1 4 3 2', '1 2 3 4', '1 4 2 3', '4 1 3 2'], a: 0,
    why: ['المتزامن أولاً: 1 ثم 4.', 'microtasks (then) تسبق macrotasks (setTimeout): 3 ثم 2.'] },
  { id: 'th2', cat: 'this', t: 'السهمية تورث',
    code: `const o = {\n  n: 5,\n  g: () => this?.n,\n  f() { return () => this.n; }\n};\nconsole.log(o.f()(), o.g());`,
    opts: ['5 undefined', '5 5', 'undefined undefined', 'خطأ'], a: 0,
    why: ['f عادية: this=o فيرثها سهمه الداخلي → 5.', 'g سهمية عرّفت بمستوى الوحدة: this ليس o → undefined (؟. يقي من رمي خطأ).'] },
  { id: 'async2', cat: 'async', t: 'سلسلة then',
    code: `Promise.resolve(1)\n  .then(x => x + 1)\n  .then(x => x * 10)\n  .then(x => console.log(x));`,
    opts: ['20', '11', '2', '1'], a: 0,
    why: ['كل then تمرر قيمة إرجاعها للتالية: 1→2→20.', '20 تُطبع في then الأخيرة.'] },
  { id: 'async3', cat: 'async', t: 'مؤقتات متداخلة',
    code: `setTimeout(() => console.log('a'));\nsetTimeout(() => {\n  console.log('b');\n  setTimeout(() => console.log('c'));\n});\nconsole.log('d');`,
    opts: ['d a b c', 'a b c d', 'd b a c', 'b c a d'], a: 0,
    why: ["d متزامنة أولاً، ثم المؤقتتان بترتيب التسجيل: a ثم b.", "c أُسجلت داخل b فتنفذ بعدها — لذا d,a,b,c."] },
];

let cur = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const done = () => SNIPS.filter(s => st[s.id] && st[s.id].ok).length;
const wrongs = () => SNIPS.filter(s => st[s.id] && st[s.id].tries > 0 && st[s.id].ok === false);

function catStats() {
  const cs = {};
  SNIPS.forEach(s => {
    if (!st[s.id]) return;
    cs[s.cat] = cs[s.cat] || { ok: 0, tot: 0 };
    cs[s.cat].tot++;
    if (st[s.id].ok) cs[s.cat].ok++;
  });
  return cs;
}

function head() {
  const cs = catStats();
  const chips = ['closure', 'this', 'async'].filter(c => cs[c]).map(c =>
    `<span class="cr-chip">${CATN[c]} <b>${cs[c].ok}/${cs[c].tot}</b></span>`).join('');
  $('#crStats').innerHTML = `✓${done()}/${SNIPS.length} • سلسلة <b>${st.__streak}</b> • أفضل <b>${st.__best}</b> ${chips}`;
}

async function runIt(code) {
  const out = [];
  const fake = { log: (...a) => out.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')) };
  try { new Function('console', '"use strict";\n' + code)(fake); }
  catch (e) { out.push('⚠ ' + e.name + ': ' + e.message); }
  await sleep(80); /* يسيل microtasks + المؤقتات المسجلة */
  return out.join('\n') || '(لا مخرجات)';
}

function list() {
  const w = wrongs();
  return w.length ? `<div class="cr-wrongs"><b>راجع أخطاءك:</b> ${w.map(s =>
    `<button class="btn ghost sm" onclick="location.hash='r';__crGo(${SNIPS.indexOf(s)})">${escH(s.t)}</button>`).join(' ')}</div>` : '';
}
window.__crGo = i => { cur = i; render(); };

function render() {
  head();
  const s = SNIPS[cur], prev = st[s.id];
  $('#crMain').innerHTML = `
    ${list()}
    <div class="lb-head" style="margin:12px 0 14px">
      <span class="lb-cat-tag">${CATN[s.cat]}</span>
      <span class="dh-idx">${cur + 1}/${SNIPS.length}</span>
      <h2 class="lb-t">${prev && prev.ok ? '✅' : '📖'} ${escH(s.t)}</h2>
    </div>
    <pre class="db-out dh-code" dir="ltr">${escH(s.code)}</pre>
    <div class="dh-ask">ما الناتج؟ (اختر قبل التشغيل)</div>
    <div class="dh-opts">${s.opts.map((o, i) => `<button class="dh-opt" data-i="${i}" dir="ltr">${escH(o)}</button>`).join('')}</div>
    <div id="crRes"></div>
    <div class="dh-nav">
      <button class="btn ghost sm" id="crPrev" ${cur === 0 ? 'disabled' : ''}>‹ السابق</button>
      <span class="dh-count">${done()} أتقنت</span>
      <button class="btn ghost sm" id="crNext" ${cur === SNIPS.length - 1 ? 'disabled' : ''}>التالي ›</button>
    </div>`;
  $('#crPrev').onclick = () => { cur--; render(); };
  $('#crNext').onclick = () => { cur++; render(); };
  if (prev && prev.tries > 0) reveal(s, -1, true);
  $('#crMain').querySelectorAll('.dh-opt').forEach(b => b.onclick = () => pick(s, +b.dataset.i));
}

async function reveal(s, picked, silent) {
  const bs = $('#crMain').querySelectorAll('.dh-opt');
  bs.forEach((b, i) => {
    b.disabled = true;
    if (i === s.a) b.classList.add('ok');
    else if (i === picked) b.classList.add('bad');
  });
  const okNow = picked === s.a;
  $('#crRes').innerHTML = `
    ${!silent ? `<div class="${okNow ? 'pn-ok' : 'pn-bad'}" style="margin-bottom:8px">${okNow ? '✓ صحيح!' : `✗ — الناتج الصحيح: <b dir="ltr">${escH(s.opts[s.a])}</b>`}</div>` : ''}
    <button class="btn sm" id="crRun">▶ شغّل فعلياً</button>
    <div id="crRunOut"></div>
    <div class="dh-why"><b>لماذا؟</b><ol class="cr-why" dir="rtl">${s.why.map(w => `<li>${escH(w)}</li>`).join('')}</ol></div>`;
  $('#crRun').onclick = async () => {
    $('#crRun').disabled = true; $('#crRun').textContent = '⏳ …';
    const r = await runIt(s.code);
    $('#crRunOut').innerHTML = `<pre class="db-out" dir="ltr" style="margin:10px 0">${escH(r)}</pre>`;
    $('#crRun').style.display = 'none';
  };
}

function pick(s, i) {
  const rec = st[s.id] = st[s.id] || { ok: false, tries: 0 };
  if (rec.tries === 0) rec.ok = i === s.a;
  rec.tries++;
  const correct = i === s.a;
  if (correct) { st.__streak++; st.__best = Math.max(st.__best, st.__streak); }
  else st.__streak = 0;
  save(); head();
  const c = $('#crMain').querySelector('.dh-count'); if (c) c.textContent = `${done()} أتقنت`;
  reveal(s, i, false);
}

head(); render();
})();
