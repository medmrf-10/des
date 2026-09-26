'use strict';
/* مُتعلِّم — قارئ الذرات. نقل حرفي لمنطق jadid2/selector/selector.py إلى JS:
   نفس ثوابت الإتقان (SPEC §2)، نفس due_score (§3)، نفس بوابة i+1 وترتيبها (§4)،
   نفس قاعدة «المستحق قبل الجديد» (§5)، ونفس تحديث المحاكاة sim_update (§6) —
   الأخير هو محدِّث هذه الصفحة لأن جدولة الإنتاج الحقيقية دور core/engine.js. */

const STAB_MIN_DAYS = 7.0, REPS_MIN = 2, STAB_EPS = 0.5;
const GRADE_OK = new Set(['good', 'easy']);
const REVIEW_STATES = new Set(['learning', 'review', 'relearning']);
const SIM_S0 = { again: 0.5, hard: 1.0, good: 2.5, easy: 5.0 };
const SIM_GROWTH = { again: 0.4, hard: 1.2, good: 3.0, easy: 3.5 };
const SIM_LAPSE_DUE_DAYS = 0.5;
const LEARNER_ID = 'reader-local';
const LS_KEY = 'jadid2_reader_v1';

const DAY_MS = 86400000;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function parseTs(s) { const t = Date.parse(s); return isNaN(t) ? null : new Date(t); }
function iso(d) { return d.toISOString().replace(/\.\d{3}Z$/, 'Z'); }
function fileOrderKey(name) {
  const m = /^\s*(\d+)/.exec(name);
  return [m ? parseInt(m[1], 10) : 1e9, name];
}
function cmpPos(a, b) { // (seriesRank, fileOrder, char_start) — نفس pos() في بايثون
  if (a._sr !== b._sr) return a._sr - b._sr;
  const fa = a._fk, fb = b._fk;
  if (fa[0] !== fb[0]) return fa[0] - fb[0];
  if (fa[1] !== fb[1]) return fa[1] < fb[1] ? -1 : 1;
  return a.char_start - b.char_start;
}

/* ————— الحالة المضغوطة ↔ سجل السكيمة —————
   localStorage: {key:{S,D,reps,lapses,last,grade,perf,m?}}
   state/due مشتقّتان حتمياً بنفس قواعد sim_update: الوسيطة 'again' تُبقي
   learning عند أول مراجعة وrelearning لاحقاً، 'hard' →learning بأول مرة ثم review،
   good/easy →review؛ due = last + (0.5ي إن again وإلا S أيام). */
function expand(key, c) {
  const reps = c.reps | 0, grade = c.grade || null;
  let st = c._st;                                    // صريح إن خُزّن
  if (!st) {
    if (reps === 0) st = 'new';
    else if (grade === 'again') st = reps === 1 ? 'learning' : 'relearning';
    else if (grade === 'hard') st = reps === 1 ? 'learning' : 'review';
    else st = 'review';
  }
  const dueMs = c._due ? Date.parse(c._due)
    : c.last ? Date.parse(c.last) + (grade === 'again' ? SIM_LAPSE_DUE_DAYS : (c.S || 0)) * DAY_MS : NaN;
  return {
    learner_id: LEARNER_ID, atom_id: key,
    fsrs: { state: st, difficulty: c.D ?? 5, stability: c.S || 0, due: isNaN(dueMs) ? null : iso(new Date(dueMs)), reps, lapses: c.lapses | 0, last_review: c.last || null },
    attempts: c.last && grade ? [{ ts: c.last, perf_type: c.perf || 'قراءة', grade }] : [],
    last_perf_type: c.perf || 'قراءة',
    mastered: !!c.m
  };
}
function compact(rec) { // سجل سكيمة → الشكل المضغوط (للاستيراد)
  const f = rec.fsrs || {};
  const a = rec.attempts || [];
  const last = a.length ? a[a.length - 1] : null;
  return { S: f.stability || 0, D: f.difficulty ?? 5, reps: f.reps | 0, lapses: f.lapses | 0,
    last: f.last_review || (last ? last.ts : null), grade: last ? last.grade : null,
    perf: rec.last_perf_type || 'قراءة', m: rec.mastered ? 1 : 0,
    _st: f.state, _due: f.due };   // حالة/استحقاق صريحان إن اختلفا عن المشتق — انظر expand
}

