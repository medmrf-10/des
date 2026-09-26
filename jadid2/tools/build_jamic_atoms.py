"""مولّد فهرس ذرات جامع العلوم والحكم — يستهلك فهرس مُرجِع-الحديث.

كل نطاق «حديث + شرحه» الذي حدده مُرجِع (indexes/murji/jamic_ulum.json)
هو ذرة: 50 ذرة (الأربعون النووية 1-42 + زوائد ابن رجب 43-50) بمخطط
{series, sheikh, entries:[{id,title,inferred,file,char_start,char_end,tags}]}
داخل jadid2/atoms/jamic_ulum/.

العنوان = أول جملة من متن الحديث حرفياً من نص الكتاب (inferred=false):
بداية المتن = نهاية آخر فعل قول متسلسل في الإسناد (قال/قالت/يقول/فقال/تقول
بفجوة ≤6 كلمات) قبل موضع الاقتباس q_cs الذي حدده مُرجِع؛ ونهاية الجملة =
أول ترقيم/سطر جديد/تخريج (رواه/متفق عليه/أخرجه/خرجه/روي/حديث حسن)/فعل قول
داخل المتن، أو 160 حرفاً عند آخر مسافة — أيهما أسبق.

ملاحظة المواضع (مهمة): char_start/char_end إزاحات داخل «النص المنظّف»
الناتج عن _clean_openiti على ملف OpenITI الخام — لا داخل الملف الخام.
لذلك يُشحن النص المنظّف نفسه في data/text.txt.gz ليكون النطاق قابلاً
للاستعمال مباشرةً على ملف حقيقي، وبصمته sha256_16 تُطابَق مع الفهرس عند
التوليد فتكشف أي انحراف عن نسخة المصدر.

الاستخدام:
  python3 build_jamic_atoms.py                    # يولّد الفهرس + text.txt.gz + summary
  python3 build_jamic_atoms.py --verify 10 --seed 7   # عينة فحص
"""
import argparse
import gzip
import hashlib
import json
import os
import random
import re
import sys

_TOOLS = os.path.dirname(os.path.abspath(__file__))  # jadid2/tools
_JADID2 = os.path.dirname(_TOOLS)                    # jadid2
_REPO = os.path.dirname(_JADID2)                     # repo root

MURJI_DIR = os.path.join(_JADID2, 'murji', 'indexes', 'murji')
ENGINE_DIR = os.path.join(_JADID2, 'murji', 'engine')
ATOMS_DIR = os.path.join(_JADID2, 'atoms')
OUT_DIR = os.path.join(ATOMS_DIR, 'jamic_ulum')

sys.path.insert(0, ENGINE_DIR)
import lookup_hadith as _eng  # noqa: E402  (قراءة فقط — لا نعدّل المحرك)

SPEECH = {'قال', 'فقال', 'يقول', 'قالت', 'تقول', 'سأل', 'سأله', 'سألت'}
TAKHRIJ = {'رواه', 'متفق', 'أخرجه', 'خرجه', 'روي', 'حديث', 'صحيح'}
_CHAIN_GAP = 9          # أقصى فجوة (كلمات) لتسلسل أفعال القول في الإسناد
                      # («قال سمعت رسول الله ﷺ يقول» = 7 كلمات)
# ذيل الإسناد بعد آخر فعل قول: (اسم النبي)؟ + صلوات — يُتخطى لبداية المتن
_ISNAD_TAIL = re.compile(
    r'^\s*(?:(?:رسول الله|النبي|نبي الله|رسوله|رسول|عبده ورسوله)\s+)?'
    r'(?:صلى الله عليه وسلم|صلي الله عليه وسلم|صلى الله عليه وعلى آله وسلم'
    r'|صلى الله عليه وآله وسلم|عليه الصلاة والسلام|عليه السلام)\s*')
_TITLE_CAP = 200        # حد أقصى للعنوان عند غياب حدّ جملة
_TITLE_MIN = 12         # حد أدنى — إن قُصّت الجملة قبله نتجاوز الحد الأول


