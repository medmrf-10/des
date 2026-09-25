/* برمج — مختبر SQL: قاعدة مصغرة + منفّذ SQL مكتوب يدوياً (SELECT/JOIN/WHERE/GROUP/HAVING/ORDER/LIMIT/IN/UPDATE/DELETE) */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let st = {};
try { st = JSON.parse(localStorage.getItem('prog_sql') || '{}') || {}; } catch (e) { st = {}; }
const save = () => localStorage.setItem('prog_sql', JSON.stringify(st));

/* ====== القاعدة ====== */
const DB0 = {
  students: [
    { id: 1, name: 'أحمد', city: 'الرياض', age: 22 }, { id: 2, name: 'سارة', city: 'جدة', age: 19 },
    { id: 3, name: 'خالد', city: 'مكة', age: 25 }, { id: 4, name: 'نورة', city: 'الرياض', age: 20 },
    { id: 5, name: 'فهد', city: 'المدينة', age: 28 }, { id: 6, name: 'ريم', city: 'جدة', age: 23 },
    { id: 7, name: 'علي', city: 'مكة', age: 21 }, { id: 8, name: 'هند', city: 'الرياض', age: 26 },
    { id: 9, name: 'عمر', city: 'جدة', age: 30 }, { id: 10, name: 'ليلى', city: 'المدينة', age: 18 },
    { id: 11, name: 'يوسف', city: 'مكة', age: 24 }, { id: 12, name: 'مها', city: 'الرياض', age: 27 },
    { id: 13, name: 'سعد', city: 'جدة', age: 22 }, { id: 14, name: 'جود', city: 'المدينة', age: 21 },
    { id: 15, name: 'طارق', city: 'الرياض', age: 19 }
  ],
  courses: [
    { id: 1, title: 'مقدمة JS', level: 'مبتدئ' }, { id: 2, title: 'DOM', level: 'مبتدئ' },
    { id: 3, title: 'بايثون', level: 'مبتدئ' }, { id: 4, title: 'SQL', level: 'متوسط' },
    { id: 5, title: 'خوارزميات', level: 'متوسط' }, { id: 6, title: 'async', level: 'متوسط' },
    { id: 7, title: 'أنظمة', level: 'متقدم' }, { id: 8, title: 'أمن', level: 'متقدم' },
    { id: 9, title: 'شبكات', level: 'متوسط' }, { id: 10, title: 'قواعد بيانات', level: 'متقدم' },
    { id: 11, title: 'اختبار', level: 'مبتدئ' }, { id: 12, title: 'نشر', level: 'متوسط' }
  ],
  enrollments: [
    { id: 1, student_id: 1, course_id: 1, grade: 90 }, { id: 2, student_id: 1, course_id: 4, grade: 72 },
    { id: 3, student_id: 2, course_id: 1, grade: 55 }, { id: 4, student_id: 2, course_id: 3, grade: 88 },
    { id: 5, student_id: 3, course_id: 5, grade: 95 }, { id: 6, student_id: 4, course_id: 1, grade: 61 },
    { id: 7, student_id: 4, course_id: 2, grade: 84 }, { id: 8, student_id: 5, course_id: 7, grade: 45 },
    { id: 9, student_id: 6, course_id: 3, grade: 77 }, { id: 10, student_id: 7, course_id: 5, grade: 92 },
    { id: 11, student_id: 8, course_id: 6, grade: 58 }, { id: 12, student_id: 9, course_id: 4, grade: 81 },
    { id: 13, student_id: 10, course_id: 1, grade: 66 }, { id: 14, student_id: 11, course_id: 5, grade: 90 },
    { id: 15, student_id: 12, course_id: 8, grade: 50 }, { id: 16, student_id: 13, course_id: 2, grade: 87 },
    { id: 17, student_id: 14, course_id: 9, grade: 74 }, { id: 18, student_id: 15, course_id: 1, grade: 93 }
  ]
};
let DB = null;
const cloneDB = () => JSON.parse(JSON.stringify(DB0));

