#!/usr/bin/env python3
"""simulate.py — سيناريو تعلّم 5 خطوات للمتعلم المرجعي (SELECTION.md).

كل خطوة: إعادة تدريج كل النصوص غير المقروءة ببنك اليوم ← اختيار الأقل D
ضمن أفضل حكم ← «قراءة» النص بخطته ← تحديث البنك بقواعد §7:
  pre-teach + أهداف الاستنتاج → learned؛  gloss + بقية المجهولات → seen.
ثم تُعاد النسب. stdlib فقط؛ يستورد grade.py كوحدة.

  python3 simulate.py            # يكتب SELECTION.md ويطبع ملخصاً
"""
import json
from pathlib import Path

import grade

HERE = Path(__file__).resolve().parent
ORDER = {"i-1": 0, "i+1": 1, "i+2": 2, "out": 3}


def grade_all(bank, exclude):
    """إعادة تدريج النصوص غير المقروءة بلا كتابة ملفات."""
    rows = {}
    for p in sorted(grade.TEXTS.glob("*.json")):
        doc = json.loads(p.read_text(encoding="utf-8"))
        if doc["id"] in exclude:
            continue
        rec = grade.annotate(doc["text"], doc["id"], bank)
        st = grade.stats_of(rec)
        plan = grade.adapt(rec, bank)
        raw_v, final_v = grade.verdicts(st, plan, st["scored_tokens"])
        rows[doc["id"]] = {"doc": doc, "rec": rec, "st": st, "plan": plan,
                           "verdict": final_v, "verdict_raw": raw_v}
    return rows


def pick(rows):
    """أفضل مرشح: ترتيب الحكم ثم D."""
    return min(rows.items(),
               key=lambda kv: (ORDER[kv[1]["verdict"]], kv[1]["st"]["D"]))


def apply_plan(bank, rec, plan):
    """§7 تحديث البنك بعد الجلسة. يعيد أعداداً للتقرير."""
    gained = []
    for l in plan["preteach"]:
        if bank.get(l, ("", 0))[0] != "learned":
            gained.append(l)
        bank[l] = ("learned", 0.85)
    for l in plan["inference_targets"]:
        if bank.get(l, ("", 0))[0] not in ("known", "learned"):
            gained.append(l)
        bank[l] = ("learned", 0.85)
    for l in plan["gloss"]:
        bank.setdefault(l, ("seen", 0.0))
    for l in rec["unknowns"]:
        bank.setdefault(l, ("seen", 0.0))
    return gained


def k_known(bank):
    return sum(1 for l in bank if grade.is_known(l, bank))


