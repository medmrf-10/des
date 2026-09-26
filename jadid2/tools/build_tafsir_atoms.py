"""مولّد فهارس الذرات للتفاسير — يستهلك فهارس مُرجِع (murji).

كل نطاق «آية + تفسيرها» الذي حدده مُرجِع هو ذرة بمفهوم المنصة، فهذا
السكربت يحوّل indexes/murji/<book>.json إلى فهرس ذرات بالمخطط الموحد
{series, sheikh, entries:[{id,title,inferred,file,char_start,char_end,tags}]}
داخل jadid2/atoms/tafsir_<book>/، ويكتب summary.md لكل كتاب.

العنوان = نص الآية حرفياً من wahy/data/surah/<n>.json (inferred=false).

ملاحظة المواضع: char_start/char_end إزاحات داخل «النص المعاد بناؤه» من
مصدر الكتاب (groups[vg[k]].x بترتيب المصحف، مجموعات مكررة تُسقَط، تُلصق
بـ«\n») — نفس عقد مُرجِع الموثّق في murji/README.md. بصمة sha256_16 في
الفهرس تُطابَق عند التوليد فتكشف أي انحراف عن نسخة المصدر.

الاستخدام:
  python3 build_tafsir_atoms.py                    # يولّد الكتابين
  python3 build_tafsir_atoms.py --book saadi       # كتاب واحد
  python3 build_tafsir_atoms.py --verify 20 --seed 7   # عينة فحص
"""
import argparse
import gzip
import hashlib
import json
import os
import random
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from norm import norm as _norm  # نفس وصفة jadid2/tools

_TOOLS = os.path.dirname(os.path.abspath(__file__))  # jadid2/tools
_JADID2 = os.path.dirname(_TOOLS)                    # jadid2
_REPO = os.path.dirname(_JADID2)                     # repo root

SURAH_DIR = os.path.join(_REPO, 'wahy', 'data', 'surah')
MURJI_DIR = os.path.join(_JADID2, 'murji', 'indexes', 'murji')
ATOMS_DIR = os.path.join(_JADID2, 'atoms')

BOOKS = {
    'ibn_kathir': {
        'dir': 'tafsir_ibn_kathir',
        'sheikh': 'إسماعيل بن كثير',
        'book_title': 'تفسير ابن كثير (تفسير القرآن العظيم)',
    },
    'saadi': {
        'dir': 'tafsir_saadi',
        'sheikh': 'عبد الرحمن بن ناصر السعدي',
        'book_title': 'تيسير الكريم الرحمن في تفسير كلام المنان',
    },
    'jalalayn': {
        'dir': 'tafsir_jalalayn',
        'sheikh': 'جلال الدين المحلي وجلال الدين السيوطي',
        'book_title': 'تفسير الجلالين',
    },
    'tabari': {
        'dir': 'tafsir_tabari',
        'sheikh': 'محمد بن جرير الطبري',
        'book_title': 'تفسير الطبري (جامع البيان عن تأويل آي القرآن)',
    },
}


def load_quran():
    """-> (ayah_text {(s,a): text}, surah_names {s: name_ar}) بترتيب المصحف."""
    ayahs, names = {}, {}
    for n in range(1, 115):
        d = json.load(open(os.path.join(SURAH_DIR, f'{n}.json'),
                           encoding='utf-8'))
        names[n] = d['ar']
        for v in d['verses']:
            ayahs[(n, v['a'])] = v['t']
    return ayahs, names


def reconstruct_text(source_rel):
    """نص الكتاب المتصل من مصدره — نفس وصفة مُرجِع الموثقة (لا يستورد المحرك)."""
    d = json.load(gzip.open(os.path.join(_REPO, source_rel), 'rt',
                            encoding='utf-8'))
    groups, vg = d['groups'], d.get('vg', {})

    def _sk(k):
        s, a = k.split(':')
        return int(s), int(a)

    ayah_keys = sorted(vg, key=_sk) if vg else sorted(groups, key=_sk)
    seen, parts = set(), []
    for ak in ayah_keys:
        gk = vg.get(ak, ak)
        if gk in seen or gk not in groups:
            continue
        seen.add(gk)
        parts.append(groups[gk]['x'])
    return '\n'.join(parts)


