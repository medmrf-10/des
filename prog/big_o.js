/* برمج — حاسبة التعقيد: 12 مقتطفاً — خمّن Big-O ثم افهم لماذا بحدس حجم المدخل */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
let st = {};
try { st = JSON.parse(localStorage.getItem('prog_bigo') || '{}') || {}; } catch (e) { st = {}; }
st.streak = st.streak || 0; st.best = st.best || 0; st.correct = st.correct || 0; st.answered = st.answered || 0;
const save = () => localStorage.setItem('prog_bigo', JSON.stringify(st));

const OS = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'];
const SNIPS = [
  { t: 'الوصول بالفهرس', code: `function first(arr) {\n  return arr[0];\n}`, a: 'O(1)',
    why: 'خطوة واحدة مهما كبر n — arr[0] يقرأ عنواناً مباشراً؛ ضاعف المدخل مليون مرة ويبقى الزمن ثابتاً.' },
  { t: 'حلقة واحدة', code: `function total(arr) {\n  let s = 0;\n  for (const x of arr) s += x;\n  return s;\n}`, a: 'O(n)',
    why: 'كل عنصر يُلمس مرة — المدخل n يعني n خطوات؛ ضاعف n يتضاعف الزمن خطياً.' },
  { t: 'حلقتان متداخلتان', code: `function pairs(arr) {\n  const out = [];\n  for (const a of arr)\n    for (const b of arr) out.push(a + b);\n  return out;\n}`, a: 'O(n²)',
    why: 'لكل عنصر n عناصر أخرى — n×n = n² عملية؛ مدخل 1000 يصبح مليوناً.' },
  { t: 'الشق النصفي', code: `function find(sorted, x) {\n  let lo = 0, hi = sorted.length - 1;\n  while (lo <= hi) {\n    const m = (lo + hi) >> 1;\n    if (sorted[m] === x) return m;\n    if (sorted[m] < x) lo = m + 1; else hi = m - 1;\n  }\n  return -1;\n}`, a: 'O(log n)',
    why: 'كل خطوة تشطب نصف المتبقي — مليون عنصر يحتاج ~20 خطوة فقط؛ النمو لوغاريتمي.' },
  { t: 'الفرز ثم خطي', code: `function dedup(arr) {\n  arr.sort();\n  const out = [];\n  for (const x of arr) if (out[out.length - 1] !== x) out.push(x);\n  return out;\n}`, a: 'O(n log n)',
    why: 'الفرز الجيد n log n والمسح الخطي n — المهيمن يفوز: n log n. لا تنسَ أن sort هي المكلفة هنا.' },
  { t: 'بفّر ثابت', code: `function tail3(arr) {\n  return arr.slice(-3);\n}`, a: 'O(1)',
    why: 'ثلاث خطوات دائماً مهما كان طول arr — ثابت لأن العمل لا يتعلق بـn.' },
  { t: 'حلقة منتهية بثابت', code: `function top10(arr) {\n  let s = 0;\n  for (let i = 0; i < 10 && i < arr.length; i++) s += arr[i];\n  return s;\n}`, a: 'O(1)',
    why: 'الحلقة مقيدة بـ10 لا بـn — الحد الأعلى ثابت فيبقى O(1) حتى لو n عملاق.' },
  { t: 'نصف متداخل', code: `function sumPairs(arr) {\n  let s = 0;\n  for (let i = 0; i < arr.length; i++)\n    for (let j = i + 1; j < arr.length; j++)\n      s += arr[i] + arr[j];\n  return s;\n}`, a: 'O(n²)',
    why: 'المثلث n(n-1)/2 — إسقاط الثوابت والأنصاف لا يغيّر الرتبة: ما زال n².' },
  { t: 'التضاعف الخارجي', code: `function powers(n) {\n  const out = [];\n  for (let i = 1; i <= n; i *= 2) out.push(i);\n  return out;\n}`, a: 'O(log n)',
    why: 'i تتضاعف كل خطوة — الوصول لـn يحتاج log₂n دورة؛ n=1024 يعني 10 دورات فقط.' },
  { t: 'التكرار المزدوج', code: `function fib(n) {\n  if (n <= 1) return n;\n  return fib(n - 1) + fib(n - 2);\n}`, a: 'O(2ⁿ)',
    opts: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)', 'O(n³)'],
    why: 'كل استدعاء يتشعب لاثنين — شجرة الاستدعاءات ~2ⁿ ورقة؛ لهذا n=50 شبه مستحيل بلا memoization.' },
  { t: 'خريطة ثم فلتر', code: `function f(arr) {\n  return arr.map(x => x * 2).filter(x => x > 4);\n}`, a: 'O(n)',
    why: 'map ثم filter = 2n خطوة — الثابت 2 يُسقط؛ تبقى خطية O(n).' },
  { t: 'جدول هاش للبحث', code: `function has(m, key) {\n  return m.hasOwnProperty(key);\n}`, a: 'O(1)',
    why: 'البحث في جدول الهاش/كائن JS متوسط O(1) — دالة البعثرة تقفز للمكان مباشرة بلا مسح.' },
];

