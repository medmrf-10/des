# SELECTION — سيناريو تعلّم 5 خطوات (متعلم مرجعي ≈500 لمّة)

توليد آلي: `python3 simulate.py` — يعيد إنتاج كل رقم أدناه.

القاعدة: كل يوم تُعاد تدريجة النصوص غير المقروءة ببنك اليوم، يُختار أفضل حكم ثم أدنى D، ويُطبَّق تحديث البنك §7 (pre-teach + أهداف الاستنتاج → `learned`؛ gloss + بقية المجهولات → `seen`).

## النتيجة العامة

| # | نص | C قبل | C_eff | D | حكم خام | حكم | pre-teach | استنتاج | gloss | K بعد |
|---|----|-------|-------|---|---------|-----|-----------|--------|-------|--------|
| 1 | `q-saheeh-93-94` | 0.735 | 0.782 | 0.175 | out | out | 8 | 7 | 21 | 514 |
| 2 | `sw-water` | 0.689 | 0.730 | 0.202 | out | out | 8 | 10 | 32 | 532 |
| 3 | `ae-shepherd-wolf` | 0.724 | 0.752 | 0.218 | out | out | 8 | 13 | 25 | 553 |
| 4 | `sw-dog` | 0.753 | 0.798 | 0.176 | out | out | 8 | 7 | 20 | 568 |
| 5 | `ae-fox-grapes` | 0.684 | 0.736 | 0.222 | out | out | 8 | 7 | 23 | 583 |

## تفصيل كل خطوة

### اليوم 1: `q-saheeh-93-94` — Quran The Morning Hours — The Relief (Saheeh International)
- قبل القراءة: C=0.735، D=0.175، حكم=out (خام: out).
- خطة التكييف: pre-teach = `self-sufficient`, `stand`, `upon`, `poor`, `cover`, `lose`, `finished`, `direct` (8، السقف 8)؛ أهداف استنتاج = 7 (منها: `o`, `lord`, `indeed`, `ease`, `muhammad`, `orphan`)؛ gloss = 21.
- بعد الجلسة: 15 لمّة → `learned` (`self-sufficient`, `stand`, `upon`, `poor`, `cover`, `lose`, `finished`, `direct`, `o`, `lord`, `indeed`, `ease`, `muhammad`, `orphan`, `hardship`)؛ K: 499 → 514.
- أثر التحديث على المتبقي (19 نصاً): متوسط C = 0.671؛ نصوص C≥0.90 = 0.

### اليوم 2: `sw-water` — Simple English Wikipedia — Water (lead)
- قبل القراءة: C=0.689، D=0.202، حكم=out (خام: out).
- خطة التكييف: pre-teach = `example`, `clear`, `w`, `include`, `english`, `property`, `cannot`, `simple` (8، السقف 8)؛ أهداف استنتاج = 10 (منها: `word`, `earth`, `ice`, `surface`, `fresh`, `cycle`)؛ gloss = 32.
- بعد الجلسة: 18 لمّة → `learned` (`example`, `clear`, `w`, `include`, `english`, `property`, `cannot`, `simple`, `word`, `earth`, `ice`, `surface`, `fresh`, `cycle`, `bond`, `underground`, `tension`, `hydrogen`)؛ K: 514 → 532.
- أثر التحديث على المتبقي (18 نصاً): متوسط C = 0.677؛ نصوص C≥0.90 = 0.

### اليوم 3: `ae-shepherd-wolf` — The Shepherd Boy And The Wolf — The Æsop for Children
- قبل القراءة: C=0.724، D=0.218، حكم=out (خام: out).
- خطة التكييف: pre-teach = `near`, `plan`, `killed`, `drive`, `fall`, `dog`, `attack`, `voice` (8، السقف 8)؛ أهداف استنتاج = 13 (منها: `hear`, `boy`, `master`, `village`, `toward`, `cry`)؛ gloss = 25.
- بعد الجلسة: 21 لمّة → `learned` (`near`, `plan`, `killed`, `drive`, `fall`, `dog`, `attack`, `voice`, `hear`, `boy`, `master`, `village`, `toward`, `cry`, `wolf`, `sheep`, `shout`, `shepherd`, `villagers`, `pasture`, `amuse`)؛ K: 532 → 553.
- أثر التحديث على المتبقي (17 نصاً): متوسط C = 0.683؛ نصوص C≥0.90 = 0.

### اليوم 4: `sw-dog` — Simple English Wikipedia — Dog (lead)
- قبل القراءة: C=0.753، D=0.176، حكم=out (خام: out).
- خطة التكييف: pre-teach = `sometimes`, `type`, `baby`, `eat`, `popular`, `listen`, `army`, `store` (8، السقف 8)؛ أهداف استنتاج = 7 (منها: `usually`, `mountain`, `rescue`, `pet`, `loyal`, `puppy`)؛ gloss = 20.
- بعد الجلسة: 15 لمّة → `learned` (`sometimes`, `type`, `baby`, `eat`, `popular`, `listen`, `army`, `store`, `usually`, `mountain`, `rescue`, `pet`, `loyal`, `puppy`, `pup`)؛ K: 553 → 568.
- أثر التحديث على المتبقي (16 نصاً): متوسط C = 0.682؛ نصوص C≥0.90 = 0.

### اليوم 5: `ae-fox-grapes` — The Fox And The Grapes — The Æsop for Children
- قبل القراءة: C=0.684، D=0.222، حكم=out (خام: out).
- خطة التكييف: pre-teach = `ready`, `beautiful`, `miss`, `tried`, `worth`, `seem`, `beyond`, `train` (8، السقف 8)؛ أهداف استنتاج = 7 (منها: `walk`, `jump`, `fox`, `hang`, `branch`, `bunch`)؛ gloss = 23.
- بعد الجلسة: 15 لمّة → `learned` (`ready`, `beautiful`, `miss`, `tried`, `worth`, `seem`, `beyond`, `train`, `walk`, `jump`, `fox`, `hang`, `branch`, `bunch`, `grapes`)؛ K: 568 → 583.
- أثر التحديث على المتبقي (15 نصاً): متوسط C = 0.683؛ نصوص C≥0.90 = 0.

## السبب الحسابي

1. **كل ما يكتسبه المتعلم من نص واحد محدود بميزانية §5**: ≤8 pre-teach + أهداف الاستنتاج فقط تتحول `learned`؛ مجهولات gloss تبقى `seen` ولا تُحتسب معروفة — لذا يزحف K ببطء (≈8–20 لمّة/نص).
2. **الارتداد بين النصوص قليل عند K≈500**: مفردات المحتوى المجهولة (allah, prophet, wolf, desert, hydrogen…) متخصصة لكل نص ولا تتكرر في النصوص الأخرى، فتحسين نص لا يرفع تغطية غيره إلا قليلاً.
3. **لهذا تبقى كل الأحكام `out`** عند K≈500 — وهو ما يتنبأ به جدول SPEC.md §5.1 نفسه (L1<800 → E[C]≈0.75–0.80 على نص عام؛ هذه النصوص الحقيقية أعطت C∈[0.55,0.77]). القارئ i+1 لهذا البنك يبدأ عملياً من K≈5000 (مطابقة SAMPLE.md: sleep أعطى C=0.9457 عند rank≤5000).
4. مع ذلك يعمل الاختيار: في كل خطوة يُنتقى **أدنى D** فتُقرأ أسهل النصوص المتاحة أولاً — نفس الآلية تعطي ترتيباً مفيداً حتى حين لا يبلغ أي مرشح عتبة i+1.
