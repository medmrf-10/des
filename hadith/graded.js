const arNum=n=>Number(n).toLocaleString('ar-EG');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s||'').replace(/[ً-ْٰـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/\s+/g,' ').trim();
const BAR={'bukhari':'صحيح البخاري','muslim':'صحيح مسلم','tirmidhi':'سنن الترمذي','abi-dawud':'سنن أبي داود','nasai':'سنن النسائي','ibn-majah':'سنن ابن ماجه'};
const bucket=v=>{if(!v)return 'ns';const s=String(v);
  if(/منكر/.test(s))return 'df';           // منكر → ضعيف الشدة
  if(/شديد الضعف/.test(s))return 'sd';
  if(/متهم بالوضع|موضوع/.test(s))return 'mw';
  if(/متصل|صحيح/.test(s))return 'sa';
  if(/حسن/.test(s))return 'hs';
  if(/ضعيف|تعليق|إرسال|انقطاع|فيه|مجهول/.test(s))return 'df';
  return 'ot'};
const HBL={sa:'صحيح/متصل',hs:'حسن',df:'ضعيف',sd:'شديد الضعف',mw:'موضوع/متهم',ot:'أخرى',ns:'بلا حكم'};
let GN=null;const D={};let PAGE=0;const PER=60;
const stat=document.getElementById('stat'),pf=document.getElementById('pfill');
async function loadGN(){
  if(GN)return;
  stat.textContent='يُحمّل شبكة المعنى…';
  await new Promise((ok,fail)=>{const s=document.createElement('script');s.src='analysis.js';s.onload=ok;s.onerror=fail;document.head.appendChild(s);pf.style.width='60%'});
  GN=window.GIDNET;pf.style.width='100%';stat.textContent='';
}
async function loadBook(b){
  if(D[b])return D[b];
  const buf=await(await fetch(b+'-det.json.gz')).arrayBuffer();
  D[b]=JSON.parse(pako.ungzip(new Uint8Array(buf),{to:'string'}));
  return D[b];
}
function filtered(){
  const q=norm(document.getElementById('q').value);
  const fh=document.getElementById('fh').value;
  const fj=document.getElementById('fj').value;
  const fb=document.getElementById('fb').value;
  const fr=+document.getElementById('fr').value||0;
  const out=[];
  for(const gid in GN.g){
    const g=GN.g[gid];
    if(fr&&!(g.r>=fr))continue;
    if(fh&&bucket(g.h)!==fh)continue;
    if(fb&&!(g.w&&g.w[fb]))continue;
    if(fj){
      let hit=false;
      if(g.j)for(const b in g.j)for(const n in g.j[b])
        if(g.j[b][n].some(v=>fj==='__any'?v&&v!=='—':bucket(v)===fj)){hit=true;break}
      if(!hit)continue;
    }
    if(q&&!norm(g.t).includes(q))continue;
    out.push([gid,g]);
  }
  const ord={sa:0,hs:1,df:2,sd:3,mw:4,ot:5,ns:6};
  out.sort((a,b)=>(ord[bucket(a[1].h)]??9)-(ord[bucket(b[1].h)]??9)||(b[1].r||0)-(a[1].r||0));
  return out;
}
function summarize(list){
  const dist={};
  for(const[,g]of list)dist[bucket(g.h)]=(dist[bucket(g.h)]||0)+1;
  document.getElementById('sum').innerHTML=
    `المعاني المطابقة: <b>${arNum(list.length)}</b> — `+
    Object.entries(dist).map(([k,n])=>`${HBL[k]}: <b>${arNum(n)}</b>`).join(' · ');
}
async function paint(more){
  if(!more)PAGE=0;
  const list=filtered();if(!more)summarize(list);
  const sl=list.slice(PAGE*PER,(PAGE+1)*PER);
  const books=new Set();for(const[,g]of sl)for(const b in(g.w||{}))books.add(b);
  for(const b of books)await loadBook(b);
  const html=sl.map(([gid,g])=>{
    const bk=Object.keys(g.w||{}),n0=bk.length&&g.w[bk[0]][0];
    const mat=(n0!=null&&D[bk[0]]&&D[bk[0]].d[n0])?D[bk[0]].d[n0].m:g.t;
    const jvs=new Set();if(g.j)for(const b in g.j)for(const n in g.j[b])for(const v of g.j[b][n])jvs.add(v);
    return `<div class="hrow"><div class="tx">${esc(String(mat).slice(0,180))}${String(mat).length>180?'…':''}</div>
    <div class="meta"><span class="bdg v-${bucket(g.h)}">${esc(g.h)}</span>
    <span class="mini">${bk.map(b=>BAR[b]).join(' · ')} · صحابة ${arNum(g.s||0)} · ورود ${arNum(g.r||0)}</span>
    ${jvs.size?`<span class="mini">آراء: ${[...jvs].slice(0,3).map(esc).join('، ')}${jvs.size>3?'…':''}</span>`:''}
    <span class="mini"><a href="matn.html#${bk[0]}:${n0}">المتن ←</a> <a href="net.html#g${gid}">الشبكة ←</a></span></div></div>`;
  }).join('');
  const main=document.getElementById('main');
  if(more)main.insertAdjacentHTML('beforeend',html);else main.innerHTML=html;
  const moreBtn=document.getElementById('mre');
  if((PAGE+1)*PER<list.length){
    if(!moreBtn)main.insertAdjacentHTML('beforeend',`<button class="more" id="mre" onclick="paint(1);this.remove()">عرض المزيد (${arNum(list.length-(PAGE+1)*PER)})</button>`);
    else moreBtn.textContent=`عرض المزيد (${arNum(list.length-(PAGE+1)*PER)})`;
    PAGE++;
  }else if(moreBtn)moreBtn.remove();
}
window.paint=paint;
for(const id of['q','fh','fj','fb','fr'])
  document.getElementById(id).addEventListener('input',()=>{if(GN)paint(0)});
(async()=>{
  await loadGN();
  const fh=document.getElementById('fh');
  for(const k of['sa','hs','df','sd','mw','ot','ns'])
    fh.insertAdjacentHTML('beforeend',`<option value="${k}">${HBL[k]}</option>`);
  const fj=document.getElementById('fj');
  for(const k of['sa','hs','df','sd','mw','ot'])
    fj.insertAdjacentHTML('beforeend',`<option value="${k}">${HBL[k]}</option>`);
  const fb=document.getElementById('fb');
  for(const b of GN.meta.books)
    fb.insertAdjacentHTML('beforeend',`<option value="${b}">${BAR[b]}</option>`);
  paint(0);
})();
