#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""مُرجِع مسائل فقهية — ترصيف مسألة/عبارة مفتاحية داخل كتاب شرح فقهي.

نفس روح murji: دقة قبل سرعة، كل موضع قابل للتحقق، stdlib فقط.

المدخل : (نص مسألة أو عبارة مفتاحية، اسم كتاب شرح)
المخرج : المقطع الدقيق الذي يعالجها  [cs, ce)  + ثقة موثّقة + الباب الحاوي.

المنهج:
  1) الفهرس = مرشحو الفقرات: أسطر تبدأ بعلامات فقهية —
     «فرع»، «مسألة»، «تنبيه»، «تذنيب»، «فائدة»، «خاتمة»، «قال <سلطة>»،
     اقتباسات المتن «(…)»، وصيغ الشَّرط «إذا/وإذا/فإن/لو…» —
     وترويسات البنية «كتاب/باب/فصل/قسم» لتقسيم الباب/المسألة.
     لكل مرشح رتبة؛ مقطعه يمتد حتى أول مرشح/ترويسة برتبة ≤ رتبته
     (فيغطي اقتباسُ المتن فروعَه التابعة، والفرعُ شرائطَه التابعة).
  2) المطابقة موزونة:
       • ضربات n-gram حرفية (2+) — داخل صيغة المرشح (أول سطرين) أثقل
         بخمسة أضعاف من مبعثرة في عمق مقطعه، بسقف: فقرة تعالج مسألة
         تصوغها أولاً، والمقاطع الطويلة لا تُكافأ على اتساعها؛
       • تغطية idf لكلمات محتوى السؤال في صيغة المرشح؛
       • مكافأة نطاق: كلمات السؤال داخل ترويسة الباب الحاوي («الصلاة»…)؛
       • مكافأة صيغة: كلمات حكم (يجوز/يحرم/تجب/يصح…) مشتركة؛
       • أولوية صيغ المسائل (فرع/مسألة/شرط) على اقتباس المتن «(…)»
         والحواشي (تنبيه/فائدة) — سؤال مسألة غايته صيغة لا متن المقرر.
  3) كشف بالمعنى عند تعذّر اللفظ: نافذة منزلقة على الأسطر باحتواء idf
     (كما في lookup_hadith) → kind='meaning' وثقة 'low' موثّقة.
  4) الثقة موثّقة: high=ضربة ≥3-gram في الصيغة أو هامش واضح مع حرفية،
     medium=تغطية كافية بلا سلسلة طويلة، low=كشف المعنى، none=دون العتبة.

كل مرشح قابل للتحقق: الموقع cs/ce يشير إلى نص المصدر المعاد بناؤه
(sha256_16 محفوظ في الفهرس؛ يُعاد حسابه عند التحميل ويُحذَّر عند الخلاف).

الاستعمال:
  python3 lookup_fiqh.py index --book mubdi
  python3 lookup_fiqh.py lookup --book mubdi --text 'حكم بيع الحرير لكافر'
  python3 lookup_fiqh.py lookup --book mubdi --file qs.txt   # JSONL
  python3 eval_fiqh.py                                     # يولّد ../EVAL_FIQH.md
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

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'tools'))
from norm import norm as _norm  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, '..', 'data')
INDEX_DIR = os.path.join(HERE, '..', 'indexes', 'murji')

BOOKS = {
    'mubdi': {
        'title': 'المبدع شرح المقنع',
        'author': 'ابن مفلح الحنبلي (ت 762هـ)',
        'file': 'mubdi_almuqni.rlg.txt.gz',
    },
}

# \w + تشكيل وتطويل — نص المصدر مشكول وقد يفصل «ـ» داخل الكلمة
# (مثل «الطَّـهارة»)، فتُبتلع في التوكن ثم يحذفها التطبيع.
_WORD = re.compile(r'[\wـً-ْٰ]+')

# ---------- ترويسات البنية وعلامات الفقرات ----------

# ترويسة بنيوية: أول كلمة (بعد التطبيع) من هذه، وسطر قصير نسبياً
_SEC_WORDS = {'كتاب': 0, 'باب': 1, 'فصل': 1.5, 'القسم': 1.5,
              'قسم': 1.5, 'تمه': 1.5}
_SEC_MAX_WORDS = 10

# رتبة المرشح: الأصغر أعمّ — مقطع المرشح ينتهي عند أول مرشح برتبة ≤ رتبته
_RANK = {'متن': 2, 'فرع': 3, 'مسألة': 3, 'قال': 3,
         'تنبيه': 3.5, 'تذنيب': 3.5, 'فائدة': 3.5, 'خاتمة': 3.5,
         'شرط': 4}
