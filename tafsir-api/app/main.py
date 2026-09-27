"""تفسير-بالطلب — مرحلة ١: خدمة FastAPI رفيعة فوق spa5k/tafsir_api المستضاف ذاتياً."""
import json
import os
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

DATA = Path(os.environ.get("TAFSIR_DATA", "/home/ubuntu/tafsir_api-main/tafsir"))
EDITIONS_FILE = DATA / "editions.json"

# أعداد آيات السور الـ114 (المصحف المدني)
AYAH_COUNTS = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
    111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30,
    73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18,
    45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12,
    30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36,
    25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11,
    8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
]
TOTAL_AYAHS = sum(AYAH_COUNTS)  # 6236

app = FastAPI(title="تفسير-بالطلب", version="0.1.0")


@lru_cache(maxsize=1)
def editions() -> list[dict]:
    with open(EDITIONS_FILE, encoding="utf-8") as f:
        return [e for e in json.load(f) if e.get("language_name") == "arabic"]


@lru_cache(maxsize=200)
def surah_files(slug: str, surah: int) -> dict[int, Path]:
    """خريطة رقم الآية ← ملفها، لسورة واحدة في تفسير واحد."""
    d = DATA / slug / str(surah)
    if not d.is_dir():
        return {}
    out = {}
    for p in d.glob("*.json"):
        try:
            out[int(p.stem)] = p
        except ValueError:
            continue
    return out


@lru_cache(maxsize=4096)
def read_ayah(slug: str, surah: int, ayah: int) -> str | None:
    p = surah_files(slug, surah).get(ayah)
    if p is None:
        return None
    with open(p, encoding="utf-8") as f:
        return json.load(f).get("text")


def grouped_range(slug: str, surah: int, ayah: int) -> list[int]:
    """إن كان نص الآية مطابقاً حرفياً لنص جارتها فهما في مقطع مجمّع — وسّع للمدى كاملاً."""
    text = read_ayah(slug, surah, ayah)
    if text is None:
        return []
    files = surah_files(slug, surah)
    lo, hi = ayah, ayah
    while lo - 1 in files and read_ayah(slug, surah, lo - 1) == text:
        lo -= 1
    while hi + 1 in files and read_ayah(slug, surah, hi + 1) == text:
        hi += 1
    return list(range(lo, hi + 1))


@app.get("/editions")
def list_editions() -> list[dict]:
    out = []
    for e in editions():
        slug = e["slug"]
        covered = sum(len(surah_files(slug, s)) for s in range(1, 115))
        out.append({**e, "covered_ayahs": covered, "coverage": round(covered / TOTAL_AYAHS, 4)})
    return out


@app.get("/tafsir/{slug}/{surah}/{ayah}")
def get_tafsir(slug: str, surah: int, ayah: int) -> dict:
    if slug not in {e["slug"] for e in editions()}:
        raise HTTPException(404, f"tafsir غير معروف: {slug}")
    if not 1 <= surah <= 114:
        raise HTTPException(400, "السورة بين 1 و114")
    if not 1 <= ayah <= AYAH_COUNTS[surah - 1]:
        raise HTTPException(400, f"السورة {surah} فيها {AYAH_COUNTS[surah - 1]} آية")
    text = read_ayah(slug, surah, ayah)
    if text is None:
        raise HTTPException(404, f"لا مقطع لهذه الآية في {slug}")
    ayahs = grouped_range(slug, surah, ayah)
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
    return {
        "total_ayahs": TOTAL_AYAHS,
        "editions": len(rows),
        "table": rows,
    }


app.mount("/", StaticFiles(directory=Path(__file__).parent / "static", html=True), name="static")
