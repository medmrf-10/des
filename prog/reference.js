/* برمج — المرجِع: خوارزميات وهياكل — بحث فوري + نسخ كود + تعلّم prog_ref */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let refState = {};
try { refState = JSON.parse(localStorage.getItem('prog_ref') || '{}') || {}; } catch (e) { refState = {}; }
const save = () => localStorage.setItem('prog_ref', JSON.stringify(refState));

/* {name, def, code, o (time), os (space), when, cat} */
const ALGOS = [
  { id: 'binary', cat: 'بحث', name: 'البحث الثنائي Binary Search', o: 'O(log n)', os: 'O(1)',
    def: 'يشقّ مصفوفة مرتّبة نصفين كل خطوة حتى يجد الهدف — أسرع بحث على بيانات مرتّبة.',
    when: 'مصفوفة مرتّبة أو إجابة أحادية التغير (أصغر x يحقق شرطاً).',
    code: `function binarySearch(arr, x) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] === x) return mid;
    arr[mid] < x ? lo = mid + 1 : hi = mid - 1;
  }
  return -1;
}` },
  { id: 'two', cat: 'تقنيات', name: 'المؤشران Two Pointers', o: 'O(n)', os: 'O(1)',
    def: 'مؤشران من الطرفين يتحركان نحو الوسط لحل مسائل الأزواج والانعكاس على مرتّبة.',
    when: 'أزواج مجموعها هدف، انعكاس في المكان، palindrome.',
    code: `function hasPair(arr, sum) { // arr مرتّبة
  let l = 0, r = arr.length - 1;
  while (l < r) {
    const s = arr[l] + arr[r];
    if (s === sum) return true;
    s < sum ? l++ : r--;
  }
  return false;
}` },
  { id: 'sliding', cat: 'تقنيات', name: 'النافذة المنزلقة Sliding Window', o: 'O(n)', os: 'O(1)',
    def: 'نافذة [l..r] تنمو وتنكمش على مصفوفة لحساب أفضل مقطع متصل دون إعادة المسح.',
    when: 'أطول/أقصر سلسلة متصلة تحقق شرطاً (مجموع، عدد حروف مميزة).',
    code: `function maxSubLen(s) { // أطول سلسلة بلا تكرار
  const seen = new Set(); let l = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    while (seen.has(s[r])) seen.delete(s[l++]);
    seen.add(s[r]);
    best = Math.max(best, r - l + 1);
  }
  return best;
}` },
  { id: 'sort', cat: 'ترتيب', name: 'الترتيب السريع Quicksort', o: 'O(n log n)', os: 'O(log n)',
    def: 'يختار محوراً ويقسم المصفوفة أصغر/أكبر منه ثم يرتّب كل جزء بازدجائياً.',
    when: 'الترتيب العام الافتراضي؛ أسوأ حالة O(n²) بمحور سيئ.',
    code: `function qsort(a) {
  if (a.length <= 1) return a;
  const p = a[a.length >> 1];
  return [...qsort(a.filter(x => x < p)),
          ...a.filter(x => x === p),
          ...qsort(a.filter(x => x > p))];
}` },
  { id: 'merge', cat: 'ترتيب', name: 'الترتيب بالدمج Merge Sort', o: 'O(n log n)', os: 'O(n)',
    def: 'يقسم النصفين ثم يدمجهما مرتّبين — مستقر وضمان زمني ثابت حتى في أسوأ حالة.',
    when: 'ترتيب مستقر أو قوائم مربوطة أو عند ضرورة ضمان O(n log n).',
    code: `function msort(a) {
  if (a.length <= 1) return a;
  const m = a.length >> 1;
  const L = msort(a.slice(0, m)), R = msort(a.slice(m));
  const out = []; let i = 0, j = 0;
  while (i < L.length && j < R.length)
    out.push(L[i] <= R[j] ? L[i++] : R[j++]);
  return out.concat(L.slice(i), R.slice(j));
}` },
  { id: 'stack', cat: 'هياكل', name: 'المكدس Stack', o: 'O(1) push/pop', os: 'O(n)',
    def: 'آخر داخل أول خارج — عزل العمليات المتداخلة: أقواس متوازنة، تراجع، DFS.',
    when: 'أقواس متوازنة، undo، تقييم تعابير، جرد مسارات.',
    code: `const st = [];
st.push(x);   // أدخل
const top = st.pop(); // أخرج الأخير
// أقواس متوازنة:
const ok = s => {
  const st = [], m = { ')': '(', ']': '[', '}': '{' };
  for (const c of s) {
    if ('([{'.includes(c)) st.push(c);
    else if (')]}'.includes(c) && st.pop() !== m[c]) return false;
  }
  return !st.length;
};` },
  { id: 'queue', cat: 'هياكل', name: 'الطابور Queue', o: 'O(1) enqueue/dequeue', os: 'O(n)',
    def: 'أول داخل أول خارج — معالجة بالدور: جدولة مهام، BFS، رسائل.',
    when: 'BFS على شجرة/رسم، ترتيب معالجة، بفّر.',
    code: `const q = [];
q.push(x);          // أدخل من الخلف
const next = q.shift(); // أخرج الأمام (O(n) — للكبير استعمل مؤشراً)
// طابور سريع برأسين:
class Queue {
  constructor() { this.a = []; this.b = []; }
  push(x) { this.a.push(x); }
  pop() {
    if (!this.b.length)
      while (this.a.length) this.b.push(this.a.pop());
    return this.b.pop();
  }
}` },
  { id: 'hash', cat: 'هياكل', name: 'جدول الهاش Hash Map', o: 'O(1) متوسط', os: 'O(n)',
    def: 'مفتاح→قيمة بالوصول شبه الفوري عبر دالة بعثرة — أساس العدّ والفهرسة والكاش.',
    when: 'عدّ تكرارات، بحث سريع، تفادي duplicates، memoization.',
    code: `const cnt = {};
for (const ch of 'aabbc') cnt[ch] = (cnt[ch] || 0) + 1;
// أول غير مكرر:
const first = s => Object.entries(
  [...s].reduce((m, c) => (m[c] = (m[c] || 0) + 1, m), {})
).find(([, v]) => v === 1)?.[0];` },
  { id: 'll', cat: 'هياكل', name: 'القائمة المربوطة Linked List', o: 'O(1) إدخال رأس، O(n) بحث', os: 'O(n)',
    def: 'عقد كلٌّ منها يشير للتالي — إدخال وحذف ثابت عند معرفة الموضع، بلا عنونة عشوائية.',
    when: 'نادراً في JS (المصفوفة أغلبها أحسن) — شائعة في المقابلات وLRU.',
    code: `const node = (v, next = null) => ({ v, next });
// انعكاس:
function rev(head) {
  let prev = null, cur = head;
  while (cur) { [cur.next, prev, cur] = [prev, cur, cur.next]; }
  return prev;
}` },
  { id: 'bfs', cat: 'اجتياز', name: 'البحث بالعرض BFS', o: 'O(V+E)', os: 'O(V)',
    def: 'يزور المستوى كاملاً قبل التالي — يجد أقصر مسار في رسم غير موزون.',
    when: 'أقصر مسار، أقرب عقدة، انتشار مستوى-بمستوى.',
    code: `function bfs(adj, start) {
  const seen = new Set([start]), q = [start], order = [];
  while (q.length) {
    const v = q.shift();
    order.push(v);
    for (const w of adj[v] || [])
      if (!seen.has(w)) { seen.add(w); q.push(w); }
  }
  return order;
}` },
  { id: 'dfs', cat: 'اجتياز', name: 'البحث بالعمق DFS', o: 'O(V+E)', os: 'O(V)',
    def: 'يتعمق فرعاً إلى آخره ثم يرجع — اجتياز الشجر والشبكات وكشف الدورات.',
    when: 'اجتياز شجرة، مسارات كلها، topology، مكوّنات.',
    code: `function dfs(adj, v, seen = new Set()) {
  if (seen.has(v)) return;
  seen.add(v);
  console.log(v);
  for (const w of adj[v] || []) dfs(adj, w, seen);
}` },
  { id: 'dp', cat: 'تقنيات', name: 'البرمجة الديناميكية DP', o: 'متغير', os: 'متغير',
    def: 'تقسيم المسألة لمسائل جزئية متكررة مع تخزين نتائجها (memo/tabulation).',
    when: 'أمثلة/عدّ طرق مع تداخل — fibonacci، knapsack، LCS.',
    code: `// فيبوناتشي بجدولة تصاعدية O(n):
function fib(n) {
  const dp = [0, 1];
  for (let i = 2; i <= n; i++) dp[i] = dp[i-1] + dp[i-2];
  return dp[n];
}` },
  { id: 'greedy', cat: 'تقنيات', name: 'الجشع Greedy', o: 'O(n log n) غالباً', os: 'O(1)',
    def: 'يأخذ أفضل خيار محلي كل خطوة — صحيح فقط حين يُثبت الاختيار الجشع.',
    when: 'جدولة أقصى عدد أعمال غير متداخلة، عملات، حفر huffman.',
    code: `// أقصى عدد اجتماعات غير متداخلة:
function maxMeetings(ms) { // ms: [[start,end]]
  ms.sort((a, b) => a[1] - b[1]);
  let end = -1, n = 0;
  for (const [s, e] of ms) if (s >= end) { n++; end = e; }
  return n;
}` },
  { id: 'heap', cat: 'هياكل', name: 'الكومة Min-Heap', o: 'O(log n) إدخال/إخراج', os: 'O(n)',
    def: 'شجرة ثنائية ناقصة تبقي الأصغر على القمة — طابور أولويات.',
    when: 'أكبر/أصغر K عناصر، وسيط جارٍ، دمج قوائم مرتّبة.',
    code: `// JS بلا مكتبة — كومة صغرى مبسطة:
const h = [];
const push = x => { h.push(x); let i = h.length - 1;
  while (i > 0 && h[(i - 1) >> 1] > x) { [h[i], h[(i - 1) >> 1]] = [h[(i - 1) >> 1], x]; i = (i - 1) >> 1; } };
const top = () => h[0];
push(3); push(1); push(2); // top() === 1` },
  { id: 'rec', cat: 'تقنيات', name: 'التكرار مع التخزين Memoization', o: 'يحوّل أسّياً→كثيراً', os: 'O(n) كاش',
    def: 'دالة تكرارية تخزّن نتائج مدخلاتها في Map فلا تعيد حسابها.',
    when: 'تكرار أعمى ينفجر أعداداً — أضف كاشاً لأرقام fibonacci/طرق التسلق.',
    code: `function memoize(fn) {
  const c = new Map();
  return x => c.has(x) ? c.get(x) : (c.set(x, fn(x)), c.get(x));
}
let fib;
fib = memoize(n => n < 2 ? n : fib(n-1) + fib(n-2));` },
];

