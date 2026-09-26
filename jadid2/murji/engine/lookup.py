"""مُرجِع — محرك «آية + كتاب تفسير ← مقطع نصي دقيق».

يكمّل jadid2/spec.md وtools/: هناك كان الاسترجاع بنيوياً (JSON مقطّع مسبقاً)،
وهنا يعمل المحرك على *نص الكتاب المتصل* — يعيد اكتشاف مواضع الآيات داخله
ثم يقطع حدود التفسير بينها.

المصادر داخل الريبو نفسه:
  - نص القرآن:  wahy/data/surah/<n>.json   (6236 آية بالتشكيل)
  - التفاسير:   wahy/data/tafsir/<id>-<slug>.json.gz
                {"groups": {"s:a": {"f","t","x"}}, "vg": آية→مجموعة}

إعادة بناء نص الكتاب: نسلك `vg` بالترتيب القرآني، نُسقِط المجموعات المكررة
(مجموعة واحدة قد تغطي عدة آيات)، ونلصق x بفاصل سطر. الناتج نص حقيقي متصل
— المحرك لا يرى الحدود المسبقة، يعيد استنتاجها من الاقتباسات.

الخوارزمية:
  أ) فهرس المواضع: لكل آية 3-grams عند إزاحات 0..2 (يغطي الاقتباس
     المجزأ مثل «{قُلْ} … {هُوَ اللهُ أَحَدٌ}») → مسح الكتاب مرة → تمديد
     كل إصابة لأطول مقطع متصل. إنقاذ للآيات الشاردة: بادئة 2-gram أو
     الكلمة الأولى مع سياق استشهاد إلزامي.
  ب) تعيين رتيب (monotone): الآيات بترتيب المصحف؛ لكل آية *أول* مرشح بعد
     الموضع السابق تتجاوز نقاطه العتبة — تفسير آية لا يسبق تفسير سابقتها.
  ج) مقطع الآية N = من بداية سياق الاستشهاد (علامة «قوله تعالى» إن قريبة
     وإلا بداية الاقتباس) إلى بداية مقطع أول آية محددة تالية، أو سطر
     ترويسة السورة الموالية إن سبقها. آية بلا اقتباس ← الفجوة بين
     الجارين المحددين (ثقة منخفضة).

الناتج: {file, char_start, char_end, excerpt, confidence}
كل موضع قابل للتحقق: offsets داخل النص المتصل المُعاد بناؤه (sha256 مسجّل).

CLI:
  python3 lookup.py index  --book ibn_kathir        # يكتب indexes/murji/
  python3 lookup.py lookup --book saadi 36 83       # يطبع المقطع
  python3 lookup.py lookup --book ibn_kathir 2 255 --full
"""
import argparse
import bisect
import gzip
import hashlib
import itertools
import json
import os
import re
import sys

_ENGINE = os.path.dirname(os.path.abspath(__file__))   # jadid2/murji/engine
_JADID2 = os.path.dirname(os.path.dirname(_ENGINE))    # jadid2
_REPO = os.path.dirname(_JADID2)                       # repo root
sys.path.insert(0, os.path.join(_JADID2, 'tools'))
from norm import norm as _norm  # noqa: E402  نفس وصفة jadid2/tools

SURAH_DIR = os.path.join(_REPO, 'wahy', 'data', 'surah')
TAFSIR_DIR = os.path.join(_REPO, 'wahy', 'data', 'tafsir')
INDEX_DIR = os.path.join(os.path.dirname(_ENGINE), 'indexes', 'murji')

# تفاسير عربية كاملة داخل الريبو (wahy/data/tafsirs.json: ar=true, a=6236)
BOOKS = {
    'ibn_kathir': '22-ibn-kathir.json.gz',          # مجموعات متعددة الآيات
    'saadi': '24-tafseer-al-saadi-arabic.json.gz',  # اقتباس مجزأ {..} أي:
    'qurtubi': '23-tafseer-al-qurtubi.json.gz',
    'baghawi': '27-tafseer-al-baghawi.json.gz',
    'jalalayn': '523-jalalayn.json.gz',
    'tabari': '37-al-tabari.json.gz',
    'muyassar': '38-muyassar.json.gz',
}