def main():
    bank = grade.load_bank(HERE / "vocab_profile.jsonl")
    steps, read = [], set()
    for step in range(1, 6):
        rows = grade_all(bank, read)
        if not rows:
            break
        tid, r = pick(rows)
        c_before, d = r["st"]["C_token"], r["st"]["D"]
        ctl = r["plan"]["controls"]
        k0 = k_known(bank)
        gained = apply_plan(bank, r["rec"], r["plan"])
        read.add(tid)
        # تغطية المتبقي بعد تحديث البنك
        after = grade_all(bank, read)
        steps.append({
            "step": step, "id": tid, "title": r["doc"]["title"],
            "C": c_before, "C_eff": ctl["C_eff"], "D": d,
            "verdict_raw": r["verdict_raw"], "verdict": r["verdict"],
            "pre": list(r["plan"]["preteach"]),
            "inf": list(r["plan"]["inference_targets"][:6]),
            "n_inf": ctl["n_infer"], "gloss_n": ctl["gloss_n"],
            "learned": gained, "k_before": k0, "k_after": k_known(bank),
            "pool_mean_C": (sum(x["st"]["C_token"] for x in after.values())
                            / len(after) if after else None),
            "pool_ge90": sum(1 for x in after.values() if x["st"]["C_token"] >= 0.90),
            "pool_n": len(after),
        })

    out = HERE / "SELECTION.md"
    w = []
    w.append("# SELECTION — سيناريو تعلّم 5 خطوات (متعلم مرجعي ≈500 لمّة)\n")
    w.append("توليد آلي: `python3 simulate.py` — يعيد إنتاج كل رقم أدناه.\n")
    w.append("القاعدة: كل يوم تُعاد تدريجة النصوص غير المقروءة ببنك اليوم، يُختار "
             "أفضل حكم ثم أدنى D، ويُطبَّق تحديث البنك §7 (pre-teach + أهداف "
             "الاستنتاج → `learned`؛ gloss + بقية المجهولات → `seen`).\n")
    w.append("## النتيجة العامة\n")
    w.append("| # | نص | C قبل | C_eff | D | حكم خام | حكم | pre-teach | استنتاج | gloss | K بعد |")
    w.append("|---|----|-------|-------|---|---------|-----|-----------|--------|-------|--------|")
    for s in steps:
        w.append(f"| {s['step']} | `{s['id']}` | {s['C']:.3f} | {s['C_eff']:.3f} | "
                 f"{s['D']:.3f} | {s['verdict_raw']} | {s['verdict']} | "
                 f"{len(s['pre'])} | {s['n_inf']} | {s['gloss_n']} | {s['k_after']} |")
    w.append("\n## تفصيل كل خطوة\n")
    for s in steps:
        w.append(f"### اليوم {s['step']}: `{s['id']}` — {s['title']}")
        w.append(f"- قبل القراءة: C={s['C']:.3f}، D={s['D']:.3f}، حكم={s['verdict']} "
                 f"(خام: {s['verdict_raw']}).")
        w.append(f"- خطة التكييف: pre-teach = {', '.join('`%s`' % l for l in s['pre']) or '∅'}"
                 f" ({len(s['pre'])}، السقف 8)؛ أهداف استنتاج = {s['n_inf']}"
                 f" (منها: {', '.join('`%s`' % l for l in s['inf']) or '∅'})؛"
                 f" gloss = {s['gloss_n']}.")
        w.append(f"- بعد الجلسة: {len(s['learned'])} لمّة → `learned`"
                 f" ({', '.join('`%s`' % l for l in s['learned']) or '∅'})؛"
                 f" K: {s['k_before']} → {s['k_after']}.")
        if s["pool_mean_C"] is not None:
            w.append(f"- أثر التحديث على المتبقي ({s['pool_n']} نصاً): "
                     f"متوسط C = {s['pool_mean_C']:.3f}؛ نصوص C≥0.90 = {s['pool_ge90']}.")
        w.append("")
    w.append("## السبب الحسابي\n")
    w.append("1. **كل ما يكتسبه المتعلم من نص واحد محدود بميزانية §5**: ≤8 pre-teach +"
             " أهداف الاستنتاج فقط تتحول `learned`؛ مجهولات gloss تبقى `seen` ولا"
             " تُحتسب معروفة — لذا يزحف K ببطء (≈8–20 لمّة/نص).")
    w.append("2. **الارتداد بين النصوص قليل عند K≈500**: مفردات المحتوى المجهولة"
             " (allah, prophet, wolf, desert, hydrogen…) متخصصة لكل نص ولا تتكرر"
             " في النصوص الأخرى، فتحسين نص لا يرفع تغطية غيره إلا قليلاً.")
    w.append("3. **لهذا تبقى كل الأحكام `out`** عند K≈500 — وهو ما يتنبأ به جدول"
             " SPEC.md §5.1 نفسه (L1<800 → E[C]≈0.75–0.80 على نص عام؛ هذه النصوص"
             " الحقيقية أعطت C∈[0.55,0.77]). القارئ i+1 لهذا البنك يبدأ عملياً من"
             " K≈5000 (مطابقة SAMPLE.md: sleep أعطى C=0.9457 عند rank≤5000).")
    w.append("4. مع ذلك يعمل الاختيار: في كل خطوة يُنتقى **أدنى D** فتُقرأ"
             " أسهل النصوص المتاحة أولاً — نفس الآلية تعطي ترتيباً مفيداً حتى"
             " حين لا يبلغ أي مرشح عتبة i+1.")
    out.write_text("\n".join(w) + "\n", encoding="utf-8")
    for s in steps:
        print(f"step{s['step']}: {s['id']:22s} C={s['C']:.3f} D={s['D']:.3f} "
              f"v={s['verdict']:4s} K={s['k_before']}->{s['k_after']} "
              f"pool_mean_C={s['pool_mean_C']:.3f} ge90={s['pool_ge90']}")
    print("wrote", out)


if __name__ == "__main__":
    main()