/* ====== المُحلّل ====== */
const OPS = ['>=', '<=', '<>', '!=', '=', '<', '>'];
function tok(s) {
  const t = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "'") { let j = i + 1, v = ''; while (j < s.length && s[j] !== "'") v += s[j++]; if (j >= s.length) throw new Error('سلسلة غير مغلقة'); t.push({ k: 'str', v }); i = j + 1; continue; }
    if (/[0-9]/.test(c)) { let j = i, v = ''; while (j < s.length && /[0-9.]/.test(s[j])) v += s[j++]; t.push({ k: 'num', v: +v }); i = j; continue; }
    if (/[\wء-غ]/.test(c)) { let j = i, v = ''; while (j < s.length && /[\wء-غ.]/.test(s[j])) v += s[j++]; t.push({ k: 'id', v }); i = j; continue; }
    if (c === '(' || c === ')' || c === ',' || c === '*') { t.push({ k: c }); i++; continue; }
    const op = OPS.find(o => s.startsWith(o, i));
    if (op) { t.push({ k: 'op', v: op }); i += op.length; continue; }
    throw new Error('رمز غير مفهوم: ' + c);
  }
  return t;
}
const KW = { SELECT: 1, FROM: 1, WHERE: 1, JOIN: 1, ON: 1, GROUP: 1, BY: 1, HAVING: 1, ORDER: 1, LIMIT: 1, IN: 1, UPDATE: 1, SET: 1, DELETE: 1, AND: 1, OR: 1, AS: 1, ASC: 1, DESC: 1 };
const up = t => (t && t.k === 'id') ? t.v.toUpperCase() : '';
const isKW = (t, w) => up(t) === w;

function parseCond(tk, p) {
  let node = parseOr(tk, p);
  return node;
}
function parseOr(tk, p) {
  let l = parseAnd(tk, p);
  while (isKW(tk[p.i], 'OR')) { p.i++; l = { or: [l, parseAnd(tk, p)] }; }
  return l;
}
function parseAnd(tk, p) {
  let l = parseAtom(tk, p);
  while (isKW(tk[p.i], 'AND')) { p.i++; l = { and: [l, parseAtom(tk, p)] }; }
  return l;
}
function parseExpr(tk, p) {
  const t = tk[p.i];
  if (t.k === '*') { p.i++; return { col: '*' }; }
  if (t.k === 'num' || t.k === 'str') { p.i++; return { lit: t.v }; }
  if (t.k === '(') { p.i++; const q = parseSelect(tk, p); expect(tk, p, ')'); return { sub: q }; }
  if (t.k === 'id') {
    const v = t.v; p.i++;
    if (tk[p.i] && tk[p.i].k === '(') {
      const argT = tk[p.i + 1];
      if (argT && (argT.k === 'id' || argT.k === '*')) { p.i += 2; expect(tk, p, ')'); return { fn: v.toUpperCase(), arg: argT.v || '*' }; }
      p.i++; return { fn: v.toUpperCase(), arg: '*' };
    }
    return { col: v };
  }
  throw new Error('تعبير غير مفهوم قرب ' + (t ? t.v : 'النهاية'));
}
function parseAtom(tk, p) {
  const l = parseExpr(tk, p);
  const t = tk[p.i];
  if (isKW(t, 'IN')) {
    p.i++; expect(tk, p, '('); const q = parseSelect(tk, p); expect(tk, p, ')');
    return { in: [l, q] };
  }
  if (t && t.k === 'op') { p.i++; const r = parseExpr(tk, p); return { cmp: [l, t.v, r] }; }
  return { cmp: [l, '=', { lit: true }] };
}
function expect(tk, p, k) { if (!tk[p.i] || tk[p.i].k !== k) throw new Error('متوقع ' + k); p.i++; }

