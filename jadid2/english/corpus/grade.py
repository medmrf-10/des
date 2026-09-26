#!/usr/bin/env python3
"""grade.py — تطبيق حرفي لـ `pipeline.md` على نصوص `corpus/texts/*.json`.

stdlib فقط. لكل نص: تقسيم جمل ← توكينة ← تلميذة ← وسم ترددي ← ربط ببنك
المتعلم ← نسب المعروفة ← خطة التكييف ← الحكم. كل ناتج يُحفَظ في
`annotated/<id>.json`، والجدول الملخّص في `graded_index.json`.

  python3 grade.py                  # كل النصوص
  python3 grade.py --text sw-sleep  # نص واحد
  python3 grade.py --index-only     # إعادة بناء graded_index.json من المخزَّن
"""
import json, re, sys, unicodedata, math
from pathlib import Path

HERE = Path(__file__).resolve().parent
TEXTS = HERE / "texts"
ANNOT = HERE / "annotated"
GUARD = "∯"  # حاجب النقطة (pipeline.md §1)

# ---------- §9 ملفات الضبط ----------
def _lines(name):
    return [l.strip() for l in (HERE / name).read_text(encoding="utf-8").splitlines() if l.strip()]

ABBREV = _lines("abbrev.txt")                    # §1
CONTR  = json.loads((HERE / "contractions.json").read_text(encoding="utf-8"))  # §2
IRREG  = json.loads((HERE / "irregular.json").read_text(encoding="utf-8"))     # §3
DEFMK  = [m.split() for m in _lines("def_markers.txt")]                        # §7 (تسلسلات توكنات)
SUBORD = set(_lines("subord.txt"))                                             # §6

def load_freq(path=None):
    """lemma -> {rank, zipf, band}. المصدر: wordfreq top_n_list(en) المجمّد."""
    tab = {}
    for ln in (path or HERE / "freq_table.jsonl").read_text(encoding="utf-8").splitlines():
        r = json.loads(ln)
        tab[r["lemma"]] = {"rank": r["rank"], "zipf": r["zipf"], "band": band_of(r["rank"])}
    return tab

def band_of(rank):
    """§4: B1 ≤1000 · B2 ≤2000 · B3 ≤3000 · B4 ≤5000 · B5 ≤10000 · B6 ≤30000 · R خارج."""
    if rank is None:  return "R"
    for b, hi in (("B1",1000),("B2",2000),("B3",3000),("B4",5000),("B5",10000),("B6",30000)):
        if rank <= hi: return b
    return "R"

FREQ = load_freq()

def rank_of(lemma):
    r = FREQ.get(lemma)
    return r["rank"] if r else None

# ---------- §0 التطبيع ----------
_SMART = {"“": '"', "”": '"', "‘": "'", "’": "'", "–": "-", "—": "-", "−": "-"}
def normalize(t):
    t = unicodedata.normalize("NFKC", t)          # «…» تصبح «...» — الطول يتغير قبل الإزاحات
    for a, b in _SMART.items():
        t = t.replace(a, b)
    return t

# ---------- §1 تقسيم الجمل ----------
def mask_dots(t):
    """حماية النقطة: اختصارات §9، عشرية، أوائل أسماء، حذف ثلاثي → ∯ بنفس الطول."""
    # «...» (3 أحرف بعد NFKC) → ∯∯∯
    t = t.replace("...", GUARD * 3)
    # الاختصارات (المركبة أولاً) — المطابقة على الصورة الدنيا
    for ab in sorted(ABBREV, key=len, reverse=True):
        pat = re.compile(r"(?<![A-Za-z])" + re.escape(ab[:-1]) + r"\.", re.I)
        t = pat.sub(lambda m: m.group(0)[:-1] + GUARD, t)
    t = re.sub(r"(\d)\.(\d)", rf"\1{GUARD}\2", t)   # أعداد عشرية
    t = re.sub(r"\b([A-Z])\.", rf"\1{GUARD}", t)     # أوائل مثل «A. mellifera»
    return t

_CUT   = re.compile(r'[.!?]+["\')\]]*\s+(?=[A-Z"\'(\[]|\d)')
_BLANK = re.compile(r'\n[ \t]*\n')
_SPLIT = re.compile(r'([.!?]+["\')\]]*)\s+(?=[A-Z"\'(\[]|\d)|\n[ \t]*\n')