def clean_book_text():
    """النص المنظّف — نفس وصفة _clean_openiti في murji/engine (منسوخة لا مستوردة)."""
    p = os.path.join(_JADID2, 'murji', 'data', 'jamic_ulum_ibn_rajab.jk000071.txt.gz')
    raw = gzip.open(p, 'rt', encoding='utf-8').read()
    lines = raw.split('\n')
    i0 = 0
    for i, l in enumerate(lines):
        if '#META#Header#End#' in l:
            i0 = i + 1
            break
    out = []
    for l in lines[i0:]:
        l = re.sub(r'PageV\d+P\d+', ' ', l)
        l = re.sub(r'\bms\d+\b', ' ', l)
        if l.startswith('#'):
            out.append('\n' + l.lstrip('#').strip())
        elif l.startswith('~~'):
            out.append(' ' + l[2:])
        else:
            out.append('\n' + l)
    return ''.join(out)


_WORD_AR = re.compile(r'[؀-ۿ]+')


def matn_start(text, seg_cs, q_cs):
    """بداية متن الحديث داخل المقطع: نهاية آخر فعل قول متسلسل في الإسناد
    قبل موضع الاقتباس q_cs (التسلسل يحاكي «قال سمعت رسول الله ﷺ يقول»).
    حديث قدسي «قال الله تعالى …»: يشمل فعل القول نفسه في بداية العنوان."""
    marks = [(seg_cs + m.start(), seg_cs + m.end())
             for m in _WORD_AR.finditer(text[seg_cs:q_cs])
             if m.group(0) in SPEECH]
    if not marks:
        return None
    b, e = marks[0]
    for nb, ne in marks[1:]:
        if len(_WORD_AR.findall(text[e:nb])) <= _CHAIN_GAP:
            b, e = nb, ne
        else:
            break
    nxt = _WORD_AR.search(text, e, e + 20)
    if text[b:e] == 'قال' and nxt is not None and nxt.group(0) == 'الله':
        return b            # «قال الله تعالى» داخل المتن لا الإسناد
    tail = _ISNAD_TAIL.match(text[e:])  # «قال رسول الله ﷺ …»: تجاوز الذيل
    if tail:
        e += tail.end()
    # «فقال لي يا غلام»: ضمير التبليغ قبل النداء جزء من الإسناد
    m = re.match(r'\s*(?:لي|لنا|له|لها|لهم|لأبي|لأبيها)\s+', text[e:e + 30])
    if m and text[e + m.end():].startswith('يا'):
        e += m.end()
    return e


def _boundary_word(w, nxt):
    """هل الكلمة حدّ جملة (فعل قول أو تخريج)؟ واو العطف تُجرد؛
    «وفي رواية» و«برواية» تُحسب حدّاً (تخريج ابن رجب داخل المتن)."""
    s = w[1:] if w.startswith('و') and len(w) > 1 else w
    if s in SPEECH or s in TAKHRIJ:
        return True
    return s == 'في' and nxt == 'رواية'


def first_sentence(text, start, seg_ce):
    """أول جملة من المتن: إلى أول ترقيم/كلمة-حدّ (قال/رواه/…) أو غطّ الطول.
    -> (title, capped)"""
    limit = min(start + _TITLE_CAP, seg_ce)
    words = list(_WORD_AR.finditer(text, start, seg_ce))
    for j, m in enumerate(words):
        if m.start() >= limit:
            break
        nxt = words[j + 1].group(0) if j + 1 < len(words) else ''
        if j > 0 and _boundary_word(m.group(0), nxt):
            cut = text.rfind(' ', start, m.start() + 1)
            return text[start:cut if cut > start else m.start()].strip(), False
    for punc in ('\n', '؛', '،', '.', ':', '؟'):
        p = text.find(punc, start, limit)
        if p != -1:
            return text[start:p].strip(), False
    sp = text.rfind(' ', start, limit + 1)
    return text[start:sp if sp > start + _TITLE_MIN else limit].strip(), True