function parseSelect(tk, p) {
  expect(tk, p, 'id'); /* SELECT */
  const cols = [];
  while (true) {
    const e = parseExpr(tk, p);
    let alias = null;
    if (isKW(tk[p.i], 'AS')) { p.i++; alias = tk[p.i].v; p.i++; }
    else if (tk[p.i] && tk[p.i].k === 'id' && !KW[up(tk[p.i])]) { alias = tk[p.i].v; p.i++; }
    cols.push({ e, alias });
    if (tk[p.i] && tk[p.i].k === ',') { p.i++; continue; }
    break;
  }
  expect(tk, p, 'id'); /* FROM */
  const from = { t: tk[p.i].v, a: null }; p.i++;
  if (tk[p.i] && tk[p.i].k === 'id' && !KW[up(tk[p.i])]) { from.a = tk[p.i].v; p.i++; }
  const joins = [];
  while (isKW(tk[p.i], 'JOIN')) {
    p.i++; const j = { t: tk[p.i].v, a: null }; p.i++;
    if (tk[p.i] && tk[p.i].k === 'id' && !KW[up(tk[p.i])]) { j.a = tk[p.i].v; p.i++; }
    if (!isKW(tk[p.i], 'ON')) throw new Error('JOIN يحتاج ON'); p.i++;
    const l = tk[p.i].v, r = tk[p.i + 2].v;
    if (!tk[p.i + 1] || tk[p.i + 1].v !== '=') throw new Error('ON يحتاج a = b');
    j.on = [l, r]; p.i += 3; joins.push(j);
  }
  const q = { cols, from, joins, where: null, group: null, having: null, order: null, limit: null };
  if (isKW(tk[p.i], 'WHERE')) { p.i++; q.where = parseCond(tk, p); }
  if (isKW(tk[p.i], 'GROUP')) { p.i++; expect(tk, p, 'id'); q.group = [tk[p.i].v]; p.i++; while (tk[p.i] && tk[p.i].k === ',') { p.i++; q.group.push(tk[p.i].v); p.i++; } }
  if (isKW(tk[p.i], 'HAVING')) { p.i++; q.having = parseCond(tk, p); }
  if (isKW(tk[p.i], 'ORDER')) { p.i++; expect(tk, p, 'id'); const c = tk[p.i].v; p.i++; const d = isKW(tk[p.i], 'DESC') ? (p.i++, -1) : (isKW(tk[p.i], 'ASC') && p.i++, 1); q.order = { c, d }; }
  if (isKW(tk[p.i], 'LIMIT')) { p.i++; if (!tk[p.i] || tk[p.i].k !== 'num') throw new Error('LIMIT يحتاج رقماً'); q.limit = tk[p.i].v; p.i++; }
  return q;
}

function parse(sql) {
  const tk = tok(sql.trim().replace(/;+$/, ''));
  const p = { i: 0 };
  if (isKW(tk[0], 'SELECT')) return { select: parseSelect(tk, p) };
  if (isKW(tk[0], 'UPDATE')) {
    p.i++; const t = tk[p.i].v; p.i++; if (!isKW(tk[p.i], 'SET')) throw new Error('UPDATE يحتاج SET'); p.i++;
    const sets = [];
    while (true) { const c = tk[p.i].v; p.i++; if (!tk[p.i] || tk[p.i].v !== '=') throw new Error('SET يحتاج col = val'); p.i++; const e = parseExpr(tk, p); sets.push([c, e]); if (tk[p.i] && tk[p.i].k === ',') { p.i++; continue; } break; }
    let where = null; if (isKW(tk[p.i], 'WHERE')) { p.i++; where = parseCond(tk, p); }
    return { update: { t, sets, where } };
  }
  if (isKW(tk[0], 'DELETE')) {
    p.i++; if (!isKW(tk[p.i], 'FROM')) throw new Error('DELETE يحتاج FROM'); p.i++;
    const t = tk[p.i].v; p.i++; let where = null;
    if (isKW(tk[p.i], 'WHERE')) { p.i++; where = parseCond(tk, p); }
    return { delete: { t, where } };
  }
  throw new Error('استعلام غير مدعوم — المدعوم: SELECT / UPDATE / DELETE');
}

