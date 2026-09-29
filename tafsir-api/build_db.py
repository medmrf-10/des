"""يبني tafsir.db (SQLite مُزال التكرار) من بيانات spa5k المستخرجة.

شغّل بعد setup.sh:  python3 build_db.py
الناتج: tafsir.db — جداول texts/segments/editions/empty_ayahs
"""
import json
import os
import sqlite3

DATA = os.environ.get("TAFSIR_DATA", os.path.join(os.path.dirname(__file__), "data/tafsir_api-main/tafsir"))
DB = os.environ.get("TAFSIR_DB", os.path.join(os.path.dirname(__file__), "tafsir.db"))


def main() -> None:
    if os.path.exists(DB):
        os.remove(DB)
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("CREATE TABLE texts(id INTEGER PRIMARY KEY, text TEXT, len INT)")
    cur.execute("CREATE TABLE segments(slug TEXT, surah INT, ayah INT, text_id INT)")
    cur.execute("CREATE TABLE editions(slug TEXT PRIMARY KEY, name TEXT, author TEXT, coverage INT)")
    cur.execute("CREATE TABLE empty_ayahs(slug TEXT, surah INT, ayah INT)")

    eds = [e for e in json.load(open(f"{DATA}/editions.json"))
           if e.get("language_name") == "arabic"]
    tid_by_text: dict[str, int] = {}
    nseg = nempty = 0
    for e in sorted(eds, key=lambda x: x["slug"]):
        slug = e["slug"]
        if not os.path.isdir(f"{DATA}/{slug}"):
            continue
        cov = 0
        batch = []
        for s in range(1, 115):
            d = f"{DATA}/{slug}/{s}"
            if not os.path.isdir(d):
                continue
            for f in os.listdir(d):
                fp = f"{d}/{f}"
                if f == "empty_ayahs.json":
                    for x in json.load(open(fp)):
                        cur.execute("INSERT INTO empty_ayahs VALUES(?,?,?)",
                                    (slug, x["surah"], x["ayah"]))
                        nempty += 1
                    continue
                if not f.endswith(".json"):
                    continue
                try:
                    a = int(f[:-5])
                except ValueError:
                    continue
                v = json.load(open(fp))
                t = v.get("text") if isinstance(v, dict) else None
                if not t:
                    continue
                if t not in tid_by_text:
                    tid = len(tid_by_text) + 1
                    tid_by_text[t] = tid
                    cur.execute("INSERT INTO texts VALUES(?,?,?)", (tid, t, len(t)))
                batch.append((slug, s, a, tid_by_text[t]))
                cov += 1
                nseg += 1
        cur.executemany("INSERT INTO segments VALUES(?,?,?,?)", batch)
        cur.execute("INSERT INTO editions VALUES(?,?,?,?)",
                    (slug, e["name"], e.get("author_name", ""), cov))
        con.commit()
        print(slug, cov, flush=True)

    cur.execute("CREATE INDEX idx_seg ON segments(slug,surah,ayah)")
    cur.execute("CREATE INDEX idx_empty ON empty_ayahs(slug,surah,ayah)")
    con.commit()
    con.close()
    print(f"segments: {nseg} | unique texts: {len(tid_by_text)} | empty: {nempty}")


if __name__ == "__main__":
    main()
