#!/usr/bin/env python3
"""build_gidnet.py — شبكة المعنى (nightly build).

يبني analysis.js: كائن window.GIDNET واحد يجمع، لكل مجموعة معنى موحدة (gid):
  t  طرف المعنى المشترك (نص)
  h  حكم المعنى الموحد
  s  sahaba_qty — عدد الصحابة الرواة للمعنى
  r  repeat_qty — عدد مرات ورود المعنى في الأمهات
  w  مواضع الوقوع {كتاب: [أرقام الحديث فيه]}
  x  مرجع الإحالة {كتاب: أول رقم حديث} (مُعاد بناؤه — x المصدر جزئي)
  j  نصوص أحكام الأسناد {كتاب: {رقم: [حكم سند، ...]}}
  n  الرواة {كتاب: [rawi_id، ...]} — معرفات في جدول rawi العام، مرتبة ظهور

ويضيف تقرير التغطية الطبقية per-topic وفق منهج الشامي (docs/hadith_methodology.md):
  cov[leaf_tid] = {sa: gids في الصحيحين فقط، mx: صحيحان+سنن، zu: سنن فقط (زوائد)}
  (طبقتا الموطأ/المسند غائبتان — المدخلات الكتب الستة فقط)

الاستعمال:
  python3 build_gidnet.py [--data-dir ../data/hadith] [--topics ../data/hadith/topics.json.gz]
                          [--base-url https://medmrf-10.github.io/des/wahy/data/hadith]
                          [-o analysis.js]
"""
import argparse, gzip, io, json, sys, urllib.request

BOOKS = ["bukhari", "muslim", "tirmidhi", "abi-dawud", "nasai", "ibn-majah"]
BOOK_AR = {
    "bukhari": "صحيح البخاري", "muslim": "صحيح مسلم", "tirmidhi": "سنن الترمذي",
    "abi-dawud": "سنن أبي داود", "nasai": "سنن النسائي", "ibn-majah": "سنن ابن ماجه",
}
SAHIHAYN = {"bukhari", "muslim"}
SUNAN = {"tirmidhi", "abi-dawud", "nasai", "ibn-majah"}
PSEUDO_RAWI = {"موضع تعليق", "موضع إرسال", "موضع انقطاع"}  # عقد صورية لا رواة


def load_gz(path_or_url):
    if path_or_url.startswith("http"):
        with urllib.request.urlopen(path_or_url) as r:
            return json.load(io.BytesIO(r.read()))
    with gzip.open(path_or_url, "rt", encoding="utf-8") as f:
        return json.load(f)


def src(name, data_dir, base_url):
    return f"{base_url}/{name}" if base_url else f"{data_dir}/{name}"


def layer(bs):
    """طبقة المعنى: sa صحيحان فقط / mx صحيحان+سنن / zu سنن فقط."""
    s, u = bool(bs & SAHIHAYN), bool(bs & SUNAN)
    return "mx" if s and u else "sa" if s else "zu"


def main():
    ap = argparse.ArgumentParser(description="بناء شبكة المعنى GIDNET")
    ap.add_argument("--data-dir", default="../data/hadith")
    ap.add_argument("--topics", default=None, help="مسار topics.json.gz (افتراضي data-dir)")
    ap.add_argument("--base-url", default=None, help="جلب البيانات من رابط بدل الملفات")
    ap.add_argument("-o", "--out", default="analysis.js")
    args = ap.parse_args()

    det, all_s = {}, {}
    for b in BOOKS:
        det[b] = load_gz(src(f"{b}-det.json.gz", args.data_dir, args.base_url))
        all_s[b] = det[b]["s"]

    topics = load_gz(src("topics.json.gz", args.topics or args.data_dir, args.base_url))
    tt, tg = topics["t"], topics["g"]

    # --- فهرس الرواة العام: الاسم → معرف (ترتيب أول ورود عبر الكتب بالترتيب) ---
    rawi_id, rawi_names = {}, []
    def rid(name):
        i = rawi_id.get(name)
        if i is None:
            i = len(rawi_names)
            rawi_id[name] = i
            rawi_names.append(name)
        return i

    gout = {}
    stats = {"sa": 0, "mx": 0, "zu": 0}
    per_book_gids = {b: set(det[b]["g"].keys()) for b in BOOKS}

    for gid in sorted({g for b in BOOKS for g in per_book_gids[b]}, key=int):
        in_books = {b for b in BOOKS if gid in det[b]["g"]}
        ref = next(b for b in BOOKS if b in in_books)  # canonical حسب ترتيب BOOKS
        g0 = det[ref]["g"][gid]
        w, x, j, n = {}, {}, {}, {}
        for b in sorted(in_books, key=BOOKS.index):
            nums = det[b]["g"][gid]["hs"]
            w[b], x[b] = nums, min(nums)
            jm, rawi_list, seen = {}, [], set()
            for num in nums:
                chains = all_s[b].get(str(num), [])
                jm[str(num)] = [h for h, _ in chains]
                for _, rawis in chains:
                    for rname in rawis:
                        if rname in PSEUDO_RAWI or rname in seen:
                            continue
                        seen.add(rname)
                        rawi_list.append(rid(rname))
            j[b], n[b] = jm, rawi_list
        stats[layer(in_books)] += 1
        gout[gid] = {"t": g0["t"], "h": g0["h"], "s": g0["s"], "r": g0["r"],
                     "w": w, "x": x, "j": j, "n": n}

    # --- التغطية الطبقية لكل موضوع ورقي ---
    cov = {}
    for tid, gids in tg.items():
        c = {"sa": [], "mx": [], "zu": []}
        for gid in gids:
            bs = {b for b in BOOKS if str(gid) in per_book_gids[b]}
            c[layer(bs)].append(gid)
        cov[tid] = c

    out = {
        "meta": {
            "name": "GIDNET — شبكة المعنى",
            "books": BOOKS, "book_ar": BOOK_AR,
            "gids": len(gout), "rawi": len(rawi_names),
            "layers": stats,
            "layers_ar": {"sa": "معتمد على الصحيحين فقط",
                          "mx": "في الصحيحين ومُسند على السنن",
                          "zu": "زوائد — في السنن فقط"},
            "fields": {"g": "{t,h,s,r,w,x,j,n}", "t": "{n,p}", "rawi": "[name]",
                       "cov": "{leaf_tid:{sa:[],mx:[],zu:[]}}"},
        },
        "g": gout, "rawi": rawi_names,
        "t": {tid: {"n": v["n"], "p": v["p"]} for tid, v in tt.items()},
        "tg": tg, "cov": cov,
    }
    with open(args.out, "w", encoding="utf-8") as f:
        f.write("window.GIDNET = ")
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    size_mb = len(json.dumps(out, ensure_ascii=False).encode()) / 1e6
    print(f"gids={len(gout)} rawi={len(rawi_names)} topics={len(tt)} leaf_cov={len(cov)}")
    print(f"layers: sahihayn_only={stats['sa']} mixed={stats['mx']} zawaid={stats['zu']}")
    print(f"{args.out}: ~{size_mb:.1f} MB")


if __name__ == "__main__":
    sys.exit(main())
