/* الفهرس العام — مصطلح الحديث (عينة ثانية): شجرة ← ذرات سلسلتي 775/776 بمواضع chars */
(function(){
'use strict';
const $ = s => document.querySelector(s);
const norm = s => (s||'').normalize('NFKD').replace(/[ً-ْٰـ]/g,'');
const esc = s => { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; };
const SRC_DIR = '../../src/transcripts/';

let NODES, LINKS, BYSRC, BYNODE;

Promise.all([
  fetch('data/hadith_nodes.json').then(r=>r.json()),
  fetch('data/hadith_links.json').then(r=>r.json()),
]).then(([nd, lk])=>{
  NODES = nd; LINKS = lk;
  BYSRC = nd._sources;
  BYNODE = {};
  for(const l of lk.links) (BYNODE[l.node] ||= []).push(l);
  buildStats(); buildTree();
  const h = location.hash.slice(1); if(h) select(h);
});

const SKS = ['s775','s776'];
const fileCache = {};
function seg(l){
  const dir = SRC_DIR + BYSRC[l.series].series + '/';
  const url = dir + l.file.split('/').map(encodeURIComponent).join('/');
  return (fileCache[url] ||= fetch(url).then(r=>r.text()))
    .then(t => t.slice(l.char_start, l.char_end));
}

function badge(n, sk){
  const ls = (BYNODE[n.id]||[]).filter(l=>l.series===sk);
  const c = !ls.length ? 'm' : (ls.some(l=>l.kind==='loc') ? 'e' : 'a');
  const ch = c==='e'?'●':c==='a'?'◐':'—';
  const lbl = c==='e'?'ذرات مخصّصة':c==='a'?'داخل ذرات مغايرة العنوان':'غير مبحوث';
  return `<span class="bdg ${c}" title="${esc(BYSRC[sk].title)}: ${lbl}">${ch}</span>`;
}

const ALL = [];
function collect(list){ for(const n of list){ ALL.push(n); collect(n.ch||[]); } }

function buildStats(){
  collect(NODES.tree);
  const st = LINKS.stats;
  $('#stats').innerHTML =
    `<div class="stat"><b>${st.nodes_total}</b>عقدة في الفهرس</div>` +
    `<div class="stat"><b>${st.links_total}</b>رابطاً بموضع chars</div>` +
    SKS.map(k=>{
      const s = st[k], b = BYSRC[k];
      return `<div class="stat"><b>${s.coverage_atoms_pct}%</b>${b.title}<br><span style="font-size:.62rem">●${s.loc} · ◐${s.via} · من ${s.atoms_total} ذرة</span></div>`;
    }).join('');
  $('#legend').innerHTML = SKS.map(k=>`<b><span class="bdg e">●</span> ${esc(BYSRC[k].title)} · <span class="bdg a">◐</span> داخل ذرة أخرى · <span class="bdg m">—</span> غير مبحوث</b>`).join('');
}

function renderNode(n, depth, host){
  const box = document.createElement('div');
  box.className = 'tnode';
  const kids = n.ch || [];
  const row = document.createElement('div');
  row.className = 'trow'; row.dataset.id = n.id;
  row.innerHTML = `<span class="tgl">${kids.length ? (depth === 0 ? '▾' : '▸') : ''}</span><span class="tt">${esc(n.t)}</span>` + badge(n,'s775') + badge(n,'s776');
  row.onclick = () => select(n.id);
  box.appendChild(row);
  const chBox = document.createElement('div');
  chBox.className = 'ch' + (depth === 0 ? ' open' : '');
  if(kids.length){
    row.querySelector('.tgl').onclick = ev => { ev.stopPropagation(); chBox.classList.toggle('open'); row.querySelector('.tgl').textContent = chBox.classList.contains('open') ? '▾' : '▸'; };
  }
  for(const c of kids) renderNode(c, depth+1, chBox);
  box.appendChild(chBox);
  host.appendChild(box);
}
function buildTree(){ for(const t of NODES.tree) renderNode(t, 0, $('#tree')); }

function card(l){
  const b = BYSRC[l.series];
  const el = document.createElement('div');
  el.className = 'bcard';
  el.innerHTML = `<div class="bh"><span class="bt">${esc(l.atom_title)}</span>
    <span class="pg">${esc(b.title)} — ${esc(b.sheikh)}</span>
    <span class="kt ${l.kind==='loc'?'e':'a'}">${l.kind==='loc'?'● ذرة مخصّصة':'◐ داخل ذرة مغايرة'}</span></div>
    <div class="txt">…</div>
    <div class="cap">${esc(l.file)} · chars ${l.char_start}–${l.char_end} (${l.chars} حرفاً)</div>`;
  seg(l).then(t => {
    const txt = el.querySelector('.txt');
    txt.textContent = t.length > 1200 ? t.slice(0,1200) + ' …' : t;
  }).catch(()=>{ el.querySelector('.txt').textContent = '(تعذر تحميل نص الذرة — يعمل العرض عبر خادم ملفات محلي)'; });
  return el;
}

function select(id){
  const n = ALL.find(x => x.id === id);
  if(!n) return;
  document.querySelectorAll('.trow.on').forEach(e => e.classList.remove('on'));
  const row = document.querySelector(`.trow[data-id="${CSS.escape(id)}"]`);
  if(row){ row.classList.add('on'); openAncestors(row); }
  history.replaceState(null, '', '#' + id);
  const R = $('#reader');
  R.innerHTML = `<div class="nt">${esc(n.t)}</div><div class="nid">${esc(n.id)}</div>`;
  for(const sk of SKS){
    const ls = (BYNODE[id]||[]).filter(l=>l.series===sk);
    if(!ls.length) R.insertAdjacentHTML('beforeend', `<div class="nolink">${esc(BYSRC[sk].title)}: غير مبحوث في هذه السلسلة.</div>`);
    else ls.forEach(l => R.appendChild(card(l)));
  }
  if(n.ch && n.ch.length){
    R.insertAdjacentHTML('beforeend', `<div style="margin-top:6px;font-size:.74rem;color:var(--dim)">فروع هذا الموضوع: ` +
      n.ch.map(c=>`<a href="#${c.id}" style="color:var(--acc3)">${esc(c.t)}</a>`).join(' · ') + `</div>`);
  }
}

function openAncestors(row){
  let b = row.closest('.tnode');
  while(b && b.parentElement && b.parentElement.classList.contains('ch')){
    b.parentElement.classList.add('open');
    b = b.parentElement.closest('.tnode');
  }
}

$('#q').addEventListener('input', ev => {
  const q = norm(ev.target.value.trim());
  document.querySelectorAll('.tnode').forEach(el => {
    const row = el.querySelector(':scope > .trow');
    const n = ALL.find(x => x.id === row.dataset.id);
    const isHit = !q || norm(n.t).includes(q);
    const desc = !q || hasHit(n, q);
    el.style.display = desc ? '' : 'none';
    if(q && desc) el.querySelectorAll(':scope > .ch').forEach(c=>c.classList.add('open'));
    row.querySelector('.tt').innerHTML = isHit ? hit(n,q) : esc(n.t);
  });
});
function hasHit(n,q){ return norm(n.t).includes(q) || (n.ch||[]).some(c=>hasHit(c,q)); }
function hit(n,q){
  const i = norm(n.t).indexOf(q);
  if(!q || i < 0) return esc(n.t);
  return esc(n.t.slice(0,i)) + '<mark>' + esc(n.t.slice(i, i+q.length)) + '</mark>' + esc(n.t.slice(i+q.length));
}
window.addEventListener('hashchange', () => select(location.hash.slice(1)));
})();
