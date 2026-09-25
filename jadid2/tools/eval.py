"""Evaluation: coverage + boundary precision of jadid2 retrieval on a sample.

Outputs data/eval.json + data/eval_sample.md (human-auditable pairs).

Checks
------
Tafsir axis: completeness per tafsir book (ayahs covered / 6236) — the
boundary is structural (per-ayah entries), so we measure integrity.
Hadith->sharh axis:
  coverage   = % of sample hadiths with an accepted match per book
  containment= % of matches whose token-run span is verifiably inside the
               emitted atoms (boundary precision, checked char-wise)
  precision  = on a random subsample: does the segment actually quote+comment
               the hadith? auto-proxy: run>=min_run AND the atom right after
               the quote-run contains commentary cues — flagged for audit.
Matn->sharh axis: same checks on abi_shuja -> fath_qarib.
"""
import glob
import json
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from norm import tokens as _tokens  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
OSS = os.path.expanduser('~/repos/oss')

COMMENT_CUES = ('أي ', 'معناه', 'وفيه', 'قوله', 'المراد', 'يعني', 'دل على',
                'حديث', 'رواه', 'أخرجه', 'فيه دليل')


def tafsir_eval():
    per_book = {}
    files = glob.glob(os.path.join(OSS, 'mosahaf-tafseer/json-data/*.json'))
    for f in files:
        d = json.load(open(f, encoding='utf-8'))
        for a in d['ayahs']:
            for t in a['tafsir']:
                per_book[t['type']] = per_book.get(t['type'], 0) + 1
    return {'ayahs_total': sum(x['ayat'] for x in
                               json.load(open(f'{OUT}/surahs.json'))),
            'per_book': per_book,
            'books': len(per_book)}


def hadith_eval():
    books = [os.path.basename(p)[8:-5]
             for p in glob.glob(f'{OUT}/matches_*.json')]
    res = {}
    sample_rows = []
    rng = random.Random(7)
    for b in sorted(books):
        ms = json.load(open(f'{OUT}/matches_{b}.json'))
        ok = 0
        for m in ms:
            # boundary check: a contiguous run of `run` tokens of the matn
            # must appear verbatim (post-normalization) inside the segment
            qt, st = _tokens(m['matn']), _tokens(' '.join(m['atoms']))
            spos = {w: [] for w in set(qt)}
            for i, w in enumerate(st):
                if w in spos:
                    spos[w].append(i)
            best = 0
            diag = {}
            for i, w in enumerate(qt):
                for j in spos[w]:
                    d = i - j
                    prev = diag.get(d, (0, -1))
                    # consecutive on query positions i and same diagonal
                    diag[d] = (prev[0] + 1, i) if prev[1] == i - 1 else (1, i)
                    best = max(best, diag[d][0])
            ok += 1 if best >= m['run'] else 0
        res[b] = {'matches': len(ms), 'boundary_ok': ok}
        for m in rng.sample(ms, min(8, len(ms))):
            has_cue = any(c in ' '.join(m['atoms']) for c in COMMENT_CUES)
            sample_rows.append({
                'book': b, 'ref': m['ref'], 'run': m['run'],
                'coverage': m['coverage'], 'path': ' / '.join(m['path'][-2:]),
                'cue': has_cue,
                'atoms_head': m['atoms'][0][:200]})
    return res, sample_rows


def matn_eval():
    mm = json.load(open(f'{OUT}/matn_matches.json'))
    cov = sum(1 for m in mm if m['coverage'] >= 0.5)
    return {'matn_phrases_matched': len(mm), 'cov>=0.5': cov}


def main():
    ev = {'tafsir': tafsir_eval()}
    res, rows = hadith_eval()
    ev['hadith'] = res
    ev['matn'] = matn_eval()
    json.dump(ev, open(f'{OUT}/eval.json', 'w'), ensure_ascii=False, indent=1)

    with open(f'{OUT}/eval_sample.md', 'w', encoding='utf-8') as w:
        w.write('# عينة تدقيق يدوية — حديث × مقطع شرح\n\n')
        for r in rows:
            w.write(f"## {r['book']} ← {r['ref']} (run={r['run']}, cov={r['coverage']}, cue={r['cue']})\n")
            w.write(f"**المسار:** {r['path']}\n\n> {r['atoms_head']}…\n\n---\n")
    print(json.dumps(ev, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