/* ====== التنفيذ ====== */
const bare = c => c.includes('.') ? c.split('.').pop() : c;
const AGG = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
function rowGet(row, col) {
  const b = bare(col);
  if (col.includes('.')) { const [a, n] = col.split('.'); if (row[a + '.' + n] !== undefined) return row[a + '.' + n]; }
  if (row[col] !== undefined) return row[col];
  if (row[b] !== undefined) return row[b];
  const k = Object.keys(row).find(k => bare(k) === b);
  return k !== undefined ? row[k] : undefined;
}
function evalE(e, row, db) {
  if (e.lit !== undefined) return e.lit;
  if (e.col) return rowGet(row, e.col);
  if (e.sub) { const r = execSelect(e.sub, db); const c = Object.keys(r[0] || { v: 1 })[0]; return r.map(x => x[c]); }
  if (e.fn) {
    const v = rowGet(row, e.arg === '*' ? '*' : e.arg);
    if (e.fn === 'COUNT') return undefined; /* تُعالج في groupProj */
    return v;
  }
  return undefined;
}
function cmpOp(l, op, r) {
  switch (op) { case '=': return l === r || String(l) === String(r); case '!=': case '<>': return !(l === r || String(l) === String(r)); case '<': return l < r; case '>': return l > r; case '<=': return l <= r; case '>=': return l >= r; default: throw new Error('معامل غير مدعوم ' + op); }
}
function evalCond(c, row, db) {
  if (c.and) return evalCond(c.and[0], row, db) && evalCond(c.and[1], row, db);
  if (c.or) return evalCond(c.or[0], row, db) || evalCond(c.or[1], row, db);
  if (c.in) { const l = evalE(c.in[0], row, db); const r = execSelect(c.in[1], db); const col = Object.keys(r[0] || { v: 1 })[0]; return r.some(x => cmpOp(l, '=', x[col])); }
  const l = evalE(c.cmp[0], row, db), r = evalE(c.cmp[2], row, db);
  return cmpOp(l, c.cmp[1], r);
}
function aggVal(fn, arg, rows, db) {
  const vals = arg === '*' ? rows : rows.map(r => evalE({ col: arg }, r, db)).filter(v => v !== undefined);
  switch (fn) {
    case 'COUNT': return arg === '*' ? rows.length : vals.length;
    case 'SUM': return vals.reduce((a, b) => a + (+b || 0), 0);
    case 'AVG': return vals.length ? vals.reduce((a, b) => a + (+b || 0), 0) / vals.length : null;
    case 'MIN': return vals.length ? Math.min(...vals) : null;
    case 'MAX': return vals.length ? Math.max(...vals) : null;
    default: throw new Error('دالة غير مدعومة ' + fn);
  }
}
function execSelect(q, db) {
  if (!db[q.from.t]) throw new Error('جدول غير موجود: ' + q.from.t);
  const aName = q.from.a || q.from.t;
  let rows = db[q.from.t].map(r => { const o = {}; for (const k in r) { o[k] = r[k]; o[aName + '.' + k] = r[k]; } return o; });
  for (const j of q.joins) {
    if (!db[j.t]) throw new Error('جدول غير موجود: ' + j.t);
    const jn = j.a || j.t;
    const jr = db[j.t].map(r => { const o = {}; for (const k in r) o[jn + '.' + k] = r[k]; return o; });
    const out = [];
    for (const r1 of rows) for (const r2 of jr) {
      const m = Object.assign({}, r1);
      for (const k in r2) if (m[k] === undefined) m[k] = r2[k];
      if (evalE({ col: j.on[0] }, m, db) === evalE({ col: j.on[1] }, m, db)) out.push(m);
    }
    rows = out;
  }
  if (q.where) rows = rows.filter(r => evalCond(q.where, r, db));
  const hasAgg = q.cols.some(c => c.e.fn);
  let out;
  if (q.group || hasAgg) {
    const gcols = q.group || [];
    const groups = {};
    for (const r of rows) { const key = gcols.map(c => rowGet(r, c)).join(''); (groups[key] = groups[key] || []).push(r); }
    out = Object.values(groups).map(grs => {
      const o = {};
      q.cols.forEach(c => {
        const name = c.alias || (c.e.fn ? c.e.fn + '(' + c.e.arg + ')' : bare(c.e.col));
        if (c.e.fn) o[name] = aggVal(c.e.fn, c.e.arg, grs, db);
        else o[name] = rowGet(grs[0], c.e.col);
      });
      o.__g = grs;
      return o;
    });
    if (q.having) out = out.filter(o => {
      const h = c => {
        if (c.and) return h(c.and[0]) && h(c.and[1]);
        if (c.or) return h(c.or[0]) || h(c.or[1]);
        const val = x => {
          if (x.lit !== undefined) return x.lit;
          if (x.fn) return aggVal(x.fn, x.arg, o.__g, db);
          return o[x.col] !== undefined ? o[x.col] : o[bare(x.col)];
        };
        if (c.in) throw new Error('IN في HAVING غير مدعوم');
        return cmpOp(val(c.cmp[0]), c.cmp[1], val(c.cmp[2]));
      };
      return h(q.having);
    });
  } else {
    out = rows.map(r => {
      if (q.cols.length === 1 && q.cols[0].e.col === '*') { const o = {}; for (const k in r) if (!k.includes('.')) o[k] = r[k]; return o; }
      const o = {};
      q.cols.forEach(c => { const name = c.alias || bare(c.e.col || c.e.fn + '()'); o[name] = c.e.fn ? evalE(c.e, r, db) : rowGet(r, c.e.col); });
      return o;
    });
  }
  if (q.order) {
    const { c, d } = q.order;
    out = out.slice().sort((x, y) => {
      const a = rowGet(x, c) !== undefined ? rowGet(x, c) : x[c], b = rowGet(y, c) !== undefined ? rowGet(y, c) : y[c];
      return (a < b ? -1 : a > b ? 1 : 0) * d;
    });
  }
  if (q.limit != null) out = out.slice(0, q.limit);
  return out.map(o => { const r = Object.assign({}, o); delete r.__g; return r; });
}
function exec(ast, db) {
  if (ast.select) return { rows: execSelect(ast.select, db) };
  if (ast.update) {
    const t = db[ast.update.t]; if (!t) throw new Error('جدول غير موجود: ' + ast.update.t);
    let n = 0;
    t.forEach(r => { if (!ast.update.where || evalCond(ast.update.where, r, db)) { ast.update.sets.forEach(([c, e]) => { r[bare(c)] = evalE(e, r, db); }); n++; } });
    return { msg: n + ' صفاً حُدّث' };
  }
  if (ast.delete) {
    const t = db[ast.delete.t]; if (!t) throw new Error('جدول غير موجود: ' + ast.delete.t);
    const keep = t.filter(r => !(ast.delete.where ? evalCond(ast.delete.where, r, db) : true));
    const n = t.length - keep.length; db[ast.delete.t] = keep;
    return { msg: n + ' صفاً حُذف' };
  }
  throw new Error('؟');
}

