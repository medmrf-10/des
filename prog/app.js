/* برمج — محرك المنصة: عرض، محرر حي (ويب + بايثون)، تصحيح تلقائي، بطاقات تثبيت، حفظ localStorage */
(function () {
'use strict';

const LS = 'prog_v1';
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* ---------- الحالة ---------- */
let state = { done: {}, drafts: {}, quiz: {} };
try { state = Object.assign(state, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) {}
if (!state.done) state.done = {};
if (!state.drafts) state.drafts = {};
if (!state.quiz) state.quiz = {};
if (!state.fc) state.fc = {};
if (!state.free) state.free = { html: '', css: '', js: '' };
function save() { localStorage.setItem(LS, JSON.stringify(state)); }

/* ربط بطاقات المفاهيم بكل درس من خريطة CARDS في data.js */
TRACKS.forEach(t => t.lessons.forEach(l => {
  l.cards = (typeof CARDS !== 'undefined' && CARDS[l.id]) || [];
}));

const totalLessons = TRACKS.reduce((n, t) => n + t.lessons.length, 0);
const doneCount = () => Object.keys(state.done).filter(k => state.done[k]).length;

let cur = { track: null, li: -1 }; // الدرس الحالي

/* ---------- المسارات ---------- */
function renderTracks() {
  $('#tracksList').innerHTML = TRACKS.map((t) => {
    const done = t.lessons.filter(l => state.done[l.id]).length;
    return `
    <div class="track" data-track="${t.id}">
      <div class="track-head">
        <div class="t-info">
          <h3>${t.name}</h3>
          <div class="t-desc">${t.desc}</div>
          <div class="track-bar"><i style="width:${Math.round(done / t.lessons.length * 100)}%"></i></div>
        </div>
        <div class="track-meta">
          <span class="t-count"><b>${done}</b>/${t.lessons.length}</span>
          <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </div>
      <div class="lessons">
        ${t.lessons.map((l, i) => {
          const qz = state.quiz[l.id];
          const sub = (state.done[l.id] ? 'مكتمل' : 'ابدأ') + (qz ? ` · مراجعة ${qz.best}/${(l.quiz || []).length}` : '');
          return `
          <div class="lesson ${state.done[l.id] ? 'done' : ''}" data-l="${i}">
            <div class="num">${state.done[l.id] ? '✓' : i + 1}</div>
            <div class="l-name">${l.t}</div>
            <div class="l-state">${sub}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');

  $('#tracksList').innerHTML += `
    <div class="track free-card" id="freeCard">
      <div class="track-head">
        <div class="t-info">
          <h3>مختبر حر</h3>
          <div class="t-desc">مساحة مفتوحة: اكتب HTML وCSS وJavaScript وشغّلها فوراً — بلا دروس ولا شروط.</div>
        </div>
        <div class="track-meta"><span class="t-count">افتح ←</span></div>
      </div>
    </div>
    <div class="track free-card courses-card" id="coursesCard">
      <div class="track-head">
        <div class="t-info">
          <h3>الكورسات</h3>
          <div class="t-desc">خارطة الدروس البرمجية الكاملة — مسارات وكورسات وفصول ودروس بعلامات إنجاز محفوظة.</div>
        </div>
        <div class="track-meta"><span class="t-count">افتح ←</span></div>
      </div>
    </div>`;
  $('#freeCard').onclick = openFree;
  $('#coursesCard').onclick = openCourses;

  $$('.track').forEach(el => {
    el.querySelector('.track-head').onclick = () => el.classList.toggle('open');
    el.querySelectorAll('.lesson').forEach(le => {
      le.onclick = (ev) => {
        ev.stopPropagation();
        openLesson(el.dataset.track, +le.dataset.l);
      };
    });
  });
  renderHeader();
}

function renderHeader() {
  $('#headerProg').innerHTML = `<b>${doneCount()}</b> / ${totalLessons} درساً`;
  $('#headerBar').style.width = (doneCount() / totalLessons * 100) + '%';
}

/* ---------- الدرس ---------- */
function getTrack(id) { return TRACKS.find(t => t.id === id); }
const isPy = () => cur.track && cur.track.lang === 'py';

function openLesson(trackId, li) {
  const t = getTrack(trackId);
  cur = { track: t, li };
  $('#coursesView').hidden = true;
  const L = t.lessons[li];

  $('#tracksView').hidden = true;
  $('#lessonView').hidden = false;
  $('#crumb').textContent = `${t.name} — الدرس ${li + 1}/${t.lessons.length}`;
  $('#lessonProg').textContent = state.done[L.id] ? '✓ مكتمل' : '';
  $('#lessonTitle').textContent = L.t;
  $('#lessonTheory').innerHTML = L.d;
  $('#lessonTip').hidden = !L.tip;
  $('#lessonTip').innerHTML = L.tip || '';
  $('#taskPrompt').innerHTML = L.task.p;
  $('#checkList').innerHTML = L.task.checks.map(c =>
    `<li><span class="dot"></span>${c.desc}</li>`).join('');
  $('#taskStatus').textContent = '';
  $('#taskStatus').className = '';
  $('#taskBadge').textContent = state.done[L.id] ? '✓' : '';
  $('#doneCard').hidden = true;
  $('#checkBar').hidden = true;

  setupLabMode();
  renderCards();
  renderQuiz();
  loadCode(L);
  window.scrollTo(0, 0);
}

/* ---------- المحرر والمعاينة ---------- */
const eds = { html: $('#ed_html'), css: $('#ed_css'), js: $('#ed_js'), py: $('#ed_py') };
let et = 'html';

/* وضع المختبر حسب لغة المسار */
function setupLabMode() {
  const py = isPy();
  $$('.etab[data-et]').forEach(b => b.hidden = py);
  $('#pyTag').hidden = !py;
  $('#pyBar').hidden = !py;
  eds.html.hidden = py || et !== 'html';
  eds.css.hidden = py || et !== 'css';
  eds.js.hidden = py || et !== 'js';
  eds.py.hidden = !py;
  $('#preview').hidden = py;
  $('.pvc').classList.toggle('py', py);
  $('#pvTitle').textContent = py ? 'المخرجات' : 'الناتج';
  const c = $('#conso');
  if (py) c.hidden = false; else { c.hidden = true; c.innerHTML = ''; }
}

function codeFor(L) { return (L.task.start) || L.ex; }

function loadCode(L) {
  const d = state.drafts[L.id];
  const src = d || codeFor(L);
  eds.html.value = src.html || '';
  eds.css.value = src.css || '';
  eds.js.value = src.js || '';
  eds.py.value = src.py || '';
  if (isPy()) { consoInfo('اكتب الكود ثم اضغط «تشغيل» — مفسّر بايثون يُحمَّل عند أول تشغيل.'); }
  else runPreview(false);
}

function saveDraft() {
  const L = cur.track.lessons[cur.li];
  state.drafts[L.id] = { html: eds.html.value, css: eds.css.value, js: eds.js.value, py: eds.py.value };
  save();
}

/* ---------- وحدة تحكم المخرجات ---------- */
function consoLine(s, cls, sel) {
  const c = $(sel || '#conso');
  c.hidden = false;
  const d = document.createElement('div');
  if (cls) d.className = cls;
  d.textContent = s;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}
function consoInfo(s) { consoLine(s, 'dim'); }
function consoErr(s) { consoLine('✗ ' + s, 'err'); }

/* ---------- رسائل خطأ عربية مبسطة ---------- */
function arErr(m) {
  m = String(m || '');
  let mm;
  if ((mm = m.match(/(?:Uncaught )?ReferenceError: (.+) is not defined/)) || (mm = m.match(/(.+) is not defined/)))
    return `الاسم «${mm[1]}» غير معرّف — عرّفه بـ let أو راجع إملاءه.`;
  if ((mm = m.match(/(.+) is not a function/)))
    return `«${mm[1]}» ليست دالة — تحقق من الاسم ومن نوع القيمة.`;
  if (/Unexpected token/.test(m))
    return 'خطأ في بناء الجملة — راجع الأقواس والفواصل وعلامات التنصيص.';
  if (/Unexpected end of input/.test(m))
    return 'انتهى الكود فجأة — غالباً قوس أو معقوفة غير مغلقة.';
  if (/Cannot read propert/.test(m))
    return 'تحاول قراءة خاصية من قيمة غير موجودة (undefined/null) — تأكد أن العنصر موجود.';
  if ((mm = m.match(/Identifier (.+) has already been declared/)))
    return `المعرّف «${mm[1]}» مُعرّف مسبقاً — استعمل اسماً آخر أو احذف التكرار.`;
  if (/Assignment to constant/.test(m))
    return 'لا يمكن تغيير قيمة ثابت const — استعمل let إن أردت تعديلها.';
  return m;
}
function arPyErr(trace) {
  const lines = String(trace || '').trim().split('\n');
  const last = lines[lines.length - 1] || '';
  let m;
  if ((m = last.match(/^SyntaxError/)))
    return 'خطأ في بناء الجملة — راجع النقطتين والأقواس وعلامات التنصيص.';
  if (/^IndentationError/.test(last) || /^TabError/.test(last))
    return 'خطأ في المسافة البادئة — استعمل 4 مسافات داخل الكتل (بعد النقطتين :).';
  if ((m = last.match(/^NameError: name '(.+)' is not defined/)))
    return `الاسم «${m[1]}» غير معرّف — عرّفه قبل استخدامه أو راجع إملاءه.`;
  if (/^ZeroDivisionError/.test(last))
    return 'قسمة على صفر — المقسوم عليه لا يمكن أن يكون صفراً.';
  if (/^TypeError/.test(last))
    return 'خطأ في نوع البيانات — مثلاً جمع نص مع عدد؛ حوّل بـ int() أو str().';
  if (/^ValueError/.test(last))
    return 'قيمة غير صالحة — مثلاً int("نص") لا يمكن تحويله لعدد.';
  if (/^IndexError/.test(last))
    return 'فهرس خارج نطاق القائمة — تذكر أن الفهارس تبدأ من 0.';
  if (/^KeyError/.test(last))
    return 'مفتاح غير موجود في القاموس.';
  if (/^EOFError/.test(last) || /stdin/.test(last))
    return 'input() لم تجد قيمة إدخال — اكتب قيمة في حقل «قيم input()» فوق المحرر.';
  return last;
}

/* ---------- بناء مستند المعاينة (ويب) ---------- */
function docFor(src, checks) {
  const srcs = JSON.stringify({ html: src.html, css: src.css, js: src.js });
  /* let/const → var ليصبحوا في النطاق العام داخل الـ sandbox — الشروط تقيّم liveness للمتغيرات */
  /* let/const → var ليصبحوا في النطاق العام داخل الـ sandbox — الشروط تقيّم liveness للمتغيرات.
     وحارس زمني __guard في رؤوس الحلقات ضد التجميد بسبب حلقة لا نهائية */
  const ujs = String(src.js || '')
    .replace(/(^|[\n;}])\s*(let|const)\s+/g, '$1var ')
    .replace(/for\s*\(\s*(let|const)\s+/g, 'for(var ')
    .replace(/\bfor\s*\(([^;{}]*);([^;{}]*);([^;{}]+)\)/g, 'for($1;$2;__guard(),$3)')
    .replace(/\b(while\s*\([^()]*\))\s*\{/g, '$1{ __guard(); ')
    .replace(/\bwhile\s*\(([^()]*)\)(?!\s*\{)/g, 'while(__guard(),($1)) ')
    .replace(/\bfor\s*\(([^;{}]*?(?:of|in)\s[^;{}]*)\)\s*\{/g, 'for($1){ __guard(); ')
    .replace(/\bdo\s*\{/g, 'do{ __guard(); ');
  const harness = checks ? `
<script>
var __SRC=${srcs};
/* تطبيع أي لون CSS (اسم/hex/rgb/hsl) إلى rgb() عبر المتصفح نفسه */
function __col(v){
  try{
    var e=document.createElement('i');e.style.color=v;document.body.appendChild(e);
    var c=getComputedStyle(e).color;e.remove();
    return String(c).replace(/\\s/g,'');
  }catch(_){return String(v)}
}
function __snip(s){return String(s).replace(/\\s+/g,' ').trim().slice(0,50)}
function __doChecks(){
  var R=[];
  try{
  R = (${JSON.stringify(checks)}).map(function(c){
    var ok=false, info='';
    try{
      if(c.kind==='exists'){var e0=document.querySelector(c.sel);ok=!!e0;info=ok?'':'لم يوجد «'+c.sel+'» في الصفحة — تأكد من الوسم والمعرف/الكلاس'}
      else if(c.kind==='count'){var n0=document.querySelectorAll(c.sel).length;ok=n0>=c.n;info=ok?'':'وُجد '+n0+' عنصراً «'+c.sel+'» والمطلوب '+c.n+' على الأقل'}
      else if(c.kind==='text'){var els=document.querySelectorAll(c.sel);ok=Array.prototype.some.call(els,function(e){return e.textContent.indexOf(c.contains)>=0});info=ok?'':(els.length?'النص الحالي لـ«'+c.sel+'»: «'+__snip(els[0].textContent)+'» — لا يحوي «'+c.contains+'»':'العنصر «'+c.sel+'» غير موجود أصلاً')}
      else if(c.kind==='attr'){var e1=document.querySelector(c.sel),a=e1?e1.getAttribute(c.attr):null;ok=a!==null&&(c.val===undefined||(c.part?a.indexOf(c.val)>=0:a===c.val));info=ok?'':(!e1?'العنصر «'+c.sel+'» غير موجود':(a===null?'لا توجد خاصية '+c.attr+' على العنصر':'القيمة الحالية «'+a+'» — المطلوب «'+c.val+'»'))}
      else if(c.kind==='css'){var e2=document.querySelector(c.sel),cur=e2?getComputedStyle(e2)[camel(c.prop)]:'';ok=!!e2&&__col(cur)===__col(c.val);info=ok?'':(!e2?'العنصر «'+c.sel+'» غير موجود':'القيمة الحالية لـ'+c.prop+' هي «'+cur+'» — المطلوب «'+c.val+'»')}
      else if(c.kind==='js'){ok=!!eval(c.expr);info=ok?'':'التعبير لم يتحقّق — تأكد أن كودك ينفّذ المطلوب فعلاً (جرّب الضغط على العنصر يدوياً)'}
      else if(c.kind==='log'){ok=__logs.join('\\n').indexOf(c.contains)>=0;info=ok?'':'المخرجات لا تحوي «'+c.contains+'» — اطبعه بـ console.log'}
      else if(c.kind==='src'){var s=__SRC[c.lang||'js']||'';ok=c.re?new RegExp(c.re).test(s):s.indexOf(c.contains)>=0;info=ok?'':'مصدر الـ'+(c.lang||'js').toUpperCase()+' لا يحوي «'+(c.contains||c.re)+'»'}
    }catch(x){ok=false;info='تعذّر الفحص: '+x.message}
    return {ok:ok,info:info};
  });
  }catch(e){}
  function camel(s){return s.replace(/-([a-z])/g,function(_,x){return x.toUpperCase()})}
  parent.postMessage({__prog:'checks', results:R, logs:__logs}, '*');
}
/* الفحص عند الطلب فقط — الوالد يرسل run-checks */
window.addEventListener('message',function(ev){if(ev.data&&ev.data.__prog==='run-checks')__doChecks()});
<\/script>` : '';
  const logger = `
<script>
var __logs=[];
var __t0=Date.now();
function __guard(){if(Date.now()-__t0>3000)throw new Error('تجاوز الزمن المسموح — غالباً حلقة لا نهائية، راجع شرط الإيقاف')}
(function(){
  var _e=console.error,_l=console.log,_w=console.warn;
  console.log=function(){var s=Array.from(arguments).join(' ');__logs.push(s);parent.postMessage({__prog:'log',line:s},'*');_l.apply(console,arguments)};
  console.warn=function(){var s=Array.from(arguments).join(' ');__logs.push(s);parent.postMessage({__prog:'log',line:s},'*');_w.apply(console,arguments)};
  console.error=function(){var s=Array.from(arguments).join(' ');__logs.push(s);parent.postMessage({__prog:'log',line:s,err:true},'*');_e.apply(console,arguments)};
  window.onerror=function(m){parent.postMessage({__prog:'log',line:'[خطأ] '+m,err:true},'*')};
  /* document.write آمن: يُلحق بالصفحة بدل مسحها */
  document.write=function(s){document.body.insertAdjacentHTML('beforeend',s)};
  document.writeln=function(s){document.body.insertAdjacentHTML('beforeend',s+'\\n')};
  /* خادم تجريبي: fetch يعمل داخل المختبر بلا إنترنت */
  var __API={
    '/api/user':{name:'سارة',age:25,city:'جدة'},
    '/api/users':[{name:'سارة'},{name:'خالد'},{name:'منى'}],
    '/api/post':{id:1,title:'أسرار الويب',body:'نص المقال التجريبي'},
    '/api/products':[{n:'قلم',p:5},{n:'دفتر',p:10},{n:'حقيبة',p:30}]
  };
  window.fetch=function(u,o){
    var d=__API[u]!==undefined?__API[u]:{ok:true,url:u,note:'نقطة نهاية تجريبية'};
    var res={ok:true,status:200,json:function(){return Promise.resolve(JSON.parse(JSON.stringify(d)))},text:function(){return Promise.resolve(JSON.stringify(d))}};
    return Promise.resolve(res);
  };
  /* localStorage داخل الـ sandbox: محاكاة ذاكرة عند تعذر الوصول الحقيقي */
  try{localStorage.setItem('__t','1');localStorage.removeItem('__t')}catch(e){
    var __m={};
    try{
      Object.defineProperty(window,'localStorage',{configurable:true,value:{
        getItem:function(k){return (k in __m)?__m[k]:null},
        setItem:function(k,v){__m[k]=String(v)},
        removeItem:function(k){delete __m[k]},
        clear:function(){__m={}}
      }});
    }catch(_){}
  }
})();
<\/script>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${src.css}</style>${logger}</head><body>${src.html}<script>try{${ujs}}catch(e){console.error(e.message)}<\/script>${harness}</body></html>`;
}
function buildDoc(checks) {
  return docFor({ html: eds.html.value, css: eds.css.value, js: eds.js.value }, checks);
}

function runPreview(forChecks) {
  if (isPy()) { runPy(forChecks); return; }
  const pv = $('#preview');
  if (!forChecks) {
    $('#conso').innerHTML = '';
    $('#conso').hidden = true;
  }
  pv.srcdoc = buildDoc(forChecks ? cur.track.lessons[cur.li].task.checks : null);
  if (forChecks) {
    /* الفحص عند الطلب فقط: بعد تحميل الـ sandbox نطلب التقييم — مع مهلة لتلحق الوعود والمؤقتات القصيرة */
    pv.onload = () => {
      setTimeout(() => { try { pv.contentWindow.postMessage({ __prog: 'run-checks' }, '*'); } catch (e) {} }, 700);
    };
  }
}

/* رسائل من iframe */
window.addEventListener('message', (ev) => {
  const m = ev.data || {};
  const fpv = $('#f_preview');
  const sel = (fpv && ev.source === fpv.contentWindow) ? '#f_conso' : '#conso';
  if (m.__prog === 'log') {
    consoLine(m.err ? '✗ ' + arErr(m.line.replace(/^\[خطأ\] ?/, '')) : m.line, m.err ? 'err' : '', sel);
  } else if (m.__prog === 'checks' && sel === '#conso') {
    showCheckResults(m.results);
  }
});

/* ---------- بايثون: Pyodide ---------- */
const PY_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
let pyodide = null, pyLoading = null;

function getPy() {
  if (pyodide) return Promise.resolve(pyodide);
  if (pyLoading) return pyLoading;
  consoInfo('جاري تحميل مفسّر بايثون (أول مرة فقط — قد يستغرق ~10ث)…');
  pyLoading = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = PY_CDN + 'pyodide.js';
    s.onload = () => {
      loadPyodide({ indexURL: PY_CDN }).then(p => { pyodide = p; res(p); }, rej);
    };
    s.onerror = () => { pyLoading = null; rej(new Error('net')); };
    document.head.appendChild(s);
  });
  return pyLoading;
}

async function runPy(forChecks) {
  const c = $('#conso');
  c.hidden = false;
  c.innerHTML = '';
  let py;
  try { py = await getPy(); }
  catch (e) {
    consoErr('تعذّر تحميل مفسّر بايثون — تحقق من اتصال الإنترنت ثم أعد المحاولة.');
    if (forChecks) showCheckResults(cur.track.lessons[cur.li].task.checks.map(() => false));
    return;
  }
  const code = eds.py.value;
  const out = [], errs = [];
  const feed = ($('#pyStdin').value || '').split('\n');
  let fi = 0;
  py.setStdout({ batched: s => out.push(s) });
  py.setStderr({ batched: s => errs.push(s) });
  py.setStdin({ stdin: () => (fi < feed.length ? feed[fi++] : null), error: false });
  try {
    await py.runPythonAsync(code);
  } catch (e) {
    consoErr(arPyErr(e.message || String(e)));
  }
  out.forEach(s => consoLine(s));
  errs.forEach(s => consoErr(arPyErr(s)));
  if (!out.length && !errs.length && !$('#conso .err')) consoInfo('(لا مخرجات — استعمل print لطباعة النتائج)');
  if (forChecks) showCheckResults(evalPyChecks(cur.track.lessons[cur.li].task.checks, out.join('\n'), code));
}

function evalPyChecks(checks, outText, code) {
  return checks.map(c => {
    try {
      if (c.kind === 'pyout') return outText.indexOf(c.contains) >= 0;
      if (c.kind === 'pysrc') return c.re ? new RegExp(c.re).test(code) : code.indexOf(c.contains) >= 0;
      if (c.kind === 'pyvar') {
        const v = pyodide.globals.get(c.name);
        if (v === undefined) return false;
        if (c.len) return Number(v.length ?? pyodide.runPython('len(' + c.name + ')')) === Number(c.val);
        if (c.val === undefined) return true;
        return String(v) === String(c.val);
      }
    } catch (e) { }
    return false;
  });
}

/* ---------- التصحيح ---------- */
function showCheckResults(results) {
  const L = cur.track.lessons[cur.li];
  const lis = $('#checkList').children;
  let pass = 0, firstFail = '';
  results.forEach((r, i) => {
    const li = lis[i];
    if (!li) return;
    const ok = typeof r === 'boolean' ? r : !!r.ok;
    const info = (r && r.info) || '';
    li.classList.remove('pass', 'fail');
    li.classList.add(ok ? 'pass' : 'fail');
    li.querySelector('.dot').textContent = ok ? '✓' : '✗';
    let inf = li.querySelector('.info');
    if (!inf) { inf = document.createElement('div'); inf.className = 'info'; li.appendChild(inf); }
    inf.textContent = ok ? '' : info;
    if (ok) pass++; else if (!firstFail) firstFail = info || (L.task.checks[i] || {}).desc || '';
  });
  /* شريط نتيجة بجانب الكود */
  const cb = $('#checkBar');
  if (cb) {
    cb.hidden = false;
    cb.className = 'check-bar ' + (pass === results.length && results.length ? 'good' : 'bad');
    cb.innerHTML = pass === results.length && results.length
      ? `✓ <b>${pass}/${results.length}</b> — كل الشروط تحققت`
      : `✗ <b>${pass}/${results.length}</b> تحقق` + (firstFail ? ` — <span class="cb-hint">${firstFail}</span>` : '');
    cb.onclick = () => { $('#secTask').open = true; };
  }
  const st = $('#taskStatus');
  if (pass === results.length && results.length) {
    st.textContent = 'كل الشروط تحققت!';
    st.className = 'good';
    markDone();
  } else {
    st.textContent = `${pass}/${results.length} شروط تحققت — عدّل الكود وحاول مجدداً`;
    st.className = 'bad';
  }
}

function markDone() {
  const L = cur.track.lessons[cur.li];
  state.done[L.id] = true;
  delete state.drafts[L.id];
  save();
  $('#lessonProg').textContent = '✓ مكتمل';
  $('#doneCard').hidden = false;
  renderHeader();
}

/* ---------- بطاقات التثبيت (المراجعة) ---------- */
let qz = { i: 0, score: 0, answered: false };

function renderQuiz() {
  const L = cur.track.lessons[cur.li];
  const questions = L.quiz || [];
  const box = $('#quizBox');
  const saved = state.quiz[L.id];
  $('#quizIntro').innerHTML = `ثلاثة أسئلة سريعة تُثبّت ما تعلمته في هذا الدرس.` +
    (saved ? ` <b>أفضل نتيجة سابقة: ${saved.best}/${questions.length}</b>` : '');
  qz = { i: 0, score: 0, answered: false };
  if (!questions.length) { box.innerHTML = '<p class="dim">لا أسئلة لهذا الدرس.</p>'; return; }
  box.innerHTML = `<div class="qz-start">
    <div class="qz-count">${questions.length} أسئلة · اختر الإجابة الصحيحة</div>
    <button class="btn" id="qzStart">ابدأ المراجعة</button>
  </div>`;
  $('#qzStart').onclick = () => renderQuestion();
}

function renderQuestion() {
  const L = cur.track.lessons[cur.li];
  const questions = L.quiz || [];
  const box = $('#quizBox');
  if (qz.i >= questions.length) {
    const best = Math.max(qz.score, (state.quiz[L.id] && state.quiz[L.id].best) || 0);
    state.quiz[L.id] = { best, last: qz.score };
    save();
    box.innerHTML = `<div class="qz-end">
      <div class="done-mark ${qz.score === questions.length ? '' : 'warn'}">${qz.score === questions.length ? '✓' : qz.score}</div>
      <h3>${qz.score === questions.length ? 'ممتاز! كل الإجابات صحيحة' : `أجبت صحيحاً على ${qz.score} من ${questions.length}`}</h3>
      <div class="done-btns">
        <button class="btn" id="qzRetry">إعادة المراجعة</button>
        <button class="btn ghost" id="qzNextL">الدرس التالي ←</button>
      </div>
    </div>`;
    $('#qzRetry').onclick = () => renderQuiz();
    $('#qzNextL').onclick = () => $('#nextBtn').click();
    renderHeader();
    return;
  }
  const q = questions[qz.i];
  qz.answered = false;
  box.innerHTML = `<div class="qz-card">
    <div class="qz-step">سؤال ${qz.i + 1} / ${questions.length}</div>
    <div class="qz-q">${q.q}</div>
    <div class="qz-opts">${q.o.map((o, i) => `<button class="qz-opt" data-i="${i}">${o}</button>`).join('')}</div>
    <div class="qz-foot"><span id="qzMsg"></span><button class="btn sm" id="qzNext" hidden>${qz.i + 1 === questions.length ? 'النتيجة' : 'التالي ←'}</button></div>
  </div>`;
  $$('.qz-opt').forEach(b => {
    b.onclick = () => {
      if (qz.answered) return;
      qz.answered = true;
      const pick = +b.dataset.i;
      if (pick === q.a) { b.classList.add('right'); qz.score++; $('#qzMsg').textContent = 'صحيح!'; $('#qzMsg').className = 'good'; }
      else {
        b.classList.add('wrong');
        $$('.qz-opt')[q.a].classList.add('right');
        $('#qzMsg').textContent = 'الإجابة الصحيحة مُظللة بالأخضر';
        $('#qzMsg').className = 'bad';
      }
      $('#qzNext').hidden = false;
    };
  });
  $('#qzNext').onclick = () => { qz.i++; renderQuestion(); };
}

/* ---------- المختبر الحر ---------- */
const fEls = { html: $('#f_html'), css: $('#f_css'), js: $('#f_js') };
let fet = 'html';

function openFree() {
  $('#tracksView').hidden = true;
  $('#lessonView').hidden = true;
  $('#coursesView').hidden = true;
  $('#freeView').hidden = false;
  if (!fEls.html.value && !fEls.css.value && !fEls.js.value) {
    const f = state.free;
    fEls.html.value = f.html || '<h1>مرحباً!</h1>\n<button id="b">اضغطني</button>';
    fEls.css.value = f.css || 'body { font-family: sans-serif; }';
    fEls.js.value = f.js || `document.querySelector('#b').onclick = () => console.log('أهلاً!');`;
    if (!f.html && !f.css && !f.js) runFree();
  }
  if (fEls.html.value) runFree();
  window.scrollTo(0, 0);
}

function runFree() {
  state.free = { html: fEls.html.value, css: fEls.css.value, js: fEls.js.value };
  save();
  $('#f_conso').innerHTML = '';
  $('#f_conso').hidden = true;
  $('#f_preview').srcdoc = docFor(state.free, null);
}

/* ---------- بطاقات المفاهيم (FSRS) ---------- */
let fcs = { i: 0, list: [] };
const todayISO = () => new Date().toISOString().slice(0, 10);
function cardState(lid, i) {
  if (!state.fc[lid]) state.fc[lid] = {};
  if (!state.fc[lid][i]) state.fc[lid][i] = Object.assign(FSRS.newCard(), { nextReview: null, lapses: 0 });
  return state.fc[lid][i];
}

function renderCards() {
  const L = cur.track.lessons[cur.li];
  const box = $('#fcBox');
  const cards = L.cards || [];
  if (!cards.length) { box.innerHTML = '<p class="dim">لا بطاقات لهذا الدرس.</p>'; return; }
  const t = todayISO();
  fcs.list = cards.map((c, i) => ({ c, i, st: cardState(L.id, i) }))
    .sort((a, b) => {
      const da = a.st.nextReview || '', db = b.st.nextReview || '';
      return da === db ? a.i - b.i : (da < db ? -1 : 1);
    });
  const due = fcs.list.filter(x => !x.st.nextReview || x.st.nextReview <= t);
  fcs.all = fcs.list;
  fcs.list = due.length ? due : fcs.list;
  fcs.noneDue = !due.length;
  fcs.i = 0;
  renderCard();
}

function renderCard() {
  const L = cur.track.lessons[cur.li];
  const box = $('#fcBox');
  const t = todayISO();
  if (fcs.i >= fcs.list.length) {
    const upcoming = fcs.all.filter(x => x.st.nextReview && x.st.nextReview > t)
      .map(x => x.st.nextReview).sort()[0];
    box.innerHTML = `<div class="fc-done">
      <div class="done-mark">✓</div>
      <p>أتممت بطاقات هذا الدرس${fcs.noneDue ? ' (مراجعة مبكرة)' : ''}.</p>
      ${upcoming ? `<p class="dim">أقرب استحقاق قادم: <b>${upcoming}</b></p>` : ''}
      <button class="btn ghost sm" id="fcAgain">مراجعة الكل مجدداً</button>
    </div>`;
    $('#fcAgain').onclick = () => { fcs.list = fcs.all; fcs.i = 0; fcs.noneDue = true; renderCard(); };
    return;
  }
  if (fcs.noneDue) {
    box.innerHTML = `<div class="fc-note dim">لا بطاقات مستحقة الآن — أقرب استحقاق <b>${fcs.all.map(x=>x.st.nextReview).sort()[0]}</b>. <button class="btn ghost sm" id="fcForce">راجع مبكراً</button></div>`;
    $('#fcForce').onclick = () => { fcs.noneDue = false; renderCard(); };
    return;
  }
  const { c, i, st } = fcs.list[fcs.i];
  const badge = !st.nextReview ? 'جديدة' : (st.nextReview <= t ? 'مستحقة' : 'مؤجلة حتى ' + st.nextReview);
  box.innerHTML = `<div class="fc-card">
    <div class="fc-top"><span>بطاقة ${fcs.i + 1} / ${fcs.list.length}</span><span class="fc-due">${badge}</span></div>
    <div class="fc-f">${c[0]}</div>
    <div class="fc-b" id="fcB" hidden>${c[1]}</div>
    <div class="fc-foot" id="fcFoot"><button class="btn sm" id="fcShow">أظهر الإجابة</button></div>
  </div>`;
  $('#fcShow').onclick = () => {
    $('#fcB').hidden = false;
    $('#fcFoot').innerHTML = `<span class="fc-hint">كم تذكرتها بسهولة؟</span>
      <div class="fc-grades">
        <button class="fc-g g-bad" data-q="2">نسيت</button>
        <button class="fc-g g-warn" data-q="3">بصعوبة</button>
        <button class="fc-g g-good" data-q="4">جيد</button>
        <button class="fc-g g-great" data-q="5">سهل</button>
      </div>`;
    $$('.fc-g').forEach(g => g.onclick = () => {
      const q = +g.dataset.q;
      const prev = cardState(L.id, i);
      const r = FSRS.schedule(Object.assign({}, prev, { quality: q }), { fuzz: true });
      state.fc[L.id][i] = Object.assign(prev, {
        repetitions: r.repetitions, ease: r.newEase, interval: r.newInterval,
        lapses: r.lapses, lastReview: new Date().toISOString(), nextReview: r.nextReview,
        state: r.state
      });
      save();
      fcs.i++;
      renderCard();
    });
  };
}

/* ---------- الكورسات: خارطة 4 مستويات على window.COURSES ---------- */
if (!state.courses) state.courses = {};
let cSel = { ti: null, ci: null };

const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const courseLessons = c => (c.chapters || []).reduce((n, ch) => n + (ch.lessons || []).length, 0);
const cKey = (ti, cid, ch, li) => `${ti}|${cid}|${ch}|${li}`;
const cDone = (ti, cid) => Object.keys(state.courses).filter(k => k.startsWith(ti + '|' + cid + '|') && state.courses[k]).length;
const cTotalAll = () => {
  const C = window.COURSES;
  if (!C || !C.tracks) return [0, 0];
  let done = 0, total = 0;
  C.tracks.forEach((t, ti) => (t.courses || []).forEach(c => {
    const cid = c.id || '';
    total += courseLessons(c);
    done += cDone(ti, cid);
  }));
  return [done, total];
};

function openCourses() {
  $('#tracksView').hidden = true;
  $('#lessonView').hidden = true;
  $('#freeView').hidden = true;
  $('#coursesView').hidden = false;
  renderCourses();
  window.scrollTo(0, 0);
}

function renderCourses() {
  const body = $('#cBody');
  const C = window.COURSES;
  const [done, total] = cTotalAll();
  $('#c_total').innerHTML = total ? `<b>${done}</b> / ${total} درساً` : '';

  if (!C || !Array.isArray(C.tracks) || !C.tracks.length) {
    body.innerHTML = `<div class="c-empty">لا بيانات كورسات بعد — يصل ملف <code>courses.js</code> قريباً وتظهر الخارطة هنا.</div>`;
    return;
  }

  /* مستوى 1: شريط المسارات */
  const tracks = C.tracks.map((t, ti) => {
    const tot = (t.courses || []).reduce((n, c) => n + courseLessons(c), 0);
    return `<button class="c-chip ${cSel.ti === ti ? 'on' : ''}" data-ti="${ti}">${escH(t.name)} <span class="c-cnt">${tot}</span></button>`;
  }).join('');

  let html = `<div class="c-levels"><h3 class="sec-h">المسار</h3><div class="c-chips">${tracks}</div></div>`;

  /* مستوى 2: كورسات المسار المختار */
  if (cSel.ti !== null && C.tracks[cSel.ti]) {
    const T = C.tracks[cSel.ti];
    html += `<div class="c-levels"><h3 class="sec-h">كورسات «${escH(T.name)}» — ${T.courses.length} كورساً</h3><div class="c-grid">`;
    html += T.courses.map((c, ci) => {
      const cid = c.id || String(ci);
      const tot = courseLessons(c);
      const dn = cDone(cSel.ti, cid);
      const meta = [c.instructor, c.level, c.subject].filter(Boolean).map(escH).join(' · ');
      return `<div class="c-course ${cSel.ci === ci ? 'on' : ''}" data-ci="${ci}">
        <div class="c-c-title">${escH(c.title || ('كورس ' + (ci + 1)))}</div>
        ${meta ? `<div class="c-c-meta">${meta}</div>` : ''}
        <div class="c-c-prog"><div class="track-bar"><i style="width:${tot ? Math.round(dn / tot * 100) : 0}%"></i></div>
          <span class="c-c-num">${dn}/${tot}</span></div>
      </div>`;
    }).join('');
    html += `</div></div>`;
  }

  /* مستوى 3-4: شجرة فصول/دروس الكورس المختار */
  if (cSel.ti !== null && cSel.ci !== null && C.tracks[cSel.ti] && C.tracks[cSel.ti].courses[cSel.ci]) {
    const c = C.tracks[cSel.ti].courses[cSel.ci];
    const cid = c.id || String(cSel.ci);
    const tot = courseLessons(c), dn = cDone(cSel.ti, cid);
    html += `<div class="c-levels"><h3 class="sec-h">فصول «${escH(c.title || '')}» — ${dn}/${tot}</h3><div class="c-tree" id="cTree">`;
    html += (c.chapters || []).map((ch, chi) => {
      const ldn = (ch.lessons || []).filter((l, li) => state.courses[cKey(cSel.ti, cid, chi, li)]).length;
      return `<details class="c-ch" open>
        <summary>${escH(ch.name || ('الفصل ' + (chi + 1)))} <span class="c-cnt" data-ch="${chi}">${ldn}/${(ch.lessons || []).length}</span></summary>
        <div class="c-lessons">
          ${(ch.lessons || []).map((l, li) => {
            const k = cKey(cSel.ti, cid, chi, li);
            return `<label class="c-lesson"><input type="checkbox" data-k="${k}" data-ch="${chi}" ${state.courses[k] ? 'checked' : ''}><span>${escH(l)}</span></label>`;
          }).join('')}
        </div>
      </details>`;
    }).join('');
    html += `</div></div>`;
  }

  body.innerHTML = html;

  $$('#cBody .c-chip').forEach(b => b.onclick = () => {
    cSel.ti = +b.dataset.ti; cSel.ci = null; renderCourses();
  });
  $$('#cBody .c-course').forEach(el => el.onclick = () => {
    cSel.ci = cSel.ci === +el.dataset.ci ? null : +el.dataset.ci; renderCourses();
  });
  $$('#cBody input[type=checkbox]').forEach(cb => cb.onchange = () => {
    const k = cb.dataset.k;
    if (cb.checked) state.courses[k] = true; else delete state.courses[k];
    save();
    /* تحديث عدادات بلا إعادة بناء (حفاظاً على التمرير وطي الفصول) */
    const ti = +k.split('|')[0], cid = k.split('|')[1], chi = +cb.dataset.ch;
    const chEl = cb.closest('.c-ch');
    const ch = chEl && C.tracks[ti].courses[cSel.ci].chapters[chi];
    if (chEl && ch) {
      const ldn = (ch.lessons || []).filter((l, li) => state.courses[cKey(ti, cid, chi, li)]).length;
      const cnt = chEl.querySelector('[data-ch]'); if (cnt) cnt.textContent = `${ldn}/${(ch.lessons || []).length}`;
    }
    const c = C.tracks[ti].courses[cSel.ci];
    const dn = cDone(ti, cid), tot = courseLessons(c);
    const card = $(`#cBody .c-course[data-ci="${cSel.ci}"]`);
    if (card) {
      const num = card.querySelector('.c-c-num'); if (num) num.textContent = `${dn}/${tot}`;
      const bar = card.querySelector('.track-bar i'); if (bar) bar.style.width = (tot ? Math.round(dn / tot * 100) : 0) + '%';
    }
    const secH = $('#cTree').previousElementSibling;
    if (secH && secH.classList.contains('sec-h')) secH.innerHTML = `فصول «${escH(c.title || '')}» — ${dn}/${tot}`;
    const [d2, t2] = cTotalAll();
    $('#c_total').innerHTML = t2 ? `<b>${d2}</b> / ${t2} درساً` : '';
  });
}

/* ---------- أحداث ---------- */
$$('.etab[data-et]').forEach(b => b.onclick = () => {
  et = b.dataset.et;
  $$('.etab[data-et]').forEach(x => x.classList.toggle('on', x === b));
  eds.html.hidden = et !== 'html';
  eds.css.hidden = et !== 'css';
  eds.js.hidden = et !== 'js';
});
$$('.f-etab').forEach(b => b.onclick = () => {
  fet = b.dataset.fet;
  $$('.f-etab').forEach(x => x.classList.toggle('on', x === b));
  fEls.html.hidden = fet !== 'html';
  fEls.css.hidden = fet !== 'css';
  fEls.js.hidden = fet !== 'js';
});
$('#f_back').onclick = () => { $('#freeView').hidden = true; $('#tracksView').hidden = false; };
$('#c_back').onclick = () => { $('#coursesView').hidden = true; $('#tracksView').hidden = false; };
$('#f_run').onclick = runFree;
$('#f_clear').onclick = () => {
  if (!confirm('سيُمسح كود المختبر الحر الحالي — متابعة؟')) return;
  state.free = { html: '', css: '', js: '' };
  save();
  fEls.html.value = ''; fEls.css.value = ''; fEls.js.value = '';
  $('#f_preview').srcdoc = '';
  $('#f_conso').hidden = true;
};
['html', 'css', 'js', 'py'].forEach(k => {
  eds[k].addEventListener('input', () => saveDraft());
});
['html', 'css', 'js'].forEach(k => {
  fEls[k].addEventListener('input', () => {
    state.free = { html: fEls.html.value, css: fEls.css.value, js: fEls.js.value };
    save();
  });
});
$('#runBtn').onclick = () => runPreview(false);
$('#resetCode').onclick = () => {
  if (!confirm('سيستبدل هذا كودك الحالي بكود المثال — متابعة؟')) return;
  const L = cur.track.lessons[cur.li];
  delete state.drafts[L.id]; save();
  const src = codeFor(L);
  eds.html.value = src.html || ''; eds.css.value = src.css || '';
  eds.js.value = src.js || ''; eds.py.value = src.py || '';
  if (isPy()) { $('#conso').innerHTML = ''; consoInfo('أُعيد المثال — اضغط «تشغيل».'); }
  else runPreview(false);
};
$('#checkBtn').onclick = () => {
  $('#checkList').innerHTML = cur.track.lessons[cur.li].task.checks.map(c =>
    `<li><span class="dot"></span>${c.desc}</li>`).join('');
  runPreview(true);
};
$('#backBtn').onclick = () => {
  $('#lessonView').hidden = true;
  $('#coursesView').hidden = true;
  $('#tracksView').hidden = false;
  renderTracks();
};
$('#nextBtn').onclick = () => {
  const t = cur.track;
  if (cur.li + 1 < t.lessons.length) openLesson(t.id, cur.li + 1);
  else $('#backBtn').click();
};
$('#redoBtn').onclick = () => { $('#secLearn').open = true; window.scrollTo(0, 0); };

renderTracks();
})();
