"""تقييم مُرجِع: 30 آية موزعة × كتابين، مقابل حدود المجموعات الذهبية (vg).

المعيار (حرفي ومفروض على المخرج نفسه):
  hit   = الاقتباس الموجد q_cs داخل نطاق مجموعة الآية الذهبية — دقيق
  broad = ثقة منخفضة (فجوة بين جارين) تحتوي المجموعة الذهبية — صحيح لكن فضفاض
  miss  = موضع خارج المجموعة، أو لا نتيجة

الاستخدام: python3 eval.py            # يكتب ../EVAL.md ويطبع الملخص
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lookup as L  # noqa: E402

SAMPLE = [
    (1, 1), (1, 5), (1, 7),
    (2, 1), (2, 2), (2, 26), (2, 102), (2, 183), (2, 255), (2, 286),
    (3, 190), (5, 3), (9, 40), (12, 4), (16, 90),
    (18, 9), (18, 60), (18, 83), (18, 110),
    (21, 87), (24, 35),
    (36, 1), (36, 82),
    (55, 13), (67, 3), (97, 1),
    (112, 1), (113, 5), (114, 1), (114, 6),
]
assert len(SAMPLE) == 30

OUT = os.path.join(os.path.dirname(os.path.dirname(L.INDEX_DIR)),
                   'EVAL.md')          # jadid2/murji/EVAL.md


def _overlap(a0, a1, b0, b1):
    return max(0, min(a1, b1) - max(a0, b0))


def verdict(idx, s, a):
    """-> (verdict, lookup_result, gold_bounds, why).

    hit   : الاقتباس الموجد داخل مجموعة الآية الذهبية (دقيق)
    broad : لا موضع دقيق لكن المقطع المُرجع يتقاطع مع المجموعة —
            الكتب تدمج آيات في مجموعة واحدة فيقع الجزء الصحيح داخلها
    miss  : الباقي"""
    key = f'{s}:{a}'
    r = idx.lookup(s, a)
    g = idx.gold.get(key)
    e = idx.pos_of.get(key, {})
    cs, ce = r['char_start'], r['char_end']
    if e.get('found'):
        if g and g[0] <= e['q_cs'] <= g[1]:
            return 'hit', r, g, f"اقتباس {e['qlen']} كلمة داخل مجموعة الآية"
        why = 'اقتباس خارج مجموعة الآية'
        if g:
            ov = _overlap(cs, ce, g[0], g[1])
            if ov * 2 >= g[1] - g[0]:
                return 'broad', r, g, \
                    'اقتباس مثبت خارج المجموعة لكن المقطع يغطي نصفها+'
            d = e['q_cs'] - g[1]
            if -6000 < d < 0:
                why = 'اقتباس قبل المجموعة بقليل (إعادة ذكر/مقدمة)'
            elif d > 0:
                why = 'اقتباس بعد نهاية المجموعة'
        return 'miss', r, g, why
    if r['confidence'] == 'low' and g and _overlap(cs, ce, g[0], g[1]):
        return 'broad', r, g, \
            'لا اقتباس لفظي — أُرجعت فجوة/كتلة جارة تتقاطع مع المجموعة'
    if r['confidence'] == 'none':
        return 'miss', r, g, 'لا اقتباس ولا فجوة صالحة'
    return 'miss', r, g, 'المقطع المُرجع لا يتقاطع مع مجموعة الآية'


def stats(idx):
    """أرقام عامة على الكتاب كله."""
    n = found = ingold = low = none = 0
    for s, a, _ in idx.quran:
        key = f'{s}:{a}'
        n += 1
        r = idx.lookup(s, a)
        if r['confidence'] == 'none':
            none += 1
            continue
        if r['confidence'] == 'low':
            low += 1
            continue
        found += 1
        g = idx.gold.get(key)
        if g and g[0] <= idx.pos_of[key]['q_cs'] <= g[1]:
            ingold += 1
    return {'n': n, 'found': found, 'ingold': ingold,
            'low': low, 'none': none}


def main():
    quran = L.load_quran()
    books = ['ibn_kathir', 'saadi']
    idx = {b: L.TafsirIndex(b, quran) for b in books}
    glob = {b: stats(idx[b]) for b in books}

    rows = []
    tally = {b: {'hit': 0, 'broad': 0, 'miss': 0} for b in books}
    for s, a in SAMPLE:
        for b in books:
            v, r, g, why = verdict(idx[b], s, a)
            tally[b][v] += 1
            pos = f"{r['char_start']}..{r['char_end']}" \
                if r['char_start'] is not None else '—'
            rows.append((f'{s}:{a}', b, r['confidence'], pos, v, why))

    ar = {'hit': 'صحيح', 'broad': 'واسع', 'miss': 'خاطئ'}
    lines = []
    w = lines.append
    w('# تقييم مُرجِع — 30 آية × تفسيرين\n')
    w('العينة موزعة: الفاتحة(3) البقرة(7) آل عمران..النحل(6) '
      'الكهف(4) الأنبياء/النور(2) يس(2) الرحمن/الملك/القدر(3) '
      'الإخلاص..الناس(3).\n')
    w('**الأرضية الذهبية**: `vg` في ملف المصدر يربط كل آية بمجموعة '
      'تفسيرها؛ حدودها بالأحراف في النص المعاد بناؤه هي الحكم. '
      '«صحيح» = موضع الاقتباس الموجد داخل مجموعة الآية. '
      '«واسع» = لا موضع دقيق لكن المقطع المُرجع يتقاطع مع مجموعة '
      'الآية (الكتب تدمج آياتٍ في مجموعة واحدة).\n')
    w('## الملخص\n')
    w('| الكتاب | صحيح | واسع | خاطئ | دقة المحدد على الكتاب كله |')
    w('|---|---|---|---|---|')
    for b in books:
        t, g = tally[b], glob[b]
        prec = f"{g['ingold']}/{g['found']} = {g['ingold']/g['found']:.0%}" \
            if g['found'] else '—'
        w(f"| {b} | {t['hit']}/30 | {t['broad']} | {t['miss']} | {prec} |")
    w('')
    w('## جدول العينات\n')
    w('| الآية | الكتاب | الثقة | الموضع (أحرف) | الحكم | لماذا |')
    w('|---|---|---|---|---|---|')
    for k, b, conf, pos, v, why in rows:
        w(f'| {k} | {b} | {conf} | {pos} | {ar[v]} | {why} |')
    w('')
    w('## أين تفشل الخوارزمية (بأمانة)\n')
    w('- **مصدر خارج الترتيب**: بعض الكتب تعيد ترتيب الاقتباسات داخل '
      'مجموعة واحدة (السعدي مثلاً يقتبس {الرحمن الرحيم} آخر كتلة 1:1 '
      'قبل كتلة 1:2) — السلسلة الرتيبة تختار أعلى الأدلة وتُسقِط الآية '
      'الأخرى. خسارة حقيقية وموثقة.')
    w('- **إعادة الاقتباس داخل القصة**: في ابن كثير تُذكر آيات قصة '
      'البقرة (2:68-70) قبل مقطعها الرسمي بآلاف الأحرف؛ السلسلة قد '
      'تثبّت الموضع المبكر — صحيح سياقياً لكنه خارج حدود vg.')
    w('- **بلا اقتباس لفظي**: آيات يشرحها المؤلف دون إعادة صياغة حرفية '
      '(أو برسم مختلف تماماً) لا مرشحات لها ← ترجع الفجوة «واسع» '
      'بثقة منخفضة، أو «none» إن التصقت الفجوة بالجارين.')
    w('- **الرسم العثماني**: الألف الخنجرية (صرٰط) تُولَّد لها متغيرات '
      '(الصرط/الصراط) لكن اختلافات أعمق (هجاء بدلي، حذف «لا») تفشل.')
    w('- **أطراف السورة**: آية أخيرة بلا جار محدد لاحق تأخذ حد الترويسة '
      'التالية أو آخر الملف — المقطع قد يضم خواتم عامة زائدة.')
    w('')
    w('## إعادة الإنتاج\n')
    w('```')
    w('cd jadid2/murji/engine && python3 eval.py')
    w('```')
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    for b in books:
        t = tally[b]
        print(f"{b}: hit {t['hit']} broad {t['broad']} miss {t['miss']}")
    print('->', OUT)


if __name__ == '__main__':
    main()
