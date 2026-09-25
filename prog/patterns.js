/* برمج — أنماط تصميم الكود: 8 أنماط — بطاقة: اسم + متى تستعمله + كود قبل/بعد + تلميح تفاعلي + فحص مصغّر */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let st = {};
try { st = JSON.parse(localStorage.getItem('prog_patterns') || '{}') || {}; } catch (e) { st = {}; }
const save = () => localStorage.setItem('prog_patterns', JSON.stringify(st));
const doneCount = () => PATTERNS.filter(p => st[p.id] && st[p.id].ok).length;

const PATTERNS = [
{ id: 'factory', t: 'Factory — دالة الإنشاء', en: 'Factory',
  when: 'عندما تكرر بناء كائنات متشابهة بـ`new` متناثرة، أو يتغير نوع الكائن المُنشأ حسب المدخل.',
  prob: 'الكود يملأ الملف بـ`new` مباشرة — كل تغيير في بنية المستخدم يعني مطاردة كل المواضع.',
  before: `const a = { type: 'admin', name: 'سارة', perms: ['*'] };
const b = { type: 'user', name: 'علي', perms: ['read'] };
const c = { type: 'guest', name: 'زائر', perms: [] };
// غداً: حقل جديد؟ عدّل ثلاثة مواضع`,
  after: `function makeUser(type, name) {
  const perms = { admin: ['*'], user: ['read'], guest: [] };
  return { type, name, perms: perms[type] };
}
const a = makeUser('admin', 'سارة');
// نقطة إنشاء واحدة — تغيير واحد يكفي`,
  tip: '💡 القاعدة: إذا كتبت `new` أو بنية كائن حرفية أكثر من مرتين لنفس الشيء — لفّها بدالة. الدالة هي عقدك الوحيد مع شكل الكائن.',
  quiz: { q: 'متى تختار Factory؟', opts: ['عند بناء كائنات متشابهة متكررة', 'عند كائن واحد لا يتكرر'], a: 0 } },
{ id: 'module', t: 'Module — وحدة منعزلة', en: 'Module',
  when: 'عندما تتناثر متغيراتك ودوالك في النطاق العام وتتصادم الأسماء بين الملفات.',
  prob: 'كل شيء عام — أي سطر في أي ملف يستطيع إفساد عدّادك السري.',
  before: `let count = 0;
function inc() { count++; }
function dec() { count--; }
// أي كود آخر يستطيع: count = 999`,
  after: `const Counter = (() => {
  let count = 0;              // خاص — لا يُرى خارجاً
  return {
    inc: () => ++count,
    dec: () => --count,
    get: () => count
  };
})();
Counter.inc();  // الواجهة الوحيدة المتاحة`,
  tip: '💡 IIFE تُنفَّذ فوراً وترجع الواجهة فقط — ما لم يُرجَع يبقى سجيناً. هذا أساس كل نظام modules حديث (import/export).',
  quiz: { q: 'ما الذي يمنع الوصول لـcount؟', opts: ['أنها داخل IIFE لا ترجعها', 'أنها const'], a: 0 } },
{ id: 'observer', t: 'Observer — نشر/اشتراك', en: 'Observer',
  when: 'عندما تحتاج عدة أجزاء (سجل، واجهة، إشعار) أن تستجيب لنفس الحدث دون أن يعرف المُصدِّر عنها.',
  prob: 'الدالة تستدعي كل المعتمدين يدوياً — إضافة مستمع جديد تعني تعديل كود المُصدِّر.',
  before: `function save(data) {
  db.write(data);
  ui.refresh();
  log.push('saved');
  notify.admin();
  // كل معتمد جديد = سطر جديد هنا
}`,
  after: `const bus = { subs: [], on(f) { this.subs.push(f); },
  emit(x) { this.subs.forEach(f => f(x)); } };

bus.on(d => ui.refresh());
bus.on(d => log.push('saved'));
bus.on(d => notify.admin());
function save(data) {
  db.write(data);
  bus.emit(data);   // save لا تعرف من يستمع
}`,
  tip: '💡 المُصدِّر ينشر «وقع حدث» فقط، والمستمعون يسجلون أنفسهم — ارتباط رخو (loose coupling): save لا تستورد ولا تعرف أحداً.',
  quiz: { q: 'ما الفائدة الجوهرية؟', opts: ['المُصدِّر لا يعرف المستمعين — يُضافون دون تعديله', 'الكود أقصر'], a: 0 } },
{ id: 'strategy', t: 'Strategy — بدّل الخوارزمية', en: 'Strategy',
  when: 'عندما تملك if/else أو switch طويلة تختار بين سلوكيات بديلة لنفس الهدف.',
  prob: 'سلسلة شروط تنمو مع كل طريقة جديدة — الدالة تتضخم وتختلط القرارات بالتنفيذ.',
  before: `function ship(type, w) {
  if (type === 'air') return w * 12 + 50;
  if (type === 'sea') return w * 2 + 20;
  if (type === 'land') return w * 4 + 10;
  // طريقة رابعة؟ if آخر هنا
}`,
  after: `const ship = {
  air:  w => w * 12 + 50,
  sea:  w => w * 2 + 20,
  land: w => w * 4 + 10,
};
const cost = ship[type](w);
// طريقة رابعة؟ سطر في الجدول — لا تلمس الكود`,
  tip: '💡 حوّل كل فرع if إلى دالة في جدول باسمها — الاختيار يصبح `table[key](x)` والإضافة تُدخل سطراً لا تفرعاً جديداً.',
  quiz: { q: 'كيف يضيف Strategy سلوكاً رابعاً؟', opts: ['سطر جديد في الجدول فقط', 'if آخر داخل الدالة'], a: 0 } },
{ id: 'decorator', t: 'Decorator — غلّف لتحسّن', en: 'Decorator',
  when: 'عندما تريد إضافة ميزة (سجل/توقيت/تخزين مؤقت) لدالة دون تغيير كودها الأصلي.',
  prob: 'تنسخ جسم الدالة وتلصق فيه منطق السجل — تتكرر الإضافة في كل دالة.',
  before: `function fetchUser(id) {
  console.log('start', id);
  const u = db.get(id);
  console.log('end', u);
  return u;
}
// كل دالة تريد سجلاً = لصق نفس السطرين`,
  after: `const withLog = fn => (...a) => {
  console.log('start', a);
  const r = fn(...a);
  console.log('end', r);
  return r;
};
const fetchUser = withLog(id => db.get(id));
const saveUser = withLog(u => db.put(u));
// أي دالة + withLog = نفس الدالة بسجل`,
  tip: '💡 الدالة المُغلِّفة تستقبل دالة وترجع دالة أقوى — قابلة للتركيب: withLog(withCache(fetchUser)).',
  quiz: { q: 'ميزة Decorator الأساسية؟', opts: ['تضيف سلوكاً دون تعديل الدالة الأصلية', 'تجعل الكود أقصر'], a: 0 } },
{ id: 'adapter', t: 'Adapter — مترجم الواجهات', en: 'Adapter',
  when: 'عندما تستدعي مكتبة/واجهة قديمة لا تطابق الشكل الذي يتوقعه كودك الجديد.',
  prob: 'المكتبة تعطي أسماء حقول غريبة أو توقيعاً مختلفاً — تعديل كل موضع استدعاء يعني التصاقاً بها للأبد.',
  before: `// المكتبة القديمة:
oldLib.qry('SELECT * FROM t WHERE id=5');
// كودك الجديد ينتظر: db.find(table, {id})
// انتشر oldLib.qry في 40 موضعاً`,
  after: `const db = {
  find(table, where) {
    const k = Object.keys(where)[0];
    return oldLib.qry(
      \`SELECT * FROM \${table} WHERE \${k}=\${where[k]}\`);
  }
};
db.find('t', { id: 5 });
// لو تبدّلت المكتبة: تعدّل Adapter وحده`,
  tip: '💡 Adapter طبقة رقيقة تترجم الشكل — كودك يعرف واجهتك أنت، والمكتبة الخارجية تُحبَس خلفه.',
  quiz: { q: 'متى تكتب Adapter؟', opts: ['عندما لا تطابق واجهة خارجية شكل كودك', 'عندما تريد كوداً أقصر'], a: 0 } },
{ id: 'builder', t: 'Builder — بناء متسلسل', en: 'Builder',
  when: 'عندما يحتاج إنشاء كائن معقد إلى خطوات كثيرة اختيارية لا تليق بـconstructor واحد عملاق.',
  prob: 'استدعاء بعشرة معاملات مبهمة أو سلسلة تعيينات مبعثرة — تنسى حقل فتنهار لاحقاً.',
  before: `const q = new Query('users', 25, true,
  'name', 'asc', null, 10);
// ما هو الوسيط السادس؟ الثالث؟ لا أحد يعرف`,
  after: `const q = new QueryBuilder()
  .from('users')
  .where('age >', 25)
  .select('name')
  .orderBy('asc')
  .limit(10)
  .build();
// كل خطوة اسمها واضح — الاختياري تتركه`,
  tip: '💡 كل دالة ترجع `this` فيتسلسل النداء (method chaining) — والـbuild() النهائي يتحقق من اكتمال الكائن.',
  quiz: { q: 'ما الذي يمكّن التسلسل a.b().c()؟', opts: ['كل دالة ترجع this', 'كل دالة static'], a: 0 } },
{ id: 'command', t: 'Command — العملية ككائن', en: 'Command',
  when: 'عندما تريد undo/redo أو سجل عمليات أو طابور تنفيذ — حوّل العملية لبيانات قابلة للتخزين.',
  prob: 'الأفعال تُنفَّذ وتضيع — لا تستطيع التراجع ولا إعادة التشغيل ولا تتبع ما حدث.',
  before: `btn.onclick = () => {
  text += 'x';
  render();
};
// كيف تتراجع عن آخر كتابة؟ لا يمكن.`,
  after: `const history = [];
function doCmd(cmd) {
  cmd.do();
  history.push(cmd);
}
function undo() { history.pop().undo(); }

doCmd({ do: () => text += 'x',
        undo: () => text = text.slice(0, -1) });
undo(); // ترجع خطوة`,
  tip: '💡 حوّل كل فعل إلى كائن {do, undo} فيُخزَّن ويُعاد ويُراجَع — هذا أساس محررات النصوص وألواح الرسم.',
  quiz: { q: 'ماذا يكسبك تغليف العملية ككائن؟', opts: ['قابلية التراجع وإعادة التشغيل', 'سرعة تنفيذ أعلى'], a: 0 } },
];

