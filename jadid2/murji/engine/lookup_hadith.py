"""مُرجِع-حديث — محرك «حديث + كتاب شرح ← مقطع النص الدقيق».

النظير الحديثي لـ lookup.py (الذي يعمل على آية+تفسير). الفروق الجوهرية:

  - الآية لها لفظ واحد محرّر؛ الحديث يُقتبس بصيغ متعددة (رواية مختلفة،
    اختصار، اقتباس بالمعنى) ولا «رقم عالمي» دائماً — فالمدخل رقم داخل
    الكتاب أو نص حر.
  - سياق الاستشهاد يختلف: ليس «قوله تعالى» بل «قال رسول الله»، «حدثنا»،
    «عن فلان قال»، وتوقيع «رواه فلان/متفق عليه» *بعد* المتن لا قبله.
  - حدود المقاطع في كتب الشروح الحديثية ترويسات «الحديث الأول/الثاني…»
    لا «سورة X».

المصادر (كلها داخل الريبو + ملف OpenITI ملتزم في data/):
  - متون الأربعين:      hadith/nawawi.js  (نص النووي كما طبعه ابن رجب)
  - صيغ الحديث الأخرى:  wahy/data/hadith/{bukhari,muslim,...}.json.gz
                        (حقل x = متن بلا إسناد — روايات بديلة لنفس الحديث)
  - كتاب الشرح:         jadid2/murji/data/jamic_ulum_ibn_rajab.jk000071.txt.gz
                        جامع العلوم والحكم لابن رجب (ت 795هـ) — OpenITI
                        0795IbnRajabHanbali.JamicCulumWaHikam.JK000071-ara1
                        (نسخة JK المنقّحة بلا هوامش/فهارس)

الخوارزمية:
  أ) تنظيف OpenITI: إسقاط #META#، فكّ ~~، حذف PageVxxPyyy/msNNN → نص متصل.
  ب) مرشحو الاقتباس: 3/2-grams لكل *صيغة* من صيغ الحديث (متن النووي +
     روايات الكتب الستة المطابقة باحتواء idf≥0.5) → مسح واحد → تمديد كل
     إصابة لأطول مقطع متصل. نقاط الاستشهاد: «قال رسول الله/النبي/حدثنا/
     عن فلان قال» قبل الاقتباس، و«رواه/أخرجه/متفق عليه» بعده.
  ج) اختيار عالمي: أطول سلسلة مواقيت متزايدة موزونة (Fenwick DP) على
     ترتيب أحاديث الكتاب — موضع الخطأ يُسقِط نفسه.
  د) كشف المعنى: حديث بلا لفظ مطابق ← نافذة منزلقة بين الجارين المحددين
     تقيس احتواء كلمات المحتوى الموزونة بـidf؛ عند بلوغ العتبة يُرجَع
     الموضع بثقة low وkind=meaning — موثّق لا مموّه.
  هـ) المقطع: من ترويسة «الحديث N» إن وُجدت (وإلا بداية الاقتباس/الإسناد)
     إلى بداية مقطع الحديث التالي.

الناتج: {file, char_start, char_end, excerpt, confidence, kind}
كل موضع قابل للتحقق: offsets داخل النص المنظّف (sha256 مسجّل).

CLI:
  python3 lookup_hadith.py index --book jamic_ulum
  python3 lookup_hadith.py lookup --book jamic_ulum 17
  python3 lookup_hadith.py lookup --book jamic_ulum --text "إنما الأعمال"
"""
import argparse
import bisect
import gzip
import hashlib
import json
import math
import os
import re
import sys

_ENGINE = os.path.dirname(os.path.abspath(__file__))   # jadid2/murji/engine
_JADID2 = os.path.dirname(os.path.dirname(_ENGINE))    # jadid2
_REPO = os.path.dirname(_JADID2)                       # repo root
sys.path.insert(0, os.path.join(_JADID2, 'tools'))
from norm import norm as _norm  # noqa: E402  نفس وصفة jadid2/tools

