# تقرير الزحف الشامل ٣ — كل صفحات المنظومة (موجة-14)

**الزاحف**: `tools/crawl.ts /tmp/urls3b.txt reports/crawl3.json` — Deno+CDP headless Chromium، جوال 360×900.
**النطاق**: 94 صفحة (كل index.html + .html مستقلة على main، باستثناء wahy/data).
**الفحوصات**: أخطاء JS/استثناءات · موارد مكسورة · فيض 360px · البحث يرد · روابط داخلية HEAD.

**الحصيلة**: 41 سليمة كلياً · **23 صفحة بعلة `##` المنهجية** · 20 صفحة فيض أفقي · 10 صفحات نشر معلّق (404 وقت الزحف).

## P1 — أخطاء JS

### العلة المنهجية `##x` — 23 صفحة (علة نسخ مشتركة)
`const $=q=>document.querySelector('#'+q)` والمُستدعي يمرّر `$('#id')` → `'##id'` → **SyntaxError يقتل كل تشغيل DOM لاحق في الصفحة**. إثبات: ijaza/:48 التعريف، :59 `$('#list')`.
المتأثرة: `hadith/tabaqat · ijaza · jawhar · madhahib · majlis · mi3yar · midad · midrak · mihbar · minar · minha · mirjan · mirsad · misbah · mishwar · mizan · munshur · muqfil · muwazan · naql · nusus · sibaq · sirat`
**الإصلاح**: إمّا إزالة `#` من المُستدعي أو تغيير المساعد إلى `q=>document.querySelector(q)` — إصلاح واحد في المقطع المنسوخ يشفي 23 صفحة.

### أخطاء JS أخرى
| الصفحة | الاستثناء |
|---|---|
| ma3raj, minhaj | `ReferenceError: $ is not defined` — المساعد غير معرّف أصلاً |
| hadith/adhkar, lohah, sawanih | `ReferenceError: ADHKAR is not defined` — **ما زال** (يُقال صُلّح لكنه حيّ الآن) |
| hadith/matn | `TypeError: h.sc.map is not a function` — ما زال (البحث يعمل: 52 نتيجة) |
| mutabi3 | `TypeError: Object.keys(null)` — `G()` يعيد null لمفتاح غائب ثم `Object.keys(null)` — خطر على أي مستخدم جديد بلا بيانات |
| wahy/kalimat | `TypeError: (s‖"").replace is not a function` في norm() |

## P2 — فيض أفقي عند 360px (20 صفحة)
| الصفحة | الفيض |
|---|---|
| masrood | +46px |
| madhahib | +20px |
| midrak | +20px |
| mu3jam | +20px |
| muwazan | +20px |
| shabaka | +20px |
| sibaq | +20px |
| ijaza | +18px |
| musajjil | +18px |
| nusus | +18px |
| akida-masadir | +16px |
| hadith-rawi | +16px |
| hadith-tabaqat | +16px |
| hadith-tathabbut | +16px |
| kharita | +16px |
| munshur | +16px |
| majlis | +14px |
| hadith-muqaran | +13px |
| hadith-sanad | +13px |
| minbar | +8px |
أكبرها masrood +46px (عنصر `width:700` ثابت مؤكد في المصدر). بقيتها 8–20px — غالباً شريط حروف/إحصاءات لا يلتف، نفس نمط دفعة الليلة.

## P3 — نشر معلّق + شكلي
- **صفحات 404 (ركود نشر)**: buraq · daftar · english/library · english/listen · english/srs · hadith/ahkam · hadith/matla3 · hadith/misbar · hadith/naskh — موجودة على main لكن Pages لم تصل إليها بعد وقت الزحف.
- **fiqh_reader/masail.html: غير موجودة على main إطلاقاً** (يوجد masail.js بيانات فقط) — pending دفع.
- favicon.ico 404 تجميلي عام.

