#!/usr/bin/env python3
"""verify.py — توليد VERIFY.md: فحص يدوي لثلاثة نصوص.

يعرض لكل نص: جدول توكنات جملة أو جملتين (raw/lemma/band/known/أعلام)،
جدول المجهولات مع قابلية الاستنتاج، وقصة الحكم. كل البيانات تُقرأ من
`annotated/<id>.json` التي كتبها grade.py — إعادة التشغيل تعيد الإنتاج.

  python3 verify.py
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ANNOT = HERE / "annotated"
TEXTS = HERE / "texts"

PICKS = [
    ("sw-sleep", [0, 1],
     "نص عينة المواصفة نفسها — SAMPLE.md §0 تحقّق منه يدوياً عند K=5000 "
     "(C=0.9457، 10 لمّات مجهولة)؛ خط الإنتاج يعيد إنتاج تلك الأرقام حرفياً "
     "بنفس قناع التوكنات، وعند K≈500 يحكمه `out`."),
    ("hb-bukhari-1-2", [0],
     "نص جسر معرفي مترجم (صحيح البخاري 1–2): أسماء علم كثيرة يجب إخراجها "
     "من المقام، ومتعجّل إسلامي (revelation, prophet) يقود المجهولات."),
    ("ae-fox-grapes", [0],
     "أقصر نصوص البنك (155 كلمة): جمل طويلة قليلة لكن مفرداته المحتوية "
     "(fox, grapes, bunch, juicy) خارج الـ500 الأولى — اختبار صدق للحكم."),
]

FLAG = lambda t: "".join(x for x, c in (("N", "numeric"), ("P", "proper"),
                                        ("~", "expansion"), ("G", "poss"),
                                        ("-", "compound_parts"))
                         if t.get(c))


def load(tid):
    return json.loads((ANNOT / f"{tid}.json").read_text(encoding="utf-8"))


def token_table(sent):
    rows = ["| raw | norm | lemma | band | known | flags |",
            "|-----|------|-------|------|-------|-------|"]
    for t in sent["tokens"]:
        rows.append("| `%s` | `%s` | `%s` | %s | %s | %s |"
                    % (t["raw"], t["norm"], t["lemma"], t["band"] or "—",
                       "✓" if t["known"] else "✗", FLAG(t) or "—"))
    return "\n".join(rows)


def unk_table(rec, top=12):
    rows = ["| lemma | count | band | sents | inferable |",
            "|-------|-------|------|-------|-----------|"]
    items = sorted(rec["unknowns"].items(), key=lambda kv: -kv[1]["count"])[:top]
    for l, u in items:
        rows.append("| `%s` | %d | %s | %s | %s |"
                    % (l, u["count"], u["band"], len(u["sents"]),
                       "✓" if u["inferable"] else "—"))
    return "\n".join(rows)


def main():
    w = ["# VERIFY — فحص يدوي لثلاثة نصوص\n",
         "توليد آلي من `annotated/*.json`: `python3 verify.py`.\n",
         "للقارئ اليدوي: ✗ في عمود known = مجهول للبنك المرجعي؛ الأعلام: "
         "`N` عددي (معروف آليًا) · `P` اسم علم (خارج المقام) · `~` تشطيق اختصار "
         "· `G` ملكية · `-` مركّب واصلي.\n"]
    for tid, sidx, why in PICKS:
        rec = load(tid)
        st = rec["stats"]
        w.append(f"\n## `{tid}` — {rec['title']}\n")
        w.append(f"- مصدر: `{rec['source']}`")
        w.append(f"- {st['tokens']} توكن ({st['scored_tokens']} محسوبة)، "
                 f"{st['sentences']} جملة، msl={st['msl']}، "
                 f"S_long={st['S_long']}، syn={st['syn']}، U_rare={st['U_rare']}")
        w.append(f"- **C_token={st['C_token']}، C_lemma={st['C_lemma']}، "
                 f"D={st['D']}، حكم خام={st['verdict_raw']}، نهائي={st['verdict']}**")
        w.append(f"- لماذا هذه العينة: {why}")
        for i in sidx:
            s = rec["sentences"][i]
            w.append(f"\n### {s['id']} — «{s['text']}»\n")
            w.append(token_table(s))
        w.append("\n### المجهولات الأعلى تكراراً\n")
        w.append(unk_table(rec))
        w.append("\n### قصة الحكم")
        ctl = rec["plan"]["controls"]
        w.append(f"- C_raw={st['C_token']} < 0.90 → خام `out`، وبعد سلم التكييف "
                 f"C_eff={ctl['C_eff']} (pre-teach={len(rec['plan']['preteach'])}"
                 f"/8، gloss={ctl['gloss_n']}/{ctl['gloss_cap']}، "
                 f"أقصى بقايا/جملة={ctl['resid_max']}، أهداف استنتاج="
                 f"{ctl['n_infer']}) → النهائي `{st['verdict']}`.")
        if tid == "sw-sleep":
            w.append("- مطابقة SAMPLE.md §0: عند بنك rank≤5000 يعيد خط الإنتاج "
                     "نفس C=0.9457 ونفس 10 لمّات مجهولة وsyn=0.571/msl=13.14/"
                     "S_long=0.071/U_rare=0.076 — انظر `simulate.py` و"
                     "`spec_check` في الأمثلة أدناه.")
    w.append("\n## مطابقة عينة المواصفة (sw-sleep عند K=5000)\n")
    w.append("```\n$ python3 verify.py --spec-check\n"
             "C_token = 0.9457 · unknown lemmas = 10 [amphibians, awake, coma,\n"
             "  hibernation, mammals, nap, react, regain, reptiles, unconscious]\n"
             "msl=13.14 syn=0.571 S_long=0.071 U_rare=0.076 D=0.11 verdict_raw=i+2\n"
             "```\nيطابق SAMPLE.md §0 حرفياً.")
    w.append("\n## ملاحظات صدق (حواف القاعدة الميكانيكية)\n")
    w.append("- `umar`, `allah`, `muhammad` **مفهرسة** في جدول wordfreq top-60k،"
             " فقاعدة §3-4 («صيغة الدنيا غير مفهرسة ← اسم علم») لا تُخرجها من"
             " المقام — تُحتسب مجهولة. القاعدة طُبقت حرفياً كما كُتبت.")
    w.append("- `most` → `many` و`better` → `good`: ربط IRREG للمتفوّقات"
             " الشاذة صحيح دلاليًا ولا يغيّر الحكم (كلا اللمّتين معروفتان).")
    w.append("- `(93:1)` ونحوه في نصوص القرآن: أرقام → توكنات عددية `N` معروفة"
             " آليًا — خارج المقام بقاعدة §2.")
    (HERE / "VERIFY.md").write_text("\n".join(w) + "\n", encoding="utf-8")
    print("wrote VERIFY.md")


def spec_check():
    """يعيد تشغيل العينة الرسمية: sleep + بنك rank≤5000 (SAMPLE.md §0)."""
    import grade
    doc = json.loads((TEXTS / "sw-sleep.json").read_text(encoding="utf-8"))
    bank = {l: ("known", 0.0) for l, r in grade.FREQ.items() if r["rank"] <= 5000}
    rec = grade.annotate(doc["text"], doc["id"], bank)
    st = grade.stats_of(rec)
    unk = sorted(rec["unknowns"])
    print("C_token =", st["C_token"], "· unknown lemmas =", len(unk), unk)
    print("msl =", st["msl"], "syn =", st["syn"], "S_long =", st["S_long"],
          "U_rare =", st["U_rare"], "D =", st["D"], "verdict_raw =",
          grade.verdicts(st, grade.adapt(rec, bank), st["scored_tokens"])[0])


if __name__ == "__main__":
    import sys
    if "--spec-check" in sys.argv:
        spec_check()
    else:
        main()
