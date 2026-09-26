"""تقييم مُرجِع-حديث: 30 حديثاً موزعة على جامع العلوم والحكم لابن رجب.

الأرضية الذهبية: ترويسات «الحديث N» في متن الكتاب نفسه (50/50 موجودة
ومتزايدة — تحقق برمجي مستقل). الحكم على موضع *الاقتباس* الذي وجده
المحرك (q_cs من مطابقة المتون، لا من الترويسات)، فلا دائرية:
الترويسة تحدد حدود المقطع، والاقتباس هو المتغير المُختبَر.

المعيار:
  hit   = موضع الاقتباس داخل مقطع الحديث الذهبي [ترويسة N → ترويسة N+1)
  kindm = hit لكن بنوع «معنى» (لا لفظ مطابق — احتواء idf) — يُحسب نجاحاً
          لكنه يُسجَّل صراحةً منفصلاً
  broad = لا موضع دقيق؛ الفجوة المُرجعة (بين جارين محددين) تحتوي المقطع
  miss  = موضع خارج المقطع، أو لا نتيجة

الاستخدام: python3 eval_hadith.py     # يكتب ../EVAL_HADITH.md
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lookup_hadith as L  # noqa: E402

# توزيع: أول الأربعين (1-10) + انتشار عبرها + أحاديث مشهورة
# (17 النصيحة، 24 الطهر، 28 السنة، 30 الحلال) + كل زوائد
# ابن رجب (43-50) — أصعب القسم لأنها ليست من الأربعين.
SAMPLE = (list(range(1, 11)) +
          [12, 15, 17, 18, 21, 24, 28, 30, 33, 36, 40, 42] +
          list(range(43, 51)))
assert len(SAMPLE) == 30

OUT = os.path.join(os.path.dirname(os.path.dirname(L.INDEX_DIR)),
                   'EVAL_HADITH.md')          # jadid2/murji/EVAL_HADITH.md


def _overlap(a0, a1, b0, b1):
    return max(0, min(a1, b1) - max(a0, b0))


def _gold(idx, num):
    """حدود مقطع الحديث num بالأحراف: [ترويسة N, ترويسة N+1)."""
    hp = idx.hdr.get(num)
    if hp is None:
        return None
    start = idx.cs[hp]
    nxt = min((p for n2, p in idx.hdr.items() if p > hp),
              default=len(idx.toks))
    return start, idx.cs[nxt] if nxt < len(idx.toks) else len(idx.text)


def verdict(idx, num):
    """-> (verdict, lookup_result, gold_bounds, why)."""
    r = idx.lookup(num)
    g = _gold(idx, num)
    e = idx.pos_of.get(num, {})
    cs, ce = r['char_start'], r['char_end']
    if e.get('found'):
        if g and g[0] <= e['q_cs'] <= g[1]:
            if e.get('kind') == 'meaning':
                return 'kindm', r, g, \
                    f"اقتباس بالمعنى (idf {e['mscore']:.2f}) داخل المقطع"
            return 'hit', r, g, \
                f"اقتباس {e['qlen']} كلمة داخل مقطع الحديث"
        why = 'اقتباس خارج مقطع الحديث'
        if g:
            if _overlap(cs, ce, g[0], g[1]) * 2 >= g[1] - g[0]:
                return 'broad', r, g, \
                    'اقتباس مثبت خارج المقطع لكن المقطع المُرجع يغطيه'
            d = e['q_cs'] - g[1]
            if -8000 < d < 0:
                why = 'اقتباس قبل مقطعه (ذكر مبكر/مقدمة)'
            elif d > 0:
                why = 'اقتباس بعد نهاية المقطع (إعادة ذكر لاحقة)'
        return 'miss', r, g, why
    if r['confidence'] == 'low' and g and _overlap(cs, ce, g[0], g[1]):
        return 'broad', r, g, 'لا اقتباس — فجوة بين جارين تتقاطع مع المقطع'
    return 'miss', r, g, 'لا اقتباس ولا فجوة صالحة'


def stats(idx):
    """دقة المحددات على الكتاب كله (50 حديثاً)."""
    found = ingold = meaning = 0
    for h in idx.hadiths:
        e = idx.pos_of.get(h['num'], {})
        if not e.get('found'):
            continue
        found += 1
        g = _gold(idx, h['num'])
        if g and g[0] <= e['q_cs'] <= g[1]:
            ingold += 1
            if e.get('kind') == 'meaning':
                meaning += 1
    return {'found': found, 'ingold': ingold, 'meaning': meaning,
            'n': len(idx.hadiths)}


def main():
    book = 'jamic_ulum'
    hadiths = L.build_hadiths(L.BOOKS[book]['corpus'])
    idx = L.HadithIndex(book, hadiths)
    glob = stats(idx)

    rows = []
    tally = {'hit': 0, 'kindm': 0, 'broad': 0, 'miss': 0}
    for num in SAMPLE:
        v, r, g, why = verdict(idx, num)
        tally[v] += 1
        pos = f"{r['char_start']}..{r['char_end']}" \
            if r['char_start'] is not None else '—'
        rows.append((num, r['confidence'], r.get('kind') or '—',
                     pos, v, why))

    ar = {'hit': 'صحيح', 'kindm': 'صحيح (معنى)',
          'broad': 'واسع', 'miss': 'خاطئ'}
    lines = []
    w = lines.append
    w('# تقييم مُرجِع-حديث — 30 حديثاً على جامع العلوم والحكم\n')
    w('الكتاب: ابن رجب الحنبلي، شرح خمسين حديثاً '
      '(الأربعون النووية 1-42 + زوائد 43-50)، نص OpenITI '
      '`JK000071-ara1` ملتزم مضغوطاً في `data/`.\n')
    w('**الأرضية الذهبية**: ترويسات «الحديث N» من متن الكتاب '
      '(50/50 متزايدة). «صحيح» = موضع الاقتباس الذي وجده المحرك داخل '
      'مقطع ترويسته. «صحيح (معنى)» = لم يوجد لفظ مطابق — احتواء '
      'كلمات المحتوى بـidf داخل المقطع (ثقة منخفضة، موثّق). '
      '«واسع» = فجوة بين جارين تحتوي المقطع.\n')
    w('## الملخص\n')
    w('| الكتاب | صحيح | صحيح (معنى) | واسع | خاطئ | دقة المحدد على الكتاب كله |')
    w('|---|---|---|---|---|---|')
    prec = f"{glob['ingold']}/{glob['found']} = {glob['ingold']/glob['found']:.0%}" \
        if glob['found'] else '—'
    w(f"| {book} | {tally['hit']}/30 | {tally['kindm']} | "
      f"{tally['broad']} | {tally['miss']} | {prec} (معنى: {glob['meaning']}) |")
    w('')
    w('## جدول العينات\n')
    w('| الحديث | الثقة | النوع | الموضع (أحرف) | الحكم | لماذا |')
    w('|---|---|---|---|---|---|')
    for num, conf, kind, pos, v, why in rows:
        w(f'| {num} | {conf} | {kind} | {pos} | {ar[v]} | {why} |')
    w('')
    w('## أين تفشل الخوارزمية (بأمانة)\n')
    w('- **رواية بالمعنى**: شرح يعيد صياغة المعنى دون لفظ — لا مرشح '
      'لفظي، يكشفه _meaning_probe باحتواء idf ويُسجَّل kind=meaning '
      'بثقة low. الحدود صحيحة لكن ليس هناك «اقتباس» يُشار إليه.')
    w('- **حديث بلا لفظ مطابق إطلاقاً**: إن لم يبلغ احتواء idf العتبة '
      '(MEANING_MIN) لا يوجد محدد — تُرجع فجوة الجارين «واسع» أو '
      'none. لم نلطّف هذا: النوع والثقة ظاهران في الفهرس.')
    w('- **تكرار الحديث في مواضع**: ابن رجب يعيد ذكر متن الحديث داخل '
      'شرحه («وقوله: …») وأحياناً في شرح حديث لاحق. السلسلة الرتيبة '
      'الموزونة تختار الموضع الأقوى سياقاً ضمن الترتيب؛ إن كان الذكر '
      'الأول أقوى (إسناد كامل قبله) يُثبَّت بدلاً من موضع الترويسة — '
      'يُحسب خاطئاً حتى لو كان اقتباساً حقيقياً.')
    w('- **متون مختصرة**: بعض الأحاديث تُقتبس مجتزأة («اتبع السيئة '
      'الحسنة» من حديث 18) — run قصير قد لا يجتاز البوابة؛ الوزن '
      'السياقي (عن/رواه) هو ما يحسم قبوله.')
    w('- **زوائد ابن رجب (43-50)**: ليست في hadith/nawawi.js — تُلتقط '
      'رواياتها من الكتب الستة ببذور نصية؛ إن اختلف لفظ الكتاب عن كل '
      'روايات الكتب الستة لا يوجد مرشح إطلاقاً.')
    w('')
    w('## إعادة الإنتاج\n')
    w('```')
    w('cd jadid2/murji/engine && python3 eval_hadith.py')
    w('```')
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    print(f"hit {tally['hit']} kindm {tally['kindm']} "
          f"broad {tally['broad']} miss {tally['miss']}")
    print('->', OUT)


if __name__ == '__main__':
    main()