_MASALA_MARKERS = {'فرع', 'مسألة', 'شرط'}   # صيغ المسائل (للأولوية على المتن)

# علامات بادئة السطر (على السطر المطبَّع)
_MARK_RES = [
    ('فرع',    re.compile(r'^فرع\s')),
    ('مسألة',  re.compile(r'^(ال)?مساله\s')),
    ('تنبيه',  re.compile(r'^تنبيه\s')),
    ('تذنيب',  re.compile(r'^تذنيب\s')),
    ('فائدة',  re.compile(r'^فائده\s')),
    ('خاتمة',  re.compile(r'^خاتمه\s')),
    ('قال',    re.compile(r'^قال\s+(الامام|احمد|القاضي|الشيخ|المولف|المصنف|ابن)\s')),
    ('شرط',    re.compile(r'^(اذا|واذا|فاذا|فان|وان|لو|ولو|فلو|كلما)\s')),
]

_REF = re.compile(r'^\(\s*¬?\d+\s*\)')   # إحالات هوامش «(¬٥)» ليست اقتباس متن
_SIG_LINES = 2          # أسطر الصيغة الموزونة لكل مرشح
_SIG_WORDS = 14         # أقصى كلمات محتوى للتوقيع المخزن
STOP = set(_norm(
    'عن ان انه انها في ما من على الي الى او و قال يقول هو هي كان كانت '
    'ثم قد لا لم لن ليس كل التي الذي الذين اذا هذه هذا ذلك يا بن ابن').split())

# كلمات حكم/صيغة مسألة — مكافأة صيغة عند اشتراكها بين السؤال والمرشح
_HUKM = set(_norm('يجوز يحرم يكره يستحب تجب تباح يصح يبطل بطل حرم حلل '
                  'يفسد يسقط تسقط يجب تلزم يلزم يفترض تعتبر يعتبر توجب '
                  'يوجب تنعقد ينعقد يقع يصح').split())

MEANING_MIN = 0.42      # احتواء idf لكشف المعنى (أعلى من الحديث: مسائل أقصر)
W_MEANING = 45          # نصف عرض نافذة المعنى بالكلمات
SIG_COV_MED = 0.45      # تغطية صيغة للثقة المتوسطة
SIG_COV_MIN = 0.20      # أدنى تغطية مع ضربة حرفية
LIT_RUN_MIN = 2         # أدنى طول ضربة حرفية (كلمات)


# ---------- القراءة والترميز ----------

def load_text(book):
    """النص المسطّح المعاد بناؤه من وحدات rlg (مضغوط)."""
    path = os.path.join(DATA_DIR, BOOKS[book]['file'])
    with gzip.open(path, 'rt', encoding='utf-8') as f:
        return f.read()


def line_offsets(text):
    """-> (lines, cs[]): إزاحة بدء كل سطر في النص."""
    lines, cs = [], []
    pos = 0
    for ln in text.split('\n'):
        cs.append(pos)
        lines.append(ln)
        pos += len(ln) + 1
    return lines, cs


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


_PREF = ('وال', 'فال', 'بال', 'كال', 'لل', 'ال')


def _stem(w):
    """تجريد خفيف متماثل: و/ف عاطفة ثم (بال/كال/لل/ال) — يطبَّق على
    توكنات الكتاب والسؤال معاً فيبقى اللفظ «حرفياً» في فضاء التجريد."""
    while True:
        for p in _PREF:
            if w.startswith(p) and len(w) - len(p) >= 3:
                w = w[len(p):]
                break
        else:
            if len(w) > 3 and w[0] in 'وف':
                w = w[1:]
                continue
            break
    return w


def _content(s):
    return [w for w in (_stem(t) for t in _norm(s).split())
            if w and w not in STOP]


def _is_quote_line(raw):
    """سطر يبدأ بـ«(نص)» = اقتباس من متن المقنع — ما عدا إحالات الهامش."""
    s = raw.strip()
    if not s.startswith('(') or _REF.match(s):
        return False
    i = s.find(')')
    if i < 0:
        i = min(len(s), 160)
    return len(s[1:i].split()) >= 1


def _line_kind(raw):
    """-> (kind, rank) لعلامة بادئة سطر أو ترويسة بنية، أو None."""
    s = raw.strip()
    if not s:
        return None
    n = _norm(s)
    w = n.split()
    if not w:
        return None
    # ترويسة بنيوية: كتاب/باب/فصل/قسم… وسطر قصير (العناوين قصيرة)
    if w[0] in _SEC_WORDS and len(w) <= _SEC_MAX_WORDS:
        return ('sec', _SEC_WORDS[w[0]])
    for kind, rx in _MARK_RES:
        if rx.match(n):
            return (kind, _RANK[kind])
    if _is_quote_line(s):
        return ('متن', _RANK['متن'])
    return None


