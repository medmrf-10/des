/* برمج — بيانات المسارات والدروس
   كل درس: id, t (العنوان), d (الشرح HTML), tip?, ex {html,css,js} أو {py},
   task {p, start?, checks[]}, quiz [{q, o:[], a}]
   أنواع الشروط (ويب): exists count text attr css js log src
   أنواع الشروط (بايثون): pyout (المخرجات) pysrc (المصدر، contains أو re) pyvar (متغير) */
const TRACKS = [
{
  id: 'web', name: 'أساسيات HTML وCSS', lang: 'web',
  desc: 'بناء صفحات الويب وتنسيقها: الوسوم، النصوص، الروابط، الصور، الألوان، الصناديق والتخطيط.',
  lessons: [
    {
      id: 'h1', t: 'أول صفحة ويب',
      d: `كل صفحة ويب تُبنى من <code>وسوم</code> (tags) تحيط بالمحتوى.
الوسم يبدأ بـ <code>&lt;اسم&gt;</code> وينتهي بـ <code>&lt;/اسم&gt;</code>.
أهم وسوم البداية:
- <code>&lt;h1&gt;</code> عنوان رئيسي كبير
- <code>&lt;p&gt;</code> فقرة نصية
- <code>&lt;button&gt;</code> زر`,
      tip: 'المحرر في تبويب «المختبر» يعرض ناتج الكود فور الضغط على «تشغيل».',
      ex: { html: `<h1>مرحباً بالعالم!</h1>
<p>هذه أول صفحة ويب لي.</p>
<button>اضغطني</button>`, css: '', js: '' },
      task: {
        p: 'أنشئ صفحة فيها: عنوان رئيسي <code>&lt;h1&gt;</code> بنص «أهلاً بكم»، وفقرة <code>&lt;p&gt;</code> فيها كلمة «برمجة»، وزر <code>&lt;button&gt;</code> نصه «ابدأ».',
        checks: [
          { desc: 'يوجد عنوان رئيسي h1 يتضمن «أهلاً بكم»', kind: 'text', sel: 'h1', contains: 'أهلاً بكم' },
          { desc: 'توجد فقرة p تتضمن «برمجة»', kind: 'text', sel: 'p', contains: 'برمجة' },
          { desc: 'يوجد زر نصه «ابدأ»', kind: 'text', sel: 'button', contains: 'ابدأ' },
        ]
      },
      quiz: [
        { q: 'وسم الإغلاق الصحيح يكون بأي شكل؟', o: ['&lt;/اسم&gt;', '&lt;اسم /&gt;', '&lt;اسم&gt;&lt;اسم&gt;'], a: 0 },
        { q: 'أي وسم يمثّل العنوان الرئيسي الأكبر؟', o: ['&lt;h1&gt;', '&lt;p&gt;', '&lt;title&gt;'], a: 0 },
        { q: 'وسم الفقرة النصية هو:', o: ['&lt;p&gt;', '&lt;para&gt;', '&lt;text&gt;'], a: 0 },
      ]
    },
    {
      id: 'h2', t: 'العناوين بمستوياتها',
      d: `العناوين لها ستة مستويات: من <code>&lt;h1&gt;</code> (الأكبر) إلى <code>&lt;h6&gt;</code> (الأصغر).
استعملها لتنظيم المحتوى: عنوان رئيسي واحد، ثم عناوين فرعية.`,
      ex: { html: `<h1>عنوان رئيسي</h1>
<h2>قسم أول</h2>
<p>محتوى القسم الأول.</p>
<h2>قسم ثانٍ</h2>
<h3>فرع من القسم الثاني</h3>`, css: '', js: '' },
      task: {
        p: 'اكتب عنواناً رئيسياً <code>&lt;h1&gt;</code>، وعنوانين فرعيين <code>&lt;h2&gt;</code> على الأقل.',
        checks: [
          { desc: 'يوجد h1 واحد على الأقل', kind: 'exists', sel: 'h1' },
          { desc: 'يوجد h2 اثنان على الأقل', kind: 'count', sel: 'h2', n: 2 },
        ]
      },
      quiz: [
        { q: 'أكبر مستوى عنوان هو:', o: ['h1', 'h6', 'h3'], a: 0 },
        { q: 'أصغر مستوى عنوان هو:', o: ['h6', 'h1', 'h0'], a: 0 },
        { q: 'كم عدد مستويات العناوين في HTML؟', o: ['6', '3', '9'], a: 0 },
      ]
    },
    {
      id: 'h3', t: 'الروابط والصور',
      d: `الرابط: <code>&lt;a href="العنوان"&gt;نص الرابط&lt;/a&gt;</code>
الصورة: <code>&lt;img src="اسم_الصورة" alt="وصف"&gt;</code> — لاحظ أنها لا تحتاج وسم إغلاق.`,
      ex: { html: `<h1>روابطي المفضلة</h1>
<a href="https://example.com">زيارة الموقع</a>
<p>صورة رمزية:</p>
<img src="https://placehold.co/120x60" alt="مثال">`, css: '', js: '' },
      task: {
        p: 'أضِف رابطاً <code>&lt;a&gt;</code> إلى أي موقع، وصورة <code>&lt;img&gt;</code> لها <code>alt</code>.',
        checks: [
          { desc: 'يوجد رابط a له href', kind: 'attr', sel: 'a', attr: 'href' },
          { desc: 'توجد صورة img لها src', kind: 'attr', sel: 'img', attr: 'src' },
          { desc: 'الصورة لها نص بديل alt', kind: 'attr', sel: 'img', attr: 'alt' },
        ]
      },
      quiz: [
        { q: 'وسم الرابط التشعبي هو:', o: ['&lt;a&gt;', '&lt;link&gt;', '&lt;url&gt;'], a: 0 },
        { q: 'الصفة التي تحدد وجهة الرابط:', o: ['href', 'src', 'to'], a: 0 },
        { q: 'الصفة التي تحدد مصدر الصورة:', o: ['src', 'href', 'link'], a: 0 },
      ]
    },
    {
      id: 'h4', t: 'القوائم المرتبة وغير المرتبة',
      d: `قائمة نقطية: <code>&lt;ul&gt;</code> (غير مرتبة)
قائمة رقمية: <code>&lt;ol&gt;</code> (مرتبة)
كل عنصر داخلهما يكون بوسم <code>&lt;li&gt;</code>.`,
      ex: { html: `<h2>قائمة التسوق</h2>
<ul>
  <li>خبز</li>
  <li>حليب</li>
</ul>
<h2>خطوات الوصفة</h2>
<ol>
  <li>سخّن الماء</li>
  <li>أضِف الشاي</li>
</ol>`, css: '', js: '' },
      task: {
        p: 'أنشئ قائمة <code>&lt;ol&gt;</code> مرتبة فيها 3 عناصر <code>&lt;li&gt;</code> على الأقل.',
        checks: [
          { desc: 'توجد قائمة مرتبة ol', kind: 'exists', sel: 'ol' },
          { desc: 'فيها 3 عناصر li أو أكثر', kind: 'count', sel: 'ol li', n: 3 },
        ]
      },
      quiz: [
        { q: 'القائمة المرتبة (الرقمية) تُنشأ بـ:', o: ['&lt;ol&gt;', '&lt;ul&gt;', '&lt;li&gt;'], a: 0 },
        { q: 'وسم عنصر القائمة الواحد هو:', o: ['&lt;li&gt;', '&lt;item&gt;', '&lt;el&gt;'], a: 0 },
        { q: 'القائمة النقطية (غير المرتبة) تُنشأ بـ:', o: ['&lt;ul&gt;', '&lt;ol&gt;', '&lt;list&gt;'], a: 0 },
      ]
    },
    {
      id: 'h6', t: 'مدخل بسيط: input ونموذج',
      d: `<code>&lt;input&gt;</code> حقل إدخال نصي. اجمعه مع <code>&lt;button&gt;</code> لعمل نموذج بسيط.
الصفة <code>placeholder</code> تعرض نص إرشاد داخل الحقل.`,
      ex: { html: `<h2>سجّل اسمك</h2>
<input placeholder="اكتب اسمك هنا">
<button>إرسال</button>`, css: '', js: '' },
      task: {
        p: 'أنشئ حقل إدخال <code>&lt;input&gt;</code> له <code>placeholder</code> فيه كلمة «اسمك»، وزر <code>&lt;button&gt;</code>.',
        checks: [
          { desc: 'يوجد input له placeholder', kind: 'attr', sel: 'input', attr: 'placeholder' },
          { desc: 'placeholder فيه كلمة «اسمك»', kind: 'attr', sel: 'input', attr: 'placeholder', val: 'اسمك', part: true },
          { desc: 'يوجد زر button', kind: 'exists', sel: 'button' },
        ]
      },
      quiz: [
        { q: 'وسم حقل الإدخال النصي هو:', o: ['&lt;input&gt;', '&lt;text&gt;', '&lt;field&gt;'], a: 0 },
        { q: 'الصفة التي تعرض نصاً إرشادياً داخل الحقل:', o: ['placeholder', 'hint', 'text'], a: 0 },
        { q: 'وسم الزر هو:', o: ['&lt;button&gt;', '&lt;btn&gt;', '&lt;click&gt;'], a: 0 },
      ]
    },
    {
      id: 'c1', t: 'الألوان والخلفيات',
      d: `CSS تكتب: <code>محدد { خاصية: قيمة; }</code>
أمثلة: <code>color: red;</code> لون النص، <code>background-color: gold;</code> لون الخلفية.
المحدد <code>body</code> يستهدف كامل الصفحة، و<code>p</code> يستهدف كل الفقرات.`,
      tip: 'افتح تبويب CSS في المختبر واكتب القواعد هناك — تُطبَّق فور التشغيل.',
      ex: { html: `<h1>صفحة ملونة</h1>
<p>فقرة تجريبية.</p>`,
        css: `body { background-color: #0b0f14; }
h1 { color: #e8c97a; }
p { color: white; }`, js: '' },
      task: {
        p: 'اجعل خلفية الصفحة <code>navy</code> (كحلي)، ولون كل العناوين h1 <code>gold</code> (ذهبي)، ولون الفقرات <code>white</code>.',
        start: { html: `<h1>عنواني</h1>
<p>فقرتي.</p>`, css: '', js: '' },
        checks: [
          { desc: 'خلفية body كحلية navy', kind: 'css', sel: 'body', prop: 'background-color', val: 'navy' },
          { desc: 'لون h1 ذهبي gold', kind: 'css', sel: 'h1', prop: 'color', val: 'gold' },
          { desc: 'لون p أبيض', kind: 'css', sel: 'p', prop: 'color', val: 'white' },
        ]
      },
      quiz: [
        { q: 'الخاصية التي تغيّر لون النص:', o: ['color', 'background-color', 'text-color'], a: 0 },
        { q: 'الخاصية التي تغيّر لون الخلفية:', o: ['background-color', 'color', 'bg'], a: 0 },
        { q: 'قيمة اللون الذهبي في CSS:', o: ['gold', 'yellow-gold', 'golden'], a: 0 },
      ]
    },
    {
      id: 'c2', t: 'حجم الخط وشكله',
      d: `<code>font-size: 24px;</code> حجم الخط
<code>font-weight: bold;</code> خط عريض
<code>text-align: center;</code> توسيط النص`,
      ex: { html: `<h1>عنوان كبير</h1>
<p>نص عادي.</p>`,
        css: `h1 { font-size: 40px; text-align: center; }
p { font-size: 20px; }`, js: '' },
      task: {
        p: 'اجعل العنوان h1 بحجم <code>36px</code> وموسَّطاً، والفقرة بخط عريض <code>bold</code>.',
        start: { html: `<h1>عنوان</h1>
<p>نص.</p>`, css: '', js: '' },
        checks: [
          { desc: 'حجم خط h1 = 36px', kind: 'css', sel: 'h1', prop: 'font-size', val: '36px' },
          { desc: 'h1 موسَّط', kind: 'css', sel: 'h1', prop: 'text-align', val: 'center' },
          { desc: 'خط p عريض', kind: 'css', sel: 'p', prop: 'font-weight', val: 'bold' },
        ]
      },
      quiz: [
        { q: 'خاصية حجم الخط:', o: ['font-size', 'text-size', 'size'], a: 0 },
        { q: 'لتوسيط النص نستعمل:', o: ['text-align: center', 'align: center', 'center: text'], a: 0 },
        { q: 'لجعل الخط عريضاً:', o: ['font-weight: bold', 'font: bold', 'bold: true'], a: 0 },
      ]
    },
    {
      id: 'c3', t: 'الصناديق: padding و border و margin',
      d: `نموذج الصندوق: المحتوى تحيط به <code>padding</code> (حشوة داخلية)، ثم <code>border</code> (إطار)، ثم <code>margin</code> (هامش خارجي).
مثال إطار: <code>border: 2px solid gold;</code>`,
      ex: { html: `<div class="card">بطاقة جميلة</div>`,
        css: `.card {
  background: #131a22;
  color: #e8c97a;
  padding: 20px;
  border: 3px solid #c9a24b;
  margin: 10px;
}`, js: '' },
      task: {
        p: 'أنشئ <code>&lt;div class="box"&gt;</code> ونسّقه بـ <code>padding: 20px</code> وإطار ذهبي <code>border: 3px solid gold</code>.',
        start: { html: `<div class="box">صندوق</div>`, css: '', js: '' },
        checks: [
          { desc: 'يوجد div بكلاس box', kind: 'exists', sel: 'div.box' },
          { desc: 'padding الصندوق = 20px', kind: 'css', sel: '.box', prop: 'padding-top', val: '20px' },
          { desc: 'إطار الصندوق ذهبي بسماكة 3px', kind: 'css', sel: '.box', prop: 'border-top-color', val: 'gold' },
        ]
      },
      quiz: [
        { q: 'الحشوة الداخلية حول المحتوى هي:', o: ['padding', 'margin', 'spacing'], a: 0 },
        { q: 'خاصية الإطار حول العنصر:', o: ['border', 'frame', 'edge'], a: 0 },
        { q: 'الهامش الخارجي حول العنصر هو:', o: ['margin', 'padding', 'outside'], a: 0 },
      ]
    },
    {
      id: 'c4', t: 'استهداف الكلاسات والمعرفات',
      d: `محدد الكلاس يبدأ بنقطة: <code>.card</code> يستهدف كل عنصر بـ <code>class="card"</code>
محدد المعرف يبدأ بـ #: <code>#title</code> يستهدف العنصر بـ <code>id="title"</code>`,
      ex: { html: `<h2 id="title">عنوان خاص</h2>
<p class="note">ملاحظة أولى</p>
<p class="note">ملاحظة ثانية</p>`,
        css: `#title { color: gold; }
.note { background: #1a2330; padding: 8px; }`, js: '' },
      task: {
        p: 'أضِف فقرة بكلاس <code>hi</code> واجعل لونها <code>red</code> عبر محدد <code>.hi</code>.',
        start: { html: `<p class="hi">مرحباً</p>`, css: '', js: '' },
        checks: [
          { desc: 'يوجد عنصر بكلاس hi', kind: 'exists', sel: '.hi' },
          { desc: 'لون .hi أحمر', kind: 'css', sel: '.hi', prop: 'color', val: 'red' },
        ]
      },
      quiz: [
        { q: 'محدد الكلاس في CSS يبدأ بـ:', o: ['.', '#', '@'], a: 0 },
        { q: 'محدد المعرف id يبدأ بـ:', o: ['#', '.', '!'], a: 0 },
        { q: 'الصفة التي تعطي العنصر كلاساً في HTML:', o: ['class', 'id', 'style'], a: 0 },
      ]
    },
    {
      id: 'c6', t: 'Flexbox للترتيب',
      d: `<code>display: flex;</code> على الحاوية يرصف أبناءها في سطر.
<code>justify-content: center;</code> توسيط أفقي، <code>gap: 10px;</code> فراغات بين العناصر.`,
      ex: { html: `<div class="row">
  <div class="item">١</div>
  <div class="item">٢</div>
  <div class="item">٣</div>
</div>`,
        css: `.row { display: flex; gap: 10px; }
.item { background: #1a2330; color: #e8c97a; padding: 20px; border-radius: 8px; }`, js: '' },
      task: {
        p: 'اجعل الحاوية <code>.row</code> تعرض أبناءها بـ <code>display: flex</code> مع <code>justify-content: space-between</code>.',
        start: { html: `<div class="row">
  <span>أ</span>
  <span>ب</span>
</div>`, css: '', js: '' },
        checks: [
          { desc: 'حاوية .row بـ display: flex', kind: 'css', sel: '.row', prop: 'display', val: 'flex' },
          { desc: 'توزيع space-between', kind: 'css', sel: '.row', prop: 'justify-content', val: 'space-between' },
        ]
      },
      quiz: [
        { q: 'لتفعيل الرصف المرن نكتب:', o: ['display: flex', 'flex: on', 'layout: flex'], a: 0 },
        { q: 'التوسيط الأفقي في flex يكون بـ:', o: ['justify-content: center', 'align: center', 'center: both'], a: 0 },
        { q: 'الخاصية التي تصنع فراغات بين العناصر:', o: ['gap', 'space', 'between'], a: 0 },
      ]
    },
  ]
},
{
  id: 'js', name: 'أساسيات JavaScript', lang: 'web',
  desc: 'لغة التفاعل: المتغيرات، الدوال، الشروط، الحلقات، المصفوفات، والتحكم بالصفحة.',
  lessons: [
    {
      id: 'j1', t: 'الطباعة والتنبيه',
      d: `JavaScript تنفذ أوامر على الصفحة.
<code>console.log("نص")</code> يطبع في «وحدة التحكم» (نحن نعرضها تحت الناتج).
<code>alert("نص")</code> يظهر نافذة منبثقة.`,
      tip: 'مخرجات console.log تظهر في صندوق أسفل نافذة الناتج.',
      ex: { html: `<h1>اختبر الجافاسكربت</h1>`, css: '',
        js: `console.log("أول سطر برمجي لي");
console.log(2 + 3);` },
      task: {
        p: 'اطبع في وحدة التحكم النص «مرحباً» ثم ناتج عملية <code>10 * 5</code>.',
        start: { html: `<h1>تمرين</h1>`, css: '', js: '' },
        checks: [
          { desc: 'وحدة التحكم فيها «مرحباً»', kind: 'log', contains: 'مرحباً' },
          { desc: 'وحدة التحكم فيها 50', kind: 'log', contains: '50' },
        ]
      },
      quiz: [
        { q: 'أين تظهر مخرجات console.log؟', o: ['في وحدة التحكم', 'في نافذة منبثقة', 'في عنوان الصفحة'], a: 0 },
        { q: 'الدالة التي تظهر نافذة منبثقة:', o: ['alert', 'print', 'popup'], a: 0 },
        { q: 'لطباعة قيمة في JS نستعمل:', o: ['console.log', 'echo', 'printf'], a: 0 },
      ]
    },
    {
      id: 'j2', t: 'المتغيرات',
      d: `المتغير صندوق يحفظ قيمة: <code>let name = "أحمد";</code>
النصوص بين علامتي تنصيص، والأرقام بدونها: <code>let age = 15;</code>
يمكن دمج النصوص بـ +: <code>"مرحباً " + name</code>`,
      ex: { html: `<h1>متغيرات</h1>`, css: '',
        js: `let name = "سارة";
let age = 12;
console.log("الاسم: " + name);
console.log("العمر: " + age);` },
      task: {
        p: 'عرّف متغير <code>city</code> بقيمة «الدار البيضاء» واطبعه بـ console.log.',
        start: { html: `<h1>مدينتي</h1>`, css: '', js: '' },
        checks: [
          { desc: 'وحدة التحكم فيها «الدار البيضاء»', kind: 'log', contains: 'الدار البيضاء' },
          { desc: 'المتغير city معرّف وقيمته «الدار البيضاء»', kind: 'js', expr: 'typeof city!=="undefined" && String(city).indexOf("الدار البيضاء")>=0' },
        ]
      },
      quiz: [
        { q: 'الصيغة الصحيحة لتعريف متغير:', o: ['let x = 5;', 'x = let 5;', 'var: x = 5'], a: 0 },
        { q: 'لدمج نصين في JS نستعمل:', o: ['+', '&', 'concat فقط'], a: 0 },
        { q: 'القيم النصية توضع بين:', o: ['علامتي تنصيص', 'قوسين', 'معقوفتين'], a: 0 },
      ]
    },
    {
      id: 'j3', t: 'الدوال',
      d: `الدالة كتلة كود تُستدعى عند الحاجة:
<code>function greet() { console.log("أهلاً"); }</code>
استدعها بكتابة اسمها: <code>greet();</code>`,
      ex: { html: `<h1>دوال</h1>`, css: '',
        js: `function greet() {
  console.log("أهلاً بك!");
}
greet();
greet();` },
      task: {
        p: 'عرّف دالة اسمها <code>salam</code> تطبع «السلام عليكم» ثم استدعِها.',
        start: { html: `<h1>دالتي</h1>`, css: '', js: '' },
        checks: [
          { desc: 'الدالة salam معرّفة', kind: 'js', expr: 'typeof salam==="function"' },
          { desc: 'وحدة التحكم فيها «السلام عليكم»', kind: 'log', contains: 'السلام عليكم' },
        ]
      },
      quiz: [
        { q: 'تُعرّف الدالة بالكلمة:', o: ['function', 'def', 'fun'], a: 0 },
        { q: 'لتشغيل الدالة نكتب:', o: ['اسمها مع قوسين()', 'اسمها فقط', 'run اسمها'], a: 0 },
        { q: 'كود الدالة يوضع بين:', o: ['{ }', '( )', '[ ]'], a: 0 },
      ]
    },
    {
      id: 'j4', t: 'الشروط if',
      d: `<code>if (شرط) { ... } else { ... }</code> تنفذ كوداً حسب تحقق الشرط.
عمليات المقارنة: <code>&gt;</code> أكبر، <code>&lt;</code> أصغر، <code>===</code> يساوي.`,
      ex: { html: `<h1>شروط</h1>`, css: '',
        js: `let age = 18;
if (age >= 18) {
  console.log("بالغ");
} else {
  console.log("قاصر");
}` },
      task: {
        p: 'عرّف متغير <code>score = 90</code> واكتب شرطاً: إن كان score أكبر من أو يساوي 50 اطبع «ناجح» وإلا «راسب».',
        start: { html: `<h1>نتيجتي</h1>`, css: '', js: '' },
        checks: [
          { desc: 'وحدة التحكم فيها «ناجح»', kind: 'log', contains: 'ناجح' },
          { desc: 'المتغير score معرّف وقيمته 90', kind: 'js', expr: 'typeof score!=="undefined" && Number(score)===90' },
        ]
      },
      quiz: [
        { q: 'else تنفذ كودها متى؟', o: ['عند عدم تحقق شرط if', 'دائماً', 'قبل if'], a: 0 },
        { q: 'علامة «يساوي تماماً» في JS:', o: ['===', '=', '==~'], a: 0 },
        { q: 'علامة «أكبر من أو يساوي»:', o: ['&gt;=', '=&gt;', '&gt;&gt;'], a: 0 },
      ]
    },
    {
      id: 'j5', t: 'التحكم بالصفحة: DOM',
      d: `تستطيع JS تغيير محتوى الصفحة:
<code>document.querySelector("h1")</code> يجد أول عنصر h1
<code>.textContent = "نص"</code> يغيّر نصه.`,
      ex: { html: `<h1 id="t">عنوان قديم</h1>`, css: '',
        js: `let el = document.querySelector("#t");
el.textContent = "عنوان جديد!";
el.style.color = "teal";` },
      task: {
        p: 'غيّر نص العنصر <code>&lt;p id="msg"&gt;</code> إلى «تم التغيير!» عبر JavaScript.',
        start: { html: `<p id="msg">نص أصلي</p>`, css: '', js: '' },
        checks: [
          { desc: 'نص #msg أصبح «تم التغيير!»', kind: 'text', sel: '#msg', contains: 'تم التغيير!' },
        ]
      },
      quiz: [
        { q: 'للعثور على أول عنصر h1 نكتب:', o: ['document.querySelector("h1")', 'find("h1")', 'get h1'], a: 0 },
        { q: 'لتغيير نص عنصر نستعمل:', o: ['.textContent', '.change', '.text()'], a: 0 },
        { q: 'لتغيير لون عنصر من JS:', o: ['el.style.color', 'el.color', 'paint(el)'], a: 0 },
      ]
    },
    {
      id: 'j6', t: 'التفاعل مع الزر: onclick',
      d: `اربط كوداً بحدث الضغط:
<code>el.onclick = function() { ... }</code>
أو مباشرة في HTML: <code>&lt;button onclick="fname()"&gt;</code>`,
      ex: { html: `<button id="b">اضغطني</button>
<p id="out"></p>`,
        css: '', js: `let b = document.querySelector("#b");
let out = document.querySelector("#out");
b.onclick = function() {
  out.textContent = "ضغطت الزر!";
};` },
      task: {
        p: 'اربط الزر <code>#go</code> بحيث يكتب في <code>#res</code> النص «يعمل!» عند الضغط عليه.',
        start: { html: `<button id="go">جرّب</button>
<p id="res"></p>`, css: '', js: '' },
        checks: [
          { desc: 'نص #res يصبح «يعمل!» بعد الضغط', kind: 'js', expr: '(function(){document.querySelector("#go").click();return document.querySelector("#res").textContent.indexOf("يعمل!")>=0})()' },
        ]
      },
      quiz: [
        { q: 'لربط كود بحدث الضغط على زر:', o: ['el.onclick = function(){...}', 'el.press', 'when click'], a: 0 },
        { q: 'لربط الحدث مباشرة في HTML نكتب:', o: ['onclick="f()"', 'press="f()"', 'on:f()'], a: 0 },
        { q: 'لمحاكاة الضغط على زر برمجياً:', o: ['el.click()', 'el.press()', 'push(el)'], a: 0 },
      ]
    },
    {
      id: 'j7', t: 'الحلقات: تكرار الأوامر',
      d: `الحلقة تكرر كوداً عدة مرات:
<code>for (let i = 0; i &lt; 5; i++) { ... }</code>
تبدأ من i=0 وتستمر ما دام i أصغر من 5، وi++ تزيدها 1 كل مرة.
وهناك <code>while (شرط) { ... }</code> التي تكرر ما دام الشرط صحيحاً.`,
      ex: { html: `<h1>عدّ تنازلي</h1>`, css: '',
        js: `for (let i = 3; i >= 1; i--) {
  console.log(i);
}
console.log("انطلاق!");` },
      task: {
        p: 'استعمل حلقة <code>for</code> لطباعة الأعداد من 1 إلى 5 (كل عدد في سطر).',
        start: { html: `<h1>عدّ تصاعدي</h1>`, css: '', js: '' },
        checks: [
          { desc: 'وحدة التحكم فيها 1 ثم 5', kind: 'log', contains: '5' },
          { desc: 'استعملت حلقة for', kind: 'src', lang: 'js', contains: 'for' },
          { desc: 'استعملت ++ أو +=', kind: 'src', lang: 'js', re: '\\+\\+|\\+=' },
        ]
      },
      quiz: [
        { q: 'for (let i=0; i&lt;3; i++) تتكرر كم مرة؟', o: ['3 مرات', '4 مرات', 'مرتين'], a: 0 },
        { q: 'i++ تعني:', o: ['زيادة i بمقدار 1', 'i تساوي 2', 'تصفير i'], a: 0 },
        { q: 'while تتوقف عن التكرار عندما:', o: ['يصبح الشرط خاطئاً', 'تكمل دورة واحدة', 'لا تتوقف أبداً'], a: 0 },
      ]
    },
    {
      id: 'j8', t: 'المصفوفات',
      d: `المصفوفة تخزّن عدة قيم في متغير واحد:
<code>let fruits = ["تفاح", "موز", "عنب"];</code>
الوصول لعنصر: <code>fruits[0]</code> (الفهرس يبدأ من 0).
عدد العناصر: <code>fruits.length</code> — والإضافة للنهاية: <code>fruits.push("برتقال")</code>.`,
      ex: { html: `<h1>مصفوفات</h1>`, css: '',
        js: `let nums = [10, 20, 30];
nums.push(40);
console.log("العدد: " + nums.length);
console.log("الأول: " + nums[0]);
for (let i = 0; i < nums.length; i++) {
  console.log(nums[i]);
}` },
      task: {
        p: 'أنشئ مصفوفة <code>fav</code> بثلاثة عناصر، أضِف إليها عنصراً رابعاً بـ <code>push</code>، ثم اطبع عدد عناصرها (يجب أن يكون 4).',
        start: { html: `<h1>مفضلاتي</h1>`, css: '', js: '' },
        checks: [
          { desc: 'وحدة التحكم فيها العدد 4', kind: 'log', contains: '4' },
          { desc: 'استعملت push للإضافة', kind: 'src', lang: 'js', contains: 'push' },
          { desc: 'المصفوفة fav معرّفة وطولها 4', kind: 'js', expr: 'typeof fav!=="undefined" && fav.length===4' },
        ]
      },
      quiz: [
        { q: 'فهرس أول عنصر في المصفوفة هو:', o: ['0', '1', '-1'], a: 0 },
        { q: 'لإضافة عنصر لنهاية المصفوفة:', o: ['push', 'add', 'insert'], a: 0 },
        { q: 'لمعرفة عدد عناصر المصفوفة:', o: ['.length', '.count', '.size()'], a: 0 },
      ]
    },
  ]
},
{
  id: 'py', name: 'أساسيات Python', lang: 'py',
  desc: 'لغة سهلة قوية: الطباعة، المتغيرات، الإدخال، الشروط، الحلقات، القوائم والدوال.',
  lessons: [
    {
      id: 'p1', t: 'الطباعة: print',
      d: `<code>print("نص")</code> تطبع سطراً في المخرجات.
يمكن طباعة نصوص وأرقام ونتائج عمليات: <code>print(2 + 3)</code> تطبع 5.`,
      tip: 'اضغط «تشغيل» وستظهر المخرجات أسفل المحرر — أول تشغيل يحمّل مفسّر بايثون وقد يأخذ ثواني.',
      ex: { py: `print("مرحباً من بايثون")
print("أنا أتعلم البرمجة")
print(7 * 8)` },
      task: {
        p: 'اطبع النص «أنا أتعلم بايثون» ثم اطبع ناتج <code>100 / 4</code>.',
        start: { py: `# اكتب كودك هنا
` },
        checks: [
          { desc: 'المخرجات فيها «أنا أتعلم بايثون»', kind: 'pyout', contains: 'أنا أتعلم بايثون' },
          { desc: 'المخرجات فيها 25', kind: 'pyout', contains: '25' },
          { desc: 'استعملت print', kind: 'pysrc', contains: 'print' },
        ]
      },
      quiz: [
        { q: 'ماذا تفعل الدالة print؟', o: ['تطبع في المخرجات', 'تحفظ ملفاً', 'تحذف سطراً'], a: 0 },
        { q: 'أين تظهر مخرجات print في المختبر؟', o: ['في صندوق المخرجات', 'في نافذة منبثقة', 'لا تظهر'], a: 0 },
        { q: 'ما ناتج print(2 + 3)؟', o: ['5', '2 + 3', 'خطأ'], a: 0 },
      ]
    },
    {
      id: 'p2', t: 'المتغيرات',
      d: `المتغير اسم يحفظ قيمة: <code>name = "سارة"</code>
الأنواع الأساسية: نص <code>str</code> (بين تنصيص)، عدد صحيح <code>int</code>، عدد عشري <code>float</code>.
اطبع عدة قيم بفاصلة: <code>print("الاسم:", name)</code>`,
      ex: { py: `name = "علي"
age = 10
height = 1.35
print("الاسم:", name)
print("العمر:", age)
print("الطول:", height)` },
      task: {
        p: 'عرّف متغير <code>city</code> بقيمة «جدة» واطبعه.',
        start: { py: `# عرّف المتغير واطبعه
` },
        checks: [
          { desc: 'المتغير city معرّف وقيمته «جدة»', kind: 'pyvar', name: 'city', val: 'جدة' },
          { desc: 'المخرجات فيها «جدة»', kind: 'pyout', contains: 'جدة' },
        ]
      },
      quiz: [
        { q: 'الصيغة الصحيحة لتعريف متغير:', o: ['x = 5', '5 = x', 'var x = 5'], a: 0 },
        { q: 'نوع القيمة "مرحبا" هو:', o: ['نص str', 'عدد int', 'منطقي bool'], a: 0 },
        { q: 'علامة = في بايثون تعني:', o: ['إسناد قيمة للمتغير', 'مقارنة', 'جمع'], a: 0 },
      ]
    },
    {
      id: 'p3', t: 'إدخال المستخدم: input',
      d: `<code>name = input("ما اسمك؟ ")</code> تنتظر إدخال المستخدم وتعيده <b>نصاً</b>.
لتحويله إلى عدد: <code>age = int(input("عمرك؟ "))</code>
في مختبرنا: اكتب قيم الإدخال في حقل «قيم input()» — كل سطر قيمة.`,
      ex: { py: `name = input("اسمك: ")
print("أهلاً", name)
color = input("لونك المفضل: ")
print("لونك هو", color)` },
      task: {
        p: 'اقرأ اسم المستخدم بـ <code>input</code> ثم اطبع «مرحباً» متبوعة بالاسم. (اكتب اسماً في حقل قيم input قبل التشغيل)',
        start: { py: `name = input("ما اسمك؟ ")
` },
        checks: [
          { desc: 'استعملت input', kind: 'pysrc', contains: 'input' },
          { desc: 'المخرجات فيها «مرحباً»', kind: 'pyout', contains: 'مرحباً' },
        ]
      },
      quiz: [
        { q: 'ماذا تعيد دالة input؟', o: ['نصاً', 'عدداً صحيحاً', 'لا شيء'], a: 0 },
        { q: 'لتحويل الإدخال إلى عدد نستعمل:', o: ['int()', 'str()', 'num()'], a: 0 },
        { q: 'النص داخل أقواس input يمثّل:', o: ['سؤالاً يُعرض للمستخدم', 'اسم ملف', 'رقماً عشوائياً'], a: 0 },
      ]
    },
    {
      id: 'p4', t: 'الشروط: if و else',
      d: `<code>if شرط:</code> نفّذ الكتلة التالية إن تحقق الشرط، <code>else:</code> إن لم يتحقق.
تنبيه مهم: الأسطر داخل الشرط تبدأ بـ<b>مسافة بادئة</b> (4 مسافات)، والسطر ينتهي بنقطتين <code>:</code>`,
      ex: { py: `age = 18
if age >= 18:
    print("بالغ")
else:
    print("قاصر")` },
      task: {
        p: 'عرّف <code>score = 75</code> واكتب: إن كان أكبر من أو يساوي 50 اطبع «ناجح» وإلا «راسب».',
        start: { py: `score = 75
# أكمل الشرط هنا
` },
        checks: [
          { desc: 'المخرجات فيها «ناجح»', kind: 'pyout', contains: 'ناجح' },
          { desc: 'استعملت if', kind: 'pysrc', contains: 'if' },
          { desc: 'استعملت else', kind: 'pysrc', contains: 'else' },
        ]
      },
      quiz: [
        { q: 'علامة «أكبر من أو يساوي» في بايثون:', o: ['&gt;=', '=&gt;', '=='], a: 0 },
        { q: 'المسافة البادئة داخل if:', o: ['ضرورية وتحدد الكتلة', 'اختيارية', 'ممنوعة'], a: 0 },
        { q: 'كتلة else تنفذ متى؟', o: ['عند عدم تحقق الشرط', 'دائماً', 'أبداً'], a: 0 },
      ]
    },
    {
      id: 'p5', t: 'الحلقات: for و while',
      d: `<code>for i in range(5):</code> تكرر الكتلة مع i تأخذ القيم 0 إلى 4.
<code>range(1, 6)</code> يولّد 1 إلى 5.
<code>while شرط:</code> تكرر ما دام الشرط صحيحاً.`,
      ex: { py: `for i in range(1, 6):
    print(i)

count = 3
while count > 0:
    print("باقي", count)
    count = count - 1` },
      task: {
        p: 'استعمل حلقة <code>for</code> مع <code>range</code> لطباعة الأعداد من 1 إلى 10.',
        start: { py: `# اطبع 1 إلى 10 بحلقة
` },
        checks: [
          { desc: 'المخرجات فيها 10', kind: 'pyout', contains: '10' },
          { desc: 'استعملت for', kind: 'pysrc', contains: 'for' },
          { desc: 'استعملت range', kind: 'pysrc', contains: 'range' },
        ]
      },
      quiz: [
        { q: 'range(5) يولّد القيم:', o: ['من 0 إلى 4', 'من 1 إلى 5', 'من 0 إلى 5'], a: 0 },
        { q: 'للمرور على كل عنصر في قائمة نستعمل:', o: ['for', 'if', 'print'], a: 0 },
        { q: 'while تتوقف عندما:', o: ['يصبح الشرط خاطئاً', 'بعد دورة واحدة', 'لا تتوقف'], a: 0 },
      ]
    },
    {
      id: 'p6', t: 'القوائم',
      d: `القائمة تجمع عدة قيم: <code>fruits = ["تفاح", "موز"]</code>
الوصول لعنصر: <code>fruits[0]</code> (الفهرس يبدأ من 0).
الإضافة: <code>fruits.append("عنب")</code> — والعدد: <code>len(fruits)</code>.`,
      ex: { py: `nums = [10, 20, 30]
nums.append(40)
print("العدد:", len(nums))
print("الأول:", nums[0])
for n in nums:
    print(n)` },
      task: {
        p: 'أنشئ قائمة <code>fav</code> بثلاثة عناصر، أضِف رابعاً بـ <code>append</code>، واطبع طولها (يجب 4).',
        start: { py: `fav = []
` },
        checks: [
          { desc: 'المخرجات فيها 4', kind: 'pyout', contains: '4' },
          { desc: 'استعملت append', kind: 'pysrc', contains: 'append' },
          { desc: 'fav معرّفة وطولها 4', kind: 'pyvar', name: 'fav', val: 4, len: true },
        ]
      },
      quiz: [
        { q: 'فهرس أول عنصر في القائمة:', o: ['0', '1', '-1'], a: 0 },
        { q: 'لإضافة عنصر لنهاية القائمة:', o: ['append', 'add', 'push'], a: 0 },
        { q: 'len([1, 2, 3]) تعيد:', o: ['3', '2', '4'], a: 0 },
      ]
    },
    {
      id: 'p7', t: 'الدوال: def و return',
      d: `الدالة كتلة قابلة لإعادة الاستعمال:
<code>def salam(name):</code>
&nbsp;&nbsp;&nbsp;&nbsp;<code>return "أهلاً " + name</code>
تُستدعى: <code>print(salam("عمر"))</code>`,
      ex: { py: `def double(x):
    return x * 2

def greet(name):
    return "أهلاً " + name

print(double(5))
print(greet("سارة"))` },
      task: {
        p: 'عرّف دالة <code>area(w, h)</code> تعيد حاصل ضرب الطول في العرض، واطبع <code>area(3, 4)</code> (يجب 12).',
        start: { py: `# عرّف الدالة هنا
` },
        checks: [
          { desc: 'المخرجات فيها 12', kind: 'pyout', contains: '12' },
          { desc: 'عرّفت دالة بـ def', kind: 'pysrc', contains: 'def' },
          { desc: 'أعدت قيمة بـ return', kind: 'pysrc', contains: 'return' },
        ]
      },
      quiz: [
        { q: 'الكلمة المفتاحية لتعريف دالة:', o: ['def', 'function', 'fun'], a: 0 },
        { q: 'return تفعل:', o: ['ترجع قيمة من الدالة', 'تطبع قيمة', 'تنهي البرنامج'], a: 0 },
        { q: 'وسائط الدالة تُكتب:', o: ['بين قوسي اسمها', 'قبل اسمها', 'بعد نقطتين'], a: 0 },
      ]
    },
    {
      id: 'p8', t: 'النصوص المنسقة f-string',
      d: `ضع <code>f</code> قبل النص لتدمج قيم المتغيرات داخله بمعقوفتين:
<code>name = "عمر"</code>
<code>print(f"أهلاً {name}")</code>
يمكن وضع عمليات داخلها: <code>f"الناتج {2*3}"</code> يطبع «الناتج 6».`,
      ex: { py: `name = "سارة"
score = 90
print(f"الطالبة {name} نالت {score}")
print(f"النصف: {score / 2}")` },
      task: {
        p: 'عرّف متغيرين <code>name</code> و<code>age</code> واطبع بـ f-string جملة «اسمي <code>name</code> وعمري <code>age</code>» (بالقيم داخل النص).',
        start: { py: `name = "خالد"
age = 14
` },
        checks: [
          { desc: 'استعملت f-string', kind: 'pysrc', re: 'f["\']' },
          { desc: 'المخرجات فيها «اسمي»', kind: 'pyout', contains: 'اسمي' },
          { desc: 'المخرجات فيها «عمري»', kind: 'pyout', contains: 'عمري' },
        ]
      },
      quiz: [
        { q: 'البادئة f قبل النص تعني:', o: ['نصاً منسقاً يدمج المتغيرات', 'ملفاً خارجياً', 'دالة'], a: 0 },
        { q: 'داخل f-string توضع القيم في:', o: ['{ }', '[ ]', '( )'], a: 0 },
        { q: 'ماذا يطبع f"2+2={2+2}"؟', o: ['2+2=4', '2+2={2+2}', 'خطأ'], a: 0 },
      ]
    },
  ]
},
];