/* ————— طبقة المحرك ————— */
const Engine = {
  atoms: new Map(),      // key -> {atom_id,id,series,title,file,char_start,char_end,tags,main_tag,kind,declared_prereqs,_sr,_fk}
  prereqs: new Map(),    // key -> [{atom_id,rule,confidence}]
  dropped: [],
  links: {},
  idIndex: new Map(),
  seriesRank: new Map(),

  loadAtoms(indexes) {   // indexes: [{dir,data}]
    for (const { dir, data } of indexes) {
      const series = data.series || dir;
      for (const e of (data.entries || [])) {
        const key = series + '|' + e.id;
        const a = {
          atom_id: key, id: e.id, series, title: e.title || '',
          inferred: e.inferred !== false, file: e.file || '',
          char_start: e.char_start | 0, char_end: e.char_end | 0,
          tags: e.tags || [], main_tag: (e.tags && e.tags[0]) || 'أخرى',
          kind: e.kind ?? null, difficulty: e.difficulty ?? null,
          declared_prereqs: e.prerequisites || []
        };
        this.atoms.set(key, a);
      }
    }
    for (const [k, a] of this.atoms) {
      let arr = this.idIndex.get(a.id); if (!arr) this.idIndex.set(a.id, arr = []); arr.push(k);
    }
    const names = [...new Set([...this.atoms.values()].map(a => a.series))].sort();
    names.forEach((s, i) => this.seriesRank.set(s, i));
    for (const a of this.atoms.values()) { a._sr = this.seriesRank.get(a.series); a._fk = fileOrderKey(a.file); }
  },

  resolve(raw) {
    if (this.atoms.has(raw)) return raw;
    const hits = this.idIndex.get(raw) || [];
    return hits.length === 1 ? hits[0] : null;
  },

  buildEdges(fileEdges) {
    const P = this.prereqs = new Map([...this.atoms.keys()].map(k => [k, []]));
    const bySeries = new Map();
    for (const a of this.atoms.values()) {
      let arr = bySeries.get(a.series); if (!arr) bySeries.set(a.series, arr = []); arr.push(a);
    }
    for (const items of bySeries.values()) {
      const byFile = new Map();
      for (const a of items) { let arr = byFile.get(a.file); if (!arr) byFile.set(a.file, arr = []); arr.push(a); }
      const files = [...byFile.keys()].sort((x, y) => { const A = fileOrderKey(x), B = fileOrderKey(y); return A[0] - B[0] || (A[1] < B[1] ? -1 : A[1] > B[1] ? 1 : 0); });
      files.forEach((fname, fi) => {
        const seq = byFile.get(fname).slice().sort((x, y) => x.char_start - y.char_start);
        for (let i = 1; i < seq.length; i++)                       // R1 داخل الملف
          P.get(seq[i].atom_id).push({ atom_id: seq[i - 1].atom_id, rule: 'sequence', confidence: 1.0 });
        if (fi > 0 && seq.length) {                                // R3 آخر ملف سابق ← أول ملف لاحق
          const prev = byFile.get(files[fi - 1]);
          let lastPrev = prev[0];
          for (const a of prev) if (a.char_start > lastPrev.char_start) lastPrev = a;
          P.get(seq[0].atom_id).push({ atom_id: lastPrev.atom_id, rule: 'sequence', confidence: 0.9 });
        }
      });
    }
    for (const [k, a] of this.atoms)                               // prerequisites الصريحة
      for (const p of a.declared_prereqs) {
        const src = this.resolve(p.atom_id) || p.atom_id;
        if (!P.get(k).some(e => e.atom_id === src))
          P.get(k).push({ atom_id: src, rule: p.rule || 'manual', confidence: p.confidence ?? 1.0 });
      }
    for (const e of (fileEdges || [])) {                           // schema/graph.edges.json
      const dst = this.resolve(e.to), src = this.resolve(e.from);
      if (src && dst && !P.get(dst).some(x => x.atom_id === src))
        P.get(dst).push({ atom_id: src, rule: e.rule || 'manual', confidence: e.confidence ?? 1.0 });
    }
    this.dropped = breakCycles(P);
  },

  isMastered(rec, atom) {
    if (rec.mastered) return true;
    const f = rec.fsrs || {};
    if (f.state !== 'review') return false;
    if ((f.stability || 0) < STAB_MIN_DAYS || (f.reps | 0) < REPS_MIN) return false;
    const a = rec.attempts || [];
    const last = a.length ? a[a.length - 1].grade : null;
    if (!GRADE_OK.has(last)) return false;
    if (atom && atom.kind === 'مهارة' && rec.last_perf_type !== 'تمرين') return false;
    return true;
  },

  retrievability(rec, now) {
    const f = rec.fsrs || {};
    if (f.retrievability != null) return f.retrievability;
    const s = f.stability || 0;
    const lr = f.last_review ? parseTs(f.last_review) : null;
    if (s <= 0 || !lr) return 0;
    const elapsed = Math.max(0, (now - lr) / DAY_MS);
    return Math.pow(1 + elapsed / (9 * s), -1);
  },

  dueScore(rec, now) {
    const f = rec.fsrs || {};
    const due = parseTs(f.due);
    if (!due) return 0;
    return (now - due) / DAY_MS / Math.max(f.stability || 0, STAB_EPS);
  },

  prereqReport(atomId, state) {
    const edges = this.prereqs.get(atomId) || [];
    const missing = edges.filter(e => {
      const r = state.get(e.atom_id);
      return !(r && this.isMastered(r, this.atoms.get(e.atom_id) || {}));
    }).map(e => e.atom_id);
    return { total: edges.length, mastered: edges.length - missing.length, missing };
  },

  coveredNodes(state) {
    const nodes = new Set();
    for (const [k, rec] of state)
      if (this.links[k] && this.isMastered(rec, this.atoms.get(k) || {})) nodes.add(this.links[k].node);
    return nodes;
  },

  select(state, now, limit = 20, onlySeries = null) {
    const due = [], fresh = [];
    for (const [k, a] of this.atoms) {
      if (onlySeries && a.series !== onlySeries) continue;
      const rec = state.get(k);
      if (!rec || (rec.fsrs || {}).state === 'new') { fresh.push(a); continue; }
      const f = rec.fsrs || {};
      if (REVIEW_STATES.has(f.state)) {
        const d = parseTs(f.due);
        if (!d) { fresh.push(a); continue; }        // due معطوب ⇒ مسار i+1 يحرسه
        if (d <= now) due.push([a, rec]);
      }
    }
    due.sort((x, y) => {
      const d = this.dueScore(y[1], now) - this.dueScore(x[1], now);
      if (d) return d;
      const r = this.retrievability(x[1], now) - this.retrievability(y[1], now);
      if (r) return r;
      return cmpPos(x[0], y[0]);
    });
    const dueItems = due.map(([a, rec]) => {
      const ds = this.dueScore(rec, now);
      const over = (now - parseTs(rec.fsrs.due)) / DAY_MS;
      const pm = this.prereqReport(a.atom_id, state);
      return {
        atom_id: a.atom_id, group: 'due',
        why: `مراجعة مستحقة: تأخر ${over.toFixed(2)}ي على ثبات ${(rec.fsrs.stability || 0).toFixed(2)}ي → due_score=${ds.toFixed(3)}`,
        prereqs_met: pm, due_score: Math.round(ds * 1e4) / 1e4
      };
    });

    const masteredKeys = new Set();
    for (const [k, r] of state) if (this.isMastered(r, this.atoms.get(k) || {})) masteredKeys.add(k);
    const doneNodes = this.coveredNodes(state);
    const nodeGain = a => { const l = this.links[a.atom_id]; return l && !doneNodes.has(l.node) ? l.confidence : 0; };

    const frontier = fresh.filter(a =>
      !masteredKeys.has(a.atom_id) &&
      (this.prereqs.get(a.atom_id) || []).every(e => {
        const r = state.get(e.atom_id);
        return r && this.isMastered(r, this.atoms.get(e.atom_id) || {});
      }));

    const pool = frontier.slice().sort((a, b) => (nodeGain(b) - nodeGain(a)) || cmpPos(a, b));
    const freshItems = []; let prevTag = null;
    while (pool.length) {                            // تنويع المهارة — أول وسم مخالف يتقدم
      let best = pool[0];
      for (const cand of pool) if (cand.main_tag !== prevTag) { best = cand; break; }
      pool.splice(pool.indexOf(best), 1);
      const pm = this.prereqReport(best.atom_id, state);
      const gain = nodeGain(best);
      let why = `i+1: السابقات ${pm.mastered}/${pm.total} متقنة`;
      const l = this.links[best.atom_id];
      if (gain) why += ` — يدشن عقدة ${l.node} (ثقة ${gain.toFixed(2)})`;
      freshItems.push({ atom_id: best.atom_id, group: 'new', why, prereqs_met: pm, due_score: 0 });
      prevTag = best.main_tag;
    }
    return dueItems.concat(freshItems).slice(0, limit);
  },

  /* محدِّث الصفحة = sim_update حرفياً (SPEC §6) على السجل الموسّع. */
  applyGrade(state, key, grade, perf, now) {
    let rec = state.get(key);
    if (!rec) rec = { learner_id: LEARNER_ID, atom_id: key, fsrs: { state: 'new', due: iso(now) }, attempts: [] };
    const f = rec.fsrs;
    let s = f.stability || 0;
    if (f.state === 'new' || (f.reps | 0) === 0) {
      s = SIM_S0[grade];
      f.state = (grade === 'again' || grade === 'hard') ? 'learning' : 'review';
    } else {
      s = Math.max(0.2, s * SIM_GROWTH[grade]);
      if (grade === 'again') { f.state = 'relearning'; f.lapses = (f.lapses | 0) + 1; }
      else f.state = 'review';
    }
    f.stability = Math.round(s * 1000) / 1000;
    f.reps = (f.reps | 0) + 1;
    f.last_review = iso(now);
    f.retrievability = 1.0;
    f.due = iso(new Date(now.getTime() + (grade === 'again' ? SIM_LAPSE_DUE_DAYS : s) * DAY_MS));
    rec.attempts.push({ ts: iso(now), perf_type: perf, grade });
    rec.last_perf_type = perf;
    rec.mastered = this.isMastered(rec, { kind: null });
    state.set(key, rec);
    return rec;
  }
};

