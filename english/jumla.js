/* جملة — تدريب على مستوى الجملة من الكوربس:
   (1) رتّب جمل قصة مبعثرة — تبديل بالضغط (يعمل لمساً وماوساً)
   (2) ترجم القطع — قطعة إنجليزية ← اختر معناها العربي من 3
   (3) الأنماط — أكمل بداية الجملة بنمطها الصحيح ثم اعرض أخواتها
   en_jumla = {m:{order:{n,ok},chunk:{n,ok},pat:{n,ok}}, days:{date:{n,ok}}} */
const app = document.getElementById('app');
const JKEY = 'en_jumla';

const PATS = [
{p:'It was',ss:['It was full of money and cards.','It was the beginning of her diary.','It was raining heavily when Sara left her house.','It was the heart of the village, beating every Saturday.','It was a strange week, but it ended well.']},
{p:'I will',ss:['I will think about it.','I will have the fish.','I will text you the address.','I will pick your brain on this.','I will take it.']},
{p:'Can I',ss:['Can I call you back later?','Can I go there by bus?','Can I help you find something?','Can I see the menu?','Can I return it if it does not fit?']},
{p:'I am',ss:['I am looking for a winter jacket.','I am just looking, thanks.','I am not sure I follow you.','I am swamped this week.','I am impatient with slow decisions, but I am working on it.']},
{p:'It is',ss:['It is a bit expensive.','It is a steep learning curve.','It is not that simple.','It is the walking, not the arriving, that shapes us.']},
{p:'Do you',ss:['Do you have a receipt?','Do you have this in another color?','Do you feel dizzy or tired as well?']},
{p:'Let us',ss:['Let us agree to disagree.','Let us call it a day.','Let us push the deadline to Friday.']},
{p:'The next',ss:['The next day the owner called him.','The next day, another letter waited for her.','The next morning, the whole village climbed the rock.']},
{p:'Did you',ss:['Did you make a mistake?','Did you make a decision?']},
{p:'Could you',ss:['Could you drop me off here?','Could you walk me through the plan?']},
{p:'Are you',ss:['Are you hungry?','Are you sleeping well at night?']},
{p:'What do you',ss:['What do you do for a living?','What do you recommend?']},
{p:'How much',ss:['How much is a return ticket?','How much is it after the discount?']},
{p:'Then I',ss:['Then I make a cup of coffee.','Then I walk home slowly.']},
{p:'On Friday',ss:['On Friday I go to the market.','On Friday, she heard a small cry from the old bakery.']},
{p:'This is',ss:['This is my brother.','This is Karim from the bank.']},
{p:'We have',ss:['We have lunch at noon.','We have a meeting at noon.']},
];

function loadJ(){ try{ return JSON.parse(localStorage.getItem(JKEY)||'{}'); }catch(e){ return {}; } }
function saveJ(d){ localStorage.setItem(JKEY, JSON.stringify(d)); }
function recM(m){ return (loadJ().m||{})[m]||{n:0,ok:0}; }
function hit(m,ok){
  const d = loadJ();
  (d.m ||= {}); const r = d.m[m] ||= {n:0,ok:0};
  r.n++; if(ok) r.ok++;
  (d.days ||= {}); const dd = d.days[todayISO()] ||= {n:0,ok:0};
  dd.n++; if(ok) dd.ok++;
  saveJ(d);
}
function shuf(a){ const x=[...a]; for(let i=x.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; } return x; }
const ttsOK = () => window.speechSynthesis && speechSynthesis.getVoices().some(v=>/^en/i.test(v.lang));
function say(t){ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.92; speechSynthesis.speak(u); }
if(window.speechSynthesis) speechSynthesis.onvoiceschanged = ()=>{};

/* كل جمل الكوربس للقطع */
function clipSents(){
  return (typeof CLIPS!=='undefined'?CLIPS:[]).flatMap(c=>c.sentences.map(s=>({text:s.text, words:s.words||[]})));
}

/* ---------- الرئيسية ---------- */
function viewHome(){
  const m = loadJ().m||{};
  const card = (t,desc,mode,fn)=>`<div class="card"><div class="body">
    <h3 style="direction:rtl;text-align:right">${t}</h3>
    <div class="muted" style="font-size:13px;margin:4px 0">${desc}</div>
    <div class="meta">${m[mode]?`<span>${m[mode].ok}/${m[mode].n} صحيح</span>`:'<span>لم تُجرَّب</span>'}</div>
    <button class="btn" style="margin-top:8px" onclick="${fn}">ابدأ ←</button>
  </div></div>`;
  app.innerHTML = `<div class="head"><h2>جملة — تدريب على الجملة كاملة</h2></div>
  <div class="card"><div class="body" style="text-align:center">الجملة وحدة التعلم: <b>رتّبها</b> لتبني الترتيب، <b>ترجم قطعها</b> لتبني المعنى، و<b>تعرّف أنماطها</b> لتبني الفطنة — كلها من كوربسك الحقيقي.</div></div>
  <div class="grid">
    ${card('١ · رتّب القصة','جمل قصة مبعثرة — أعدها لترتيبها بالضغط على جملتين للتبديل.','order','startOrder()')}
    ${card('٢ · ترجم القطع','قطعة من جملة حقيقية ← اختر معناها العربي من 3.','chunk','startChunk()')}
    ${card('٣ · الأنماط','أكمل بداية الجملة بنمطها الصحيح — ثم اعرض جملاً أخرى بنفس النمط.','pat','startPat()')}
  </div>
  <div class="meta" style="text-align:center;margin-top:8px">كلماتك الضعيفة في <a href="qamusi.html" style="color:var(--gold)">قاموسك ←</a></div>`;
}

