# تقرير الزحف الرابع (crawl4) — wave-16

الزاحف: `tools/crawl.ts` (CDP، عرض 360px) · التاريخ: 2026-09-25 · 57 صفحة مُعاد فحصها + صفحات جديدة.

## الخلاصة

- **إصلاحات `##` مؤكدة على `main` (31 صفحة) لكنها غير منشورة**: الموقع الحي ما زال يقدّم النسخة القديمة — بناء Pages متعثر (`errored` متتالية أثناء عاصفة الدفعات، آخرها `building` 03:46). عند اكتمال النشر تختفي الأخطاء تلقائياً.
- **9 صفحات مكسورة على `main` نفسه** (لم تدخل الإصلاح): 8 بخطأ `##` + mutabi3 بخطأ `TypeError`.
- **20 صفحة جديدة `pending-deploy`**: موجودة على main وترجع 404 حياً.
- **الفيض الأفقي: صفر** — كل الصفحات المنشورة 360px سليمة.

## P1 — إصلاحات `##` على main غير منشورة (تحقق wave-16)

الـ23 المذكورة كلها `FIXED` على main (`$=q=>document.querySelector(q[0]==='#'?q:'#'+q)` يقبل النمطين) — لكن الحي ما زال `##` SyntaxError. **الحالة: الإصلاح صحيح، النشر معلّق.**

| الصفحة | خطأ JS | روابط مكسورة | فيض px | بحث |
|---|---|---|---|---|
| hadith-tabaqat | Uncaught SyntaxError | 0 | 0 | 0 |
| ijaza | Uncaught SyntaxError | 0 | 0 | 0 |
| jawhar | Uncaught SyntaxError | 0 | 0 | — |
| madhahib | Uncaught SyntaxError | 0 | 0 | 0 |
| majlis | Uncaught SyntaxError | 0 | 0 | 0 |
| mi3yar | Uncaught SyntaxError | 0 | 0 | — |
| midad | Uncaught SyntaxError | 0 | 0 | — |
| midrak | Uncaught SyntaxError | 0 | 0 | — |
| mihbar | Uncaught SyntaxError | 0 | 0 | 0 |
| minar | Uncaught SyntaxError | 0 | 0 | — |
| minha | Uncaught SyntaxError | 0 | 0 | — |
| mirjan | Uncaught SyntaxError | 0 | 0 | — |
| mirsad | Uncaught SyntaxError | 0 | 0 | — |
| misbah | Uncaught SyntaxError | 0 | 0 | — |
| mishwar | Uncaught SyntaxError | 0 | 0 | — |
| mizan | Uncaught (in promise) SyntaxError | 0 | 0 | — |
| munshur | Uncaught SyntaxError | 0 | 0 | 0 |
| muqfil | Uncaught SyntaxError | 0 | 0 | — |
| muwazan | Uncaught SyntaxError;Uncaught SyntaxError | 0 | 0 | 0 |
| naql | Uncaught SyntaxError | 0 | 0 | — |
| nusus | Uncaught SyntaxError | 0 | 0 | 0 |
| sibaq | Uncaught SyntaxError | 0 | 0 | 1 |
| sirat | Uncaught SyntaxError | 0 | 0 | — |


إضافة للـ23، اتضح أن 8 صفحات أخرى أُصلحت أيضاً على main (لم تُذكر): mishhad, mikyal, midhallah, minjal, mighzal, kutub, ma3raj, minhaj — نفس حالة الانتظار.

## P1 — صفحات ما زالت مكسورة على `main` نفسه

`$=q=>document.querySelector('#'+q)` القديم ما زال في المصدر (أو خطأ آخر) — تحتاج الإصلاح نفسه:

| الصفحة | خطأ JS | روابط مكسورة | فيض px | بحث |
|---|---|---|---|---|
| daftar | Uncaught SyntaxError | 0 | 0 | 0 |
| hibr | Uncaught SyntaxError | 0 | 0 | — |
| mihrab | Uncaught SyntaxError | 0 | 0 | — |
| miraj3a | Uncaught (in promise) SyntaxError | 0 | 0 | — |
| mutabi3 | Uncaught TypeError | 0 | 0 | — |
| sawanih | Uncaught SyntaxError | 0 | 0 | — |
| silsila | Uncaught SyntaxError | 0 | 0 | 0 |
| warid | Uncaught SyntaxError | 0 | 0 | — |
| hadith-matla3 | Uncaught SyntaxError;Uncaught SyntaxError | 0 | 0 | 0 |


ملاحظة mutabi3: `TypeError: Cannot convert undefined or null to object` في `Object.keys` — خطأ مختلف (G() ترجع null من localStorage).


## P2 — صفحات جديدة غير منشورة (pending-deploy)

