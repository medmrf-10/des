/* الفهرس العام — أصول الفقه (عينة كتابين) */
(function(){
'use strict';
const IDX = window.F2_INDEX;
const UNITS = {waraqat: window.F2_UNITS_WARAQAT, usul: window.F2_UNITS_USUL};
const BYSID = {};
for(const k in UNITS){
  BYSID[k] = {};
  for(const u of UNITS[k]) if(u.sid != null) BYSID[k][u.sid] = u;
}
const BKS = ['waraqat','usul'];

const $ = s => document.querySelector(s);
const norm = s => (s||'').normalize('NFKD').replace(/[ً-ْٰـ]/g,'');

/* ---------- إحصاء ---------- */
(function(){
  const st = IDX.stats;
  $('#stats').innerHTML =
    `<div class="stat"><b>${IDX.total_nodes}</b>عقدة في الفهرس</div>` +
    BKS.map(k=>{
      const s = st[k], b = IDX.books[k];
      return `<div class="stat"><b>${s.coverage}%</b>${b.title}<br><span style="font-size:.62rem">●${s.exact} مستقلة · ◐${s.approx} داخل وحدة · —${s.missing} غائبة</span></div>`;
    }).join('');
  $('#legend').innerHTML = BKS.map(k=>`<b><span class="bdg e">●</span> ${IDX.books[k].title}: وحدة مستقلة · <span class="bdg a">◐</span> داخل وحدة · <span class="bdg m">—</span> غير مبحوث</b>`).join('');
})();

/* ---------- الشجرة ---------- */
const treeEl = $('#tree');
let sel = null;

function badges(n){
  return BKS.map(k=>{
    const L = n.links && n.links[k];
    const c = L ? (L.approx ? 'a' : 'e') : 'm';
    const ch = L ? (L.approx ? '◐' : '●') : '—';
    return `<span class="bdg ${c}" title="${IDX.books[k].title}: ${L?(L.approx?'داخل وحدة أوسع':'وحدة مستقلة'):'غير مبحوث'}">${ch}</span>`;
  }).join('');
}

function renderNode(n, depth, host){
  const box = document.createElement('div');
  box.className = 'tnode';
  const kids = n.ch || [];
  const row = document.createElement('div');
  row.className = 'trow';
  row.dataset.id = n.id;
  row.innerHTML =
    `<span class="tgl">${kids.length ? '▾' : ''}</span><span class="tt">${esc(n.t)}</span>` +
    badges(n);
  row.onclick = () => { select(n.id); };
  const tgl = row.querySelector('.tgl');
  if(kids.length){
    tgl.onclick = ev => { ev.stopPropagation(); chBox.classList.toggle('open'); tgl.textContent = chBox.classList.contains('open') ? '▾' : '▸'; };
  }
  box.appendChild(row);
  const chBox = document.createElement('div');
  chBox.className = 'ch' + (depth === 0 ? ' open' : '');
  for(const c of kids) renderNode(c, depth+1, chBox);
  box.appendChild(chBox);
  host.appendChild(box);
  return box;
}
function esc(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

const ALL = [];
(function collect(list){ for(const n of list){ ALL.push(n); collect(n.ch||[]); } })(IDX.tree);
for(const t of IDX.tree) renderNode(t, 0, treeEl);

/* ---------- القارئ ---------- */
function card(bk, sid, approx){
  const u = BYSID[bk][sid], b = IDX.books[bk];
  return `<div class="bcard">
    <div class="bh"><span class="bt">${esc(b.title)} — ${esc(b.author)}</span>
      <span class="pg">ص ${u.p}</span>
      <span class="kt ${approx?'a':'e'}">${approx?'◐ داخل وحدة أوسع':'● وحدة مستقلة'}</span></div>
    <div class="bh" style="border-bottom-style:dashed"><span class="pg" style="font-size:.74rem;color:var(--acc2)">عنوان الوحدة في الكتاب: «${esc(u.t)}»</span></div>
    <div class="txt">${esc(u.text)}</div>
    ${approx ? `<div class="cap">الموضوع لا يملك عنواناً مستقلاً في هذا الكتاب — نصّه داخل هذه الوحدة.</div>` : ''}
  </div>`;
}

function select(id){
  const n = ALL.find(x => x.id === id);
  if(!n) return;
  sel = id;
  document.querySelectorAll('.trow.on').forEach(e => e.classList.remove('on'));
  const row = document.querySelector(`.trow[data-id="${CSS.escape(id)}"]`);
  if(row){ row.classList.add('on'); openAncestors(row); }
  history.replaceState(null, '', '#' + id);
  let html = `<div class="nt">${esc(n.t)}</div><div class="nid">${esc(n.id)}</div>`;
  for(const bk of BKS){
    const L = n.links && n.links[bk];
    if(!L) html += `<div class="nolink">${esc(IDX.books[bk].title)}: هذا الموضوع غير مبحوث في الكتاب.</div>`;
    else html += L.u.map(sid => card(bk, sid, L.approx)).join('');
  }
  if(n.ch && n.ch.length){
    html += `<div style="margin-top:6px;font-size:.74rem;color:var(--dim)">فروع هذا الموضوع: ` +
      n.ch.map(c=>`<a href="#${c.id}" style="color:var(--acc3)" onclick="return go('${c.id}')">${esc(c.t)}</a>`).join(' · ') + `</div>`;
  }
  $('#reader').innerHTML = html;
}
window.go = id => { select(id); return false; };

function openAncestors(row){
  let b = row.closest('.tnode');
  while(b && b.parentElement && b.parentElement.classList.contains('ch')){
    b.parentElement.classList.add('open');
    b = b.parentElement.closest('.tnode');
  }
}

/* ---------- بحث ---------- */
$('#q').addEventListener('input', ev => {
  const q = norm(ev.target.value.trim());
  document.querySelectorAll('.tnode').forEach(el => {
    const row = el.querySelector(':scope > .trow');
    const id = row.dataset.id;
    const n = ALL.find(x => x.id === id);
    const hit = !q || norm(n.t).includes(q);
    const desc = !q || hasHit(n, q);
    el.style.display = desc ? '' : 'none';
    if(q && desc) el.querySelectorAll(':scope > .ch').forEach(c=>c.classList.add('open'));
    row.querySelector('.tt').innerHTML = hit ? hi(n.t, q) : esc(n.t);
  });
});
function hasHit(n, q){ return norm(n.t).includes(q) || (n.ch||[]).some(c=>hasHit(c,q)); }
function hi(t, q){
  const idx = norm(t).indexOf(q);
  if(idx < 0) return esc(t);
  return esc(t.slice(0,idx)) + '<mark>' + esc(t.slice(idx, idx+q.length)) + '</mark>' + esc(t.slice(idx+q.length));
}

/* ---------- روابط عميقة ---------- */
const h = location.hash.slice(1);
if(h) select(h);
window.addEventListener('hashchange', () => select(location.hash.slice(1)));
})();