def split_sentences(norm_text):
    """→ [{id,start,end,text}] — الإزاحات على النص المحجَّب (∯) ثم يُفك الحجب للنص."""
    m = mask_dots(norm_text)
    spans, start = [], 0
    for mt in _SPLIT.finditer(m):
        if mt.group(1) is not None:              # قطع بعلامة: نهاية الجملة بعد الإغلاقات
            end, nxt = mt.end(1), mt.end(0)
        else:                                    # سطر فارغ يقطع دائماً
            end, nxt = mt.start(0), mt.end(0)
        seg = m[start:end]
        spans.append((start, end))
        start = nxt
    if m[start:].strip():
        spans.append((start, len(m)))
    out = []
    for i, (a, b) in enumerate(spans, 1):
        seg = m[a:b].strip()
        if not seg: continue
        # إعادة ضبط start/end على حواف غير الفراغ
        a2 = a + (len(m[a:b]) - len(m[a:b].lstrip()))
        b2 = b - (len(m[a:b]) - len(m[a:b].rstrip()))
        out.append({"id": f"s{i:03d}", "start": a2, "end": b2,
                    "text": m[a2:b2].replace(GUARD, ".")})
    return out

# ---------- §2 التوكينة ----------
TOK = re.compile(r"[A-Za-z]+(?:[-'][A-Za-z]+)*|\d+(?:[.,]\d+)*")
BASE_FIX = {"don": "do", "wo": "will", "ca": "can", "ain": "be", "ai": "be"}  # قاعدة الاختصار قبل n't/'ll

def _exp_tokens(raw, start):
    """تشطيق الاختصارات: n't/'re/'ll/'ve/'m/'d/'s → توكنان؛ 's ملكية → علم poss."""
    if "'" not in raw:
        return None
    i = raw.index("'")
    base, suf = raw[:i], raw[i:]
    bl = base.lower()
    if suf == "'s" and bl not in CONTR["s_aux"]:
        return [{"raw": raw, "norm": bl, "start": start, "end": start + len(raw),
                 "poss": True, "lemma_override": lemmatize(bl)}]
    if suf == "'s" and bl == "let":
        ex = [{"raw": base, "norm": bl, "start": start, "end": start + i},
              {"raw": "'s", "norm": "us", "lemma_override": "us", "expansion": True,
               "start": start + i, "end": start + len(raw)}]
        return ex
    if suf in CONTR["map"]:
        lemma_base = BASE_FIX.get(bl, bl)
        return [{"raw": base, "norm": bl, "lemma_override": lemma_base,
                 "start": start, "end": start + i},
                {"raw": suf, "norm": CONTR["map"][suf], "lemma_override": CONTR["map"][suf],
                 "expansion": True, "start": start + i, "end": start + len(raw)}]
    return None  # 'clock' ونحوه — توكن واحد

def tokenize_sentence(sent):
    toks = []
    for mt in TOK.finditer(sent["text"]):
        raw = mt.group(0)
        ex = _exp_tokens(raw, mt.start())
        for t in (ex or [{"raw": raw, "norm": raw.lower(),
                          "start": mt.start(), "end": mt.end()}]):
            t["numeric"] = bool(re.fullmatch(r"\d+(?:[.,]\d+)*", t["raw"]))
            toks.append(t)
    return toks

# ---------- §3 التلميذة ----------
def _better(c, w):
    """المرشح أعلى تردداً من السطح: rank(c) موجود ∧ (rank(w) غائب ∨ rank(c) < rank(w))."""
    rc, rw = rank_of(c), rank_of(w)
    return rc is not None and (rw is None or rc < rw)

def _dedouble(s):
    return s[:-1] if len(s) >= 4 and s[-1] == s[-2] and s[-1] not in "aeious" else s

