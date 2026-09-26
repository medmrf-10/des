#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_links.py — فهرس مصطلح الحديث (العينة الثانية من منهج jadid2/fihris).

يقرأ:
  - data/hadith_nodes.json   الشجرة المراجَعة يدوياً + روابط العقد بمعرفات الذرات
  - jadid2/atoms/<series>/index.json  فهارس الذرات (file + char_start + char_end)
  - jadid2/src/transcripts/<series>/  نصوص التفريغ — للتحقق الآلي فقط

يكتب:
  - data/hadith_links.json   الخراطة المحسوبة: عقدة ← ذرات بمواضعها الحقيقية

قاعدة التحقق (تُطبَّق على كل ربط):
  loc  عنوان الذرة — بعد التطبيع — يجب أن يتضمن اسماً مستعاراً للعقدة
       (الذرة مخصّصة للموضوع أو لفرع مسمّى منه).
  via  الموضوع غير مسمّى في العنوان لكن اسماً مستعاراً يجب أن يظهر في
       متن الذرة نفسها (الموضوع مبحوث داخل وحدة مغايرة العنوان).

تشغيل:  python3 jadid2/fihris/hadith/tools/build_links.py   (من جذر الريبو)
"""
import json
import re
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve()
HADITH = HERE.parents[1]                     # jadid2/fihris/hadith
JADID2 = HERE.parents[3]                     # jadid2/
ATOMS_DIR = JADID2 / "atoms"
TRANSCRIPTS = JADID2 / "src" / "transcripts"
NODES_FILE = HADITH / "data" / "hadith_nodes.json"
OUT_LINKS = HADITH / "data" / "hadith_links.json"

_DIACRITICS = re.compile(r"[ً-ٰٟـۖ-ۭﭐ-﮿＂«»\"'!؟?.,،؛:()\[\]{}<>|/\\\-ـ—_]+")

def norm(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "")
    s = _DIACRITICS.sub(" ", s)
    s = re.sub("[أإآٱ]", "ا", s)
    s = s.replace("ى", "ي").replace("ة", "ه")
    s = re.sub(r"\s+", " ", s).strip()
    return s

def main():
    doc = json.load(open(NODES_FILE, encoding="utf-8"))
    series_keys = list(doc["_sources"].keys())          # s775, s776
    # تحميل فهارس الذرات والنصوص
    atoms = {}
    for sk in series_keys:
        src = doc["_sources"][sk]
        idx = json.load(open(JADID2.parent / src["atoms"], encoding="utf-8"))
        atoms[sk] = {e["id"]: e for e in idx["entries"]}
    text_cache = {}
    def body(sk, e):
        key = (sk, e["file"])
        if key not in text_cache:
            p = JADID2.parent / doc["_sources"][sk]["transcripts"] / e["file"]
            text_cache[key] = open(p, encoding="utf-8").read()
        return text_cache[key][e["char_start"]:e["char_end"]]

    problems, links, stats = [], [], {}
    seen_nodes = [0]

    def walk(n):
        seen_nodes[0] += 1
        for kind in ("loc", "via"):
            for sk, aids in (n.get(kind) or {}).items():
                if sk not in atoms:
                    problems.append(f"{n['id']}: سلسلة مجهولة {sk}")
                    continue
                for aid in aids:
                    e = atoms[sk].get(aid)
                    if not e:
                        problems.append(f"{n['id']}: ذرة غير موجودة {sk}/{aid}")
                        continue
                    ntitle, ntext = norm(e["title"]), norm(body(sk, e))
                    # كل اسم مستعار يُجرَّب بصورتيه: كاملة وبعد تجريد «ال»
                    # (عناوين الذرات تفلت التعريف غالباً: «لجهالة الراوي»، «وضع الحديث»)
                    variants = [v for a in n.get("aliases", [])
                                for v in {norm(a), re.sub(r"^ال", "", norm(a))} if v]
                    hit_t = [v for v in variants if v in ntitle]
                    hit_b = [v for v in variants if v in ntext]
                    if kind == "loc" and not hit_t:
                        problems.append(f"{n['id']}:{aid} loc بلا تسمية في العنوان «{e['title']}»")
                    if kind == "via" and hit_t:
                        problems.append(f"{n['id']}:{aid} via لكن العنوان يسمّيه «{e['title']}» (يجب loc)")
                    if kind == "via" and not hit_b:
                        problems.append(f"{n['id']}:{aid} via بلا ذكر في المتن")
                    links.append({
                        "node": n["id"], "node_title": n["t"],
                        "series": sk, "atom": aid, "kind": kind,
                        "atom_title": e["title"],
                        "file": e["file"],
                        "char_start": e["char_start"], "char_end": e["char_end"],
                        "chars": e["char_end"] - e["char_start"],
                        "inferred_atom": bool(e.get("inferred")),
                    })
        for c in n.get("ch", []):
            walk(c)

    for r in doc["tree"]:
        walk(r)

    # إحصاء التغطية
    for sk in series_keys:
        all_ids = set(atoms[sk])
        linked = {l["atom"] for l in links if l["series"] == sk}
        nodes_for = {l["node"] for l in links if l["series"] == sk}
        stats[sk] = {
            "atoms_total": len(all_ids), "atoms_linked": len(linked),
            "coverage_atoms_pct": round(100 * len(linked) / len(all_ids), 1),
            "nodes_covered": len(nodes_for),
            "loc": sum(1 for l in links if l["series"] == sk and l["kind"] == "loc"),
            "via": sum(1 for l in links if l["series"] == sk and l["kind"] == "via"),
        }
    stats["nodes_total"] = seen_nodes[0]
    stats["links_total"] = len(links)

    out = {
        "_doc": "مشتق آلياً من data/hadith_nodes.json عبر tools/build_links.py — لا يُحرَّر يدوياً.",
        "_kinds": {"loc": "وحدة مخصصة (العنوان يسمّي الموضوع)", "via": "داخل وحدة مغايرة العنوان (المتن يذكره)"},
        "_paths": "file نسبة إلى jadid2/src/transcripts/<series>/ — char_start/char_end مواضع بايت-محارف بايثون في النص الخام.",
        "stats": stats,
        "links": links,
    }
    json.dump(out, open(OUT_LINKS, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    print(f"عقد: {stats['nodes_total']} | روابط: {stats['links_total']}")
    for sk in series_keys:
        s = stats[sk]
        print(f"{sk}: {s['atoms_linked']}/{s['atoms_total']} ذرة مربوطة ({s['coverage_atoms_pct']}%) | عقد مغطاة {s['nodes_covered']} | loc={s['loc']} via={s['via']}")
    if problems:
        print(f"\n! {len(problems)} مشكلة تحقق:")
        for p in problems:
            print("  -", p)
    else:
        print("\nكل الروابط تجتاز قاعدة التحقق (loc بالعنوان / via بالمتن).")

if __name__ == "__main__":
    main()
