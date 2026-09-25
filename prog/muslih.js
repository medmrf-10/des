/* برمج — مُصلِح: 20 مقتطفاً بخطأ واحد مستتر — أشر للسطر، أصلحه، و«تحقق» تشغّل اختبارات مخفية */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* كل مقتطف: code=أسطر، bug=رقم سطر الخطأ (مفهرس 0)، fix=النص المصحح (للتحقق الذاتي فقط)، goal=ما يجب أن يفعله الكود، tests=تعابير يجب أن تكون صحيحة */
const SNIPS = [
  /* ==== خارج الحدود ==== */
  { id: 'm1', cat: 'خارج الحدود', t: 'مجموع 1 إلى n', goal: 'sumToN(4) يجب أن تعيد 10 — تجمع كل الأرقام من 1 إلى n شاملةً n.',
    code: ['function sumToN(n) {', '  let s = 0;', '  for (let i = 1; i < n; i++) {', '    s += i;', '  }', '  return s;', '}'],
    bug: 2, fix: '  for (let i = 1; i <= n; i++) {',
    tests: [{ l: 'sumToN(4) = 10', e: 'sumToN(4) === 10' }, { l: 'sumToN(1) = 1', e: 'sumToN(1) === 1' }] },
  { id: 'm2', cat: 'خارج الحدود', t: 'آخر عنصر', goal: 'lastOf تعيد آخر عنصر في المصفوفة.',
    code: ['function lastOf(a) {', '  return a[a.length];', '}'],
    bug: 1, fix: '  return a[a.length - 1];',
    tests: [{ l: 'lastOf([1,2,3]) = 3', e: 'lastOf([1,2,3]) === 3' }, { l: 'lastOf(["x"]) = "x"', e: 'lastOf(["x"]) === "x"' }] },
  { id: 'm3', cat: 'خارج الحدود', t: 'جمع مصفوفة', goal: 'sumA تجمع كل العناصر — الحلقة تتجاوز النهاية بواحد فتضيف undefined.',
    code: ['function sumA(a) {', '  let s = 0;', '  for (let i = 0; i <= a.length; i++) {', '    s += a[i];', '  }', '  return s;', '}'],
    bug: 2, fix: '  for (let i = 0; i < a.length; i++) {',
    tests: [{ l: 'sumA([1,2,3]) = 6', e: 'sumA([1,2,3]) === 6' }, { l: 'sumA([]) = 0', e: 'sumA([]) === 0' }] },
  { id: 'm4', cat: 'خارج الحدود', t: 'عدّ الحروف المتحركة', goal: 'vowels تعدّ كل aeiou في النص — لا تُسقط آخر حرف.',
    code: ['function vowels(s) {', '  let c = 0;', '  for (let i = 0; i < s.length - 1; i++) {', '    if ("aeiou".includes(s[i])) c++;', '  }', '  return c;', '}'],
    bug: 2, fix: '  for (let i = 0; i < s.length; i++) {',
    tests: [{ l: 'vowels("aeiou") = 5', e: 'vowels("aeiou") === 5' }, { l: 'vowels("xyz") = 0', e: 'vowels("xyz") === 0' }] },

  /* ==== مساواة مقابل تعيين ==== */
  { id: 'm5', cat: 'مساواة وتعيين', t: 'هل هي خمسة؟', goal: 'isFive تعيد true لـ5 فقط.',
    code: ['function isFive(x) {', '  if (x = 5) {', '    return true;', '  }', '  return false;', '}'],
    bug: 1, fix: '  if (x === 5) {',
    tests: [{ l: 'isFive(5) = true', e: 'isFive(5) === true' }, { l: 'isFive(4) = false', e: 'isFive(4) === false' }] },
  { id: 'm6', cat: 'مساواة وتعيين', t: 'عدّ الأصفار', goal: 'countZero تعدّ عناصر المصفوفة التي تساوي 0.',
    code: ['function countZero(a) {', '  let c = 0;', '  for (const x of a) {', '    if (x = 0) c++;', '  }', '  return c;', '}'],
    bug: 3, fix: '    if (x === 0) c++;',
    tests: [{ l: 'countZero([0,1,0]) = 2', e: 'countZero([0,1,0]) === 2' }, { l: 'countZero([1,2]) = 0', e: 'countZero([1,2]) === 0' }] },
  { id: 'm7', cat: 'مساواة وتعيين', t: 'مقارنة أم إسناد؟', goal: 'same تعيد "متساويان" فقط حين التطابق.',
    code: ['function same(a, b) {', '  return a = b ? "متساويان" : "مختلفان";', '}'],
    bug: 1, fix: '  return a === b ? "متساويان" : "مختلفان";',
    tests: [{ l: 'same(2,2) = متساويان', e: 'same(2,2) === "متساويان"' }, { l: 'same(2,3) = مختلفان', e: 'same(2,3) === "مختلفان"' }] },
  { id: 'm8', cat: 'مساواة وتعيين', t: 'شرط الحلقة', goal: 'untilZero تُنقص n حتى الصفر وتعيد عدد الخطوات.',
    code: ['function untilZero(n) {', '  let steps = 0;', '  while (n = 0) {', '    n--;', '    steps++;', '  }', '  return steps;', '}'],
    bug: 2, fix: '  while (n !== 0) {',
    tests: [{ l: 'untilZero(3) = 3', e: 'untilZero(3) === 3' }, { l: 'untilZero(0) = 0', e: 'untilZero(0) === 0' }] },

  /* ==== نطاقات ==== */
  { id: 'm9', cat: 'نطاقات', t: 'عدّاد محبوس', goal: 'countTo(n) تعيد n — متغير الحلقة يجب أن يعيش خارجها.',
    code: ['function countTo(n) {', '  for (let i = 0; i < n; i++) {', '  }', '  return i;', '}'],
    bug: 1, fix: '  let i; for (i = 0; i < n; i++) {',
    tests: [{ l: 'countTo(4) = 4', e: 'countTo(4) === 4' }, { l: 'countTo(0) = 0', e: 'countTo(0) === 0' }] },
  { id: 'm10', cat: 'نطاقات', t: 'عدّاد بلا تصريح', goal: 'inc تزيد counter وتعيده — يجب تصريحه أولاً.',
    code: ['function inc() {', '  counter++;', '  return counter;', '}'],
    bug: 0, fix: 'let counter = 0;\nfunction inc() {',
    tests: [{ l: 'inc() = 1', e: 'inc() === 1' }] },
  { id: 'm11', cat: 'نطاقات', t: 'حلقة بلا let', goal: 'trip تعيد مصفوفة [0,1,2].',
    code: ['function trip() {', '  const r = [];', '  for (i = 0; i < 3; i++) {', '    r.push(i);', '  }', '  return r;', '}'],
    bug: 2, fix: '  for (let i = 0; i < 3; i++) {',
    tests: [{ l: 'trip() = "0,1,2"', e: 'trip().join(",") === "0,1,2"' }] },
  { id: 'm12', cat: 'نطاقات', t: 'const لا تتبدل', goal: 'bump تزيد x وتعيدها — ثابتة لا تقبل الزيادة.',
    code: ['function bump() {', '  const x = 5;', '  x++;', '  return x;', '}'],
    bug: 1, fix: '  let x = 5;',
    tests: [{ l: 'bump() = 6', e: 'bump() === 6' }] },

  /* ==== تغيّر وقيم ==== */
  { id: 'm13', cat: 'تغيّر وقيم', t: 'جامع بلا إسناد', goal: 'joinAll تلصق كل العناصر في نص واحد.',
    code: ['function joinAll(a) {', '  let s = "";', '  for (const x of a) {', '    s + x;', '  }', '  return s;', '}'],
    bug: 3, fix: '    s += x;',
    tests: [{ l: 'joinAll(["a","b"]) = "ab"', e: 'joinAll(["a","b"]) === "ab"' }, { l: 'joinAll([]) = ""', e: 'joinAll([]) === ""' }] },
  { id: 'm14', cat: 'تغيّر وقيم', t: 'قصّ بلا ألم', goal: 'firstTwo تعيد أول عنصرين دون تعديل المصفوفة الأصلية.',
    code: ['function firstTwo(a) {', '  return a.splice(0, 2);', '}'],
    bug: 1, fix: '  return a.slice(0, 2);',
    tests: [{ l: 'firstTwo([1,2,3]) = [1,2]', e: 'firstTwo([1,2,3]).join() === "1,2"' }, { l: 'الأصل لا يتغير', e: '(function(){const t=[1,2,3];firstTwo(t);return t.length===3})()' }] },
  { id: 'm15', cat: 'تغيّر وقيم', t: 'map بلا return', goal: 'dbl تضاعف كل عنصر.',
    code: ['function dbl(a) {', '  return a.map(x => { x * 2 });', '}'],
    bug: 1, fix: '  return a.map(x => x * 2);',
    tests: [{ l: 'dbl([1,2]) = "2,4"', e: 'dbl([1,2]).join(",") === "2,4"' }] },
  { id: 'm16', cat: 'تغيّر وقيم', t: 'فرز يمسّ الأصل', goal: 'sorted تعيد نسخة مرتبة والأصل يبقى كما هو.',
    code: ['function sorted(a) {', '  return a.sort();', '}'],
    bug: 1, fix: '  return a.slice().sort();',
    tests: [{ l: 'sorted([3,1]) = "1,3"', e: 'sorted([3,1]).join(",") === "1,3"' }, { l: 'الأصل لا يتبدل', e: '(function(){const t=[3,1];sorted(t);return t[0]===3})()' }] },

  /* ==== منطق ==== */
  { id: 'm17', cat: 'منطق', t: 'أرقام كنصوص', goal: 'total تجمع رقمين قد يصلان كنصوص — "10"+"2" يجب أن تكون 12 لا "102".',
    code: ['function total(a, b) {', '  return a + b;', '}'],
    bug: 1, fix: '  return Number(a) + Number(b);',
    tests: [{ l: 'total("10","2") = 12', e: 'total("10","2") === 12' }, { l: 'total(1,2) = 3', e: 'total(1,2) === 3' }] },
  { id: 'm18', cat: 'منطق', t: 'ثلث العشرة', goal: 'isThird تتحقق أن 0.1+0.2 يساوي 0.3 — العشرية لا تُقارن بـ===.',
    code: ['function isThird() {', '  return 0.1 + 0.2 === 0.3;', '}'],
    bug: 1, fix: '  return Math.abs(0.1 + 0.2 - 0.3) < 1e-9;',
    tests: [{ l: 'isThird() = true', e: 'isThird() === true' }] },
  { id: 'm19', cat: 'منطق', t: 'تبادل بلا مؤقت', goal: 'swap تبدّل قيمتين وتعيدهما — حالياً تضيع إحداهما.',
    code: ['function swap(a, b) {', '  const t = a;', '  a = b;', '  b = a;', '  return [a, b];', '}'],
    bug: 3, fix: '  b = t;',
    tests: [{ l: 'swap(1,2) = "2,1"', e: 'swap(1,2).join(",") === "2,1"' }] },
  { id: 'm20', cat: 'منطق', t: 'دخول مشروط', goal: 'canEnter تمنع القاصرين وغير الأعضاء — الشرط يجب أن يمنع لو تحقق أحدهما.',
    code: ['function canEnter(age, member) {', '  if (age < 18 && !member) {', '    return false;', '  }', '  return true;', '}'],
    bug: 1, fix: '  if (age < 18 || !member) {',
    tests: [{ l: 'بالغ عضو يدخل', e: 'canEnter(20, true) === true' }, { l: 'قاصر عضو يُمنع', e: 'canEnter(15, true) === false' }, { l: 'بالغ غير عضو يُمنع', e: 'canEnter(30, false) === false' }] }
];