/* ====== مقارنة ====== */
const rowSig = r => JSON.stringify(Object.keys(r).sort().map(k => [k, r[k]]));
function eqSet(a, b) {
  if (a.length !== b.length) return false;
  const sa = a.map(rowSig).sort(), sb = b.map(rowSig).sort();
  return sa.every((x, i) => x === sb[i]);
}

/* ====== المهام ====== */
const TASKS = [
  { id: 'sel1', t: 'كل الطلاب', d: 'أعِد كل أعمدة جدول students.',
    sol: 'SELECT * FROM students',
    hints: ['جملتان: SELECT ثم FROM', '* تعني كل الأعمدة', 'SELECT * FROM students'], cat: 'SELECT' },
  { id: 'wh1', t: 'من فوق 20', d: 'أسماء وأعمار الطلاب الأكبر من 20 سنة.',
    sol: 'SELECT name, age FROM students WHERE age > 20',
    hints: ['WHERE يفلتر الصفوف', 'المقارنة بـ>', "SELECT name, age FROM students WHERE age > 20"], cat: 'WHERE' },
  { id: 'ord1', t: 'أهل الرياض ترتيباً', d: 'أسماء طلاب الرياض مرتبة أبجدياً.',
    sol: "SELECT name FROM students WHERE city = 'الرياض' ORDER BY name",
    hints: ['النصوص بين علامتي اقتباس مفردة', 'ORDER BY col للترتيب تصاعدياً', "SELECT name FROM students WHERE city='الرياض' ORDER BY name"], cat: 'ORDER' },
  { id: 'lim1', t: 'أول 5 مقررات', d: 'أول خمسة صفوف من courses مرتبة بالمعرّف.',
    sol: 'SELECT * FROM courses ORDER BY id LIMIT 5',
    hints: ['LIMIT n يقص النتيجة', 'رتّب بـid أولاً', 'SELECT * FROM courses ORDER BY id LIMIT 5'], cat: 'ORDER' },
  { id: 'jn1', t: 'أسماء ودرجات', d: 'اسم كل طالب مع درجة كل تسجيله (JOIN students × enrollments).',
    sol: 'SELECT s.name, e.grade FROM students s JOIN enrollments e ON s.id = e.student_id ORDER BY s.name',
    hints: ['JOIN t2 ON شرط الربط', 'الأسماء المستعارة: FROM students s JOIN enrollments e', 'SELECT s.name, e.grade FROM students s JOIN enrollments e ON s.id = e.student_id ORDER BY s.name'], cat: 'JOIN' },
  { id: 'grp1', t: 'طلاب كل مدينة', d: 'عدد الطلاب في كل مدينة مرتبة تنازلياً.',
    sol: 'SELECT city, COUNT(*) AS n FROM students GROUP BY city ORDER BY n DESC',
    hints: ['GROUP BY يجمع الصفوف المتشابهة', 'COUNT(*) يعد صفوف كل مجموعة + AS اسم للعمود', 'SELECT city, COUNT(*) AS n FROM students GROUP BY city ORDER BY n DESC'], cat: 'GROUP' },
  { id: 'hv1', t: 'مدن فوق طالبين', d: 'المدن التي فيها أكثر من طالبين مع عددهم.',
    sol: 'SELECT city, COUNT(*) AS n FROM students GROUP BY city HAVING n > 2',
    hints: ['HAVING يفلتر المجموعات (WHERE للصفوف)', 'يمكن استعمال اسم العمود n في HAVING', 'SELECT city, COUNT(*) AS n FROM students GROUP BY city HAVING n > 2'], cat: 'HAVING' },
  { id: 'sub1', t: 'المتفوقون', d: 'أسماء الطلاب الذين لديهم درجة فوق 85 في أي تسجيل (استعلام داخلي).',
    sol: 'SELECT name FROM students WHERE id IN (SELECT student_id FROM enrollments WHERE grade > 85)',
    hints: ['IN (SELECT…) تفحص العضوية', 'الداخلي يجمع student_id لدرجات >85', 'SELECT name FROM students WHERE id IN (SELECT student_id FROM enrollments WHERE grade > 85)'], cat: 'SUB' },
  { id: 'upd1', t: 'تعديل عمر', d: "اجعل عمر 'نورة' 21 سنة (UPDATE). تحققنا بـSELECT age.",
    sol: "UPDATE students SET age = 21 WHERE name = 'نورة'",
    check: "SELECT name, age FROM students WHERE name = 'نورة'",
    hints: ['UPDATE t SET col = val', 'لا تنسَ WHERE وإلا عدّلت الكل!', "UPDATE students SET age = 21 WHERE name = 'نورة'"], cat: 'UPDATE' },
  { id: 'del1', t: 'تنظيف الراسبين', d: 'احذف تسجيلات درجاتها دون 60 (DELETE). تحققنا بعدّ المتبقي.',
    sol: 'DELETE FROM enrollments WHERE grade < 60',
    check: 'SELECT COUNT(*) AS n FROM enrollments',
    hints: ['DELETE FROM t WHERE شرط', 'الشرط grade < 60', 'DELETE FROM enrollments WHERE grade < 60'], cat: 'DELETE' },
];

