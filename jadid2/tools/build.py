"""Build jadid2/data/ indexes.

Sources (cloned outside the repo — see data/sources.json for pins):
  TAFSIR: ~/repos/oss/mosahaf-tafseer/json-data/<NNN>_<slug>.json
  HADITH: ~/repos/oss/hadith-json/db/{by_book,by_chapter}/...
  SHARH : ~/repos/rlg/indexes/fiqh/real_index/data/<book>.units.jsonl

Outputs (small, committed):
  data/sources.json      clone URLs + pinned commits + raw URL templates
  data/surahs.json       surah -> mosahaf filename + ayah count
  data/hadith_books.json book -> {title, chapters, file pattern}
  data/sharh_books.json  sharh book -> meta
  data/matches_<b>.json  hadith -> sharh segment matches (segment atoms embedded)
  data/matn_matches.json متن أبي شجاع -> فتح القريب segments
"""
import glob
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from norm import tokens as _tokens, norm  # noqa: E402
from search import BookIndex, load_units  # noqa: E402

OSS = os.path.expanduser('~/repos/oss')
RLG = os.path.expanduser('~/repos/rlg/indexes/fiqh/real_index/data')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')

TAFSIR_DIR = os.path.join(OSS, 'mosahaf-tafseer/json-data')
HADITH_DB = os.path.join(OSS, 'hadith-json/db')

# commentary books we index (all present in rlg real_index)
SHARH_BOOKS = ['muhadhdhab', 'majmu', 'mughni', 'dhakhira', 'fath_qarib',
               'iqna', 'bidaya', 'fath_muin']
SHARH_META = {
    'muhadhdhab': ('المهذب في فقه الإمام الشافعي', 'أبو إسحاق الشيرازي', 'متن شافعي يستشهد بالأحاديث'),
    'majmu': ('المجموع شرح المهذب', 'الإمام النووي', 'شرح'),
    'mughni': ('المغني', 'ابن قدامة', 'شرح/مقارن حنبلي'),
    'dhakhira': ('الذخيرة', 'القرافي', 'فقه مالكي مقارن'),
    'fath_qarib': ('فتح القريب المجيب', 'ابن قاسم الغزي', 'شرح متن أبي شجاع'),
    'iqna': ('الإقناع في حل ألفاظ أبي شجاع', 'الشربيني', 'شرح متن أبي شجاع'),
    'bidaya': ('بداية المجتهد', 'ابن رشد', 'فقه مقارن حجاجي'),
    'fath_muin': ('إعانة الطالبين', 'البكري الدمياطي', 'شرح فتح المعين'),
}
# hadith corpora we attempt to anchor (sample axis): bulugh is the fiqh-citation
# corpus; nawawi40+qudsi40 are short demo sets.
HADITH_SAMPLE = [
    ('other_books', 'bulugh_almaram'),
    ('forties', 'nawawi40'),
    ('forties', 'qudsi40'),
]

MIN_RUN = 10          # matched tokens
MIN_RUN_SHORT = 6     # + coverage>=0.55 for short matns
_CTX = 1              # atoms of context embedded around the quote


def _sha(repo):
    return subprocess.check_output(['git', '-C', repo, 'rev-parse', 'HEAD'],
                                   text=True).strip()


def extract_matn(arabic: str) -> str:
    """Drop the isnad: matn ~ text after the last قال/يقول speech marker."""
    s = norm(arabic)
    # markers that introduce the matn in citation forms
    marks = [m.end() for m in re.finditer(
        r'(قال رسول الله|قال النبي|صلى الله عليه وسلم|صلى الله عليه وسلم قال|يقول)', s)]
    if marks:
        return s[marks[-1]:].strip()
    return s  # fallback: whole text (already normalized)


def load_hadiths():
    """-> [{'ref','book','chapter','matn','arabic'}]"""
    out = []
    for grp, slug in HADITH_SAMPLE:
        files = [p for p in glob.glob(os.path.join(
            HADITH_DB, 'by_chapter', grp, slug, '*.json'))
            if os.path.basename(p) != 'all.json']
        for f in sorted(files, key=lambda p: int(os.path.basename(p)[:-5])):
            d = json.load(open(f, encoding='utf-8'))
            ch = d.get('chapter', {})
            for h in d['hadiths']:
                ar = h.get('arabic', '')
                m = extract_matn(ar)
                if len(_tokens(m)) < 6:
                    continue
                out.append({'ref': f'{slug}:{h["idInBook"]}', 'book': slug,
                            'chapter': ch.get('arabic', ''),
                            'id': h['id'], 'idInBook': h['idInBook'],
                            'matn': m, 'arabic': ar})
    return out


def build_tafsir_manifest():
    rows = []
    for f in sorted(glob.glob(os.path.join(TAFSIR_DIR, '*.json'))):
        d = json.load(open(f, encoding='utf-8'))
        rows.append({'n': d['number'], 'name': d['surah'],
                     'file': os.path.basename(f), 'ayat': len(d['ayahs'])})
    return rows


