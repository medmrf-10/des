/* برمج — محرك المنصة: عرض، محرر حي، تصحيح تلقائي، حفظ localStorage */
(function () {
'use strict';

const LS = 'prog_v1';
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* ---------- الحالة ---------- */
let state = { done: {}, drafts: {} };
try { state = Object.assign(state, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) {}
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
        ${t.lessons.map((l, i) => `
          <div class="lesson ${state.done[l.id] ? 'done' : ''}" data-l="${i}">
            <div class="num">${state.done[l.id] ? '✓' : i + 1}</div>
            <div class="l-name">${l.t}</div>
            <div class="l-state">${state.done[l.id] ? 'مكتمل' : 'ابدأ'}</div>
          </div>`).join('')}
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
  $('#lessonTip').textContent = L.tip || '';
  $('#taskPrompt').innerHTML = L.task.p;
  $('#checkList').innerHTML = L.task.checks.map(c =>
    `<li><span class="dot"></span>${c.desc}</li>`).join('');
  $('#taskStatus').textContent = '';
  $('#doneCard').hidden = true;

  showPane('learn');
  loadCode(L);
  window.scrollTo(0, 0);
}

function showPane(p) {
  $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.pane === p));
  $$('.pane').forEach(x => x.classList.toggle('on', x.id === 'pane-' + p));
}

/* ---------- المحرر والمعاينة ---------- */
const eds = { html: $('#ed_html'), css: $('#ed_css'), js: $('#ed_js') };
let et = 'html';

function codeFor(L) { return (L.task.start) || L.ex; }

function loadCode(L) {
  const d = state.drafts[L.id];
  const src = d || codeFor(L);
  eds.html.value = src.html || '';
  eds.css.value = src.css || '';
  eds.js.value = src.js || '';
  runPreview();
}

function saveDraft() {
  const L = cur.track.lessons[cur.li];
  state.drafts[L.id] = { html: eds.html.value, css: eds.css.value, js: eds.js.value };
  save();
}

function buildDoc(checks) {
  const harness = checks ? `
<script>
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
  var _e=console.error,_l=console.log;
  console.log=function(){var s=Array.from(arguments).join(' ');__logs.push(s);parent.postMessage({__prog:'log',line:s},'*');_l.apply(console,arguments)};
  console.error=function(){var s=Array.from(arguments).join(' ');parent.postMessage({__prog:'log',line:'[خطأ] '+s,err:true},'*');_e.apply(console,arguments)};
  window.onerror=function(m){parent.postMessage({__prog:'log',line:'[خطأ] '+m,err:true},'*')};
})();
<\/script>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${eds.css.value}</style>${logger}</head><body>${eds.html.value}<script>try{${eds.js.value}}catch(e){console.error(e.message)}<\/script>${harness}</body></html>`;
}

function runPreview(forChecks) {
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
    const c = $('#conso');
    c.hidden = false;
    const d = document.createElement('div');
    if (m.err) d.className = 'err';
    d.textContent = m.line;
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
  } else if (m.__prog === 'checks') {
    showCheckResults(m.results);
  }
});

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

/* ---------- أحداث ---------- */
$$('.tab').forEach(b => b.onclick = () => showPane(b.dataset.pane));
$$('.etab').forEach(b => b.onclick = () => {
  et = b.dataset.et;
  $$('.etab').forEach(x => x.classList.toggle('on', x === b));
  Object.keys(eds).forEach(k => eds[k].hidden = k !== et);
});
['html', 'css', 'js'].forEach(k => {
  eds[k].addEventListener('input', () => { saveDraft(); });
});
$('#runBtn').onclick = () => runPreview(false);
$('#resetCode').onclick = () => {
  const L = cur.track.lessons[cur.li];
  delete state.drafts[L.id]; save();
  const src = codeFor(L);
  eds.html.value = src.html || ''; eds.css.value = src.css || ''; eds.js.value = src.js || '';
  runPreview(false);
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

/* تشغيل تلقائي بفاصل قصير عند الكتابة */
let deb;
Object.values(eds).forEach(ed => ed.addEventListener('input', () => {
  clearTimeout(deb); deb = setTimeout(() => runPreview(false), 600);
}));

renderTracks();
})();
