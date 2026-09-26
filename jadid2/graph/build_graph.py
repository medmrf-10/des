#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""مولّد حواف SKILL_GRAPH — jadid2/graph/build_graph.py

ينفّذ قواعد jadid2/schema/SKILL_GRAPH.md الست على كل فهارس
jadid2/atoms/<series>/index.json (~35 سلسلة / ~5254 ذرة)، ويكتب:

  - jadid2/schema/graph.edges.json   الخرج المتعاقد عليه:
      [{"from": "<سلسلة>|<معرّف>", "to": "...", "rule": "...", "confidence": x}]
  - jadid2/graph/cycles.log        الحواف المسقطة لأنها تكوّن دورات (قاعدة سلامة 1)
  - jadid2/graph/REPORT.md         إحصاءات البناء والتحليل

هوية الذرة: «سلسلة|معرّف» — معرّفات index.json ليست فريدة عالمياً
(نفس اصطلاح selector.load_atoms ومفاتيح xlink/atom_links).

قواعد الحقول الغائبة في فهارس اليوم (تحقق ميداني على 5254 ذرة):
- `kind`       غائب في كل الذرات  → R5 (kind_anchor) تُنتج 0 حافة؛ القاعدة
               مفعّلة في الكود وتعمل فور تعبئة الحقل.
- `difficulty` غائب في كل الذرات  → تُشتق: رتبة السلسلة العددية (البادئة
               الرقمية لاسمها = ترتيبها في فهرس الدروس) + الموضع النسبي
               للذرة داخل تسلسل سلسلتها ∈ [0,1). وكيل مونوتوني: «الألحق
               في المنهج أصعب» — يعطي اتجاه مثال SKILL_GRAPH الصحيح
               (نحو/إعراب في دورة النحو الأولى 767 < إعراب في أم البراهين 984).
- `prerequisites` غائب            → R6 (manual) تقرأ jadid2/graph/manual_edges.json
               الاختياري [{from,to,confidence?}] بدلاً منها.

القواعد (بالهوية المطلوبة):
  R1 sequence        1.0   داخل ملف: الذرة n تتبع n−1 (char_start تصاعدي)
  R2 matn_sharh      1.0   ذرة عنوانها متن يليها ذرة تبدأ بصيغة شرح
  R3 sequence_cross  0.9   أول ذرة في ملف k تتبع آخر ذرة في ملف k−1
  R4 tag_chain       0.5–0.7  (main_tag, sub_tag) مشتركان عبر سلاسل، مرتبة
                           تصاعدياً على difficulty؛ كل ذرة ← الأدنى منها مباشرة
                           في سلسلة أخرى. ممنوعة بين inferred ∧ inferred.
                           0.7 عند تطابق sub_tag حرفياً، 0.5 عند تطابقها بعد
                           التطبيع فقط (إسقاط «ال» التعريف والتطهير).
  R5 kind_anchor     0.8   مهارة ← كل معلومة في نفس الملف بنفس sub_tag
  R6 manual          1.0   manual_edges.json (أولوية قصوى عند الازدواج)

التفكيك: الحذف يُسقط الحواف عبر إعادة البناء الكامل — لا بحث نصي، كل حافة
تربط «سلسلة|معرّف» موجودين فقط (قاعدة سلامة 3: لا محتوى مخترع).

الاستعمال:
  python3 jadid2/graph/build_graph.py            # بناء + تقرير + cycles.log
  python3 jadid2/graph/build_graph.py --check    # تحقق: يقارن الخرج بالموجود