const CATS = ['الكل', ...new Set(ALGOS.map(a => a.cat))];
let cat = 'الكل', q = '';

function list() {
  const items = ALGOS.filter(a =>
    (cat === 'الكل' || a.cat === cat) &&
    (!q || (a.name + a.def + a.code + a.cat).toLowerCase().includes(q)));
  const done = ALGOS.filter(a => refState[a.id]).length;
  $('#rfStat').textContent = `أتقنت ${done}/${ALGOS.length} • يُعرض ${items.length}`;
  $('#rfList').innerHTML = items.map(a => `
    <article class="rf-card" data-id="${a.id}">
      <div class="rf-card-h">
        <div>
          <span class="rf-cat-tag">${escH(a.cat)}</span>
          <h3 class="rf-name">${escH(a.name)}</h3>
        </div>
        <div class="rf-big" dir="ltr" title="الزمن/المساحة">${escH(a.o)} <span class="rf-big-s">${escH(a.os)}</span></div>
      </div>
      <p class="rf-def">${escH(a.def)}</p>
      <p class="rf-when"><b>متى يُستخدم؟</b> ${escH(a.when)}</p>
      <div class="rf-code-wrap">
        <button class="rf-copy" data-id="${a.id}">نسخ ⧉</button>
        <pre class="rf-code" dir="ltr"><code>${escH(a.code)}</code></pre>
      </div>
      <button class="rf-learn ${refState[a.id] ? 'done' : ''}" data-id="${a.id}">${refState[a.id] ? '✓ أتقنته' : '○ أتقنته'}</button>
    </article>`).join('') || '<div class="rf-empty">لا نتائج مطابقة.</div>';
  $('#rfList').querySelectorAll('.rf-learn').forEach(b => b.onclick = () => {
    const id = b.dataset.id;
    refState[id] = !refState[id]; if (!refState[id]) delete refState[id];
    save(); list();
  });
  $('#rfList').querySelectorAll('.rf-copy').forEach(b => b.onclick = () => {
    const a = ALGOS.find(x => x.id === b.dataset.id);
    navigator.clipboard.writeText(a.code).then(() => { b.textContent = '✓ نُسخ'; setTimeout(() => b.textContent = 'نسخ ⧉', 1200); });
  });
}

$('#rfCats').innerHTML = CATS.map(c => `<button class="ptab ${c === 'الكل' ? 'on' : ''}" data-c="${escH(c)}">${escH(c)}</button>`).join('');
$('#rfCats').querySelectorAll('.ptab').forEach(b => b.onclick = () => {
  cat = b.dataset.c;
  $('#rfCats').querySelectorAll('.ptab').forEach(x => x.classList.toggle('on', x.dataset.c === cat));
  list();
});
$('#rfQ').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); list(); });
list();
})();