DATA_DIR = os.path.join(os.path.dirname(_ENGINE), 'data')
INDEX_DIR = os.path.join(os.path.dirname(_ENGINE), 'indexes', 'murji')
NAWAWI_JS = os.path.join(_REPO, 'hadith', 'nawawi.js')
SIX = [os.path.join(_REPO, 'wahy', 'data', 'hadith', s + '.json.gz')
       for s in ('bukhari', 'muslim', 'tirmidhi', 'abi-dawud',
                 'nasai', 'ibn-majah')]

# كتب الشرح المدعومة: ملف نصي (gz أو خام) داخل data/
BOOKS = {
    'jamic_ulum': {
        'file': 'jamic_ulum_ibn_rajab.jk000071.txt.gz',
        'title': 'جامع العلوم والحكم في شرح خمسين حديثا',
        'author': 'ابن رجب الحنبلي (ت 795هـ)',
        'openiti': '0795IbnRajabHanbali.JamicCulumWaHikam.JK000071-ara1',
        'url': 'https://raw.githubusercontent.com/OpenITI/0800AH/master/'
               'data/0795IbnRajabHanbali/0795IbnRajabHanbali.JamicCulumWaHikam/'
               '0795IbnRajabHanbali.JamicCulumWaHikam.JK000071-ara1',
        # الأحاديث 1-42 = الأربعين النووية بترتيبها؛ 43-50 = زوائد ابن رجب
        'corpus': 'jamic50',
    },
}

# بذور أحاديث ابن رجب الزائدة (43-50) — عبارة مميزة من متنها المعروف،
# تُلتقط منها الرواية الكاملة من الكتب الستة عند بناء الفهرس (لا تُستعمل
# نصوص الكتاب نفسه حتى لا تكون الأرضية دائرية).
EXTRA_SEEDS = {
    43: 'الحقوا الفريض باهلها فما ابقت الفريض فلاولي رجل ذكر',
    44: 'الرضاعه تحرم ما تحرم الولاده',
    45: 'ان الله حرم بيع الخمر والميته والخنزير والاصنام',
    46: 'كل مسكر حرام',
    47: 'ما ملا ابن ادم وعاء شرا من بطن',
    48: 'اربع من كن فيه كان منافقا',
    49: 'لو انكم توكلون علي الله حق توكله لرزقكم كما يرزق الطير',
    50: 'لا يزال لسانك رطبا من ذكر الله',
}

_WORD = re.compile(r'\S+')

# علامات الاستشهاد الحديثي (مطبَّعة): قوية قبل المتن / توقيع بعده
_PRE_STRONG = re.compile(
    r'(قال|يقول)\s+(رسول|نبي)\s+الله|'
    r'سمعت\s+(رسول|النبي)|'
    r'(عن|ان)\s+(النبي|رسول)\s+الله|'
    r'(عن|سمعت)\s+(النبي|رسول)\s+الله?\s+صلي|'
    r'قال\s+صلي\s+الله\s+عليه|'
    r'عليه\s+(و?سلم|السلام)\s+(قال|يقول|ان)|'
    r'(حدثنا|اخبرنا|انبانا|حدثني)\s+(ان|عن)')
_POST_MARK = {'رواه', 'اخرجه', 'خرجه', 'روي', 'متفق', 'اجمع',
              'اخرجاه', 'خرجاه', 'روياه'}

CTX_BACK = 26          # كلمات النظر خلف الاقتباس لصيد علامة الإسناد
CTX_FWD = 10           # كلمات النظر بعد الاقتباس لصيد «رواه فلان»
ACCEPT = 4.0           # عتبة قبول مرشح عام
MIN_RUN = 4            # أدنى طول سلسلة مطابقة للقبول في ملء الفجوات
MEANING_MIN = 0.38     # احتواء idf لنوافذ «الاقتباس بالمعنى»
MAX_VARIANTS = 5       # أقصى صيغ لكل حديث (متن النووي + روايات)

_STOP = set(_norm(
    'عن ان انه انها في ما من على الي الى او و قال يقول صلي الله عليه '
    'وسلم رضي عنه عنها عنهما هو هي كان كانت ثم قد لا لم لن ليس كل التي '
    'الذي الذين اذا هذه هذا ذلك فكان فقال يا بن ابن'
).split())


def _tokens(s):
    return _norm(s).split()


