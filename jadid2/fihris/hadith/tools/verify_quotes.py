#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
verify_quotes.py — عينة التحقق النصي: لكل عقدة مختارة اقتباس ~60 حرفاً من متن
الذرة المربوطة (file + char_start/char_end حقيقيان)، يُظهر أن الربط صحيح.

يكتب SAMPLE.md. تشغيل: python3 jadid2/fihris/hadith/tools/verify_quotes.py
(من جذر الريبو). الاقتباس يُقطع حول أول ورود لاسم العقدة داخل متن الذرة.
"""
import json
import re
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve()
HADITH = HERE.parents[1]
JADID2 = HERE.parents[3]
ATOMS_DIR = JADID2 / "atoms"
TRANSCRIPTS = JADID2 / "src" / "transcripts"
LINKS = json.load(open(HADITH / "data" / "hadith_links.json", encoding="utf-8"))
NODES = json.load(open(HADITH / "data" / "hadith_nodes.json", encoding="utf-8"))

# عينة التحقق العشرية: تغطي السلسلتين، وloc وvia، وفروعاً مختلفة
PICKS = [
    ("h.mutawatir",      "s775", "002.03"),
    ("h.mashhur",        "s775", "003.07"),
    ("h.sahih.shurut",   "s776", "776-002-e06"),
    ("h.hasan.dhati",    "s775", "011.03"),
    ("h.ziyada",         "s775", "012.03"),
    ("h.mursal",         "s776", "776-005-e06"),
    ("h.munqati",        "s776", "776-006-e02"),   # via: المنقطع داخل ذرة «التابعي الكبير»
    ("h.mudallas",       "s776", "776-007-e01"),
    ("h.mawdu",          "s775", "020.02"),
    ("h.marfu3",         "s776", "776-011-e05"),
]

_DIACRITICS = re.compile(r"[ً-ٰٟـۖ-ۭﭐ-﮿＂«»\"'!؟?.,،؛:()\[\]{}<>|/\\\-ـ—_]+")
def norm(s):
    s = unicodedata.normalize("NFKC", s or "")
    s = _DIACRITICS.sub(" ", s)
    s = re.sub("[أإآٱ]", "ا", s)
    s = s.replace("ى", "ي").replace("ة", "ه")
    return re.sub(r"\s+", " ", s).strip()

def get_node(nid):
    out = {}
    def w(n):
        out[n["id"]] = n
        for c in n.get("ch", []):
            w(c)
    for r in NODES["tree"]:
        w(r)
    return out[nid]

lines = ["# عينة التحقق — 10 عقد × اقتباس ~60 حرفاً من متن الذرة",
         "",
         "كل اقتباس مقصوص آلياً من `file[char_start:char_end]` الحقيقي (انظر `hadith_links.json`).",
         "الموضع الذي ورد فيه اسم العقدة داخل الاقتباس معلَّم بـ【】.",
         ""]
for nid, sk, aid in PICKS:
    n = get_node(nid)
    link = next(l for l in LINKS["links"]
                if l["node"] == nid and l["series"] == sk and l["atom"] == aid)
    src = NODES["_sources"][sk]
    raw = open(JADID2.parent / src["transcripts"] / link["file"], encoding="utf-8").read()
    seg = raw[link["char_start"]:link["char_end"]]
    # أول ورود لأي اسم مستعار
    pos, hit = -1, ""
    for a in n.get("aliases", []):
        for v in {norm(a), re.sub(r"^ال", "", norm(a))}:
            i = norm(seg).find(v)
            if i >= 0 and (pos < 0 or i < pos):
                pos, hit = i, v
    nseg = norm(seg)
    start = max(0, pos - 25) if pos >= 0 else 0
    quote = nseg[start:start + 60]
    if pos >= 0 and 25 <= pos - start <= 60:
        quote = quote[:pos - start] + "【" + hit + "】" + quote[pos - start:]
    lines.append(f"## {n['id']} — «{n['t']}»")
    lines.append(f"- الرابط: `{sk}/{aid}` ({link['kind']}) — «{link['atom_title']}»")
    lines.append(f"- الموضع: `{link['file']}` chars {link['char_start']}–{link['char_end']}")
    lines.append(f"- الاقتباس: …{quote}…")
    lines.append("")

out = HADITH / "SAMPLE.md"
open(out, "w", encoding="utf-8").write("\n".join(lines))
print("wrote", out)
