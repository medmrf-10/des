/* برمج — مصمّم الـAPI: 8 سيناريوهات بناء واجهة — اختر التصميم الأصوب REST-ياً ثم افهم لماذا */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
let st = {};
try { st = JSON.parse(localStorage.getItem('prog_api') || '{}') || {}; } catch (e) { st = {}; }
st.streak = st.streak || 0; st.best = st.best || 0; st.correct = st.correct || 0; st.answered = st.answered || 0;
const save = () => localStorage.setItem('prog_api', JSON.stringify(st));

const SCEN = [
  { t: 'جلب كتاب بمعرّفه', sit: 'نظام مكتبة: الواجهة تعرض صفحة كتاب واحد رقمه 42.',
    opts: ['GET /books/42', 'POST /books/get {"id":42}', 'GET /getBook?id=42', 'POST /api/books/42/read'],
    a: 'GET /books/42',
    why: 'قراءة مورد → GET: آمنة (بلا أثر جانبي) وقابلة للتخزين المؤقت؛ المورد باسم جمع والمعرّف في المسار — لا أفعال في الرابط ولا body في GET.' },
  { t: 'إنشاء طلب متجر', sit: 'متجر: المستخدم يضغط «أكّد الطلب» فينشأ طلب جديد بمنتج وكمية.',
    opts: ['GET /orders/new?p=5&n=2', 'POST /orders {"product":5,"qty":2}', 'PUT /orders {"product":5,"qty":2}', 'POST /createOrder'],
    a: 'POST /orders {"product":5,"qty":2}',
    why: 'إنشاء مورد جديد داخل مجموعة → POST على /orders، غير idempotent عمداً (نقره ثانية = طلب ثانٍ). GET لا تصنع أثراً جانبياً أبداً، وPUT تُستعمل للاستبدال بمعرّف معلوم مسبقاً.' },
  { t: 'استبدال العنوان بالكامل', sit: 'إدارة حسابات: المستخدم يكتب عنواناً جديداً كاملاً (مدينة/شارع/رمز) يستبدل القديم كلياً.',
    opts: ['PATCH /users/7 {"street":"x"}', 'POST /users/7/address', 'PUT /users/7 {"address":{"city":"x","street":"y","zip":"z"}}', 'GET /users/7/setAddr'],
    a: 'PUT /users/7 {"address":{"city":"x","street":"y","zip":"z"}}',
    why: 'PUT = استبدال المورد كاملاً وهو idempotent: تكرار الطلب مئة مرة يعطي نفس الحالة النهائية. PATCH للتعديل الجزئي لا الاستبدال، وPOST هنا عملية مبهمة بلا دلالة REST.' },
  { t: 'تعديل البريد فقط', sit: 'نفس الحساب: المستخدم يغيّر بريده الإلكتروني دون المساس ببقية حقول ملفه.',
    opts: ['PUT /users/7 {"email":"a@b.c"}', 'POST /users/7/email', 'PATCH /users/7 {"email":"a@b.c"}', 'PUT /users/7 {"name":"n","email":"a@b.c","phone":"p"}'],
    a: 'PATCH /users/7 {"email":"a@b.c"}',
    why: 'تعديل جزئي → PATCH يطبّق الحقول المُرسلة فقط. PUT بجسم ناقص خطير: الاستبدال الكامل قد يمسح الحقول غير المُرسلة أو يبطلها.' },
  { t: 'حذف مهمة', sit: 'مدير مهام: زر حذف على المهمة رقم 9.',
    opts: ['GET /tasks/9/delete', 'POST /tasks/9/remove', 'DELETE /tasks/9', 'DELETE /tasks?id=9'],
    a: 'DELETE /tasks/9',
    why: 'DELETE على مورد محدد بالمسار — وهي idempotent: أول نداء يحذف، الثاني يرجع 404، والحالة النهائية واحدة (المهمة غير موجودة). الفعل في URL (‏/delete‏) يكسر نموذج الموارد.' },
  { t: 'تعليم مهمة كمكتملة', sit: 'نفس المدير: checkbox يبدّل حالة إنجاز المهمة 9 بين منجزة وغير منجزة.',
    opts: ['GET /tasks/9?done=1', 'POST /tasks/9/toggle', 'PUT /tasks/9 {"title":"x","done":true,"notes":"n"}', 'PATCH /tasks/9 {"done":true}'],
    a: 'PATCH /tasks/9 {"done":true}',
    why: 'تعديل حالة جزئي وصريح → PATCH — الحالة الهدفة في الـpayload فهو idempotent (أرسله مرات → نفس النتيجة). toggle يعتمد على الحالة الراهنة فليس idempotent، وGET لا يعدّل.' },
  { t: 'بحث الكتب بفلتر وترقيم', sit: 'المكتبة: صفحة نتائج البحث بمؤلف «x» والصفحة الثانية.',
    opts: ['POST /books/search {"author":"x","page":2}', 'GET /books?author=x&page=2', 'POST /books?author=x', 'GET /searchBooks/x/2'],
    a: 'GET /books?author=x&page=2',
    why: 'الاستعلام قراءة → GET وباراميترات query: رابط قابل للمشاركة والحفظ والتخزين المؤقت. POST /search يخلط معنى الإنشاء بالبحث ويفقد تلك الخواص.' },
  { t: 'تسجيل الدخول', sit: 'أي نظام: المستخدم يرسل بريده وكلمة سره فيستلم توكن جلسة.',
    opts: ['GET /login?email=e&pass=p', 'POST /auth/login {"email":"e","password":"p"}', 'GET /auth/token?u=e&p=p', 'POST /checkPassword'],
    a: 'POST /auth/login {"email":"e","password":"p"}',
    why: 'بيانات الاعتماد في URL تُسجَّل بسجلات الخوادم والوسيطات وتتسرب عبر Referer والتاريخ — تُرسل في body عبر POST. والعملية فعل جانبي لا مورد قياسي فـPOST هنا أصدق الأفعال.' },
];