function breakCycles(prereqs) { // قاعدة السلامة: أدنى ثقة داخل الدورة تُسقط (نفس Python)
  const dropped = [];
  for (;;) {
    const cyc = findCycle(prereqs);
    if (!cyc) return dropped;
    let best = null;
    for (const dst of cyc)
      for (const e of prereqs.get(dst) || [])
        if (cyc.has(e.atom_id) && (!best || e.confidence < best.e.confidence)) best = { dst, e };
    prereqs.set(best.dst, prereqs.get(best.dst).filter(x => x !== best.e));
    dropped.push({ to: best.dst, ...best.e });
  }
}
function findCycle(prereqs) { // DFS تكراري ثلاثي الألوان — نسخة selector.py
  const color = new Map();
  for (const start of prereqs.keys()) {
    if (color.get(start)) continue;
    color.set(start, 1);
    const stack = [[start, (prereqs.get(start) || [])[Symbol.iterator]()]];
    const onpath = [start];
    while (stack.length) {
      const top = stack[stack.length - 1], u = top[0], it = top[1];
      let descended = false;
      for (;;) {
        const nx = it.next();
        if (nx.done) break;
        const v = nx.value.atom_id;
        if (!prereqs.has(v)) continue;
        const c = color.get(v) || 0;
        if (c === 1) return new Set(onpath.slice(onpath.indexOf(v)));
        if (c === 0) {
          color.set(v, 1);
          stack.push([v, (prereqs.get(v) || [])[Symbol.iterator]()]);
          onpath.push(v); descended = true; break;
        }
      }
      if (!descended) { stack.pop(); onpath.pop(); color.set(u, 2); }
    }
  }
  return null;
}