# ---------- الفهرس ----------

class FiqhIndex:
    """مرشحو الفقرات + ترويسات البنية لمطابقة مسائل حرة النص."""

    def __init__(self, book):
        self.book = book
        self.text = load_text(book)
        self.sha = hashlib.sha256(self.text.encode('utf-8')).hexdigest()
        self.lines, self.lcs = line_offsets(self.text)
        self.toks, self.cs, self.ce = tokenize(self.text)
        self.stoks = [_stem(t) for t in self.toks]
        self.sections = []    # [(line_ix, kind, title)]
        self.cands = []       # [{i,li,cs,ce,kind,rank,sig,sec}]
        self.cand_cs = []     # cs لكل مرشح (للبحث الثنائي)
        self._post = None     # token -> [token positions]
        self._df = None       # token -> عدد الأسطر الحاوية
        self._build()

    # ----- بناء مرشحي الفقرات -----
    def _build(self):
        bounds = []   # (line_ix, kind, rank) — مرشحون + ترويسات
        for li, raw in enumerate(self.lines):
            k = _line_kind(raw)
            if k is None:
                continue
            kind, rank = k
            if kind == 'sec':
                self.sections.append((li, w0(raw), raw.strip()))
            bounds.append((li, kind, rank))
        bounds.sort()
        sec_titles = [(li, t) for li, _, t in self.sections]
        sec_li = [x[0] for x in sec_titles]
        text_end = self.lcs[-1] + len(self.lines[-1])
        for j, (li, kind, rank) in enumerate(bounds):
            if kind == 'sec':
                continue
            ce = text_end
            for li2, _, rank2 in bounds[j + 1:]:
                if rank2 <= rank:
                    ce = self.lcs[li2]
                    break
            si = bisect.bisect_right(sec_li, li) - 1
            sec = sec_titles[si][1] if si >= 0 else ''
            sig_src = ' '.join(self.lines[li:li + _SIG_LINES])
            sig = ' '.join(_content(sig_src)[:_SIG_WORDS])
            self.cands.append({'i': len(self.cands), 'li': li,
                               'cs': self.lcs[li], 'ce': ce,
                               'kind': kind, 'rank': rank,
                               'sig': sig, 'sec': sec})
        self.cand_cs = [c['cs'] for c in self.cands]

    # ----- قوائم النشر ومفردات الأسطر -----
    def _posting(self):
        if self._post is None:
            post = {}
            for i, t in enumerate(self.stoks):
                post.setdefault(t, []).append(i)
            self._post = post
        return self._post

    def _line_df(self):
        if self._df is None:
            df = {}
            prev_li, seen = -1, set()
            for i, t in enumerate(self.stoks):
                li = bisect.bisect_right(self.lcs, self.cs[i]) - 1
                if li != prev_li:
                    prev_li, seen = li, set()
                if t not in seen:
                    df[t] = df.get(t, 0) + 1
                    seen.add(t)
            self._df = df
        return self._df

    def _idf(self, w):
        df = self._line_df()
        return math.log((len(self.lines) + 1) / (df.get(w, 0) + 1)) + 1.0

    # ----- مطابقة -----
    def _head_span(self, cand):
        """[a,b) إزاحات توكنات صيغة المرشح (أسطرها الأولى)."""
        li = cand['li']
        end_li = min(li + _SIG_LINES, len(self.lines))
        a = bisect.bisect_left(self.cs, self.lcs[li])
        b = (bisect.bisect_left(self.cs, self.lcs[end_li])
             if end_li < len(self.lines) else len(self.toks))
        return a, b

    def _cand_of_pos(self, tok_pos):
        """فهرس المرشح المحتوي لموضع توكن (أو None)."""
        j = bisect.bisect_right(self.cand_cs, self.cs[tok_pos]) - 1
        return j if j >= 0 else None

    def lookup(self, question, top=4):
        """-> dict: أفضل مرشح + بدائل + الثقة والنوع."""
        qraw = [_stem(t) for t in _norm(question).split()]
        qt = [w for w in qraw if w and w not in STOP]
        if not qt:
            return {'found': False, 'conf': 'none',
                    'why': 'سؤال خال من كلمات محتوى'}
        qidf = {w: self._idf(w) for w in qt}
        denom = sum(qidf.values()) or 1.0
        qhukm = {w for w in qt if w in _HUKM}

        post = self._posting()
        # أ) ضربات n-gram حرفية على كلمات السؤال الخام (تشمل «لا/ما»)
        # ضربة داخل صيغة المرشح (أول سطرين) أثقل من مبعثرة في عمق المقطع:
        # فقرة تعالج مسألة تصوغها أولاً؛ المقاطع الطويلة (متن/باب) تجمع
        # ضربات فروعها الداخلة فلا تُكافأ على اتساعها.
        hits = {}       # cand_ix -> [lit_head, lit_deep]
        seen_runs = set()
        for o, w in enumerate(qraw):
            for p in post.get(w, ()):
                # امتداد أمامي: توكنات الأرقام (إحالات «(¬٢)») شفافة
                run, j = 0, p
                while o + run < len(qraw) and j < len(self.stoks):
                    if self.stoks[j].isdigit():
                        j += 1
                        continue
                    if self.stoks[j] != qraw[o + run]:
                        break
                    run += 1
                    j += 1
                if run < LIT_RUN_MIN:
                    continue
                back, j0 = 0, p
                while o - back - 1 >= 0 and j0 - 1 >= 0:
                    j0 -= 1
                    if self.stoks[j0].isdigit():
                        continue
                    if self.stoks[j0] != qraw[o - back - 1]:
                        break
                    back += 1
                g0, g1 = j0, j
                if (g0, g1) in seen_runs:
                    continue
                seen_runs.add((g0, g1))
                ci = self._cand_of_pos(g0)
                if ci is not None and self.ce[g1 - 1] <= self.cands[ci]['ce']:
                    hits.setdefault(ci, []).append((g0, run))
        # ب) تغطية idf للصيغة + مكافآت — للمرشحين الملموسين فقط
        touched = set(hits)
        for w in qt:
            for p in post.get(w, ()):
                ci = self._cand_of_pos(p)
                if ci is not None:
                    touched.add(ci)
        scores = {}
        for ci in touched:
            c = self.cands[ci]
            a, b = self._head_span(c)
            head = set(self.stoks[a:b])
            cover = sum(qidf[w] for w in qt if w in head) / denom
            lit_head = sum(rn for g0, rn in hits.get(ci, ())
                           if a <= g0 < b)
            lit_deep = sum(rn for g0, rn in hits.get(ci, ())
                           if g0 >= b)
            lit = lit_head + lit_deep
            sc = min(lit_head * 5.0 + lit_deep * 1.0, 48.0) + cover * 30.0
            marks = [f'cov:{cover:.2f}'] if cover else []
            if c['sec']:
                inter = set(_content(c['sec'])) & set(qt)
                if inter:
                    sc += 2.0 * len(inter)
                    marks.append('sec:' + '،'.join(sorted(inter)))
            if qhukm and qhukm & head:
                sc += 1.5
                marks.append('hukm')
            if c['kind'] in _MASALA_MARKERS:
                sc += 3.0   # سؤال مسألة: صيغ «فرع/مسألة/شرط» مرشح مقصود،
                            # واقتباس المتن «(…)» سياق لا صيغة مسألة
            scores[ci] = (sc, marks, lit, cover)

        order = sorted(scores.items(), key=lambda kv: -kv[1][0])
        res = self._decide(order)
        if res is None:
            res = self._meaning_probe(qt, qidf, denom)
        if res is None:
            return {'found': False, 'conf': 'none',
                    'why': 'لا مرشح فوق العتبة ولا كشف معنى',
                    'alts': [self._brief(ci, s) for ci, s in order[:top]]}
        return res

    def _decide(self, order):
        """قبول أفضل مرشح حرفي + تعيين الثقة الموثّقة."""
        if not order:
            return None
        ci, (sc, marks, lit, cover) = order[0]
        margin = sc - (order[1][1][0] if len(order) > 1 else 0.0)
        conf = None
        if lit >= 3 and (cover >= 0.25 or margin >= 6.0):
            conf = 'high'
        elif lit >= 3 or cover >= SIG_COV_MED:
            conf = 'medium'
        elif lit >= LIT_RUN_MIN and cover >= SIG_COV_MIN:
            conf = 'medium'
        if conf is None:
            return None
        return self._result(ci, sc, conf, 'literal', marks,
                            order[1:5], lit=lit, cover=cover)

    def _meaning_probe(self, qt, qidf, denom):
        """نافذة منزلقة على النص كله (كشف بالمعنى) — موثّقة conf=low."""
        mwords = {w for w in qt if len(w) > 2}
        if not mwords:
            return None
        toks = self.stoks
        cnt, tot, a = {}, 0.0, 0
        best = (0.0, -1)
        for b in range(len(toks)):
            w = toks[b]
            if w in mwords:
                if cnt.get(w, 0) == 0:
                    tot += qidf[w]
                cnt[w] = cnt.get(w, 0) + 1
            if b - a + 1 > 2 * W_MEANING:
                x = toks[a]
                a += 1
                if x in mwords:
                    cnt[x] -= 1
                    if cnt[x] == 0:
                        tot -= qidf[x]
            cov = tot / denom
            if cov > best[0]:
                best = (cov, max(a, b - W_MEANING))
        if best[0] < MEANING_MIN:
            return None
        ci = self._cand_of_pos(best[1])
        if ci is None:
            return None
        return self._result(ci, best[0] * 30, 'low', 'meaning',
                            [f'meaning:{best[0]:.2f}'], [], lit=0,
                            cover=best[0])

    # ----- نتيجة -----
    def _excerpt(self, c, n=260):
        s = self.text[c['cs']:c['ce']].strip()
        s = re.sub(r'\s+', ' ', s)
        return s[:n]

    def _result(self, ci, sc, conf, kind, marks, others, lit, cover):
        c = self.cands[ci]
        return {'found': True, 'book': self.book,
                'kind': kind, 'conf': conf, 'score': round(sc, 2),
                'lit_run': lit, 'cover': round(cover, 3),
                'marker': c['kind'], 'sec': c['sec'],
                'cs': c['cs'], 'ce': c['ce'],
                'excerpt': self._excerpt(c),
                'marks': marks,
                'alts': [self._brief(cj, s) for cj, s in others]}

    def _brief(self, ci, s):
        c = self.cands[ci]
        return {'cs': c['cs'], 'ce': c['ce'], 'marker': c['kind'],
                'sec': c['sec'], 'score': round(s[0], 2),
                'excerpt': self._excerpt(c, 120)}

    def to_json(self):
        return {'book': self.book, 'title': BOOKS[self.book]['title'],
                'author': BOOKS[self.book]['author'],
                'source': {'file': BOOKS[self.book]['file'],
                           'sha256_16': self.sha[:16]},
                'n_lines': len(self.lines),
                'n_sections': len(self.sections),
                'n_candidates': len(self.cands),
                'entries': [
                    {'i': c['i'], 'marker': c['kind'], 'rank': c['rank'],
                     'cs': c['cs'], 'ce': c['ce'], 'sec': c['sec'],
                     'sig': c['sig']} for c in self.cands]}


