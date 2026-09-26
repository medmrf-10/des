"""تابع مُرجِع-حديث — تطبيق المحرك على «دليل الفالحين» شرح رياض الصالحين.

لا يعدّل lookup_hadith.py بتاتاً: يسجّل كتاباً جديداً في BOOKS ويمرّر
corpus بُني من مصادر مستقلة:

  - المتن: riyad_salihin_nawawi.jk000073.txt.gz — رياض الصالحين للنووي،
    نسخة OpenITI JK000073 (دار الفكر 1421هـ) مرقّمة «# N وعن …» صراحة —
    1896 حديثاً بترقيمها الشائع.
  - الشرح: dalil_falihin_ibn_allan.shamela0000140.txt.gz — دليل الفالحين
    لطرق رياض الصالحين لابن علان الصديقي (ت 1057هـ)، نسخة الشاملة
    (12 مجلداً، ~6.7MB). أضخم اختبار ممكن: يشرح المتن عبارةً عبارةً
    بين قوسين فيكسر الاقتباس الحرفي المتصل.

بنية نسخة الشرح:
  ### $ N - باب …        ترويسة باب (أحياناً ### | : باب …)
  ### | <digits> -       فاصل وحدة: ترقيم شاملة «عالمي/محلي» ملتصقين —
                        لا يُعوَّل عليه؛ الأرضية على ترويسات الأبواب.
  (وعن فلان …) شرح …   الاقتباس مبعثر بين قوسين داخل الشرح.

الأرضية الذهبية للتقييم: مطابقة عناوين الأبواب بين نسختي المتن والشرح
(نصّية لا عددية — ترقيم الأبواب يختلف بين النسختين).

الاستخدام:
  python3 riyad_dalil.py index            # يكتب ../indexes/murji/riyad_salihin.json
  python3 riyad_dalil.py atoms            # يكتب ../../atoms/riyad_salihin_dalil/index.json
  python3 riyad_dalil.py lookup 371       # استرجاع مقطع حديث
  python3 riyad_dalil.py chapters         # فحص الأبواب المطابقة
"""
import argparse
import bisect
import gzip
import json
import os
import re
import sys

_ENGINE = os.path.dirname(os.path.abspath(__file__))
_JADID2 = os.path.dirname(os.path.dirname(_ENGINE))
_REPO = os.path.dirname(_JADID2)
sys.path.insert(0, os.path.join(_JADID2, 'tools'))
import lookup_hadith as L  # noqa: E402  المحرك — لا يُعدَّل

RIYAD_SRC = 'riyad_salihin_nawawi.jk000073.txt.gz'
DALIL_SRC = 'dalil_falihin_ibn_allan.shamela0000140.txt.gz'

L.BOOKS['riyad_salihin'] = {
    'file': DALIL_SRC,
    'title': 'دليل الفالحين لطرق رياض الصالحين',
    'author': 'ابن علان الصديقي (ت 1057هـ)',
    'openiti': '1057IbnCallan.DalilFalihin.Shamela0000140-ara1',
    'url': 'https://raw.githubusercontent.com/OpenITI/1075AH/master/'
           'data/1057IbnCallan/1057IbnCallan.DalilFalihin/'
           '1057IbnCallan.DalilFalihin.Shamela0000140-ara1',
    'corpus': 'riyad1896',
}


# ---------- المتن: رياض الصالحين JK ----------

_H_MARK = re.compile(r'^#\s+(\d+)\s+(?!-\s*باب)')
_BAB_MARK = re.compile(r'^#\s*\|\s*(?:\+\s*\*\s*)?(?:(\d+)\s*-\s*)?'
                       r'(كتاب|باب)\s*(.*)')

_STOP_T = set(L._STOP)


def _load_src(name):
    p = os.path.join(L.DATA_DIR, name)
    op = gzip.open if p.endswith('.gz') else open
    with op(p, 'rt', encoding='utf-8') as f:
        return f.read()


def _strip_openiti(seg):
    seg = re.sub(r'PageV\d+P\d+', ' ', seg)
    seg = re.sub(r'\bms\d+\b', ' ', seg)
    return seg.replace('~~', ' ')


