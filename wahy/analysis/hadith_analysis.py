#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""أداة تحليل بيانات الحديث في وحي (wahy/data/hadith).

تقرأ حزم <book>-det.json.gz (أسانيد كاملة + مجموعات معنى) و topics.json.gz
(شجرة موضوعات الجامع) وتنتج:

  stats    إحصاءات الأسانيد لكل كتاب: عدد الأحاديث والأسانيد، توزيع أطوال
           السلاسل، توزيع الأحكام (حكم المعنى وحكم السند)، أعلى المعاني
           روايةً (sahaba_qty) وتكراراً (repeat_qty).
  network  شبكة الرواة: حواف راوٍ←راوٍ عبر كل سلاسل الكتب الستة — أكثر
           الرواة تحميلاً للرواية، أعلى الصحابة (آخر السند) وأعلى شيوخ
           المؤلفين (أول ما بعد المؤلف)، والرواة المشتركون بين الكتب.
  match    مطابقة المعاني بين الكتب: معرّف مجموعة المعنى الموحّد (مفتاح g)
           مشترك عبر الكتب الستة — تغطية كل معنى (في كم كتاباً)، مصفوفة
           التقاطع وجاكارد بين الأزواج، واتفاق/اختلاف الحكم على المعنى
           الواحد بين الكتب، وملخص توزيع الموضوعات الكبرى.

الاستخدام:
  python3 hadith_analysis.py stats|network|match|all [--data-dir DIR]
        [--base-url URL] [--json OUT] [--top N]