def build_hadith_manifest():
    books = []
    for grp in ('the_9_books', 'other_books'):
        for f in sorted(glob.glob(os.path.join(HADITH_DB, 'by_book', grp, '*.json'))):
            d = json.load(open(f, encoding='utf-8'))
            slug = os.path.basename(f)[:-5]
            chdir = os.path.join(HADITH_DB, 'by_chapter', grp, slug)
            nch = len(glob.glob(os.path.join(chdir, '*.json'))) if os.path.isdir(chdir) else len(d.get('chapters', []))
            books.append({'id': d['id'], 'slug': slug, 'group': grp,
                          'title': d['metadata']['arabic']['title'],
                          'author': d['metadata']['arabic']['author'],
                          'hadiths': len(d['hadiths']), 'chapters': nch})
    for f in sorted(glob.glob(os.path.join(HADITH_DB, 'by_book', 'forties', '*.json'))):
        d = json.load(open(f, encoding='utf-8'))
        slug = os.path.basename(f)[:-5]
        books.append({'id': d['id'], 'slug': slug, 'group': 'forties',
                      'title': d['metadata']['arabic']['title'],
                      'author': d['metadata']['arabic']['author'],
                      'hadiths': len(d['hadiths']), 'chapters': len(d.get('chapters', []))})
    return books


def main():
    os.makedirs(OUT, exist_ok=True)
    sources = {
        'tafsir': {
            'repo': 'https://github.com/meibassam/mosahaf-tafseer',
            'commit': _sha(os.path.join(OSS, 'mosahaf-tafseer')),
            'raw': 'https://raw.githubusercontent.com/meibassam/mosahaf-tafseer/main/json-data/{file}',
            'books': ['التفسير الميسر', 'تفسير السعدي', 'تفسير ابن كثير',
                      'تفسير الوسيط لطنطاوي', 'تفسير البغوي', 'تفسير القرطبي',
                      'تفسير الطبري', 'تفسير الجلالين']},
        'hadith': {
            'repo': 'https://github.com/AhmedBaset/hadith-json',
            'commit': _sha(os.path.join(OSS, 'hadith-json')),
            'raw': 'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_chapter/{group}/{slug}/{chapter}.json'},
        'sharh': {
            'repo': 'medmrf-10/rlg (indexes/fiqh/real_index)',
            'note': 'units.jsonl atoms = literal book text pieces'},
    }
    json.dump(sources, open(f'{OUT}/sources.json', 'w'),
              ensure_ascii=False, indent=1)

    json.dump(build_tafsir_manifest(), open(f'{OUT}/surahs.json', 'w'),
              ensure_ascii=False, indent=0)
    json.dump(build_hadith_manifest(), open(f'{OUT}/hadith_books.json', 'w'),
              ensure_ascii=False, indent=0)
    json.dump({b: {'title': SHARH_META[b][0], 'author': SHARH_META[b][1],
                   'kind': SHARH_META[b][2]}
               for b in SHARH_BOOKS},
              open(f'{OUT}/sharh_books.json', 'w'), ensure_ascii=False, indent=1)

    hadiths = load_hadiths()
    print(f'hadiths loaded: {len(hadiths)}')

    for book in SHARH_BOOKS:
        idx = BookIndex(load_units(os.path.join(RLG, f'{book}.units.jsonl')))
        matches = []
        for h in hadiths:
            hits = idx.match(h['matn'], min_run=MIN_RUN)
            if not hits:
                hits = idx.match(h['matn'], min_run=MIN_RUN_SHORT)
                hits = [x for x in hits if x['coverage'] >= 0.55]
            if not hits:
                continue
            top = hits[0]
            i0, texts = idx.hit_atoms(top, ctx=_CTX)
            matches.append({
                'ref': h['ref'], 'book': h['book'], 'idInBook': h['idInBook'],
                'chapter': h['chapter'], 'matn': h['matn'],
                'run': top['run'], 'coverage': top['coverage'],
                'unit': top['unit'],
                'path': idx.unit_path(top['unit']),
                'a0': i0, 'atoms': texts})
        matches.sort(key=lambda m: (m['book'], m['idInBook']))
        json.dump(matches, open(f'{OUT}/matches_{book}.json', 'w'),
                  ensure_ascii=False)
        print(f'{book}: {len(matches)} matches')

    # ---- matn -> sharh axis: متن أبي شجاع quoted inside فتح القريب ----
    matn = load_units(os.path.join(RLG, 'abi_shuja.units.jsonl'))
    sharh = BookIndex(load_units(os.path.join(RLG, 'fath_qarib.units.jsonl')))
    mm = []
    for u in matn:
        for a in u.get('atoms', []):
            t = _tokens(a)
            if len(t) < 4:
                continue
            hits = sharh.match(a, min_run=4)
            hits = [x for x in hits if x['coverage'] >= 0.5]
            if not hits:
                continue
            top = hits[0]
            i0, texts = sharh.hit_atoms(top, ctx=1)
            mm.append({'matn': a[:300], 'matn_unit': u['i'],
                       'unit': top['unit'], 'path': sharh.unit_path(top['unit']),
                       'run': top['run'], 'coverage': top['coverage'],
                       'a0': i0, 'atoms': texts})
    json.dump(mm, open(f'{OUT}/matn_matches.json', 'w'), ensure_ascii=False)
    print(f'matn->sharh matches: {len(mm)}')


if __name__ == '__main__':
    main()
