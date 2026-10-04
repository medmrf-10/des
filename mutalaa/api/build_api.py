#!/usr/bin/env python3
"""build_api.py — يولّد mutalaa/api/ : نقاط JSON ثابتة فوق manifest.json + orders.json.
المخرجات:
  api/index.json       — فهرس النقاط وعدد السلاسل
  api/series.json      — كل السلاسل مصغّرة (id/name/sheikh/total/done/status/pos/want/lists)
  api/series/<id>.json — سلسلة كاملة بملفاتها
  api/sheikhs.json     — مجمّعة حسب الشيخ
  api/next.json        — التالية حسب الترتيب غير المكتملة
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = os.path.join(ROOT, "api")
MAN = os.path.join(ROOT, "data", "manifest.json")
ORD = os.path.join(ROOT, "orders.json")


def jload(p, d):
    try:
        return json.load(open(p, encoding="utf-8"))
    except Exception:
        return d


def slim(e, ord_):
    """نسخة مصغّرة لصف سلسلة — بلا قائمة الملفات."""
    oid = str(e["id"])
    want = ord_.get("want", {}).get(oid, 0)
    pos = ord_.get("order", []).index(oid) + 1 if oid in ord_.get("order", []) else 0
    lists = [n for n, ids in ord_.get("lists", {}).items() if oid in ids]
    return {
        "id": oid,
        "name": e.get("name", ""),
        "sheikh": e.get("sheikh", ""),
        "total": e.get("total", 0),
        "done": e.get("done", 0),
        "status": e.get("status", "none"),
        "pos": pos,          # موضعها في طابور «قريب البدء» (0 = خارج الطابور)
        "want": want,        # درجة الرغبة: -1 غير مرغوب / 0 محايد / 1 مرغوب / 2 مرغوب جدًا / 3 أولوية قصوى
        "lists": lists,      # القوائم التي تضمها
        "requested": oid in ord_.get("requests", []),
    }


def build():
    man = jload(MAN, [])
    ord_ = jload(ORD, {})
    os.makedirs(os.path.join(API, "series"), exist_ok=True)

    rows = [slim(e, ord_) for e in man]
    json.dump(rows, open(os.path.join(API, "series.json"), "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))

    for e in man:
        d = slim(e, ord_)
        d["files"] = e.get("files", [])
        d["url"] = e.get("url", "")
        json.dump(d, open(os.path.join(API, "series", f"{e['id']}.json"), "w", encoding="utf-8"),
                  ensure_ascii=False, separators=(",", ":"))

    sh = {}
    for r in rows:
        v = sh.setdefault(r["sheikh"] or "أخرى",
                          {"sheikh": r["sheikh"] or "أخرى", "series": 0, "episodes": 0, "done": 0, "ids": []})
        v["series"] += 1
        v["episodes"] += r["total"] or 0
        v["done"] += r["done"] or 0
        v["ids"].append(r["id"])
    json.dump(sorted(sh.values(), key=lambda x: -x["done"]),
              open(os.path.join(API, "sheikhs.json"), "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))

    nxt = None
    for oid in ord_.get("order", []):
        m = next((x for x in man if str(x["id"]) == oid), None)
        if m and (m.get("done") or 0) < (m.get("total") or 1):
            nxt = slim(m, ord_)
            break
    json.dump({"next": nxt, "queue": [o for o in ord_.get("order", [])],
               "requests": ord_.get("requests", [])},
              open(os.path.join(API, "next.json"), "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))

    json.dump({
        "series": len(rows), "sheikhs": len(sh), "t": ord_.get("t", 0),
        "endpoints": {
            "series.json": "كل السلاسل مصغّرة",
            "series/<id>.json": "سلسلة كاملة + ملفاتها",
            "sheikhs.json": "مجمّعة حسب الشيخ",
            "next.json": "السلسلة التالية + الطابور",
        },
        "writes": "POST ntfy.sh/des_mutalaa_q9 — {kind:'order',ids,requests,lists,want,t}",
    }, open(os.path.join(API, "index.json"), "w", encoding="utf-8"),
        ensure_ascii=False, indent=1)
    print(f"[api] {len(rows)} series, {len(sh)} sheikhs, next={nxt and nxt['id']}")


if __name__ == "__main__":
    build()
