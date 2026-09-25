/*
 * fsrs.js — خوارزمية تباعد التكرار (SM-2 محسّن) للمتصفح، بلا أي تبعيات.
 *
 * الاستخدام:
 *   schedule(card) — حيث card = {
 *     repetitions,        // عدد التكرارات الناجحة المتتالية
 *     ease,               // عامل السهولة (يبدأ عادةً 2.5)
 *     interval,           // الفاصل الحالي بالأيام
 *     lastReview,         // تاريخ آخر مراجعة (ISO أو Date أو null للبطاقة الجديدة)
 *     quality             // جودة التذكر الآن: 0..5 (أقل من 3 = نسيان)
 *   }
 *   تعيد: { nextReview, newInterval, newEase, repetitions, lapses, state, elapsedDays }
 *
 * التحسينات على SM-2 الكلاسيكي:
 *   1) سقف للفاصل وعامل السهولة (منع الفواصل الجامحة والانهيار).
 *   2) عند النسيان: إعادة الفاصل إلى فترة تعلم قصيرة بدل تصفير كامل الحالة.
 *   3) حساب الأيام المنقضية فعلياً منذ lastReview وإرجاعها للعرض.
 *   4) تذبذب خفيف ±5% على الفاصل لتوزيع الاستحقاقات (اختياري: options.fuzz).
 */
(function (root, factory) {
    const api = factory();
    if (typeof module !== "undefined" && module.exports) {
        module.exports = api; // Node / Deno / اختبارات
    } else {
        root.FSRS = api; // المتصفح: window.FSRS
    }
})(typeof self !== "undefined" ? self : this, function () {

    const DAY_MS = 24 * 60 * 60 * 1000;
    const MIN_EASE = 1.3;         // حد أدنى لعامل السهولة — منع انهيار الجدولة
    const MAX_EASE = 2.8;         // حد أقصى — فوقه الفاصل يتضخم بلا فائدة
    const DEFAULT_EASE = 2.5;
    const MAX_INTERVAL = 365;     // سقف الفاصل بالأيام
    const LAPSE_RELEARN_DAYS = 1; // فترة إعادة التعلم بعد النسيان
    const PASS_QUALITY = 3;       // جودة < 3 = نسيان (SM-2: 0-2 رسوب، 3-5 نجاح)

    /*
     * تعديل عامل السهولة وفق معادلة SM-2:
     *   ease' = ease + 0.1 - (5-q) * (0.08 + (5-q) * 0.02)
     * ثم تثبيته ضمن [MIN_EASE, MAX_EASE].
     */
    function nextEase(ease, quality) {
        const e = (typeof ease === "number" && ease > 0) ? ease : DEFAULT_EASE;
        const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
        return Math.min(MAX_EASE, Math.max(MIN_EASE, e + delta));
    }

    /*
     * الفاصل الجديد:
     *   عند النسيان → LAPSE_RELEARN_DAYS.
     *   تكرار 1 → يوم واحد، تكرار 2 → 6 أيام، ثم interval × ease الجديد.
     */
    function nextInterval(repetitions, ease, interval, quality, maxInterval) {
        if (quality < PASS_QUALITY) return LAPSE_RELEARN_DAYS;
        const reps = (typeof repetitions === "number" && repetitions >= 0) ? repetitions : 0;
        const cur = (typeof interval === "number" && interval > 0) ? interval : 0;
        const e = nextEase(ease, quality);
        let next;
        if (reps === 0) next = 1;
        else if (reps === 1) next = 6;
        else next = Math.round(cur * e);
        return Math.max(1, Math.min(maxInterval, next));
    }

    /*
     * الدالة الرئيسية: جدولة البطاقة بعد مراجعة واحدة.
     * options (كلها اختيارية):
     *   now         — لحظة المراجعة (Date/ISO؛ افتراضي الآن)
     *   maxInterval — سقف الفاصل بالأيام (افتراض�� 365)
     *   fuzz        — true لتذبذب ±5% حول الفاصل (يوزّع الاستحقاقات)
     */
    function schedule(card, options) {
        card = card || {};
        options = options || {};

        const now = options.now instanceof Date ? options.now
                  : (options.now ? new Date(options.now) : new Date());
        const maxInterval = Number(options.maxInterval) > 0 ? Number(options.maxInterval) : MAX_INTERVAL;
        const quality = Number(card.quality);
        if (!(quality >= 0 && quality <= 5)) {
            throw new Error("quality يجب أن تكون رقماً بين 0 و 5");
        }

        const lastReview = card.lastReview ? new Date(card.lastReview) : null;
        const elapsedDays = lastReview
            ? Math.max(0, Math.round((now - lastReview) / DAY_MS))
            : 0;

        const passed = quality >= PASS_QUALITY;
        // النجاح يزيد التكرارات، والنسيان يعيدها للصفر (سلسلة متتالية)
        const repetitions = passed ? ((Number(card.repetitions) || 0) + 1) : 0;
        const lapses = passed ? (Number(card.lapses) || 0) : (Number(card.lapses) || 0) + 1;
        const newEase = nextEase(card.ease, quality);

        let newInterval = nextInterval(card.repetitions, card.ease, card.interval, quality, maxInterval);
        if (passed && options.fuzz && newInterval > 3) {
            // تذبذب ±5% — يمنع تكدّس الاستحقاقات في يوم واحد
            const jitter = 1 + (Math.random() * 0.1 - 0.05);
            newInterval = Math.max(1, Math.min(maxInterval, Math.round(newInterval * jitter)));
        }

        const nextReview = new Date(now.getTime() + newInterval * DAY_MS);

        return {
            nextReview: nextReview.toISOString().slice(0, 10), // YYYY-MM-DD
            newInterval: newInterval,
            newEase: Number(newEase.toFixed(4)),
            repetitions: repetitions,
            lapses: lapses,
            state: passed ? "review" : "relearning",
            elapsedDays: elapsedDays
        };
    }

    /** بطاقة جديدة جاهزة للجدولة. */
    function newCard() {
        return { repetitions: 0, ease: DEFAULT_EASE, interval: 0, lastReview: null };
    }

    return { schedule: schedule, newCard: newCard, VERSION: "sm2-plus-1" };
});