# ---------- مصادر الحديث ----------

_TAIL = re.compile(
    r'(رواه|روي|روينا|اخرجه|خرجه|متفق\s+عليه|اجمع|خرجاه|اخرجاه|'
    r'حديث\s+(حسن|صحيح|غريب)|هذا\s+حديث|رقم)')


def _matn_cut(arabic):
    """قطع المتن من نص الحديث الكامل (إسناد+متن+تخريج):
    التخريج يبدأ عند أول «رواه/حديث حسن/…»، والمتن يبدأ بعد آخر
    «قال/يقول» *قبل* التخريج (لا بعد آخر قال مطلقاً — وقال الترمذي
    ونحوه تُستثنى لأنها داخل التخريج)."""
    s = _norm(arabic)
    marks = [m.end() for m in re.finditer(r'(قال|يقول)', s)]
    anchor = marks[0] if marks else 0
    t = _TAIL.search(s, anchor)
    end = t.start() if t else len(s)
    start = max((m for m in marks if m < end), default=anchor)
    m = s[start:end].strip(' "«»،؛:.')
    return m if len(m.split()) >= 3 else s.strip()


def load_nawawi40():
    """-> {n: full_text} من hadith/nawawi.js داخل الريبو."""
    raw = open(NAWAWI_JS, encoding='utf-8').read()
    i = raw.index('[')
    d, _ = json.JSONDecoder().raw_decode(raw[i:])
    return {h['n']: h['t'] for h in d}


def load_six():
    """متون الكتب الستة (حقل x بلا إسناد) → [(slug, n, toks)]."""
    out = []
    for p in SIX:
        if not os.path.exists(p):
            continue
        slug = os.path.basename(p).split('.')[0]
        d = json.load(gzip.open(p, 'rt', encoding='utf-8'))
        for h in d.get('h', []):
            t = _tokens(h.get('x', ''))
            if t:
                out.append((slug, h.get('n'), t))
    return out


class CorpusIndex:
    """فهرس idf/نشر على متون الكتب الستة — لجمع الروايات البديلة."""

    def __init__(self, mats):
        self.mats = mats
        self.N = len(mats)
        df = {}
        for _, _, t in mats:
            for w in set(t):
                df[w] = df.get(w, 0) + 1
        self.df = df
        self.post = {}
        for i, (_, _, t) in enumerate(mats):
            for w in set(t):
                self.post.setdefault(w, []).append(i)

    def idf(self, w):
        return math.log((self.N + 1) / (self.df.get(w, 0) + 1)) + 0.5

    def match(self, matn_toks, min_cov=0.45, cap=8):
        """أقرب متون الستة: احتواء كلمات المحتوى الموزونة ≥ min_cov."""
        rare = sorted({w for w in matn_toks if w not in _STOP},
                      key=lambda w: self.df.get(w, 10 ** 9))[:7]
        if not rare:
            return []
        cand = set()
        for w in rare:
            cand.update(self.post.get(w, ()))
        denom = sum(self.idf(w) for w in set(matn_toks) if w not in _STOP)
        denom = denom or 1e-6
        scored = []
        for i in cand:
            inter = {w for w in set(matn_toks) & set(self.mats[i][2])
                     if w not in _STOP}
            cov = sum(self.idf(w) for w in inter) / denom
            if cov >= min_cov:
                scored.append((cov, i))
        scored.sort(reverse=True)
        return [(cov, self.mats[i]) for cov, i in scored[:cap]]