def w0(raw):
    n = _norm(raw).split()
    return n[0] if n else ''


def build_index(book):
    idx = FiqhIndex(book)
    os.makedirs(INDEX_DIR, exist_ok=True)
    out = os.path.join(INDEX_DIR, f'{book}.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(idx.to_json(), f, ensure_ascii=False)
    by = {}
    for c in idx.cands:
        by[c['kind']] = by.get(c['kind'], 0) + 1
    print(f'{out}: {len(idx.cands)} مرشحاً، {len(idx.sections)} ترويسة، '
          f'sha256_16={idx.sha[:16]}')
    print('  بالعلامة:', json.dumps(by, ensure_ascii=False))
    return out


def main():
    ap = argparse.ArgumentParser(description='مُرجِع مسائل فقهية')
    sub = ap.add_subparsers(dest='cmd', required=True)
    p = sub.add_parser('index')
    p.add_argument('--book', required=True, choices=sorted(BOOKS))
    p = sub.add_parser('lookup')
    p.add_argument('--book', required=True, choices=sorted(BOOKS))
    p.add_argument('--text', help='نص المسألة/العبارة المفتاحية')
    p.add_argument('--file', help='ملف أسئلة (سطر لكل سؤال) → JSONL')
    a = ap.parse_args()
    if a.cmd == 'index':
        build_index(a.book)
        return
    idx = FiqhIndex(a.book)
    ijs = os.path.join(INDEX_DIR, f'{a.book}.json')
    if os.path.exists(ijs):
        meta = json.load(open(ijs, encoding='utf-8'))
        sha_now = hashlib.sha256(idx.text.encode('utf-8')).hexdigest()
        if meta['source']['sha256_16'] != sha_now[:16]:
            print('تحذير: sha256_16 للنص لا يطابق الفهرس', file=sys.stderr)
    if a.file:
        for line in open(a.file, encoding='utf-8'):
            q = line.strip()
            if q:
                print(json.dumps(idx.lookup(q), ensure_ascii=False))
    else:
        print(json.dumps(idx.lookup(a.text or ''), ensure_ascii=False))


if __name__ == '__main__':
    main()
