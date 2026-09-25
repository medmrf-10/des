/* اختبار قبول محرك المهارات — SPEC §7 (AC-1…AC-7).
   تشغيل: node jadid2/core/engine.test.js  (بلا تبعيات) */
'use strict';
const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
global.window = {};
global.FSRS = require('../../shared/fsrs.js');
require('./tree.js');
const MADRASA = require('./engine.js').MADRASA;
const TREE = global.window.MADRASA_TREE;

let ok = 0, bad = 0;
const t = (name, cond) => { cond ? ok++ : bad++; console.log((cond ? '✓' : '✗') + ' ' + name); };
const iso = d => d.toISOString().slice(0, 10);
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return iso(d); };
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return iso(d); };

/* AC-7 — حالة فارغة: قائمة اليوم = أول ذرة في الخطة */
t('AC-7 قائمة اليوم الفارغة = أول ذرة',
  JSON.stringify(MADRASA.todayQueue()) === JSON.stringify([TREE.order[0]]));

/* AC-1 — pass على ذرة جديدة: lv 0→1، فاصل يوم، الموعد غداً */
let r = MADRASA.record('a-muttasil', 'pass');
t('AC-1 المستوى ترقّى', r.level === 1);
t('AC-1 الفاصل يوم واحد', r.intervalDays === 1);
t('AC-1 الموعد غداً', r.nextReview === tomorrow());
t('AC-1 غير متقنة بعد', r.mastered === false);

/* AC-5 — barely: المستوى ثابت */
r = MADRASA.record('a-muttasil', 'barely');
t('AC-5 بالكاد لا يغيّر المستوى', r.level === 1);

/* AC-2 — fail: تنزيل مستوى + قائمة الصعب */
r = MADRASA.record('a-muttasil', 'fail');
t('AC-2 فشل ينزّل المستوى', r.level === 0);
t('AC-2 فشل يُدرج في الصعب', MADRASA.st('a-muttasil').hard === true);

/* AC-3 — fail عند lv0: أرضية */
r = MADRASA.record('a-muttasil', 'fail');
t('AC-3 أرضية المستوى صفر', r.level === 0);
t('AC-3 فاصل إعادة التعلم يوم', r.intervalDays === 1);

/* AC-4 — pass مرتان على ذرة جديدة: إتقان عند lv2 */
MADRASA.record('a-musnad', 'pass');
r = MADRASA.record('a-musnad', 'pass');
t('AC-4 pass×2 → lv2', r.level === 2);
t('AC-4 mastered=true', r.mastered === true);
t('AC-4 pass يرفع من الصعب', MADRASA.st('a-musnad').hard === false);

/* AC-6 — الاستحقاق: من موعده ≤ اليوم يظهر في dueToday */
MADRASA.st('a-muttasil').lastReview = yesterday(); // lastReview أمس + فاصل يوم = مستحق
t('AC-6 المستحق مُدرج', MADRASA.dueToday().includes('a-muttasil'));
t('AC-6 غير المستحق مستبعد', !MADRASA.dueToday().includes('a-hasan'));

/* ثبات التخزين */
const saved = JSON.parse(store['madrasa_v1']);
t('الحالة محفوظة في madrasa_v1', saved && saved.atoms['a-muttasil'].lv === 0 && saved.atoms['a-muttasil'].hard === true);
t('السجل log يلتقط النتائج', saved.log.length === 6);

/* حالة حدية: outcome مجهول يرمي */
try { MADRASA.record('a-muttasil', 'x'); t('outcome مجهول يرمي', false); }
catch (e) { t('outcome مجهول يرمي', true); }

/* nid غير شجري: يُسجَّل ولا يظهر في الاستعلامات */
MADRASA.record('ghost', 'pass');
MADRASA.st('ghost').lastReview = yesterday(); // مستحق بالتاريخ لكنه ليس ذرة شجرية
t('nid وهمي مستبعد من القوائم', !MADRASA.dueToday().includes('ghost') && MADRASA.stats().total === 9);

console.log(`\n${ok} نجح / ${bad} فشل`);
process.exit(bad ? 1 : 0);
