/* برمج — مُتتبّع: مدرب التتبع الذهني — تنبّأ بالمخرج/القيمة قبل الكشف (الأجوبة تُشتق من التنفيذ الفعلي) */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* المقتطفات — 30 مرتبة من السهل للصعب. steps: out=مخرج رقم i، last=آخر مخرج، count=عدد الأسطر، var=قيمة متغير، seq=الترتيب كاملاً */
const SNIPS = [
  /* ==== أساسيات وحلقات ==== */
  { id: 't1', cat: 'أساسيات', t: 'عدّ تصاعدي', code: `for (let i = 1; i <= 3; i++) {\n  print(i);\n}`,
    steps: [{ k: 'out', i: 0, why: 'i تبدأ بـ1 وتُطبع قبل الزيادة.' }, { k: 'last', why: 'تتوقف الحلقة عند i=4، آخر طبع 3.' }, { k: 'count', why: '1، 2، 3 = ثلاثة أسطر.' }] },
  { id: 't2', cat: 'أساسيات', t: 'جمع تراكمي', code: `let s = 0;\nfor (let i = 1; i <= 4; i++) {\n  s += i;\n  print(s);\n}`,
    steps: [{ k: 'out', i: 0, why: 's=0+1=1.' }, { k: 'out', i: 2, why: 's=1+2+3=6.' }, { k: 'last', why: 's=1+2+3+4=10.' }, { k: 'var', v: 's', why: 's انتهت بـ10 — مجموع 1..4.' }] },
  { id: 't3', cat: 'أساسيات', t: 'عدّ تنازلي بقفزات', code: `let i = 5;\nwhile (i > 0) {\n  print(i);\n  i -= 2;\n}`,
    steps: [{ k: 'out', i: 1, why: 'بعد 5 تصبح i=3.' }, { k: 'count', why: '5، 3، 1 ثم i=-1 يوقف الحلقة.' }, { k: 'var', v: 'i', why: '1-2=-1 ← خرجت من الشرط.' }] },
  { id: 't4', cat: 'أساسيات', t: 'تخطٍّ بـcontinue', code: `for (let i = 0; i < 6; i++) {\n  if (i % 2) continue;\n  print(i);\n}`,
    steps: [{ k: 'out', i: 0, why: 'i=0 زوجي → يُطبع.' }, { k: 'count', why: 'يُطبع الأزواج فقط: 0، 2، 4.' }] },
  { id: 't5', cat: 'أساسيات', t: 'كسر مبكر بـbreak', code: `for (let i = 1; i < 10; i++) {\n  if (i > 3) break;\n  print(i);\n}`,
    steps: [{ k: 'count', why: 'عند i=4 يكسر — طُبع 1، 2، 3.' }, { k: 'last', why: 'آخر قيمة قبل break هي 3.' }] },
  { id: 't6', cat: 'أساسيات', t: 'حلقتان متداخلتان', code: `for (let i = 1; i <= 2; i++) {\n  for (let j = 1; j <= 2; j++) {\n    print(i + ',' + j);\n  }\n}`,
    steps: [{ k: 'out', i: 1, why: 'i=1 ثابتة وج تدور: 1,2.' }, { k: 'count', why: '2×2 = أربعة أسطر.' }, { k: 'seq', why: 'الداخلية تُكمل دورتها لكل قيمة i.' }] },
  { id: 't7', cat: 'أساسيات', t: 'بناء سلسلة معكوسة', code: `let s = '';\nfor (const c of 'abc') {\n  s = c + s;\n  print(s);\n}`,
    steps: [{ k: 'out', i: 1, why: 'b تُوضع قبل a: ba.' }, { k: 'last', why: 'كل حرف يسبق السابقين: cba.' }] },
  { id: 't8', cat: 'أساسيات', t: 'دليل ضد قيمة', code: `const a = [5, 7, 9];\nfor (let i = 0; i < a.length; i++) {\n  print(a[i] + i);\n}`,
    steps: [{ k: 'out', i: 0, why: 'a[0]+0 = 5.' }, { k: 'out', i: 2, why: 'a[2]+2 = 9+2 = 11.' }] },
  { id: 't9', cat: 'أساسيات', t: 'do-while تنفّذ مرة', code: `let i = 10;\ndo {\n  print(i);\n  i++;\n} while (i < 5);`,
    steps: [{ k: 'count', why: 'do-while تفحص الشرط بعد التنفيذ — طبعة واحدة.' }, { k: 'last', why: 'i=10 الوحيدة المطبوعة.' }] },
  { id: 't10', cat: 'أساسيات', t: 'خارج الحدود اللغز', code: `for (let i = 0; i <= 3; i++) {\n  print(i);\n}`,
    steps: [{ k: 'count', why: 'i<=3 تشمل 0 — أربع طبعات لا ثلاث.' }] },

  /* ==== نطاقات ==== */
  { id: 't11', cat: 'نطاقات', t: 'تظليل داخل حلقة', code: `let x = 1;\nfor (let i = 0; i < 3; i++) {\n  let x = i * 10;\n  print(x);\n}\nprint(x);`,
    steps: [{ k: 'out', i: 1, why: 'الداخلية x جديدة كل تكرار: 10.' }, { k: 'last', why: 'الأخيرة x الخارجية لم تُمسّ: 1.' }, { k: 'var', v: 'x', why: 'x الخارجية بقيت 1 — الداخلية عاشت داخل الكتلة فقط.' }] },
  { id: 't12', cat: 'نطاقات', t: 'معامل يظلّل عمومياً', code: `let x = 5;\nfunction f(x) {\n  x++;\n  print(x);\n}\nf(1);\nprint(x);`,
    steps: [{ k: 'out', i: 0, why: 'المعامل x=1 ينسّخ القيمة ثم ++ → 2.' }, { k: 'last', why: 'العمومية x لم تتغير: 5.' }] },
  { id: 't13', cat: 'نطاقات', t: 'var ترتفع ولا تُعرّف', code: `print(x);\nvar x = 7;\nprint(x);`,
    steps: [{ k: 'out', i: 0, why: 'رفع var يرفع التصريح لا القيمة → undefined.' }, { k: 'last', why: 'بعد الإسناد x=7.' }] },
  { id: 't14', cat: 'نطاقات', t: 'إغلاق يتذكر عدّاده', code: `function mk() {\n  let c = 0;\n  return () => { c++; print(c); };\n}\nconst f = mk();\nf();\nf();`,
    steps: [{ k: 'out', i: 1, why: 'c محفوظة في الإغلاق بين النداءين: 2.' }, { k: 'count', why: 'نداءان = سطران.' }] },
  { id: 't15', cat: 'نطاقات', t: 'كتلة let لا تسرّب', code: `let y = 1;\n{\n  let y = 20;\n  y++;\n  print(y);\n}\nprint(y);`,
    steps: [{ k: 'out', i: 0, why: 'داخل الكتلة y الجديدة: 21.' }, { k: 'last', why: 'خارجها y=1 الأصلية.' }] },
  { id: 't16', cat: 'نطاقات', t: 'دالة تُرفع كاملة', code: `print(add(2, 3));\nfunction add(a, b) { return a + b; }`,
    steps: [{ k: 'out', i: 0, why: 'تصريحات function تُرفع بجسمها → 5 قبل سطر التعريف.' }] },

  /* ==== دوال ومكدس ==== */
  { id: 't17', cat: 'دوال ومكدس', t: 'نداء داخل نداء', code: `function a() { print('a'); }\nfunction b() { a(); print('b'); }\nb();`,
    steps: [{ k: 'seq', why: 'b تستدعي a أولاً ثم تطبع نفسها.' }] },
  { id: 't18', cat: 'دوال ومكدس', t: 'تراجع مرصود', code: `function f(n) {\n  if (n <= 0) return;\n  print(n);\n  f(n - 1);\n}\nf(3);`,
    steps: [{ k: 'count', why: 'f(3),f(2),f(1) ثم f(0) يرجع: ثلاث طبعات.' }, { k: 'last', why: 'الأعمق n=1 هو الأخير.' }] },
  { id: 't19', cat: 'دوال ومكدس', t: 'جمع تكراري', code: `function s(n) {\n  if (n <= 1) return n;\n  return n + s(n - 1);\n}\nprint(s(4));`,
    steps: [{ k: 'out', i: 0, why: '4+3+2+1 = 10 — تتراكم عند عودة المكدس.' }] },
  { id: 't20', cat: 'دوال ومكدس', t: 'عمق قبل الطبع', code: `function g(n) {\n  if (n > 0) g(n - 1);\n  print(n);\n}\ng(3);`,
    steps: [{ k: 'out', i: 0, why: 'الطبع بعد التعادد → الأعمق أولاً: 0.' }, { k: 'last', why: 'الخارجي n=3 يُطبع آخراً.' }] },
  { id: 't21', cat: 'دوال ومكدس', t: 'عدّاد عمومي مشترك', code: `let c = 0;\nfunction inc() { c++; }\ninc(); inc(); inc();\nprint(c);`,
    steps: [{ k: 'out', i: 0, why: 'ثلاث زيادات على نفس c: 3.' }, { k: 'var', v: 'c', why: 'c عمومية مشتركة = 3.' }] },
  { id: 't22', cat: 'دوال ومكدس', t: 'قيمة مرجعة مفقودة', code: `function dbl(n) {\n  n * 2;  // لاحظ: بلا return\n}\nprint(dbl(5));`,
    steps: [{ k: 'out', i: 0, why: 'بلا return تعيد الدالة undefined.' }] },

  /* ==== بنى بيانات ==== */
  { id: 't23', cat: 'بنى بيانات', t: 'push ثم pop', code: `const a = [1];\na.push(2);\na.pop();\na.push(3);\nprint(a.join('-'));`,
    steps: [{ k: 'out', i: 0, why: 'pop أخرجت 2 وبقي [1,3].' }] },
  { id: 't24', cat: 'بنى بيانات', t: 'map تحويلية', code: `const r = [1, 2, 3].map(x => x * 2);\nprint(r.join(','));`,
    steps: [{ k: 'out', i: 0, why: 'كل عنصر ×2: 2,4,6.' }] },
  { id: 't25', cat: 'بنى بيانات', t: 'filter وعدّ', code: `const ev = [1, 2, 3, 4].filter(x => x % 2 === 0);\nprint(ev.length);\nprint(ev[0]);`,
    steps: [{ k: 'out', i: 0, why: 'زوجيان: 2 و4 → طول 2.' }, { k: 'last', why: 'أول زوجي هو 2.' }] },
  { id: 't26', cat: 'بنى بيانات', t: 'اسم مستعار للمصفوفة', code: `const a = [1, 2];\nconst b = a;\nb.push(3);\nprint(a.length);`,
    steps: [{ k: 'out', i: 0, why: 'b مرجع لنفس a — الإضافة تظهر فيهما: 3.' }, { k: 'var', v: 'b.length', why: 'نفس المصفوفة المشتركة: 3.' }] },
  { id: 't27', cat: 'بنى بيانات', t: 'كائن يتبدل', code: `const o = { a: 1 };\no.b = 2;\no.a += o.b;\nprint(o.a + ':' + o.b);`,
    steps: [{ k: 'out', i: 0, why: 'a=1+2=3 وb=2 → 3:2.' }] },
  { id: 't28', cat: 'بنى بيانات', t: 'slice لا يقطع الأصل', code: `const a = [1, 2, 3, 4];\nprint(a.slice(1, 3).join(','));\nprint(a.length);`,
    steps: [{ k: 'out', i: 0, why: 'slice(1,3) يأخذ الفهرسين 1,2: 2,3.' }, { k: 'last', why: 'slice لا يعدّل الأصل: 4.' }] },
  { id: 't29', cat: 'بنى بيانات', t: 'تبادل بالتفكيك', code: `let a = 1, b = 2;\n[a, b] = [b, a];\nprint(a + ',' + b);`,
    steps: [{ k: 'out', i: 0, why: 'التفكيك يقيّم اليمين قبل الإسناد: 2,1.' }] },
  { id: 't30', cat: 'بنى بيانات', t: 'مفاتيح الكائن', code: `const o = { x: 1, y: 2 };\nfor (const k in o) {\n  print(k + '=' + o[k]);\n}`,
    steps: [{ k: 'out', i: 0, why: 'for..in يمر على المفاتيح بترتيب الإدراج: x=1.' }, { k: 'count', why: 'مفتاحان = سطران.' }] }
];