الافتراضي: --data-dir يشير إلى ../data/hadith نسبةً لموضع هذا الملف، أو
--base-url لجلب الحزم مباشرة من الموقع المنشور.
"""
import argparse, gzip, io, json, sys, urllib.request
from collections import Counter, defaultdict
from pathlib import Path

BOOKS = ["bukhari", "muslim", "tirmidhi", "abi-dawud", "nasai", "ibn-majah"]
BOOK_AR = {
    "bukhari": "صحيح البخاري", "muslim": "صحيح مسلم",
    "tirmidhi": "جامع الترمذي", "abi-dawud": "سنن أبي داود",
    "nasai": "سنن النسائي", "ibn-majah": "سنن ابن ماجه",
}
BOOK_IDX = {"bukhari": 1, "muslim": 2, "tirmidhi": 3,
            "abi-dawud": 4, "nasai": 5, "ibn-majah": 6}
IDX_BOOK = {v: k for k, v in BOOK_IDX.items()}

AR_DIAC = dict.fromkeys(map(ord, "ًٌٍَُِّْٰـٓ"), None)

def norm(name):
    """تطبيع خفيف لاسم الراوي للمطابقة عبر الكتب."""
    n = name.translate(AR_DIAC)
    n = (n.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
           .replace("ى", "ي").replace("ؤ", "و").replace("ئ", "ي"))
    return " ".join(n.split())

def load_gz(data_dir, base_url, name):
    if base_url:
        with urllib.request.urlopen(f"{base_url.rstrip('/')}/{name}") as r:
            return json.loads(gzip.GzipFile(fileobj=io.BytesIO(r.read())).read())
    with gzip.open(Path(data_dir)/name, "rt", encoding="utf-8") as f:
        return json.load(f)

def load_all(args):
    det, topics = {}, None
    for s in BOOKS:
        det[s] = load_gz(args.data_dir, args.base_url, f"{s}-det.json.gz")
    try:
        topics = load_gz(args.data_dir, args.base_url, "topics.json.gz")
    except Exception:
        pass
    return det, topics

def median(xs):
    xs = sorted(xs)
    n = len(xs)
    return xs[n//2] if n % 2 else (xs[n//2-1]+xs[n//2])/2

# ---------------------------------------------------------------- stats
def cmd_stats(det, top):
    out = {"books": {}}
    for s in BOOKS:
        d, sn, g = det[s]["d"], det[s]["s"], det[s]["g"]
        n_chains = sum(len(v) for v in sn.values())
        lens = [len(c[1]) for chains in sn.values() for c in chains]
        sanad_hukm = Counter(c[0].split("،")[0].strip()
                             for ch in sn.values() for c in ch if c[0])
        group_hukm = Counter(v["h"] for v in g.values())
        multi = sum(1 for v in sn.values() if len(v) > 1)
        top_sahaba = sorted(g.items(), key=lambda kv: -kv[1].get("s", 0))[:top]
        top_repeat = sorted(g.items(), key=lambda kv: -kv[1].get("r", 0))[:top]
        out["books"][s] = {
            "name": BOOK_AR[s], "hadiths": len(d), "chains": n_chains,
            "multi_sanad_hadiths": multi, "groups": len(g),
            "chain_len": {"min": min(lens), "max": max(lens),
                          "mean": round(sum(lens)/len(lens), 2),
                          "median": median(lens)},
            "group_hukm": dict(group_hukm.most_common()),
            "sanad_hukm_top": dict(sanad_hukm.most_common(8)),
            "top_sahaba_qty": [{"gid": k, "sahaba": v["s"],
                                "text": v["t"][:80]} for k, v in top_sahaba],
            "top_repeat_qty": [{"gid": k, "repeat": v["r"],
                                "text": v["t"][:80]} for k, v in top_repeat],
        }
    return out

def print_stats(res):
    print("="*70 + "\nإحصاءات الأسانيد والمعاني — الكتب الستة\n" + "="*70)
    for s, b in res["books"].items():
        print(f"\n### {b['name']} ({s})")
        print(f"  أحاديث: {b['hadiths']} | أسانيد: {b['chains']} "
              f"({b['multi_sanad_hadiths']} حديثاً بأكثر من سند) | معانٍ: {b['groups']}")
        cl = b["chain_len"]
        print(f"  طول السند: أدنى {cl['min']} — وسيط {cl['median']} "
              f"— متوسط {cl['mean']} — أقصى {cl['max']}")
        print(f"  أحكام المعاني: {b['group_hukm']}")
        print(f"  أحكام الأسانيد (أول وصف): {b['sanad_hukm_top']}")
        print("  أعلى المعاني كثرةَ صحابة:")
        for r in b["top_sahaba_qty"][:5]:
            print(f"    [{r['gid']}] {r['sahaba']} صحابياً — {r['text']}…")
        print("  أعلى المعاني تكراراً في الأمهات:")
        for r in b["top_repeat_qty"][:5]:
            print(f"    [{r['gid']}] {r['repeat']} مرة — {r['text']}…")

# ---------------------------------------------------------------- network
def build_graph(det):
    """حواف شيخ←تلميذ (اتجاه الرواية للأسفل: ناقل→من روى عنه)."""
    edges = Counter()          # (teacher, student) -> qty
    carriers = Counter()       # narrator -> chains through him
    last_hop = Counter()       # chain[-1] (الصحابي غالباً)
    after_author = Counter()   # chain[1] (شيخ المؤلف)
    book_narrators = defaultdict(set)
    for s in BOOKS:
        for chains in det[s]["s"].values():
            for _, chain in chains:
                ns = [norm(x) for x in chain]
                for i, n in enumerate(ns):
                    carriers[n] += 1
                    book_narrators[s].add(n)
                    if i: edges[(ns[i-1], n)] += 1
                if len(ns) >= 2:
                    after_author[ns[1]] += 1
                    last_hop[ns[-1]] += 1
    return edges, carriers, last_hop, after_author, book_narrators

def cmd_network(det, top):
    edges, carriers, last_hop, after_author, book_narr = build_graph(det)
    students, teachers = defaultdict(set), defaultdict(set)
    for (t, st), _ in edges.items():
        teachers[t].add(st); students[st].add(t)
    hubs = sorted(carriers, key=lambda n: -carriers[n])[:top]
    out = {
        "narrators": len(carriers), "distinct_edges": len(edges),
        "top_carriers": [{"n": n, "chains": carriers[n],
                          "students": len(teachers[n]),
                          "teachers": len(students[n])} for n in hubs],
        "top_sahaba": [{"n": n, "chains": c} for n, c in last_hop.most_common(top)],
        "top_shuyukh_authors": [{"n": n, "chains": c}
                                for n, c in after_author.most_common(top)],
        "top_edges": [{"from": a, "to": b, "qty": q}
                      for (a, b), q in edges.most_common(top)],
        "shared_between_books": {},
        "per_book_narrators": {s: len(v) for s, v in book_narr.items()},
    }
    for i, s1 in enumerate(BOOKS):
        for s2 in BOOKS[i+1:]:
            inter = book_narr[s1] & book_narr[s2]
            out["shared_between_books"][f"{s1}|{s2}"] = len(inter)
    all_shared = set.intersection(*book_narr.values())
    out["in_all_six"] = len(all_shared)
    out["in_all_six_names"] = sorted(all_shared, key=lambda n: -carriers[n])[:30]
    return out

def print_network(res):
    print("\n" + "="*70 + "\nشبكة الرواة — الكتب الستة مجتمعة\n" + "="*70)
    print(f"رواة متميزون: {res['narrators']} | حواف متميزة: {res['distinct_edges']}")
    print("رواة في كل الكتب الستة:", res["in_all_six"])
    print("\nأثقل الرواة تحميلاً (عدد السلاسل المارة بهم):")
    for r in res["top_carriers"][:15]:
        print(f"  {r['chains']:>6} | {r['n'][:60]}  (تلاميذ:{r['students']} شيوخ:{r['teachers']})")
    print("\nأكثر الصحابة (آخر السند):")
    for r in res["top_sahaba"][:10]:
        print(f"  {r['chains']:>6} | {r['n'][:60]}")
    print("\nأكثر شيوخ المؤلفين (أول ما بعد المؤلف):")
    for r in res["top_shuyukh_authors"][:10]:
        print(f"  {r['chains']:>6} | {r['n'][:60]}")
    print("\nأثقل الحواف راوٍ←راوٍ:")
    for r in res["top_edges"][:10]:
        print(f"  {r['qty']:>6} | {r['from'][:35]} ← {r['to'][:35]}")
    print("\nالرواة المشتركون بين كل زوج كتب:")
    for k, v in res["shared_between_books"].items():
        a, b = k.split("|")
        print(f"  {BOOK_AR[a]} × {BOOK_AR[b]}: {v}")
    print("\nأسماء مشتركة في الستة (أعلى 15):", "، ".join(res["in_all_six_names"][:15]))

# ---------------------------------------------------------------- match
def cmd_match(det, topics, top):
    books_of_gid = defaultdict(set)
    hukm_of = {}
    for s in BOOKS:
        for gid, g in det[s]["g"].items():
            books_of_gid[gid].add(s)
            hukm_of.setdefault(gid, {})[s] = g["h"]
    cover = Counter(len(v) for v in books_of_gid.values())
    six = [g for g, v in books_of_gid.items() if len(v) == 6]
    per_book_gids = {s: set(det[s]["g"]) for s in BOOKS}
    pairs, union = {}, {}
    for i, a in enumerate(BOOKS):
        for b in BOOKS[i+1:]:
            pairs[(a, b)] = per_book_gids[a] & per_book_gids[b]
            union[(a, b)] = per_book_gids[a] | per_book_gids[b]
    disagree = []
    for gid, hv in hukm_of.items():
        if len(hv) > 1 and len(set(hv.values())) > 1:
            disagree.append({"gid": gid, "hukm": hv,
                             "text": next(iter(det[s]['g'][gid]['t'] for s in hv))[:80]})
    out = {
        "distinct_meanings": len(books_of_gid),
        "coverage_hist": {str(k): cover[k] for k in sorted(cover)},
        "in_all_six": len(six),
        "in_all_six_sample": [{"gid": g,
                               "text": next(iter(det[s]['g'][g]['t'] for s in BOOKS if g in det[s]['g']))[:80],
                               "sahaba": next(iter(det[s]['g'][g].get('s',0) for s in BOOKS if g in det[s]['g']))}
                              for g in six[:top]],
        "pairwise": {f"{a}|{b}": {"shared": len(pairs[(a, b)]),
                                 "jaccard": round(len(pairs[(a, b)])/len(union[(a, b)]), 3)}
                     for a in BOOKS for b in BOOKS
                     if BOOKS.index(a) < BOOKS.index(b)},
        "hukm_disagreement": len(disagree),
        "hukm_disagree_sample": disagree[:top],
    }
    if topics:
        t = topics["t"]
        top_nodes = {i: v for i, v in t.items() if v["l"] == 1}
        agg = {}
        for tid, v in top_nodes.items():
            b = v.get("b", {})
            agg[v["n"]] = {IDX_BOOK.get(int(k), k): c for k, c in b.items()}
        out["top_topics"] = agg
    return out

def print_match(res):
    print("\n" + "="*70 + "\nمطابقة المعاني بين الكتب الستة\n" + "="*70)
    print(f"معانٍ متميزة إجمالاً: {res['distinct_meanings']}")
    print("توزيع التغطية (في كم كتاباً يظهر المعنى):")
    for k in sorted(res["coverage_hist"], key=int):
        print(f"  في {k} كتب: {res['coverage_hist'][k]}")
    print(f"معانٍ في الكتب الستة كلها: {res['in_all_six']}")
    print("\nالتقاطع وجاكارد بين الأزواج:")
    for k, v in res["pairwise"].items():
        a, b = k.split("|")
        print(f"  {BOOK_AR[a]} × {BOOK_AR[b]}: مشترك {v['shared']} — جاكارد {v['jaccard']}")
    print(f"\nمعانٍ اختلف حكمها بين الكتب: {res['hukm_disagreement']}")
    for d in res["hukm_disagree_sample"][:8]:
        print(f"  [{d['gid']}] {d['hukm']} — {d['text']}…")
    if res.get("top_topics"):
        print("\nالمعاني لكل باب كبير (من شجرة الجامع):")
        for n, b in list(res["top_topics"].items())[:15]:
            print(f"  {n}: {b}")

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description="تحليل بيانات الحديث — وحي")
    ap.add_argument("cmd", choices=["stats", "network", "match", "all"])
    ap.add_argument("--data-dir", default=str(Path(__file__).resolve().parent.parent/"data"/"hadith"))
    ap.add_argument("--base-url", default=None,
                    help="مثال: https://medmrf-10.github.io/des/wahy/data/hadith")
    ap.add_argument("--json", default=None)
    ap.add_argument("--top", type=int, default=15)
    args = ap.parse_args()
    det, topics = load_all(args)
    results = {}
    if args.cmd in ("stats", "all"):
        results["stats"] = cmd_stats(det, args.top)
        print_stats(results["stats"])
    if args.cmd in ("network", "all"):
        results["network"] = cmd_network(det, args.top)
        print_network(results["network"])
    if args.cmd in ("match", "all"):
        results["match"] = cmd_match(det, topics, args.top)
        print_match(results["match"])
    if args.json:
        Path(args.json).write_text(json.dumps(results, ensure_ascii=False, indent=1),
                                   encoding="utf-8")
        print(f"\n[json → {args.json}]")

if __name__ == "__main__":
    main()
