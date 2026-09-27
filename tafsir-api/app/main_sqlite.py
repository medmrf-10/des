"""تفسير-بالطلب — النسخة المنشورة: FastAPI فوق SQLite مُزال التكرار (تفسير.db).

نفس عقد بطاقة 010: GET /tafsir/{slug}/{surah}/{ayah} ← {edition, surah, ayah, ayahs[], grouped, text}.
المصدر: spa5k/tafsir_api — 57 طبعة عربية، 313k مقطعاً ← 190k نصاً فريداً (الآيات المجمعة تشترك في نص واحد).
"""
import os
import sqlite3
from contextlib import closing

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

DB_PATH = os.environ.get("TAFSIR_DB", os.path.join(os.path.dirname(__file__), "..", "tafsir.db"))

AYAH_COUNTS = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
    111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30,
    73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18,
    45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12,
    30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36,
    25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11,
    8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
]

app = FastAPI(title="تفسير-بالطلب", version="0.2.0")


def db() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH, check_same_thread=False)
    return con


@app.get("/editions")
def list_editions() -> list[dict]:
    with closing(db()) as con:
        rows = con.execute(
            "SELECT slug, name, author, coverage FROM editions ORDER BY slug"
        ).fetchall()
    return [
        {"slug": s, "name": n, "author_name": a, "covered_ayahs": c,
         "coverage": round(c / 6236, 4)}
        for s, n, a, c in rows
    ]


@app.get("/tafsir/{slug}/{surah}/{ayah}")
def get_tafsir(slug: str, surah: int, ayah: int) -> dict:
    if not 1 <= surah <= 114 or not 1 <= ayah <= AYAH_COUNTS[surah - 1]:
        raise HTTPException(400, "سورة/آية خارج المصحف")
    with closing(db()) as con:
        row = con.execute(
            "SELECT text_id FROM segments WHERE slug=? AND surah=? AND ayah=?",
            (slug, surah, ayah),
        ).fetchone()
        if row is None:
            known = con.execute("SELECT 1 FROM editions WHERE slug=?", (slug,)).fetchone()
            if not known:
                raise HTTPException(404, f"tafsir غير معروف: {slug}")
            empty = con.execute(
                "SELECT 1 FROM empty_ayahs WHERE slug=? AND surah=? AND ayah=?",
                (slug, surah, ayah),
            ).fetchone()
            raise HTTPException(404,
                f"لا مقطع لهذه الآية في {slug}" + (" (معلنة فارغة في المصدر)" if empty else ""))
        text_id = row[0]
        text = con.execute("SELECT text FROM texts WHERE id=?", (text_id,)).fetchone()[0]
        # المقاطع المجمعة: كل الآيات المتتالية المشارِكة لنفس النص
        ayahs = [r[0] for r in con.execute(
            "SELECT ayah FROM segments WHERE slug=? AND surah=? AND text_id=? ORDER BY ayah",
            (slug, surah, text_id),
        )]
    return {
        "edition": slug,
        "surah": surah,
        "ayah": ayah,
        "ayahs": ayahs,
        "grouped": len(ayahs) > 1,
        "text": text,
    }


@app.get("/coverage")
def coverage() -> dict:
    rows = list_editions()
    return {"total_ayahs": 6236, "editions": len(rows), "table": rows}


@app.get("/health")
def health() -> dict:
    with closing(db()) as con:
        n = con.execute("SELECT COUNT(*) FROM editions").fetchone()[0]
    return {"ok": True, "editions": n}


app.mount("/", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static"), html=True), name="static")