let cur = 0;
function head() {
  const n = doneCount();
  $('#ptCount').textContent = `${n}/${PATTERNS.length}`;
  $('#ptBar').style.width = `${n / PATTERNS.length * 100}%`;
}
function list() {
  let html = `<div class="lb-list-h">الأنماط — ${doneCount()}/${PATTERNS.length} ✓</div>`;
  html += `<div class="lb-list-h" style="font-weight:400;padding-bottom:4px">هنا تتعلم أنماط تصميم الكود — اختر نمطاً لترى المشكلة والحل</div>`;
  PATTERNS.forEach((p, idx) => {
    const ok = st[p.id] && st[p.id].ok;
    html += `<button class="lb-item ${ok ? 'done' : ''}" data-i="${idx}">${ok ? '✓' : '🧩'} ${escH(p.t)}</button>`;
  });
  $('#ptList').innerHTML = html;
  $('#ptList').querySelectorAll('.lb-item').forEach(b => b.onclick = () => { cur = +b.dataset.i; render(); });
}
function render() {
  head(); list();
  const p = PATTERNS[cur];
  const done = st[p.id] && st[p.id].ok;
  $('#ptMain').innerHTML = `
    <div class="lb-head">
      <span class="lb-cat-tag">${escH(p.en)}</span>
      ${done ? '<span class="pn-ok" style="font-size:.68rem;padding:3px 10px">✓ أتقنته</span>' : ''}
      <h2 class="lb-t">🧩 ${escH(p.t)}</h2>
      <div class="dh-why" style="margin-top:6px"><b>متى تستعمله؟</b> ${escH(p.when)}</div>
    </div>
    <div class="pt-prob">المشكلة: ${escH(p.prob)}</div>
    <div class="pt-tabs">
      <button class="pt-tab on" id="ptTabBefore">❌ قبل — الكود المشوّه</button>
      <button class="pt-tab" id="ptTabAfter">✓ بعد — بالنمط</button>
    </div>
    <pre class="db-out dh-code pt-code" dir="ltr" id="ptCode">${escH(p.before)}</pre>
    <div class="pt-tip" id="ptTip" style="display:none">${escH(p.tip)}</div>
    <button class="btn ghost sm" id="ptTipBtn" style="margin:10px 0">💡 أظهر التلميح</button>
    <div class="dh-ask" style="margin-top:8px">${escH(p.quiz.q)}</div>
    <div class="dh-opts" id="ptQuiz">${p.quiz.opts.map((o, j) =>
      `<button class="dh-opt" data-j="${j}" style="font-size:.78rem">${escH(o)}</button>`).join('')}</div>
    <div id="ptRes">${done ? '<div class="pn-ok" style="margin-top:10px">✓ هذا النمط مُتقَن سابقاً.</div>' : ''}</div>`;

  const before = p.before, after = p.after;
  const codeEl = $('#ptCode');
  $('#ptTabBefore').onclick = () => { $('#ptTabBefore').classList.add('on'); $('#ptTabAfter').classList.remove('on'); codeEl.textContent = before; };
  $('#ptTabAfter').onclick = () => { $('#ptTabAfter').classList.add('on'); $('#ptTabBefore').classList.remove('on'); codeEl.textContent = after; };
  $('#ptTipBtn').onclick = () => {
    const el = $('#ptTip');
    const open = el.style.display !== 'none';
    el.style.display = open ? 'none' : 'block';
    $('#ptTipBtn').textContent = open ? '💡 أظهر التلميح' : '💡 أخفِ التلميح';
  };
  $('#ptQuiz').querySelectorAll('.dh-opt').forEach(b => b.onclick = () => {
    const pick = +b.dataset.j;
    const ok = pick === p.quiz.a;
    $('#ptQuiz').querySelectorAll('.dh-opt').forEach(x => {
      x.disabled = true;
      if (+x.dataset.j === p.quiz.a) x.classList.add('ok');
      else if (+x.dataset.j === pick) x.classList.add('bad');
    });
    if (ok) {
      st[p.id] = { ok: true }; save(); head(); list();
      $('#ptRes').innerHTML = `<div class="pn-ok" style="margin-top:10px">✓ صحيح — فهمت متى يُستعمل النمط. سُجّل ${doneCount()}/${PATTERNS.length}</div>`;
    } else {
      $('#ptRes').innerHTML = `<div class="pn-bad" style="margin-top:10px">✗ — الفكرة ليست اختصاراً بل قابلية تغيير/فصل. قارن «قبل» بـ«بعد» وحاول مجدداً.</div>
        <button class="btn ghost sm" id="ptAgain" style="margin-top:8px">أعد المحاولة</button>`;
      $('#ptAgain').onclick = render;
    }
  });
}
render();
})();