/* التنفيذ الفعلي: print ملتقط، var يُقيَّم بعد التنفيذ */
function run(code) {
  const outs = [];
  const print = (...a) => outs.push(a.map(String).join(' '));
  try { new Function('print', '"use strict";\n' + code)(print); }
  catch (e) { outs.push('خطأ: ' + e.message); }
  return outs;
}
function evalVar(code, v) {
  try { return String(new Function('print', '"use strict";\n' + code + '\n;return (' + v + ');')(() => {})); }
  catch (e) { return 'خطأ: ' + e.message; }
}
const fmt = v => Array.isArray(v) ? v.join(', ') : String(v);

/* مشتتات حول القيمة الحقيقية */
function distract(a, pool) {
  const out = new Set(); const s = String(a);
  const num = Number(s);
  if (!isNaN(num) && s !== '') [-2, -1, 1, 2, 10].forEach(d => out.add(String(num + d)));
  if (s.length > 1) out.add(s.split('').reverse().join(''));
  pool.forEach(p => { if (String(p) !== s) out.add(String(p)); });
  out.add('undefined'); out.add('خطأ');
  const arr = [...out].filter(x => x !== s);
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr.slice(0, 3);
}

function buildStep(sp, st, outs) {
  if (st.q) return st; /* سؤال مخصص جاهز */
  const pool = outs.concat([0, 1]);
  if (st.k === 'out') {
    const a = fmt(outs[st.i]);
    return { k: st.k, i: st.i, q: 'ما الذي سيُطبع في السطر ' + (st.i + 1) + '؟', opts: shuffle([a, ...distract(a, pool)]), a, why: st.why };
  }
  if (st.k === 'last') {
    const a = fmt(outs[outs.length - 1]);
    return { k: st.k, q: 'ما آخر سطر سيُطبع؟', opts: shuffle([a, ...distract(a, pool)]), a, why: st.why };
  }
  if (st.k === 'count') {
    const a = String(outs.length);
    return { k: st.k, q: 'كم سطراً سيُطبع إجمالاً؟', opts: shuffle([a, ...distract(a, [outs.length + 1, outs.length - 1, outs.length + 2])]), a, why: st.why };
  }
  if (st.k === 'var') {
    const a = evalVar(sp.code, st.v);
    return { k: st.k, q: 'ما قيمة ' + st.v + ' بعد انتهاء التنفيذ؟', opts: shuffle([a, ...distract(a, pool)]), a, why: st.why };
  }
  if (st.k === 'seq') {
    const a = outs.map(fmt).join(' ثم ');
    const rev = outs.slice().reverse().map(fmt).join(' ثم ');
    const rot = outs.length > 2 ? outs.slice(1).concat(outs[0]).map(fmt).join(' ثم ') : a;
    const mixed = outs.length > 1 ? [outs[outs.length - 1]].concat(outs.slice(0, -1)).map(fmt).join(' ثم ') : a;
    return { k: st.k, q: 'أي ترتيب طبع صحيح؟', opts: shuffle([a, rev, rot === a ? mixed : rot, mixed === a || mixed === rev ? a + ' (مرتين)' : mixed].filter((v, i, arr2) => arr2.indexOf(v) === i).slice(0, 4)), a, why: st.why };
  }
  return st;
}
function shuffle(a) { const arr = a.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

let st; try { st = JSON.parse(localStorage.getItem('prog_tracer') || '{}') || {}; } catch (e) { st = {}; }
const save = () => localStorage.setItem('prog_tracer', JSON.stringify(st));
let cur = 0;

const cats = [...new Set(SNIPS.map(s => s.cat))];
const doneCount = () => SNIPS.filter(s => st[s.id] && st[s.id].done).length;
const totAns = () => SNIPS.reduce((n, s) => n + ((st[s.id] || {}).got || 0), 0);
const totCor = () => SNIPS.reduce((n, s) => n + ((st[s.id] || {}).cor || 0), 0);

function head() {
  $('#trCount').textContent = doneCount() + '/' + SNIPS.length;
  const acc = totAns() ? Math.round(100 * totCor() / totAns()) : 0;
  $('#trBar').innerHTML = `<span>إتقان التتبع: ${acc}%</span> · <span>أجبت ${totAns()}</span>`;
}
function list() {
  let html = `<div class="lb-list-h">المقتطفات — ${doneCount()}/${SNIPS.length} ✓</div>
    <div class="lb-list-h" style="font-weight:400;padding-bottom:4px">اقرأ الكود ذهنياً — تنبّأ بالمخرج قبل الكشف</div>`;
  cats.forEach(c => {
    html += `<div class="lb-cat">${c}</div>`;
    html += SNIPS.map((s, i) => s.cat === c
      ? `<button class="lb-item ${i === cur ? 'on' : ''} ${st[s.id] && st[s.id].done ? 'done' : ''}" data-i="${i}">${st[s.id] && st[s.id].done ? '✓ ' : ''}🧭 ${escH(s.t)}</button>` : '').join('');
  });
  $('#trList').innerHTML = html;
  $('#trList').querySelectorAll('.lb-item').forEach(b => b.onclick = () => { cur = +b.dataset.i; render(); });
}

function render() {
  head(); list();
  const sp = SNIPS[cur];
  const outs = run(sp.code);
  const steps = sp.steps.map(x => buildStep(sp, x, outs));
  const rec = st[sp.id] = st[sp.id] || { got: 0, cor: 0, done: false };
  let si = 0, attCor = 0;

  const lines = sp.code.split('\n').map((l, i) => `<div class="tr-line"><span class="tr-ln">${i + 1}</span><code>${escH(l) || ' '}</code></div>`).join('');

  $('#trMain').innerHTML = `
    <h2 class="lb-t">${rec.done ? '✓ ' : ''}🧭 ${escH(sp.t)}</h2>
    <div class="lb-cat">${escH(sp.cat)}</div>
    <div class="tr-grid">
      <div class="tr-code mono">${lines}</div>
      <div class="tr-watch"><div class="tr-wt">المخرجات حتى الآن</div><div id="trOuts" class="tr-outs mono"><i class="tr-none">… لم يُكشف شيء</i></div></div>
    </div>
    <div id="trStep"></div>`;

  const outsEl = $('#trOuts'), stepEl = $('#trStep');
  const revealed = [];
  const showOuts = () => {
    outsEl.innerHTML = revealed.length
      ? revealed.map(o => `<div class="tr-out">← ${escH(o)}</div>`).join('')
      : '<i class="tr-none">… لم يُكشف شيء</i>';
  };

  function step() {
    if (si >= steps.length) {
      const cor = attCor, tot = steps.length;
      if (cor === tot) { rec.done = true; save(); }
      head(); list();
      stepEl.innerHTML = `<div class="pn-${cor === tot ? 'ok' : 'bad'}" style="margin-top:12px">
        ${cor === tot ? `✓ تتبّع متقن — ${cor}/${tot} صحيحة.` : `تتبّعت ${cor}/${tot} — أعد قراءة الكود سطراً سطراً وحاول مجدداً.`}</div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn sm" id="trNext">${cur < SNIPS.length - 1 ? 'المقتطف التالي ←' : 'أعد من البداية ↺'}</button>
          <button class="btn ghost sm" id="trRetry">أعد هذا المقتطف</button>
        </div>`;
      $('#trNext').onclick = () => { cur = (cur + 1) % SNIPS.length; render(); };
      $('#trRetry').onclick = render;
      return;
    }
    const q = steps[si];
    stepEl.innerHTML = `
      <div class="tr-q"><b>الخطوة ${si + 1}/${steps.length}:</b> ${escH(q.q)}</div>
      <div class="dh-opts" id="trOpts">${q.opts.map(o => `<button class="dh-opt mono">${escH(o)}</button>`).join('')}</div>
      <div id="trWhy"></div>`;
    $('#trOpts').querySelectorAll('.dh-opt').forEach(b => b.onclick = () => {
      const pick = b.textContent, ok = pick === q.a;
      rec.got++; if (ok) { rec.cor++; attCor++; } save();
      $('#trOpts').querySelectorAll('.dh-opt').forEach(x => {
        x.disabled = true;
        if (x.textContent === q.a) x.classList.add('ok'); else if (x === b) x.classList.add('bad');
      });
      if (q.k === 'out' || q.k === 'last') { revealed.push(outs[q.k === 'out' ? q.i : outs.length - 1]); showOuts(); }
      if (q.k === 'seq') { outs.forEach(o => revealed.push(fmt(o))); showOuts(); }
      $('#trWhy').innerHTML = `<div class="tr-why">${ok ? '✓ ' : '✗ الصحيح: <b>' + escH(q.a) + '</b> — '}${escH(q.why)}</div>
        <button class="btn sm" id="trGo" style="margin-top:10px">${si < steps.length - 1 ? 'التالي ←' : 'النتيجة'}</button>`;
      $('#trGo').onclick = () => { si++; step(); };
    });
  }
  step();
}
render();
})();
