# تقرير الزحف الخامس (crawl5) — كل الصفحات المنشورة

الزاحف: `tools/crawl.ts` (CDP، 360px + أداء + تجمّد) · 2026-09-25 · 108 منشورة من أصل 162 على main (54 pending-deploy مستثناة).

## الخلاصة

- **أخطاء JS: 40/108** — 39 بعلة `##` (إصلاحها على main ينتظر النشر — البناء متقافز) + mutabi3 (`Object.keys(null)`).
- **الفيض الأفقي: 0** · **البطء (>3s): 0** — كل الصفحات تجيب بسرعة.
- **مؤشرات تجمّد**: الصفحات الميتة بالـ `##` تعلق على نصوص مؤقتة («…») — نفس الجذر لا علة جديدة.
- **miqraa**: تعرض «تعذّر تحميل البيانات» رغم أن ملفات wahy/data ترد 200 — فشل داخلي يحتاج تتبعاً (jget/بنية IDX).
- **روابط مكسورة**: fihris → `fiqh_reader/masail.html` (pending)، وكل الصفحات ذات رابط الرجوع → `medmrf-10.github.io/` (404 خارج /des/).

## P1 — أخطاء JS (40)

daftar; hadith-matla3; hadith-tabaqat; hibr; ijaza; jawhar; kutub; ma3raj; madhahib; majlis; mi3yar; midad; midhallah; midrak; mighzal; mihbar; mihrab; mikyal; minar; minha; minhaj; minjal; miraj3a; mirjan; mirsad; misbah; mishhad; mishwar; mizan; munshur; muqfil; mutabi3; muwazan; naql; nusus; sawanih; sibaq; silsila; sirat; warid


## P2 — روابط مكسورة

- fihris: 404 https://medmrf-10.github.io/des/fiqh_reader/masail.html
- root: 404 https://medmrf-10.github.io/

## P3 — pending-deploy (54)
diwan, english-journal, english-practice, english-story, english-vocab, fajr, fiqh_reader-masail, hadith-asma, hadith-ilal, hadith-muhaddith, hadith-takhrij, mi3bar, mi3mal, mi3na, mi3skar, mi3tamad, mi3tikaf, mihdar, mihfil, mihrak, mihrath, mijass, mijtaz, minhal, minsha, miqtaf, mirtaqa, mirthad, mishawar, mishghal, mishrab, misqal, misraj, mistr, mithaq, mitla3, mizkata, moseh, muallim, muamma, mudarrib, mufassir, mukhtalif, mula7hin, mushbih, mushrif, musnad, mustafa, mustamli, mutahhaq, mutashabih, prog-map, prog-project, prog-reference


## الجدول الكامل
| الصفحة | الحالة | فيضpx | تحميلms | بحث |
|---|---|---|---|---|

