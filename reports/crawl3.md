# تقرير الزحف الشامل الثالث (crawl3) — 116 صفحة

الزاحف: `tools/crawl.ts` (CDP، عرض 360px) · التاريخ: 2026-09-25 · كل index.html/صفحات .html على main (ما عدا wahy/data, index_v2, test, sw, 404).

## الخلاصة

- **أخطاء JS: 40 صفحة** — غالبيتها خطأ `##` المنهجي (إصلاحه على main ينتظر النشر)؛ التفاصيل في crawl4.md.
- **الفيض الأفقي: 0** — كل أقفال overflow-x نجحت.
- **روابط مكسورة: 10 صفحة** — معظمها رابط الجذر `medmrf-10.github.io/` (خارج /des/) + fiqh_reader/masail.html (pending).
- **pending-deploy: 9** — 404 حياً (دُفعت حديثاً).
- **سليمة كلياً: 57** صفحة.

## P1 — أخطاء JS

daftar; hadith-matla3; hadith-tabaqat; hibr; ijaza; jawhar; kutub; ma3raj; madhahib; majlis; mi3yar; midad; midhallah; midrak; mighzal; mihbar; mihrab; mikyal; minar; minha; minhaj; minjal; miraj3a; mirjan; mirsad; misbah; mishhad; mishwar; mizan; munshur; muqfil; mutabi3; muwazan; naql; nusus; sawanih; sibaq; silsila; sirat; warid


## P2 — روابط مكسورة

- diwan: 404 https://medmrf-10.github.io/
- fihris: 404 https://medmrf-10.github.io/des/fiqh_reader/masail.html
- root: 404 https://medmrf-10.github.io/
- mihrak: 404 https://medmrf-10.github.io/
- minsha: 404 https://medmrf-10.github.io/
- mirtaqa: 404 https://medmrf-10.github.io/
- mirthad: 404 https://medmrf-10.github.io/
- misraj: 404 https://medmrf-10.github.io/
- muallim: 404 https://medmrf-10.github.io/
- mufassir: 404 https://medmrf-10.github.io/

## P2 — pending-deploy
diwan, mihrak, minsha, mirtaqa, mirthad, misraj, muallim, mufassir, root


## P3 — شكلي
favicon.ico 404 عام.

## الجدول الكامل