def build_hadiths(corpus_name='jamic50'):
    """-> [{'ref','num','label','variants':[toks,...]}]

    jamic50: الأربعون النووية (1-42) من hadith/nawawi.js + زوائد ابن رجب
    (43-50) ملتقطة من الكتب الستة ببذور EXTRA_SEEDS. لكل حديث تُجمَع
    روايات بديلة (صيغ أخرى من الكتب الستة باحتواء ≥0.5) لأن الشرح قد
    يقتبس رواية غير لفظ النووي."""
    assert corpus_name == 'jamic50', corpus_name
    naw = load_nawawi40()
    six = load_six()
    cidx = CorpusIndex(six)
    out = []
    for num in range(1, 51):
        ref = f'jamic:{num}'
        seed_only = False
        if num <= 42:
            matn = _matn_cut(naw[num])
            label = f'نووي {num}'
        else:
            hits = cidx.match(_tokens(EXTRA_SEEDS[num]), min_cov=0.4,
                              cap=2)
            if not hits:
                matn = EXTRA_SEEDS[num]
                label = f'زائدة {num} (بذرة فقط)'
                seed_only = True
            else:
                cov, (slug, hn, mtoks) = hits[0]
                matn = ' '.join(mtoks)
                label = f'زائدة {num} ≈ {slug}:{hn} (cov {cov:.0%})'
        variants, seen = [], set()
        t = tuple(_tokens(matn))
        if t:
            seen.add(t)
            variants.append(list(t))
        if not seed_only:
            for cov, (slug, hn, mtoks) in cidx.match(
                    variants[0], min_cov=0.5, cap=MAX_VARIANTS):
                tt = tuple(mtoks)
                if tt not in seen and len(tt) >= 4:
                    seen.add(tt)
                    variants.append(list(tt))
        out.append({'ref': ref, 'num': num, 'label': label,
                    'variants': variants, 'seed_only': seed_only})
    return out


# ---------- تنظيف نص OpenITI وإعادة البناء ----------

def _clean_openiti(raw):
    """OpenITI → نص متصل: يسقط #META#، يفك ~~، يحذف PageV/ms،
    ويُبقي أسطر «# ...» كنص عادي (فيها ترويسات «الحديث N»)."""
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


def book_path(book):
    p = os.path.join(DATA_DIR, BOOKS[book]['file'])
    if not os.path.exists(p):
        raise FileNotFoundError(f'no book file for {book}: {p}')
    return p


def load_book_text(book):
    p = book_path(book)
    op = gzip.open if p.endswith('.gz') else open
    with op(p, 'rt', encoding='utf-8') as f:
        raw = f.read()
    return _clean_openiti(raw)


def tokenize(text):
    """-> (norm_tokens, char_start[], char_end[])."""
    toks, cs, ce = [], [], []
    for m in _WORD.finditer(text):
        t = _norm(m.group(0))
        if t:
            toks.append(t)
            cs.append(m.start())
            ce.append(m.end())
    return toks, cs, ce


# ---------- ترويسات «الحديث N» ----------

_ONES = {'اول': 1, 'واحد': 1, 'ثان': 2, 'ثاني': 2, 'ثالث': 3, 'رابع': 4,
         'خامس': 5, 'سادس': 6, 'سابع': 7, 'ثامن': 8, 'تاسع': 9,
         'عاشر': 10, 'حادي': 1, 'حاديه': 1}
_TENS = {'عشرون': 20, 'عشرين': 20, 'ثلاثون': 30, 'ثلاثين': 30,
         'اربعون': 40, 'اربعين': 40, 'خمسون': 50, 'خمسين': 50}


def _sal(w):
    if w.startswith('وال'):
        return w[3:]
    if w.startswith('ال'):
        return w[2:]
    return w


def _ord_val(w):
    w = _sal(w)
    if w in _TENS:
        return _TENS[w]
    if w in _ONES:
        return _ONES[w]
    if w.endswith('عشر') and w[:-3] in _ONES:
        return 10 + _ONES[w[:-3]]
    return None


def header_positions(toks):
    """-> {num: token_pos} أول ظهور لترويسة «الحديث N».
    الإشارات الراجعة داخل الشرح («في شرح الحديث الأول») تُستبعد
    بقاعدة أول-ظهور بعد تحقق الترتيب."""
    pos = {}
    n = len(toks)
    for i in range(n - 1):
        if toks[i] != 'الحديث':
            continue
        v = None
        if i + 2 < n:
            u = _ONES.get(_sal(toks[i + 1]))
            w2 = _sal(toks[i + 2])
            if u and w2 == 'عشر':
                v = 10 + u
            elif u:
                t = _TENS.get(w2)
                if t:
                    v = u + t
        if v is None:
            v = _ord_val(toks[i + 1])
        if v and 1 <= v <= 60 and v not in pos:
            pos[v] = i
    return pos


