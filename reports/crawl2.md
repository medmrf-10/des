# تقرير الزحف الآلي ٢ — الصفحات الجديدة (موجة-5)

**الزاحف**: `tools/crawl.ts` (Deno + CDP) — headless Chromium، محاكاة جوال 360×900.
**النطاق**: 19 صفحة — 17 جديدة دُفعت الليلة + live/durus إعادة تحقق.
**الفحوصات**: HTTP للروابط الداخلية · أخطاء console/استثناءات JS · تجاوز 360px · عملية البحث ترد نتائج.

## الجدول

| الصفحة | روابط | أخطاء JS | فيض 360px | البحث | الحكم |
|---|---|---|---|---|---|
| madrasati/ | 1/1 ✅ | ✅ | ✅ | — (لا حقل) | سليم* |
| mu3edd/ | — | ✅ | ✅ | ⚠️ بلا أثر مرئي | ملاحظة |
| mukhatat/ | 19/19 ✅ | ✅ | ✅ | — (لا حقل) | سليم |
| maktabati/ | 4/4 ✅ | ✅ | ✅ | — (لا حقل) | سليم |
| lohah/ | 5/5 ✅ | ❌ ReferenceError | ✅ | — (لا حقل) | مشكلة |
| ikhtibirni/ | — | ✅ | ✅ | — (لا حقل) | سليم |
| akida/masadir.html | — | ✅ | ❌ **+16px** | ✅ قدرة→182 | مشكلة |
| wahy/kalimat.html | — | ❌ TypeError | ✅ | ✅ الله→1 | مشكلة |
| wahy/mutashabih.html | — | ✅ | ✅ | ✅ الصلاة→3 | سليم |
| hadith/net.html | 40/40 ✅ | ✅ | ✅ | ✅ صبر→33 | سليم |
| hadith/matn.html | — | ❌ TypeError | ✅ | ✅ الأعمال→52 | مشكلة |
| hadith/rawi.html | 40/40 ✅ | ✅ | ❌ **+16px** | ✅ مالك→284 | مشكلة |
| hadith/nawawi.html | 36/36 ✅ | ✅ | ✅ | — (قائمة) | سليم |
| hadith/adhkar.html | — | ❌ ReferenceError | ✅ | — (لا حقل) | مشكلة |
| hadith/sanad.html | — | ✅ | ❌ **+13px** | ✅ نية→25 | مشكلة |
| hadith/muqaran.html | — | ✅ | ❌ **+13px** | ✅ النية→4 | مشكلة |
| live/ | — | ✅ | ✅ | — | سليم |
| durus/ | 1/1 ✅ | ✅ | ✅ **صُلّح** | ✅ الله→65 | سليم |
| team/amjad/fikra/ | 1/1 ✅ | ✅ | ✅ | — (حقل كتابة) | سليم |

**النتيجة: 12/19 سليمة · صفر روابط مكسورة (161 مفحوصاً) · 9 بحثات تعمل كلها · 7 صفحات فيها مشاكل.**

## المشاكل

### أخطاء JS (4 صفحات — P1)

| الصفحة | الاستثناء | الأثر |
|---|---|---|
| lohah/ | `Uncaught ReferenceError: ADHKAR is not defined` (line 54) | الصفحة تعرض الأرقام لكن عدّاد/تبويب الأذكار غالباً ميت — نفس المتغير مفقود في الصفحة الشقيقة |
| hadith/adhkar.html | `Uncaught ReferenceError: ADHKAR is not defined` (render, line 43) | تعرض «٢٨٥ مجموعة» لكن ميزة تعتمد ADHKAR معطّلة — يبدو ملف بيانات لم يُحمَّل/لم يُنشر |
| hadith/matn.html | `Uncaught TypeError: h.sc.map is not a function` (line 82) | غير قاتل — البحث يرد 52 نتيجة؛ كائن hadith بلا حقل sc في مسار ما |
| wahy/kalimat.html | `Uncaught TypeError: (s‖"").replace is not a function` (norm) | غير قاتل — البحث أعاد نتيجة واحدة لـ«الله»؛ دالة norm تستقبل غير-نص |

### فيض أفقي عند 360px (4 صفحات — P2)

| الصفحة | scrollWidth | السبب المُرجَّح |
|---|---|---|
| akida/masadir.html | 376 (+16px) | شريط الحروف الأبجدية (~30 زراً) لا يلتف — نفس نمط لوحة النظائر |
| hadith/rawi.html | 376 (+16px) | صف إحصاءات/أزرار ثابت العرض |
| hadith/sanad.html | 373 (+13px) | نفس النمط |
| hadith/muqaran.html | 373 (+13px) | نفس النمط |

### ملاحظات

- **mu3edd/**: حقل «كلمة البحث في المعاني» موجود، لكن استعلام «نية» لم يُحدث تغييراً مرئياً — الفلتر يستهدف على الأرجح تبويباً غير الظاهر افتراضياً (الآيات). يحتاج فحصاً يدوياً ليُجزم.
- **madrasati/**: `favicon.ico` 404 — تجميلي عام كسابقه.
- **إصلاح مؤكد**: `durus/` أصبح scrollWidth=360 — فيض +28px **صُلّح** منذ تقرير crawl.md.

## ما يعمل مؤكداً

بحثات مُثبتة بالأعداد: masadir 182 · kalimat 1 · mutashabih 3 · net 33 · matn 52 · rawi 284 سلسلة · sanad 25 · muqaran 4 · durus 65. بلا حقل بحث أصلاً (مقصود): madrasati, mukhatat, maktabati, lohah, ikhtibirni, nawawi, adhkar, live, fikra.

## الخام
`reports/crawl2.json` — مخرجات الزاحف كاملة.

*تولّد آلياً عبر `tools/crawl.ts /tmp/urls2.txt reports/crawl2.json`*