| الصفحة | خطأ JS | روابط مكسورة | فيض px | بحث |
|---|---|---|---|---|
| akida | — | 0 | 0 | 0 |
| akida-masadir | — | 0 | 0 | 0 |
| akida-real | — | 0 | 0 | 13 |
| buraq | — | 0 | 0 | 0 |
| daftar | Uncaught SyntaxError | 0 | 0 | 0 |
| diwan | `pending` غير منشورة (404) | — | — | — |
| durus | — | 0 | 0 | 65 |
| english | — | 0 | 0 | — |
| english-library | — | 0 | 0 | — |
| english-listen | — | 0 | 0 | — |
| english-mimic | — | 0 | 0 | — |
| english-routine | — | 0 | 0 | — |
| english-srs | — | 0 | 0 | — |
| fihris | — | 1×404 io/des/fiqh_reader/masail.html | 0 | 87 |
| fiqh | — | 0 | 0 | 5 |
| fiqh_reader | — | 0 | 0 | 55 |
| hadith-adhkar | — | 0 | 0 | — |
| hadith-ahkam | — | 0 | 0 | — |
| hadith-alaam | — | 0 | 0 | 0 |
| hadith | — | 0 | 0 | 2 |
| hadith-matla3 | Uncaught SyntaxError;Uncaught SyntaxError | 0 | 0 | 0 |
| hadith-matn | — | 0 | 0 | 13 |
| hadith-misbar | — | 0 | 0 | 0 |
| hadith-muqaran | — | 0 | 0 | 0 |
| hadith-naskh | — | 0 | 0 | 0 |
| hadith-nawawi | — | 0 | 0 | — |
| hadith-net | — | 0 | 0 | 33 |
| hadith-rawi | — | 0 | 0 | 0 |
| hadith-sanad | — | 0 | 0 | 0 |
| hadith-silsila | — | 0 | 0 | 1 |
| hadith-tabaqat | Uncaught SyntaxError | 0 | 0 | 0 |
| hadith-tartil | — | 0 | 0 | 0 |
| hadith-tathabbut | — | 0 | 0 | — |
| hadith-topic | — | 0 | 0 | 60 |
| hibr | Uncaught SyntaxError | 0 | 0 | — |
| ijaza | Uncaught SyntaxError | 0 | 0 | 0 |
| ikhtibirni | — | 0 | 0 | — |
| root | `pending` غير منشورة (404) | — | — | — |
| iqraa | — | 0 | 0 | — |
| itqan | — | 0 | 0 | — |
| jawhar | Uncaught SyntaxError | 0 | 0 | — |
| kharita | — | 0 | 0 | 0 |
| kutub | Uncaught SyntaxError | 0 | 0 | 0 |
| live | — | 0 | 0 | — |
| lohah | — | 0 | 0 | — |
| ma3raj | Uncaught ReferenceError | 0 | 0 | — |
| madhahib | Uncaught SyntaxError | 0 | 0 | 0 |
| madrasati | — | 0 | 0 | — |
| majlis | Uncaught SyntaxError | 0 | 0 | 0 |
| maktabati | — | 0 | 0 | — |
| manzuma | — | 0 | 0 | — |
| masrood | — | 0 | 0 | — |
| mi3yar | Uncaught SyntaxError | 0 | 0 | — |
| midad | Uncaught SyntaxError | 0 | 0 | — |
| midhallah | Uncaught SyntaxError | 0 | 0 | — |
| midrak | Uncaught SyntaxError | 0 | 0 | — |
| mighzal | Uncaught SyntaxError | 0 | 0 | — |
| mihbar | Uncaught SyntaxError | 0 | 0 | 0 |
| mihrab | Uncaught SyntaxError | 0 | 0 | — |
| mihrak | `pending` غير منشورة (404) | — | — | — |
| mikyal | Uncaught SyntaxError | 0 | 0 | — |
| minar | Uncaught SyntaxError | 0 | 0 | — |
| minbar | — | 0 | 0 | 1 |
| minha | Uncaught SyntaxError | 0 | 0 | — |
| minhaj | Uncaught ReferenceError | 0 | 0 | — |
| minjal | Uncaught SyntaxError | 0 | 0 | — |
| minsha | `pending` غير منشورة (404) | — | — | — |
| miqraa | — | 0 | 0 | 1 |
| miraj3a | Uncaught (in promise) SyntaxError | 0 | 0 | — |
| mirjan | Uncaught SyntaxError | 0 | 0 | — |
| mirsad | Uncaught SyntaxError | 0 | 0 | — |
| mirtaqa | `pending` غير منشورة (404) | — | — | — |
| mirthad | `pending` غير منشورة (404) | — | — | — |
| misbah | Uncaught SyntaxError | 0 | 0 | — |
| mishhad | Uncaught SyntaxError | 0 | 0 | 0 |
| mishwar | Uncaught SyntaxError | 0 | 0 | — |
| misraj | `pending` غير منشورة (404) | — | — | — |
| mizan | Uncaught (in promise) SyntaxError | 0 | 0 | — |
| mu3edd | — | 0 | 0 | 0 |
| mu3jam | — | 0 | 0 | 0 |
| muallim | `pending` غير منشورة (404) | — | — | — |
| mufassir | `pending` غير منشورة (404) | — | — | — |
| mukhatat | — | 0 | 0 | — |
| mulammi3 | — | 0 | 0 | — |
| munshur | Uncaught SyntaxError | 0 | 0 | 0 |
| muqfil | Uncaught SyntaxError | 0 | 0 | — |
| muqtatif | — | 0 | 0 | 0 |
| musajjil | — | 0 | 0 | 0 |
| mutabi3 | Uncaught TypeError | 0 | 0 | — |
| muwazan | Uncaught SyntaxError;Uncaught SyntaxError | 0 | 0 | 0 |
| naql | Uncaught SyntaxError | 0 | 0 | — |
| nusus | Uncaught SyntaxError | 0 | 0 | 0 |
| portal | — | 0 | 0 | 5 |
| prog-exam | — | 0 | 0 | — |
| prog | — | 0 | 0 | — |
| prog-lab | — | 0 | 0 | — |
| prog-paths | — | 0 | 0 | — |
| prog-proj | — | 0 | 0 | — |
| prog-review | — | 0 | 0 | — |
| prog-today | — | 0 | 0 | — |
| sawanih | Uncaught SyntaxError | 0 | 0 | — |
| shabaka | — | 0 | 0 | 57 |
| sibaq | Uncaught SyntaxError | 0 | 0 | 1 |
| silsila | Uncaught SyntaxError | 0 | 0 | 0 |
| sirat | Uncaught SyntaxError | 0 | 0 | — |
| team-amjad-fikra | — | 0 | 0 | — |
| team-amjad | — | 0 | 0 | — |
| team | — | 0 | 0 | — |
| wahy | — | 0 | 0 | 9 |
| wahy-kalimat | — | 0 | 0 | 1 |
| wahy-mishkat | — | 0 | 0 | 0 |
| wahy-muqaran_tafsir | — | 0 | 0 | 0 |
| wahy-mutashabih | — | 0 | 0 | 0 |
| warid | Uncaught SyntaxError | 0 | 0 | — |
| wasl | — | 0 | 0 | 0 |
| zad | — | 0 | 0 | — |
