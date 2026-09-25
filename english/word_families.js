/* عائلات الكلمات — 40 عائلة حقيقية من كوربس المنصة.
   en_families = {fams:{key:{n,ok}}, days:{date:{n,ok}}} */
const app = document.getElementById('app');
const FKEY = 'en_families';

const FAMS = [
['book',['book','books','bookstore'],'كتاب/مكتبة'],
['call',['call','called','calling'],'اتصال/نداء'],
['every',['every','everyone','everywhere'],'كلّ'],
['feel',['feel','felt','feeling','feelings'],'شعور'],
['fish',['fish','fisherman','fishing'],'سمك/صيد'],
['give',['give','gives','gave','given'],'عطاء'],
['look',['looks','looked','looking'],'نظر'],
['love',['love','loved','lovely'],'حبّ'],
['own',['own','owned','owner'],'ملكية'],
['play',['plays','played','player'],'لعب'],
['rain',['rain','raining','rainy'],'مطر'],
['sleep',['sleep','sleeps','sleeping'],'نوم'],
['some',['some','someone','something','sometimes'],'بعض'],
['speak',['speak','speaker','speaking'],'كلام'],
['thank',['thank','thanked','thanks'],'شكر'],
['visit',['visit','visits','visited'],'زيارة'],
['walk',['walk','walked','walking'],'مشي'],
['week',['week','weeks','weekend','weekends'],'أسبوع'],
['work',['work','works','worked','working'],'عمل'],
['write',['writes','wrote','written','writer'],'كتابة'],
['go',['go','went','gone'],'ذهاب'],
['do',['do','does','did'],'فعل'],
['have',['have','has','had'],'امتلاك'],
['be',['be','was','were'],'كان'],
['make',['make','made'],'صنع'],
['take',['take','took'],'أخذ'],
['buy',['buy','bought'],'شراء'],
['leave',['leave','left'],'ترك/غادر'],
['find',['find','found'],'وجد'],
['tell',['tell','told'],'أخبر'],
['hear',['hear','heard'],'سمع'],
['forget',['forgot','forgotten'],'نسيان'],
['can',['can','could'],'قدرة'],
['mistake',['mistake','mistakes'],'خطأ'],
['honest',['honestly','honesty'],'صدق/أمانة'],
['patient',['patient','impatient'],'صبر'],
['strange',['strange','strangely'],'غرابة'],
['big',['big','biggest'],'كبر'],
['read',['read','readers'],'قراءة'],
['keep',['keeps','keeper'],'حفظ/حراسة'],
];