| akida | سليم | 0 | 299 | 0 |
| akida-masadir | سليم | 0 | 382 | 0 |
| akida-real | سليم | 0 | 282 | 13 |
| buraq | سليم | 0 | 124 | 0 |
| daftar | JS | 0 | 117 | 0 |
| durus | سليم | 0 | 260 | 65 |
| english | سليم | 0 | 1315 | — |
| english-library | سليم | 0 | 130 | — |
| english-listen | سليم | 0 | 578 | — |
| english-mimic | سليم | 0 | 175 | — |
| english-routine | سليم | 0 | 118 | — |
| english-srs | سليم | 0 | 121 | — |
| fihris | روابط | 0 | 289 | 87 |
| fiqh | سليم | 0 | 188 | 5 |
| fiqh_reader | سليم | 0 | 321 | 55 |
| hadith-adhkar | سليم | 0 | 116 | — |
| hadith-ahkam | سليم | 0 | 209 | — |
| hadith-alaam | سليم | 0 | 283 | 0 |
| hadith | سليم | 0 | 27 | 2 |
| hadith-matla3 | JS | 0 | 270 | 0 |
| hadith-matn | سليم | 0 | 32 | 13 |
| hadith-misbar | سليم | 0 | 222 | 0 |
| hadith-muqaran | سليم | 0 | 810 | 0 |
| hadith-naskh | سليم | 0 | 115 | 0 |
| hadith-nawawi | سليم | 0 | 506 | — |
| hadith-net | سليم | 0 | 27 | 33 |
| hadith-rawi | سليم | 0 | 184 | 0 |
| hadith-sanad | سليم | 0 | 231 | 0 |
| hadith-silsila | سليم | 0 | 61 | 1 |
| hadith-tabaqat | JS | 0 | 138 | 0 |
| hadith-tartil | سليم | 0 | 109 | 0 |
| hadith-tathabbut | سليم | 0 | 122 | — |
| hadith-topic | سليم | 0 | 25 | 60 |
| hibr | JS | 0 | 133 | — |
| ijaza | JS | 0 | 115 | 0 |
| ikhtibirni | سليم | 0 | 201 | — |
| root | روابط | 0 | 27 | — |
| iqraa | سليم | 0 | 121 | — |
| itqan | سليم | 0 | 113 | — |
| jawhar | JS | 0 | 171 | — |
| kharita | سليم | 0 | 156 | 0 |
| kutub | JS | 0 | 32 | 0 |
| live | سليم | 0 | 453 | — |
| lohah | سليم | 0 | 276 | — |
| ma3raj | JS | 0 | 104 | — |
| madhahib | JS | 0 | 284 | 0 |
| madrasati | سليم | 0 | 45 | — |
| majlis | JS | 0 | 120 | 0 |
| maktabati | سليم | 0 | 142 | — |
| manzuma | سليم | 0 | 157 | — |
| masrood | سليم | 0 | 121 | — |
| mi3yar | JS | 0 | 131 | — |
| midad | JS | 0 | 112 | — |
| midhallah | JS | 0 | 114 | — |
| midrak | JS | 0 | 113 | — |
| mighzal | JS | 0 | 100 | — |
| mihbar | JS | 0 | 113 | 0 |
| mihrab | JS | 0 | 124 | — |
| mikyal | JS | 0 | 114 | — |
| minar | JS | 0 | 122 | — |
| minbar | سليم | 0 | 115 | 1 |
| minha | JS | 0 | 186 | — |
| minhaj | JS | 0 | 120 | — |
| minjal | JS | 0 | 115 | — |
| miqraa | سليم | 0 | 113 | 1 |
| miraj3a | JS | 0 | 114 | — |
| mirjan | JS | 0 | 114 | — |
| mirsad | JS | 0 | 112 | — |
| misbah | JS | 0 | 127 | — |
| mishhad | JS | 0 | 123 | 0 |
| mishwar | JS | 0 | 126 | — |
| mizan | JS | 0 | 141 | — |
| mu3edd | سليم | 0 | 141 | 0 |
| mu3jam | سليم | 0 | 135 | 0 |
| mukhatat | سليم | 0 | 69 | — |
| mulammi3 | سليم | 0 | 124 | — |
| munshur | JS | 0 | 117 | 0 |
| muqfil | JS | 0 | 108 | — |
| muqtatif | سليم | 0 | 139 | 0 |
| musajjil | سليم | 0 | 121 | 0 |
| mutabi3 | JS | 0 | 120 | — |
| muwazan | JS | 0 | 143 | 0 |
| naql | JS | 0 | 101 | — |
| nusus | JS | 0 | 118 | 0 |
| portal | سليم | 0 | 96 | 5 |
| prog-exam | سليم | 0 | 257 | — |
| prog | سليم | 0 | 136 | — |
| prog-lab | سليم | 0 | 205 | — |
| prog-paths | سليم | 0 | 205 | — |
| prog-proj | سليم | 0 | 147 | — |
| prog-review | سليم | 0 | 204 | — |
| prog-today | سليم | 0 | 221 | — |
| sawanih | JS | 0 | 118 | — |
| shabaka | سليم | 0 | 308 | 57 |
| sibaq | JS | 0 | 110 | 1 |
| silsila | JS | 0 | 212 | 0 |
| sirat | JS | 0 | 142 | — |
| team-amjad-fikra | سليم | 0 | 435 | — |
| team-amjad | سليم | 0 | 27 | — |
| team | سليم | 0 | 32 | — |
| wahy | سليم | 0 | 134 | 9 |
| wahy-kalimat | سليم | 0 | 24 | 1 |
| wahy-mishkat | سليم | 0 | 118 | 0 |
| wahy-muqaran_tafsir | سليم | 0 | 32 | 0 |
| wahy-mutashabih | سليم | 0 | 78 | 0 |
| warid | JS | 0 | 130 | — |
| wasl | سليم | 0 | 135 | 0 |
| zad | سليم | 0 | 159 | — |