_WORD = re.compile(r'\S+')
# «قوله/قال/يقول» تتبعها «تعالى/عز وجل/سبحانه/تبارك» خلال 4 كلمات
_M_VERB = {'قوله', 'قال', 'يقول'}
_M_GOD = {'تعالي', 'عز', 'وجل', 'سبحانه', 'تبارك'}  # تعالى بعد التطبيع = تعالي
_M_AYAH = {'الايه', 'الكريمه', 'الشريفه'}
_OPEN_Q = {'﴿', '{', '«', '"', '”', '“'}
_SURA_HDR = re.compile(r'^(تفسير\s+)?سور[ةه]\s')

CTX_BACK = 24         # كلمات النظر خلف الاقتباس لصيد العلامة
ACCEPT = 4.0          # عتبة قبول المرشح
RESCUE_MSC = 2.0      # إنقاذ المجزأ/القصير: سياق استشهاد إلزامي
D_GAP = 30000         # أقصى قفزة يسمح بها للمرسى القوي عن السابق
                      # (أطول من أي تفسير آية واحدة معتاد؛ من يتجاوزها
                      # يُرحّل لتمريرة الفجوات فلا يسمّم الترتيب)


_DAG = 'ٰ'          # الألف الخنجرية U+0670 في الرسم العثماني


def _tokens(s):
    return _norm(s).split()


def _vtok(raw):
    """متغيرات الكلمة الواحدة للمطابقة.

    الرسم العثماني يكتب «صرٰط» بألف خنجرية حيث الكتب تكتبها تارةً ألفاً
    («الصراط») وتارةً لا شيء («الرحمن») — فنولّد الشكلين ونقبل أيّهما.
    """
    base = _norm(raw)
    if _DAG in raw:
        fill = _norm(raw.replace(_DAG, 'ا'))
        if fill and fill != base:
            return (base, fill)
    return (base,) if base else ()


def _quran_vars(text):
    """-> قائمة متغيرات كل كلمة في الآية."""
    return [_vtok(t) for t in text.split()]


def load_quran():
    """-> [(s, a, text)] بترتيب المصحف."""
    ayahs = []
    for n in range(1, 115):
        d = json.load(open(os.path.join(SURAH_DIR, f'{n}.json'),
                           encoding='utf-8'))
        for v in d['verses']:
            ayahs.append((n, v['a'], v['t']))
    return ayahs


def book_path(book):
    slug = BOOKS.get(book, book)
    if not slug.endswith('.json.gz'):
        slug += '.json.gz'
    p = os.path.join(TAFSIR_DIR, slug)
    if not os.path.exists(p):
        raise FileNotFoundError(f'no tafsir file for {book}: {p}')
    return p


def reconstruct(book):
    """نص الكتاب المتصل + الحقول الذهبية للقياس.

    -> (text, gold) حيث gold['s:a'] = (b0,b1) نطاق مجموعة الآية،
    وorder[i] = مفتاح المجموعة i بالترتيب.
    """
    d = json.load(gzip.open(book_path(book), 'rt', encoding='utf-8'))
    groups, vg = d['groups'], d.get('vg', {})

    def _sk(k):
        s, a = k.split(':')
        return int(s), int(a)
    ayah_keys = sorted(vg, key=_sk) if vg else sorted(groups, key=_sk)

    order, seen, parts = [], set(), []
    pos = 0
    gold_g = {}
    for ak in ayah_keys:
        gk = vg.get(ak, ak)
        if gk in seen or gk not in groups:
            continue
        seen.add(gk)
        order.append(gk)
        x = groups[gk]['x']
        gold_g[gk] = (pos, pos + len(x))
        parts.append(x)
        pos += len(x) + 1
    gold = {ak: gold_g[vg.get(ak, ak)] for ak in ayah_keys
            if vg.get(ak, ak) in gold_g}
    return '\n'.join(parts), order, gold, groups


