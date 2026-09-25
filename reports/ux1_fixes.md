# ux1_fixes — أهم 5 نتائج وحلولها المطبّقة

## 1) miqraa: فشل تحميل البيانات (مُصلّح ✅)
- **العلة**: `s.v.toLocaleString` بينما `wahy/data/index.json` يزوّد `s.ayahs` → `undefined.toLocaleString` TypeError → «تعذّر تحميل البيانات».
- **التصحيح**: `s.v` → `s.ayahs` في `miqraa/index.html:58` — مطبّق على هذا الفرع.
- **تأكيد**: كل الصفحات الأخوة (lohah/majlis/mihbar/miraj3a/mu3edd) تستخدم `s.ayahs` الصحيح — miqraa الوحيدة المخالفة.

## 2) علة `##` على 40 صفحة حيّة (مُصلّحة على main — تنتظر النشر)
- **العلة**: `const $=q=>document.querySelector('#'+q)` مع استدعاءات `$('#x')` → `querySelector('##x')` SyntaxError.
- **التصحيح**: `q[0]==='#'?q:'#'+q` — موجود الآن على main في كل الصفحات التي فحصتها (23 المذكورة + 17 أخرى تحققتها بنفسي: kutub, ma3raj, midhallah, mighzal, mikyal, minjal, minhaj, mishhad + daftar, hibr, mihrab, miraj3a, sawanih, silsila, warid, hadith/matla3).
- **الإجراء المطلوب**: ليس كوداً — إكمال بناء Pages واحد بنجاح يشفي الـ40 دفعة.

## 3) mutabi3: TypeError في Object.keys (مُصلّح على main)
- `G=(k,d)=>{...JSON.parse(...)??d}` — الـ `??d` وُجد على main الآن (أصلحه فريق آخر بعد فحصي).

## 4) 20+ صفحة pending-deploy (404 حياً)
- ليست علة كود — صفحات على main لم تلحقها Builds المتقافزة. تُشفى تلقائياً عند أول بناء ناجح.

## 5) روابط الرجوع إلى الجذر + favicon (شكلي)
- «الرابط المكسور» الظاهر في crawl4 على الصفحات pending كان artefact لصفحات خطأ كروم — لا روابط ميتة حقيقية سوى fihris→masail.html (pending، تُشفى بالنشر).
- favicon.ico 404 عام — اختياري: `<link rel="icon" href="data:,">` لإسكاته.

**الخلاصة**: التصحيح الوحيد المطلوب فعلاً وتطبيقه: miqraa `s.ayahs` (في هذا الفرع). الباقي إما مُصلّح على main أو يحلّه النشر.
