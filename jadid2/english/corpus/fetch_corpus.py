#!/usr/bin/env python3
"""fetch_corpus.py — بناء corpus/texts/*.json من مصادرها الحقيقية.

النصوص منقولة حرفياً (verbatim): لا قصّ داخل وحدات المصدر، لا إعادة صياغة.
التجميع الوحيد المسموح: جمع وحدات متتالية (أحاديث/سور/فقرات مقدمة) كنص واحد.

المصادر:
  §1.1 جسر المعرفة — AhmedBaset/hadith-json (bukhari, muslim) — ترجمة إنجليزية
       منشورة (Muhsin Khan / Abdul Hamid Siddiqi)؛ quran-json (Saheeh
       International)؛ تفسير المختصر الإنجليزي الموجود في الريبو
       (wahy/data/tafsir/266-english-al-mukhtasar.json.gz).
  §1.2 مدرَّج — Simple English Wikipedia (CC BY-SA، API extracts)؛
       «The Æsop for Children» (Project Gutenberg #19994، public domain).

الاستعمال:  python3 fetch_corpus.py            (يحفظ في texts/)
المصادر تُخزَّن مؤقتاً في _src_cache/ داخل هذا المجلد للمراجعة (لا تُلتزم؟ تُلتزم
للشفافية — JSON خام). الناتج deterministic بمعزل عن وقت الجلب.
"""
import json, re, sys, gzip, unicodedata, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
CACHE = HERE / "_src_cache"
CACHE.mkdir(exist_ok=True)
REPO = HERE.parents[2]  # جذر الريبو

TOK = re.compile(r"[A-Za-z]+(?:[-'][A-Za-z]+)*|\d+(?:[.,]\d+)*")
def words(t): return TOK.findall(t)
def wc(t): return len(words(t))

def fetch(url, name):
    p = CACHE / name
    if not p.exists():
        req = urllib.request.Request(url, headers={"User-Agent": "des-corpus-builder/1.0"})
        p.write_bytes(urllib.request.urlopen(req, timeout=60).read())
    return p

def clean(t):
    """تنظيف إملائي لا يغيّر الكلمات: توحيد الفراغات داخل السطر، فقرات بـ\\n\\n."""
    t = unicodedata.normalize("NFC", t)
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r" *\n *", "\n", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()

