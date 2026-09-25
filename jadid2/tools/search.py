"""Boundary matcher: anchor a reference text (hadith matn / متن phrase) to a
precise atom span inside a commentary book (sharh).

Model: each sharh book is a list of atoms (literal text pieces) grouped into
units with heading paths, loaded from rlg real_index *.units.jsonl.

Algorithm
---------
1. Normalize every atom; keep per-atom token list + global token offset.
2. Inverted index: token 4-gram (shingle) -> [(atom_i, token_pos)].
3. Query Q (hadith/matn tokens). Each shingle hit gives
   (q_pos, global_a_pos); aligned contiguous matches share the diagonal
   d = q_pos - global_a_pos. The longest run of consecutive q positions on
   one diagonal = the longest common contiguous token span between Q and
   the book — automatically spanning atom boundaries since positions are
   global.
4. Segment = atom range covering the matched span; boundary precision =
   token offsets inside the edge atoms.

Score = matched run length (tokens); coverage = run / |Q|.
"""
import json
import re
from collections import defaultdict

from norm import tokens as _tokens

SHINGLE = 4
WORD = re.compile(r'\S+')


class BookIndex:
    """Normalized atom corpus of one book + shingle inverted index."""

    def __init__(self, units):
        self.units = units
        self.atoms = []   # {'unit','ai','text','toks'}
        for u in units:
            for j, a in enumerate(u.get('atoms', [])):
                nt = _tokens(a)
                if nt:
                    self.atoms.append({'unit': u['i'], 'ai': j, 'text': a,
                                       'toks': nt})
        self.inv = defaultdict(list)
        self.base = []
        g = 0
        for i, at in enumerate(self.atoms):
            self.base.append(g)
            toks = at['toks']
            for p in range(len(toks) - SHINGLE + 1):
                self.inv[' '.join(toks[p:p + SHINGLE])].append(g + p)
            g += len(toks)
        self.total_tokens = g

    def match(self, query: str, min_run: int = 8, max_diag_hits: int = 5000):
        """Hits sorted by run: {g0,g1, q0,q1, run, a0,a1, unit, coverage}."""
        Q = _tokens(query)
        diag = defaultdict(set)          # d -> {q positions hit}
        for q in range(len(Q) - SHINGLE + 1):
            sh = ' '.join(Q[q:q + SHINGLE])
            lst = self.inv.get(sh)
            if not lst:
                continue
            if len(lst) > max_diag_hits:
                continue                 # boilerplate shingle — skip
            for g in lst:
                diag[q - g].add(q)

        out = []
        for d, qs in diag.items():
            srt = sorted(qs)
            start = prev = srt[0]
            for q in srt[1:] + [None]:
                if q is None or q != prev + 1:
                    run = prev - start + SHINGLE
                    if run >= min_run:
                        out.append({'q0': start, 'q1': prev + SHINGLE,
                                    'run': run, 'g0': start - d,
                                    'g1': prev + SHINGLE - d})
                    if q is not None:
                        start = q
                prev = q

        for h in out:
            h['a0'] = self._atom_at(h['g0'])
            h['a1'] = self._atom_at(h['g1'] - 1)
            h['unit'] = self.atoms[h['a0']]['unit']
            h['coverage'] = round(h['run'] / max(1, len(Q)), 3)
        out.sort(key=lambda h: -h['run'])
        return out

    def _atom_at(self, gpos):
        import bisect
        i = bisect.bisect_right(self.base, gpos) - 1
        return max(0, min(i, len(self.atoms) - 1))

    def hit_atoms(self, hit, ctx=0):
        """Atoms of a hit (+ctx neighbors); returns (start_i, texts)."""
        i0 = max(0, hit['a0'] - ctx)
        i1 = min(len(self.atoms) - 1, hit['a1'] + ctx)
        return i0, [self.atoms[i]['text'] for i in range(i0, i1 + 1)]

    def unit_path(self, unit_i):
        u = next((x for x in self.units if x['i'] == unit_i), None)
        if not u:
            return []
        p = list(u.get('path') or [])
        if u.get('title'):
            p.append(u['title'])
        return p


def load_units(path):
    return [json.loads(l) for l in open(path, encoding='utf-8') if l.strip()]