/* ————— مصادر النص (fetch مرة ثم Cache API + ذاكرة) ————— */
const Texts = {
  mem: new Map(), books: new Map(),
  async get(url) {
    if (this.mem.has(url)) return this.mem.get(url);
    let c = null;
    try { c = await caches.open('jadid2-src'); const hit = await c.match(url); if (hit) { const t = await hit.text(); this.mem.set(url, t); return t; } } catch (e) { }
    const r = await fetch(url); if (!r.ok) throw new Error(url + ' → ' + r.status);
    const t = await r.text(); this.mem.set(url, t);
    try { if (c) await c.put(url, new Response(t)); } catch (e) { }
    return t;
  },
  async getGz(url) { // نص JSON مضغوط
    const key = 'gz:' + url;
    if (this.mem.has(key)) return this.mem.get(key);
    let c = null;
    try { c = await caches.open('jadid2-src'); const hit = await c.match(url); if (hit) { const t = await hit.json(); this.mem.set(key, t); return t; } } catch (e) { }
    const r = await fetch(url); if (!r.ok) throw new Error(url + ' → ' + r.status);
    let d;
    if (typeof DecompressionStream === 'function') {
      const ds = r.body.pipeThrough(new DecompressionStream('gzip'));
      d = JSON.parse(await new Response(ds).text());
    } else { // احتياط: جلب كاملاً وفك يدوياً عبر مسار pako-غير موجود ⇒ رمي واضح
      throw new Error('المتصفح لا يدعم DecompressionStream');
    }
    this.mem.set(key, d);
    try { if (c) await c.put(url, new Response(JSON.stringify(d))); } catch (e) { }
    return d;
  },
  murjiText(d) { // نفس reconstruct() في murji/engine/lookup.py
    const groups = d.groups, vg = d.vg || {};
    const sk = k => { const p = k.split(':'); return (+p[0]) * 1e4 + (+p[1]); };
    const aks = (vg && Object.keys(vg).length ? Object.keys(vg) : Object.keys(groups)).sort((a, b) => sk(a) - sk(b));
    const seen = new Set(), parts = [];
    for (const ak of aks) {
      const gk = vg[ak] || ak;
      if (seen.has(gk) || !(gk in groups)) continue;
      seen.add(gk); parts.push(groups[gk].x);
    }
    return parts.join('\n');
  },
  async atomText(atom, tdir) {
    const f = atom.file;
    if (f.endsWith('.gz')) {
      const url = '../../' + f;                    // مسار من جذر الريبو (murji index.source)
      const d = await this.getGz(url);
      const bkey = 'book:' + url;
      let txt = this.books.get(bkey);
      if (!txt) { txt = this.murjiText(d); this.books.set(bkey, txt); }
      return txt.slice(atom.char_start, atom.char_end);
    }
    const url = `../src/transcripts/${encodeURIComponent(tdir)}/${encodeURIComponent(f)}`;
    const t = await this.get(url);
    return t.slice(atom.char_start, atom.char_end);
  }
};

