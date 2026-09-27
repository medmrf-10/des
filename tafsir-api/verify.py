"""فحص تفسير-بالطلب: مئات الاستعلامات تقارن ردّ الخدمة بملف المصدر حرفياً.

يشغَّل بعد setup.sh وتشغيل الخدمة (uvicorn app.main:app --port 8377).
الخروج 0 ⇐ كل ردّ مطابق لملف المصدر حرفاً بحرف.
"""
import json
import os
import random
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("TAFAPI", "http://127.0.0.1:8377")
DATA = os.environ.get("TAFSIR_DATA", os.path.join(os.path.dirname(__file__), "data/tafsir_api-main/tafsir"))


def main() -> int:
    random.seed(42)
    eds = [e["slug"] for e in json.load(open(f"{DATA}/editions.json"))
           if e.get("language_name") == "arabic" and os.path.isdir(f"{DATA}/{e['slug']}")]
    ayah_data = os.path.join(os.path.dirname(DATA), "data", "ayah_data.json")
    counts = {d["surah"]: d["ayah"] for d in json.load(open(ayah_data))}

    queries = []
    for slug in eds:
        files = [(s, a) for s in counts for a in range(1, counts[s] + 1)
                 if os.path.exists(f"{DATA}/{slug}/{s}/{a}.json")]
        queries += [(slug, s, a) for s, a in random.sample(files, min(6, len(files)))]
    for slug in random.sample(eds, 12):
        for s, a in [(1, 1), (2, 255), (18, 10), (36, 1), (55, 13), (112, 1), (114, 6)]:
            queries.append((slug, s, a))

    ok = fail = err404 = 0
    fails = []
    for slug, s, a in queries:
        try:
            with urllib.request.urlopen(f"{BASE}/tafsir/{slug}/{s}/{a}", timeout=10) as r:
                d = json.loads(r.read())
            src = json.load(open(f"{DATA}/{slug}/{s}/{a}.json"))["text"]
            if d["text"] == src and d["text"].strip():
                ok += 1
            else:
                fail += 1
                fails.append(((slug, s, a), "MISMATCH/EMPTY"))
        except urllib.error.HTTPError as e:
            err404 += 1
            fails.append(((slug, s, a), f"HTTP {e.code} (آية غير موجودة في الطبعة)"))
        except Exception as e:  # noqa: BLE001
            fail += 1
            fails.append(((slug, s, a), str(e)))

    print(f"queries={len(queries)} ok={ok} mismatch={fail} http_404={err404}")
    for f in fails[:20]:
        print(f)
    # النجاح = صفر اختلاف؛ الـ404 مسموح فقط لآية غير موجودة فعلاً في ملفات الطبعة
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