let cur = 0, hintIdx = 0;
const done = () => TASKS.filter(t => st[t.id] && st[t.id].ok).length;
function head() { $('#sqCount').textContent = `${done()}/${TASKS.length}`; $('#sqBar').style.width = done() / TASKS.length * 100 + '%'; }

function tableHTML(name) {
  const rows = DB[name];
  const cols = Object.keys(rows[0]);
  return `<div class="sq-t"><div class="sq-tname" dir="ltr">${name}</div><table><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${r[c]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function resTable(rows) {
  if (!rows.length) return '<div class="sq-empty">(لا صفوف)</div>';
  const cols = Object.keys(rows[0]);
  return `<div class="sq-t"><table><thead><tr>${cols.map(c => `<th dir="ltr">${escH(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td dir="ltr">${r[c] === undefined ? '—' : escH(String(r[c]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function list() {
  $('#sqList').innerHTML = TASKS.map((t, i) => `<button class="lb-item${i === cur ? ' on' : ''}" data-i="${i}">
    <span class="lb-n">${i + 1}</span><span class="lb-t2">${escH(t.t)}</span><span class="lb-cat2">${t.cat}</span>${st[t.id] && st[t.id].ok ? '<span class="lb-ok">✓</span>' : ''}
  </button>`).join('');
  $('#sqList').querySelectorAll('button').forEach(b => b.onclick = () => { cur = +b.dataset.i; hintIdx = 0; DB = cloneDB(); list(); render(); });
}

function render() {
  const t = TASKS[cur], rec = st[t.id];
  if (!DB) DB = cloneDB();
  $('#sqMain').innerHTML = `
    <div class="lb-head">
      <span class="lb-idx">${cur + 1}/${TASKS.length}</span>
      <span class="lb-cat-tag">${t.cat}</span>
      <h2 class="lb-t">${rec && rec.ok ? '✅' : '💾'} ${escH(t.t)}</h2>
      <div class="lb-d">${escH(t.d)}</div>
    </div>
    <div class="sq-tables">${['students', 'courses', 'enrollments'].map(tableHTML).join('')}</div>
    <textarea id="sqIn" class="sq-in" dir="ltr" rows="3" spellcheck="false" placeholder="SELECT ...">${escH('')}</textarea>
    <div class="sq-btns">
      <button class="btn" id="sqRun">▶ نفّذ</button>
      <button class="btn ghost sm" id="sqReset">↺ أعد القاعدة</button>
      <button class="btn ghost sm" id="sqHint">💡 تلميح</button>
      <button class="btn ghost sm" id="sqSol">الحل</button>
    </div>
    <div id="sqMsg"></div>
    <div id="sqOut"></div>
    <div id="sqHintBox"></div>`;
  $('#sqReset').onclick = () => { DB = cloneDB(); $('#sqMsg').innerHTML = '<div class="sq-note">↺ أُعيدت القاعدة لحالتها الأولى</div>'; };
  $('#sqHint').onclick = () => {
    const h = t.hints[Math.min(hintIdx, t.hints.length - 1)];
    hintIdx = Math.min(hintIdx + 1, t.hints.length);
    $('#sqHintBox').innerHTML = `<div class="dh-why" style="margin-top:10px"><b>تلميح ${hintIdx}/${t.hints.length}:</b> <code dir="ltr">${escH(h)}</code></div>`;
  };
  $('#sqSol').onclick = () => { $('#sqIn').value = t.sol; $('#sqHintBox').innerHTML = `<div class="dh-why" style="margin-top:10px"><b>الحل:</b> <code dir="ltr" class="rx-solc">${escH(t.sol)}</code> — شغّله لترى النتيجة.</div>`; };
  $('#sqRun').onclick = () => run(t);
}

function run(t) {
  const sql = $('#sqIn').value.trim();
  const rec = st[t.id] = st[t.id] || { ok: false, tries: 0 };
  try {
    const r = exec(parse(sql), DB);
    let expected, got;
    if (t.check) {
      const d2 = cloneDB(); exec(parse(t.sol), d2); expected = exec(parse(t.check), d2).rows;
      got = exec(parse(t.check), DB).rows;
    } else {
      expected = exec(parse(t.sol), cloneDB()).rows;
      got = r.rows || [];
    }
    const ok = eqSet(got, expected);
    rec.tries++; rec.ok = rec.ok || ok; save(); head(); list();
    $('#sqMsg').innerHTML = ok
      ? '<div class="pn-ok">✓ صحيح — نتيجتك تطابق المتوقع تماماً</div>'
      : '<div class="pn-bad">✗ نتيجتك لا تطابق المتوقع — قارن الجدولين</div>';
    $('#sqOut').innerHTML = `
      ${r.msg ? `<div class="sq-note">${r.msg}</div>` : ''}
      <div class="sq-cmp"><div><div class="sq-cap">نتيجتك (${got.length})</div>${resTable(got)}</div>
      <div><div class="sq-cap">المتوقع (${expected.length})</div>${resTable(expected)}</div></div>`;
    if (ok) { const h2 = $('#sqMain').querySelector('.lb-t'); if (h2) h2.innerHTML = `✅ ${escH(t.t)}`; }
  } catch (e) {
    rec.tries++; save();
    $('#sqMsg').innerHTML = `<div class="pn-bad">⚠ ${escH(e.message)}</div>`;
    $('#sqOut').innerHTML = '';
  }
}

DB = cloneDB(); head(); list(); render();
})();
