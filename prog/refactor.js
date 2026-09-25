/* برمج — المُعيد: 10 تمارين إعادة هيكلة — روائح + اختبارات سلوك + عرض قبل/بعد */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let st = {};
try { st = JSON.parse(localStorage.getItem('prog_refact') || '{}') || {}; } catch (e) { st = {}; }
const save = () => localStorage.setItem('prog_refact', JSON.stringify(st));

/* {code: الكود المكروه, smells:[الروائح الحقيقية], tests:[سلوك+نظافة على _src], sol: حل نموذجي} */
const EX = [
  { id: 'magic', cat: 'ثوابت', t: 'الأرقام السحرية',
    bug: 'أرقام مجردة بلا اسم — معناها خفيّ وقابليتها للخطأ عالية. المطلوب: ثوابت مسماة بالأعلى.',
    code: `function discount(price, vip) {
  if (vip) return price - price * 0.15;
  return price - price * 0.05;
}
function tax(p) { return p + p * 0.15; }
console.log(discount(100, true), tax(100)); // 85 115`,
    smells: ['أرقام سحرية (magic numbers)', 'قيم متكررة بين الدوال'],
    tests: [
      { t: s => s.discount(100, true) === 85 && s.tax(100) === 115, m: 'السلوك محفوظ' },
      { t: s => /const\s+\w+\s*=\s*0\.15|const\s+\w+\s*=\s*0\.05/.test(s._src), m: 'ثابت مسمّى موجود' },
      { t: s => (s._src.match(/0\.05/g) || []).length <= 1 && (s._src.match(/0\.15/g) || []).length <= 2, m: 'الأرقام داخل ثوابت لا مبعثرة' }] },
  { id: 'nest', cat: 'مبكر', t: 'الأهرام المتداخلة',
    bug: 'أربع مستويات تداخل — استبدلها بحراس return مبكر (guard clauses).',
    code: `function score(u) {
  if (u) {
    if (u.active) {
      if (u.points >= 100) {
        return 'ذهبي';
      } else { return 'فضي'; }
    } else { return 'غير نشط'; }
  } else { return 'لا مستخدم'; }
}
console.log(score({active:true,points:120})); // ذهبي`,
    smells: ['تداخل if عميق (pyramid of doom)', 'else بعد return'],
    tests: [
      { t: s => s.score({ active: true, points: 120 }) === 'ذهبي' && s.score(null) === 'لا مستخدم', m: 'السلوك محفوظ' },
      { t: s => !/else/.test(s._src), m: 'لا else متبقية' }] },
  { id: 'long', cat: 'تقسيم', t: 'الدالة العملاقة',
    bug: 'دالة تفعل ثلاثة أشياء — قسّمها لدوال صغيرة مسماة (تحقق/احسب/اطبع).',
    code: `function report(items) {
  let tot = 0;
  for (const it of items) { if (it.price < 0) throw Error('سالب'); tot += it.price; }
  const avg = tot / items.length;
  let r = 'الكلي: ' + tot + ' متوسط: ' + avg.toFixed(1);
  console.log(r);
  return r;
}
report([{price:10},{price:20},{price:30}]);`,
    smells: ['دالة طويلة بمسؤوليات متعددة'],
    tests: [
      { t: s => s.report([{ price: 10 }, { price: 20 }, { price: 30 }]) === 'الكلي: 60 متوسط: 20.0', m: 'السلوك محفوظ' },
      { t: s => (s._src.match(/function\s+\w+/g) || []).length >= 2, m: 'قُسّمت لدالتين+' }] },
  { id: 'dup', cat: 'تكرار', t: 'نسخ ولصق',
    bug: 'نفس منطق التنسيق مكرر ثلاث مرات — استخرجه لدالة مساعدة.',
    code: `function hi(name) {
  const n = name.trim().toLowerCase();
  return 'أهلاً ' + n.charAt(0).toUpperCase() + n.slice(1);
}
function bye(name) {
  const n = name.trim().toLowerCase();
  return 'وداعاً ' + n.charAt(0).toUpperCase() + n.slice(1);
}
console.log(hi('  AHMED '), bye('sara'));`,
    smells: ['كود مكرر (DRY violation)'],
    tests: [
      { t: s => s.hi('  AHMED ') === 'أهلاً Ahmed' && s.bye('sara') === 'وداعاً Sara', m: 'السلوك محفوظ' },
      { t: s => (s._src.match(/toLowerCase/g) || []).length <= 1, m: 'التنسيق في مكان واحد' }] },
  { id: 'bool', cat: 'تبسيط', t: 'أرجِع الشرط نفسه',
    bug: 'if ترجع true وelse ترجع false — الشرط نفسه هو القيمة.',
    code: `function adult(age) {
  if (age >= 18) { return true; }
  else { return false; }
}
function big(list) {
  if (list.length > 10) { return true; } else { return false; }
}
console.log(adult(20), big([1,2]));`,
    smells: ['if/else تعيد قيماً منطقية خام', 'else بعد return'],
    tests: [
      { t: s => s.adult(20) === true && s.adult(10) === false && s.big([1, 2]) === false, m: 'السلوك محفوظ' },
      { t: s => !/return\s+(true|false)/.test(s._src), m: 'لا return true/false خام' }] },
  { id: 'loop', cat: 'مبنيّة', t: 'حلقة تبحث يدوياً',
    bug: 'حلقة for تبحث عن عنصر بشرط — find/includes المعبّر أقصر وأوضح.',
    code: `function hasAdmin(users) {
  let found = false;
  for (const u of users) {
    if (u.role === 'admin') { found = true; break; }
  }
  return found;
}
console.log(hasAdmin([{role:'user'},{role:'admin'}])); // true`,
    smells: ['حلقة يدوية لعملية مبنية (find/some)'],
    tests: [
      { t: s => s.hasAdmin([{ role: 'user' }]) === false && s.hasAdmin([{ role: 'admin' }]) === true, m: 'السلوك محفوظ' },
      { t: s => /\.(find|some|includes)\s*\(/.test(s._src) && !/for\s*\(/.test(s._src), m: 'find/some بدل الحلقة' }] },
  { id: 'str', cat: 'حديثة', t: 'سلاسل متصلة',
    bug: 'جمع سلاسل بـ+ وعلامات اقتباس متشابكة — قوالب `القالب ${x}` أوضح.',
    code: `function card(user) {
  return '<div class="card">' +
    '<h2>' + user.name + '</h2>' +
    '<p>العمر: ' + user.age + '</p>' +
  '</div>';
}
console.log(card({name:'ليلى',age:9}));`,
    smells: ['سلاسل متصلة بـ+ بدل القوالب'],
    tests: [
      { t: s => s.card({ name: 'x', age: 1 }) === '<div class="card"><h2>x</h2><p>العمر: 1</p></div>', m: 'السلوك محفوظ' },
      { t: s => s._src.indexOf('`') > -1, m: 'قوالب template مستعملة' }] },
  { id: 'sw', cat: 'بيانات', t: 'switch الطويل',
    bug: 'switch بثماني حالات لقيم ثابتة — جدول lookup (كائن) أقصر وقابل للتوسع.',
    code: `function days(m) {
  switch (m) {
    case 'يناير': return 31;
    case 'فبراير': return 28;
    case 'مارس': return 31;
    case 'أبريل': return 30;
    case 'مايو': return 31;
    default: return -1;
  }
}
console.log(days('مارس'), days('x'));`,
    smells: ['switch/slسلاسل if لجداول lookup'],
    tests: [
      { t: s => s.days('مارس') === 31 && s.days('x') === -1 && s.days('فبراير') === 28, m: 'السلوك محفوظ' },
      { t: s => !/switch|case\s/.test(s._src) && /\{[^{}]*31[^{}]*\}/s.test(s._src) || /:\s*31/.test(s._src), m: 'جدول كائن بدل switch' }] },
  { id: 'var', cat: 'حديثة', t: 'var القديمة',
    bug: 'var وإعادة إسناد عشوائية — const افتراضياً وlet عند التغيير فقط.',
    code: `var total = 0;
function sum(prices) {
  var i = 0;
  var out = 0;
  for (i = 0; i < prices.length; i++) {
    out += prices[i];
  }
  return out;
}
total = sum([1,2,3]);
console.log(total); // 6`,
    smells: ['var بدل const/let', 'متغير خارجي يتسرب'],
    tests: [
      { t: s => s.sum([1, 2, 3]) === 6 && s.sum([]) === 0, m: 'السلوك محفوظ' },
      { t: s => !/\bvar\b/.test(s._src), m: 'لا var متبقية' },
      { t: s => /const\s+total|let\s+total/.test(s._src) || !/total\s*=/.test(s._src), m: 'total محلية أو معرّفة' }] },
  { id: 'arg', cat: 'تبسيط', t: 'معاملات كثيرة',
    bug: 'خمسة معاملات مترابطة — كائن خيارات واحد أوضح.',
    code: `function fmt(name, city, age, job, phone) {
  return name + ' | ' + city + ' | ' + age + ' | ' + job + ' | ' + phone;
}
console.log(fmt('أمل','جدة','30','طبيبة','555'));`,
    smells: ['قائمة معاملات طويلة (parameter list)'],
    tests: [
      { t: s => s.fmt({ name: 'أمل', city: 'جدة', age: 30, job: 'طبيبة', phone: '555' }).indexOf('أمل') === 0, m: 'تستقبل كائناً' },
      { t: s => (s._src.match(/function\s+fmt\s*\(([^)]*)\)/) || [null, ''])[1].split(',').length <= 1, m: 'معامل واحد' }] },
];

const CATS = [...new Set(EX.map(e => e.cat))];
let sel = 0;

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

/* فرق بسيط سطر-بسطر بين الكودين */
function diff(before, after) {
  const A = before.split('\n'), B = after.split('\n');
  const aSet = new Set(A.map(l => l.trim()).filter(Boolean));
  const bSet = new Set(B.map(l => l.trim()).filter(Boolean));
  const rows = B.filter(l => !aSet.has(l.trim()) && l.trim()).map(l => `<div class="rf-plus">+ ${escH(l)}</div>`);
  const dels = A.filter(l => !bSet.has(l.trim()) && l.trim()).map(l => `<div class="rf-minus">− ${escH(l)}</div>`);
  return dels.length || rows.length ? `<div class="rf-diff" dir="ltr">${dels.slice(0, 8).join('')}${rows.slice(0, 8).join('')}</div>` : '<div class="rf-diff">لا فروقات سطرية ظاهرة.</div>';
}

function list() {
  const done = EX.filter(e => st[e.id]).length;
  $('#rfCount').textContent = `${done}/${EX.length}`;
  $('#rfBar').style.width = Math.round(done / EX.length * 100) + '%';
  $('#rfList').innerHTML = `<div class="lb-list-h">التمارين — ${done}/${EX.length}</div>` +
    CATS.map(cat => `<div class="lb-cat">${escH(cat)}</div>` +
      EX.map((e, i) => e.cat === cat ? `<button class="lb-item ${i === sel ? 'on' : ''} ${st[e.id] ? 'done' : ''}" data-i="${i}">${st[e.id] ? '✓ ' : ''}♻️ ${escH(e.t)}</button>` : '').join('')).join('');
  $('#rfList').querySelectorAll('.lb-item').forEach(b => b.onclick = () => { sel = +b.dataset.i; render(); });
}

function render() {
  const e = EX[sel];
  const marks = st[e.id + ':smells'] || [];
  $('#rfMain').innerHTML = `
    <div class="lb-head">
      <span class="lb-cat-tag">${escH(e.cat)}</span>
      <h2 class="lb-t">${st[e.id] ? '✓ ' : ''}♻️ ${escH(e.t)}</h2>
      <div class="db-bug">${escH(e.bug)}</div>
    </div>
    <div class="rf-smells-h">شمّ الروائح — علّم ما تكتشفه قبل الإصلاح:</div>
    <div class="rf-smells">
      ${e.smells.map((s, i) => `<label class="rf-smell ${marks.includes(i) ? 'found' : ''}"><input type="checkbox" data-s="${i}" ${marks.includes(i) ? 'checked' : ''}> ${escH(s)}</label>`).join('')}
      <label class="rf-smell decoy"><input type="checkbox" data-s="d" ${marks.includes('d') ? 'checked' : ''}> لا رائحة — الكود نظيف</label>
    </div>
    <div class="lb-ed-h">الكود الحالي (اقرأه):</div>
    <pre class="db-out rf-code-view" dir="ltr">${escH(e.code)}</pre>
    <div class="lb-ed-h">نسختك المُعاد هيكلتها (نفس المخرجات):</div>
    <textarea id="rfEd" dir="ltr" spellcheck="false">${escH(e.code)}</textarea>
    <div class="lb-act">
      <button class="btn" id="rfRun">تشغيل ⟵</button>
      <button class="btn ghost" id="rfTest" disabled>تحقّق بالاختبارات</button>
      <button class="btn ghost" id="rfSol">الحل النموذجي + الفرق</button>
    </div>
    <pre class="db-out" id="rfOut" dir="ltr">المخرجات تظهر هنا بعد التشغيل.</pre>
    <div id="rfRes"></div>`;
  $('#rfMain').querySelectorAll('.rf-smell input').forEach(cb => cb.onchange = () => {
    const k = e.id + ':smells'; const arr = st[k] || [];
    const v = cb.dataset.s === 'd' ? 'd' : +cb.dataset.s;
    const i = arr.indexOf(v); cb.checked ? (i < 0 && arr.push(v)) : (i >= 0 && arr.splice(i, 1));
    st[k] = arr; save();
    cb.closest('.rf-smell').classList.toggle('found', cb.checked && cb.dataset.s !== 'd');
  });
  $('#rfRun').onclick = () => {
    const r = execSrc($('#rfEd').value);
    window._rfx = r;
    $('#rfOut').textContent = (r.logs.join('\n') || '(لا مخرجات)') + (r.err ? '\n❌ ' + r.err : '');
    $('#rfTest').disabled = false;
  };
  $('#rfTest').onclick = async () => {
    const r = window._rfx || execSrc($('#rfEd').value);
    const box = $('#rfRes');
    if (r.err) { box.innerHTML = `<div class="lb-fail">❌ خطأ تشغيل: ${escH(r.err)}</div>`; return; }
    let all = true; const rows = [];
    for (const tst of e.tests) {
      let ok = false; try { ok = await tst.t(r.scope); } catch (x) { ok = false; }
      all = all && ok;
      rows.push(`<div class="lb-test ${ok ? 'ok' : 'fail'}">${ok ? '✓' : '✗'} ${escH(tst.m)}</div>`);
    }
    box.innerHTML = rows.join('') + (all ? '<div class="lb-win">🎉 إعادة ناجحة — السلوك محفوظ والروائح زالت!</div>' : '<div class="lb-fail">اختبارات فاشلة — حافظ على السلوك وأزل الروائح.</div>');
    if (all && !st[e.id]) { st[e.id] = true; save(); list(); }
  };
  $('#rfSol').onclick = () => {
    const sols = {
      magic: `const VIP_RATE = 0.15, BASE_RATE = 0.05, TAX_RATE = 0.15;\nfunction discount(price, vip) {\n  return price - price * (vip ? VIP_RATE : BASE_RATE);\n}\nfunction tax(p) { return p + p * TAX_RATE; }\nconsole.log(discount(100, true), tax(100));`,
      nest: `function score(u) {\n  if (!u) return 'لا مستخدم';\n  if (!u.active) return 'غير نشط';\n  return u.points >= 100 ? 'ذهبي' : 'فضي';\n}\nconsole.log(score({active:true,points:120}));`,
      long: `function validate(items) {\n  for (const it of items) if (it.price < 0) throw Error('سالب');\n}\nfunction total(items) {\n  return items.reduce((s, it) => s + it.price, 0);\n}\nfunction report(items) {\n  validate(items);\n  const tot = total(items);\n  const r = 'الكلي: ' + tot + ' متوسط: ' + (tot / items.length).toFixed(1);\n  console.log(r);\n  return r;\n}\nreport([{price:10},{price:20},{price:30}]);`,
      dup: `function fmt(name) {\n  const n = name.trim().toLowerCase();\n  return n.charAt(0).toUpperCase() + n.slice(1);\n}\nfunction hi(name) { return 'أهلاً ' + fmt(name); }\nfunction bye(name) { return 'وداعاً ' + fmt(name); }\nconsole.log(hi('  AHMED '), bye('sara'));`,
      bool: `const adult = age => age >= 18;\nconst big = list => list.length > 10;\nconsole.log(adult(20), big([1,2]));`,
      loop: `const hasAdmin = users => users.some(u => u.role === 'admin');\nconsole.log(hasAdmin([{role:'user'},{role:'admin'}]));`,
      str: `function card(user) {\n  return \`<div class="card"><h2>\${user.name}</h2><p>العمر: \${user.age}</p></div>\`;\n}\nconsole.log(card({name:'ليلى',age:9}));`,
      sw: `const DAYS = { 'يناير': 31, 'فبراير': 28, 'مارس': 31, 'أبريل': 30, 'مايو': 31 };\nconst days = m => DAYS[m] ?? -1;\nconsole.log(days('مارس'), days('x'));`,
      var: `function sum(prices) {\n  let out = 0;\n  for (const p of prices) out += p;\n  return out;\n}\nconst total = sum([1,2,3]);\nconsole.log(total);`,
      arg: `function fmt(u) {\n  return [u.name, u.city, u.age, u.job, u.phone].join(' | ');\n}\nconsole.log(fmt({name:'أمل',city:'جدة',age:30,job:'طبيبة',phone:'555'}));`,
    };
    const box = $('#rfRes');
    box.innerHTML = `<div class="rf-sol-h">الحل النموذجي — فرق قبل/بعد:</div>` + diff(e.code, sols[e.id] || e.code) + `<pre class="db-out rf-code-view" dir="ltr">${escH(sols[e.id] || e.code)}</pre>`;
  };
}

list(); render();
})();
