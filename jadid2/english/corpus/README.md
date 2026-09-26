# jadid2/english/corpus — بنك نصوص مُدرَّج

تطبيق حرفي لـ `../pipeline.md` على 20 نصاً إنجليزياً حقيقياً. stdlib فقط.

## الملفات

| ملف | وصف |
|-----|-----|
| `texts/*.json` | 20 نصاً `{id,title,source,text,tokens[]}` منقولة حرفياً |
| `fetch_corpus.py` | جلب النصوص من مصادرها (يخزّن خامها في `_src_cache/`) |
| `grade.py` | خط الإنتاج: تطبيع §0 → جمل §1 → توكنة §2 → تلميذة §3 → أربطة §4 → بنك §5 → إحصاء §6 → استنتاج §7 → حكم §8 |
| `graded_index.json` | الجدول المرتب: لكل نص D، C_token، C_lemma، حكم، pre_teach_count |
| `annotated/<id>.json` | موسومة كاملة لكل نص (توكنات + مجهولات + خطة) |
| `vocab_profile.jsonl` | المتعلم المرجعي: 579 سطراً بمخطط `vocab_bank.schema.json`، ≈500 معروفة فعلية |
| `freq_table.jsonl` | جدول التردد المجمَّد: wordfreq top-60k إنجليزي `{lemma,rank,zipf}` |
| `abbrev.txt`, `contractions.json`, `irregular.json`, `def_markers.txt`, `subord.txt` | ملفات ضبط §9 |
| `simulate.py` | يولّد `SELECTION.md` — سيناريو 5 أيام بتحديث البنك §7 |
| `verify.py` | يولّد `VERIFY.md`؛ `--spec-check` يعيد عينة SAMPLE.md §0 |

## إعادة الإنتاج

```sh
python3 fetch_corpus.py          # إعادة جلب النصوص (تشبك؛ المصادر مثبتة في الملف)
python3 grade.py                 # يعيد بناء annotated/ + graded_index.json
python3 verify.py --spec-check   # مطابقة SAMPLE.md: C=0.9457 / D=0.11 / i+2
python3 verify.py && python3 simulate.py
```

## النتيجة للمتعلم المرجعي (≈500 لمّة)

كل النصوص العشرين `out` — C_token∈[0.556,0.763]، أي دون عتبة §8 (<0.90 بعد
ميزانية pre-teach). هذا متوقع من جدول SPEC.md §5.1 نفسه (L1<800 →
E[C]≈0.75–0.80): مفردات المحتوى الحقيقية (sleep، wolf، prophet، desert…)
تقع وراء الرتبة 500. القارئ i+1 الفعلي لهذا البنك يبدأ من K≈5000 — انظر
`SELECTION.md` لمسار الزحف و`VERIFY.md` للفحص اليدوي.