/* ====== مسار JavaScript متوسط (wave-3) ====== */
TRACKS.push({
  id: 'jsm', name: 'JavaScript متوسط', lang: 'web',
  desc: 'ما بعد الأساسيات: DOM المتقدم، الأحداث، المصفوفات والكائنات، JSON والتخزين، fetch والبرمجة غير المتزامنة، الأصناف والإغلاقات.',
  lessons: [
    {
      id: 'm1', t: 'إنشاء العناصر وإضافتها للصفحة',
      d: `بعد اختيار عنصر بـ <code>querySelector</code> يمكنك بناء عناصر جديدة:
- <code>document.createElement('li')</code> تنشئ عنصراً في الذاكرة
- <code>el.textContent</code> تضبط نصه
- <code>parent.appendChild(el)</code> تُلحقه بالصفحة كآخر ابن
العنصر لا يظهر في الصفحة إلا بعد إلحاقه بعنصر موجود.`,
      tip: 'أنشئ العنصر ثم اضبطه ثم ألحقه — ترتيب مهم.',
      ex: { html: `<h3>قائمتي</h3>
<ul id="list"></ul>`, css: '', js: `var list = document.querySelector('#list');
var item = document.createElement('li');
item.textContent = 'أول عنصر';
list.appendChild(item);` },
      task: {
        p: 'أنشئ داخل <code>#list</code> ثلاثة عناصر <code>li</code> باستعمال <code>document.createElement</code> و <code>appendChild</code>.',
        checks: [
          { desc: 'استعملت document.createElement', kind: 'src', lang: 'js', contains: 'createElement' },
          { desc: 'يوجد 3 عناصر li داخل #list', kind: 'count', sel: '#list li', n: 3 },
          { desc: 'ألحقتها بالقائمة (appendChild أو append)', kind: 'src', lang: 'js', re: 'appendChild|append\\(' },
        ]
      },
      quiz: [
        { q: 'document.createElement تُعيد:', o: ['عنصراً جديداً في الذاكرة', 'عنصراً ظاهراً مباشرة', 'نصاً'], a: 0 },
        { q: 'appendChild تضيف العنصر إلى:', o: ['العنصر الأب الذي استدعاها', 'أول الصفحة', 'آخر المستند'], a: 0 },
        { q: 'نص العنصر يُضبط بخاصية:', o: ['textContent', 'innerText فقط', 'value'], a: 0 },
      ]
    },
    {
      id: 'm2', t: 'الأحداث: addEventListener',
      d: `<code>el.addEventListener('click', fn)</code> تربط دالة بحدث على عنصر.
الوسيط الأول اسم الحدث (<code>click</code>، <code>input</code>، <code>submit</code>…) والثاني الدالة.
ميزتها على <code>onclick</code>: تسمح بعدة مستمعين لنفس الحدث وتفصل JS عن HTML.`,
      tip: 'الحدث الأشهر click — لكن جرّب input لتحديث فوري أثناء الكتابة.',
      ex: { html: `<button id="b">اضغطني</button>
<p id="msg">لم تضغط بعد</p>`, css: '', js: `var b = document.querySelector('#b');
b.addEventListener('click', function(){
  document.querySelector('#msg').textContent = 'ضغطت الزر!';
});` },
      task: {
        p: 'اربط بالزر <code>#btn</code> حدث <code>click</code> عبر <code>addEventListener</code> يجعل <code>#res</code> يعرض «تم الضغط!».',
        checks: [
          { desc: 'استعملت addEventListener', kind: 'src', lang: 'js', contains: 'addEventListener' },
          { desc: 'الضغط على #btn يغيّر نص #res', kind: 'js', expr: 'document.querySelector("#btn").click();document.querySelector("#res").textContent.indexOf("تم الضغط")>=0' },
          { desc: 'يوجد الزر #btn في الصفحة', kind: 'exists', sel: '#btn' },
        ]
      },
      quiz: [
        { q: 'الوسيط الثاني لـ addEventListener هو:', o: ['دالة تُنفَّذ عند الحدث', 'نص يُعرض', 'اسم العنصر'], a: 0 },
        { q: 'اسم حدث الضغط بالفأرة:', o: ['click', 'press', 'push'], a: 0 },
        { q: 'ميزة addEventListener عن onclick:', o: ['تسمح بعدة مستمعين لنفس الحدث', 'أسرع تنفيذاً دائماً', 'لا تحتاج دالة'], a: 0 },
      ]
    },
    {
      id: 'm3', t: 'تفويض الأحداث: مستمع واحد لقائمة كاملة',
      d: `بدل مستمع على كل عنصر، ضع مستمعاً واحداً على الأب — الأحداث «تصعد» من الابن للأب.
داخل المستمع: <code>e.target</code> هو العنصر المضغوط فعلياً، و<code>t.closest('li')</code> تجد العنصر الحاوي، و<code>t.dataset.name</code> تقرأ خاصية <code>data-name</code>.`,
      tip: 'التفويض ضروري للعناصر المضافة لاحقاً عبر JS — المستمع على الأب يلتقطها تلقائياً.',
      ex: { html: `<ul id="menu">
  <li data-name="الرئيسية">الرئيسية</li>
  <li data-name="الدروس">الدروس</li>
</ul>
<p id="out">—</p>`, css: '', js: `var menu = document.querySelector('#menu');
menu.addEventListener('click', function(e){
  var li = e.target.closest('li');
  if (li) document.querySelector('#out').textContent = 'اخترت: ' + li.dataset.name;
});` },
      task: {
        p: 'اجعل الضغط على أي <code>li</code> داخل <code>#menu</code> يكتب اسمها في <code>#out</code> — بمستمع واحد على القائمة (تفويض).',
        checks: [
          { desc: 'مستمع واحد عبر addEventListener', kind: 'src', lang: 'js', contains: 'addEventListener' },
          { desc: 'قرأت العنصر المضغوط عبر target', kind: 'src', lang: 'js', contains: 'target' },
          { desc: 'الضغط على عنصر يملأ #out', kind: 'js', expr: 'var l=document.querySelectorAll("#menu li");l.length&&l[0].click();document.querySelector("#out").textContent.trim().length>0' },
        ]
      },
      quiz: [
        { q: 'تفويض الأحداث يعني:', o: ['مستمع واحد على العنصر الأب يلتقط أحداث الأبناء', 'مستمع لكل عنصر', 'حذف المستمعين'], a: 0 },
        { q: 'داخل المستمع، العنصر المضغوط فعلياً هو:', o: ['e.target', 'e.parent', 'this دائماً'], a: 0 },
        { q: 'خاصية data-name على العنصر تُقرأ في JS بـ:', o: ['el.dataset.name', 'el.data.name', 'el.getAttr(name)'], a: 0 },
      ]
    },
    {
      id: 'm4', t: 'map و filter على المصفوفات',
      d: `<code>arr.map(fn)</code> تُعيد مصفوفة جديدة بتطبيق fn على كل عنصر — بنفس الطول.
<code>arr.filter(fn)</code> تُعيد مصفوفة بالعناصر التي يعيد لها fn قيمة true فقط.
كلتاهما لا تغيّران المصفوفة الأصلية.`,
      tip: 'سلسلة ممكنة: arr.filter(...).map(...) — الترشيح أولاً ثم التحويل.',
      ex: { html: `<p>افتح وحدة التحكم أسفل الناتج.</p>`, css: '', js: `var nums = [1, 2, 3, 4];
var dbl = nums.map(function(n){ return n * 2; });
var big = nums.filter(function(n){ return n > 2; });
console.log(dbl);
console.log(big);` },
      task: {
        p: 'مع <code>nums = [5, 12, 3, 20, 8]</code>: اطبع مضاعفاتها بـ <code>map</code>، ثم الأكبر من 10 بـ <code>filter</code>.',
        checks: [
          { desc: 'استعملت map', kind: 'src', lang: 'js', contains: 'map' },
          { desc: 'استعملت filter', kind: 'src', lang: 'js', contains: 'filter' },
          { desc: 'المخرجات فيها 24 (12×2)', kind: 'log', contains: '24' },
        ]
      },
      quiz: [
        { q: 'map تُعيد:', o: ['مصفوفة جديدة بنفس الطول', 'قيمة واحدة', 'المصفوفة نفسها معدّلة'], a: 0 },
        { q: 'filter تُبقي العناصر التي:', o: ['يعيد لها الشرط true', 'تقع في البداية', 'ليست أرقاماً'], a: 0 },
        { q: 'الدالة الممررة لـ map/filter تسمى:', o: ['دالة ردّ callback', 'مؤقت', 'محدد'], a: 0 },
      ]
    },
    {
      id: 'm5', t: 'reduce و find',
      d: `<code>arr.reduce(fn, start)</code> تجمع المصفوفة لقيمة واحدة: المجمّع يتراكم عبر العناصر.
<code>arr.find(fn)</code> تُعيد أول عنصر يحقق الشرط، أو <code>undefined</code> إن لم يوجد.`,
      tip: 'reduce أقوى من حلقة الجمع لكنها تربك المبتدئين — اقرأ (a, b) كـ «المجمّع والعنصر».',
      ex: { html: `<p>افتح وحدة التحكم أسفل الناتج.</p>`, css: '', js: `var prices = [5, 10, 2];
var total = prices.reduce(function(a, b){ return a + b; }, 0);
console.log('المجموع: ' + total);
var item = prices.find(function(p){ return p > 4; });
console.log('أول ما فوق 4: ' + item);` },
      task: {
        p: 'اجمع المصفوفة <code>[5, 10, 2]</code> بـ <code>reduce</code> واطبع المجموع (17)، ثم استعمل <code>find</code> على أي مصفوفة واطبع نتيجتها.',
        checks: [
          { desc: 'استعملت reduce', kind: 'src', lang: 'js', contains: 'reduce' },
          { desc: 'استعملت find', kind: 'src', lang: 'js', contains: 'find' },
          { desc: 'المخرجات فيها المجموع 17', kind: 'log', contains: '17' },
        ]
      },
      quiz: [
        { q: 'reduce تحتاج:', o: ['دالة مجمّع + قيمة أولية', 'شرطاً فقط', 'مصفوفتين'], a: 0 },
        { q: 'find تُعيد:', o: ['أول عنصر يحقق الشرط', 'كل المطابقين', 'عدد المطابقين'], a: 0 },
        { q: 'ناتج reduce دائماً:', o: ['قيمة واحدة متراكمة', 'مصفوفة', 'بوليان'], a: 0 },
      ]
    },
    {
      id: 'm6', t: 'الكائنات: خواص وأساليب',
      d: `الكائن يجمع بيانات مترابطة: <code>{name: 'سارة', age: 25}</code>.
الوصول للخاصية: <code>obj.name</code> أو <code>obj['name']</code>.
الدالة داخل كائن تسمى أسلوباً (method)، وداخلها تشير <code>this</code> للكائن نفسه.`,
      tip: 'هذا أساس كل ما سيأتي: JSON والاستجابات من fetch كلها كائنات.',
      ex: { html: `<p>افتح وحدة التحكم أسفل الناتج.</p>`, css: '', js: `var car = {
  name: 'كورولا',
  year: 2020,
  say: function(){ console.log('سيارة: ' + this.name + ' — ' + this.year); }
};
car.say();` },
      task: {
        p: 'أنشئ كائن <code>student</code> بخواص <code>name</code> = «سارة» و <code>grade</code> = 90، وأسلوب <code>greet()</code> يطبع «أنا سارة». استدعِه.',
        checks: [
          { desc: 'أنشأت كائن student', kind: 'js', expr: 'typeof student==="object" && student !== null' },
          { desc: 'استعملت this داخل الأسلوب', kind: 'src', lang: 'js', contains: 'this' },
          { desc: 'المخرجات فيها «أنا سارة»', kind: 'log', contains: 'أنا سارة' },
        ]
      },
      quiz: [
        { q: 'الوصول لخاصية name في obj:', o: ['obj.name', 'obj(name)', 'name.obj'], a: 0 },
        { q: 'داخل الأسلوب this تشير إلى:', o: ['الكائن المالك', 'الصفحة', 'الدالة نفسها'], a: 0 },
        { q: 'الكائن يُنشأ بأقواس:', o: ['{ }', '[ ]', '( )'], a: 0 },
      ]
    },
    {
      id: 'm7', t: 'JSON و localStorage',
      d: `<code>JSON.stringify(obj)</code> تحوّل الكائن إلى نص، و<code>JSON.parse(s)</code> تعيده كائناً.
<code>localStorage.setItem('k', نص)</code> يخزّن نصاً على الجهاز، و<code>getItem('k')</code> يسترجعه — حتى بعد إغلاق الصفحة.
المختبر يحاكي localStorage محلياً داخل iframe.`,
      tip: 'localStorage يخزّن نصوصاً فقط — الكائنات تمرّ عبر stringify أولاً.',
      ex: { html: `<p>افتح وحدة التحكم أسفل الناتج.</p>`, css: '', js: `var user = { name: 'سالم', score: 95 };
localStorage.setItem('user', JSON.stringify(user));
var back = JSON.parse(localStorage.getItem('user'));
console.log(back.name + ' — ' + back.score);` },
      task: {
        p: 'خزّن كائناً باسم <code>«user»</code> في localStorage بعد تحويله بـ <code>JSON.stringify</code>، ثم استرجعه بـ <code>JSON.parse</code> واطبع خاصية <code>name</code> منه.',
        checks: [
          { desc: 'استعملت JSON.stringify', kind: 'src', lang: 'js', contains: 'JSON.stringify' },
          { desc: 'استعملت JSON.parse و localStorage', kind: 'src', lang: 'js', re: 'JSON\\.parse[\\s\\S]*localStorage|localStorage[\\s\\S]*JSON\\.parse' },
          { desc: 'الكائن خُزّن فعلاً في localStorage', kind: 'js', expr: '(function(){try{var o=JSON.parse(localStorage.getItem("user"));return o&&typeof o.name==="string"&&o.name.length>0}catch(e){return false}})()' },
        ]
      },
      quiz: [
        { q: 'JSON.stringify تحوّل:', o: ['كائناً إلى نص', 'نصاً إلى كائن', 'رقماً إلى نص'], a: 0 },
        { q: 'localStorage يخزّن:', o: ['نصوصاً فقط', 'كائنات مباشرة', 'صوراً'], a: 0 },
        { q: 'getItem لقيمة غير موجودة تُعيد:', o: ['null', 'undefined', 'خطأ'], a: 0 },
      ]
    },
    {
      id: 'm8', t: 'fetch: جلب البيانات',
      d: `<code>fetch(url)</code> تبدأ طلب شبكة وتُعيد <code>Promise</code> فوراً.
<code>.then(r =&gt; r.json())</code> تحوّل الاستجابة لكائن، و<code>.then(d =&gt; ...)</code> تتعامل مع البيانات.
المختبر يحاكي خادماً تجريبياً: <code>fetch('/api/user')</code> تعيد <code>{name:'سارة', age:25}</code>.`,
      tip: 'fetch غير متزامنة — كودك يكمل التنفيذ والنتيجة تصل لاحقاً داخل then.',
      ex: { html: `<p>افتح وحدة التحكم أسفل الناتج.</p>`, css: '', js: `fetch('/api/user')
  .then(function(r){ return r.json(); })
  .then(function(d){ console.log('المستخدم: ' + d.name); });` },
      task: {
        p: 'اجلب <code>/api/user</code> بـ <code>fetch</code> واطبع قيمة <code>name</code> من الاستجابة (سارة).',
        checks: [
          { desc: 'استعملت fetch', kind: 'src', lang: 'js', contains: 'fetch' },
          { desc: 'حوّلت الاستجابة عبر .json()', kind: 'src', lang: 'js', contains: '.json' },
          { desc: 'المخرجات فيها «سارة»', kind: 'log', contains: 'سارة' },
        ]
      },
      quiz: [
        { q: 'fetch تُعيد:', o: ['Promise', 'البيانات مباشرة', 'كائن JSON جاهزاً'], a: 0 },
        { q: 'r.json() تفعل:', o: ['تحوّل جسم الاستجابة لكائن', 'ترسل طلباً جديداً', 'تغلق الاتصال'], a: 0 },
        { q: '.then تُنفَّذ:', o: ['عند وصول النتيجة', 'فوراً', 'عند الخطأ فقط'], a: 0 },
      ]
    },
    {
      id: 'm9', t: 'async و await',
      d: `دالة <code>async</code> تعيد Promise وتسمح داخلها بـ <code>await</code> التي توقف التنفيذ حتى يكتمل الوعد — قراءة أسهل من سلاسل then.
الأخطاء تُلتقط بـ <code>try/catch</code> حول await.`,
      tip: 'await تعمل فقط داخل دالة async — خارجها تحتاج .then.',
      ex: { html: `<p>افتح وحدة التحكم أسفل الناتج.</p>`, css: '', js: `async function load(){
  try {
    var r = await fetch('/api/post');
    var d = await r.json();
    console.log('العنوان: ' + d.title);
  } catch(e) {
    console.log('فشل الجلب');
  }
}
load();` },
      task: {
        p: 'اكتب دالة <code>async</code> تجلب <code>/api/post</code> بـ <code>await</code> داخل <code>try</code>، واطبع <code>title</code> المقال («أسرار الويب»).',
        checks: [
          { desc: 'دالة async', kind: 'src', lang: 'js', contains: 'async' },
          { desc: 'استعملت await', kind: 'src', lang: 'js', contains: 'await' },
          { desc: 'المخرجات فيها «أسرار الويب»', kind: 'log', contains: 'أسرار الويب' },
        ]
      },
      quiz: [
        { q: 'await تعمل داخل:', o: ['دالة async فقط', 'أي دالة', 'class فقط'], a: 0 },
        { q: 'أخطاء await تُلتقط بـ:', o: ['try/catch', 'if/else', 'return'], a: 0 },
        { q: 'الدالة async تُعيد دائماً:', o: ['Promise', 'قيمة مباشرة', 'JSON'], a: 0 },
      ]
    },
    {
      id: 'm10', t: 'Promise.all: مهام متوازية',
      d: `<code>Promise.all([p1, p2])</code> تشغّل الوعود معاً وتُعيد وعداً واحداً بنتائجها كمصفوفة.
أسرع من الانتظار المتسلسل حين لا تعتمد النتائج على بعضها.
إن رُفض أحد الوعود يفشل كل شيء.`,
      tip: 'استعملها لجلب عدة موارد دفعة واحدة — المستخدمين والمنتجات معاً.',
      ex: { html: `<p>افتح وحدة التحكم أسفل الناتج.</p>`, css: '', js: `Promise.all([fetch('/api/user'), fetch('/api/users')])
  .then(function(rs){ return Promise.all(rs.map(function(r){ return r.json(); })); })
  .then(function(ds){
    console.log('المستخدم: ' + ds[0].name);
    console.log('العدد: ' + ds[1].length);
  });` },
      task: {
        p: 'اجلب <code>/api/user</code> و <code>/api/users</code> معاً عبر <code>Promise.all</code>، واطبع اسم المستخدم وعدد المستخدمين (3).',
        checks: [
          { desc: 'استعملت Promise.all', kind: 'src', lang: 'js', contains: 'Promise.all' },
          { desc: 'المخرجات فيها «سارة»', kind: 'log', contains: 'سارة' },
          { desc: 'المخرجات فيها العدد 3', kind: 'log', contains: '3' },
        ]
      },
      quiz: [
        { q: 'Promise.all تُعيد:', o: ['مصفوفة بنتائج كل الوعود', 'أول نتيجة تصل', 'آخر نتيجة'], a: 0 },
        { q: 'إن رُفض أحد الوعود:', o: ['يفشل كل الوعد المجمع', 'يتجاهله', 'يعيد undefined مكانه'], a: 0 },
        { q: 'فائدتها الأساسية:', o: ['تنفيذ متوازٍ أسرع', 'إلغاء الأخطاء', 'تبسيط المتغيرات'], a: 0 },
      ]
    },
    {
      id: 'm11', t: 'الأصناف: class و extends',
      d: `<code>class</code> قالب لإنشاء كائنات متشابهة: <code>constructor</code> تُستدعى عند <code>new</code>.
<code>class Cat extends Animal</code> وراثة — الابن يأخذ أساليب الأب ويستدعيها بـ <code>super</code>.`,
      tip: 'الصنف مجرد قالب — لا شيء يعمل حتى تنشئ نسخة بـ new.',
      ex: { html: `<p>افتح وحدة التحكم أسفل الناتج.</p>`, css: '', js: `class Animal {
  constructor(name){ this.name = name; }
  speak(){ console.log(this.name + ' يصدر صوتاً'); }
}
class Cat extends Animal {
  speak(){ console.log(this.name + ': مواء'); }
}
var c = new Cat('مشمش');
c.speak();` },
      task: {
        p: 'أنشئ <code>class Car</code> بـ <code>constructor</code> يحفظ <code>this.m</code>، وأسلوب <code>info()</code> يطبع «سيارة كامري» عند إنشائه بـ <code>new Car(«كامري»)</code>.',
        checks: [
          { desc: 'عرفت class', kind: 'src', lang: 'js', contains: 'class' },
          { desc: 'فيها constructor', kind: 'src', lang: 'js', contains: 'constructor' },
          { desc: 'المخرجات فيها «كامري»', kind: 'log', contains: 'كامري' },
        ]
      },
      quiz: [
        { q: 'constructor تُستدعى:', o: ['عند إنشاء نسخة بـ new', 'عند التعريف', 'عند الطباعة'], a: 0 },
        { q: 'الوراثة من صنف آخر بكلمة:', o: ['extends', 'inherits', 'parent'], a: 0 },
        { q: 'استدعاء أسلوب الأب من الابن بـ:', o: ['super', 'parent', 'base'], a: 0 },
      ]
    },
    {
      id: 'm12', t: 'الإغلاقات: دالة تنتج دالة',
      d: `الإغلاقة (closure): دالة داخلية تتذكر متغيرات الدالة الخارجية حتى بعد انتهائها.
<code>function counter(){ var n=0; return function(){ n++; return n; } }</code> — كل استدعاء للدالة الداخلية يزيد نفس n.`,
      tip: 'الإغلاقة تمنحك «حالة خاصة» لا يلمسها أحد من الخارج — أساس الأنماط المتقدمة.',
      ex: { html: `<p>افتح وحدة التحكم أسفل الناتج.</p>`, css: '', js: `function counter(){
  var n = 0;
  return function(){ n++; return n; };
}
var c = counter();
console.log(c());
console.log(c());` },
      task: {
        p: 'اكتب <code>counter()</code> تعيد دالة تزيد عداداً داخلياً وتعيد قيمته — اطبع نتائج ثلاثة استدعاءات متتالية (1، 2، 3).',
        checks: [
          { desc: 'الدالة تعيد دالة', kind: 'src', lang: 'js', re: 'return\\s*(function|\\()' },
          { desc: 'متغير داخلي للعداد', kind: 'src', lang: 'js', re: '(var|let|const)\\s+\\w+' },
          { desc: 'المخرجات فيها 3 (ثالث استدعاء)', kind: 'log', contains: '3' },
        ]
      },
      quiz: [
        { q: 'الإغلاقة هي:', o: ['دالة داخلية تتذكر نطاق خارجيتها', 'متغير عام', 'حلقة تكرار'], a: 0 },
        { q: 'المتغير n داخل counter يبقى:', o: ['محفوظاً بين الاستدعاءات', 'يُمحى فوراً', 'عاماً للكل'], a: 0 },
        { q: 'كل استدعاء للدالة الداخلية:', o: ['يزيد نفس العداد', 'يبدأ من صفر', 'ينشئ عداداً جديداً'], a: 0 },
      ]
    },
    {
      id: 'm13', t: 'المؤقتات: setTimeout و setInterval',
      d: `<code>setTimeout(fn, ms)</code> تؤجل التنفيذ مرة واحدة بعد ms ميلي ثانية.
<code>setInterval(fn, ms)</code> تكرره كل ms حتى توقفه بـ <code>clearInterval(id)</code> — الـ id يرجعه setInterval.`,
      tip: 'الميلي ثانية: 1000 = ثانية واحدة. لا تنسَ clearInterval وإلا استمر الأبد.',
      ex: { html: `<p id="t">انتظر…</p>`, css: '', js: `setTimeout(function(){
  document.querySelector('#t').textContent = 'مرت ثانية!';
}, 1000);
var i = 0;
var t = setInterval(function(){
  i++;
  console.log('تيك ' + i);
  if (i >= 3) clearInterval(t);
}, 500);` },
      task: {
        p: 'استعمل <code>setTimeout</code> لطباعة «انتهى الوقت» بعد 100 ميلي ثانية، و<code>setInterval</code> لطباعة عدّاد يتوقف بـ <code>clearInterval</code> بعد 3 تكرارات.',
        checks: [
          { desc: 'استعملت setTimeout', kind: 'src', lang: 'js', contains: 'setTimeout' },
          { desc: 'استعملت setInterval مع clearInterval', kind: 'src', lang: 'js', re: 'setInterval[\\s\\S]*clearInterval' },
          { desc: 'المخرجات فيها «انتهى الوقت»', kind: 'log', contains: 'انتهى الوقت' },
        ]
      },
      quiz: [
        { q: 'setTimeout تُنفذ الدالة:', o: ['مرة واحدة بعد المهلة', 'باستمرار', 'فوراً'], a: 0 },
        { q: 'إيقاف setInterval يكون بـ:', o: ['clearInterval(id)', 'stop(id)', 'break'], a: 0 },
        { q: 'الوسيط الثاني (الزمن) يُقاس بـ:', o: ['الميلي ثانية', 'الثواني', 'الدقائق'], a: 0 },
      ]
    },
  ]
});