def build(book):
    """-> (index_dict, stats) لفهرس ذرات كتاب واحد."""
    idx = json.load(open(os.path.join(MURJI_DIR, f'{book}.json'),
                         encoding='utf-8'))
    ayahs, surah_names = load_quran()

    # بصمة المصدر: النص المعاد بناؤه يجب أن يطابق ما فُهرس عليه
    text = reconstruct_text(idx['source'])
    sha = hashlib.sha256(text.encode()).hexdigest()[:16]
    assert sha == idx['sha256_16'], (
        f'{book}: reconstructed sha {sha} != index {idx["sha256_16"]}')

    entries, stats = [], {
        'conf': {'high': 0, 'medium': 0, 'low': 0, 'none': 0},
        'shared': 0, 'missing': [], 'title_over_250': 0,
        'surahs': set(), 'low_by_surah': {}, 'collapsed_unresolved': [],
        'thin': 0, 'hdr_leak': [],
    }

    # بنية المصدر: عدد المجموعات وكم منها يغطي >1 آية وكم فارغ بلا نص
    src = json.load(gzip.open(os.path.join(_REPO, idx['source']), 'rt',
                              encoding='utf-8'))
    from collections import Counter
    refc = Counter(src.get('vg', {}).values())
    stats['n_groups'] = len(src['groups'])
    stats['multi_groups'] = sum(1 for c in refc.values() if c > 1)
    stats['empty_ayahs'] = sum(
        1 for ak, gk in src.get('vg', {}).items()
        if not src['groups'].get(gk, {}).get('x', '').strip())
    hdr_re = re.compile(r'^(تفسير\s+)?سور[ةه]\s')
    prev_span = None
    for e in idx['entries']:
        s, a = map(int, e['k'].split(':'))
        conf = e.get('conf', 'none')
        stats['conf'][conf] = stats['conf'].get(conf, 0) + 1
        if conf == 'none' or e['cs'] is None:
            stats['missing'].append(e['k'])
            continue
        if conf == 'low':
            stats['low_by_surah'][s] = stats['low_by_surah'].get(s, 0) + 1
        span = (e['cs'], e['ce'])
        if span == prev_span:
            stats['shared'] += 1
        prev_span = span
        # تسرب ترويسة سورة أجنبية إلى رأس الذرة (خواتيم سور بلا اقتباس)
        first_line = _norm(text[e['cs']:e['cs'] + 80].split('\n', 1)[0])
        if (hdr_re.match(first_line)
                and _norm(surah_names[s]) not in first_line):
            stats['hdr_leak'].append(e['k'])
        title = ayahs.get((s, a), '')
        if len(title) > 250:
            stats['title_over_250'] += 1
        stats['surahs'].add(s)
        entries.append({
            'id': e['k'],
            'title': title,
            'inferred': False,
            'file': idx['source'],
            'char_start': e['cs'],
            'char_end': e['ce'],
            'tags': ['تفسير', 'قرآن', f'سورة:{surah_names[s]}'],
        })
    # آيات انهار نطاقها (cs==ce): مُرجِع وجد الاقتباس لكنه شارك علامة
    # استشهاد مع الجار، فسكن الشرح في الكتلة المشتركة التالية — نوسّع
    # الذرة إلى نهاية تلك الكتلة (نفس دلالة conf=low الكتلة المشتركة).
    stats['collapsed'] = []
    for i, e in enumerate(entries):
        if e['char_end'] > e['char_start']:
            continue
        p = e['char_start']
        end = p
        for j in range(i, len(entries)):
            if entries[j]['char_start'] != p:
                break
            end = max(end, entries[j]['char_end'])
        if end > p:
            e['char_end'] = end
            stats['collapsed'].append(e['id'])
        else:
            stats['collapsed_unresolved'].append(e['id'])
    stats['thin'] = sum(
        1 for e in entries if e['char_end'] - e['char_start'] < 80)
    index = {'series': BOOKS[book]['dir'], 'sheikh': BOOKS[book]['sheikh'],
             'entries': entries}
    stats['idx'] = idx
    stats['text_len'] = len(text)
    return index, stats


