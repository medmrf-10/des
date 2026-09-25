# تحليل بيانات الحديث — wahy/analysis

`hadith_analysis.py` — أداة Python (stdlib فقط، بلا اعتماديات) تحلّل حزم
`data/hadith/<book>-det.json.gz` و `topics.json.gz` للكتب الستة:

```
python3 hadith_analysis.py all                 # stats + network + match
python3 hadith_analysis.py stats               # إحصاءات الأسانيد لكل كتاب
python3 hadith_analysis.py network --top 20    # شبكة الرواة (حواف/مراكز/مشتركون)
python3 hadith_analysis.py match               # مطابقة المعاني بين الكتب
python3 hadith_analysis.py all --json out.json # نتائج آلية كاملة
python3 hadith_analysis.py all --base-url https://medmrf-10.github.io/des/wahy/data/hadith
```

## بنية البيانات (من build.py)

- `d`: `no_inbook -> {m: matn, g: group_id}` — متن الحديث + معرف مجموعة المعنى.
- `s`: `no_inbook -> [[hukum_sanad, [rawi...]], ...]` — أسانيد كاملة؛ أول راوٍ
  هو مؤلف الكتاب وآخره الصحابي. «موضع تعليق» عقدة صورية لمعلقات البخاري.
- `g`: `group_id -> {t: taraf, h: hukm, s: sahaba_qty, r: repeat_qty,
  hs: [no_inbook...], x: {book: first_no}}` — معرف المجموعة موحّد عبر الكتب؛
  `x` يعطي أول رقم حديث لنفس المعنى في الكتب الأخرى.
- `topics.json.gz`: `t` شجرة موضوعات الجامع (n/p/l/b) و`g` topic->[group_ids].