def load_riyad():
    """يقرأ نسخة JK المرقّمة.

    -> (hadiths, chapters, chap_of)
    hadiths: {num: raw_txt} — كل مدخل «# N <نص>» حتى المدخل التالي أو
             ترويسة باب/كتاب (عدّة مداخل متتابعة لنفس N تُدمج).
    chapters: [(line_i, kind, title)]
    chap_of: {num: (line_i, kind, title)} — باب كل حديث.
    """
    raw = _load_src(RIYAD_SRC)
    i0 = raw.find('#META#Header#End#')
    if i0 >= 0:
        raw = raw[raw.index('\n', i0) + 1:]
    lines = raw.split('\n')
    starts = []            # (line_i, num)
    chapters = []          # (line_i, kind, title)
    for i, l in enumerate(lines):
        bm = _BAB_MARK.match(l)
        if bm:
            chapters.append((i, bm.group(2), bm.group(3).strip()))
            continue
        if _H_MARK.match(l):
            n = int(_H_MARK.match(l).group(1))
            if 1 <= n <= 2000:
                starts.append((i, n))
    chap_lines = [c[0] for c in chapters]
    hadiths = {}
    order = []
    for k, (i, n) in enumerate(starts):
        j = starts[k + 1][0] if k + 1 < len(starts) else len(lines)
        ci = bisect.bisect_right(chap_lines, i)
        if ci < len(chap_lines) and chap_lines[ci] < j:
            j = chap_lines[ci]
        body = '\n'.join([re.sub(r'^#\s*\d+\s*', '', lines[i])] +
                         [lines[t] for t in range(i + 1, j)])
        body = _strip_openiti(body).strip()
        if n in hadiths:                      # مدخل ثانٍ لنفس الرقم
            hadiths[n] += '\n' + body
        else:
            hadiths[n] = body
            order.append(n)
    chap_of = {}
    for i, n in starts:
        k = bisect.bisect_right(chap_lines, i) - 1
        if n not in chap_of:
            chap_of[n] = chapters[k] if k >= 0 else (0, 'باب', '')
    return hadiths, chapters, chap_of


def _first_sent(raw):
    """أول جملة حرفية من النص (بلا تطبيع) — حتى وقف أو ~80 حرفاً."""
    m = re.split(r'(?<=[.:؟!])\s', raw.strip(), maxsplit=1)
    s = re.sub(r'\s+', ' ', m[0])
    return s[:90].strip()


def build_riyad_hadiths():
    """-> engine-shaped [{'ref','num','label','variants','raw','chap'}]

    variants[0] = متن النسخة JK (بعد _matn_cut لعزل المتن عن الإسناد
    والتخريج)؛ ثم روايات بديلة من الكتب الستة باحتواء idf≥0.5
    (نفس وصفة المحرك)."""
    hadiths, _ch, chap_of = load_riyad()
    six = L.load_six()
    cidx = L.CorpusIndex(six)
    out = []
    for num in sorted(hadiths):
        raw = hadiths[num]
        matn = L._matn_cut(raw)
        vt = L._tokens(matn)
        if len(vt) < 3:
            vt = L._tokens(raw)
        variants, seen = [], set()
        if vt:
            seen.add(tuple(vt))
            variants.append(vt)
        for cov, (slug, hn, mtoks) in cidx.match(
                vt, min_cov=0.5, cap=4):
            tt = tuple(mtoks)
            if tt not in seen and len(tt) >= 4:
                seen.add(tt)
                variants.append(list(tt))
        out.append({'ref': f'riyad:{num}', 'num': num,
                    'label': f'رياض {num}', 'variants': variants,
                    'raw': raw,
                    'chap': chap_of[num][2]})
    return out


# ---------- الأبواب في نص الشرح المنظّف ----------

def clean_with_map(raw):
    """نفس _clean_openiti لكن مع خريطة سطر-خام→موضع في النص الناتج.
    -> (text, offs)  بحيث offs[i] = موضع بداية السطر الخام رقم i."""
    lines = raw.split('\n')
    i0 = 0
    for i, l in enumerate(lines):
        if '#META#Header#End#' in l:
            i0 = i + 1
            break
    parts, offs = [], []
    cur = 0
    for ln in lines[i0:]:
        l2 = re.sub(r'PageV\d+P\d+', ' ', ln)
        l2 = re.sub(r'\bms\d+\b', ' ', l2)
        if l2.startswith('#'):
            seg = '\n' + l2.lstrip('#').strip()
        elif l2.startswith('~~'):
            seg = ' ' + l2[2:]
        else:
            seg = '\n' + l2
        offs.append(cur)
        parts.append(seg)
        cur += len(seg)
    return ''.join(parts), offs


_BAB_CLEAN = re.compile(r'(?:^|\n)\s*[$|]\s*(?:\d+\s*-\s*)?:?\s*'
                        r'(باب[^\n]{0,140})')