/* ————— حالة المتعلم ————— */
const Learner = {
  m: new Map(),   // key -> compact record
  load() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (raw && raw.atoms) for (const [k, v] of Object.entries(raw.atoms)) this.m.set(k, v);
    } catch (e) { }
  },
  save() {
    const o = { v: 1, atoms: Object.fromEntries(this.m) };
    localStorage.setItem(LS_KEY, JSON.stringify(o));
  },
  expanded() {
    const s = new Map();
    for (const [k, c] of this.m) s.set(k, expand(k, c));
    return s;
  },
  grade(key, g, perf, now) {
    const state = this.expanded();
    Engine.applyGrade(state, key, g, perf, now);
    this.m.set(key, compact(state.get(key)));
    this.save();
  },
  exportObj() {
    const states = [...this.m.keys()].map(k => expand(k, this.m.get(k)));
    for (const r of states) r.mastered = Engine.isMastered(r, Engine.atoms.get(r.atom_id) || {});
    return { learner_id: LEARNER_ID, exported_at: iso(new Date()), format: 'learner_state', states };
  },
  importData(raw) { // يقبل: قائمة سجلات سكيمة، أو {states:[...]}, أو الخريطة المضغوطة
    let records = null;
    if (Array.isArray(raw)) records = raw;
    else if (raw && Array.isArray(raw.states)) records = raw.states;
    else if (raw && Array.isArray(raw.learner_states)) records = raw.learner_states;
    else if (raw && raw.atoms && typeof raw.atoms === 'object')
      records = Object.entries(raw.atoms).map(([k, v]) => ({ ...v, atom_id: k, _compact: true }));
    else if (raw && typeof raw === 'object')
      records = Object.entries(raw).filter(([k, v]) => v && typeof v === 'object').map(([k, v]) => ({ ...v, atom_id: k, _compact: true }));
    if (!records) return { ok: false, n: 0 };
    let n = 0, unmatched = 0;
    for (const r of records) {
      const key = Engine.resolve(r.atom_id) || (Engine.atoms.has(r.atom_id) ? r.atom_id : null);
      if (!key && !r._compact) { unmatched++; continue; }
      const k = key || r.atom_id;
      let c;
      if (r._compact) c = { S: r.S || 0, D: r.D ?? 5, reps: r.reps | 0, lapses: r.lapses | 0, last: r.last || null, grade: r.grade || null, perf: r.perf || 'قراءة', m: r.m ? 1 : 0 };
      else c = compact(r);
      const cur = this.m.get(k);
      if (!cur || !c.last || !cur.last || c.last >= cur.last) { this.m.set(k, c); n++; }
    }
    this.save();
    return { ok: true, n, unmatched };
  }
};

/* ————— تمرين توليدي «مرّنني» —————
   لا بنوك تمارين لسلاسل jadid2 اليوم (exercises/bank كلها prog-*) ⇒ توليد من النص:
   (أ) أكمل التتمة — اختيار تتمة المقطع الحقيقية بين 3 مقاطع أخرى من نفس المصدر.
   (ب) أكمل الجملة — كلمة محذوفة من جملة، بمقارنة مطبَّعة. */