def lemmatize(w):
    if w in IRREG:
        return IRREG[w]
    # جمع/تصريف ثالث: ies→y ، es→'' ، s→'' (كلمة ≥4 أحرف)
    if len(w) >= 4:
        if w.endswith("ies") and _better(w[:-3] + "y", w):
            return w[:-3] + "y"
        if w.endswith("es") and _better(w[:-2], w):
            return w[:-2]
        if w.endswith("s") and not w.endswith("ss") and _better(w[:-1], w):
            return w[:-1]
    # تصريف فعل: ing/ed — إصلاحا إسقاط e والتشديد الأخير؛ جذع ≥3 أحرف (صدق محافظ)
    for suf in ("ing", "ed"):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            st = w[: -len(suf)]
            for c in (st + "e", _dedouble(st), st):
                if c != w and _better(c, w):
                    return c
            break
    # صفات: est/er إن تحسّن الترتيب (جذع ≥3)
    for suf in ("est", "er"):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            st = w[: -len(suf)]
            for c in (st, st + "e", _dedouble(st)):
                if c != w and _better(c, w):
                    return c
            break
    return w  # لا اشتقاق عاملي في نسخة 0

def _compound(parts):
    """المركَّب الواصلي §2: lemma = الأجزاء الملمّدة موصولة، zipf = min الأجزاء،
    معروف ⟺ كل جزء معروف في البنك (t['compound_known'])."""
    ls = [lemmatize(p.lower()) for p in parts]
    ranks = [rank_of(l) for l in ls]
    if any(r is None for r in ranks):
        return "-".join(ls), None, None, ls
    i = min(range(len(ls)), key=lambda j: ranks[j])
    return "-".join(ls), ranks[i], FREQ[ls[i]]["zipf"], ls

# ---------- §5 الربط بالبنك ----------
def load_bank(path):
    """lemma -> (state, retrievability) من vocab_bank.schema.json سطوراً JSONL."""
    bank = {}
    for ln in Path(path).read_text(encoding="utf-8").splitlines():
        if not ln.strip(): continue
        r = json.loads(ln)
        bank[r["lemma"]] = (r["state"], (r.get("fsrs") or {}).get("retrievability") or 0.0)
    return bank

def is_known(lemma, bank):
    st, retr = bank.get(lemma, ("", 0.0))
    return st in ("known", "learned") or (st == "inferring" and retr >= 0.80)

# ---------- المعالجة الكاملة ----------
def annotate(text, text_id, bank):
    """§0–§7: → sentences[] موسومة + unknowns{} بسياقاتها."""
    norm = normalize(text)
    sents = split_sentences(norm)
    for s in sents:
        toks = tokenize_sentence(s)
        for k, t in enumerate(toks):
            if t["numeric"]:
                t.update(lemma=None, rank=None, zipf=None, band=None, known=True)
                continue
            if "-" in t["norm"] and not t.get("expansion"):
                parts = t["norm"].split("-")
                lem, rk, zp, part_lemmas = _compound(parts)
                t["compound_parts"] = part_lemmas
                known = all(is_known(p, bank) for p in part_lemmas)
            else:
                if "lemma_override" in t:
                    lem = t["lemma_override"]
                else:
                    lem = lemmatize(t["norm"])
                rk = rank_of(lem)
                zp = FREQ[lem]["zipf"] if lem in FREQ else None
                known = is_known(lem, bank)
            # §3-4 الأسماء العلم
            proper = (t["raw"][:1].isupper() and k > 0 and t["norm"] not in FREQ
                      and not t.get("expansion") and not t.get("poss"))
            t.update(lemma=lem, rank=rk, zipf=zp, band=band_of(rk),
                     proper=proper, known=True if proper else known)
        s["tokens"] = toks
    # مجهولات النص
    unk = {}
    for s in sents:
        for i, t in enumerate(s["tokens"]):
            if t["numeric"] or t.get("proper") or t["known"]:
                continue
            u = unk.setdefault(t["lemma"], {"count": 0, "zipf": t["zipf"], "band": t["band"],
                                          "sents": [], "def": False})
            u["count"] += 1
            if s["id"] not in u["sents"]:
                u["sents"].append(s["id"])
    # §7 قابلية الاستنتاج
    for s in sents:
        norms = [t["norm"] for t in s["tokens"]]
        for i, t in enumerate(s["tokens"]):
            lem = t["lemma"]
            if t["numeric"] or t.get("proper") or t["known"] or lem not in unk:
                continue
            for mk in DEFMK:                      # علامة تعريف تنتهي قبل الموضع ≤6 توكنات
                L = len(mk)
                for j in range(max(0, i - 6), i - L + 1):
                    if norms[j:j + L] == mk:
                        unk[lem]["def"] = True
    for lem, u in unk.items():
        u["inferable"] = u["count"] >= 2 or u["def"]
    return {"text_id": text_id, "sentences": sents, "unknowns": unk}

