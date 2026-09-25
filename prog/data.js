/* برمج — منهج المسارات: HTML / CSS / JavaScript للمبتدئ
   بنية كل درس: {id, t: عنوان, d: شرح (HTML مسموح: <code>), tip: ملاحظة اختيارية,
   ex: {html,css,js} كود البداية للمختبر,
   task: {p: وصف التمرين, start?: {html,css,js} كود بداية التمرين (إن حُذف يُستعمل كود المثال),
          checks:[{desc, kind, ...}]} } */
const TRACKS = [
{
  id: 'html', name: 'أساسيات HTML', desc: 'لغة بناء صفحات الويب: الوسوم، النصوص، الروابط، الصور والقوائم.',
  lessons: [
    {
      id: 'h1', t: 'أول صفحة ويب',
      d: `كل صفحة ويب تُبنى من <code>وسوم</code> (tags) تحيط بالمحتوى.
الوسم يبدأ بـ <code>&lt;اسم&gt;</code> وينتهي بـ <code>&lt;/اسم&gt;</code>.

أهم وسوم البداية:
- <code>&lt;h1&gt;</code> عنوان رئيسي كبير
- <code>&lt;p&gt;</code> فقرة نصية
- <code>&lt;button&gt;</code> زر

جرّب تعديل الكود في المختبر وشاهد الناتج مباشرة.`,
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
      }
    },
    {
      id: 'h2', t: 'العناوين بمستوياتها',
      d: `العناوين لها 6 مستويات: <code>&lt;h1&gt;</code> الأكبر حتى <code>&lt;h6&gt;</code> الأصغر.
استعملها لترتيب محتواك هرمياً كالفصول والعناوين الفرعية.`,
      ex: { html: `<h1>عنوان رئيسي</h1>
<h2>عنوان فرعي</h2>
<h3>عنوان أصغر</h3>
<p>نص عادي للمقارنة.</p>`, css: '', js: '' },
      task: {
        p: 'اكتب عنواناً رئيسياً <code>&lt;h1&gt;</code>، وتحته عنواناً فرعياً <code>&lt;h2&gt;</code>، وتحته فقرة <code>&lt;p&gt;</code>.',
        checks: [
          { desc: 'يوجد h1 واحد على الأقل', kind: 'exists', sel: 'h1' },
          { desc: 'يوجد h2 واحد على الأقل', kind: 'exists', sel: 'h2' },
          { desc: 'توجد فقرة p', kind: 'exists', sel: 'p' },
        ]
      }
    },
    {
      id: 'h3', t: 'الروابط والصور',
      d: `الرابط: <code>&lt;a href="عنوان"&gt;نص الرابط&lt;/a&gt;</code>
الصورة: <code>&lt;img src="رابط الصورة" alt="وصف"&gt;</code> — وسم ذاتي الإغلاق (بلا وسم ختامي).
الصفة <code>alt</code> مهمة للوصول ولوصف الصورة عند تعذر تحميلها.`,
      ex: { html: `<h1>روابطي المفضلة</h1>
<a href="https://www.wikipedia.org">ويكيبيديا</a>
<p>صورة رمزية:</p>
<img src="https://via.placeholder.com/150" alt="مثال">`, css: '', js: '' },
      task: {
        p: 'أضِف رابطاً إلى <code>https://example.com</code> بنص «مثال»، وصورة أيّاً كان مصدرها مع صفة <code>alt</code>.',
        checks: [
          { desc: 'يوجد رابط a إلى example.com', kind: 'attr', sel: 'a', attr: 'href', val: 'https://example.com' },
          { desc: 'يوجد رابط نصه «مثال»', kind: 'text', sel: 'a', contains: 'مثال' },
          { desc: 'توجد صورة img لها صفة alt', kind: 'attr', sel: 'img', attr: 'alt' },
        ]
      }
    },
    {
      id: 'h4', t: 'القوائم المرتبة وغير المرتبة',
      d: `قائمة غير مرتبة (نقاط): <code>&lt;ul&gt;</code> وكل عنصر داخلها <code>&lt;li&gt;</code>
قائمة مرتبة (أرقام): <code>&lt;ol&gt;</code> وعناصرها أيضاً <code>&lt;li&gt;</code>`,
      ex: { html: `<h2>فواكهي المفضلة</h2>
<ul>
  <li>تفاح</li>
  <li>موز</li>
</ul>
<h2>خطوات الوضوء</h2>
<ol>
  <li>النية</li>
  <li>غسل الوجه</li>
</ol>`, css: '', js: '' },
      task: {
        p: 'أنشئ قائمة غير مرتبة <code>&lt;ul&gt;</code> فيها 3 عناصر على الأقل، وقائمة مرتبة <code>&lt;ol&gt;</code> فيها عنصران على الأقل.',
        checks: [
          { desc: 'توجد ul فيها 3 عناصر li على الأقل', kind: 'count', sel: 'ul li', n: 3 },
          { desc: 'توجد ol فيها عنصران على الأقل', kind: 'count', sel: 'ol li', n: 2 },
        ]
      }
    },
    {
      id: 'h5', t: 'الحاويات div و class',
      d: `<code>&lt;div&gt;</code> صندوق عام يلفّ عناصر معاً لتنسيقها أو تنظيمها.
الصفة <code>class="اسم"</code> تعطي العنصر «اسم تصنيف» تستهدفه لاحقاً بـ CSS.`,
      ex: { html: `<div class="card">
  <h2>بطاقة تعريف</h2>
  <p>محتوى داخل الصندوق.</p>
</div>`, css: `.card { border: 2px solid navy; padding: 10px; }`, js: '' },
      task: {
        p: 'أنشئ <code>&lt;div&gt;</code> بكلاس <code>box</code> بداخله عنوان <code>&lt;h2&gt;</code>.',
        checks: [
          { desc: 'يوجد div بكلاس box', kind: 'exists', sel: 'div.box' },
          { desc: 'داخل div.box عنوان h2', kind: 'exists', sel: 'div.box h2' },
        ]
      }
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
      }
    },
  ]
},
{
  id: 'css', name: 'أساسيات CSS', desc: 'لغة تنسيق الصفحات: الألوان، الخطوط، الصناديق، والتخطيط بـ Flexbox.',
  lessons: [
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
      }
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
      }
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
      }
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
      }
    },
    {
      id: 'c5', t: 'تنسيق الأزرار',
      d: `الأزرار الجميلة تحتاج: <code>background</code> لون، <code>color</code> نص، <code>border-radius</code> استدارة الزوايا، <code>padding</code> حشوة، وإزالة الإطار بـ <code>border: none</code>.`,
      ex: { html: `<button class="btn">اضغط هنا</button>`,
        css: `.btn {
  background: linear-gradient(90deg, #c9a24b, #e8c97a);
  color: #0b0f14;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 16px;
}`, js: '' },
      task: {
        p: 'نسّق زراً بكلاس <code>nice</code>: خلفية <code>teal</code>، نص أبيض، <code>border-radius: 8px</code>.',
        start: { html: `<button class="nice">زر جميل</button>`, css: '', js: '' },
        checks: [
          { desc: 'يوجد زر بكلاس nice', kind: 'exists', sel: 'button.nice' },
          { desc: 'خلفية الزر teal', kind: 'css', sel: '.nice', prop: 'background-color', val: 'teal' },
          { desc: 'لون نص الزر أبيض', kind: 'css', sel: '.nice', prop: 'color', val: 'white' },
          { desc: 'استدارة الزوايا = 8px', kind: 'css', sel: '.nice', prop: 'border-top-left-radius', val: '8px' },
        ]
      }
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
      }
    },
  ]
},
{
  id: 'js', name: 'أساسيات JavaScript', desc: 'لغة التفاعل: المتغيرات، الدوال، الشروط، والتحكم بالصفحة.',
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
      }
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
      }
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
      }
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
      }
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
      }
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
        p: 'اربط الزر <code>#go</code> بحيث يكتب في <code>#res</code> النص «يعمل!» عند الضغط عليه، ثم اضغطه برمجياً لاختباره.',
        start: { html: `<button id="go">جرّب</button>
<p id="res"></p>`, css: '', js: '' },
        checks: [
          { desc: 'نص #res يصبح «يعمل!» بعد الضغط', kind: 'js', expr: '(function(){document.querySelector("#go").click();return document.querySelector("#res").textContent.indexOf("يعمل!")>=0})()' },
        ]
      }
    },
  ]
},
];