def tokenize(text):
    """-> (norm_tokens, char_start[], char_end[]); الرموز المطبَّعة الفارغة تُحفظ."""
    toks, cs, ce = [], [], []
    for m in _WORD.finditer(text):
        toks.append(_norm(m.group(0)))
        cs.append(m.start())
        ce.append(m.end())
    return toks, cs, ce


def _marker_score(toks, p, text, cs):
    """نقاط سياق الاستشهاد قبل الموضع p: علامة قوله/قال+لفظ الجلالة = 3،
    كلمة «الآية/سورة» = 1، إحاطة نصية ﴿/{ مباشرة قبل الاقتباس = 2."""
    score, found = 0.0, []
    lo = max(0, p - CTX_BACK)
    win = toks[lo:p]
    for i, t in enumerate(win):
        if t in _M_VERB and any(x in _M_GOD for x in win[i + 1:i + 6]):
            score += 3.0
            found.append('verb+god')
            break
    if score == 0 and 'تعالي' in win:
        score += 1.0
        found.append('t3ala')
    if any(t in _M_AYAH for t in win):
        score += 1.0
        found.append('ayahword')
    j = cs[p] - 1
    while j >= 0 and text[j].isspace():
        j -= 1
    if j >= 0 and text[j] in _OPEN_Q:
        score += 2.0
        found.append('wrap:' + text[j])
    return score, found


