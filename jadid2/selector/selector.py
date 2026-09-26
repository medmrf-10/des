#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""محرك اختيار الذرة التالية — jadid2/selector.

المدخل:
  - jadid2/atoms/<series>/index.json     : فهارس الذرات (5254 ذرة).
  - learner_state (ملف JSON)             : قائمة سجلات حالة المتعلم per learner_state.schema.json.
  - حواف SKILL_GRAPH                     : تُشتق آلياً (R1 داخل الملف، R3 بين الملفات)
                                         من المواضع، وتُدمج مع prerequisites الصريحة
                                         ومع schema/graph.edges.json إن وُجد.
  - jadid2/xlink/data/atom_links.json    : خراطة ذرة→عقدة فهرس (لحساب تغطية المنهج).

المخرج: قائمة JSON مرتبة [{atom_id, why, prereqs_met, due_score}, ...].

التشغيل (بلا مكتبات خارجية):
  python3 selector.py                      # متعلم فارغ على كل الذرات
  python3 selector.py --learner FILE.json  # حالة متعلم حقيقية
  python3 selector.py --sim                # محاكاة 20 خطوة (انظر SIM.md)
"""
import argparse
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
JADID2 = ROOT.parent

# —— ثوابت الإتقان والجدولة (انظر SPEC.md §2) ——
STAB_MIN_DAYS = 7.0      # استقرار ≥ 7 أيام شرط الإتقان المشتق
REPS_MIN = 2             # مراجعتان مكتملتان على الأقل
STAB_EPS = 0.5           # قاع الثبات في مقام due_score
GRADE_OK = {"good", "easy"}
REVIEW_STATES = {"learning", "review", "relearning"}

# —— جدولة المحاكاة المبسطة (--sim فقط؛ ليست جدولة الإنتاج — انظر SPEC.md §6) ——
SIM_S0 = {"again": 0.5, "hard": 1.0, "good": 2.5, "easy": 5.0}   # ثبات أول مراجعة (يوم)
SIM_GROWTH = {"again": 0.4, "hard": 1.2, "good": 3.0, "easy": 3.5}
SIM_LAPSE_DUE_DAYS = 0.5


def parse_ts(s):
    """ISO 8601 → datetime UTC؛ يرفع ValueError عند الفشل."""
    return datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(timezone.utc)


def iso(ts):
    return ts.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def file_order_key(name):
    """ترتيب الملفات داخل السلسلة: بادئة الأرقام في الاسم (SKILL_GRAPH §R3)."""
    m = re.match(r"\s*(\d+)", name)
    return (int(m.group(1)) if m else 10**9, name)


# ---------------------------------------------------------------------------
# التحميل
# ---------------------------------------------------------------------------

def load_atoms(atoms_root):
    """كل مدخلات فهارس jadid2/atoms — الهوية القانونية «سلسلة|معرّف» (نفس مفاتيح atom_links)."""
    atoms = {}
    for idx in sorted(Path(atoms_root).glob("*/index.json")):
        data = json.loads(idx.read_text(encoding="utf-8"))
        series = data.get("series", idx.parent.name)
        for e in data.get("entries", []):
            key = f"{series}|{e['id']}"
            atoms[key] = {
                "atom_id": key,
                "id": e["id"],
                "series": series,
                "title": e.get("title", ""),
                "inferred": e.get("inferred", True),
                "file": e.get("file", ""),
                "char_start": e.get("char_start", 0),
                "char_end": e.get("char_end", 0),
                "tags": e.get("tags", []),
                "main_tag": (e.get("tags") or ["أخرى"])[0],
                "kind": e.get("kind"),                    # غائب في فهارس اليوم
                "difficulty": e.get("difficulty"),        # غائب في فهارس اليوم
                "declared_prereqs": e.get("prerequisites", []),
            }
    return atoms


def resolve_atom_id(raw, atoms, id_index):
    """يطابق atom_id في سجل المتعلم مع هوية الذرة:
    (1) «سلسلة|معرّف» حرفياً، (2) معرّف عارٍ فريد عبر الكوربوس، وإلا None."""
    if raw in atoms:
        return raw
    hits = id_index.get(raw, [])
    return hits[0] if len(hits) == 1 else None


def build_edges(atoms, extra_edges_file=None):
    """حواف المتطلبات per SKILL_GRAPH.md:
    R1 الذرة n تعتمد n−1 في نفس الملف (sequence, 1.0).
    R3 أول ذرة في ملف k تعتمد آخر ذرة في ملف k−1 (sequence, 0.9).
    + prerequisites الصريحة على الذرة + ملف graph.edges.json الاختياري.
    يعيد (prereqs: {atom_id: [حواف]}, dropped: [حواف مكسورة بدورة])."""
    prereqs = {k: [] for k in atoms}
    by_series = {}
    for k, a in atoms.items():
        by_series.setdefault(a["series"], []).append(a)

    for series, items in by_series.items():
        by_file = {}
        for a in items:
            by_file.setdefault(a["file"], []).append(a)
        files = sorted(by_file, key=file_order_key)
        for fi, fname in enumerate(files):
            seq = sorted(by_file[fname], key=lambda x: x["char_start"])
            for i in range(1, len(seq)):                    # R1
                prereqs[seq[i]["atom_id"]].append(
                    {"atom_id": seq[i - 1]["atom_id"], "rule": "sequence", "confidence": 1.0})
            if fi > 0 and seq:                              # R3
                prev_file = by_file[files[fi - 1]]
                last_prev = max(prev_file, key=lambda x: x["char_start"])
                prereqs[seq[0]["atom_id"]].append(
                    {"atom_id": last_prev["atom_id"], "rule": "sequence", "confidence": 0.9})

    id_index = _id_index(atoms)
    for k, a in atoms.items():                              # حقول السكيمة الكاملة
        for p in a["declared_prereqs"]:
            src = resolve_atom_id(p["atom_id"], atoms, id_index) or p["atom_id"]
            edge = {"atom_id": src, "rule": p.get("rule", "manual"),
                    "confidence": p.get("confidence", 1.0)}
            if all(e["atom_id"] != src for e in prereqs[k]):
                prereqs[k].append(edge)

    if extra_edges_file and Path(extra_edges_file).exists():
        for e in json.loads(Path(extra_edges_file).read_text(encoding="utf-8")):
            dst = resolve_atom_id(e["to"], atoms, id_index)
            src = resolve_atom_id(e["from"], atoms, id_index)
            if src and dst and all(x["atom_id"] != src for x in prereqs[dst]):
                prereqs[dst].append({"atom_id": src, "rule": e.get("rule", "manual"),
                                     "confidence": e.get("confidence", 1.0)})

    dropped = break_cycles(prereqs)
    return prereqs, dropped


def _id_index(atoms):
    idx = {}
    for k, a in atoms.items():
        idx.setdefault(a["id"], []).append(k)
    return idx


def break_cycles(prereqs):
    """قاعدة السلامة 1: لا دورات — أي حافة تكسر الترتيب الطوبولوجي تُسقط
    (الأدنى ثقة أولاً) وتُعاد في `dropped` للتدقيق."""
    dropped = []
    while True:
        cycle = _find_cycle(prereqs)
        if not cycle:
            return dropped
        edges = [(dst, e) for dst in cycle for e in prereqs[dst]
                 if e["atom_id"] in cycle]
        dst, edge = min(edges, key=lambda x: x[1]["confidence"])
        prereqs[dst] = [e for e in prereqs[dst] if e is not edge]
        dropped.append({"to": dst, **edge})


def _find_cycle(prereqs):
    """DFS تكراري ثلاثي الألوان (لا recursion — سلاسل الذرات بعمق آلاف)
    — يعيد مجموعة عقد الدورة أو None."""
    color = {}
    for start in prereqs:
        if color.get(start):
            continue
        color[start] = 1
        stack = [(start, iter(prereqs.get(start, [])))]
        onpath = [start]
        while stack:
            u, it = stack[-1]
            descended = False
            for e in it:
                v = e["atom_id"]
                if v not in prereqs:          # حافة إلى ذرة مجهولة — لا دورة عبرها
                    continue
                c = color.get(v, 0)
                if c == 1:
                    return set(onpath[onpath.index(v):])
                if c == 0:
                    color[v] = 1
                    stack.append((v, iter(prereqs.get(v, []))))
                    onpath.append(v)
                    descended = True
                    break
            if not descended:
                stack.pop()
                onpath.pop()
                color[u] = 2
    return None


def load_learner(path, atoms):
    """ملف JSON: قائمة سجلات learner_state أو {learner_id, states:[...]}."""
    if not path:
        return {}
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    records = raw.get("states", raw.get("learner_states")) if isinstance(raw, dict) else raw
    id_index = _id_index(atoms)
    state, unmatched = {}, []
    for rec in records:
        key = resolve_atom_id(rec["atom_id"], atoms, id_index)
        if key is None:
            unmatched.append(rec["atom_id"])
        else:
            state[key] = rec
    if unmatched:
        print(f"[selector] تحذير: {len(unmatched)} سجلات متعلم بلا ذرة مطابقة: "
              f"{unmatched[:5]}", file=sys.stderr)
    return state


def load_links(path):
    """atom_links.json → {«سلسلة|معرّف»: {node, confidence}} للذرات المربوطة فقط."""
    if not path or not Path(path).exists():
        return {}
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    return {k: {"node": v["node"], "confidence": v.get("confidence", 0.0)}
            for k, v in data.get("links", {}).items() if v.get("node")}


# ---------------------------------------------------------------------------
# المنطق (SPEC.md §2–§4)
# ---------------------------------------------------------------------------

def last_grade(rec):
    a = rec.get("attempts") or []
    return a[-1]["grade"] if a else None


def is_mastered(rec, atom):
    """معيار الإتقان: العلامة mastered authoritative؛ وإلا اشتقاق من حقول FSRS:
    state=review ∧ stability≥7ي ∧ reps≥2 ∧ آخر تقدير ∈ {good, easy}
    (∧ last_perf_type=تمرين للمهارات)."""
    if rec.get("mastered"):
        return True
    f = rec.get("fsrs", {})
    if f.get("state") != "review":
        return False
    if (f.get("stability") or 0) < STAB_MIN_DAYS or (f.get("reps") or 0) < REPS_MIN:
        return False
    if last_grade(rec) not in GRADE_OK:
        return False
    if atom.get("kind") == "مهارة" and rec.get("last_perf_type") != "تمرين":
        return False
    return True


def retrievability(rec, now):
    """R من السجل إن وُجدت، وإلا اضمحلال FSRS-5: R=(1+elapsed/(9·S))^-1."""
    f = rec.get("fsrs", {})
    if f.get("retrievability") is not None:
        return f["retrievability"]
    s = f.get("stability") or 0
    if s <= 0 or not f.get("last_review"):
        return 0.0
    elapsed = max(0.0, (now - parse_ts(f["last_review"])).total_seconds() / 86400)
    return (1 + elapsed / (9 * s)) ** -1


def due_score(rec, now):
    """أيام التأخر ÷ الثبات — إلحاح الاستحقاق نسبةً لقوة الذاكرة (SPEC §3)."""
    f = rec.get("fsrs", {})
    overdue_days = (now - parse_ts(f["due"])).total_seconds() / 86400
    return overdue_days / max(f.get("stability") or 0, STAB_EPS)


def prereq_report(atom_id, prereqs, state, atoms):
    """سابقات الذرة: المفقود = بلا سجل إتقان (حافة إلى ذرة مجهولة = غير متقنة)."""
    edges = prereqs.get(atom_id, [])
    missing = [e["atom_id"] for e in edges
               if not (e["atom_id"] in state
                       and is_mastered(state[e["atom_id"]], atoms.get(e["atom_id"], {})))]
    return {"total": len(edges), "mastered": len(edges) - len(missing), "missing": missing}


def covered_nodes(state, atoms, links):
    """عقد الفهرس التي غطّاها المتعلم: لها ≥1 ذرة مربوطة متقنة."""
    nodes = set()
    for key, rec in state.items():
        if key in links and is_mastered(rec, atoms.get(key, {})):
            nodes.add(links[key]["node"])
    return nodes


def select(atoms, prereqs, state, links, now, limit=20):
    """الاختيار: (أ) المستحقة للمراجعة مرتبة بإلحاح due_score،
    (ب) الجديد i+1 المفتوح (كل السابقات متقنة) مرتباً بتقدّم المنهج ثم التنويع."""
    series_rank = {s: i for i, s in enumerate(sorted({a["series"] for a in atoms.values()}))}

    def pos(a):
        return (series_rank[a["series"]], file_order_key(a["file"]), a["char_start"])

    mastered_keys = {k for k, r in state.items() if is_mastered(r, atoms.get(k, {}))}
    done_nodes = covered_nodes(state, atoms, links)

    due, fresh, skipped_bad_due = [], [], 0
    for k, a in atoms.items():
        rec = state.get(k)
        if rec is None or rec.get("fsrs", {}).get("state") == "new":
            fresh.append(a)          # مرشح i+1 — بوابة السابقات لاحقاً
            continue
        f = rec["fsrs"]
        if f.get("state") in REVIEW_STATES:
            try:
                overdue = parse_ts(f["due"]) <= now
            except (KeyError, ValueError, TypeError):
                skipped_bad_due += 1
                fresh.append(a)      # سجل معطوب ⇒ مسار i+1 يحرسه ببوابة السابقات
                continue
            if overdue:
                due.append((a, rec))

    due_items = []
    for a, rec in sorted(due, key=lambda x: (-due_score(x[1], now),
                                            retrievability(x[1], now), pos(x[0]))):
        ds = due_score(rec, now)
        pm = prereq_report(a["atom_id"], prereqs, state, atoms)
        why = (f"مراجعة مستحقة: تأخر {(now - parse_ts(rec['fsrs']['due'])).total_seconds()/86400:.2f}ي"
               f" على ثبات {rec['fsrs'].get('stability', 0):.2f}ي → due_score={ds:.3f}")
        due_items.append({"atom_id": a["atom_id"], "group": "due", "why": why,
                          "prereqs_met": pm, "due_score": round(ds, 4)})

    frontier = [a for a in fresh
                if a["atom_id"] not in mastered_keys
                and all(e["atom_id"] in state and is_mastered(state[e["atom_id"]], atoms.get(e["atom_id"], {}))
                        for e in prereqs.get(a["atom_id"], []))]

    def node_gain(a):
        l = links.get(a["atom_id"])
        return l["confidence"] if l and l["node"] not in done_nodes else 0.0

    fresh_items, prev_tag = [], None
    pool = sorted(frontier, key=lambda a: (-node_gain(a), pos(a)))
    while pool:                     # تنويع المهارة: تقديم أول مرشح وسمه يخالف السابق
        best = pool[0]
        for cand in pool:
            if cand["main_tag"] != prev_tag:
                best = cand
                break
        pool.remove(best)
        pm = prereq_report(best["atom_id"], prereqs, state, atoms)
        gain = node_gain(best)
        why = f"i+1: السابقات {pm['mastered']}/{pm['total']} متقنة"
        if gain:
            why += f" — يدشن عقدة {links[best['atom_id']]['node']} (ثقة {gain:.2f})"
        fresh_items.append({"atom_id": best["atom_id"], "group": "new", "why": why,
                            "prereqs_met": pm, "due_score": 0.0})
        prev_tag = best["main_tag"]

    if skipped_bad_due:
        print(f"[selector] تحذير: {skipped_bad_due} سجلات بطابع due معطوب — عاملتها كجديدة",
              file=sys.stderr)
    return (due_items + fresh_items)[:limit]


# ---------------------------------------------------------------------------
# المحاكاة (--sim) — انظر SIM.md
# ---------------------------------------------------------------------------

SIM_T0 = parse_ts("2026-10-01T08:00:00Z")
SIM_SERIES = ["984_أم البراهين", "767_دورة النحو المستوى الأول"]
SIM_PER_SERIES = 20


def sim_seed(atoms, prereqs):
    """متعلم افتراضي: أول ~6 ذرات من كل سلسلة بحالات متفاوتة (SIM.md §2)."""
    by_series_pos = {}
    for a in atoms.values():
        by_series_pos.setdefault(a["series"], []).append(a)
    ordered = {}
    for s in SIM_SERIES:
        items = by_series_pos.get(s, [])
        items.sort(key=lambda a: (file_order_key(a["file"]), a["char_start"]))
        ordered[s] = items[:SIM_PER_SERIES]

    state = {}
    # (index في السلسلة → حالة البذرة): متقنة باستحقاقات متفاوتة + قيد التعلم
    # + مراجعة دون عتبة الإتقان. السلسلة الثانية تُزاح ثوابتها ×0.8 للتمايز.
    seeds = [
        (0, dict(state="review", difficulty=4.0, stability=18.0, due=-4.0, reps=4, lapses=0)),
        (1, dict(state="review", difficulty=5.0, stability=14.0, due=-1.0, reps=3, lapses=0)),
        (2, dict(state="review", difficulty=3.5, stability=20.0, due=-6.0, reps=5, lapses=1)),
        (3, dict(state="review", difficulty=6.0, stability=12.0, due=3.0, reps=3, lapses=0)),
        (4, dict(state="review", difficulty=4.5, stability=6.5, due=-1.0, reps=2, lapses=0)),
        (5, dict(state="learning", difficulty=6.5, stability=6.5, due=-0.5, reps=1, lapses=0)),
        (6, dict(state="review", difficulty=5.5, stability=6.8, due=-0.2, reps=2, lapses=0)),
    ]
    for si, s in enumerate(SIM_SERIES):
        skew = 1.0 if si == 0 else 0.8
        for i, seed in seeds:
            a = ordered[s][i]
            seed = dict(seed)
            if si == 1:
                seed["stability"] = round(seed["stability"] * skew, 2)
                seed["due"] = seed["due"] * skew
            state[a["atom_id"]] = {
                "learner_id": "sim-learner",
                "atom_id": a["atom_id"],
                "fsrs": {**{k: v for k, v in seed.items() if k != "due"},
                         "due": iso(SIM_T0 + timedelta(days=seed["due"])),
                         "last_review": iso(SIM_T0 + timedelta(days=seed["due"] - seed["stability"]))},
                "attempts": [{"ts": iso(SIM_T0 - timedelta(days=2)),
                              "perf_type": "تمرين", "grade": "good"}],
                "last_perf_type": "تمرين",
            }
    return state, ordered


def sim_grade(step, atom_key):
    """سياسة تقدير حتمية: رسوب واحد مزروع في الخطوة 2 لإظهار relearning (SIM.md §3)."""
    return "again" if step == 2 else "good"


def sim_update(rec, grade, now):
    """تحديث مبسط بأسلوب FSRS — للمحاكاة فقط (SPEC §6)."""
    f = rec["fsrs"]
    s = f.get("stability") or 0
    if f["state"] == "new" or f.get("reps", 0) == 0:
        s = SIM_S0[grade]
        f["state"] = "learning" if grade in ("again", "hard") else "review"
    else:
        s = max(0.2, s * SIM_GROWTH[grade])
        if grade == "again":
            f["state"] = "relearning"
            f["lapses"] = f.get("lapses", 0) + 1
        else:
            f["state"] = "review"
    f["stability"] = round(s, 3)
    f["reps"] = f.get("reps", 0) + 1
    f["last_review"] = iso(now)
    f["retrievability"] = 1.0
    f["due"] = iso(now + timedelta(days=SIM_LAPSE_DUE_DAYS if grade == "again" else s))
    rec["attempts"].append({"ts": iso(now), "perf_type": "تمرين", "grade": grade})
    rec["last_perf_type"] = "تمرين"
    rec["mastered"] = is_mastered(rec, {"kind": None})
    return rec


def run_sim(atoms, prereqs, links, out_dir):
    sim_keys = set()
    _, ordered = sim_seed(atoms, prereqs)
    for items in ordered.values():
        sim_keys.update(a["atom_id"] for a in items)
    sim_atoms = {k: v for k, v in atoms.items() if k in sim_keys}
    sim_prereqs = {k: [e for e in prereqs.get(k, []) if e["atom_id"] in sim_keys]
                   for k in sim_keys}

    state, _ = sim_seed(sim_atoms, sim_prereqs)
    (Path(out_dir) / "sim_learner.json").write_text(
        json.dumps(list(state.values()), ensure_ascii=False, indent=2), encoding="utf-8")

    trace, checks = [], {"ordered_new": 0, "due_first_violations": 0, "jump_violations": 0,
                        "empty_steps": 0}
    now = SIM_T0
    for step in range(20):
        ranked = select(sim_atoms, sim_prereqs, state, links, now, limit=len(sim_atoms))
        if not ranked:
            checks["empty_steps"] += 1
            trace.append({"step": step, "now": iso(now), "atom_id": None,
                          "group": "wait", "due_score": 0.0,
                          "note": "لا مستحق ولا i+1 مفتوح — ينتظر أقرب استحقاق"})
            now += timedelta(days=1)
            continue
        pick = ranked[0]
        key = pick["atom_id"]
        # تحقق 1: لا قفز — ذرة جديدة تُختار وسابقاتها غير متقنة
        if pick["group"] == "new" and pick["prereqs_met"]["missing"]:
            checks["jump_violations"] += 1
        # تحقق 2: إن وُجد مستحق لم يُختر جديدٌ قبله
        if pick["group"] == "new" and any(i["group"] == "due" for i in ranked):
            checks["due_first_violations"] += 1
        if pick["group"] == "new":
            checks["ordered_new"] += 1
        grade = sim_grade(step, key)
        rec = state.get(key) or {"learner_id": "sim-learner", "atom_id": key,
                                 "fsrs": {"state": "new", "due": iso(now)}, "attempts": []}
        rec = sim_update(rec, grade, now)
        state[key] = rec
        trace.append({"step": step, "now": iso(now), "atom_id": key,
                      "group": pick["group"], "due_score": pick["due_score"],
                      "prereqs_met": pick["prereqs_met"], "grade": grade,
                      "state_after": {"state": rec["fsrs"]["state"],
                                      "stability": rec["fsrs"]["stability"],
                                      "due": rec["fsrs"]["due"],
                                      "mastered": rec.get("mastered", False)}})
        now += timedelta(days=1)

    (Path(out_dir) / "sim_trace.json").write_text(
        json.dumps(trace, ensure_ascii=False, indent=2), encoding="utf-8")
    return trace, checks


# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="محرك اختيار الذرة التالية")
    ap.add_argument("--learner", help="ملف JSON بسجلات learner_state")
    ap.add_argument("--atoms-root", default=str(JADID2 / "atoms"))
    ap.add_argument("--links", default=str(JADID2 / "xlink" / "data" / "atom_links.json"))
    ap.add_argument("--edges", default=str(JADID2 / "schema" / "graph.edges.json"))
    ap.add_argument("--now", help="ISO 8601 — الافتراضي الآن")
    ap.add_argument("--limit", type=int, default=20)
    ap.add_argument("--sim", action="store_true", help="محاكاة 20 خطوة (SIM.md)")
    ap.add_argument("--sim-out", default=str(ROOT / "data"))
    args = ap.parse_args()

    now = parse_ts(args.now) if args.now else datetime.now(timezone.utc)
    atoms = load_atoms(args.atoms_root)
    prereqs, dropped = build_edges(atoms, args.edges)
    if dropped:
        print(f"[selector] أسقطت {len(dropped)} حافات تكوّن دورات: "
              f"{[(d['from'], d['to']) for d in dropped][:5]}", file=sys.stderr)

    if args.sim:
        links = load_links(args.links)
        trace, checks = run_sim(atoms, prereqs, links, args.sim_out)
        print(json.dumps({"steps": len(trace), "checks": checks, "trace": trace},
                         ensure_ascii=False, indent=2))
        return

    state = load_learner(args.learner, atoms)
    links = load_links(args.links)
    ranked = select(atoms, prereqs, state, links, now, args.limit)
    print(json.dumps(ranked, ensure_ascii=False, indent=2))
    if not ranked:
        future = []
        for r in state.values():
            try:
                d = parse_ts(r["fsrs"]["due"])
                if d > now:
                    future.append(d)
            except (KeyError, ValueError, TypeError):
                pass
        hint = f" — أقرب استحقاق قادم {iso(min(future))}" if future else ""
        print(f"[selector] قائمة فارغة: لا مستحق ولا i+1 مفتوح{hint}", file=sys.stderr)


if __name__ == "__main__":
    main()