# ---------- §6+§8 الإحصاء والحكم ----------
def stats_of(rec):
    sents = rec["sentences"]
    all_tok = [t for s in sents for t in s["tokens"]]
    scored = [t for t in all_tok if not t["numeric"] and not t.get("proper")]
    knowns = [t for t in scored if t["known"]]
    lemmas = {t["lemma"] for t in scored}
    lemmas_known = {t["lemma"] for t in scored if t["known"]}
    n = len(scored)
    M = len(sents) or 1
    C_tok = len(knowns) / n if n else 0.0
    C_lem = len(lemmas_known) / len(lemmas) if lemmas else 0.0
    msl = n / M
    s_long = sum(1 for s in sents if len(s["tokens"]) > 25) / M
    syn = sum(1 for s in sents for t in s["tokens"] if t["norm"] in SUBORD) / M
    u_rare = sum(1 for t in scored if t["band"] in ("B4", "B5", "B6", "R")) / n if n else 0.0
    D = 0.5 * (1 - C_tok) + 0.2 * u_rare + 0.15 * s_long + 0.15 * min(syn / 1.5, 1)
    unk_per_sent = {}
    for s in sents:
        c = sum(1 for t in s["tokens"]
                if not t["numeric"] and not t.get("proper") and not t["known"])
        if c: unk_per_sent[s["id"]] = c
    return {"tokens": len(all_tok), "scored_tokens": n, "sentences": M,
            "msl": round(msl, 2), "S_long": round(s_long, 3), "syn": round(syn, 3),
            "U_rare": round(u_rare, 3), "D": round(D, 3),
            "C_token": round(C_tok, 4), "C_lemma": round(C_lem, 4),
            "max_unk_sent": max(unk_per_sent.values(), default=0),
            "residual_per_sent_raw": unk_per_sent}

def adapt(rec, bank):
    """§5.3 سلم التكييف: pre-teach (zipf الأعلى، ≤8) ← أهداف استنتاج ← gloss."""
    unk = rec["unknowns"]
    non_inf = sorted((l for l, u in unk.items() if not u["inferable"]),
                     key=lambda l: (unk[l]["zipf"] is not None, unk[l]["zipf"]),
                     reverse=True)
    preteach, taught = [], set()
    scored_n = sum(1 for s in rec["sentences"] for t in s["tokens"]
                   if not t["numeric"] and not t.get("proper"))
    known_n = sum(1 for s in rec["sentences"] for t in s["tokens"]
                  if not t["numeric"] and not t.get("proper") and t["known"])
    gloss_cap = 5 * max(1, math.ceil(scored_n / 200))
    def gloss_left():
        return sum(1 for l in unk if l not in taught and not unk[l]["inferable"])
    def resid_max():
        m = 0
        for s in rec["sentences"]:
            c = sum(1 for t in s["tokens"] if not t["numeric"] and not t.get("proper")
                    and not t["known"] and t["lemma"] not in taught)
            m = max(m, c)
        return m
    # أضف حتى تتحقق الشروط أو تنفد ميزانية 8
    while non_inf and len(preteach) < 8:
        c_eff = (known_n + sum(unk[l]["count"] for l in taught)) / scored_n
        if c_eff >= 0.95 and gloss_left() <= gloss_cap and resid_max() <= 3:
            break
        l = non_inf.pop(0)
        preteach.append(l)
        taught.add(l)
    c_eff = (known_n + sum(unk[l]["count"] for l in taught)) / scored_n
    gloss = sorted((l for l in unk if l not in taught and not unk[l]["inferable"]),
                   key=lambda l: (unk[l]["zipf"] is not None, unk[l]["zipf"]), reverse=True)
    infer = sorted((l for l in unk if unk[l]["inferable"]),
                   key=lambda l: (unk[l]["zipf"] is not None, unk[l]["zipf"]), reverse=True)
    resid = {}
    for s in rec["sentences"]:
        c = sum(1 for t in s["tokens"] if not t["numeric"] and not t.get("proper")
                and not t["known"] and t["lemma"] not in taught)
        if c: resid[s["id"]] = c
    controls = {"C_eff": round(c_eff, 4), "gloss_n": len(gloss), "gloss_cap": gloss_cap,
                "resid_max": max(resid.values(), default=0), "n_infer": len(infer)}
    return {"preteach": preteach, "inference_targets": infer, "gloss": gloss,
            "controls": controls, "residual_per_sent": resid}