const Exer = {
  norm: s => s.replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim(),
  words(t) { return t.split(/\s+/).filter(w => /[\u0600-\u06FF]/.test(w)); },
  make(atom, fullText) {
    const w = this.words(fullText);
    if (w.length < 14) return null;
    if (Math.random() < 0.5) return this.mcq(atom, fullText, w);
    return this.cloze(fullText, w);
  },
  mcq(atom, fullText, w) {
    const len = 4 + Math.floor(Math.random() * 3);                 // تتمة 4–6 كلمات
    const ctxLen = 10 + Math.floor(Math.random() * 6);
    const start = 1 + Math.floor(Math.random() * Math.max(1, w.length - ctxLen - len - 1));
    const ctx = w.slice(start, start + ctxLen).join(' ');
    const answer = w.slice(start + ctxLen, start + ctxLen + len).join(' ');
    const dis = [];
    let guard = 0;
    while (dis.length < 3 && guard++ < 60) {
      const p = Math.floor(Math.random() * Math.max(1, w.length - len));
      const cand = w.slice(p, p + len).join(' ');
      if (cand !== answer && !dis.includes(cand) && Math.abs(p - (start + ctxLen)) > len) dis.push(cand);
    }
    if (dis.length < 3) return this.cloze(fullText, w);
    const opts = dis.concat(answer).sort(() => Math.random() - .5);
    return { kind: 'mcq', prompt: `ما التتمة الصحيحة لهذا المقطع من «${atom.title || 'الذرة'}»؟`, ctx: '…' + ctx, opts, answer };
  },
  cloze(fullText, w) {
    for (let guard = 0; guard < 60; guard++) {
      const i = 2 + Math.floor(Math.random() * (w.length - 4));
      const word = w[i];
      if (word.length < 3) continue;
      const ctx = w.slice(Math.max(0, i - 8), i).join(' ') + ' ⟨…⟩ ' + w.slice(i + 1, Math.min(w.length, i + 6)).join(' ');
      return { kind: 'cloze', prompt: 'أكمل الكلمة المحذوفة ⟨…⟩ من موضعها:', ctx, answer: word };
    }
    return null;
  }
};