def dalil_chapters():
    """[(char_pos, title)] — ترويسات الأبواب في النص المنظّف."""
    text = L.load_book_text('riyad_salihin')
    return [(m.start(1), m.group(1).strip())
            for m in _BAB_CLEAN.finditer(text)]


# ---------- الفهرس ----------

class RiyadIndex(L.HadithIndex):
    """نفس محرك lookup_hadith — فرّع للتوسّع على كتاب ضخم فقط:
    يسقط n-gram «المرجلية» (الموجودة في >ngram_maxdf صيغة متن) من
    بذور المرشحات. ألفاظ كـ«صلي الله عليه»/«قال ابو عيسي هذا حديث
    حسن» تتكرر في مئات المتون وتخلق ملايين المرشحات الوهمية في نص
    683K كلمة؛ إسقاطها لا يغيّر دلالة النتائج (run بطول 2-3 مشترك بين
    مئات الأحاديث ليس مميزاً) ويبقي بناء الفهرس ممكناً ذاكرةً وزمنًا."""

    ngram_maxdf = 10

    def _patterns(self):
        pat3, pat2 = super()._patterns()
        df3, df2 = {}, {}
        for h in self.hadiths:
            for V in h['variants']:
                for q in range(len(V) - 2):
                    p = ' '.join(V[q:q + 3])
                    df3[p] = df3.get(p, 0) + 1
                for q in range(len(V) - 1):
                    p = ' '.join(V[q:q + 2])
                    df2[p] = df2.get(p, 0) + 1
        n3 = self.ngram_maxdf
        pat3 = {p: c for p, c in pat3.items() if df3.get(p, 0) <= n3}
        pat2 = {p: c for p, c in pat2.items() if df2.get(p, 0) <= n3}
        self._dbg_pat = {'pat3': len(pat3), 'pat2': len(pat2)}
        return pat3, pat2


def get_index():
    hadiths = build_riyad_hadiths()
    return RiyadIndex('riyad_salihin', hadiths)


def cmd_index():
    idx = get_index()
    os.makedirs(L.INDEX_DIR, exist_ok=True)
    out = os.path.join(L.INDEX_DIR, 'riyad_salihin.json')
    d = idx.to_json()
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False)
    print(f"riyad_salihin: {d['n_located']}/{d['n_hadiths']} located, "
          f"dbg={idx._dbg} pat={getattr(idx,'_dbg_pat',{})} -> {out}")
    return idx


def cmd_atoms(idx=None):
    if idx is None:
        idx = get_index()
    entries = []
    for h in idx.hadiths:
        num = h['num']
        e = idx.pos_of.get(num, {})
        r = idx.lookup(num)
        if not e.get('found') or r['char_start'] is None:
            continue
        entries.append({
            'id': str(num),
            'title': _first_sent(h['raw']),
            'inferred': e.get('kind') == 'meaning',
            'file': os.path.join(
                'jadid2/murji/data', DALIL_SRC).replace('\\', '/'),
            'char_start': r['char_start'],
            'char_end': r['char_end'],
            'tags': ['حديث', 'رياض الصالحين', 'شرح',
                     'دليل الفالحين', f"ثقة:{r['confidence']}"],
        })
    outd = os.path.join(_JADID2, 'atoms', 'riyad_salihin_dalil')
    os.makedirs(outd, exist_ok=True)
    data = {'series': 'riyad_salihin_dalil',
            'sheikh': 'ابن علان الصديقي (ت 1057هـ)',
            'entries': entries}
    with open(os.path.join(outd, 'index.json'), 'w',
              encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)
    print(f"atoms: {len(entries)} -> {outd}/index.json")


def cmd_lookup(num):
    idx = get_index()
    r = idx.lookup(num)
    ex = r.get('excerpt') or ''
    r['excerpt'] = ex[:600]
    print(json.dumps(r, ensure_ascii=False, indent=2))


def cmd_chapters():
    ch = dalil_chapters()
    print(f'{len(ch)} chapter headers in dalil text')
    for p, t in ch[:40]:
        print(p, '|', t[:80])


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('index')
    sub.add_parser('atoms')
    lp = sub.add_parser('lookup')
    lp.add_argument('num', type=int)
    sub.add_parser('chapters')
    args = ap.parse_args()
    {'index': cmd_index, 'atoms': cmd_atoms,
     'lookup': lambda: cmd_lookup(args.num),
     'chapters': cmd_chapters}[args.cmd]()


if __name__ == '__main__':
    main()
