#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
مولّد بيانات «الفهرس العام» — أصول الفقه (عينة كتابين).

يقرأ tools/mapping.json (الربط اليدوي) + صفحات/فهارس الكتابين من
HuggingFace dataset AuthenticIlm/Shamela4_Full_DB (نفس مصدر rlg/indexes/fiqh)،
يقصّ نص كل عنوان (من علامة toc-N إلى العلامة التالية بترتيب رقم الصفحة)،
ويكتب:
  data/units_<book>.js  — وحدات كل كتاب (العنوان، الصفحة، النص الحرفي)
  data/index.js         — شجرة الفهرس + روابط العقد (مستقل/داخل-وحدة) + إحصاء التدقيق
التشغيل:  python3 tools/build.py [cache_dir]     (cache_dir الافتراضي ~/usul)
"""
import json, re, sys, urllib.request, unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT  = HERE.parent / "data"
CACHE = Path(sys.argv[1] if len(sys.argv) > 1 else Path.home() / "usul")
CATEGORY = "11__أصول-الفقه"
HF = ("https://huggingface.co/datasets/AuthenticIlm/Shamela4_Full_DB"
      "/resolve/main/" + urllib.parse.quote(CATEGORY))
FILES = ["pages.jsonl", "toc.jsonl", "book_metadata.json"]
MARK = re.compile(r'<span data-type=["\']title["\'] id=toc-(\d+)>(.*?)</span>', re.S)

import urllib.parse

mapping = json.loads((HERE / "mapping.json").read_text(encoding="utf-8"))

def fetch(ds_id, fname, cache, sub):
    d = cache / (sub or ds_id)
    p = d / fname
    if p.exists():
        return p.read_text(encoding="utf-8")
    url = f"{HF}/{urllib.parse.quote(ds_id)}/{fname}"
    d.mkdir(parents=True, exist_ok=True)
    p.write_bytes(urllib.request.urlopen(url).read())
    return p.read_text(encoding="utf-8")

def norm(s):
    s = unicodedata.normalize("NFKD", s)
    return re.sub(r"[^\w\s]", "", s)

def units_of(ds_id, sub):
    """اقطع الكتاب إلى وحدات: كل عنوان toc-N ← نصه حتى العنوان التالي."""
    toc   = [json.loads(l) for l in fetch(ds_id, "toc.jsonl", CACHE, sub).splitlines() if l.strip()]
    pages = [json.loads(l) for l in fetch(ds_id, "pages.jsonl", CACHE, sub).splitlines() if l.strip()]
    meta  = json.loads(fetch(ds_id, "book_metadata.json", CACHE, sub))
    pages.sort(key=lambda p: (p["page_num"], p["sequence_num"]))
    body = "\n".join(p["body"] or "" for p in pages)
    marks = list(MARK.finditer(body))
    by_mark = {}   # sid -> (title, page_num, plain text of its span)
    for i, m in enumerate(marks):
        sid = int(m.group(1))
        end = marks[i + 1].start() if i + 1 < len(marks) else len(body)
        txt = re.sub(r"<[^>]+>", "", body[m.end():end]).strip()
        # صفحة العلامة: أول صفحة تحوي بداية العلامة
        upto = body[: m.start()].count("──PAGE──")  # fallback
        by_mark[sid] = {"sid": sid, "t": m.group(2).strip(), "text": txt}
    # رقم صفحة كل علامة: أعدّ تركيب الصفحات مع حدود واضحة
    pos = 0
    spans = []   # (start_offset, page_num)
    for p in pages:
        spans.append((pos, p["page_num"]))
        pos += len(p["body"] or "") + 1
    def page_of(off):
        r = spans[0][1]
        for o, pn in spans:
            if o <= off: r = pn
            else: break
        return r
    for i, m in enumerate(marks):
        by_mark[int(m.group(1))]["p"] = page_of(m.start())
    # تحقق: كل sid في toc له علامة نصية
    toc_ids = {t["shamela_title_id"] for t in toc}
    missing = toc_ids - set(by_mark)
    if missing:
        raise SystemExit(f"[{ds_id}] toc sids without text markers: {sorted(missing)}")
    return meta, by_mark

units, metas = {}, {}
for key, b in mapping["books"].items():
    meta, by_mark = units_of(b["ds_id"], b.get("dir"))
    metas[key] = meta
    units[key] = by_mark
    meta_out = {"slug": key, "title": b["title"], "author": b["author"],
                "death": b["death"], "kind": b["kind"]}
    out = [dict(meta_out, u=0)]  # صف 0: وصف الكتاب
    for sid, u in sorted(by_mark.items()):
        out.append({"i": len(out), "sid": sid, "t": u["t"], "p": u["p"], "text": u["text"]})
    (OUT / f"units_{key}.js").write_text(
        f"window.F2_UNITS_{key.upper()}=" + json.dumps(out, ensure_ascii=False) + ";\n",
        encoding="utf-8")
    print(f"[{key}] {len(out)-1} units  {sum(len(u['text']) for u in out[1:])} chars")

# ---- الروابط: loc→exact / via→approx، مع التحقق من وجود كل sid ----
sid_index = {k: {u["sid"] for u in v.values() if "sid" in u} for k, v in units.items()}
for k, v in units.items():
    sid_index[k] = set(v)
audit = {"exact": {}, "approx": {}, "missing": {}, "bad_refs": []}

def resolve(node):
    """يرجع {book: {i:[unit idx], approx:bool}} لعقدة + يملأ audit."""
    node["links"] = {}
    for bk in mapping["books"]:
        exact = node.get("loc", {}).get(bk)
        via = node.get("via", {}).get(bk)
        sids = exact or via
        if not sids:
            node["links"][bk] = None
            audit["missing"].setdefault(bk, []).append(node["id"])
            continue
        refd = [u for u in units[bk].values() if u["sid"] in sids]
        if len(refd) != len(sids):
            audit["bad_refs"].append((node["id"], bk, sids))
        node["links"][bk] = {"u": [u["sid"] for u in sorted(refd, key=lambda x: x["sid"])],
                             "approx": not bool(exact)}
        (audit["approx"] if not exact else audit["exact"]).setdefault(bk, []).append(node["id"])

total_nodes = 0
for top in mapping["tree"]:
    stack = [top]
    while stack:
        n = stack.pop()
        total_nodes += 1
        resolve(n)
        stack.extend(n.get("ch", []))

stats = {}
for bk in mapping["books"]:
    e, a, m = len(audit["exact"].get(bk, [])), len(audit["approx"].get(bk, [])), len(audit["missing"].get(bk, []))
    stats[bk] = {"exact": e, "approx": a, "missing": m,
                 "coverage": round(100 * (e + a) / total_nodes, 1),
                 "exact_pct": round(100 * e / total_nodes, 1)}
if audit["bad_refs"]:
    raise SystemExit("refs to missing sids: " + repr(audit["bad_refs"]))

index = {
    "science": "أصول الفقه",
    "note": "شجرة مبنية من عناوين الكتابين الحقيقية — الورقات (478هـ) + الأصول من علم الأصول (1421هـ)",
    "books": mapping["books"],
    "tree": mapping["tree"],
    "appendix": mapping["appendix"],
    "stats": stats,
    "total_nodes": total_nodes,
}
(OUT / "index.js").write_text(
    "window.F2_INDEX=" + json.dumps(index, ensure_ascii=False) + ";\n", encoding="utf-8")
print(f"nodes={total_nodes} stats={json.dumps(stats, ensure_ascii=False)}")