# ---------- نقاط سياق الاستشهاد ----------

def _citation_score(toks, cs, g0, g1):
    """علامة قوية قبلها ≤ CTX_BACK = 3؛ «عن» قريبة = 1؛
    توقيع «رواه/خرجه» بعدها ≤ CTX_FWD = 2."""
    score, marks = 0.0, []
    lo = max(0, g0 - CTX_BACK)
    seg = ' '.join(toks[lo:g0])
    m = list(_PRE_STRONG.finditer(seg))
    if m:
        score += 3.0
        marks.append('isnad:' + m[-1].group(0).strip())
    elif 'عن' in toks[max(0, g0 - 6):g0]:
        score += 1.0
        marks.append('an')
    hi = min(len(toks), g1 + CTX_FWD)
    if any(t in _POST_MARK for t in toks[g1:hi]):
        score += 2.0
        marks.append('rawah')
    return score, marks


# ---------- الفهرس ----------

class HadithIndex:
    """فهرس مواضع الأحاديث داخل كتاب شرح واحد."""

    def __init__(self, book, hadiths):
        self.book = book
        self.hadiths = hadiths                # بترتيب الكتاب
        self.hidx = {h['num']: i for i, h in enumerate(hadiths)}
        self.text = load_book_text(book)
        self.sha = hashlib.sha256(self.text.encode()).hexdigest()[:16]
        self.toks, self.cs, self.ce = tokenize(self.text)
        self.hdr = header_positions(self.toks)   # num -> token pos
        self.pos_of = {}                    # num -> rec | None
        self._build()

    # ----- بناء -----

    def _patterns(self):
        """pat -> [(hi, vi, qoff)] — أوفستات لكل صيغة على حدة."""
        pat3, pat2 = {}, {}
        for hi, h in enumerate(self.hadiths):
            for vi, V in enumerate(h['variants']):
                for q in range(len(V) - 2):
                    pat3.setdefault(' '.join(V[q:q + 3]),
                                    []).append((hi, vi, q))
                for q in range(len(V) - 1):
                    pat2.setdefault(' '.join(V[q:q + 2]),
                                    []).append((hi, vi, q))
        return pat3, pat2

    def _extend(self, i, V, q0v, lo_tok, hi_tok):
        """من إصابة (i في الكتاب، q0v في الصيغة V): امتدّ للأمام والخلف."""
        g0, q0 = i, q0v
        while q0 > 0 and g0 > lo_tok and self.toks[g0 - 1] == V[q0 - 1]:
            g0 -= 1
            q0 -= 1
        g1, q1 = i + 1, q0v + 1
        while q1 < len(V) and g1 < hi_tok and self.toks[g1] == V[q1]:
            g1 += 1
            q1 += 1
        return g0, g1, q0, q1

    def _runs_for(self, hi, lo_tok, hi_tok, cands):
        """أفضل run لكل موضع بداية: جرّب كل صيغة وأبق الأطول."""
        best_of = {}                        # g0 -> rec
        for i, vi, qoff in cands:
            V = self.hadiths[hi]['variants'][vi]
            g0, g1, q0, q1 = self._extend(i, V, qoff, lo_tok, hi_tok)
            run = q1 - q0
            if run < 2 or g0 <= lo_tok or g0 >= hi_tok:
                continue
            if g0 in best_of and best_of[g0][3] >= run:
                continue
            best_of[g0] = (g0, g1, q0, run, vi)
        out = []
        for g0, (g, g1, q0, run, vi) in sorted(best_of.items()):
            msc, marks = _citation_score(self.toks, self.cs, g, g1)
            score = msc + min(run, 24) + (1.5 if q0 == 0 else 0.0)
            rec = {'g0': g, 'g1': g1, 'q0': q0, 'run': run,
                   'msc': msc, 'marks': marks, 'vi': vi,
                   'kind': 'literal'}
            out.append((g, score, rec))
        return out

    def _build(self):
        pat3, pat2 = self._patterns()
        toks, last = self.toks, len(self.toks)
        cands = {}                          # hi -> [(i, vi, qoff)]
        for i in range(last):
            if i + 2 < last:
                for c in pat3.get(
                        toks[i] + ' ' + toks[i + 1] + ' ' + toks[i + 2],
                        ()):
                    cands.setdefault(c[0], []).append((i, c[1], c[2]))
            if i + 1 < last:
                for c in pat2.get(toks[i] + ' ' + toks[i + 1], ()):
                    cands.setdefault(c[0], []).append((i, c[1], c[2]))

        # أ) تسجيل المرشحات ببوابة خفيفة
        scored = []
        coords = set()
        for hi in range(len(self.hadiths)):
            lst = []
            for g0, sc, rec in self._runs_for(hi, 0, last,
                                              cands.get(hi, ())):
                if not (rec['run'] >= 4 or rec['msc'] >= 3.0 or
                        (rec['run'] >= 3 and rec['msc'] >= 1.0)):
                    continue
                lst.append((g0, sc, rec))
                coords.add(g0)
            scored.append(lst)

        # ب) أطول سلسلة متزايدة موزونة (Fenwick prefix-max)
        uniq = sorted(coords)
        idx_of = {p: j for j, p in enumerate(uniq)}
        size = len(uniq)
        bit = [0.0] * (size + 2)
        who = [None] * (size + 2)
        node = {}
        best_node, best_val = None, 0.0
        for hi in range(len(self.hadiths)):
            for g0, sc, rec in scored[hi]:
                x = idx_of[g0]
                v, par = 0.0, None
                while x > 0:
                    if bit[x] > v:
                        v, par = bit[x], who[x]
                    x -= x & -x
                node[(hi, g0)] = (sc + v, par, rec)
            for g0, sc, rec in scored[hi]:
                dp = node[(hi, g0)][0]
                x = idx_of[g0] + 1
                while x <= size:
                    if dp > bit[x]:
                        bit[x] = dp
                        who[x] = (hi, g0)
                    x += x & -x
                if dp > best_val:
                    best_val, best_node = dp, (hi, g0)
        pos = {}
        located = []
        cur = best_node
        while cur:
            pos[cur[0]] = node[cur][2]
            located.append(cur[0])
            cur = node[cur][1]
        located.sort()
        self._dbg = {'chain': len(located), 'gap': 0, 'meaning': 0,
                     'with_cands': sum(1 for v in cands.values() if v)}

        # ج) ملء الفجوات: أول مرشح مقبول بين المحددين، وإلا كشف معنى
        for hi in range(len(self.hadiths)):
            if hi in pos:
                continue
            j = bisect.bisect_right(located, hi)
            lo = pos[located[j - 1]]['g0'] if j else 0
            hib = pos[located[j]]['g0'] if j < len(located) else last
            got = None
            for g0, sc, rec in self._runs_for(hi, lo, hib,
                                              cands.get(hi, ())):
                if rec['q0'] > 0:
                    ok = rec['msc'] >= 3.0 and rec['run'] >= 3
                else:
                    ok = (rec['run'] >= MIN_RUN or sc >= ACCEPT or
                          rec['msc'] >= 3.0)
                if ok:
                    got = rec
                    self._dbg['gap'] += 1
                    break
            if got is None:
                rec = self._meaning_probe(hi, lo, hib)
                if rec is not None:
                    got = rec
                    self._dbg['meaning'] += 1
            if got is not None:
                pos[hi] = got
                bisect.insort(located, hi)

        for hi, h in enumerate(self.hadiths):
            rec = pos.get(hi)
            if rec is None:
                self.pos_of[h['num']] = {'found': False}
                continue
            self.pos_of[h['num']] = {
                'found': True, 'tp': rec['g0'], 'tp1': rec['g1'],
                'q0': rec['q0'], 'qlen': rec['run'],
                'q_cs': self.cs[rec['g0']],
                'q_ce': self.ce[rec['g1'] - 1],
                'mscore': rec['msc'], 'marks': rec['marks'],
                'variant': rec['vi'], 'kind': rec['kind'],
            }

    # ----- كشف الاقتباس بالمعنى -----

    def _book_df(self):
        if not hasattr(self, '_df'):
            df = {}
            for t in self.toks:
                df[t] = df.get(t, 0) + 1
            self._df = df
        return self._df

    def _meaning_probe(self, hi, lo_tok, hi_tok):
        """نافذة منزلقة في الفجوة [lo,hi): احتواء كلمات المحتوى بـidf
        على مفردات الكتاب. النجاح → rec بـkind='meaning' (موثّق أدنى)."""
        if hi_tok - lo_tok < 12:
            return None
        df = self._book_df()
        mwords = {w for v in self.hadiths[hi]['variants'] for w in v
                  if w not in _STOP and len(w) > 2}
        if not mwords:
            return None
        midf = {w: math.log(len(self.toks) / (df.get(w, 1) + 1))
                for w in mwords}
        denom = sum(midf.values()) or 1.0
        W = 60                          # نصف عرض النافذة بالكلمات
        cnt = {}
        tot = 0.0
        a = lo_tok
        best = (0.0, -1)
        for b in range(lo_tok, hi_tok):
            w = self.toks[b]
            if w in mwords:
                if cnt.get(w, 0) == 0:
                    tot += midf[w]
                cnt[w] = cnt.get(w, 0) + 1
            if b - a + 1 > 2 * W:
                x = self.toks[a]
                a += 1
                if x in mwords:
                    cnt[x] -= 1
                    if cnt[x] == 0:
                        tot -= midf[x]
            cov = tot / denom
            if cov > best[0]:
                best = (cov, max(a, b - W))
        if best[0] >= MEANING_MIN:
            g = best[1]
            return {'g0': g, 'g1': g + 1, 'q0': 0, 'run': 1,
                    'msc': best[0], 'marks': [f'meaning:{best[0]:.2f}'],
                    'vi': 0, 'kind': 'meaning'}
        return None

    # ----- حدود المقاطع -----

    def _sec_start(self, num):
        """بداية مقطع الحديث: ترويسة «الحديث N» إن سبقت الاقتباس،
        وإلا بداية سياق الإسناد فالاقتباس."""
        e = self.pos_of.get(num, {})
        hp = self.hdr.get(num)
        if hp is not None and (not e.get('found') or hp <= e['tp']):
            return self.cs[hp]
        if not e.get('found'):
            return self.cs[hp] if hp is not None else None
        p = e['tp']
        for i in range(p - 1, max(0, p - CTX_BACK) - 1, -1):
            if self.toks[i] in ('عن', 'حدثنا', 'اخبرنا', 'انبانا'):
                return self.cs[i]
        return e['q_cs']

    def _next_start(self, num):
        """بداية مقطع أول حديث تالٍ محدد (ترويسته أو اقتباسه)."""
        ai = self.hidx.get(num)
        ends = []
        if ai is not None:
            for h2 in self.hadiths[ai + 1:]:
                hp = self.hdr.get(h2['num'])
                if hp is not None:
                    ends.append(self.cs[hp])
                    break
                if self.pos_of.get(h2['num'], {}).get('found'):
                    s = self._sec_start(h2['num'])
                    if s is not None:
                        ends.append(s)
                    break
        tp = self.pos_of.get(num, {}).get('tp', 0)
        later = [v for v in self.hdr.values() if v > tp]
        if later:
            ends.append(self.cs[min(later)])
        return min(ends) if ends else len(self.text)

    # ----- الاسترجاع -----

    def lookup(self, num):
        """-> {file, char_start, char_end, excerpt, confidence, kind}"""
        e = self.pos_of.get(num, {'found': False})
        h = self.hadiths[self.hidx[num]] if num in self.hidx else None
        out = {'num': num, 'ref': h['ref'] if h else f'jamic:{num}',
               'book': self.book,
               'file': os.path.relpath(book_path(self.book), _REPO),
               'char_start': None, 'char_end': None, 'excerpt': None,
               'confidence': 'none'}
        if e.get('found'):
            start = self._sec_start(num)
            end = self._next_start(num)
            if e.get('kind') == 'meaning':
                conf = 'low'
            else:
                conf = ('high' if e['mscore'] >= 3 and e['qlen'] >= 6
                        else 'medium')
            out.update(char_start=start, char_end=end,
                       excerpt=self.text[start:end], confidence=conf,
                       quote_len=e['qlen'], marks=e['marks'],
                       kind=e.get('kind', 'literal'))
            return out
        ai = self.hidx.get(num, 0)
        lo = hi = None
        for h2 in reversed(self.hadiths[:ai]):
            if self.pos_of.get(h2['num'], {}).get('found'):
                lo = self._next_start(h2['num'])
                break
        for h2 in self.hadiths[ai + 1:]:
            if self.pos_of.get(h2['num'], {}).get('found'):
                hi = self._sec_start(h2['num'])
                break
        if hi is None:
            hi = len(self.text)
        if (lo or 0) < hi:
            out.update(char_start=lo or 0, char_end=hi,
                       excerpt=self.text[lo or 0:hi], confidence='low',
                       note='no quote — gap between neighbours')
        return out

    def lookup_text(self, text):
        """مدخل نص حر: عيّن أقرب حديث بالكتاب (تشابه جاكار على المتون) ثم
        استرجعه؛ لا تطابق قريب → none بلا تمويه."""
        t = set(_tokens(text))
        best, bi = 0.0, None
        for i, h in enumerate(self.hadiths):
            for V in h['variants']:
                vs = set(V)
                j = len(t & vs) / max(1, len(t | vs))
                if j > best:
                    best, bi = j, i
        if bi is None or best < 0.12:
            return {'book': self.book, 'char_start': None,
                    'char_end': None, 'excerpt': None,
                    'confidence': 'none',
                    'note': f'no known hadith close enough ({best:.2f})'}
        r = self.lookup(self.hadiths[bi]['num'])
        r['matched'] = {'ref': self.hadiths[bi]['ref'],
                        'jaccard': round(best, 3)}
        return r

    # ----- إخراج -----

    def to_json(self):
        entries = []
        for h in self.hadiths:
            num = h['num']
            e = self.pos_of.get(num, {'found': False})
            r = self.lookup(num)
            hp = self.hdr.get(num)
            entries.append({
                'k': h['ref'], 'num': num,
                'cs': r['char_start'], 'ce': r['char_end'],
                'conf': r['confidence'],
                'kind': e.get('kind') if e.get('found') else None,
                'ql': e.get('qlen', 0),
                'hdr': hp is not None and r['char_start'] is not None
                and self.cs[hp] == r['char_start'],
            })
        return {
            'book': self.book,
            'title': BOOKS[self.book]['title'],
            'author': BOOKS[self.book]['author'],
            'openiti': BOOKS[self.book]['openiti'],
            'url': BOOKS[self.book]['url'],
            'source': os.path.relpath(book_path(self.book), _REPO),
            'sha256_16': self.sha,
            'n_hadiths': len(entries),
            'n_located': sum(1 for x in entries if x['conf'] != 'none'),
            'headers_found': sorted(self.hdr),
            'entries': entries,
        }


