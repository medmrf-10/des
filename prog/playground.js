/* برمج — المُنشِئ: محرر HTML/CSS/JS ← معاينة iframe حية + أمثلة + حفظ prog_lab + مشاركة مشفّرة */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const read = k => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
let lab = read('prog_lab');
const saveLab = () => localStorage.setItem('prog_lab', JSON.stringify(lab));
const pgKey = n => 'pg:' + n;
const snippets = () => Object.keys(lab).filter(k => k.startsWith('pg:')).map(k => ({ n: k.slice(3), ...lab[k] }));

const EXAMPLES = [
  { n: 'بطاقة HTML/CSS', t: 'web', h: '<h2>مرحباً</h2>\n<p class="card">بطاقة منسّقة بـCSS</p>\n<button>زر</button>', c: 'body{font-family:sans-serif;background:#0f1424;color:#eee;padding:20px}\n.card{background:#1a2340;border:1px solid gold;border-radius:12px;padding:14px}\nbutton{background:gold;border:none;padding:8px 18px;border-radius:8px}', j: '' },
  { n: 'عدّاد JS', t: 'js', h: '<h1 id="c">0</h1>\n<button onclick="up(1)">+</button> <button onclick="up(-1)">−</button>', c: 'body{text-align:center;padding-top:40px;font-family:sans-serif;background:#0f1424;color:gold}\nh1{font-size:4rem;margin:0}', j: 'let n = 0;\nwindow.up = d => { n += d; document.getElementById("c").textContent = n; console.log("العدّ:", n); };' },
  { n: 'تفويض أحداث', t: 'jsm', h: '<ul id="list"><li>أول</li><li>ثاني</li><li>ثالث</li></ul>', c: 'body{font-family:sans-serif;background:#0f1424;color:#eee}\nli{cursor:pointer;padding:6px}\nli:hover{color:gold}', j: 'document.getElementById("list").addEventListener("click", e => {\n  if (e.target.tagName === "LI") console.log("نقرت:", e.target.textContent);\n});' },
  { n: 'fetch محاكى', t: 'jsm', h: '<div id="out">اضغط لجلب بيانات…</div>\n<button id="b">اجلب</button>', c: '#out{background:#1a2340;padding:14px;border-radius:10px;color:#eee;font-family:sans-serif}\nbutton{margin-top:10px;padding:8px 18px;background:gold;border:none;border-radius:8px}', j: 'const fakeFetch = () => new Promise(r => setTimeout(() => r([{n:"أحمد"},{n:"سارة"}]), 600));\ndocument.getElementById("b").onclick = async () => {\n  const data = await fakeFetch();\n  document.getElementById("out").innerHTML = data.map(u => u.n).join("، ");\n  console.log("وصل:", data.length, "مستخدم");\n};' },
  { n: 'للغة بايثون', t: 'py', h: '<p>بايثون يعمل في «المختبر» عبر Pyodide ← <a href="lab.html" style="color:gold">افتحه</a></p>', c: 'body{font-family:sans-serif;background:#0f1424;color:#eee;padding:20px}', j: '' },
];

/* أمثلة */
$('#pgEx').innerHTML = 'أمثلة: ' + EXAMPLES.map((x, i) =>
  `<button class="ptab" data-e="${i}">${escH(x.n)}</button>`).join('');
$('#pgEx').addEventListener('click', e => {
  const b = e.target.closest('[data-e]'); if (!b) return;
  const x = EXAMPLES[+b.dataset.e];
  $('#pgH').value = x.h; $('#pgC').value = x.c; $('#pgJ').value = x.j;
  $('#pgName').value = x.n;
  run();
});

/* تشغيل */
function run() {
  const doc = `<!DOCTYPE html><html><head><style>${$('#pgC').value}</style></head><body>${$('#pgH').value}<script>
    const send=(t,a)=>parent.postMessage({pg:1,t,a},"*");
    console.log=(...a)=>send('log',a.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(' '));
    window.onerror=(m,s,l)=>send('err',m+' (سطر '+l+')');
    try{${$('#pgJ').value}\n}catch(e){send('err',e.message)}
  </${'script'}></body></html>`;
  $('#pgLog').textContent = '';
  $('#pgFrame').srcdoc = doc;
}
window.addEventListener('message', e => {
  if (!e.data || !e.data.pg) return;
  $('#pgLog').textContent += (e.data.t === 'err' ? '❌ ' : '') + e.data.a + '\n';
});
$('#pgRun').onclick = run;
[$('#pgH'), $('#pgC'), $('#pgJ')].forEach(t => t.addEventListener('input', () => {
  clearTimeout(t._d); t._d = setTimeout(run, 700);
}));

/* حفظ */
function renderSaved() {
  const ss = snippets();
  $('#pgSaved').innerHTML = ss.length ? 'محفوظاتك: ' + ss.map(s =>
    `<button class="ptab" data-n="${escH(s.n)}">${escH(s.n)}</button>`).join('') : '';
  $('#pgSaved').querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
    const s = lab[pgKey(b.dataset.n)];
    $('#pgH').value = s.h; $('#pgC').value = s.c; $('#pgJ').value = s.j;
    $('#pgName').value = b.dataset.n;
    run();
  });
}
$('#pgSave').onclick = () => {
  const n = $('#pgName').value.trim() || ('تجربة-' + (snippets().length + 1));
  lab[pgKey(n)] = { h: $('#pgH').value, c: $('#pgC').value, j: $('#pgJ').value, at: Date.now() };
  saveLab(); renderSaved();
  const b = $('#pgSave'); b.textContent = 'حُفظ ✓'; setTimeout(() => b.textContent = 'احفظ', 1200);
};

/* مشاركة مشفّرة */
$('#pgShare').onclick = () => {
  const data = { n: $('#pgName').value.trim(), h: $('#pgH').value, c: $('#pgC').value, j: $('#pgJ').value };
  const enc = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  const url = location.origin + location.pathname + '#s=' + enc;
  (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(
    () => { const b = $('#pgShare'); b.textContent = 'نُسخ الرابط ✓'; setTimeout(() => b.textContent = 'شارك', 1500); },
    () => prompt('انسخ الرابط:', url));
};

/* تحميل من رابط مشاركة */
if (location.hash.startsWith('#s=')) {
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(3)))));
    $('#pgH').value = d.h || ''; $('#pgC').value = d.c || ''; $('#pgJ').value = d.j || '';
    $('#pgName').value = d.n || '';
  } catch (e) { /* تجاهل */ }
}
renderSaved();
if ($('#pgH').value || $('#pgJ').value) run();
})();
