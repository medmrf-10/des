"""تقييم مُرجِع-حديث على دليل الفالحين — 40 حديثاً موزعة على الكتاب كله.

الأرضية الذهبية — مستوى الباب (الوحيدة الموثوقة على هذا الكتاب):
  كل حديث في المتن (JK) تحت ترويسة «باب X»؛ ابن علان يشرح بالأبواب
  نفسها بترقيم مختلف وأحياناً بعنوان مختصر (باب الإخلاص ← باب الإخلاص
  وإحضار النية في جميع الأعمال). المطابقة: احتواء كلمات المحتوى ≥0.6
  مع تزامن أحادي نافذته 8. ترويسات المصدر تتكرر أحياناً متلاصقة
  («باب التوبة» ×3) فحد الباب الأيسر هو بداية الباب المطابَق التالي.
  أحاديث العينة تُنتقى من أبواب مطابَقة فقط.

تحقق لَفظي (فوق موضع الباب):
  موضع الاقتباس q_cs قد يُبنى على سياق بلاغي (صلى الله عليه وسلم قال)
  لا على متن الحديث. لذلك لكل «hit» نقيس استرجاع كلمات المتن في نافذة
  300 كلمة حول الموضع: hit-strong ≥0.4 من كلمات متن JK الحرفية،
  hit-frag = اقتباس حرفي قصير حقيقي لكن استرجاع أدنى، ونحسبها نجاحاً
  لكنها تُميَّز في الجدول.

التكرار: لكل عينة نعدّ عناقيد مواضع 4-grams المتن في الكتاب كله
(تجميع ≤300 كلمة، العنقود الحقيقي فيه ≥2 n-gram متميزة) — حديث
متكرر الاقتباس يُظهر n_sites>1. المحرك يختار موضعاً واحداً.

الاستخدام: python3 eval_riyad.py     # يكتب ../EVAL_RIYAD.md
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lookup_hadith as L  # noqa: E402
import riyad_dalil as R  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.dirname(L.INDEX_DIR)),
                   'EVAL_RIYAD.md')

FAMOUS = [
    ('النيات', 'انما الاعمال بالنيات'),
    ('جبريل', 'بينما نحن جلوس عند رسول الله'),
    ('الدين النصيحة', 'الدين النصيحه'),
    ('حسن الإسلام', 'من حسن اسلام المرء تركه'),
    ('الحلال بين', 'الحلال بين والحرام بين'),
    ('لا يؤمن حتى يحب', 'لا يومن احدكم حتي اكون احب'),
    ('كن في الدنيا', 'كن في الدنيا كانك غريب'),
    ('من سلك طريقا', 'من سلك طريقا يلتمس فيه علما'),
    ('من صلى البردين', 'من صلي البردين دخل الجنه'),
    ('الطهور شطر الإيمان', 'الطهور شطر الايمان'),
]


def _sig_words(title):
    return {w for w in L._tokens(title)
            if w not in L._STOP and w not in ('باب', 'كتاب')}


def match_chapters():
    _h, jk_ch, chap_of = R.load_riyad()
    dch = R.dalil_chapters()
    di = 0
    mapped = []
    for li, kind, title in jk_ch:
        if kind != 'باب':
            continue
        tw = _sig_words(title)
        best, bi = 0.0, None
        for j in range(di, min(di + 8, len(dch))):
            dw = _sig_words(dch[j][1])
            if not dw:
                continue
            sc = len(tw & dw) / min(len(tw), len(dw))
            if sc > best:
                best, bi = sc, j
        if bi is None or best < 0.6:
            continue
        mapped.append((title, best, bi))
        di = bi + 1
    spans = {}
    for k, (title, _s, bi) in enumerate(mapped):
        end = dch[mapped[k + 1][2]][0] if k + 1 < len(mapped) else None
        spans[title] = (dch[bi][0], end)
    return spans, mapped, chap_of


def matn_recall(idx, h, q_cs):
    """نسبة كلمات المتن الظاهرة في نافذة 600 حرف حول الموضع — على اتحاد
    كل الروايات (متن JK + صيغ الكتب الستة) لأن ابن علان قد يقتبس
    برواية غير رواية JK."""
    lo = max(0, q_cs - 300)
    win = set(L._tokens(idx.text[lo:q_cs + 300]))
    core = {w for w in h['variants'][0] if w not in L._STOP}
    uni = {w for V in h['variants'] for w in V if w not in L._STOP}
    if not uni:
        return 0.0, 0.0
    return (len(core & win) / max(1, len(core)),
            len(uni & win) / len(uni))


def quote_sites(idx, h):
    """عناقيد الاقتباس الحرفي: 4-grams «مميزة» من متن JK (تظهر ≤20 مرة
    في الكتاب كله — الصيغ المرجلية مستبعدة)؛ مواضعها مجمّعة بفجوة
    ≤300 كلمة؛ العنقود الحقيقي يشمل ≥2 نمطاً متميزاً."""
    V = h['variants'][0]
    if not hasattr(idx, '_qgram_pos'):
        g = {}
        T = idx.toks
        for i in range(len(T) - 3):
            key = (T[i], T[i + 1], T[i + 2], T[i + 3])
            g.setdefault(key, []).append(i)
        idx._qgram_pos = g
    pos = []
    for q in range(len(V) - 3):
        pp = idx._qgram_pos.get(tuple(V[q:q + 4]), [])
        if len(pp) <= 20:
            pos.extend(pp)
    pos = sorted(set(pos))
    clusters, cur = [], []
    for p in pos:
        if cur and p - cur[-1] > 300:
            clusters.append(cur)
            cur = []
        cur.append(p)
    if cur:
        clusters.append(cur)
    real = [c for c in clusters if len(c) >= 2]
    return len(real), [c[0] for c in real]


def verdict(idx, num, chap_of, spans):
    h = idx.hadiths[idx.hidx[num]]
    chap_title = chap_of[num][2]
    g = spans.get(chap_title)
    r = idx.lookup(num)
    e = idx.pos_of.get(num, {})
    n_sites, sites = quote_sites(idx, h)
    if e.get('found'):
        inb = g and g[0] <= e['q_cs'] <= (g[1] or 10 ** 12)
        if inb:
            rec, urec = matn_recall(idx, h, e['q_cs'])
            if e.get('kind') == 'meaning':
                return 'kindm', r, g, n_sites, \
                    f"اقتباس بالمعنى (idf {e['mscore']:.2f}) " \
                    f"استرجاع JK {rec:.0%}/روايات {urec:.0%}"
            if rec >= 0.4 or urec >= 0.5:
                return 'hit', r, g, n_sites, \
                    f"اقتباس {e['qlen']} كلمة، استرجاع JK {rec:.0%}" \
                    f"/روايات {urec:.0%}"
            return 'hitfrag', r, g, n_sites, \
                f"اقتباس لفظي {e['qlen']} كلمة، استرجاع JK {rec:.0%}" \
                f"/روايات {urec:.0%} (جزئي)"
        return 'miss', r, g, n_sites, \
            f"اقتباس خارج الباب ({e['q_cs']})"
    cs, ce = r['char_start'], r['char_end']
    if r['confidence'] == 'low' and g and cs is not None:
        ov = max(0, min(ce, g[1] or len(idx.text)) - max(cs, g[0]))
        if ov * 2 >= (g[1] or len(idx.text)) - g[0]:
            return 'broad', r, g, n_sites, 'لا اقتباس — فجوة تغطي الباب'
    return 'miss', r, g, n_sites, 'لا اقتباس ولا فجوة صالحة'


def pick_sample(hadiths, spans, chap_of):
    """40 حديثاً من أبواب مطابَقة فقط: مشهورة بالنص + انتشار منتظم."""
    nums = [h['num'] for h in hadiths if chap_of[h['num']][2] in spans]
    bynum = {h['num']: h for h in hadiths}
    picked = []
    for name, key in FAMOUS:
        keyt = set(L._tokens(key))
        for n in nums:
            vt = {w for v in bynum[n]['variants'] for w in v}
            if keyt <= vt:
                picked.append((n, name))
                break
    step = max(1, len(nums) // 30)
    for i in range(0, len(nums), step):
        n = nums[i]
        if n not in [p[0] for p in picked]:
            picked.append((n, f'#{n}'))
    for n in nums[:5] + nums[-3:]:
        if n not in [p[0] for p in picked]:
            picked.append((n, f'#{n}'))
    picked.sort()
    return picked[:40]


def main():
    idx = R.get_index()
    spans, mapped, chap_of = match_chapters()
    print(f"chapters mapped: {len(mapped)}")
    sample = pick_sample(idx.hadiths, spans, chap_of)
    rows = []
    tally = {'hit': 0, 'hitfrag': 0, 'kindm': 0, 'broad': 0, 'miss': 0}
    last_cs_by_chap = {}
    order_viol = 0
    for num, name in sample:
        v, r, g, n_sites, why = verdict(idx, num, chap_of, spans)
        tally[v] += 1
        e = idx.pos_of.get(num, {})
        in_order = ''
        if e.get('found') and g:
            ch = chap_of[num][2]
            prev = last_cs_by_chap.get(ch)
            if prev is not None:
                in_order = 'ترتيب' if e['q_cs'] > prev else 'خلل-ترتيب'
                if e['q_cs'] <= prev:
                    order_viol += 1
            last_cs_by_chap[ch] = e['q_cs']
        pos = f"{r['char_start']}..{r['char_end']}" \
            if r['char_start'] is not None else '—'
        rows.append((num, name, r['confidence'],
                     r.get('kind') or '—', pos, v, n_sites, in_order, why))

    # إحصاءات الكتاب كله
    gfound = gingold = gmapped = 0
    invers = total_pairs = 0
    low_conf = []
    confs = {'high': 0, 'medium': 0, 'low': 0, 'none': 0}
    kinds = {'chain': 0, 'gap': 0, 'meaning': 0}
    for h in idx.hadiths:
        e = idx.pos_of.get(h['num'], {})
        confs[idx.lookup(h['num'])['confidence']] += 1
        t = chap_of[h['num']][2]
        g = spans.get(t)
        if not e.get('found'):
            continue
        gfound += 1
        kinds[e.get('kind', 'chain')] = kinds.get(e.get('kind', 'chain'), 0) + 1
        if g:
            gmapped += 1
            if g[0] <= e['q_cs'] <= (g[1] or 10 ** 12):
                gingold += 1
        if idx.lookup(h['num'])['confidence'] == 'low':
            low_conf.append((h['num'], t, e.get('kind')))
    # انقلابات الترتيب داخل الباب (مؤشر سوء اختيار الموضع المكرر)
    for t, g in spans.items():
        nums = [h['num'] for h in idx.hadiths
                if chap_of[h['num']][2] == t]
        ps = [idx.pos_of[n]['q_cs'] for n in nums
              if idx.pos_of.get(n, {}).get('found')]
        for i in range(len(ps)):
            for j in range(i + 1, len(ps)):
                total_pairs += 1
                if ps[j] <= ps[i]:
                    invers += 1

    n = len(rows)
    ar = {'hit': 'صحيح', 'hitfrag': 'صحيح-جزئي', 'kindm': 'صحيح (معنى)',
          'broad': 'واسع', 'miss': 'خاطئ'}
    w = []
    a = w.append
    a('# تقييم مُرجِع-حديث — دليل الفالحين شرح رياض الصالحين\n')
    a('الكتاب: ابن علان الصديقي (ت 1057هـ)، «دليل الفالحين لطرق رياض '
      'الصالحين» — OpenITI `Shamela0000140-ara1` (~683K كلمة منظّفة). '
      'المتن: رياض الصالحين `JK000073-ara2` — 1882 حديثاً مرقّماً.\n')
    a('**الأرضية الذهبية**: مطابقة عناوين «باب …» بين المتن والشرح '
      f"({len(mapped)} باباً مطابَقاً من 305). «صحيح» = الاقتباس داخل "
      'مقطع باب الحديث. «n_مواضع» = عناقيد الاقتباس الحرفي في الكتاب '
      'كله — مؤشر التكرار.\n')
    a('## الملخص\n')
    a('| الكتاب | عينة | صحيح | جزئي | معنى | واسع | خاطئ |')
    a('|---|---|---|---|---|---|---|')
    a(f"| riyad_salihin | {n} | {tally['hit']} | {tally['hitfrag']} | "
      f"{tally['kindm']} | {tally['broad']} | {tally['miss']} |")
    a('')
    a('### إحصاءات الكتاب كله\n')
    prec = f"{gingold}/{gmapped} = {gingold/gmapped:.0%}" \
        if gmapped else '—'
    a(f'- أحاديث لها موضع اقتباس: {gfound}/1882 '
      f'({gfound/1882:.0%}) — الباقي فجوة تقديرية أو بلا نتيجة')
    a(f'- من المحدَّد في باب مطابَق ({gmapped})، الواقع داخل بابه: '
      f'**{prec}**')
    a(f'- نوع الموضع: حرفي-chain {kinds["chain"]}، فجوة {kinds["gap"]}، '
      f'معنى {kinds["meaning"]}')
    a(f'- الثقة: عالية {confs["high"]}، وسطى {confs["medium"]}، '
      f'منخفضة {confs["low"]}، بلا {confs["none"]}')
    if total_pairs:
        a(f'- انقلابات الترتيب داخل الأبواب: {invers}/{total_pairs} '
          f'({invers/total_pairs:.0%}) — تسلسل مواضع الأحاديث داخل '
          'الباب الواحد مقابل ترتيبها في المتن')
    a(f'- مواضع الثقة المنخفضة ({len(low_conf)}): ' +
      '، '.join(str(x[0]) for x in low_conf[:40]) +
      ('…' if len(low_conf) > 40 else ''))
    a('')
    a('## جدول العينات\n')
    a('| الحديث | الاسم | الثقة | النوع | الموضع | مواضع اقتباس | '
      'ترتيب | الحكم | لماذا |')
    a('|---|---|---|---|---|---|---|---|---|')
    for num, name, conf, kind, pos, v, ns, io, why in rows:
        a(f'| {num} | {name} | {conf} | {kind} | {pos} | {ns} | '
          f'{io or "—"} | {ar[v]} | {why} |')
    a('')
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(w) + '\n')
    print({k: tally[k] for k in tally}, 'order_viol', order_viol)
    print(f"global in-gold {gingold}/{gmapped} "
          f"(of {gfound} found), invers {invers}/{total_pairs}")
    print('->', OUT)


if __name__ == '__main__':
    main()
