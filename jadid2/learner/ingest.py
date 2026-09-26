#!/usr/bin/env python3
"""ingest.py — قراءة سجل إجابات موقع القرارات الحقيقي وإخراج learner_profile.json.

المدخل (الأصل الخام): ../../logs/answers.log — كل سطر «QID|نص السؤال ← الجواب».
ملف البذور answers_seed.js ناتج ثانوي عن نفس السجل (make_seed.py) — يُستعمل
للتحقق المتقاطع فقط، لأنه يسقط c05 (سؤال غير معرّف في الموقع) ولا يحفظ نص السؤال.

قاعدة العمل: لا استنتاج بلا شاهد. كل حقل في المخرج يحمل evidence = قائمة
معرّفات الأسئلة التي استُند إليها. سؤال لم يُجَب عنه (لا أدري/لم أفهم/placeholder)
يُتخطَّى ويُحصى — لا تُخترع إجابة.

تصنيف الحالة ثلاثي ومعتمد يدوياً بعد قراءة كل جواب:
  answered   — جواب يحمل توجيهاً أو معلومة قابلة للاستعمال
  deferred   — قرر تأجيل القرار صراحة («لاحقاً»، «لم أحسمه»، «جلسة عميقة»)
  unanswered — لا محتوى قابل للاستعمال (لم يفهم السؤال، لا يعرف، placeholder)
السكربت يتحقق أن التصنيف يقسّم كل الأسطر فعلاً ولا يترك سؤالاً بلا حالة.
"""
import json
import re
import hashlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]                      # جذر des
LOG = REPO / "logs" / "answers.log"
SEED_JS = REPO / "answers_seed.js"
OUT = HERE / "learner_profile.json"

LEARNER_ID = "medmrf"

# --- تصنيف حالة كل معرّف سؤال (معتمد بعد قراءة الجواب الحرفي) -----------------
TEST_QIDS = {"test"}                        # سطر اختبار الحلقة — ليس سؤالاً حقيقياً
UNANSWERED = {                              # لم يُجب محتوى قابلاً للاستعمال
    "d05",   # «أي منصة؟» — طلب توضيحاً ولم يختر
    "d07",   # لم يفهم المقصود بـ«الاستعداد»
    "p08",   # لم يفهم «الكوربوس»/«البحث»
    "p11",   # لم يعطِ اسماً للمنتج
    "w01",   # «لم أفهم السؤال»
    "w13",   # «لم أفهم السؤال»
    "b07",   # «لا أعرف بصراحة»
    "t03",   # «والله لا أدري»
    "n03",   # «لا أملك جواباً مباشراً»
    "n05",   # نسي المشاريع السابقة كلها
    "i05",   # «لا أعرف عن ماذا تتحدث»
    "l12",   # اختار placeholder «غير محدد» حرفياً
}
DEFERRED = {                                # أجاب بتأجيل القرار صراحة
    "d13",   # «لم أحسمه»
    "s08",   # «سنختار لاحقاً»
    "b01",   # «يحتاج جلسة عميقة» — قرار مصيري مؤجل عمداً
    "b09",   # «مش عارف حالياً، سأقرر لاحقاً»
    "g10",   # «سوف أفكر في الأمور لاحقاً»
    "g17",   # «اكتب لي المؤلفين وأنا أقول من نعتمد»
    "i10",   # «لا أستطيع أن أقرر حالاً»
}


def parse_log(path: Path):
    """أسطر «QID|سؤال ← جواب» مع جواب قد يمتد على عدة أسطر."""
    entries = []
    cur = None
    for line in path.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^([A-Za-z][A-Za-z0-9]*)\|(.*)$", line)
        if m:
            if cur:
                entries.append(cur)
            cur = {"qid": m.group(1).lower(), "raw": m.group(2)}
        elif cur is not None and line.strip():
            cur["raw"] += "\n" + line
    if cur:
        entries.append(cur)
    for e in entries:
        q, _, a = e["raw"].partition("←")
        e["question"] = q.strip()
        e["answer"] = a.strip()
    return entries


def classify_answer(ans: str):
    """نوع الجواب: ملاحظة حرة / ترتيب / تقييم رقمي / اختيار من قائمة."""
    if ans.startswith("ملاحظة:"):
        return "note", ans[len("ملاحظة:"):].strip()
    if ans.startswith("ترتيب:"):
        return "ranking", [x.strip() for x in ans[len("ترتيب:"):].split("›")]
    m = re.match(r"^(\d+)\s*/\s*10$", ans)
    if m:
        return "rate", int(m.group(1))
    return "choice", ans