def write_summary(book, index, stats, out_dir):
    idx, conf = stats['idx'], stats['conf']
    n, n_idx = len(index['entries']), idx['n_ayahs']
    low_sorted = sorted(stats['low_by_surah'].items(),
                        key=lambda kv: -kv[1])[:10]
    lines = [
        f'# {BOOKS[book]["book_title"]} — فهرس الذرات',
        '',
        f'- المصدر: `{idx["source"]}` (sha256_16 `{idx["sha256_16"]}`)',
        f'- الذرات: **{n}** من {n_idx} آية '
        f'({100.0 * n / n_idx:.1f}%) عبر {len(stats["surahs"])} سورة',
        f'- الثقة من مُرجِع: عالية {conf["high"]} · وسطى {conf["medium"]} · '
        f'منخفضة {conf["low"]} · معدومة {conf["none"]}',
        f'- بنية المصدر: {stats["n_groups"]} مجموعة، منها '
        f'{stats["multi_groups"]} تغطي آياتٍ مجتمعة؛ وآيات بلا نص '
        f'في المصدر أصلاً (مجموعة فارغة): {stats["empty_ayahs"]}',
        f'- مقاطع مشتركة (آية تتشارك نطاق جارتها، conf=low): '
        f'{stats["shared"]}',
        f'- نطاقات منهارة وسّعناها إلى كتلتها المشتركة: '
        f'{len(stats["collapsed"])}' +
        (f' (لم تُحلّ: {", ".join(stats["collapsed_unresolved"])})'
         if stats['collapsed_unresolved'] else ''),
        f'- ذرات رقيقة (<80 حرفاً — شريحة اقتباس، الشرح في ذرة آخر '
        f'آية من الاقتباس المشترك): {stats["thin"]}',
        f'- ذرات تبدأ بترويسة سورة أخرى: {len(stats["hdr_leak"])}' +
        (f' — {", ".join(stats["hdr_leak"][:15])}'
         + ('…' if len(stats['hdr_leak']) > 15 else '')
         if stats['hdr_leak'] else ''),
        '',
        '## عقد المواضع',
        '',
        '`char_start`/`char_end` إزاحات حرفية داخل **النص المعاد بناؤه** من '
        'المصدر — لا داخل ملف الـJSON نفسه. الوصفة (مطابقة لمُرجِع):',
        '',
        '```python',
        'd = json.load(gzip.open(file))            # wahy/data/tafsir/*.json.gz',
        'parts = [d["groups"][gk]["x"] for gk in',
        '         dict.fromkeys(d["vg"][k] for k in sorted(',
        '             d["vg"], key=lambda k: tuple(map(int, k.split(":")))))',
        '         if gk in d["groups"]]',
        'text = "\\n".join(parts)',
        '```',
        '',
        '## أين يخفق',
        '',
        '- `conf=low` ({0}) تعني غياب اقتباس لفظي صريح للآية — النطاق '
        'فجوة بين جارين محددين أو كتلة مشتركة، فبدايته تقريبية.'.format(
            conf['low']),
        '- النطاقات المنهارة ({0}): آيات اقتباسها شارك علامة الاستشهاد مع '
        'جارها فدمجهما مُرجِع في كتلة واحدة؛ وسّعنا char_end إلى نهاية '
        'الكتلة فيحمل كلٌّ نص الشرح المشترك كاملاً.'.format(
            len(stats['collapsed'])),
        '- الاقتباس المشترك المتصل (آيتان+ داخل تنوسيص واحد ﴿…﴾): الآيات '
        'غير الأخيرة تحصل على شريحة من الاقتباس فقط، ونص الشرح يسكن في '
        'ذرة الآية الأخيرة من الكتلة — {0} ذرة رقيقة (<80 حرفاً).'.format(
            stats['thin']),
        '- خواتيم السور بلا اقتباس: قد تبدأ الفجوة بترويسة السورة الموالية '
        'فيتسلل عنوان غريب إلى رأس الذرة — {0} حالة.'.format(
            len(stats['hdr_leak'])),
        '- الآيات المفقودة (conf=none): ' +
        (', '.join(stats['missing']) if stats['missing'] else 'لا شيء'),
        '- آيات مجموعتها في المصدر فارغة (`x=""`): {0} — لا تفسير '
        'لها أصلاً، فيرجع لها مقطع الكتلة الجارة.'.format(
            stats['empty_ayahs']),
    ]
    if low_sorted:
        lines += ['', 'أكثر السور بمواضع منخفضة الثقة:'] + [
            f'- سورة {s}: {c} آية' for s, c in low_sorted]
    if stats['title_over_250']:
        lines += ['',
                  f'- ملاحظة: {stats["title_over_250"]} عنواناً يتجاوز '
                  '250 حرفاً (نص الآية كاملاً كما هو — مثل 2:282).']
    with open(os.path.join(out_dir, 'summary.md'), 'w',
              encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')


def verify(book, n=20, seed=None):
    """عينة عشوائية من فهرس الذرات المولّد: أول 80 حرفاً من كل مقطع."""
    idx = json.load(open(os.path.join(MURJI_DIR, f'{book}.json'),
                         encoding='utf-8'))
    atoms = json.load(open(os.path.join(ATOMS_DIR, BOOKS[book]['dir'],
                                        'index.json'), encoding='utf-8'))
    conf = {e['k']: e.get('conf') for e in idx['entries']}
    ayahs, _ = load_quran()
    text = reconstruct_text(idx['source'])
    rng = random.Random(seed)
    sample = rng.sample(atoms['entries'], min(n, len(atoms['entries'])))
    sample.sort(key=lambda e: tuple(map(int, e['id'].split(':'))))
    for e in sample:
        s, a = map(int, e['id'].split(':'))
        seg = text[e['char_start']:e['char_end']].strip().replace(
            '\n', ' ⏎ ')
        print(f"== {e['id']} [{conf.get(e['id'])}] "
              f"الآية: {ayahs[(s, a)][:60]}")
        print(f"   المقطع[{e['char_start']}:{e['char_end']}]: {seg[:80]}")


def main():
    ap = argparse.ArgumentParser(description='توليد فهارس ذرات التفاسير')
    ap.add_argument('--book', choices=sorted(BOOKS))
    ap.add_argument('--verify', type=int, metavar='N', default=0,
                    help='طباعة عينة N آية للفحص بدل التوليد')
    ap.add_argument('--seed', type=int, default=None)
    args = ap.parse_args()
    books = [args.book] if args.book else list(BOOKS)
    for book in books:
        if args.verify:
            verify(book, args.verify, args.seed)
            continue
        index, stats = build(book)
        out_dir = os.path.join(ATOMS_DIR, BOOKS[book]['dir'])
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(out_dir, 'index.json'), 'w',
                  encoding='utf-8') as f:
            json.dump(index, f, ensure_ascii=False, indent=1)
        write_summary(book, index, stats, out_dir)
        c = stats['conf']
        print(f"{book}: {len(index['entries'])} ذرة "
              f"(high {c['high']} / medium {c['medium']} / low {c['low']} "
              f"/ none {c['none']}) → {out_dir}")


if __name__ == '__main__':
    main()
