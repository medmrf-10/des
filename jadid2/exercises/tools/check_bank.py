#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""مدقّق بنك التمارين — jadid2/exercises/bank

لكل ملف JSON في bank/:
1. يصدّقه على ladder.schema.json (jsonschema).
2. يشغّل solution.code فعلياً ويطبّق success_criterion.asserts عليه
   — الحل النموذجي يجب أن يجتاز معياره بنفسه.
3. mode=predict: يشغّل starter_code ويطابق مخرجاته مع expected_stdout.
4. mode=rubric: يتحقق أن solution.answer يحقق rubric.
5. نمط «اكتشف الخطأ»: يتحقق أن starter_code يفشل فعلاً على الـasserts
   (العلة حقيقية لا وهمية).
6. يفحص source_checks على نص الحل (يجب أن تنجح كلها على الحل النموذجي).

الاستعمال: python3 jadid2/exercises/tools/check_bank.py
الخروج 0 = كل التمارين سليمة.
"""
import io
import json
import os
import re
import signal
import sys
import contextlib

try:
    import jsonschema
except ImportError:
    sys.exit("jsonschema غير مثبتة: pip install jsonschema")

HERE = os.path.dirname(os.path.abspath(__file__))
BANK = os.path.join(HERE, "..", "bank")
SCHEMA = os.path.join(HERE, "..", "ladder.schema.json")


class _Timeout(Exception):
    pass


def _alarm(_sig, _frm):
    raise _Timeout("تجاوز سقف التنفيذ")


@contextlib.contextmanager
def time_limit(sec):
    """سقف تنفيذ بـ SIGALRM — يقطع حتى الحلقات اللانهائية داخل asserts."""
    signal.signal(signal.SIGALRM, _alarm)
    signal.setitimer(signal.ITIMER_REAL, sec)
    try:
        yield
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)


def run_code(code, timeout_sec=5):
    """ينفّذ الكود في نطاق نظيف بسقف زمني، ويعيد (namespace, stdout, خطأ أو None)."""
    ns = {}
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf), time_limit(timeout_sec):
            exec(compile(code, "<exercise>", "exec"), ns)
        return ns, buf.getvalue(), None
    except Exception as exc:  # noqa: BLE001 — أي خطأ في كود تمرين = بيانات فحص
        return ns, buf.getvalue(), exc


def run_asserts(ns, asserts, timeout_sec=5):
    """يعيد قائمة (assert, خطأ أو None) — التنفيذ في نطاق الكود نفسه بسقف لكل assert."""
    out = []
    for a in asserts:
        try:
            with time_limit(timeout_sec):
                exec(compile(a, "<assert>", "exec"), ns)
            out.append((a, None))
        except Exception as exc:  # noqa: BLE001
            out.append((a, exc))
    return out


def norm_out(s):
    return "\n".join(line.strip() for line in s.strip().splitlines())


def check_source_checks(source, checks):
    bad = []
    for c in checks:
        kind, pat = c["kind"], c["pattern"]
        if kind in ("regex", "not_regex"):
            hit = re.search(pat, source) is not None
        else:  # contains / not_contains — مطابقة نصية حرفية
            hit = pat in source
        ok = (hit if kind in ("contains", "regex") else not hit)
        if not ok:
            bad.append((kind, pat, c.get("desc", "")))
    return bad


def check_rubric(text, rubric):
    bad = []
    if len(text.strip()) < rubric.get("min_chars", 1):
        bad.append(f"أقصر من min_chars={rubric['min_chars']}")
    for t in rubric.get("all_terms", []):
        if t not in text:
            bad.append(f"مصطلح إلزامي غائب: {t}")
    any_terms = rubric.get("any_terms", [])
    if any_terms:
        found = sum(1 for t in any_terms if t in text)
        if found < rubric.get("min_any", 1):
            bad.append(f"لم يظهر إلا {found} من any_terms (المطلوب {rubric.get('min_any',1)})")
    return bad


def check_exercise(path, schema):
    errs = []
    with open(path, encoding="utf-8") as f:
        ex = json.load(f)
    name = os.path.basename(path)

    jsonschema.validate(ex, schema)
    if ex["exercise_id"] + ".json" != name:
        errs.append(f"exercise_id={ex['exercise_id']} لا يطابق اسم الملف {name}")

    orders = [h["order"] for h in ex["hints"]]
    if orders != sorted(orders) or len(set(orders)) != len(orders):
        errs.append(f"رتب التلميحات غير متسلسلة فريدة: {orders}")

    crit = ex["success_criterion"]
    sol = ex["solution"]

    if crit["mode"] == "assert":
        ns, _, exc = run_code(sol.get("code", ""))
        if exc is not None:
            errs.append(f"solution.code لا يعمل: {exc!r}")
        else:
            for a, err in run_asserts(ns, crit["asserts"]):
                if err is not None:
                    errs.append(f"الحل يفشل assert: {a} ← {err!r}")
            for kind, pat, desc in check_source_checks(sol["code"], crit.get("source_checks", [])):
                errs.append(f"source_check يفشل على الحل: {kind} /{pat}/ — {desc}")
        # العلة في نمط «اكتشف الخطأ» يجب أن تكون حقيقية
        if ex["pattern"] == "اكتشف الخطأ":
            ns2, _, exc2 = run_code(ex.get("starter_code", ""))
            failed = exc2 is not None or any(e is not None for _, e in run_asserts(ns2, crit["asserts"]))
            if not failed:
                errs.append("starter_code لنمط «اكتشف الخطأ» يجتاز asserts — لا علة فعلية!")

    elif crit["mode"] == "predict":
        _, stdout, exc = run_code(ex.get("starter_code", ""))
        if exc is not None:
            errs.append(f"starter_code (المعروض للتوقع) لا يعمل: {exc!r}")
        elif norm_out(stdout) != norm_out(crit["expected_stdout"]):
            errs.append(f"مخرجات starter_code «{norm_out(stdout)}» ≠ expected_stdout «{crit['expected_stdout']}»")
        if norm_out(sol.get("answer", "")) != norm_out(crit["expected_stdout"]):
            errs.append("solution.answer لا يطابق expected_stdout")

    elif crit["mode"] == "rubric":
        bad = check_rubric(sol.get("answer", ""), crit["rubric"])
        errs.extend(f"الجواب النموذجي يخالف rubric: {b}" for b in bad)
        _, _, exc = run_code(ex.get("starter_code", ""))
        if exc is not None:
            errs.append(f"الكود المعروض للشرح لا يعمل: {exc!r}")

    return errs


def main():
    with open(SCHEMA, encoding="utf-8") as f:
        schema = json.load(f)
    files = sorted(f for f in os.listdir(BANK) if f.endswith(".json"))
    if not files:
        sys.exit("لا تمارين في bank/")
    total_err = 0
    for fn in files:
        try:
            errs = check_exercise(os.path.join(BANK, fn), schema)
        except Exception as exc:  # noqa: BLE001
            errs = [f"استثناء غير متوقع: {exc!r}"]
        status = "✓" if not errs else "✗"
        print(f"{status} {fn}", flush=True)
        for e in errs:
            print(f"    - {e}")
        total_err += len(errs)
    print(f"\n{len(files)} تمريناً، {total_err} خطأ")
    sys.exit(1 if total_err else 0)


if __name__ == "__main__":
    main()