function corpus(){
  const out = [];
  (typeof CLIPS!=='undefined'?CLIPS:[]).forEach(c=>{ (c.sentences||[]).forEach(s=>out.push(s.text||'')); });
  (typeof STORIES!=='undefined'?STORIES:[]).forEach(st=>{ (st.sentences||[]).forEach(s=>out.push(s.en||'')); });
  return out.filter(Boolean);
}
const COR = corpus();
const toks = s => (s.match(/[a-zA-Z']+/g)||[]).map(normTok);

function loadF(){ try{ return JSON.parse(localStorage.getItem(FKEY)||'{}'); }catch(e){ return {}; } }
function saveF(s){ localStorage.setItem(FKEY, JSON.stringify(s)); }
const fkey = f => normTok(f[0]);
function recordF(f, ok){
  const d = loadF();
  const r = ((d.fams ||= {})[fkey(f)] ||= {n:0,ok:0});
  r.n++; if(ok) r.ok++;
  const day = ((d.days ||= {})[todayISO()] ||= {n:0,ok:0});
  day.n++; if(ok) day.ok++;
  saveF(d);
}
function fExample(w){
  for(const s of COR){
    if(toks(s).includes(normTok(w))) return s;
  }
  return null;
}
function rawTok(s, w){
  for(const t of (s.match(/[a-zA-Z']+/g)||[])){
    if(normTok(t)===normTok(w)) return t;
  }
  return null;
}
function weakestF(){
  const d = loadF();
  return FAMS.map(f=>{
    const r = (d.fams||{})[fkey(f)]||{n:0,ok:0};
    return {f, n:r.n, pct:r.n? Math.round(r.ok/r.n*100):100};
  }).filter(x=>x.n>=1 && x.pct<100).sort((a,b)=>a.pct-b.pct||b.n-a.n).slice(0,8);
}
function shuf(a){ const x=[...a]; for(let i=x.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; } return x; }

/* ---------- استعراض ---------- */
function viewHome(){
  const d = loadF();
  const t = (d.days||{})[todayISO()]||{n:0,ok:0};
  const seen = Object.values(d.fams||{}).filter(r=>r.n>0).length;
  const w = weakestF();
  app.innerHTML = `<div class="head"><h2>عائلات الكلمات — ${FAMS.length} عائلة</h2><span class="rstreak">اليوم: ${t.ok}/${t.n}</span></div>
  <div class="card"><div class="body" style="text-align:center">
    كل عائلة بجذرها وفروعها وجملة حقيقية من محتوى المنصة. ${seen?`تدرّبت على ${seen}/${FAMS.length}.`:''}
    <div class="grades" style="justify-content:center">
      <button class="btn" onclick="startFQ()">اختبار: أي فرع يناسب الفراغ (10)</button>
      ${w.length?`<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="startFQ(true)">راجع الأضعف ${w.length} ←</button>`:''}
    </div></div></div>
  <div class="grid">${FAMS.map((f,i)=>{
    const r = (d.fams||{})[fkey(f)]||{n:0,ok:0};
    return `<div class="card"><div class="body"><h3 class="en" dir="ltr" style="text-align:left">${esc(f[0])} <small style="color:var(--muted);font-weight:400">— ${esc(f[2])}</small></h3>
      <div dir="ltr" style="text-align:left;margin:6px 0">${f[1].map(x=>`<span class="fc-chip" style="margin:2px">${esc(x)}</span>`).join('')}</div>
      <div class="meta"><span>${r.n?`اختبار ${r.ok}/${r.n}`:'لم تُختبَر'}</span></div>
      <button class="btn" style="margin-top:8px" onclick="viewFam(${i})">استعرض ←</button></div></div>`;
  }).join('')}</div>`;
}
function viewFam(i){
  const f = FAMS[i];
  const r = (loadF().fams||{})[fkey(f)]||{n:0,ok:0};
  app.innerHTML = `<div class="head"><h2 class="en" dir="ltr">${esc(f[0])}</h2><button class="btn" onclick="viewHome()">العائلات ←</button></div>
  <div class="muted" style="margin-bottom:8px">${esc(f[2])} — ${r.n?`نتيجتك ${r.ok}/${r.n}`:'لم تُختبر بعد'}</div>
  ${f[1].map(w=>{
    const s = fExample(w);
    return `<div class="card"><div class="body" dir="ltr" style="text-align:left">
      <div style="font-size:19px;font-weight:700;color:var(--gold)">${esc(w)}</div>
      ${s?`<div style="margin-top:4px;font-size:15px">${esc(s).replace(rawTok(s,w)||w,'<b style="color:var(--ok)">'+esc(w)+'</b>')}</div>`:'<div class="muted">لا جملة مثال في الكوربس</div>'}
    </div></div>`;
  }).join('')}`;
}

/* ---------- اختبار: أي فرع يناسب الفراغ ---------- */
let fq = [], fi = 0, fscore = 0;
function startFQ(weak){
  fscore = 0;
  const pool = weak ? weakestF().map(x=>x.f) : shuf(FAMS);
  fq = [];
  for(const f of pool){
    for(const w of shuf(f[1])){
      const s = fExample(w);
      if(s){ fq.push({f, w, s}); break; }
    }
    if(fq.length>=10) break;
  }
  fi = 0; drawFQ();
}
function drawFQ(){
  if(fi >= fq.length){ endFQ(); return; }
  const it = fq[fi];
  const blank = it.s.replace(rawTok(it.s,it.w)||it.w, '＿＿＿');
  const others = shuf(FAMS.filter(g=>g!==it.f).map(g=>g[1][0])).slice(0,3);
  const opts = shuf([it.w, ...others]);
  app.innerHTML = `<div class="head"><h2>أي فرع يناسب؟ ${fi+1}/${fq.length}</h2><span class="muted">صحيح ${fscore}</span></div>
  <div class="quiz"><div class="q">
    <div dir="ltr" style="font-size:17px;margin:8px 0">${esc(blank)}</div>
    <div class="muted" style="font-size:13px">من عائلة «${esc(it.f[0])}» — ${esc(it.f[2])}</div>
    <div class="opts" style="justify-content:center;margin-top:10px">${opts.map(o=>`<button onclick="ansFQ(this,${o===it.w?1:0})">${esc(o)}</button>`).join('')}</div>
    <div id="fRes"></div>
  </div></div>`;
}
function ansFQ(btn, ok){
  const it = fq[fi];
  document.querySelectorAll('.opts button').forEach(b=>{ b.disabled=true; if(b===btn) b.classList.add(ok?'right':'wrong'); });
  if(!ok) document.querySelectorAll('.opts button').forEach(b=>{ if(b.textContent===it.w) b.classList.add('right'); });
  recordF(it.f, !!ok); if(ok) fscore++;
  document.getElementById('fRes').innerHTML = `<div style="margin-top:10px;color:${ok?'var(--ok)':'var(--bad)'};font-size:14px">
    ${ok?'صحيح ✓':`الصحيح: <b dir="ltr">${esc(it.w)}</b>`}
    <button class="btn" style="display:block;margin:8px auto 0" onclick="fi++;drawFQ()">${fi+1<fq.length?'التالي ←':'النتيجة ←'}</button></div>`;
}
function endFQ(){
  const w = weakestF();
  app.innerHTML = `<div class="quiz"><div class="q" style="text-align:center">
    <div class="empty">النتيجة: ${fscore}/${fq.length}</div>
    <div class="grades"><button class="btn" onclick="viewHome()">العائلات ←</button><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="startFQ()">جولة أخرى</button></div>
  </div></div>
  ${w.length?`<div class="head" style="margin-top:14px"><h2>أضعف ${w.length} عائلات</h2></div>
  <div class="card"><div class="body">${w.map(x=>`<div class="cbar"><span class="cw" dir="ltr">${esc(x.f[0])}</span><span class="ctr"><span class="cfl" style="width:${100-x.pct}%"></span></span><span class="cv">${x.pct}% (${x.n})</span></div>`).join('')}
  <div class="grades"><button class="btn" onclick="startFQ(true)">راجعها ←</button></div></div></div>`:''}`;
}

viewHome();