ترجع 404 حياً وهي على main: mustamli, minhal, mukhtalif, mijtaz, mustafa, musnad, mirthad, mihrak, muallim, misraj, diwan, minsha, mirtaqa, mijass, mizkata, mudarrib, english-story, fiqh_reader-masail, hadith-ilal, prog-map.


## P2 — روابط الجذر المكسورة
الصفحات الجديدة تحوي رابط رجوع `../../` إلى `medmrf-10.github.io/` (خارج /des/) → 404 على كل صفحة منشورة حديثاً.


## P3 — شكلي
`favicon.ico` → 404 عام.


## الجدول الكامل (57 صفحة)

| الصفحة | خطأ JS | روابط مكسورة | فيض px | بحث |
|---|---|---|---|---|
| hadith-tabaqat | Uncaught SyntaxError | 0 | 0 | 0 |
| ijaza | Uncaught SyntaxError | 0 | 0 | 0 |
| jawhar | Uncaught SyntaxError | 0 | 0 | — |
| madhahib | Uncaught SyntaxError | 0 | 0 | 0 |
| majlis | Uncaught SyntaxError | 0 | 0 | 0 |
| mi3yar | Uncaught SyntaxError | 0 | 0 | — |
| midad | Uncaught SyntaxError | 0 | 0 | — |
| midrak | Uncaught SyntaxError | 0 | 0 | — |
| mihbar | Uncaught SyntaxError | 0 | 0 | 0 |
| minar | Uncaught SyntaxError | 0 | 0 | — |
| minha | Uncaught SyntaxError | 0 | 0 | — |
| mirjan | Uncaught SyntaxError | 0 | 0 | — |
| mirsad | Uncaught SyntaxError | 0 | 0 | — |
| misbah | Uncaught SyntaxError | 0 | 0 | — |
| mishwar | Uncaught SyntaxError | 0 | 0 | — |
| mizan | Uncaught (in promise) SyntaxError | 0 | 0 | — |
| munshur | Uncaught SyntaxError | 0 | 0 | 0 |
| muqfil | Uncaught SyntaxError | 0 | 0 | — |
| muwazan | Uncaught SyntaxError;Uncaught SyntaxError | 0 | 0 | 0 |
| naql | Uncaught SyntaxError | 0 | 0 | — |
| nusus | Uncaught SyntaxError | 0 | 0 | 0 |
| sibaq | Uncaught SyntaxError | 0 | 0 | 1 |
| sirat | Uncaught SyntaxError | 0 | 0 | — |
| mustamli | `pending` غير منشورة (404) | — | — | — |
| minhal | `pending` غير منشورة (404) | — | — | — |
| mukhtalif | `pending` غير منشورة (404) | — | — | — |
| mijtaz | `pending` غير منشورة (404) | — | — | — |
| mustafa | `pending` غير منشورة (404) | — | — | — |
| musnad | `pending` غير منشورة (404) | — | — | — |
| mishhad | Uncaught SyntaxError | 0 | 0 | 0 |
| mikyal | Uncaught SyntaxError | 0 | 0 | — |
| midhallah | Uncaught SyntaxError | 0 | 0 | — |
| minjal | Uncaught SyntaxError | 0 | 0 | — |
| mighzal | Uncaught SyntaxError | 0 | 0 | — |
| mirthad | `pending` غير منشورة (404) | — | — | — |
| mihrak | `pending` غير منشورة (404) | — | — | — |
| muallim | `pending` غير منشورة (404) | — | — | — |
| misraj | `pending` غير منشورة (404) | — | — | — |
| diwan | `pending` غير منشورة (404) | — | — | — |
| minsha | `pending` غير منشورة (404) | — | — | — |
| mirtaqa | `pending` غير منشورة (404) | — | — | — |
| mijass | `pending` غير منشورة (404) | — | — | — |
| mizkata | `pending` غير منشورة (404) | — | — | — |
| mudarrib | `pending` غير منشورة (404) | — | — | — |
| daftar | Uncaught SyntaxError | 0 | 0 | 0 |
| hibr | Uncaught SyntaxError | 0 | 0 | — |
| mihrab | Uncaught SyntaxError | 0 | 0 | — |
| miraj3a | Uncaught (in promise) SyntaxError | 0 | 0 | — |
| mutabi3 | Uncaught TypeError | 0 | 0 | — |
| sawanih | Uncaught SyntaxError | 0 | 0 | — |
| silsila | Uncaught SyntaxError | 0 | 0 | 0 |
| warid | Uncaught SyntaxError | 0 | 0 | — |
| hadith-matla3 | Uncaught SyntaxError;Uncaught SyntaxError | 0 | 0 | 0 |
| english-story | `pending` غير منشورة (404) | — | — | — |
| fiqh_reader-masail | `pending` غير منشورة (404) | — | — | — |
| hadith-ilal | `pending` غير منشورة (404) | — | — | — |
| prog-map | `pending` غير منشورة (404) | — | — | — |