class TafsirIndex:
    """فهرس مواضع الآيات داخل كتاب تفسير واحد."""

    def __init__(self, book, quran):
        self.book = book
        self.quran = quran
        self.text, self.order, self.gold, self.groups = reconstruct(book)
        self.sha = hashlib.sha256(self.text.encode()).hexdigest()[:16]
        self.toks, self.cs, self.ce = tokenize(self.text)
        self._hdr = self._surah_headers()
        self.qidx = {(s, a): i for i, (s, a, _) in enumerate(quran)}
        self.pos_of = {}
        self._build()

    # ---------- بناء الفهرس ----------

    def _surah_headers(self):
        """مواضع كلمات أسطر «سورة X/تفسير سورة X» في تيار الكلمات."""
        hdr = []
        text = self.text
        for i, t in enumerate(self.toks):
            if t not in ('سوره', 'تفسير'):
                continue
            c = self.cs[i]
            ls = text.rfind('\n', 0, c) + 1
            le = text.find('\n', c)
            line = text[ls: le if le != -1 else len(text)]
            if _SURA_HDR.match(_norm(line)):
                hdr.append(i)
        return sorted(set(hdr))

    def _build(self):
        # 1) أنماط لكل آية: كل 3-grams (إزاحة 0..n-3) وكل 2-grams —
        #    بكل تراكيب متغيرات الألف الخنجرية. الشمول لأن الاقتباس قد
        #    يأتي مجزأً من وسط الآية أو آخرها ({قُلْ}…{هُوَ اللهُ أَحَدٌ})
        pat3, pat2, first1 = {}, {}, {}
        ay_vars = []                    # ai -> [tuple variants per token]
        for ai, (s, a, txt) in enumerate(self.quran):
            V = _quran_vars(txt)
            ay_vars.append(V)
            n = len(V)
            for qoff in range(n - 2):
                for combo in itertools.product(*V[qoff:qoff + 3]):
                    pat3.setdefault(' '.join(combo), []).append((ai, qoff))
            for qoff in range(n - 1):
                for combo in itertools.product(*V[qoff:qoff + 2]):
                    pat2.setdefault(' '.join(combo), []).append((ai, qoff))
            if n == 1 and V:            # مقطّعات: كلمة واحدة
                for c in V[0]:
                    first1.setdefault(c, []).append(ai)

        # 2) مسح واحد للكتاب: لكل موضع نلحق (i, qoff) بمرشحي كل آية —
        #    القوائم تبقى مرتبة تلقائياً لأن i يتزايد
        toks = self.toks
        cands = {}                      # ai -> [(i, qoff)]
        last = len(toks)
        for i in range(last):
            if i + 2 < last:
                for ai, qoff in pat3.get(
                        toks[i] + ' ' + toks[i + 1] + ' ' + toks[i + 2],
                        ()):
                    cands.setdefault(ai, []).append((i, qoff))
            if i + 1 < last:
                for ai, qoff in pat2.get(toks[i] + ' ' + toks[i + 1], ()):
                    cands.setdefault(ai, []).append((i, qoff))
            for ai in first1.get(toks[i], ()):
                cands.setdefault(ai, []).append((i, 0))

        # 4) أ) تسجيل كل المرشحات: امتداد حول الاصطفاف + نقاط علامة،
        #    مع بوابة خفيفة (المسك المنتهي يفعله الاختيار العالمي)
        scored = []                     # ai -> [(g0, score, rec)]
        coords = set()
        for ai in range(len(self.quran)):
            V = ay_vars[ai]
            n = len(V)
            lst = []
            seen_g = set()
            for i, qoff in cands.get(ai, ()):
                g0, q0 = i, qoff
                while q0 > 0 and g0 > 0 and toks[g0 - 1] in V[q0 - 1]:
                    g0 -= 1
                    q0 -= 1
                if g0 in seen_g:
                    continue
                seen_g.add(g0)
                g1, q1 = g0 + 1, q0 + 1
                while q1 < n and g1 < last and toks[g1] in V[q1]:
                    g1 += 1
                    q1 += 1
                run = q1 - q0
                if run < 1:
                    continue
                msc, marks = _marker_score(toks, g0, self.text, self.cs)
                if not (run >= 3 or msc >= 2.0 or (run >= 2 and msc >= 1.0)):
                    continue            # تطابق تافه بلا سياق استشهاد
                score = msc + min(run, 20) + (1.0 if q0 == 0 else 0.0)
                lst.append((g0, score, (g0, q0, run, msc, marks)))
                coords.add(g0)
            scored.append(lst)

        # ب) أطول سلسلة مواقيت متزايدة موزونة: موضع خطأ واحد يُسقِط نفسه
        #    لأنه يمنع سلسلة كثيفة صحيحة — Fenwick prefix-max على المواضع
        uniq = sorted(coords)
        idx_of = {p: j for j, p in enumerate(uniq)}
        size = len(uniq)
        bit = [0.0] * (size + 2)        # Fenwick: أفضل dp منتهٍ قبل الموضع
        who = [None] * (size + 2)       # العقدة (ai,g0) المحققة لذلك الأفضل
        node = {}                       # (ai,g0) -> (dp, parent, rec)
        best_node, best_val = None, 0.0
        for ai in range(len(self.quran)):
            cset = scored[ai]
            for g0, sc, rec in cset:
                x = idx_of[g0]          # استعلام prefix-max على (< g0)
                v, par = 0.0, None
                while x > 0:
                    if bit[x] > v:
                        v, par = bit[x], who[x]
                    x -= x & -x
                node[(ai, g0)] = (sc + v, par, rec)
            for g0, sc, rec in cset:
                dp = node[(ai, g0)][0]
                x = idx_of[g0] + 1
                while x <= size:
                    if dp > bit[x]:
                        bit[x] = dp
                        who[x] = (ai, g0)
                    x += x & -x
                if dp > best_val:
                    best_val, best_node = dp, (ai, g0)

        pos = {}                        # ai -> (g0,q0,run,msc,marks)
        located = []
        cur = best_node
        while cur:
            pos[cur[0]] = node[cur][2]
            located.append(cur[0])
            cur = node[cur][1]
        located.sort()
        self._dbg = {'chain': len(located), 'gap': 0,
                     'with_cands': sum(1 for v in cands.values() if v)}

        # ج) ملء الفجوات: أول مرشح مقبول بين آخر/أول موضعين مثبتين
        for ai in range(len(self.quran)):
            if ai in pos:
                continue
            j = bisect.bisect_right(located, ai)
            lo = pos[located[j - 1]][0] if j else -1
            hi = pos[located[j]][0] if j < len(located) else last
            V = ay_vars[ai]
            n = len(V)
            seen_g = set()
            for i, qoff in cands.get(ai, ()):
                if i <= lo:
                    continue
                if i >= hi:
                    break
                g0, q0 = i, qoff
                while q0 > 0 and g0 > lo and toks[g0 - 1] in V[q0 - 1]:
                    g0 -= 1
                    q0 -= 1
                if g0 in seen_g or g0 <= lo:
                    continue
                seen_g.add(g0)
                g1, q1 = g0 + 1, q0 + 1
                while q1 < n and g1 < last and toks[g1] in V[q1]:
                    g1 += 1
                    q1 += 1
                run = q1 - q0
                if run < 1:
                    continue
                msc, marks = _marker_score(toks, g0, self.text, self.cs)
                score = msc + min(run, 20) + (1.0 if q0 == 0 else 0.0)
                if n <= 3:
                    ok = q0 == 0 and msc >= 2.0
                elif q0 > 0:
                    ok = msc >= 3.0 and run >= 3    # اقتباس غير-بادئة
                else:
                    ok = run >= 3 or score >= ACCEPT or msc >= 2.0
                if ok:
                    pos[ai] = (g0, q0, run, msc, marks)
                    bisect.insort(located, ai)
                    self._dbg['gap'] += 1
                    break

        for ai, (s, a, txt) in enumerate(self.quran):
            key = f'{s}:{a}'
            rec = pos.get(ai)
            if rec is None:
                self.pos_of[key] = {'found': False}
                continue
            g0, q0, run, msc, marks = rec
            self.pos_of[key] = {
                'found': True, 'tp': g0, 'q0': q0, 'qlen': run,
                'q_cs': self.cs[g0], 'q_ce': self.ce[g0 + run - 1],
                'mscore': msc, 'marks': marks,
            }

    # ---------- الاسترجاع ----------

    def _seg_start(self, key):
        """بداية مقطع الآية: علامة الاستشهاد إن قريبة وإلا بداية الاقتباس."""
        e = self.pos_of[key]
        if not e['found']:
            return None
        p = e['tp']
        lo = max(0, p - CTX_BACK)
        for i in range(p - 1, lo - 1, -1):
            t = self.toks[i]
            if t in _M_VERB:
                if any(x in _M_GOD for x in self.toks[i + 1:p][:5]):
                    return self.cs[i]
            if t in ('تفسير', 'قوله') and self.toks[i + 1:i + 3]:
                if 'تعالي' in self.toks[i + 1:p]:
                    return self.cs[i]
        return e['q_cs']

    def _next_boundary(self, surah, ayah):
        """بداية مقطع أول آية محددة تالية، أو ترويسة سورة موالية."""
        ai = self.qidx[(surah, ayah)]
        nxt_q = None
        for s2, a2, _ in self.quran[ai + 1:]:
            e = self.pos_of.get(f'{s2}:{a2}')
            if e and e['found']:
                nxt_q = self._seg_start(f'{s2}:{a2}')
                break
        tp = self.pos_of[f'{surah}:{ayah}'].get('tp', 0)
        j = bisect.bisect_right(self._hdr, tp)
        nxt_h = self.cs[self._hdr[j]] if j < len(self._hdr) else None
        ends = [x for x in (nxt_q, nxt_h) if x is not None]
        return min(ends) if ends else len(self.text)

    def lookup(self, surah, ayah):
        """-> {file, char_start, char_end, excerpt, confidence, ...}"""
        key = f'{surah}:{ayah}'
        e = self.pos_of.get(key, {'found': False})
        src = os.path.relpath(book_path(self.book), _REPO)
        out = {'surah': surah, 'ayah': ayah, 'book': self.book,
               'file': src, 'char_start': None, 'char_end': None,
               'excerpt': None, 'confidence': 'none'}
        if e['found']:
            start = self._seg_start(key)
            end = self._next_boundary(surah, ayah)
            conf = 'high' if e['mscore'] >= 3 else 'medium'
            out.update(char_start=start, char_end=end,
                       excerpt=self.text[start:end], confidence=conf,
                       quote_len=e['qlen'], marks=e['marks'])
            return out
        # fallback: الفجوة بين آخر محدد سابق وأول محدد لاحق
        ai = self.qidx[(surah, ayah)]
        lo = hi = None
        pk = None
        for s2, a2, _ in reversed(self.quran[:ai]):
            p2 = self.pos_of.get(f'{s2}:{a2}')
            if p2 and p2['found']:
                pk = f'{s2}:{a2}'
                lo = self._next_boundary(s2, a2)
                break
        for s2, a2, _ in self.quran[ai + 1:]:
            p2 = self.pos_of.get(f'{s2}:{a2}')
            if p2 and p2['found']:
                hi = self._seg_start(f'{s2}:{a2}')
                break
        if hi is None:
            hi = len(self.text)
        if (lo or 0) < hi:
            out.update(char_start=lo or 0, char_end=hi,
                       excerpt=self.text[lo or 0:hi], confidence='low',
                       note='no direct quote — gap between neighbours')
        elif pk is not None:
            # الفجوة منهارة: شرح الآية داخل مقطع الجارة السابقة نفسه
            s0 = self._seg_start(pk)
            out.update(char_start=s0, char_end=hi,
                       excerpt=self.text[s0:hi], confidence='low',
                       note='no own quote — shares previous ayah block')
        return out

    def _next_boundary_of(self, s, a):
        e = self.pos_of.get(f'{s}:{a}')
        if not e or not e['found']:
            return None
        return self._next_boundary(s, a)

    # ---------- إخراج ----------

    def to_json(self):
        entries = []
        for s, a, _ in self.quran:
            key = f'{s}:{a}'
            e = self.pos_of.get(key, {'found': False})
            r = self.lookup(s, a)
            entries.append({'k': key, 'cs': r['char_start'],
                            'ce': r['char_end'], 'conf': r['confidence'],
                            'ql': e.get('qlen', 0)})
        return {
            'book': self.book,
            'source': os.path.relpath(book_path(self.book), _REPO),
            'sha256_16': self.sha,
            'n_ayahs': len(entries),
            'n_located': sum(1 for x in entries if x['conf'] != 'none'),
            'entries': entries,
        }


