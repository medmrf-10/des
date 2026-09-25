/* قارئ الكتب العشرة — فهرس حقيقي بالقراءة */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const MADJ = {'شافعي':'shafii','حنفي':'hanafi','مالكي':'maliki','حنبلي':'hanbali'};
const norm = s => (s||'').replace(/[ً-ْـ]/g,'')
  .replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')
  .replace(/[«»()\[\]•*"']/g,' ').replace(/\s+/g,' ').trim();
const esc = s => (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DIA = '\\u064B-\\u0652\\u0640';
const flex = q => q.split('').map(c=>{
  if (c===' ') return '\\s+';
  const cls = {'ا':'اأإآ','ه':'هة','ي':'يى'}[c];
  const core = cls ? '['+cls+']' : c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return core+'['+DIA+']*';
}).join('');
const hl = (s,q) => {  // q مُطبَّع مسبقاً؛ النمط متسامح مع التشكيل والتطبيع
  if(!q) return esc(s);
  const t=esc(s);
  return t.replace(new RegExp(flex(q),'g'), m=>'<mark>'+m+'</mark>');
};
const KLBL = {open:'صدر', head:'عنوان', marker:'علامة'};

const idx = window.READER_INDEX;
const booksBar = $('#booksBar'), tree = $('#tree'), content = $('#content');
let curBook = null, curUnit = -1, query = '';

/* درج الفهرس على الهاتف */
const setTree = open => document.body.classList.toggle('tree-open', open);
$('#treeToggle').onclick = () => setTree(!document.body.classList.contains('tree-open'));
$('#treeBackdrop').onclick = () => setTree(false);

/* ---------- الفهرس الموحّد (مصفوفة الموضوعات × الكتب) ---------- */
const TOPICS = window.READER_TOPICS || [];
const bookMeta = s => idx.find(b => b.slug === s) || {};

function showTopics(){
  setTree(false);
  curBook = null; curUnit = -1; // مسح المرجع حتى لا يمنع fromHash إعادة العرض
  document.querySelectorAll('.bookbtn').forEach(b=>b.classList.remove('active'));
  $('#homeBtn').classList.add('on');
  location.hash = 'topics';
  content.innerHTML = `<h2 class="utitle">الفهرس الموحّد — ${TOPICS.length} موضوعاً × ${idx.length} كتاباً</h2>
    <div class="tgrid">${TOPICS.map((t,i)=>`<div class="tcard" data-t="${i}"><b>${esc(t.t)}</b><span>${new Set(t.books.map(b=>b.s)).size} كتاباً · ${t.books.length} موضعاً</span></div>`).join('')}</div>`;
  content.querySelectorAll('.tcard').forEach(el=>el.onclick=()=>showTopic(+el.dataset.t));
}

function showTopic(ti){
  const t = TOPICS[ti]; if(!t) return;
  setTree(false);
  curBook = null; curUnit = -1; // مسح المرجع حتى لا يمنع fromHash إعادة العرض
  $('#homeBtn').classList.add('on');
  location.hash = 'topic/'+ti;
  const bySlug = {};
  t.books.forEach(b=>{(bySlug[b.s]=bySlug[b.s]||[]).push(b)});
  const order = idx.map(b=>b.slug).filter(s=>bySlug[s]);
  content.innerHTML = `<div class="crumbs"><a href="#topics">الفهرس الموحّد</a> ← ${esc(t.t)}</div>
    <h2 class="utitle">${esc(t.t)}</h2>
    <div class="umeta"><span>${order.length} كتاباً نصّت عليه · ${t.books.length} موضعاً — اختر كتاباً لتقرأ نصّ مؤلفه كاملاً في هذا الباب</span></div>
    ${order.map(s=>{const m=bookMeta(s);return `<div class="tg">
      <div class="tg-head" data-s="${s}"><span>${esc(m.title||s)} <span style="font-weight:400;font-size:12px">— ${esc(m.author||'')}</span></span><span class="cnt">${esc(m.madh||'')} · ${bySlug[s].length}</span></div>
      ${bySlug[s].map(b=>`<div class="trow" data-s="${s}" data-i="${b.i}"><span class="tt">${esc(b.t)}</span><span class="pg">ص ${b.p}</span></div>`).join('')}
    </div>`}).join('')}`;
  content.querySelectorAll('.trow').forEach(el=>el.onclick=()=>selectBook(el.dataset.s,+el.dataset.i));
  content.querySelectorAll('.tg-head').forEach(el=>el.onclick=()=>{const s=el.dataset.s; const rows=el.parentElement.querySelectorAll('.trow'); rows.forEach(r=>r.style.display=r.style.display==='none'?'':'none');});
  content.scrollTop = 0;
}

$('#homeBtn').onclick = showTopics;

/* ---------- شريط الكتب ---------- */
idx.forEach(b=>{
  const el = document.createElement('button');
  el.className='bookbtn'; el.dataset.slug=b.slug;
  el.innerHTML = `${esc(b.title)} <span class="m">${b.author} · ${esc(b.madh)}</span>`;
  el.onclick = ()=>selectBook(b.slug);
  booksBar.appendChild(el);
});

function selectBook(slug, unitI){
  document.querySelectorAll('.bookbtn').forEach(b=>b.classList.toggle('active', b.dataset.slug===slug));
  if (unitI==null){  // تبديل كتاب بلا وحدة: نظّف العرض والهاش القديم
    curUnit=-1;
    content.innerHTML='<div class="empty">اختر كتاباً ثم وحدة من الفهرس لقراءة نصها الكامل.</div>';
    if (location.hash) history.replaceState(null,'',location.pathname+location.search);
  }
  $('#homeBtn').classList.remove('on');
  if (window.READER_BOOKS && window.READER_BOOKS[slug]){
    curBook = window.READER_BOOKS[slug]; renderTree(); 
    if (unitI!=null) showUnit(unitI);
    return;
  }
  tree.innerHTML = '<div class="skel">…يُحمَّل الكتاب</div>';
  content.innerHTML = '<div class="skel">…يُحمَّل الكتاب</div>'; // مؤشر على الهاتف حيث الشجرة مخفية
  const s = document.createElement('script');
  s.src = 'data/'+slug+'.js';
  s.onload = ()=>{ curBook = window.READER_BOOKS[slug]; renderTree(); if(unitI!=null) showUnit(unitI); };
  s.onerror = ()=>{ tree.innerHTML = '<div class="skel">تعذّر تحميل بيانات الكتاب (data/'+slug+'.js)</div>'; };
  document.body.appendChild(s);
}

/* ---------- شجرة الوحدات ---------- */
function visible(u, q){
  if(!q) return true;
  return norm(u.t).includes(q) || norm(u.x).includes(q);
}
function renderTree(){
  const q = norm(query);
  tree.innerHTML='';
  const collapsed = {};  // إخفاء أبناء مستوى أعمق بعد عنوان مطوي
  curBook.units.forEach(u=>{
    if (u.k==='open' && !u.a.length && !u.x) return;
    if (q && !visible(u,q) && !curBook.units.some(o=>o.path && o.path.includes(u.t) && visible(o,q))) {
      // أبقِ الأسلاف ظاهرة إن طابق أحد الأبناء — تبسيط: لا نُخفي العناوين الكبرى
      if (u.l>1 && !visible(u,q)) return;
    }
    const el = document.createElement('div');
    el.className = 'u'+(u.k==='head'?' head':'')+(u.l===1?' lvl1':'');
    el.style.paddingRight = (10 + (u.l-1)*14) + 'px';
    el.dataset.i = u.i;
    el.innerHTML = `${u.k==='head'?'📗 ':'· '}${hl(u.t,q)} <span class="pg">ص${u.p0}</span>`;
    el.onclick = ()=>showUnit(u.i);
    tree.appendChild(el);
  });
}

/* ---------- عرض وحدة ---------- */
function showUnit(i){
  const u = curBook.units[i]; if(!u) return;
  curUnit = i;
  tree.querySelectorAll('.u.sel').forEach(e=>e.classList.remove('sel'));
  const node = tree.querySelector(`.u[data-i="${i}"]`);
  if (node){ node.classList.add('sel'); node.scrollIntoView({block:'nearest'}); }
  setTree(false); // على الهاتف: اختيار وحدة يغلق الدرج
  const crumbs = u.path.length? `<div class="crumbs">${u.path.map(esc).join(' ← ')}</div>` : '';
  const nofx = curBook.nofx && !u.x;
  const atoms = u.a.length
    ? `<details class="atoms"${nofx ? ' open' : ''}><summary>الذرات المقصوصة (${u.a.length})</summary><ol>${u.a.map(a=>'<li>«'+esc(a)+'»</li>').join('')}</ol></details>`
    : '';
  const note = nofx ? '<div class="umeta"><span>النص الكامل غير مودَع (ضخامة) — الذرات المقصوصة أدناه.</span></div>' : '';
  const q = norm(query);
  content.innerHTML = `
    ${crumbs}
    <h2 class="utitle">${hl(u.t,q)}</h2>
    <div class="umeta">
      <span class="madj ${MADJ[curBook.madh]||''}">${esc(curBook.madh)}</span>
      <span>${esc(curBook.title)} — ${esc(curBook.author)}</span>
      <span>ص ${u.p0}${u.p1>u.p0?'–'+u.p1:''}</span>
      <span>${u.m?('علامة: '+esc(u.m)):KLBL[u.k]||''}</span>
      <span>مستوى ${u.l}</span>
    </div>
    ${u.x ? `<div class="utext">${esc(u.x)}</div>` : (nofx ? '' : '<div class="utext"><i>(عنوان بلا متن منفصل — انظر الوحدات الفرعية)</i></div>')}
    ${note}
    ${atoms}`;
  location.hash = curBook.slug+'/'+i;
}

/* ---------- بحث ---------- */
let deb;
$('#q').addEventListener('input', e=>{
  clearTimeout(deb);
  deb = setTimeout(()=>{ query = e.target.value; if(curBook) renderTree(); },200);
});

/* ---------- رابط عميق ---------- */
function fromHash(){
  const h = location.hash.match(/^#([\w_]+)\/(\d+)/);
  if (location.hash === '#topics'){ showTopics(); return; }
  const ht = location.hash.match(/^#topic\/(\d+)/);
  if (ht){ showTopic(+ht[1]); return; }
  if (h && !(curBook && curBook.slug===h[1] && curUnit===+h[2])
      && window.READER_INDEX.some(b=>b.slug===h[1])) selectBook(h[1], +h[2]);
}
window.addEventListener('hashchange', ()=>{
  if (!location.hash || location.hash === '#') { curUnit = -1; showTopics(); return; }
  fromHash();
});
const h = location.hash.match(/^#([\w_]+)\/(\d+)/);
const ht0 = location.hash.match(/^#topic\/(\d+)/);
if (location.hash === '#topics') showTopics();
else if (ht0) showTopic(+ht0[1]);
else if (h) selectBook(h[1], +h[2]);
else showTopics();
})();
