#!/usr/bin/env python3
"""Merge jadid2/annotation_work/parts/<series>/*.jsonl -> jadid2/atoms/<series>/annotations.json.

Usage: python3 jadid2/annotation_work/assemble.py "<series>"
Validates full coverage of index.json entry ids, enum fields, difficulty range.
Exit 0 on success (prints OK), exit 1 listing problems.
"""
import json, os, sys, glob

TAXONOMY = {"عقيدة", "فقه", "أصول", "نحو", "صرف", "بلاغة", "حديث", "مصطلح",
            "تفسير", "لغة", "تزكية", "أدب", "سيرة", "أخرى"}
KINDS = {"معلومة", "مهارة"}


def main():
    if len(sys.argv) != 2:
        print("usage: assemble.py <series>")
        sys.exit(2)
    series = sys.argv[1]
    base = os.path.join("jadid2", "atoms", series)
    idx = json.load(open(os.path.join(base, "index.json"), encoding="utf-8"))
    ids = [e["id"] for e in idx["entries"]]
    parts_dir = os.path.join("jadid2", "annotation_work", "parts", series)

    ann = {}
    errs = []
    pfiles = sorted(glob.glob(os.path.join(parts_dir, "*.jsonl")))
    if not pfiles:
        print(f"FAIL: no parts found in {parts_dir}")
        sys.exit(1)
    for pf in pfiles:
        for ln, line in enumerate(open(pf, encoding="utf-8"), 1):
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except Exception:
                errs.append(f"{os.path.basename(pf)}:{ln} bad json")
                continue
            rid = r.get("id")
            if rid in ann:
                errs.append(f"dup id {rid} in {os.path.basename(pf)}:{ln}")
            ann[rid] = r

    missing = [i for i in ids if i not in ann]
    extra = [i for i in ann if i not in set(ids)]
    if missing:
        errs.append(f"missing {len(missing)} ids e.g. {missing[:8]}")
    if extra:
        errs.append(f"{len(extra)} unknown ids e.g. {extra[:8]}")
    for i in ids:
        r = ann.get(i)
        if not r:
            continue
        if r.get("kind") not in KINDS:
            errs.append(f"{i}: bad kind {r.get('kind')!r}")
        if r.get("main_tag") not in TAXONOMY:
            errs.append(f"{i}: bad main_tag {r.get('main_tag')!r}")
        d = r.get("difficulty")
        if not isinstance(d, int) or isinstance(d, bool) or not 1 <= d <= 5:
            errs.append(f"{i}: bad difficulty {d!r}")
        st = r.get("sub_tags")
        if not isinstance(st, list) or not all(isinstance(x, str) and x.strip() for x in st):
            errs.append(f"{i}: bad sub_tags {st!r}")
    if errs:
        print("FAIL")
        for e in errs[:60]:
            print(" -", e)
        sys.exit(1)

    out = {"atoms": {i: {"kind": ann[i]["kind"], "main_tag": ann[i]["main_tag"],
                         "sub_tags": ann[i]["sub_tags"], "difficulty": ann[i]["difficulty"]}
                     for i in ids}}
    op = os.path.join(base, "annotations.json")
    json.dump(out, open(op, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"OK wrote {op} atoms={len(ids)}")


if __name__ == "__main__":
    main()