/* ---------- ١ · رتّب القصة ---------- */
let oItems=[], oOrder=[], oSel=-1, oRound=0, oScore=0;
function startOrder(){ oRound=0; oScore=0; nextOrder(); }
function nextOrder(){
  const st = shuf(typeof STORIES!=='undefined'?STORIES:[])[0];
  const n = Math.min(5, st.sentences.length);
  const off = Math.max(0, Math.floor(Math.random()*(st.sentences.length-n)));
  oItems = st.sentences.slice(off,off+n).map(s=>s.en);
  oTitle = st.titleAr||st.title;
  oOrder = shuf(oItems.map((_,i)=>i));
  oSel = -1;
  drawOrder();
}
let oTitle='';
function drawOrder(res){
  app.innerHTML = `<div class="head"><h2>رتّب القصة — ${esc(oTitle)}</h2><span class="muted">مقطع ${oRound+1}/3</span></div>
  <div class="quiz"><div class="q">
    <div class="muted" style="margin-bottom:8px">اضغط جملة ثم اضغط أخرى لتبديل مكانهما — رتّب القصة كما وردت:</div>
    ${oOrder.map((si,pos)=>`<button class="obtn ${oSel===pos?'osel':''}" dir="ltr" ${res?'disabled':''} onclick="tapOrder(${pos})"><span class="onum">${pos+1}</span> ${esc(oItems[si])}</button>`).join('')}
    ${res||''}
    ${res?'':'<div class="grades"><button class="btn" onclick="checkOrder()">تحقق ←</button></div>'}
  </div></div>`;
}
function tapOrder(pos){
  if(oSel===-1){ oSel=pos; }
  else if(oSel===pos){ oSel=-1; }
  else { [oOrder[oSel],oOrder[pos]]=[oOrder[pos],oOrder[oSel]]; oSel=-1; }
  drawOrder();
}
function checkOrder(){
  const ok = oOrder.every((si,pos)=>si===pos);
  hit('order', ok);
  if(ok) oScore++;
  const right = oItems.map((s,i)=>`<div dir="ltr" style="text-align:left;margin:3px 0"><span class="onum">${i+1}</span> ${esc(s)}</div>`).join('');
  drawOrder(`<div style="margin-top:10px;color:${ok?'var(--ok)':'var(--bad)'}">${ok?'✓ ترتيب صحيح':'✗ الترتيب الصحيح:'}</div>
  ${!ok?`<div style="margin-top:6px">${right}</div>`:''}
  ${ttsOK()?`<button class="btn" style="margin-top:8px" onclick="oItems.forEach((s,i)=>setTimeout(()=>say(s),i*2200))">استمع للقصة 🔊</button>`:''}
  <button class="btn" style="display:block;margin:8px auto 0" onclick="nextOrder2()">${oRound<2?'مقطع آخر ←':'النتيجة ←'}</button>`);
}
function nextOrder2(){ oRound++; if(oRound>=3) endJ('order'); else nextOrder(); }

