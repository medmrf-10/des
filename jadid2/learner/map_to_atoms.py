#!/usr/bin/env python3
"""map_to_atoms.py — يحوّل learner_profile.json إلى قرارات تشغيلية.

المخرجات:
  seed_state.json — حالة متعلم مبدئية لـ jadid2/reader:
      states[]   : سجلات بصيغة schema/learner_state.schema.json للذرات المفتوحة
                   (جذور السلاسل الموصى بها — state=new جاهزة للتقديم فوراً)
      mastered[] : ذرات مُتقنة مسبقاً — فارغة: لا دليل إتقان على مستوى ذرة في
                   إجاباته (يتابع الدروس سماعاً منذ سنوات لكن «لا يجد شيئاً
                   محفوظاً» l11، وصفر تقدم على المنصات c10، و~10% من كورس
                   HTML/CSS l06) — والإتقان يُثبت بالتقييم لا بالتصريح (p09)
      locked[]   : كل ذرة أخرى في الكوربوس — مقفلة حتى إتقان متطلباتها
                   (R1/R3 في SKILL_GRAPH: الذرة تعتمد سابقتها)
  start_plan.md — السلاسل الخمس الأولى الموصى بها بترتيب أولوياته + البرهان.

اختيار السلاسل: ترتيب العلوم معلن صراحة في g04 (عقيدة › فقه › أصول فقه › تزكية ›
تفسير › حديث › سيرة › لغة)، والشيخ المفضل للعلوم الكبرى محمد البردوني الحسيمي
(s05, g06). سلسلة كل علم = أول سلسلة متاحة في atoms/ بذلك العلم لشيخ مفضل.
"""
import json
import re
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
JADID2 = HERE.parent
ATOMS = JADID2 / "atoms"
PROFILE = HERE / "learner_profile.json"
SEED_OUT = HERE / "seed_state.json"
PLAN_OUT = HERE / "start_plan.md"

# السلاسل الخمس الأولى — مرتبة بترتيب العلوم الذي أعلنه في g04.
# (العلم، مفتاح السلسلة، لماذا بالبرهان)
START_CHAINS = [
    {
        "science": "عقيدة",
        "series": "984_أم البراهين",
        "why": "أول علم في ترتيبه للفهرس العام (g04)، والكورس صفر المعلن دروس البردوني فقه/أصول/عقيدة (g06) وأم البراهين متن العقيدة التأسيسي — شيخه المفضل الأول (s05)",
        "evidence": ["g04", "g06", "s05"],
    },
    {
        "science": "فقه",
        "series": "988_شرح_الرسالة",
        "why": "ثاني علومه (g04)؛ شرح متن الرسالة — الشرح الأول للبردوني في الكوربوس — بنفس الشيخ المفضل (s05, g06)",
        "evidence": ["g04", "s05", "g06"],
    },
    {
        "science": "أصول فقه",
        "series": "985_المنهج_المنتخب",
        "why": "ثالث علومه (g04)؛ متن أصول الفقه للبردوني (s05, g06)",
        "evidence": ["g04", "s05", "g06"],
    },
    {
        "science": "تزكية",
        "series": "997_الحكم_العطائية",
        "why": "رابع علومه (g04)؛ الحكم العطائية متن التزكية الأشهر بشرح شيخه المفضل — والبديل المطابق لقائمة تزكيته المعلنة (s05): سلاسل البوطي 345/346 المتاحة",
        "evidence": ["g04", "s05"],
        "alternatives": ["345_مشاهد وعبر من القرآن والسنة", "346_برنامج رحلة الخلود"],
    },
    {
        "science": "تفسير",
        "series": "tafsir_saadi",
        "why": "خامس علومه (g04) وأول خدمة قررها «آية + كتاب ← مقطع» (g03)؛ لا تفضيل معلناً لشيخ التفسير (s05) فاعتُمد السعدي كأيسر التفاسير الكاملة المتاحة — اختيار افتراضي قابل للتغيير",
        "evidence": ["g03", "g04", "s05"],
        "default_choice": True,
    },
]

NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def atom_id(series: str, entry_id: str) -> str:
    """مركّب «سلسلة|معرّف» — نفس اصطلاح selector §1 و sim_learner.json."""
    return f"{series}|{entry_id}"


def load_index(series: str) -> dict:
    return json.loads((ATOMS / series / "index.json").read_text(encoding="utf-8"))