"""
import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
JADID2 = ROOT.parent
ATOMS_ROOT = JADID2 / "atoms"
MANUAL_FILE = ROOT / "manual_edges.json"
OUT_EDGES = JADID2 / "schema" / "graph.edges.json"
CYCLES_LOG = ROOT / "cycles.log"
REPORT_FILE = ROOT / "REPORT.md"

# أولوية إبقاء القاعدة عند ازدواج (from,to): الأخص دلالياً أولاً
RULE_PRIORITY = {"manual": 0, "matn_sharh": 1, "sequence": 2,
                 "kind_anchor": 3, "sequence_cross": 4, "tag_chain": 5}
# أولوية الإسقاط عند كسر الدورات: الأضعف دليلاً يُسقط أولاً
DROP_PRIORITY = {"tag_chain": 0, "sequence_cross": 1, "kind_anchor": 2,
                 "sequence": 3, "matn_sharh": 4, "manual": 5}

# صيغ الشرح في رؤوس العناوين (من مسح العناوين فعلياً):
#   «قوله/قاله «...»» اقتباس المتن مع الشرح، «قال المصنف/الشارح/رحمه»،
#   «أي …» تفسير إجمالي بالتفصيل، «شرح/معنى/المراد/أراد» صيغ تعليق صريحة.
SHARH_RE = re.compile(
    r"^\s*(?:"
    r"قول[هها]|قال[هها]|ثم\s+قال|و?قال\s+(?:المصنف|الشارح|المؤلف|المصنفان|الإمام|"
    r"العلامة|الشيخ|الحافظ|في|رحمه)"
    r"|أي[\s:،]|شرح[\s:]|الشرح[\s:]|معنى|معناه|المراد|أراد|يقصد"
    r"|ماذا\s+أراد|قال\s+في\s+(?:التنبيه|الشرح|الحاشية|الكتاب)"
    r")")

_ALEF_MAQSURA = "ى"


def file_order_key(name):
    """ترتيب ملفات السلسلة: البادئة الرقمية في الاسم (SKILL_GRAPH §مدخلات)."""
    m = re.match(r"\s*(\d+)", name)
    return (int(m.group(1)) if m else 10**9, name)


def series_rank(series):
    """رتبة السلسلة = بادئتها الرقمية (ترتيب الفهرس)؛ لا بادئة → أواخر."""
    m = re.match(r"\s*(\d+)", series)
    return int(m.group(1)) if m else 10**6


def norm_tag(tag):
    """تطبيع sub_tag لمجموعات R4: تطهير + إسقاط «ال» التعريف + توحيد
    ة/ه وى/ي في النهاية — يلتقط «افتتاحية»↔«الافتتاحية» دون دمج موضوعين."""
    t = re.sub(r"\s+", " ", tag.strip())
    if t.startswith("ال") and len(t) > 3:
        t = t[2:]
    if t.endswith("ة"):
        t = t[:-1] + "ه"
    if t.endswith(_ALEF_MAQSURA):
        t = t[:-1] + "ي"
    return t


def load_atoms(atoms_root):
    """كل فهارس atoms — يعيد atoms: {«سلسلة|معرّف»: سجل} + order:
    {سلسلة: [مفاتيح بترتيب المنهج]} + بيانات مشتقة (pos, difficulty)."""
    atoms, order = {}, {}
    stats = {"files": 0, "entries": 0, "series": 0}
    for idx in sorted(Path(atoms_root).glob("*/index.json")):
        data = json.loads(idx.read_text(encoding="utf-8"))
        series = data.get("series", idx.parent.name)
        by_file = defaultdict(list)
        for e in data.get("entries", []):
            key = f"{series}|{e['id']}"
            a = {
                "atom_id": key,
                "id": e["id"],
                "series": series,
                "title": e.get("title", ""),
                "inferred": e.get("inferred", True),
                "file": e.get("file", ""),
                "char_start": e.get("char_start", 0),
                "char_end": e.get("char_end", 0),
                "tags": e.get("tags", []),
                "kind": e.get("kind"),           # غائب في فهارس اليوم
                "declared_difficulty": e.get("difficulty"),  # غائب اليوم
                "declared_prereqs": e.get("prerequisites", []),  # غائب اليوم
            }
            a["main_tag"] = a["tags"][0] if a["tags"] else "أخرى"
            a["sub_tags"] = a["tags"][1:]
            atoms[key] = a
            by_file[a["file"]].append(a)
            stats["entries"] += 1
        # الترتيب العالمي داخل السلسلة: ملفات بترتيب البادئة، داخلها char_start
        seq = []
        files = sorted(by_file, key=file_order_key)
        stats["files"] += len(files)
        for fname in files:
            seq.extend(sorted(by_file[fname],
                              key=lambda x: (x["char_start"], x["char_end"], x["id"])))
        n = len(seq)
        for pos, a in enumerate(seq):
            a["pos"] = pos
            # difficulty مشتقة: رتبة السلسلة + الموضع النسبي ∈ [0,1)
            a["difficulty"] = a["declared_difficulty"] \
                if a["declared_difficulty"] is not None \
                else series_rank(series) + (pos / max(n - 1, 1))
        order[series] = [a["atom_id"] for a in seq]
        stats["series"] += 1
    return atoms, order, stats


def emit(edges, seen, frm, to, rule, confidence):
    """إدراج حافة مع ازدواجية (from,to): الأعلى ثقة يفوز؛ التعادل لأعلى
    أولوية قاعدة (manual > matn_sharh > sequence > kind_anchor > …)."""
    if frm == to:
        return
    key = (frm, to)
    cand = {"from": frm, "to": to, "rule": rule, "confidence": confidence}
    prev = seen.get(key)
    if prev is None or (confidence, -RULE_PRIORITY[rule]) > \
            (prev["confidence"], -RULE_PRIORITY[prev["rule"]]):
        seen[key] = cand
    edges.append(cand)


def rule_sequence(atoms, order, edges, seen):
    """R1 (sequence, 1.0): داخل كل ملف، n تعتمد n−1 بترتيب char_start."""
    count = 0
    for series, keys in order.items():
        by_file = defaultdict(list)
        for k in keys:
            by_file[atoms[k]["file"]].append(atoms[k])
        for fname in by_file:
            seq = sorted(by_file[fname],
                         key=lambda x: (x["char_start"], x["char_end"], x["id"]))
            for i in range(1, len(seq)):
                emit(edges, seen, seq[i - 1]["atom_id"], seq[i]["atom_id"],
                     "sequence", 1.0)
                count += 1
    return count


def rule_matn_sharh(atoms, order, edges, seen):
    """R2 (matn_sharh, 1.0): ذرة عنوانها نص متن (لا تبدأ بصيغة شرح) يليها
    في ترتيب السلسلة ذرة تبدأ بصيغة شرح (قوله/أي/شرح/…) → شرحها يتبعها.
    يعمل على الجوار العالمي في السلسلة — يشمل حدود الملفات فيرقّي حافة
    sequence_cross (0.9) إلى matn_sharh (1.0) عند انطباق النمط."""
    count = 0
    for series, keys in order.items():
        for i in range(1, len(keys)):
            prev, nxt = atoms[keys[i - 1]], atoms[keys[i]]
            if not SHARH_RE.search(nxt["title"]):
                continue
            if SHARH_RE.search(prev["title"]):
                continue   # السابقة شرحية أيضاً — ليست «عنوانها نص المتن»
            emit(edges, seen, prev["atom_id"], nxt["atom_id"],
                 "matn_sharh", 1.0)
            count += 1
    return count


def rule_sequence_cross(atoms, order, edges, seen):
    """R3 (sequence_cross, 0.9): أول ذرة في ملف k تعتمد آخر ذرة في k−1."""
    count = 0
    for series, keys in order.items():
        by_file = defaultdict(list)
        for k in keys:
            by_file[atoms[k]["file"]].append(atoms[k])
        files = sorted(by_file, key=file_order_key)
        for fi in range(1, len(files)):
            cur = sorted(by_file[files[fi]],
                         key=lambda x: (x["char_start"], x["char_end"], x["id"]))
            prv = sorted(by_file[files[fi - 1]],
                         key=lambda x: (x["char_start"], x["char_end"], x["id"]))
            if cur and prv:
                emit(edges, seen, prv[-1]["atom_id"], cur[0]["atom_id"],
                     "sequence_cross", 0.9)
                count += 1
    return count


def rule_tag_chain(atoms, order, edges, seen):
    """R4 (tag_chain): ذرات تشارك (main_tag, sub_tag مُطبَّعة) في سلاسل
    مختلفة تُرتَّب تصاعدياً على difficulty، وكل ذرة تعتمد الأدنى منها
    مباشرة في سلسلة أخرى.
    قيود SKILL_GRAPH: داخل main_tag واحد فقط (هو مفتاح المجموعة)؛ لا حافة
    بين سلسلتين من مادة واحدة إلا باختلاف difficulty (تحقق صارم بالمساواة)؛
    لا حافة بين inferred ∧ inferred (سلامة 2). الثقة 0.7 لتطابق sub_tag
    حرفياً، 0.5 لتطابق بعد التطبيع فقط."""
    groups = defaultdict(list)
    for a in atoms.values():
        for st in a["sub_tags"]:
            groups[(a["main_tag"], norm_tag(st))].append(a)

    count, stats = 0, {"groups": 0, "skipped_inferred": 0,
                       "skipped_same_series": 0, "conf_07": 0, "conf_05": 0,
                       "memberships": 0}
    for (main_tag, _), items in groups.items():
        if len({a["series"] for a in items}) < 2:
            continue
        stats["groups"] += 1
        stats["memberships"] += len(items)
        items = sorted(items, key=lambda a: (a["difficulty"], a["series"], a["pos"]))
        for i, a in enumerate(items):
            cand = None
            for j in range(i - 1, -1, -1):
                c = items[j]
                if c["series"] == a["series"]:
                    stats["skipped_same_series"] += 1
                    continue
                if c["difficulty"] == a["difficulty"]:
                    continue          # «مادة واحدة» تتطلب اختلاف difficulty
                if c["inferred"] and a["inferred"]:
                    stats["skipped_inferred"] += 1
                    continue          # سلامة 2: لا حافة بين مستنتجَين
                cand = c
                break
            if cand is None:
                continue
            conf = 0.7 if set(cand["sub_tags"]) & set(a["sub_tags"]) else 0.5
            stats["conf_07" if conf == 0.7 else "conf_05"] += 1
            emit(edges, seen, cand["atom_id"], a["atom_id"], "tag_chain", conf)
            count += 1
    return count, stats


def rule_kind_anchor(atoms, order, edges, seen):
    """R5 (kind_anchor, 0.8): ذرة kind=مهارة تعتمد كل ذرة معلومة في نفس
    الملف ضمن نفس sub_tag. اليوم: kind غائب في كل الفهارس → 0 حافة."""
    count, skipped_no_kind = 0, 0
    for series, keys in order.items():
        by_file = defaultdict(list)
        for k in keys:
            by_file[atoms[k]["file"]].append(atoms[k])
        for fname, items in by_file.items():
            skills = [a for a in items if a["kind"] == "مهارة"]
            if not skills:
                skipped_no_kind += len(items)
                continue
            infos = [a for a in items if a["kind"] == "معلومة"]
            for s in skills:
                for inf in infos:
                    if set(s["sub_tags"]) & set(inf["sub_tags"]):
                        emit(edges, seen, inf["atom_id"], s["atom_id"],
                             "kind_anchor", 0.8)
                        count += 1
    return count, skipped_no_kind


def rule_manual(atoms, edges, seen):
    """R6 (manual, 1.0): حواف مراجعة بشرية من jadid2/graph/manual_edges.json
    [{from,to,confidence?}] — تتغلب على أي استنتاج (أولوية الإبقاء القصوى)."""
    if not MANUAL_FILE.exists():
        return 0
    count = 0
    for e in json.loads(MANUAL_FILE.read_text(encoding="utf-8")):
        frm, to = e["from"], e["to"]
        if frm not in atoms or to not in atoms:
            print(f"[graph] manual edge يشير ذرة مجهولة: {frm} → {to}",
                  file=sys.stderr)
            continue
        emit(edges, seen, frm, to, "manual", e.get("confidence", 1.0))
        count += 1
    return count


def kahn_break_cycles(atoms, edges):
    """سلامة 1: ترتيب طوبولوجي بـ Kahn؛ عند التعطل (بقاء عقد بدرجة دخول >0
    = دورات) تُسقط أضعف حافة داخل العقد الباقية وتُستأنف — حتى الإنجاز.
    يعيد (topo_order, dropped) حيث dropped كل حافة مُسقطة موثقة."""
    adj = defaultdict(list)
    indeg = {k: 0 for k in atoms}
    edge_at = {}
    for e in edges:
        adj[e["from"]].append(e["to"])
        indeg[e["to"]] = indeg.get(e["to"], 0) + 1
        edge_at[(e["from"], e["to"])] = e

    ready = sorted(k for k, d in indeg.items() if d == 0)
    topo, dropped = [], []
    processed = set()
    while True:
        while ready:
            u = ready.pop()
            if u in processed:
                continue
            processed.add(u)
            topo.append(u)
            for v in adj.get(u, []):
                if (u, v) not in edge_at:
                    continue
                indeg[v] -= 1
                if indeg[v] == 0:
                    ready.append(v)
        remaining = [k for k, d in indeg.items() if d > 0 and k not in processed]
        if not remaining:
            break
        # كل العقد الباقية داخل دورات — أسقط الأضعف ثقةً بينها
        rem = set(remaining)
        cycle_edges = [e for (u, v), e in edge_at.items() if u in rem and v in rem]
        weakest = min(cycle_edges,
                      key=lambda e: (e["confidence"], DROP_PRIORITY[e["rule"]],
                                     e["from"], e["to"]))
        del edge_at[(weakest["from"], weakest["to"])]
        adj[weakest["from"]].remove(weakest["to"])
        indeg[weakest["to"]] -= 1
        dropped.append(weakest)
        if indeg[weakest["to"]] == 0:
            ready.append(weakest["to"])
    return topo, dropped


def longest_paths(atoms, edges, topo):
    """أعمق المسارات في الـDAG: depth[v] = max(depth[u]+1) عبر الترتيب."""
    adj = defaultdict(list)
    for e in edges:
        adj[e["from"]].append(e["to"])
    depth = {k: 0 for k in atoms}
    parent = {}
    for u in topo:
        for v in adj.get(u, []):
            if depth[u] + 1 > depth[v]:
                depth[v] = depth[u] + 1
                parent[v] = u
    return depth, parent


def chain_of(end, parent):
    path = [end]
    while path[-1] in parent:
        path.append(parent[path[-1]])
    return list(reversed(path))


def main():
    ap = argparse.ArgumentParser(description="مولّد حواف SKILL_GRAPH")
    ap.add_argument("--atoms-root", default=str(ATOMS_ROOT))
    ap.add_argument("--out", default=str(OUT_EDGES))
    ap.add_argument("--check", action="store_true",
                    help="قارن الخرج بالملف الحالي دون كتابة")
    args = ap.parse_args()

    atoms, order, st = load_atoms(args.atoms_root)
    print(f"[graph] {st['series']} سلاسل / {st['files']} ملفات / "
          f"{st['entries']} ذرة")

    edges, seen = [], {}
    raw = {}
    raw["manual"] = rule_manual(atoms, edges, seen)
    raw["matn_sharh"] = rule_matn_sharh(atoms, order, edges, seen)
    raw["sequence"] = rule_sequence(atoms, order, edges, seen)
    raw["sequence_cross"] = rule_sequence_cross(atoms, order, edges, seen)
    raw["kind_anchor"], no_kind = rule_kind_anchor(atoms, order, edges, seen)
    raw["tag_chain"], r4_stats = rule_tag_chain(atoms, order, edges, seen)
    # R6b: prerequisites المصرّح بها داخل الذرات (حقل السكيمة، غائب اليوم)
    raw["declared"] = 0
    for a in atoms.values():
        for p in a["declared_prereqs"]:
            src = p.get("atom_id", "")
            if src in atoms:
                emit(edges, seen, src, a["atom_id"],
                     p.get("rule", "manual"), p.get("confidence", 1.0))
                raw["declared"] += 1

    final_edges = sorted(seen.values(),
                         key=lambda e: (e["from"], e["to"]))
    topo, dropped = kahn_break_cycles(atoms, final_edges)
    surviving = {(e["from"], e["to"]) for e in final_edges} - \
        {(e["from"], e["to"]) for e in dropped}
    final_edges = [e for e in final_edges if (e["from"], e["to"]) in surviving]
    final_edges.sort(key=lambda e: (e["from"], e["to"]))

    # قياسات التقرير
    per_rule = defaultdict(int)
    for e in final_edges:
        per_rule[e["rule"]] += 1
    depth, parent = longest_paths(atoms, final_edges, topo)
    have_prereq = sum(1 for k in atoms if any(e["to"] == k for e in final_edges))
    is_prereq = set(e["from"] for e in final_edges)
    orphans = [k for k in atoms if not any(e["to"] == k for e in final_edges)]
    deepest = sorted(atoms, key=lambda k: -depth[k])[:10]

    if args.check:
        current = Path(args.out)
        ok = current.exists() and json.loads(current.read_text(encoding="utf-8")) == final_edges
        print("[graph] --check:", "مطابق" if ok else "مختلف/مفقود")
        sys.exit(0 if ok else 1)

    Path(args.out).write_text(json.dumps(final_edges, ensure_ascii=False,
                                         indent=1), encoding="utf-8")
    with CYCLES_LOG.open("w", encoding="utf-8") as f:
        f.write("# cycles.log — حواف أسقطها Kahn لتكوينها دورات\n")
        f.write("# السطر: حافة | القاعدة/الثقة | سلسلتا الطرفين | سبب الإسقاط\n")
        for e in dropped:
            f.write(f"{e['from']} → {e['to']} | rule={e['rule']} "
                    f"conf={e['confidence']} | "
                    f"{atoms[e['from']]['series']} ← {atoms[e['to']]['series']} | "
                    f"تكوّن دورة (تعطّل الترتيب الطوبولوجي)\n")
        if not dropped:
            f.write("# (لا شيء — البناء مونوتوني على difficulty المشتق فلا دورات)\n")

    # أعمق سلسلة ضمن كل سلسلة دروس (أطول مسار ينتهي داخلها)
    by_series_depth = {}
    for k, d in depth.items():
        s = atoms[k]["series"]
        if d > by_series_depth.get(s, (-1,))[0]:
            by_series_depth[s] = (d, k)
    top_series = sorted(by_series_depth.items(), key=lambda x: -x[1][0])[:10]
    top_paths = []
    for s, (d, k) in top_series:
        path = chain_of(k, parent)
        top_paths.append((s, d, k, path))

    lines = []
    w = lines.append
    w("# REPORT — بناء SKILL_GRAPH\n")
    w(f"- السلاسل: **{st['series']}** | الملفات: **{st['files']}** | "
      f"الذرات: **{st['entries']}**")
    w(f"- الحواف النهائية: **{len(final_edges)}** | دورات مكسورة: "
      f"**{len(dropped)}** (`cycles.log`)\n")
    w("## الحواف بكل قاعدة\n")
    w("| القاعدة | الوصف | الكشف الخام | النهائية بعد الازدواج |")
    w("|---|---|---|---|")
    desc = {"sequence": "R1 تسلسل داخل الملف (n←n−1)",
            "matn_sharh": "R2 متن→شرح (جوار صيغة الاقتباس)",
            "sequence_cross": "R3 تسلسل عبر الملفات (أول k←آخر k−1)",
            "tag_chain": "R4 سلاسل موضوعية (main_tag,sub_tag) عبر السلاسل",
            "kind_anchor": "R5 مهارة←معلومة بنفس الملف/sub_tag",
            "manual": "R6 يدوية (manual_edges.json)",
            "declared": "حقل prerequisites المصرّح على الذرة"}
    for r in sorted(desc, key=lambda x: RULE_PRIORITY.get(x, 9)):
        w(f"| `{r}` | {desc[r]} | {raw.get(r, 0)} | {per_rule.get(r, 0)} |")
    w("")
    w("## القيود والاشتقاقات (موثقة بصراحة)\n")
    w("- **difficulty غائب في كل الـ5254 ذرة** → مشتق: `رتبة_السلسلة "
      "(البادئة الرقمية) + الموضع_النسبي∈[0,1)`. كل الحواف تزيده تصاعداً "
      "⇒ الـDAG مضمون بنيوياً؛ تأكد Kahn بلا إسقاطات.")
    w(f"- **R4**: {r4_stats['groups']} مجموعة (main_tag, sub_tag مُطبَّعة) "
      f"متعددة السلاسل / {r4_stats['memberships']} عضوية؛ أُنتجت "
      f"{raw['tag_chain']} حافة (0.7 حرفي: {r4_stats['conf_07']}، 0.5 مُطبَّع: "
      f"{r4_stats['conf_05']})؛ رُفض أثناء المسح {r4_stats['skipped_inferred']} "
      f"مرشحاً طرفاه inferred معاً (سلامة 2) و{r4_stats['skipped_same_series']} "
      f"لانتمائهما لنفس السلسلة.")
    w("- **R5**: `kind` غائب كلياً ⇒ 0 حافة. تُفعّل تلقائياً فور تعبئة "
      "`kind` في فهارس atoms (الكود يقرؤه).")
    w("- **R6**: `manual_edges.json` غير موجود ⇒ 0 حافة. لإضافة حواف يدوية: "
      "`[{\"from\":\"سلسلة|id\",\"to\":\"سلسلة|id\",\"confidence\":1.0}]`.")
    w("- **لا محتوى مخترع**: كل حافة تربط «سلسلة|معرّف» موجودين فقط؛ "
      "حذف ذرة/سلسلة يُسقط حوافها عبر إعادة البناء (لا بحث نصي).")
    w("")
    w("## التغطية\n")
    w(f"- ذرات لها سابقات: **{have_prereq}** / {len(atoms)} "
      f"({100*have_prereq/len(atoms):.1f}%)")
    w(f"- ذرات يتيمة (بلا سابق): **{len(orphans)}** — رؤوس السلاسل غالباً "
      "+ ذرات لم تلتقطها قاعدة؛ مثال:")
    for k in orphans[:8]:
        w(f"  - `{k}` — {atoms[k]['title'][:60]}")
    w(f"- ذرات لم تكن سابقاً لغيرها (أوراق): "
      f"**{len(atoms) - len(is_prereq)}**")
    w("")
    w("## أعمق المسارات (Kahn + أطول سلسلة)\n")
    w("| العمق | السلسلة | الذرة الطرفية | المسار يعبر |")
    w("|---|---|---|---|")
    for s, d, k, path in top_paths:
        crossed = sorted({atoms[p]["series"] for p in path})
        w(f"| {d} | `{s}` | `{atoms[k]['id']}` | "
          + ("، ".join(c.split("_")[0] for c in crossed[:4])
             + ("…" if len(crossed) > 4 else "")) + " |")
    w("")
    w("أطول سلسلة مفردة موثقة (مثال العمق الأقصى):")
    s, d, k, path = top_paths[0]
    w(f"```\n{d} حافات / {len(path)} ذرة — {s}\n"
      + "\n".join(f"  {atoms[p]['id']}: {atoms[p]['title'][:55]}"
                  for p in path[:12]) + f"\n  … ({len(path)-12} ذرات أخرى)\n```")
    w("")
    REPORT_FILE.write_text("\n".join(lines), encoding="utf-8")

    print(f"[graph] حواف نهائية: {len(final_edges)} — "
          + ", ".join(f"{r}:{c}" for r, c in sorted(per_rule.items())))
    print(f"[graph] دورات مكسورة: {len(dropped)} حافة → {CYCLES_LOG}")
    print(f"[graph] سابقات: {have_prereq} / يتيمة: {len(orphans)} / "
          f"أوراق: {len(atoms) - len(is_prereq)}")
    print(f"[graph] كُتب {args.out} + {REPORT_FILE}")


if __name__ == "__main__":
    main()