let i = 0;
function stats() {
  const acc = st.answered ? Math.round(st.correct / st.answered * 100) : 0;
  $('#adStats').innerHTML = `السيناريو <b>${Math.min(i + 1, SCEN.length)}/${SCEN.length}</b> • سلسلة حالية <b>${st.streak}</b> • أفضل <b>${st.best}</b> • دقة <b>${acc}%</b>`;
}
function end() {
  $('#adMain').innerHTML = `<div class="pn-end"><div class="pn-end-ic">${st.streak >= 8 ? '🏆' : '📊'}</div>
    <h2>انتهت الجولة — دقة الجلسة ${st.answered ? Math.round(st.correct / st.answered * 100) : 0}%</h2>
    <div class="pn-end-sub">أفضل سلسلة: ${st.best} • إجمالي الإجابات: ${st.answered}</div>
    <button class="btn" onclick="location.reload()">جولة جديدة ⟵</button></div>`;
}
function render() {
  if (i >= SCEN.length) return end();
  stats();
  const s = SCEN[i];
  const opts = shuffle([...s.opts]);
  $('#adMain').innerHTML = `
    <div class="lb-head" style="margin-bottom:14px">
      <span class="lb-cat-tag">REST</span>
      <span class="dh-idx">${i + 1}/${SCEN.length}</span>
      <h2 class="lb-t">🌐 ${escH(s.t)}</h2>
    </div>
    <div class="ad-sit">${s.sit}</div>
    <div class="dh-ask">أي تصميم أصوب REST-ياً؟</div>
    <div class="ad-opts" dir="ltr">${opts.map(o => `<button class="ad-opt" data-o="${escH(o)}">${escH(o)}</button>`).join('')}</div>
    <div id="adRes"></div>
    <div class="dh-nav">
      <span></span>
      <span class="dh-count">${st.streak} سلسلة</span>
      <button class="btn ghost sm" id="adSkip">تخطي ›</button>
    </div>`;
  $('#adSkip').onclick = () => { st.streak = 0; st.answered++; save(); i++; render(); };
  $('#adMain').querySelectorAll('.ad-opt').forEach(b => b.onclick = () => {
    const pick = b.dataset.o;
    const ok = pick === s.a;
    st.answered++;
    if (ok) { st.streak++; st.correct++; st.best = Math.max(st.best, st.streak); }
    else st.streak = 0;
    save();
    $('#adMain').querySelectorAll('.ad-opt').forEach(x => {
      x.disabled = true;
      if (x.dataset.o === s.a) x.classList.add('ok');
      else if (x.dataset.o === pick) x.classList.add('bad');
    });
    $('#adRes').innerHTML = `
      <div class="${ok ? 'pn-ok' : 'pn-bad'}" style="margin:12px 0 8px">${ok ? '✓ صحيح!' : `✗ — الصحيح: <b dir="ltr">${escH(s.a)}</b>`}</div>
      <div class="dh-why"><b>لماذا؟</b> ${escH(s.why)}</div>
      <button class="btn" style="margin-top:14px" id="adNext">${i === SCEN.length - 1 ? 'النتيجة ⟵' : 'التالي ⟵'}</button>`;
    $('#adNext').onclick = () => { i++; render(); };
    const c = $('#adMain').querySelector('.dh-count'); if (c) c.textContent = `${st.streak} سلسلة`;
    stats();
  });
}
render();
})();