def build_index(book):
    hadiths = build_hadiths(BOOKS[book]['corpus'])
    idx = HadithIndex(book, hadiths)
    os.makedirs(INDEX_DIR, exist_ok=True)
    out = os.path.join(INDEX_DIR, f'{book}.json')
    d = idx.to_json()
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False)
    print(f"{book}: {d['n_located']}/{d['n_hadiths']} located, "
          f"dbg={idx._dbg} -> {out}")
    return idx


def main():
    ap = argparse.ArgumentParser(description='مُرجِع-حديث engine')
    sub = ap.add_subparsers(dest='cmd', required=True)
    b = sub.add_parser('index')
    b.add_argument('--book', required=True, choices=sorted(BOOKS))
    l = sub.add_parser('lookup')
    l.add_argument('num', type=int, nargs='?')
    l.add_argument('--book', required=True, choices=sorted(BOOKS))
    l.add_argument('--text')
    l.add_argument('--full', action='store_true')
    args = ap.parse_args()
    if args.cmd == 'index':
        build_index(args.book)
    else:
        hadiths = build_hadiths(BOOKS[args.book]['corpus'])
        idx = HadithIndex(args.book, hadiths)
        r = (idx.lookup_text(args.text) if args.text
             else idx.lookup(args.num))
        ex = r.get('excerpt') or ''
        r['excerpt'] = ex if args.full else ex[:400]
        print(json.dumps(r, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
