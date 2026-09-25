/* مدرسة — محرك المهارات (SPEC §3).
   واجهة واحدة: record(nid, outcome) → { nextReview, intervalDays, level, mastered }
   outcome ∈ 'fail' | 'barely' | 'pass'
   النجاح: موعد أبعد (FSRS) + مستوى أصعب؛ الفشل: موعد أقرب + مستوى أسهل + قائمة الصعب.
   يعتمد على ../shared/fsrs.js (window.FSRS) للجدولة الزمنية. */
(function (root) {
'use strict';
const KEY = 'madrasa_v1';
const LEVELS = ['سهل', 'متوسط', 'صعب'];          // lv 0..2
const QUALITY = { fail: 1, barely: 3, pass: 5 }; // خريطة إلى جودة SM-2

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; }
}
let S = load() || { atoms: {}, log: [], planCursor: null };
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }

/* حالة ذرة — تُنشأ عند أول مساس */
function st(nid) {
  if (!S.atoms[nid]) S.atoms[nid] = {
    lv: 0, reps: 0, ease: 2.5, interval: 0,
    lastReview: null, lapses: 0, hard: false, last: null
  };
  return S.atoms[nid];
}

/* التسجيل: جوهر المحرك */
function record(nid, outcome) {
  const a = st(nid);
  const q = QUALITY[outcome];
  if (q == null) throw new Error('outcome ∈ fail|barely|pass');
  const r = FSRS.schedule({
    repetitions: a.reps, ease: a.ease, interval: a.interval,
    lastReview: a.lastReview, quality: q
  });
  a.reps = r.repetitions; a.ease = r.newEase; a.interval = r.newInterval;
  a.lapses = r.lapses; a.lastReview = new Date().toISOString();
  a.last = outcome;
  if (outcome === 'fail') { a.lv = Math.max(0, a.lv - 1); a.hard = true; }
  else if (outcome === 'pass') { a.lv = Math.min(LEVELS.length - 1, a.lv + 1); a.hard = false; }
  /* بالكاد: نجاح بلا ترقية، ولا يزيل الصعب */
  S.log.push({ nid, outcome, ts: Date.now() });
  if (S.log.length > 500) S.log = S.log.slice(-500);
  S.planCursor = nid;
  save();
  return {
    nextReview: r.nextReview, intervalDays: r.newInterval,
    level: a.lv, levelName: LEVELS[a.lv],
    mastered: outcome === 'pass' && a.lv === LEVELS.length - 1
  };
}

/* الاستعلامات (SPEC §3) */
const nodes = () => (window.MADRASA_TREE || {}).nodes || {};
const order = () => (window.MADRASA_TREE || {}).order || [];
const atomIds = () => Object.keys(nodes()).filter(k => nodes()[k].kind === 'atom');
const today = () => new Date().toISOString().slice(0, 10);

function dueToday() {
  return atomIds().filter(due).sort((x, y) => nextDate(x) < nextDate(y) ? -1 : 1);
}
function nextDate(id) { // الموعد القادم المسجل (lastReview + interval)
  const a = S.atoms[id]; if (!a || !a.lastReview) return null;
  const d = new Date(a.lastReview); d.setDate(d.getDate() + a.interval);
  return d.toISOString().slice(0, 10);
}
function due(id) { const n = nextDate(id); return n !== null && n <= today(); }
function hardList() { return atomIds().filter(id => S.atoms[id] && S.atoms[id].hard); }
function learned(id) { return !!(S.atoms[id] && S.atoms[id].lastReview); }
function nextNew() { return order().find(id => !learned(id)) || null; }
function todayQueue() {
  const due = dueToday();
  const nw = nextNew();
  return nw ? due.concat(nw) : due;
}
function stats() {
  const ids = atomIds();
  return {
    total: ids.length,
    learned: ids.filter(learned).length,
    due: ids.filter(due).length,
    hard: hardList().length,
    mastered: ids.filter(id => S.atoms[id] && S.atoms[id].lv === LEVELS.length - 1 &&
                              S.atoms[id].last === 'pass').length
  };
}
/* فتات التنقل: علم › باب › مفهوم › ذرة */
function path(nid) {
  const N = nodes(); const out = [];
  let c = N[nid];
  while (c) { out.unshift(c.title); c = c.parent ? N[c.parent] : null; }
  return out;
}
/* كل ذرات مفهوم (لاقتراح اختبار المفهوم) */
function conceptAtoms(cid) {
  const N = nodes();
  const walk = id => (N[id].children || []).flatMap(ch =>
    N[ch].kind === 'atom' ? [ch] : walk(ch));
  return walk(cid);
}
/* المفهوم الحاوي لذرة — لاختبار «أتممت مفهوماً؟» */
function parentConcept(nid) { const N = nodes(); return N[nid] && N[nid].parent ? N[nid].parent : null; }
function conceptMastered(cid) {
  return conceptAtoms(cid).every(id => {
    const a = S.atoms[id];
    return a && a.last === 'pass' && a.lv === LEVELS.length - 1;
  });
}

root.MADRASA = {
  st, record, dueToday, hardList, nextNew, todayQueue, stats,
  path, conceptAtoms, parentConcept, conceptMastered,
  nextDate, LEVELS, KEY,
  reset() { S = { atoms: {}, log: [], planCursor: null }; save(); }
};
})(typeof self !== 'undefined' ? self : this);