/* ————— الواجهة ————— */
const UI = {
  manifest: [], curSeries: null, ranked: [], current: null, exAttempted: false,
  async boot() {
    Learner.load();
    const bar = $('loadbar').firstElementChild, msg = $('loadmsg');
    const man = await (await fetch('series.json')).json();
    this.manifest = man;
    const jobs = [];
    let done = 0; const total = man.length + 2;
    const tick = () => { done++; bar.style.width = (100 * done / total).toFixed(0) + '%'; msg.textContent = `تحميل الفهارس… ${done}/${total}`; };
    for (const s of man)
      jobs.push(fetch(`../atoms/${encodeURIComponent(s.dir)}/index.json`).then(r => r.json()).then(d => ({ dir: s.dir, data: d })).then(x => { tick(); return x; }));
    jobs.push(fetch('../schema/graph.edges.json').then(r => r.json()).then(d => { Engine._edgesFile = d; tick(); return null; }));
    jobs.push(fetch('../xlink/data/atom_links.json').then(r => r.ok ? r.json() : null).then(d => {
      if (d && d.links) for (const [k, v] of Object.entries(d.links)) if (v && v.node) Engine.links[k] = { node: v.node, confidence: v.confidence || 0 };
      tick(); return null;
    }).catch(() => { tick(); return null; }));
    const indexes = (await Promise.all(jobs)).filter(Boolean);
    msg.textContent = 'بناء حواف المتطلبات…';
    await new Promise(r => setTimeout(r, 30));
    Engine.loadAtoms(indexes);
    Engine.buildEdges(Engine._edgesFile || []);
    if (Engine.dropped.length) console.warn('أسقطت حواف دورة:', Engine.dropped.length);
    $('boot').hidden = true; $('splash').hidden = false;
    $('btnExport').hidden = false; $('btnImport').hidden = false;
    this.renderSplash();
  },
  stats(sid) {
    let mastered = 0, open = 0, blocked = 0, learned = 0;
    const state = Learner.expanded();
    for (const a of Engine.atoms.values()) {
      if (sid !== null && a.series !== sid) continue;
      const rec = state.get(a.atom_id);
      if (rec && Engine.isMastered(rec, a)) { mastered++; continue; }
      if (rec) { learned++; continue; }
      const met = (Engine.prereqs.get(a.atom_id) || []).every(e => {
        const r = state.get(e.atom_id); return r && Engine.isMastered(r, Engine.atoms.get(e.atom_id) || {});
      });
      met ? open++ : blocked++;
    }
    return { mastered, open, blocked, learned };
  },
  renderSplash() {
    const q = ($('q').value || '').trim();
    const grid = $('sgrid'); grid.innerHTML = '';
    const mkCard = (sid, label, sub) => {
      const st = this.stats(sid);
      const total = sid === null ? Engine.atoms.size : this.manifest.find(s => s.id === sid).n;
      const pct = total ? Math.round(100 * st.mastered / total) : 0;
      const d = document.createElement('div');
      d.className = 'scard';
      d.innerHTML = `<h3>${esc(label)}</h3><div class="sh">${esc(sub)} — ${total} ذرة</div>
        <div><span class="chip ok">متقنة <b>${st.mastered}</b></span><span class="chip">مفتوحة <b>${st.open}</b></span><span class="chip bad">محجوبة <b>${st.blocked}</b></span><span class="chip">قيد التعلم <b>${st.learned}</b></span></div>
        <div class="bar"><i style="width:${pct}%"></i></div>`;
      d.onclick = () => this.openSeries(sid);
      grid.appendChild(d);
    };
    mkCard(null, 'الكل — جولة عامة', 'المحرك على الكوربوس كاملاً');
    for (const s of this.manifest) {
      if (q && !s.id.includes(q) && !(s.sheikh || '').includes(q)) continue;
      mkCard(s.id, s.id.replace(/^\d+_/, ''), s.sheikh);
    }
  },
  async openSeries(sid) {
    this.curSeries = sid;
    $('splash').hidden = true; $('study').hidden = false;
    this.refresh(true);
  },
  refresh(repick) {
    const now = new Date();
    const state = Learner.expanded();
    const total = this.curSeries === null ? Engine.atoms.size : this.manifest.find(s => s.id === this.curSeries).n;
    const st = this.stats(this.curSeries);
    $('stProg').innerHTML = `متقنة <b>${st.mastered}</b>/${total} · محجوبة <b>${st.blocked}</b> · قيد التعلم <b>${st.learned}</b>`;
    this.ranked = Engine.select(state, now, 30, this.curSeries);
    const nDue = this.ranked.filter(x => x.group === 'due').length;
    $('stDue').innerHTML = `مستحقة الآن <b>${nDue}</b>`;
    if (!this.ranked.length) {
      // أقرب استحقاق قادم — نفس تلميح selector.py stderr
      let nearest = null;
      for (const r of state.values()) { const d = parseTs(r.fsrs.due); if (d && d > now && (!nearest || d < nearest)) nearest = d; }
      $('whyBox').innerHTML = 'لا مستحق ولا i+1 مفتوح' + (nearest ? ` — أقرب استحقاق قادم <b>${iso(nearest)}</b>` : '');
      this.current = null;
      $('aTitle').textContent = '—'; $('aText').textContent = 'لا شيء الآن. عُد عند الاستحقاق أو أتقن ما يفتح التالي.'; $('queue').innerHTML = ''; $('exCard').hidden = true;
      $('crumb').textContent = ''; $('aTags').innerHTML = ''; $('aSrc').textContent = '';
      return;
    }
    if (repick || !this.current) this.current = this.ranked[0];
    if (!this.ranked.some(x => x.atom_id === this.current.atom_id)) this.current = this.ranked[0];
    this.renderAtom(this.current);
    const q = $('queue'); q.innerHTML = '';
    for (const it of this.ranked.slice(0, 15)) {
      const a = Engine.atoms.get(it.atom_id);
      const div = document.createElement('div');
      div.className = 'li' + (it.atom_id === this.current.atom_id ? ' now' : '');
      div.innerHTML = `<b>${it.group === 'due' ? '◔' : '☆'}</b> ${esc(a ? a.title || it.atom_id : it.atom_id)}
        <div class="w">${esc(it.why)} · السابقات ${it.prereqs_met.mastered}/${it.prereqs_met.total}</div>`;
      div.style.cursor = 'pointer';
      div.onclick = () => { this.current = it; this.exAttempted = false; $('exCard').hidden = true; this.renderAtom(it); };
      q.appendChild(div);
    }
  },
  async renderAtom(it) {
    const a = Engine.atoms.get(it.atom_id);
    if (!a) return;
    $('whyBox').innerHTML = `<b>${it.group === 'due' ? 'مراجعة مستحقة' : 'i+1 جديد'}</b> — ${esc(it.why)}`;
    $('crumb').innerHTML = `${esc(a.series)} · <b>${esc(a.id)}</b> · ${esc(a.file)}`;
    $('aTitle').textContent = a.title || a.atom_id;
    $('aTags').innerHTML = a.tags.map(t => `<span class="chip">${esc(t)}</span>`).join('');
    $('aText').textContent = 'جارٍ تحميل النص…';
    $('aSrc').textContent = '';
    const tdir = this.manifest.find(s => s.id === a.series)?.tdir;
    try {
      const t = await Texts.atomText(a, tdir);
      if (this.current !== it) return;
      $('aText').textContent = t.trim() || '(مقطع فارغ)';
      $('aSrc').textContent = `${a.file} · المواضع ${a.char_start}–${a.char_end} · ${t.length} حرفاً`;
      this._fullText = t;
    } catch (e) {
      $('aText').textContent = 'تعذّر تحميل النص: ' + e.message;
      this._fullText = '';
    }
  },
  runExercise() {
    const a = Engine.atoms.get(this.current.atom_id);
    const card = $('exCard');
    const ex = Exer.make(a, this._fullText || '');
    if (!ex) { card.hidden = false; card.innerHTML = '<div class="muted">المقطع قصير جداً لتوليد تمرين — اقرأه ثم قدّر نفسك.</div>'; return; }
    card.hidden = false;
    if (ex.kind === 'mcq') {
      card.innerHTML = `<div class="crumb"><b>تمرين — أكمل التتمة</b></div><div class="seg" style="color:var(--dim)">${esc(ex.ctx)} ⟨…⟩</div><div class="muted" style="margin-bottom:6px">${esc(ex.prompt)}</div><div id="exOpts"></div><div id="exRes"></div>`;
      const box = card.querySelector('#exOpts');
      for (const o of ex.opts) {
        const b = document.createElement('button');
        b.className = 'exopt'; b.textContent = o;
        b.onclick = () => {
          this.exAttempted = true;
          [...box.children].forEach(x => { x.disabled = true; if (x.textContent === ex.answer) x.classList.add('right'); });
          if (o !== ex.answer) b.classList.add('wrong');
          card.querySelector('#exRes').innerHTML = o === ex.answer
            ? '<span class="chip ok">✓ صحيح</span> <span class="muted">قدّر نفسك بالأزرار أدناه (تُسجَّل كتمرين).</span>'
            : `<span class="chip bad">✗ ليست هي</span> <span class="muted">الصحيحة معلَّمة بالأخضر — قدّر honestly أدناه.</span>`;
        };
        box.appendChild(b);
      }
    } else {
      card.innerHTML = `<div class="crumb"><b>تمرين — أكمل الجملة</b></div><div class="seg" style="color:var(--dim)">${esc(ex.ctx)}</div>
        <div class="row"><input type="text" id="exIn" placeholder="الكلمة المحذوفة…" style="flex:1"><button class="btn ghost" id="exChk">تحقق</button><button class="btn ghost" id="exShow">أظهر</button></div><div id="exRes"></div>`;
      const res = card.querySelector('#exRes');
      card.querySelector('#exChk').onclick = () => {
        this.exAttempted = true;
        const v = Exer.norm(card.querySelector('#exIn').value);
        res.innerHTML = v === Exer.norm(ex.answer) ? '<span class="chip ok">✓ صحيح</span>' : `<span class="chip bad">✗</span> <span class="muted">الجواب: <b>${esc(ex.answer)}</b></span>`;
      };
      card.querySelector('#exShow').onclick = () => { this.exAttempted = true; res.innerHTML = `<span class="muted">الجواب: <b>${esc(ex.answer)}</b></span>`; };
    }
  },
  doGrade(g) {
    if (!this.current) return;
    const perf = this.exAttempted ? 'تمرين' : 'قراءة';
    Learner.grade(this.current.atom_id, g, perf, new Date());
    this.exAttempted = false;
    $('exCard').hidden = true;
    this.current = null;
    this.refresh(true);
  },
  exportFile() {
    const blob = new Blob([JSON.stringify(Learner.exportObj(), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'jadid2_learner_state.json';
    a.click(); URL.revokeObjectURL(a.href);
  },
  async importFile(file) {
    const raw = JSON.parse(await file.text());
    const r = Learner.importData(raw);
    alert(`استيراد: ${r.n} سجلاً` + (r.unmatched ? ` · ${r.unmatched} بلا ذرة مطابقة (تُجاهلت)` : ''));
    this.renderSplash();
  }
};

$('btnBack').onclick = () => { $('study').hidden = true; $('splash').hidden = false; UI.renderSplash(); };
$('btnNext').onclick = () => { // التالي = التالي في قائمة المحرك الحالية (تصفح لا تقدير)
  if (!UI.ranked.length) return;
  const i = UI.current ? UI.ranked.findIndex(x => x.atom_id === UI.current.atom_id) : -1;
  UI.current = UI.ranked[(i + 1) % UI.ranked.length];
  UI.exAttempted = false; $('exCard').hidden = true;
  UI.refresh(false);
};
$('btnEx').onclick = () => UI.runExercise();
document.querySelectorAll('.grades button').forEach(b => b.onclick = () => UI.doGrade(b.dataset.g));
$('btnExport').onclick = () => UI.exportFile();
$('btnImport').onclick = () => $('fileIn').click();
$('fileIn').onchange = e => { if (e.target.files[0]) UI.importFile(e.target.files[0]); e.target.value = ''; };
$('q').oninput = () => UI.renderSplash();
UI.boot();