def build():
    idx = json.load(open(os.path.join(MURJI_DIR, 'jamic_ulum.json'),
                         encoding='utf-8'))
    text = clean_book_text()
    sha = hashlib.sha256(text.encode()).hexdigest()[:16]
    assert sha == idx['sha256_16'], (
        f'reconstructed sha {sha} != index {idx["sha256_16"]}')

    # مواضع الاقتباس q_cs من المحرك نفسه (بلا تعديل) لتحديد بداية المتن
    hadiths = _eng.build_hadiths('jamic50')
    eng = _eng.HadithIndex('jamic_ulum', hadiths)
    assert eng.sha == sha

    entries, stats = [], {
        'conf': {}, 'no_matn_marker': [], 'title_capped': 0,
        'kind': {},
    }
    for e in idx['entries']:
        num = e['num']
        stats['conf'][e['conf']] = stats['conf'].get(e['conf'], 0) + 1
        stats['kind'][e['kind']] = stats['kind'].get(e['kind'], 0) + 1
        p = eng.pos_of[num]
        q_cs = p.get('q_cs') if p.get('found') else None
        ms = matn_start(text, e['cs'], q_cs) if q_cs else None
        if ms is None:
            stats['no_matn_marker'].append(num)
            ms = e['cs']
        title, capped = first_sentence(text, ms, e['ce'])
        stats['title_capped'] += int(capped)
        assert title and title in text[e['cs']:e['ce']], num
        entries.append({
            'id': num,
            'title': title,
            'inferred': False,
            'file': 'jadid2/atoms/jamic_ulum/data/text.txt.gz',
            'char_start': e['cs'],
            'char_end': e['ce'],
            'tags': ['حديث', 'شرح', 'أربعون'],
        })
    index = {
        'series': 'jamic_ulum',
        'sheikh': 'ابن رجب',
        'entries': entries,
    }
    return index, stats, text


def write_outputs(index, stats, text, murji_idx):
    os.makedirs(os.path.join(OUT_DIR, 'data'), exist_ok=True)
    with gzip.open(os.path.join(OUT_DIR, 'data', 'text.txt.gz'),
                   'wt', encoding='utf-8') as f:
        f.write(text)
    with open(os.path.join(OUT_DIR, 'index.json'), 'w',
              encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=1)
    _write_summary(index, stats, text, murji_idx)