/* بطاقات المفاهيم — [سؤال, جواب] لكل درس، تُجدول عبر FSRS في تبويب المراجعة */
const CARDS = {
  h1: [['وسم العنوان الرئيسي', '<h1>…</h1> — أكبر عنوان في الصفحة'], ['الوسم (tag)', 'علامة < > تحيط بالمحتوى وتحدد نوعه']],
  h2: [['مستويات العناوين', 'من h1 الأكبر إلى h6 الأصغر'], ['العناوين الفرعية', 'h2–h6 لتنظيم المحتوى تحت العنوان الرئيسي']],
  h3: [['وسم الرابط', '<a href="url"> — href تحدد الوجهة'], ['وسم الصورة', '<img src="…" alt="…"> — src المصدر وalt النص البديل']],
  h4: [['القائمة المرتبة <ol>', 'عناصرها مرقّمة تلقائياً'], ['<ul> و <li>', 'قائمة بنقاط — كل عنصر داخل li']],
  h6: [['وسم input', 'حقل إدخال — placeholder يعرض نصاً إرشادياً'], ['النموذج form', 'حاوية تجمع حقول الإدخال وزر الإرسال']],
  c1: [['color', 'خاصية تلوّن نص العنصر'], ['background-color', 'خاصية تلوّن الخلفية']],
  c2: [['font-size', 'حجم الخط — مثلاً 24px'], ['font-weight', 'سماكة الخط — bold للعريض']],
  c3: [['padding', 'حشوة داخلية بين المحتوى والإطار'], ['margin', 'هامش خارجي يفصل العنصر عن جيرانه']],
  c4: [['الكلاس class', 'اسم مشترك يُستهدف بـ .name ويطبق على عدة عناصر'], ['المعرف id', 'اسم فريد يُستهدف بـ #id ولا يتكرر']],
  c6: [['display:flex', 'يحوّل الحاوية إلى صندوق مرن يرتّب أبناءه'], ['justify-content', 'توزيع العناصر على المحور الرئيسي — مثل space-between']],
  j1: [['console.log', 'تطبع قيمة في وحدة التحكم للمطور'], ['alert', 'نافذة تنبيه منبثقة']],
  j2: [['let', 'تعريف متغير قابل لإعادة الإسناد'], ['const', 'تعريف ثابت لا يُعاد إسناده']],
  j3: [['function', 'كتلة كود مسماة قابلة لإعادة الاستدعاء'], ['return', 'تُعيد قيمة من الدالة وتنهي تنفيذها']],
  j4: [['if', 'تنفيذ مشروط عند تحقق الشرط'], ['else', 'الفرع البديل عند عدم تحقق الشرط']],
  j5: [['document.querySelector', 'تجلب أول عنصر مطابق لمحدد CSS'], ['textContent', 'تقرأ أو تغيّر نص العنصر']],
  j6: [['onclick', 'خاصية تربط دالة بحدث الضغط'], ['الحدث (event)', 'فعل يحدث في الصفحة: ضغط، كتابة، تحميل…']],
  j7: [['حلقة for', 'تكرار بعدّاد: (بداية؛ شرط؛ زيادة)'], ['i++', 'اختصار زيادة المتغير بمقدار 1']],
  j8: [['المصفوفة', 'قائمة مرتبة من القيم داخل [ ]'], ['push و length', 'push تضيف لآخر المصفوفة، length عدد عناصرها']],
  p1: [['print()', 'دالة الطباعة — تعرض قيماً في المخرجات'], ['التعليق #', 'سطر يتجاهله المفسّر — للشرح']],
  p2: [['المتغير', 'اسم يحفظ قيمة: x = 5'], ['أنواع القيم', 'نص "…"، عدد، قائمة […]']],
  p3: [['input()', 'تقرأ نصاً من المستخدم وتعيده كنص'], ['int()', 'تحوّل النص إلى عدد صحيح']],
  p4: [['if / elif / else', 'فروع شرطية — الشرط يسبق النقطتين'], ['المسافة البادئة', 'تحدد الكتلة التابعة للشرط — إلزامية في بايثون']],
  p5: [['for x in range(n)', 'تكرار بعدّاد من 0 إلى n-1'], ['while', 'تتكرر ما دام الشرط محققاً']],
  p6: [['القائمة list', 'قيم مرتبة داخل [ ]، فهارسها تبدأ من 0'], ['append و len', 'append تضيف لآخر القائمة، len عدد عناصرها']],
  p7: [['def', 'تعريف دالة بمعاملات'], ['return', 'تُعيد قيمة من الدالة']],
  p8: [['f-string', 'نص مسبوق بـ f يدمج {متغيرات}'], ['{expr}', 'داخل f-string تُقيَّم العبارة وتُدرج نتيجتها']],
  m1: [['createElement', 'تنشئ عنصراً جديداً في الذاكرة'], ['appendChild', 'تُلحق عنصراً بآخر كابن أخير']],
  m2: [['addEventListener', 'تربط دالة بحدث على عنصر — تسمح بعدة مستمعين'], ['click', 'حدث الضغط بالفأرة/اللمس']],
  m3: [['تفويض الأحداث', 'مستمع واحد على الأب يلتقط أحداث الأبناء'], ['e.target و dataset', 'target العنصر المضغوط، dataset تقرأ خواص data-*']],
  m4: [['map', 'تحوّل كل عنصر وتُعيد مصفوفة جديدة بنفس الطول'], ['filter', 'تُعيد مصفوفة بالعناصر المطابقة للشرط']],
  m5: [['reduce', 'تجمع المصفوفة لقيمة واحدة بمجمّع وقيمة أولية'], ['find', 'تُعيد أول عنصر يحقق الشرط أو undefined']],
  m6: [['الكائن', 'بنية {مفتاح:قيمة} تجمع خواصاً وأساليب'], ['this', 'داخل الأسلوب تشير للكائن المالك']],
  m7: [['JSON.stringify', 'تحوّل الكائن إلى نص JSON'], ['JSON.parse', 'تحوّل نص JSON إلى كائن']],
  m8: [['fetch', 'تبدأ طلب شبكة وتُعيد Promise'], ['response.json()', 'تحوّل جسم الاستجابة لكائن']],
  m9: [['async', 'تجعل الدالة تعيد Promise وتسمح بـ await'], ['await', 'توقف التنفيذ داخل async حتى يكتمل الوعد']],
  m10: [['Promise.all', 'تنتظر مجموعة وعود وتُعيد مصفوفة نتائجها'], ['الفشل في Promise.all', 'رفض أي وعد يفشل العملية كلها']],
  m11: [['class', 'قالب لإنشاء كائنات بخواص وأساليب مشتركة'], ['extends و super', 'الوراثة من صنف آخر، وsuper يستدعي أسلوب الأب']],
  m12: [['الإغلاقة closure', 'دالة داخلية تتذكر متغيرات خارجيتها بعد انتهائها'], ['فائدتها', 'حالة خاصة محفوظة بين الاستدعاءات بلا متغيرات عامة']],
  m13: [['setTimeout', 'تنفيذ مؤجل مرة واحدة بعد مهلة بالميلي ثانية'], ['setInterval و clearInterval', 'تنفيذ متكرر يُوقف بـ clearInterval(id)']],
};