/* ---------- ٢ · ترجم القطع ---------- */
let cList=[], cqi=0, cScore=0;
function chunksOf(sent){
  const ws = sent.words.filter(w=>normTok(w[0]));
  const out=[];
  for(let i=0;i<ws.length;i+=3){
    const grp = ws.slice(i,i+3);
    const en = grp.map(w=>w[0]).join(' ');
    const ar = grp.map(w=>w[1]).filter(Boolean).join(' ');
    if(ar) out.push({en, ar});
  }
  return out;
}
function startChunk(){
  const pool = clipSents().filter(s=>s.words.length>=6);
  const picks = shuf(pool).slice(0,2);
  cList = [];
  picks.forEach(s=>chunksOf(s).forEach(ch=>cList.push({ch, mates:chunksOf(s)})));
  cqi=0; cScore=0; drawChunk();
}
function drawChunk(res){
  if(cqi>=cList.length){ endJ('chunk'); return; }
  const {ch,mates} = cList[cqi];
  const others = mates.filter(m=>m.ar!==ch.ar).map(m=>m.ar);
  const all = clipSents().flatMap(chunksOf).filter(x=>x.ar!==ch.ar);
  const ds = shuf(others.concat(shuf(all).slice(0,4).map(x=>x.ar))).filter((v,i,a)=>a.indexOf(v)===i).slice(0,2);
  while(ds.length<2) ds.push('معنى آخر');
  const opts = shuf([ch.ar,...ds]);
  window._copts = opts;
  app.innerHTML = `<div class="head"><h2>ترجم القطعة ${cqi+1}/${cList.length}</h2><span class="muted">صحيحة ${cScore}</span></div>
  <div class="quiz"><div class="q" style="text-align:center">
    <div dir="ltr" style="font-size:20px;font-weight:700;color:var(--gold)">${esc(ch.en)}</div>
    ${ttsOK()?`<button class="btn" style="background:var(--navy-3);color:var(--gold-soft);font-size:13px;padding:5px 12px;margin:6px 0" onclick="say('${ch.en.replace(/'/g,"\\'")}')">🔊</button>`:''}
    <div class="opts" style="justify-content:center">${opts.map(o=>`<button onclick="pickChunk(this,'${o.replace(/'/g,"\\'")}')">${o}</button>`).join('')}</div>
    <div id="cRes">${res||''}</div>
  </div></div>`;
}
function pickChunk(btn,o){
  const {ch,mates} = cList[cqi];
  const ok = o===ch.ar;
  hit('chunk',ok); if(ok) cScore++;
  document.querySelectorAll('.opts button').forEach(b=>{
    b.disabled=true;
    if(b.textContent===ch.ar) b.classList.add('right'); else if(b===btn) b.classList.add('wrong');
  });
  document.getElementById('cRes').innerHTML = `<div style="margin-top:10px">
    <div style="color:${ok?'var(--ok)':'var(--bad)'}">${ok?'✓ صحيح':'✗ المعنى: '+ch.ar}</div>
    <button class="btn" style="display:block;margin:8px auto 0" onclick="cqi++;drawChunk()">التالية ←</button></div>`;
}

/* ---------- ٣ · الأنماط ---------- */
let pQueue=[], pqi=0, pScore=0;
function startPat(){ pQueue=shuf(PATS).slice(0,8); pqi=0; pScore=0; drawPat(); }
function drawPat(){
  if(pqi>=pQueue.length){ endJ('pat'); return; }
  const it = pQueue[pqi];
  const s = shuf(it.ss)[0];
  const rest = s.slice(it.p.length).replace(/^\s+/,'');
  const others = shuf(PATS.filter(x=>x.p!==it.p)).slice(0,2).map(x=>x.p);
  window._pit = it; window._ps = s;
  app.innerHTML = `<div class="head"><h2>الأنماط ${pqi+1}/8</h2><span class="muted">صحيحة ${pScore}</span></div>
  <div class="quiz"><div class="q" style="text-align:center">
    <div class="muted" style="margin-bottom:6px">أي نمط يفتتح هذه الجملة؟</div>
    <div dir="ltr" style="font-size:19px;margin:8px 0">＿＿＿ ${esc(rest)}</div>
    <div class="opts" style="justify-content:center">${shuf([it.p,...others]).map(p=>`<button dir="ltr" onclick="pickPat(this,'${p}')">${p}</button>`).join('')}</div>
    <div id="pRes"></div>
  </div></div>`;
}
function pickPat(btn,p){
  const it = window._pit, s = window._ps;
  const ok = p===it.p;
  hit('pat',ok); if(ok) pScore++;
  document.querySelectorAll('.opts button').forEach(b=>{
    b.disabled=true;
    if(b.textContent===it.p) b.classList.add('right'); else if(b===btn) b.classList.add('wrong');
  });
  const mates = it.ss.filter(x=>x!==s).slice(0,3);
  document.getElementById('pRes').innerHTML = `<div style="margin-top:12px">
    <div style="color:${ok?'var(--ok)':'var(--bad)'}">${ok?'✓ صحيح':'✗ النمط: '+it.p}</div>
    <div dir="ltr" style="text-align:left;margin-top:6px"><b style="color:var(--gold)">${esc(it.p)}</b>${esc(s.slice(it.p.length))}</div>
    ${mates.length?`<div class="muted" style="text-align:left;font-size:13px;margin-top:8px" dir="ltr">نفس النمط:<br>${mates.map(x=>'• '+esc(x)).join('<br>')}</div>`:''}
    ${ttsOK()?`<button class="btn" style="margin-top:8px" onclick="say('${s.replace(/'/g,"\\'")}')">استمع 🔊</button>`:''}
    <button class="btn" style="display:block;margin:8px auto 0" onclick="pqi++;drawPat()">التالية ←</button></div>`;
}

/* ---------- نهاية ---------- */
function endJ(m){
  const lbl = {order:'رتّب القصة', chunk:'ترجم القطع', pat:'الأنماط'}[m];
  const sc = m==='order'?oScore:m==='chunk'?cScore:pScore;
  const tot = m==='order'?3:m==='chunk'?cList.length:8;
  app.innerHTML = `<div class="quiz"><div class="q" style="text-align:center">
    <div class="empty">انتهى وضع «${lbl}» — صحيحة ${sc}/${tot}</div>
    <div class="grades"><button class="btn" onclick="viewHome()">جملة ←</button><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="${m==='order'?'startOrder()':m==='chunk'?'startChunk()':'startPat()'}">جولة أخرى</button></div>
  </div></div>`;
}

viewHome();
