const arNum=n=>Number(n).toLocaleString('ar-EG');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s||'').replace(/[ً-ْٰـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/\s+/g,' ').trim();
const BAR={'bukhari':'صحيح البخاري','muslim':'صحيح مسلم','tirmidhi':'سنن الترمذي','abi-dawud':'سنن أبي داود','nasai':'سنن النسائي','ibn-majah':'سنن ابن ماجه'};
const bucket=v=>{if(!v)return 'ns';const s=String(v);
  if(/شديد الضعف/.test(s))return 'sd';
  if(/متهم بالوضع|موضوع/.test(s))return 'mw';
  if(/متصل|صحيح/.test(s))return 'sa';
  if(/حسن/.test(s))return 'hs';
  if(/ضعيف|تعليق|إرسال|انقطاع|فيه|منكر|مجهول/.test(s))return 'df';
  return 'ot'};
let GN=null;const D={};
const stat=document.getElementById('stat'),pf=document.getElementById('pfill');
async function loadGN(){
  if(GN)return;
  stat.textContent='يُحمّل شبكة المعنى…';
  await new Promise((ok,fail)=>{const s=document.createElement('script');s.src='analysis.js';s.onload=ok;s.onerror=fail;document.head.appendChild(s);pf.style.width='60%'});
  GN=window.GIDNET;pf.style.width='100%';stat.textContent='';
}
async function loadBook(b){
  if(D[b])return D[b];
  stat.textContent='يُحمّل '+BAR[b]+'…';
  const buf=await(await fetch(b+'-det.json.gz')).arrayBuffer();
  D[b]=JSON.parse(pako.ungzip(new Uint8Array(buf),{to:'string'}));
  stat.textContent='';return D[b];
}
/* إحصاءات الكتاب — محسوبة ديناميكياً من GIDNET.g */
function bookStats(b){
  let pos=0,gids=0,reps=0;const verdicts={};
  for(const g in GN.g){
    const gg=GN.g[g];
    if(!(gg.w&&gg.w[b]))continue;
    gids++;pos+=gg.w[b].length;
    if((gg.r||0)>0)reps++;
    const k=bucket(gg.h);verdicts[k]=(verdicts[k]||0)+1;
  }
  const topV=Object.entries(verdicts).sort((a,bb)=>bb[1]-a[1])[0];
  return{pos,gids,reps,verdicts,topV:topV?topV[0]:'ns',topN:topV?topV[1]:0};
}
const HB={sa:'صحيح/متصل',hs:'حسن',df:'ضعيف',sd:'شديد الضعف',mw:'موضوع/متهم',ot:'أخرى',ns:'بلا حكم'};
let ST={},OPEN=new Set();
function paint(){
  const q=norm(document.getElementById('q').value);
  const books=(GN.meta.books||[]).filter(b=>!q||norm(BAR[b]).includes(q)||norm(b).includes(q));
  document.getElementById('main').innerHTML=books.map(b=>{
    const s=ST[b];
    return `<div class="book" id="bk-${b}">
    <div class="hd" onclick="toggleBook('${b}')">
      <div><h3>${BAR[b]}</h3><div class="mut" style="font-size:11px">${b}</div></div>
      <span class="mut">${OPEN.has(b)?'▾ اطوِ':'▸ افتح'}</span></div>
    <div class="stats">
      <span class="st">مواضع: <b>${arNum(s.pos)}</b></span>
      <span class="st">معانٍ: <b>${arNum(s.gids)}</b></span>
      <span class="st">متكررات: <b>${arNum(s.reps)}</b></span>
      <span class="st">الحكم الغالب: <b class="bdg v-${s.topV}">${HB[s.topV]}</b> <span class="mut">${arNum(s.topN)}</span></span>
    </div>
    <div class="first10" id="f-${b}" ${OPEN.has(b)?'':'hidden'}></div>
  </div>`;
  }).join('');
  for(const b of OPEN)fill10(b);
}
window.toggleBook=async function(b){
  if(OPEN.has(b)){OPEN.delete(b);paint();return}
  OPEN.add(b);paint();
};
async function fill10(b){
  const el=document.getElementById('f-'+b);if(!el)return;
  el.innerHTML='<div class="mut">يُحمّل أول ١٠ أحاديث…</div>';
  const j=await loadBook(b);
  const nums=Object.keys(j.d).map(Number).sort((a,c)=>a-c).slice(0,10);
  el.innerHTML=nums.map(n=>{
    const raw=j.s[n]||[];const ch=Array.isArray(raw[0])?raw[0]:raw;
    return `<div class="hrow"><span class="nm">#${arNum(n)}</span>
      <span class="tx">${esc(j.d[n].m.slice(0,110))}${j.d[n].m.length>110?'…':''}</span>
      <span class="bdg v-${bucket(ch&&ch[0])}">${esc((ch&&ch[0])||'—')}</span>
      <a href="matn.html#${b}:${n}">المتن ←</a></div>`;
  }).join('');
}
document.getElementById('q').addEventListener('input',()=>{if(GN)paint()});
document.getElementById('fchips').innerHTML='';
(async()=>{
  await loadGN();
  for(const b of GN.meta.books)ST[b]=bookStats(b);
  paint();
})();