def build_index(book):
    quran = load_quran()
    idx = TafsirIndex(book, quran)
    os.makedirs(INDEX_DIR, exist_ok=True)
    out = os.path.join(INDEX_DIR, f'{book}.json')
    d = idx.to_json()
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False)
    print(f"{book}: {d['n_located']}/6236 located -> {out}")
    return idx


def main():
    ap = argparse.ArgumentParser(description='مُرجِع engine')
    sub = ap.add_subparsers(dest='cmd', required=True)
    b = sub.add_parser('index')
    b.add_argument('--book', required=True, choices=sorted(BOOKS))
    l = sub.add_parser('lookup')
    l.add_argument('surah', type=int)
    l.add_argument('ayah', type=int)
    l.add_argument('--book', required=True, choices=sorted(BOOKS))
    l.add_argument('--full', action='store_true')
    args = ap.parse_args()
    if args.cmd == 'index':
        build_index(args.book)
    else:
        idx = TafsirIndex(args.book, load_quran())
        r = idx.lookup(args.surah, args.ayah)
        r['length'] = (r['char_end'] or 0) - (r['char_start'] or 0)
        ex = r.pop('excerpt')
        print(json.dumps(r, ensure_ascii=False, indent=1))
        if ex:
            print('--- excerpt ---')
            print(ex if args.full or len(ex) <= 3000
                  else ex[:3000] + '\n…[truncated]')


if __name__ == '__main__':
    main()