/* تصدير الأسماء المعرفة في المستوى الأعلى ثم تشغيل الاختبارات */
function scopeOf(src) {
  const names = new Set();
  for (const m of src.matchAll(/^(?:let|const|var)\s+([^;\n]+)/gm))
    m[1].split(',').forEach(d => names.add(d.split('=')[0].trim().replace(/[^\w$].*$/, '')));
  for (const m of src.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
  return new Function('"use strict";\n' + src + '\n;return {' + [...names].join(',') + '}')();
}
function runTests(src, tests) {
  let sc;
  try { sc = scopeOf(src); } catch (e) { return { err: 'الكود لا يعمل: ' + e.message, res: [] }; }
  const res = tests.map(t => {
    try { return { l: t.l, ok: !!new Function('s', 'with(s){return (' + t.e + ');}')(sc) }; }
    catch (e) { return { l: t.l, ok: false }; }
  });
  return { err: null, res };
}

let st; try { st = JSON.parse(localStorage.getItem('prog_muslih') || '{}') || {}; } catch (e) { st = {}; }
st.items = st.items || {}; st.xp = st.xp || 0;
const save = () => localStorage.setItem('prog_muslih', JSON.stringify(st));
let cur = 0;

const cats = [...new Set(SNIPS.map(s => s.cat))];
const doneCount = () => SNIPS.filter(s => st.items[s.id] && st.items[s.id].ok).length;
const wrongList = () => SNIPS.filter(s => { const r = st.items[s.id]; return r && r.wrong && !r.ok; });

function head() {
  $('#msCount').textContent = doneCount() + '/' + SNIPS.length;
  $('#msBar').innerHTML = `<span>⭐ ${st.xp} XP</span> · <span>مصلحة: ${doneCount()}</span>${wrongList().length ? ` · <span class="ms-warn">${wrongList().length} تعود للمحاولة</span>` : ''}`;
}
function list() {
  let html = `<div class="lb-list-h">المقتطفات — ${doneCount()}/${SNIPS.length} ✓</div>
    <div class="lb-list-h" style="font-weight:400;padding-bottom:4px">كل مقتطف فيه خطأ واحد — أشِر إليه وأصلحه</div>`;
  const wr = wrongList();
  if (wr.length) {
    html += `<div class="lb-cat">🔁 تعود للمحاولة</div>` +
      wr.map(s => `<button class="lb-item" data-i="${SNIPS.indexOf(s)}">🔁 ${escH(s.t)}</button>`).join('');
  }
  cats.forEach(c => {
    html += `<div class="lb-cat">${c}</div>`;
    html += SNIPS.map((s, i) => {
      const r = st.items[s.id] || {};
      const mark = r.ok ? '✓' : r.wrong ? '✗' : '🛠️';
      return s.cat === c ? `<button class="lb-item ${i === cur ? 'on' : ''} ${r.ok ? 'done' : ''}" data-i="${i}">${mark} ${escH(s.t)}</button>` : '';
    }).join('');
  });
  $('#msList').innerHTML = html;
  $('#msList').querySelectorAll('.lb-item').forEach(b => b.onclick = () => { cur = +b.dataset.i; render(); });
}

function render() {
  head(); list();
  const sp = SNIPS[cur];
  const rec = st.items[sp.id] = st.items[sp.id] || { ok: false, wrong: false, tries: 0 };
  let work = sp.code.slice();
  let sel = -1;

  const draw = () => {
    $('#msCode').innerHTML = work.map((l, i) =>
      `<div class="ms-line ${i === sel ? 'sel' : ''} ${i === sp.bug ? '' : ''}" data-l="${i}"><span class="ms-ln">${i + 1}</span><code>${escH(l) || ' '}</code></div>`).join('');
    $('#msCode').querySelectorAll('.ms-line').forEach(el => el.onclick = () => {
      sel = +el.dataset.l;
      draw();
      $('#msFixLine').value = work[sel];
      $('#msFixArea').hidden = false;
      $('#msFixLbl').textContent = 'أصلح السطر ' + (sel + 1) + ' — ثم اضغط «طبّق»';
    });
  };

  $('#msMain').innerHTML = `
    <h2 class="lb-t">${rec.ok ? '✓ ' : ''}🛠️ ${escH(sp.t)}</h2>
    <div class="lb-cat">${escH(sp.cat)}</div>
    <div class="ms-goal">${escH(sp.goal)}</div>
    <div class="ms-code mono" id="msCode"></div>
    <div class="ms-goal" style="color:var(--dim);font-size:.72rem">انقر السطر الذي تظنه خاطئاً لتعديله</div>
    <div id="msFixArea" hidden>
      <div id="msFixLbl" class="tr-q"></div>
      <input id="msFixLine" class="ms-in mono" dir="ltr" spellcheck="false">
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button class="btn sm" id="msApply">طبّق على السطر</button>
        <button class="btn ghost sm" id="msReset">استعد الأصل</button>
        <button class="btn sm" id="msCheck" style="margin-inline-start:auto">تحقق ✓</button>
      </div>
    </div>
    <div id="msRes"></div>`;

  $('#msApply').onclick = () => {
    if (sel < 0) return;
    work[sel] = $('#msFixLine').value;
    draw();
  };
  $('#msReset').onclick = () => { work = sp.code.slice(); sel = -1; draw(); $('#msFixArea').hidden = true; $('#msRes').innerHTML = ''; };
  const check = () => {
    const src = work.join('\n');
    const { err, res } = runTests(src, sp.tests);
    rec.tries++; save();
    if (err) { $('#msRes').innerHTML = `<div class="ms-fail">⚠️ ${escH(err)}</div>`; return; }
    const allOk = res.every(r => r.ok);
    if (allOk) {
      const first = !rec.ok;
      const pointerBonus = sel === sp.bug;
      if (first) { rec.ok = true; rec.wrong = false; st.xp += pointerBonus ? 15 : 10; save(); }
      head(); list();
      $('#msRes').innerHTML = `<div class="pn-ok" style="margin-top:10px">🎉 أصلحت البق! ${res.map(r => '✓ ' + escH(r.l)).join(' · ')}${first ? ` — +${pointerBonus ? 15 : 10} XP${pointerBonus ? '' : ' (أشرت لسطر آخر — +15 لو أصبت السطر ' + (sp.bug + 1) + ')'}` : ''}</div>`;
    } else {
      rec.wrong = true; save(); head(); list();
      $('#msRes').innerHTML = `<div class="ms-fail">✗ ${res.map(r => `<div>${r.ok ? '✓' : '✗'} ${escH(r.l)}</div>`).join('')}</div>
        <div class="ms-fail" style="font-size:.7rem;margin-top:6px">${sel >= 0 && sel !== sp.bug ? 'السطر الذي غيّرته ليس مصدر الخطأ — ' : ''}سيعاود هذا المقتطف الظهور في «تعود للمحاولة»</div>`;
    }
  };
  $('#msCheck').onclick = check;
  draw();
  const chk = $('#msCheck');
  chk.disabled = true; chk.style.opacity = .5; chk.textContent = 'تحقق ✓ (اختر سطراً أولاً)';
  $('#msCode').addEventListener('click', () => { chk.disabled = false; chk.style.opacity = 1; chk.textContent = 'تحقق ✓'; });
}
render();
})();