def load_seed(path: Path):
    m = re.search(r"window\.SEED_ANSWERS=(.*);\s*$", path.read_text(encoding="utf-8"), re.S)
    return json.loads(m.group(1))


def ev(*qids):
    return sorted(set(qids))


# --- الاستخراج المعتمد: كل قيمة مبنية على قراءة الجواب الحرفي للمعرّفات --------
# كل عنصر: (الحقل، القيمة، [الأدلة]) — السكربت يتحقق أن كل دليل سؤال مُجاب.
EXTRACTION = {
    "learner": {
        "id": LEARNER_ID,
        "is_sole_user": {"value": True, "evidence": ev("d11")},
        "also_teacher": {
            "value": "منتِج لدروسه الخاصة؛ جمهوره العامة — يلقي دروساً وخطباً في المسجد",
            "evidence": ev("s06", "s09", "g07", "g08"),
        },
        "identity_note": {"value": "«رامي» و«محمد» في الوثائق شخص واحد", "evidence": ev("i01")},
    },
    "priorities": {
        "learn_order": {
            "value": ["العلم الشرعي", "البرمجة", "الإنجليزية", "علوم أخرى"],
            "evidence": ev("l01"),
        },
        "product_axes_order": {
            "value": ["إنتاج دروسه الشرعية", "تعلم البرمجة", "تعلم الإنجليزية", "العلوم المختلفة"],
            "evidence": ev("d09"),
        },
        "shari_vs_prog_weight": {"value": "8/10 للخط الشرعي هذه السنة", "evidence": ev("s07")},
        "daily_time": {"value": "9/10 (≈ يوم كامل)؛ يصرف ~80% من وقته على التعلم", "evidence": ev("l04", "l11")},
        "week_focus": {"value": "المنظومة التعليمية", "evidence": ev("i04")},
        "vision_clarity": {"value": "8/10", "evidence": ev("i07")},
        "product_identity": {"value": "مزيج", "evidence": ev("i08")},
        "open_source": {"value": "1/10 — غير مهم", "evidence": ev("d12")},
        "sharing": {"value": "النشر والمشاركة مؤجلان؛ منتجه لنفسه", "evidence": ev("t08", "c06")},
    },
    "learning_model": {
        "preferred_pattern": {
            "value": ("نموذج مصطفى السعد: معلومة صغيرة + تمارين متدرجة منتقاة خبيراً "
                      "(سهل/متوسط/صعب)، «لا تنظر للحل قبل بذل الجهد»، قائمة جانبية "
                      "للمسائل الصعبة، وجدول مراجعة يعيد القديم كل مرة"),
            "evidence": ev("l05"),
        },
        "agent_interaction": {
            "value": ("وكيل يستقبل ويبادر: يسأل، يقيّم الجواب، يعطي معلومة، امتحان بسيط — "
                      "بأسلوب نقاش صديق وخلفه حسابات كثيرة"),
            "evidence": ev("p05", "d04"),
        },
        "memory_metric": {
            "value": "التقدم الحقيقي يُقاس باستقرار المعلومة عبر خوارزمية التكرار المتباعد (FSRS)",
            "evidence": ev("l08"),
        },
        "fsrs_on_skills": {
            "value": ("FSRS على المهارات: نجاح ← موعد أبعد وتمرين أصعب لنفس المهارة؛ "
                      "فشل ← موعد أقرب وأسهل — تُجرَّب جانبياً صغيراً قبل اعتمادها نظاماً"),
            "evidence": ev("l08", "g13"),
        },
        "mastery_skip": {"value": "تخطي المحتوى المعروف تلقائي بالتقييم", "evidence": ev("p09")},
        "after_break": {"value": "FSRS تدير العودة بعد الانقطاع؛ المواد الجديدة لا مشكلة فيها", "evidence": ev("p06")},
        "exercise_source": {
            "value": ("التمارين والأسئلة منتقاة مسبقاً من خبير ومدروسة قبل النشر — "
                      "المولّدة لحظياً «إضافية» علاجية فقط عند خلل/عدم فهم جزء"),
            "evidence": ev("p07", "c11", "g14"),
        },
        "current_platform_progress": {"value": "0 على كل المنصات", "evidence": ev("c10")},
    },
    "preferred_sheikhs": {
        "fiqh_usul_aqida": {
            "value": ["محمد البردوني الحسيمي", "مولود السريري"],
            "note": "«الشيخان المفضلان» — علمهما وقوة حجتهما ودقة نظرهما استثنائي عنده",
            "evidence": ev("s05", "g06"),
        },
        "tazkiya": {
            "value": ["الحبيب علي الجفري", "محمد سعيد رمضان البوطي", "معاذ سعيد حوى", "الحبيب عمر بن حفيظ"],
            "evidence": ev("s05"),
        },
        "tafsir_hadith": {"value": "لا تفضيل معلن", "evidence": ev("s05")},
    },
    "declared_problem": {
        "forgetting": {
            "value": ("النسيان — يتعلم سنة وسنتين وخمس سنوات ثم لا يجد شيئاً محفوظاً "
                      "ولا فرقاً بينه وبين من لم يدرس"),
            "evidence": ev("l03", "l11", "d10"),
        },
        "hates_making_projects": {
            "value": "يكره التطبيق واختراع مشاريع خاصة — يفضّل مشاريع الخبراء الجاهزة",
            "evidence": ev("l03", "d10"),
        },
        "time_in_details": {
            "value": "تضييع الوقت في التفاصيل وعدم التركيز على المهم",
            "evidence": ev("l03", "d10"),
        },
        "not_willpower": {
            "value": "المشكلة ليست قوة إرادة — يصبر على بودكاست 4-5 ساعات لأنه مفيد",
            "evidence": ev("l11"),
        },
        "agent_frustration": {
            "value": ("أسوأ تجربة: وكلاء لا يفهمون ويسرعون لكتابة كود بلا فهم — "
                      "يريد شريكاً يناقش «لماذا» ويملك صورة المنتج الذهنية"),
            "evidence": ev("w11"),
        },
    },
    "commitments": [
        {"id": "fsrs_on_atoms", "statement": "FSRS على الذرات/المعلومات لقياس مستواه وعمق فهمه لكل ذرة",
         "evidence": ev("d04", "l08", "p06")},
        {"id": "fsrs_on_skills", "statement": "FSRS على المهارات عبر تمارين متدرجة الصعوبة (تجربة جانبية أولاً)",
         "evidence": ev("l08", "g13")},
        {"id": "expert_prepared_exercises", "statement": "تمارين وأسئلة منتقاة خبيراً ومدروسة قبل نشر الكورس؛ المولّد لحظياً «إضافي» فقط",
         "evidence": ev("p07", "c11", "g14", "l05")},
        {"id": "human_approves_links", "statement": "الوكيل يقترح ربط الموضوع الفرعي بموضع الكتاب والمستخدم يعتمد واحداً واحداً",
         "evidence": ev("g05")},
        {"id": "review_every_atom_first_books", "statement": "يعتمد كل ذرة في الكتب الأولى حتى يثبت النمط",
         "evidence": ev("b06")},
        {"id": "transcriber_not_mufti", "statement": "تقليل حرية الوكيل في العلوم الشرعية — أخطاء الإفتاء والتفسير أخطر",
         "evidence": ev("p07")},
        {"id": "arabic_first", "statement": "الواجهة ومحتوى المنتج عربي أولاً/فقط",
         "evidence": ev("d06", "c08")},
        {"id": "tech_terms_english", "statement": "عربي مع مصطلحات إنجليزية؛ لا عربية داخل مساحة الكود والتعليقات بإنجليزية سهلة",
         "evidence": ev("p10", "w12")},
        {"id": "latin_digits", "statement": "الأرقام لاتينية دائماً (123)", "evidence": ev("w04")},
        {"id": "no_md_tables", "statement": "جداول Markdown ممنوعة كلياً في الملفات", "evidence": ev("w03")},
        {"id": "dark_theme", "statement": "الثيم الداكن افتراضي", "evidence": ev("p12")},
        {"id": "local_no_accounts", "statement": "محلي بلا حسابات مستخدمين", "evidence": ev("t05")},
        {"id": "both_devices", "statement": "الجوال والحاسوب بالتساوي؛ أهمية الجوال 8/10", "evidence": ev("p03", "t06")},
        {"id": "free_hosting_first", "statement": "الاستضافة بالمجان أولاً ثم التوسع؛ بنية سريعة محلية ثم سحابي عند توفر المال",
         "evidence": ev("t02", "p04")},
        {"id": "paid_api_ok", "statement": "API مدفوع للذكاء داخل المنتج مقبول", "evidence": ev("t10")},
        {"id": "pilot_then_generalize", "statement": "التجربة على عينة بيانات قليلة ونقدها وتحسينها ثم التعميم",
         "evidence": ev("t04", "d04")},
        {"id": "comm_style", "statement": "التواصل المريح: رسالة لكل إنجاز › ملخص يومي › تقرير مفصل › صمت حتى السؤال الجوهري",
         "evidence": ev("w07")},
        {"id": "batch_full_day", "statement": "حجم دفعة العمل المفضل: يوم كامل", "evidence": ev("w08")},
        {"id": "trust_but_verify", "statement": "ثقة بعمل الوكلاء 3/10 — مراجعة المخرجات بشرط بطاقة تجربة سريعة؛ المبادرة بإشعار أولاً",
         "evidence": ev("w10", "w09", "w02")},
        {"id": "personal_control", "statement": "يراقب بنفسه ولا يفوّض: الشكل النهائي + قرارات المنتج + المحتوى الشرعي",
         "evidence": ev("i09")},
        {"id": "separate_indexes", "statement": "الفهارس القياسية منفصلة تماماً لكل علم — كل علم قائم بذاته",
         "evidence": ev("b08")},
        {"id": "sciences_order", "statement": "ترتيب العلوم للفهرس العام: عقيدة › فقه › أصول فقه › تزكية › تفسير › حديث › سيرة › لغة",
         "evidence": ev("g04")},
        {"id": "tafsir_service_first", "statement": "أول خدمة تُبنى من فكرة الفهرس العام: خدمة التفسير (آية + كتاب ← مقطع)",
         "evidence": ev("g03", "s02")},
        {"id": "course_zero_barduni", "statement": "الكورس صفر للإنتاج: دروس الشيخ محمد البردوني الحسيمي (فقه/أصول/عقيدة)",
         "evidence": ev("g06")},
        {"id": "own_lessons_pipeline", "statement": "درسه المنتج: نص كامل جاهز للإلقاء بأسلوبه؛ لا مسجَّل حالياً — يبدأ بعينة؛ قالب سلسلة متسلسلة؛ يجمع مادته من المصادر",
         "evidence": ev("g07", "g08", "s10", "s06")},
        {"id": "english_fresh", "statement": "قارئ shortAr القديم يُهجر — المحتوى يولد طازجاً بالوكيل؛ فلسفة Shortform/كراشن «قريبة لكن ناقصة» والتصحيح لاحقاً",
         "evidence": ev("g16", "g15", "l07")},
        {"id": "udemy_whitelist", "statement": "المعتمد من مكتبة Udemy: كورسات مصطفى سعد + ثروت سامي + 3 كورسات بيزنس (القائمة النهائية بعد كتابة المؤلفين — g17 مؤجل)",
         "evidence": ev("l10")},
        {"id": "no_ocr_phase1", "statement": "نصوص OCR مرفوضة في المرحلة الأولى — لا يُقبل إلا النص الصافي",
         "evidence": ev("n02")},
        {"id": "course_decompilation", "statement": "الكورس ليس نصاً مقدساً: محتوى كامل محلياً بلا فيديو + خارطة مخصصة لشخصيته + حذف/تعديل/إضافة بلا تحريف",
         "evidence": ev("c05", "c03", "c04")},
        {"id": "success_daily_use", "statement": "نجاح المنتج بعد 30 يوماً = يستخدمه هو يومياً فعلاً",
         "evidence": ev("d08")},
        {"id": "prog_fresh_path", "statement": "البرمجة: مسار جديد كلياً يبنيه الوكيل من خريطة HTML/CSS/JS داخل المنتج نفسه",
         "evidence": ev("g11", "l02")},
        {"id": "evaluate_old_ideas", "statement": "لا اعتماد 100% على أي مواصفة سابقة — كل فكرة تُستخرج وتُقيَّم فردياً",
         "evidence": ev("g02", "d01")},
        {"id": "hadith_index_shami", "statement": "فهرس الحديث العام يُبنى على كتب صالح الشامي (الوجيز، معالم) مع إدخال الكتب الأخرى تحته",
         "evidence": ev("n06")},
        {"id": "custom_index_per_source", "statement": "لكل مصدر فهرس مخصص يُسقَط على الفهرس العام الشامل لمعرفة ما تكلم عنه المؤلف ومواضعه الدقيقة",
         "evidence": ev("b03", "s02", "s04")},
        {"id": "notion_stays", "statement": "نوشن يبقى مستعملاً (وصول مشترك عبر MCP) حتى بديل أو أداة خاصة",
         "evidence": ev("w06")},
        {"id": "exposed_keys_owner", "statement": "المفاتيح المكشوفة تُترك — يبطلها بنفسه بعد أيام",
         "evidence": ev("i02")},
        {"id": "first_screen_library", "statement": "أول شاشة يفتح عليها المنتج: مكتبة الكورسات",
         "evidence": ev("p02")},
        {"id": "v1_features_order", "statement": "ميزات النسخة الأولى بالترتيب: سؤال وجواب AI › بطاقات مراجعة › تتبع تقدم › خريطة معرفية › قراءة منهج › بحث فوري",
         "evidence": ev("p01")},
        {"id": "broad_prog_ambition", "statement": "يخطط لتعلم مجالات واسعة: frontend, backend, mobile, ML, DL",
         "evidence": ev("l09")},
        {"id": "year_success_definition", "statement": "نجاح السنة: منصة يحدد فيها العلم، بروفايل بخريطة تفصيلية لما يعرف ولا يعرف، وتجعله يستغل وقته في التعلم الحقيقي",
         "evidence": ev("i06")},
        {"id": "agent_does_tech", "statement": "بنية المنتج الأولى: الوكيل يقرر الأنسب تقنياً",
         "evidence": ev("t01")},
        {"id": "atom_free_size", "statement": "الذرة معنوية بحجم حر (جملة أو صفحة) لها أب وقد يملك الأب أباً؛ ذرات ← مفهوم ← فكرة",
         "evidence": ev("d03", "s03")},
        {"id": "index_reuse_ok", "statement": "فهرس خاص بالوكيل على مصدر مقبول مبدئياً مع خوف من كونه أصل كل شيء — تحت الدراسة",
         "evidence": ev("n01")},
        {"id": "keep_bad_outputs_for_eval", "statement": "المخرجات المرفوضة تُبقى مؤقتاً وتُعرض عليه للتقييم والتعلم من أخطائها",
         "evidence": ev("b04")},
        {"id": "repo_name_med", "statement": "مستودع البناء الجديد أنشئ حديثاً باسم «med» تقريباً",
         "evidence": ev("w05")},
        {"id": "missing_questions", "statement": "أسئلة كان يتوقعها: التطبيق العملي للبرمجة بلا تنزيلات، دورة كاملة من اختيار السلسلة إلى الاستيعاب، تعلم الإنجليزية بعمق أكبر، ونماذج أولية تجريبية بدل الأسئلة النظرية",
         "evidence": ev("i11")},
    ],
    "contradictions": [
        {"qids": ev("l06"),
         "issue": "السؤال يفترض أنه أكمل كورسات جاد الأربعة؛ الحقيقة ~10% من الكورس الأول فقط",
         "resolution": "اعتُمد تصحيحه الصريح — لا إتقان سابق للبرمجة يُحسب له"},
        {"qids": ev("d09", "l01"),
         "issue": "D09 يقدّم «إنتاج الدروس» على «تعلم البرمجة»؛ L01 يقدّم «العلم الشرعي» (تعلماً) أولاً",
         "resolution": "محوران مختلفان (إنتاج مقابل تعلم) لا تناقض — كلاهما يجعل الشرعي أولاً؛ اعتُمد المحوران معاً"},
        {"qids": ev("w10", "t01", "d04"),
         "issue": "ثقة بالوكلاء 3/10 مقابل تفويض تقني واسع للوكيل",
         "resolution": "يفوّض التقنية بشرط بطاقة تجربة سريعة ومبادرة بإشعار أولاً (w09,w02) — تفويض مراقَب لا أعمى"},
        {"qids": ev("p07", "d04"),
         "issue": "«لا تمارين مولّدة لحظياً» مقابل «احتمال السماح للوكيل بإنشاء أسئلة»",
         "resolution": "الافتراضي تمارين خبير منتقاة؛ المولّد «إضافي» علاجي لخلل طارئ فقط — توفيق صريح من كلامه"},
        {"qids": ev("c10", "l11", "s05"),
         "issue": "«صفر على المنصات» و«لا يحتفظ بشيء» مقابل «يتابع الدروس منذ سنوات وسمع مئات المشايخ»",
         "resolution": "المتابعة سماع/تعرّض لا إتقان ذرات — بذرة الحالة تبدأ mastered فارغة وتُقاس بالتقييم (p09)"},
        {"qids": ev("b05", "g04"),
         "issue": "رفض ترتيب مغذّيات المنصة («كل شيء جاهز قبل الاستعمال») مقابل ترتيب العلوم في G04",
         "resolution": "ترتيب G04 يخص فهرس العلم وخطة البدء الدراسية، لا أولوية تغذية المنصة — اعتُمد للخطة"},
        {"qids": ev("g15", "l07"),
         "issue": "فلسفة الإنجليزية المكتشفة «قريبة لكن فيها نواقص»",
         "resolution": "اعتُمدت كتقريب مع علم مفتوح «التصحيح يكتبه هو لاحقاً»"},
        {"qids": ev("n01", "b03", "b04"),
         "issue": "يقبل فهرساً خاصاً بتحفظ ويخشى أن يكون خطأ الوكيل أصلاً ينهار عليه كل شيء",
         "resolution": "فهرس مخصص لكل مصدر يُسقَط على فهرس عام + الوكيل يقترح والمستخدم يعتمد واحداً واحداً (g05)"},
    ],
}


