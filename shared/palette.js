/* shared/palette.js — Ctrl+K / ⌘K launcher over every tool of the manzuma */
(function(){
 if(window.__palette)return;window.__palette=1;
 const css=`
 .pal{position:fixed;inset:0;z-index:9999;background:rgba(5,8,16,.72);backdrop-filter:blur(4px);display:none}
 .pal.on{display:block}
 .pal .box{max-width:540px;margin:9vh auto 0;background:var(--card,#141b2d);border:1px solid var(--acc,#d4a94e);border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.6)}
 .pal input{width:100%;box-sizing:border-box;background:transparent;border:none;border-bottom:1px solid var(--border,#2a3550);color:var(--txt,#e8e6e1);padding:15px 18px;font-family:inherit;font-size:1rem}
 .pal input:focus{outline:none}
 .pal .list{max-height:56vh;overflow-y:auto}
 .pal .it{display:flex;gap:11px;align-items:center;padding:10px 16px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.03)}
 .pal .it.sel,.pal .it:hover{background:rgba(201,162,75,.09)}
 .pal .it .ic{font-size:18px;width:26px;text-align:center}
 .pal .it .tt{font-size:.86rem;color:var(--txt,#e8e6e1)}
 .pal .it .dd{font-size:.66rem;color:var(--dim,#8b93b0);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .pal .hint{padding:7px 16px;font-size:.6rem;color:var(--dim,#8b93b0);border-top:1px solid var(--border,#2a3550);text-align:center}`;
 const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
 const pal=document.createElement('div');pal.className='pal';
 pal.innerHTML='<div class="box"><input id="palq" placeholder="اقفز لأداة… (اكتب حرفاً فقط)"><div class="list" id="pall"></div><div class="hint">Ctrl+K للفتح · ↑↓ للاختيار · Enter للذهاب · Esc للإغلاق</div></div>';
 document.body.appendChild(pal);
 const inp=pal.querySelector('#palq'),list=pal.querySelector('#pall');
 let TOOLS=null,sel=0,items=[];
 const norm=s=>String(s||'').replace(/[ً-ْٰـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').toLowerCase();
 function load(){if(TOOLS)return TOOLS;
  const base=document.currentScript?document.currentScript.src.replace(/palette\.js.*$/,''):'../shared/';return fetch(base+'tools.json').then(r=>r.ok?r.json():[]).then(t=>TOOLS=t).catch(()=>TOOLS=[])}
 function show(){
  const q=norm(inp.value),base=location.pathname.startsWith('/des/')?'':'/des/';
  items=(q?(TOOLS||[]).filter(t=>norm(t.t+t.d).includes(q)):(TOOLS||[])).slice(0,30);
  list.innerHTML=items.map((t,i)=>`<div class="it ${i===sel?'sel':''}" data-i="${i}"><div class="ic">${t.i}</div><div style="min-width:0"><div class="tt">${t.t}</div><div class="dd">${t.d||''}</div></div></div>`).join('')||'<div class="it"><div class="dd" style="padding:10px">لا نتائج</div></div>';
 }
 function open(){load().then(()=>{pal.classList.add('on');inp.value='';sel=0;show();inp.focus()})}
 function close(){pal.classList.remove('on')}
 function go(t){if(!t)return;close();const base=location.pathname.startsWith('/des/')?'':'/des/';location.href=(t.u.startsWith('/')?t.u:base+t.u)}
 document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open();return}
  if(!pal.classList.contains('on'))return;
  if(e.key==='Escape')close();
  else if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(items.length-1,sel+1);show()}
  else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(0,sel-1);show()}
  else if(e.key==='Enter'){e.preventDefault();go(items[sel])}
 });
 inp.addEventListener('input',()=>{sel=0;show()});
 pal.addEventListener('click',e=>{if(e.target===pal)close();else{const it=e.target.closest('.it');if(it&&items[+it.dataset.i])go(items[+it.dataset.i])}});
})();