def verdicts(st, plan, n_words):
    """§8: verdict_raw على C_token الخام؛ verdict بعد سلم التكييف. «i-1» = i0 قراءة حرة."""
    C = st["C_token"]
    ctl = plan["controls"]
    in_zone = lambda c: 0.95 <= c < 0.98
    dose_ok = 150 <= n_words <= 300
    if C >= 0.98:
        raw = "i-1"
    elif C >= 0.95:
        raw = "i+1" if (st["max_unk_sent"] <= 3 and dose_ok) else "i+2"
    elif C >= 0.90:
        raw = "i+2"
    else:
        raw = "out"
    if raw == "i-1":
        final = "i-1"
    elif (in_zone(ctl["C_eff"]) and ctl["resid_max"] <= 3
          and ctl["gloss_n"] <= ctl["gloss_cap"] and ctl["n_infer"] >= 1 and dose_ok):
        final = "i+1"
    elif ctl["C_eff"] >= 0.90:
        final = "i+2"
    else:
        final = "out"
    return raw, final

def grade_file(path, bank):
    doc = json.loads(path.read_text(encoding="utf-8"))
    rec = annotate(doc["text"], doc["id"], bank)
    st = stats_of(rec)
    plan = adapt(rec, bank)
    raw_v, final_v = verdicts(st, plan, st["scored_tokens"])
    st.update({"verdict_raw": raw_v, "verdict": final_v})
    out = {"text_id": rec["text_id"], "title": doc["title"], "source": doc["source"],
           "sentences": rec["sentences"], "stats": st, "unknowns": rec["unknowns"],
           "plan": {"preteach": plan["preteach"], "inference_targets": plan["inference_targets"],
                    "gloss": plan["gloss"], "controls": plan["controls"],
                    "residual_per_sent": plan["residual_per_sent"]}}
    (ANNOT / f"{doc['id']}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1),
                                            encoding="utf-8")
    return {"id": doc["id"], "title": doc["title"], "source": doc["source"],
            "words": st["scored_tokens"], "sentences": st["sentences"], "D": st["D"],
            "C_token": st["C_token"], "C_lemma": st["C_lemma"],
            "msl": st["msl"], "S_long": st["S_long"], "syn": st["syn"], "U_rare": st["U_rare"],
            "verdict_raw": raw_v, "verdict": final_v,
            "pre_teach_count": len(plan["preteach"]),
            "inference_count": len(plan["inference_targets"]),
            "gloss_count": len(plan["gloss"]),
            "unknown_lemmas": len(rec["unknowns"])}

def main():
    bank = load_bank(sys.argv[sys.argv.index("--bank") + 1]
                     if "--bank" in sys.argv else HERE / "vocab_profile.jsonl")
    files = sorted(TEXTS.glob("*.json"))
    if "--text" in sys.argv:
        files = [TEXTS / (sys.argv[sys.argv.index("--text") + 1] + ".json")]
    rows = [grade_file(p, bank) for p in files]
    order = {"i-1": 0, "i+1": 1, "i+2": 2, "out": 3}
    rows.sort(key=lambda r: (order[r["verdict"]], r["D"]))
    idx = {"learner": "vocab_profile.jsonl (≈500 لمّة معروفة — L1)",
           "verdict_labels": {"i-1": "C≥0.98 قراءة حرة (i0 في SPEC)",
                              "i+1": "C_eff∈[0.95,0.98) + ضوابط §5.2",
                              "i+2": "قابل للتكييف جزئياً", "out": "مؤجَّل"},
           "generated_by": "grade.py — تطبيق حرفي لـ pipeline.md",
           "texts": rows}
    (HERE / "graded_index.json").write_text(json.dumps(idx, ensure_ascii=False, indent=1),
                                            encoding="utf-8")
    for r in rows:
        print(f'{r["id"]:24s} {r["verdict"]:4s} raw={r["verdict_raw"]:4s} '
              f'C={r["C_token"]:.3f} D={r["D"]:.3f} words={r["words"]:3d} '
              f'pre={r["pre_teach_count"]} inf={r["inference_count"]} gl={r["gloss_count"]}')

if __name__ == "__main__":
    main()