let i = 0;
function stats() {
  const acc = st.answered ? Math.round(st.correct / st.answered * 100) : 0;
  $('#boStats').innerHTML = `المقتطف <b>${Math.min(i + 1, SNIPS.length)}/${SNIPS.length}</b> • سلسلة حالية <b>${st.streak}</b> • أفضل <b>${st.best}</b> • دقة <b>${acc}%</b>`;
}

function end() {
  $('#boMain').innerHTML = `<div class="pn-end"><div class="pn-end-ic">${st.streak >= 8 ? '🏆' : '📊'}</div>
    <h2>انتهت الجولة — دقة الجلسة ${st.answered ? Math.round(st.correct / st.answered * 100) : 0}%</h2>
    <div class="pn-end-sub">أفضل سلسلة: ${st.best} • إجمالي الإجابات: ${st.answered}</div>
    <button class="btn" onclick="location.reload()">جولة جديدة ⟵</button></div>`;
}

function render() {
  if (i >= SNIPS.length) return end();
  stats();
  const s = SNIPS[i];
  const opts = shuffle([...(s.opts || OS)]);
  $('#boMain').innerHTML = `
    <div class="lb-head" style="margin-bottom:14px">
      <span class="lb-cat-tag">Big-O</span>
      <span class="dh-idx">${i + 1}/${SNIPS.length}</span>
      <h2 class="lb-t">⏱ ${escH(s.t)}</h2>
    </div>
    <pre class="db-out dh-code" dir="ltr">${escH(s.code)}</pre>
    <div class="dh-ask">ما تعقيدها الزمني؟</div>
    <div class="bo-opts" dir="ltr">${opts.map(o => `<button class="bo-opt" data-o="${o}">${o}</button>`).join('')}</div>
    <div id="boRes"></div>
    <div class="dh-nav">
      <span></span>
      <span class="dh-count">${st.streak} سلسلة</span>
      <button class="btn ghost sm" id="boSkip">تخطي ›</button>
    </div>`;
  $('#boSkip').onclick = () => { st.streak = 0; st.answered++; save(); i++; render(); };
  $('#boMain').querySelectorAll('.bo-opt').forEach(b => b.onclick = () => {
    const pick = b.dataset.o;
    const ok = (s.accept || [s.a]).includes(pick);
    st.answered++;
    if (ok) { st.streak++; st.correct++; st.best = Math.max(st.best, st.streak); }
    else st.streak = 0;
    save();
    $('#boMain').querySelectorAll('.bo-opt').forEach(x => {
      x.disabled = true;
      if ((s.accept || [s.a]).includes(x.dataset.o)) x.classList.add('ok');
      else if (x.dataset.o === pick) x.classList.add('bad');
    });
    $('#boRes').innerHTML = `
      <div class="${ok ? 'pn-ok' : 'pn-bad'}" style="margin:12px 0 8px">${ok ? '✓ صحيح!' : `✗ — الصحيح: <b dir="ltr">${escH(s.accept ? s.accept[0] : s.a)}</b>`}</div>
      <div class="dh-why"><b>لماذا؟</b> ${escH(s.why)}</div>
      <button class="btn" style="margin-top:14px" id="boNext">${i === SNIPS.length - 1 ? 'النتيجة ⟵' : 'التالي ⟵'}</button>`;
    $('#boNext').onclick = () => { i++; render(); };
    const c = $('#boMain').querySelector('.dh-count'); if (c) c.textContent = `${st.streak} سلسلة`;
    stats();
  });
}

render();
})();