def _write_summary(index, stats, text, murji_idx):
    ents = index['entries']
    first_cs, last_ce = ents[0]['char_start'], ents[-1]['char_end']
    span = last_ce - first_cs
    covered = sum(e['char_end'] - e['char_start'] for e in ents)
    contiguous = all(ents[i]['char_end'] == ents[i + 1]['char_start']
                     for i in range(len(ents) - 1))
    conf = stats['conf']
    lines = [
        '# جامع العلوم والحكم (شرح الخمسين حديثاً) — فهرس الذرات',
        '',
        '- المصدر: `jadid2/murji/data/jamic_ulum_ibn_rajab.jk000071.txt.gz`'
        f' — OpenITI `{murji_idx["openiti"]}` (نسخة JK المنقّحة)',
        f'- النص المرجعي للمواضع: `data/text.txt.gz` — النص المنظّف'
        f' (sha256_16 `{murji_idx["sha256_16"]}` مطابِق لفهرس مُرجِع)',
        f'- الذرات: **{len(ents)}** من {murji_idx["n_hadiths"]} حديثاً'
        ' (الأربعون النووية 1-42 + زوائد ابن رجب 43-50) — 100%',
        f'- الثقة من مُرجِع: ' + ' · '.join(
            f'{k} {v}' for k, v in sorted(conf.items())),
        f'- النطاقات: {"متصلة بلا فجوات" if contiguous else "غير متصلة"}'
        f' من الحرف {first_cs} إلى {last_ce}'
        f' ({covered}/{span} حرفاً = مقاطع الأحاديث كاملة؛'
        f' مقدمة الكتاب 0-{first_cs} خارج الذرات)',
        '',
        '## عقد المواضع',
        '',
        '`char_start`/`char_end` إزاحات حرفية داخل `data/text.txt.gz`'
        ' المشحون هنا — وهو **النص المنظّف** الناتج عن وصفة مُرجِع'
        ' `_clean_openiti` على ملف OpenITI الخام، لا الملف الخام نفسه'
        ' (لذلك شُحّن النص ليكون النطاق قابلاً للاستعمال مباشرةً).'
        ' الوصفة (مطابقة للمحرك، والبصمة تُطابَق عند التوليد):',
        '',
        '```python',
        'raw = gzip.open("murji/data/jamic_ulum_ibn_rajab.jk000071.txt.gz",'
        ' "rt").read()',
        'lines = raw.split("\\n")',
        'i0 = index_of("#META#Header#End#") + 1   # إسقاط ترويسة OpenITI',
        'for l in lines[i0:]:',
        '    l = re.sub(r"PageV\\d+P\\d+", " ", l)   # وسوم الصفحات',
        '    l = re.sub(r"\\bms\\d+\\b", " ", l)      # وسوم المخطوط',
        '    out.append("\\n"+l.lstrip("#").strip() if l.startswith("#")',
        '               else " "+l[2:] if l.startswith("~~")',
        '               else "\\n"+l)',
        '```',
        '',
        'العنوان: أول جملة من متن الحديث حرفياً من نص الكتاب — من نهاية'
        ' سلسلة أفعال القول في الإسناد («قال سمعت رسول الله ﷺ يقول»)'
        ' إلى أول حدّ جملة (ترقيم/تخريج/فعل قول داخل المتن) بغطّ '
        f'{_TITLE_CAP} حرفاً. قدسيّات «قال الله تعالى» تشمل فعل القول.',
        '',
        '## أين يخفق',
        '',
        f'- العناوين المقصوصة بالغط ({stats["title_capped"]}): متن طويل'
        ' بلا حدّ جملة مبكر — العنوان بادئة حرفية لا الجملة كاملة.',
        '- موضع الاقتباس الذي يثبّته مُرجِع قد يقع داخل الشرح لا في المتن'
        ' المعروض أولاً (إعادة اقتباس، مثل 12 و23) — لا يؤثر في النطاق'
        ' ولا في العنوان (السلسلة تبدأ من أول فعل قول في الإسناد).',
        '- الوسم «أربعون» يشمل الزوائد 43-50 أيضاً (الكتاب هو شرح'
        ' الأربعين بزوائدها) — لم نُدخل وسم «زوائد» إبقاءً على التوحيد.',
        '- العنوان استنتاج-بنيوي (inferred=false لأنه مقطوع حرفياً من'
        ' النص، لكن بدايته تُقدَّر خوارزمياً): أسناد بلا فعل قول'
        f' صريح → {len(stats["no_matn_marker"])} حالة'
        + ('' if stats['no_matn_marker'] else ' (لا شيء — كل المقاطع'
           ' وجدت علامة قول).'),
        '- مقدمة الكتاب (الحرف 0 إلى أول حديث) ليست ذرة — خارج نطاق'
        ' فهرس مُرجِع بالتصميم.',
    ]
    with open(os.path.join(OUT_DIR, 'summary.md'), 'w',
              encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')


def verify(n=10, seed=None):
    """عينة عشوائية: بداية مقطع كل ذرة — يُفترض ترويسة/إسناد الحديث."""
    idx = json.load(open(os.path.join(MURJI_DIR, 'jamic_ulum.json'),
                         encoding='utf-8'))
    atoms = json.load(open(os.path.join(OUT_DIR, 'index.json'),
                           encoding='utf-8'))
    text = gzip.open(os.path.join(OUT_DIR, 'data', 'text.txt.gz'),
                     'rt', encoding='utf-8').read()
    sha = hashlib.sha256(text.encode()).hexdigest()[:16]
    assert sha == idx['sha256_16']
    rng = random.Random(seed)
    sample = rng.sample(atoms['entries'], min(n, len(atoms['entries'])))
    sample.sort(key=lambda e: e['id'])
    for e in sample:
        seg = text[e['char_start']:e['char_end']]
        head = seg[:150].replace('\n', ' ⏎ ')
        ok = 'الحديث' in seg[:200]
        print(f"== حديث {e['id']}  hdr={'نعم' if ok else '؟'}")
        print(f"   العنوان: {e['title']}")
        print(f"   البداية[{e['char_start']}:{e['char_end']}]: {head}")


def main():
    ap = argparse.ArgumentParser(description='توليد فهرس ذرات جامع العلوم')
    ap.add_argument('--verify', type=int, metavar='N', default=0)
    ap.add_argument('--seed', type=int, default=None)
    args = ap.parse_args()
    if args.verify:
        verify(args.verify, args.seed)
        return
    index, stats, text = build()
    murji_idx = json.load(open(os.path.join(MURJI_DIR, 'jamic_ulum.json'),
                             encoding='utf-8'))
    write_outputs(index, stats, text, murji_idx)
    c = stats['conf']
    print(f"jamic_ulum: {len(index['entries'])} ذرة — "
          f"ثقة {c} · نوع {stats['kind']} · "
          f"بلا علامة متن {stats['no_matn_marker']} · "
          f"عناوين بلغت الغط {stats['title_capped']}")


if __name__ == '__main__':
    main()