def emit(tid, title, source, text):
    text = clean(text)
    doc = {"id": tid, "title": title, "source": source,
           "text": text, "tokens": TOK.findall(text)}
    (HERE / "texts" / f"{tid}.json").write_text(
        json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{tid:22s} {wc(text):4d}w  {title[:60]}")

HADITH_JSON = "https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/{}.json"
QURAN_JSON  = "https://raw.githubusercontent.com/risan/quran-json/main/dist/quran_en.json"
AESOP_TXT   = "https://www.gutenberg.org/cache/epub/19994/pg19994.txt"
WIKI_API    = ("https://simple.wikipedia.org/w/api.php?action=query&prop=extracts"
               "&explaintext=1&format=json&formatversion=2&redirects=1&titles={}")

# ---------- أحاديث: تجميع أحاديث متتالية ----------
def hadith_cluster(book, ids):
    data = json.loads(fetch(HADITH_JSON.format(book), f"{book}.json").read_bytes())
    by_id = {h["id"]: h for h in data["hadiths"]}
    parts = []
    for i in ids:
        h = by_id[i]
        parts.append(h["english"]["narrator"].strip() + "\n" + h["english"]["text"].strip())
    return "\n\n".join(parts)

def quran_cluster(ids):
    data = json.loads(fetch(QURAN_JSON, "quran_en.json").read_bytes())
    parts, names = [], []
    for s in data:
        if s["id"] in ids:
            names.append(s["translation"])
            for v in s["verses"]:
                parts.append(f"({s['id']}:{v['id']}) " + v["translation"].strip())
    return " — ".join(names), "\n\n".join(parts)

def tafsir_cluster(ids):
    gz = REPO / "wahy/data/tafsir/266-english-al-mukhtasar.json.gz"
    d = json.loads(gzip.open(gz, "rt", encoding="utf-8").read())
    parts = []
    for s in ids:
        for k in sorted(d["groups"], key=lambda k: [int(x) for x in k.split(":")]):
            if int(k.split(":")[0]) == s:
                v = d["groups"][k]
                parts.append(f"({k}) " + v["x"].strip())
    return "\n\n".join(parts)

AESOP_TITLES = {
    "ae-fox-grapes":   "THE FOX AND THE GRAPES",
    "ae-bundle-sticks":"THE BUNDLE OF STICKS",
    "ae-lion-mouse":   "THE LION AND THE MOUSE",
    "ae-shepherd-wolf":"THE SHEPHERD BOY AND THE WOLF",
    "ae-ants-grasshopper": "THE ANTS AND THE GRASSHOPPER",
}
def aesop(tid):
    raw = fetch(AESOP_TXT, "aesop19994.txt").read_text(encoding="utf-8")
    all_titles = [m for m in re.finditer(r"\n\n([A-Z ,'Æ&;-]{4,})\n\n", raw)]
    pos = {m.group(1).strip(): (m.start(), m.end()) for m in all_titles}
    name = AESOP_TITLES[tid]
    start = pos[name][1]
    nxt = min((s for s, e in pos.values() if s > pos[name][0]), default=len(raw))
    body = raw[start:nxt]
    body = re.sub(r"_([^_]+)_", r"\1", body)          # إسقاط علامات الميل الطباعية
    body = re.sub(r"\[Illustration[^\]]*\]", "", body) # إسقاط مواضع الصور
    return body.strip()

WIKI_LEADS = {   # مقالات Simple English Wikipedia: نأخذ فقرات المقدمة المتتالية
    "sw-sleep":    ("Sleep", 4, "common activities."),  # #p0-3 — نفس نص SAMPLE.md verbatim
    "sw-water":    ("Water", 2, None),
    "sw-dog":      ("Dog", 4, None),
    "sw-islam":    ("Islam", 3, None),
    "sw-muhammad": ("Muhammad", 3, None),
    "sw-desert":   ("Desert", 5, None),
    "sw-sun":      ("Sun", 2, None),
}
def wiki(article, n_par, cut_at):
    url = WIKI_API.format(urllib.request.quote(article))
    d = json.loads(fetch(url, f"wiki-{article}.json").read_bytes())
    full = d["query"]["pages"][0]["extract"]
    lead = full.split("==")[0].strip()              # قبل أول عنوان فرعي
    paras = [p for p in lead.split("\n") if p.strip()]
    last = paras[n_par - 1]
    if cut_at:                                      # قطع آخر فقرة عند حدّ الجملة
        i = last.index(cut_at) + len(cut_at)
        last = last[:i]
    return "\n\n".join(paras[: n_par - 1] + [last])

def main():
    emit("hb-bukhari-1-2", "Sahih al-Bukhari 1–2 — Actions are by intentions / beginning of revelation",
         {"corpus": "AhmedBaset/hadith-json", "book": "Sahih al-Bukhari",
          "hadiths": [1, 2], "url": HADITH_JSON.format("bukhari")},
         hadith_cluster("bukhari", [1, 2]))
    emit("hb-bukhari-8-11", "Sahih al-Bukhari 8–11 — Islam is built on five / marks of faith",
         {"corpus": "AhmedBaset/hadith-json", "book": "Sahih al-Bukhari",
          "hadiths": [8, 9, 10, 11], "url": HADITH_JSON.format("bukhari")},
         hadith_cluster("bukhari", [8, 9, 10, 11]))
    emit("hb-bukhari-26-28", "Sahih al-Bukhari 26–28 — good deeds, pilgrimage and the Fire",
         {"corpus": "AhmedBaset/hadith-json", "book": "Sahih al-Bukhari",
          "hadiths": [26, 27, 28], "url": HADITH_JSON.format("bukhari")},
         hadith_cluster("bukhari", [26, 27, 28]))
    emit("hb-muslim-7311-7313", "Sahih Muslim 7311–7313 — modesty, envy and daily conduct",
         {"corpus": "AhmedBaset/hadith-json", "book": "Sahih Muslim",
          "hadiths": [7311, 7312, 7313], "url": HADITH_JSON.format("muslim")},
         hadith_cluster("muslim", [7311, 7312, 7313]))

    name, text = quran_cluster([93, 94])
    emit("q-saheeh-93-94", f"Quran {name} (Saheeh International)",
         {"corpus": "risan/quran-json", "translation": "Saheeh International",
          "surahs": [93, 94], "url": QURAN_JSON}, text)
    name, text = quran_cluster([109, 110, 111, 112, 113, 114])
    emit("q-saheeh-109-114", f"Quran {name} (Saheeh International)",
         {"corpus": "risan/quran-json", "translation": "Saheeh International",
          "surahs": [109, 110, 111, 112, 113, 114], "url": QURAN_JSON}, text)

    emit("tf-mukhtasar-103-104", "Al-Mukhtasar tafsir of surahs 103–104 (English)",
         {"corpus": "repo: wahy/data/tafsir/266-english-al-mukhtasar.json.gz",
          "surahs": [103, 104]}, tafsir_cluster([103, 104]))
    emit("tf-mukhtasar-113-114", "Al-Mukhtasar tafsir of surahs 113–114 (English)",
         {"corpus": "repo: wahy/data/tafsir/266-english-al-mukhtasar.json.gz",
          "surahs": [113, 114]}, tafsir_cluster([113, 114]))

    for tid, (article, n, cut) in WIKI_LEADS.items():
        emit(tid, f"Simple English Wikipedia — {article} (lead)",
             {"corpus": "Simple English Wikipedia", "article": article,
              "url": f"https://simple.wikipedia.org/wiki/{article}",
              "license": "CC BY-SA 4.0"}, wiki(article, n, cut))

    for tid in AESOP_TITLES:
        emit(tid, AESOP_TITLES[tid].title() + " — The Æsop for Children",
             {"corpus": "Project Gutenberg #19994 «The Æsop for Children»",
              "url": AESOP_TXT, "license": "public domain"}, aesop(tid))

if __name__ == "__main__":
    main()
