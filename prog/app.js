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
function save() { localStorage.setItem(LS, JSON.stringify(state)); }

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
  $('#doneCard').hidden = true;

  setupLabMode();
  renderQuiz();
  showPane('learn');
  loadCode(L);
  window.scrollTo(0, 0);
}

function showPane(p) {
  $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.pane === p));
  $$('.pane').forEach(x => x.classList.toggle('on', x.id === 'pane-' + p));
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
function consoLine(s, cls) {
  const c = $('#conso');
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
function buildDoc(checks) {
  const srcs = JSON.stringify({ html: eds.html.value, css: eds.css.value, js: eds.js.value });
  const harness = checks ? `
<script>
var __SRC=${srcs};
function __rgb(s){return String(s).replace(/\\s/g,'')}
function __cssName(v){
  var M={navy:'rgb(0,0,128)',gold:'rgb(255,215,0)',teal:'rgb(0,128,128)',white:'rgb(255,255,255)',
  red:'rgb(255,0,0)',black:'rgb(0,0,0)',green:'rgb(0,128,0)',blue:'rgb(0,0,255)'};
  return M[v]||v;
}
function __doChecks(){
  var R=[];
  try{
  R = (${JSON.stringify(checks)}).map(function(c){
    var ok=false;
    try{
      if(c.kind==='exists'){ok=!!document.querySelector(c.sel)}
      else if(c.kind==='count'){ok=document.querySelectorAll(c.sel).length>=c.n}
      else if(c.kind==='text'){ok=Array.prototype.some.call(document.querySelectorAll(c.sel),function(e){return e.textContent.indexOf(c.contains)>=0})}
      else if(c.kind==='attr'){ok=Array.prototype.some.call(document.querySelectorAll(c.sel),function(e2){var a=e2.getAttribute(c.attr);return a!==null&&(c.val===undefined||(c.part?a.indexOf(c.val)>=0:a===c.val))})}
      else if(c.kind==='css'){ok=Array.prototype.some.call(document.querySelectorAll(c.sel),function(e3){return __rgb(getComputedStyle(e3)[camel(c.prop)])===__rgb(__cssName(c.val))})}
      else if(c.kind==='js'){ok=!!eval(c.expr)}
      else if(c.kind==='log'){ok=__logs.join('\\n').indexOf(c.contains)>=0}
      else if(c.kind==='src'){var s=__SRC[c.lang||'js']||'';ok=c.re?new RegExp(c.re).test(s):s.indexOf(c.contains)>=0}
    }catch(x){ok=false}
    return ok;
  });
  }catch(e){}
  function camel(s){return s.replace(/-([a-z])/g,function(_,x){return x.toUpperCase()})}
  parent.postMessage({__prog:'checks', results:R, logs:__logs}, '*');
}
if(document.readyState==='complete'||document.readyState==='interactive'){__doChecks()}
else window.addEventListener('load',function(){setTimeout(__doChecks,30)});
<\/script>` : '';
  const logger = `
<script>
var __logs=[];
(function(){
  var _e=console.error,_l=console.log,_w=console.warn;
  console.log=function(){var s=Array.from(arguments).join(' ');__logs.push(s);parent.postMessage({__prog:'log',line:s},'*');_l.apply(console,arguments)};
  console.warn=function(){var s=Array.from(arguments).join(' ');__logs.push(s);parent.postMessage({__prog:'log',line:s},'*');_w.apply(console,arguments)};
  console.error=function(){var s=Array.from(arguments).join(' ');__logs.push(s);parent.postMessage({__prog:'log',line:s,err:true},'*');_e.apply(console,arguments)};
  window.onerror=function(m){parent.postMessage({__prog:'log',line:'[خطأ] '+m,err:true},'*')};
  /* document.write آمن: يُلحق بالصفحة بدل مسحها */
  document.write=function(s){document.body.insertAdjacentHTML('beforeend',s)};
  document.writeln=function(s){document.body.insertAdjacentHTML('beforeend',s+'\\n')};
})();
<\/script>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${eds.css.value}</style>${logger}</head><body>${eds.html.value}<script>try{${eds.js.value}}catch(e){console.error(e.message)}<\/script>${harness}</body></html>`;
}

function runPreview(forChecks) {
  if (isPy()) { runPy(forChecks); return; }
  const pv = $('#preview');
  if (!forChecks) {
    $('#conso').innerHTML = '';
    $('#conso').hidden = true;
  }
  pv.srcdoc = buildDoc(forChecks ? cur.track.lessons[cur.li].task.checks : null);
}

/* رسائل من iframe */
window.addEventListener('message', (ev) => {
  const m = ev.data || {};
  if (m.__prog === 'log') {
    consoLine(m.err ? '✗ ' + arErr(m.line.replace(/^\[خطأ\] ?/, '')) : m.line, m.err ? 'err' : '');
  } else if (m.__prog === 'checks') {
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
  let pass = 0;
  results.forEach((ok, i) => {
    const li = lis[i];
    if (!li) return;
    li.classList.add(ok ? 'pass' : 'fail');
    li.querySelector('.dot').textContent = ok ? '✓' : '✗';
    if (ok) pass++;
  });
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

/* ---------- أحداث ---------- */
$$('.tab').forEach(b => b.onclick = () => showPane(b.dataset.pane));
$$('.etab[data-et]').forEach(b => b.onclick = () => {
  et = b.dataset.et;
  $$('.etab[data-et]').forEach(x => x.classList.toggle('on', x === b));
  eds.html.hidden = et !== 'html';
  eds.css.hidden = et !== 'css';
  eds.js.hidden = et !== 'js';
});
['html', 'css', 'js', 'py'].forEach(k => {
  eds[k].addEventListener('input', () => saveDraft());
});
$('#runBtn').onclick = () => runPreview(false);
$('#resetCode').onclick = () => {
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
$('#toLab').onclick = () => showPane('lab');
$('#backBtn').onclick = () => {
  $('#lessonView').hidden = true;
  $('#tracksView').hidden = false;
  renderTracks();
};
$('#nextBtn').onclick = () => {
  const t = cur.track;
  if (cur.li + 1 < t.lessons.length) openLesson(t.id, cur.li + 1);
  else $('#backBtn').click();
};
$('#redoBtn').onclick = () => showPane('learn');

/* تشغيل تلقائي بفاصل قصير عند الكتابة (مسارات الويب فقط) */
let deb;
[eds.html, eds.css, eds.js].forEach(ed => ed.addEventListener('input', () => {
  if (!cur.track || isPy()) return;
  clearTimeout(deb); deb = setTimeout(() => runPreview(false), 600);
}));

renderTracks();
})();