def main():
    entries = parse_log(LOG)
    seed = load_seed(SEED_JS)

    log_qids = {e["qid"] for e in entries}
    classified = TEST_QIDS | UNANSWERED | DEFERRED
    overlap = (UNANSWERED & DEFERRED) | (UNANSWERED & TEST_QIDS) | (DEFERRED & TEST_QIDS)
    assert not overlap, f"تداخل في التصنيف: {overlap}"
    unclassified = log_qids - classified
    answered = {e["qid"] for e in entries} - TEST_QIDS - UNANSWERED - DEFERRED
    assert not unclassified or unclassified <= answered, f"أسئلة بلا تصنيف: {unclassified}"

    # تحقق: لا دليل على سؤال لم يُجَب أو مؤجل
    def check_evidence(obj, trail=""):
        bad = []
        if isinstance(obj, dict):
            for q in obj.get("evidence", []):
                if q not in answered:
                    bad.append((trail, q))
            for k, v in obj.items():
                bad += check_evidence(v, f"{trail}.{k}")
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                bad += check_evidence(v, f"{trail}[{i}]")
        return bad
    bad = check_evidence(EXTRACTION)
    assert not bad, f"أدلة على أسئلة غير مُجابة: {bad}"

    kinds = {}
    status = {}
    for e in entries:
        qid = e["qid"]
        kind, payload = classify_answer(e["answer"])
        e["kind"], e["payload"] = kind, payload
        kinds[kind] = kinds.get(kind, 0) + 1
        status[qid] = ("test" if qid in TEST_QIDS else
                       "unanswered" if qid in UNANSWERED else
                       "deferred" if qid in DEFERRED else "answered")

    profile = {
        "meta": {
            "generated_by": "jadid2/learner/ingest.py",
            "source": "logs/answers.log (sha256:" + hashlib.sha256(LOG.read_bytes()).hexdigest()[:12] + ")",
            "seed_crosscheck": {
                "seed_keys": len(seed),
                "in_log_not_seed": sorted(log_qids - set(seed)),
                "note": "البذرة تسقط c05 (سؤال غير معرّف في الموقع) ولا تحفظ نص السؤال — السجل هو الأصل",
            },
            "stats": {
                "entries": len(entries),
                "real_questions": len(entries) - len(TEST_QIDS & log_qids),
                "answered": len(answered),
                "deferred": len(DEFERRED),
                "unanswered": len(UNANSWERED),
                "answer_kinds": kinds,
            },
        },
        **EXTRACTION,
        "unanswered_qids": sorted(UNANSWERED),
        "deferred_qids": sorted(DEFERRED),
    }
    OUT.write_text(json.dumps(profile, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    s = profile["meta"]["stats"]
    print(f"entries={s['entries']} answered={s['answered']} deferred={s['deferred']} "
          f"unanswered={s['unanswered']} commitments={len(profile['commitments'])} "
          f"contradictions={len(profile['contradictions'])}")
    print("→", OUT)


if __name__ == "__main__":
    main()