def main():
    profile = json.loads(PROFILE.read_text(encoding="utf-8"))
    learner = profile["learner"]["id"]

    all_series = sorted(p.name for p in ATOMS.iterdir() if (p / "index.json").is_file())
    corpus = {}                       # atom_id -> {series, id}
    for s in all_series:
        for e in load_index(s)["entries"]:
            corpus[atom_id(s, e["id"])] = {"series": s, "id": e["id"]}

    unlocked, chain_meta = [], []
    for ch in START_CHAINS:
        idx = load_index(ch["series"])
        entries = idx["entries"]
        root = entries[0]
        aid = atom_id(ch["series"], root["id"])
        unlocked.append(aid)
        chain_meta.append({
            "science": ch["science"],
            "series": ch["series"],
            "sheikh": idx.get("sheikh") or "غير موثق",
            "atoms": len(entries),
            "root_atom": aid,
            "root_title": root.get("title", ""),
            "why": ch["why"],
            "evidence": ch["evidence"],
            **{k: ch[k] for k in ("alternatives", "default_choice") if k in ch},
        })

    states = [{
        "learner_id": learner,
        "atom_id": aid,
        "fsrs": {"state": "new", "due": NOW, "reps": 0, "lapses": 0},
        "attempts": [],
    } for aid in unlocked]

    unlocked_set = set(unlocked)
    locked = [aid for aid in corpus if aid not in unlocked_set]

    seed = {
        "learner_id": learner,
        "schema": "jadid2/schema/learner_state.schema.json",
        "generated_by": "jadid2/learner/map_to_atoms.py",
        "profile_source": "jadid2/learner/learner_profile.json",
        "generated_at": NOW,
        "counts": {"corpus_atoms": len(corpus), "mastered": 0, "unlocked": len(states), "locked": len(locked)},
        "mastered": [],   # لا دليل إتقان على مستوى ذرة — الإتقان يُثبت بالتقييم (c10/l06/l11/p09)
        "states": states,
        "locked": locked,
    }
    SEED_OUT.write_text(json.dumps(seed, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    lines = [
        "# خطة البدء — أول خمس سلاسل للمتعلم",
        "",
        f"المتعلم: `{learner}` — المصدر: إجابات موقع القرارات الحقيقية "
        f"({profile['meta']['stats']['answered']} مُجابة من {profile['meta']['stats']['entries']}).",
        "",
        "الترتيب مأخوذ من ترتيبه المعلن للعلوم (g04) وأولوية الشرعي 8/10 (s07, l01):",
        "",
    ]
    for i, ch in enumerate(chain_meta, 1):
        lines += [
            f"{i}. `{ch['series']}` — {ch['science']} — الشيخ: {ch['sheikh']} — {ch['atoms']} ذرة",
            f"   - يبدأ من: `{ch['root_atom']}` («{ch['root_title']}»)",
            f"   - البرهان: {ch['why']} — الأدلة: {', '.join(ch['evidence'])}",
        ]
        if "alternatives" in ch:
            lines.append(f"   - بدائل بنفس الدليل: {', '.join('`%s`' % a for a in ch['alternatives'])}")
        if ch.get("default_choice"):
            lines.append("   - تنبيه: اختيار افتراضي — لم يعلن تفضيلاً لتفسير؛ قابل للتبديل بجلالين/طبري/ابن كثير المتاحة")
        lines.append("")
    lines += [
        "## خارج الخمس (ملاحظات صادقة)",
        "",
        "- الشيخ مولود السريري (الشيخ المفضل الثاني في s05) **غير موجود** في كوربوس atoms الحالي — فجوة بيانات لا خياراً.",
        "- البرمجة والإنجليزية لا ذرات لهما في الكوربوس: البرمجة مسار جديد يبنيه الوكيل من خريطة HTML/CSS/JS (g11/l02)، والإنجليزية تولد طازجة بالوكيل (g16) — تُغذّى عند إنشائها.",
        "- mastered مبدئياً فارغة: لا دليل إتقان ذرة (l11/c10/l06) — أول تقييم تلقائي يملؤها (p09).",
        "- ترتيب G04 يخص خطة الدراسة؛ رفض ترتيب تغذية المنصة (b05) لا يلغيه — راجع التناقضات في REPORT.md.",
        "",
    ]
    PLAN_OUT.write_text("\n".join(lines), encoding="utf-8")

    print(f"corpus={len(corpus)} unlocked={len(states)} locked={len(locked)} mastered=0")
    print("→", SEED_OUT)
    print("→", PLAN_OUT)


if __name__ == "__main__":
    main()
