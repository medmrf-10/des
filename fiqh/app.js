/* الفهرس القياسي — فقه | MVP renderer */
(function(){
"use strict";
const D = window.FIQH_DATA;
const $ = s => document.querySelector(s);

const norm = s => (s||'').replace(/[ً-ْٰـ]/g,'')
  .replace(/[أإآٱ]/g,'ا').replace(/[ؤئء]/g,'').replace(/ى/g,'ي').replace(/ة/g,'ه')
  .replace(/[«»()\[\]•*ـ]/g,' ').replace(/\s+/g,' ').trim();

const tagInfo = {};            // tag -> {slug, madhhab, title}
D.sources.forEach(s => tagInfo[s.tag] = s);

const MADJ = {'حنبلي':'hanbali','شافعي':'shafii','مالكي':'maliki','حنفي':'hanafi'};

/* ---------- chips ---------- */
function chip(tag){
  const info = tagInfo[tag]||{};
  const cls = MADJ[info.madhhab]||'';
  return `<span class="chip ${cls}" title="${esc(info.title||'')} — ${esc(info.madhhab||'')}">${esc(tag)}</span>`;
}
function esc(s){return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

/* ---------- books ---------- */
const booksEl = $('#books');
function renderBooks(filter=''){
  const q = norm(filter);
  let shown=0;
  booksEl.innerHTML='';
  D.books.forEach((b,i)=>{
    const babs = q ? b.babs.filter(x=>norm(x.title).includes(q)) : b.babs;
    const bookHit = !q || norm(b.title).includes(q);
    if (q && !bookHit && !babs.length) return;
    shown++;
    const el = document.createElement('article');
    el.className='book'+(q?' open':'');
    const varHtml = b.variants.length>1
      ? `<div class="variants">يُعرف في المتون بـ: ${b.variants.map(v=>`<span class="alt">«${esc(v.title)}» <span class="src-tag">(${v.srcs.map(esc).join('، ')})</span></span>`).join('')}</div>`
      : '';
    const list = (bookHit? b.babs : babs);
    el.innerHTML = `
      <button class="head">
        <span class="num">${i+1}</span>
        <span class="bname">${hl(b.title,q)}</span>
        <span class="bcount">${b.babs.length} باباً/فصلاً</span>
        <span class="caret">▾</span>
      </button>
      <div class="body">
        <div class="pres">ورد في: ${b.present.map(chip).join(' ')}</div>
        ${varHtml}
        <ul class="babs">${list.map(x=>{
          const m=x.title.match(/^(باب|فصل|كتاب|مدخل)\s+(.*)$/);
          const kind=m?`<span class="kind">${m[1]} </span>`:'';
          const txt=m?m[2]:x.title;
          return `<li><span class="btext">${kind}${hl(txt,q)}</span><span class="chips">${x.srcs.map(chip).join('')}</span></li>`;
        }).join('')}</ul>
      </div>`;
    el.querySelector('.head').addEventListener('click',()=>el.classList.toggle('open'));
    booksEl.appendChild(el);
  });
  $('#empty').hidden = shown>0;
  $('#hitCount').textContent = q ? `${shown} كتاباً` : `${D.books.length} كتاباً — ${D.books.reduce((a,b)=>a+b.babs.length,0)} بنداً`;
}
function hl(text,q){
  const e=esc(text); if(!q) return e;
  const pat=[...q].map(c=>{
    if(c===' ') return '\\s+';
    if('اأإآٱ'.includes(c)) return '[اأإآٱ]';
    if('يى'.includes(c)) return '[يى]';
    if('هة'.includes(c)) return '[هة]';
    return c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  }).join('[ؤئءـ]?')+'[ؤئءـ]?';
  return e.replace(new RegExp('('+pat+')','g'),'<span class="mark">$1</span>');
}

/* ---------- conflicts ---------- */
function renderConflicts(){
  const c=D.conflicts;
  const el=$('#conflicts');
  el.innerHTML = `
    <div class="sec"><h2>أ. أسماء مختلفة للكتاب الواحد</h2>
      ${c.variants.map(v=>`<div><span class="canon">${esc(v.canon)}</span>
        <ul class="alts">${v.alts.map(a=>`<li><span class="t">«${esc(a.title)}»</span><span class="src-tag">← ${a.srcs.map(esc).join('، ')}</span></li>`).join('')}</ul></div>`).join('')}
    </div>
    <div class="sec"><h2>ب. كتب ظاهرة عند بعض المتون فقط</h2>
      <ul>${c.rare.map(r=>`<li><span class="canon">${esc(r.canon)}</span> — <span class="src-tag">${r.srcs.map(esc).join('، ')}</span></li>`).join('')}</ul>
    </div>
    <div class="sec"><h2>ج. اختلافات ترتيب رئيسية</h2>
      <ul>${c.order_notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>
    </div>
    <div class="sec"><h2>د. عناوين لم تُسنَد لكتاب (تُركت كما هي)</h2>
      ${c.unmatched.map(u=>`<p><span class="canon">${esc(u.source)}</span> <span class="src-tag">(${esc(u.madhhab)})</span></p>
        <ul>${u.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`).join('')}
    </div>`;
}

/* ---------- sources ---------- */
function renderSources(){
  $('#sources').innerHTML = `
    <table class="srcs"><thead><tr>
      <th>المختصر</th><th>المتن</th><th>المؤلف</th><th>المذهب</th><th>وفاة</th><th>كتب مستخرجة</th>
    </tr></thead><tbody>
    ${D.sources.map(s=>`<tr>
      <td><span class="madh ${MADJ[s.madhhab]}">${esc(s.tag)}</span></td>
      <td>${esc(s.title)}</td><td>${esc(s.author)}</td>
      <td>${esc(s.madhhab)}</td><td>${esc(String(s.death))}هـ</td><td>${s.books}</td>
    </tr>`).join('')}
    </tbody></table>
    <p class="src-tag" style="margin-top:10px">نور الإيضاح والأخضري والرسالة: جداول محتوياتها ناقصة/مسطّحة في المصدر، فتغطيتها جزئية.</p>`;
}

/* ---------- tabs & events ---------- */
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===t));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id==='tab-'+t.dataset.tab));
  $('#toolbar').style.display = t.dataset.tab==='index' ? 'flex' : 'none';
}));
let to; $('#search').addEventListener('input',e=>{clearTimeout(to);to=setTimeout(()=>renderBooks(e.target.value),150)});
$('#expandAll').onclick=()=>document.querySelectorAll('.book').forEach(b=>b.classList.add('open'));
$('#collapseAll').onclick=()=>document.querySelectorAll('.book').forEach(b=>b.classList.remove('open'));

$('#sub').textContent = D.note;
renderBooks(); renderConflicts(); renderSources();
})();