## جدول كل الصفحات
| الصفحة | روابط✗ | JS | فيض360 | بحث | الحكم |
|---|---|---|---|---|---|
| akida | ✅ | ✅ | ✅ | فهرس—التوحيد→35 ✓(تحقق يدوي) | سليم |
| akida-masadir | — | ✅ | +16px | — | P2 |
| akida-real | ✅ | ✅ | ✅ | ✓13 | سليم |
| buraq | — | — | — | — | ⏳ نشر معلّق |
| daftar | — | — | — | — | ⏳ نشر معلّق |
| durus | ✅ | ✅ | ✅ | ✓65 | سليم |
| english | ✅ | ✅ | ✅ | — | سليم |
| english-library | — | — | — | — | ⏳ نشر معلّق |
| english-listen | — | — | — | — | ⏳ نشر معلّق |
| english-routine | ✅ | ✅ | ✅ | — | سليم |
| english-srs | — | — | — | — | ⏳ نشر معلّق |
| fihris | ✅ | ✅ | ✅ | ✓84 | سليم |
| fiqh | — | ✅ | ✅ | ✓5 | سليم |
| fiqh-masail | — | — | — | — | ⏳ نشر معلّق |
| fiqh_reader | — | ✅ | ✅ | ✓55 | سليم |
| hadith | ✅ | ✅ | ✅ | ✓2 | سليم |
| hadith-adhkar | — | ADHKAR | ✅ | — | P1 |
| hadith-ahkam | — | — | — | — | ⏳ نشر معلّق |
| hadith-matla3 | — | — | — | — | ⏳ نشر معلّق |
| hadith-matn | — | TypeError | ✅ | — | P1 |
| hadith-misbar | — | — | — | — | ⏳ نشر معلّق |
| hadith-muqaran | — | ✅ | +13px | — | P2 |
| hadith-naskh | — | — | — | — | ⏳ نشر معلّق |
| hadith-nawawi | ✅ | ✅ | ✅ | — | سليم |
| hadith-net | ✅ | ✅ | ✅ | ✓33 | سليم |
| hadith-rawi | ✅ | ✅ | +16px | — | P2 |
| hadith-sanad | — | ✅ | +13px | — | P2 |
| hadith-silsila | ✅ | ✅ | ✅ | ✓1 | سليم |
| hadith-tabaqat | — | ##x | +16px | — | P1 |
| hadith-tartil | ✅ | ✅ | ✅ | — | سليم |
| hadith-tathabbut | — | ✅ | +16px | — | P2 |
| hadith-topic | ✅ | ✅ | ✅ | ✓60 | سليم |
| ijaza | — | ##x | +18px | — | P1 |
| ikhtibirni | — | ✅ | ✅ | — | سليم |
| iqraa | — | ✅ | ✅ | — | سليم |
| jawhar | — | ##x | ✅ | — | P1 |
| kharita | ✅ | ✅ | +16px | — | P2 |
| live | — | ✅ | ✅ | — | سليم |
| lohah | ✅ | ADHKAR | ✅ | — | P1 |
| ma3raj | ✅ | $? | ✅ | — | P1 |
| madhahib | — | ##x | +20px | — | P1 |
| madrasati | ✅ | ✅ | ✅ | — | سليم |
| majlis | — | ##x | +14px | — | P1 |
| maktabati | ✅ | ✅ | ✅ | — | سليم |
| manzuma | ✅ | ✅ | ✅ | — | سليم |
| masrood | — | ✅ | +46px | — | P2 |
| mi3yar | — | ##x | ✅ | — | P1 |
| midad | — | ##x | ✅ | — | P1 |
| midrak | — | ##x | +20px | — | P1 |
| mihbar | — | ##x | ✅ | — | P1 |
| minar | — | ##x | ✅ | — | P1 |
| minbar | — | ✅ | +8px | ✓1 | P2 |
| minha | — | ##x | ✅ | — | P1 |
| minhaj | — | $? | ✅ | — | P1 |
| miqraa | — | ✅ | ✅ | ✓1 | سليم |
| mirjan | — | ##x | ✅ | — | P1 |
| mirsad | — | ##x | ✅ | — | P1 |
| misbah | — | ##x | ✅ | — | P1 |
| mishwar | — | ##x | ✅ | — | P1 |
| mizan | — | ##x | ✅ | — | P1 |
| mu3edd | — | ✅ | ✅ | — | سليم |
| mu3jam | — | ✅ | +20px | — | P2 |
| mukhatat | ✅ | ✅ | ✅ | — | سليم |
| mulammi3 | — | ✅ | ✅ | — | سليم |
| munshur | — | ##x | +16px | — | P1 |
| muqfil | — | ##x | ✅ | — | P1 |
| muqtatif | — | ✅ | ✅ | — | سليم |
| musajjil | — | ✅ | +18px | — | P2 |
| mutabi3 | — | TypeError | ✅ | — | P1 |
| muwazan | — | ##x | +20px | — | P1 |
| naql | — | ##x | ✅ | eval fail | P1 |
| nusus | — | ##x | +18px | — | P1 |
| portal | ✅ | ✅ | ✅ | ✓5 | سليم |
| prog | — | ✅ | ✅ | — | سليم |
| prog-exam | ✅ | ✅ | ✅ | — | سليم |
| prog-paths | ✅ | ✅ | ✅ | — | سليم |
| prog-proj | ✅ | ✅ | ✅ | — | سليم |
| prog-review | ✅ | ✅ | ✅ | — | سليم |
| prog-today | ✅ | ✅ | ✅ | — | سليم |
| root | 1 | ✅ | ✅ | — | سليم |
| sawanih | — | ADHKAR | ✅ | — | P1 |
| shabaka | — | ✅ | +20px | ✓57 | P2 |
| sibaq | ✅ | ##x | +20px | ✓1 | P1 |
| sirat | — | ##x | ✅ | — | P1 |
| team | — | ✅ | ✅ | — | سليم |
| team-amjad | ✅ | ✅ | ✅ | — | سليم |
| team-amjad-fikra | ✅ | ✅ | ✅ | — | سليم |
| wahy | ✅ | ✅ | ✅ | ✓8 | سليم |
| wahy-kalimat | ✅ | ✅ | ✅ | ✓1 | سليم |
| wahy-mishkat | ✅ | ✅ | ✅ | — | سليم |
| wahy-muqaran_tafsir | ✅ | ✅ | ✅ | — | سليم |
| wahy-mutashabih | ✅ | ✅ | ✅ | — | سليم |
| wasl | ✅ | ✅ | ✅ | — | سليم |
| zad | ✅ | ✅ | ✅ | — | سليم |

## الخام
`reports/crawl3.json` — 94 سجلاً كاملة.
