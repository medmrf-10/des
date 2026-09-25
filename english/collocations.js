/* التراكيب — توليفات طبيعية من جملك: أكثر 12 كلمة بنكية تكراراً ← concordance (جيران الكلمة
   + جملها الحقيقية) ← دريل أكمل-الفراغ. en_coll = {days:{date:{n,ok}}, words:{tok:{n,ok}}} */
const app = document.getElementById('app');
const CKEY = 'en_coll';
const FN = new Set('the a an and or but of in on at to for with from by as is are was were be been i you he she it we they my your his her our their this that these those not no do does did have has had will would can could should may might'.split(' '));

function loadC(){ try{ return JSON.parse(localStorage.getItem(CKEY)||'{}'); }catch(e){ return {}; } }
function saveC(c){ localStorage.setItem(CKEY, JSON.stringify(c)); }
function corpus(){
  const out = [];
  for(const c of CLIPS) (c.sentences||[]).forEach(s=>out.push({en:s.text, src:c.title}));
  for(const st of STORIES) st.sentences.forEach(s=>out.push({en:s.en, src:st.titleAr}));
  return out;
}
function toks(s){ return (s.match(/[a-zA-Z']+/g)||[]).map(normTok).filter(Boolean); }
function rawtoks(s){ return (s.match(/[a-zA-Z']+/g)||[]); }
/* أكثر كلمات البنك حضوراً في الجمل */
function top12(){
  const bank = Object.keys(loadBank());
  const freq = {};
  for(const s of corpus()) for(const t of new Set(toks(s.en)))
    if(bank.includes(t) && !FN.has(t) && t.length>2) freq[t] = (freq[t]||0)+1;
  let list = Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  if(list.length < 12){
    const wf = {};
    for(const s of corpus()) for(const t of new Set(toks(s.en)))
      if(!FN.has(t) && t.length>3 && !list.includes(t)) wf[t] = (wf[t]||0)+1;
    list = list.concat(Object.entries(wf).sort((a,b)=>b[1]-a[1]).map(x=>x[0]));
  }
  return list.slice(0,12);
}
/* جيران الكلمة عبر الجمل */
function collates(tok){
  const L = {}, R = {}, sents = [];
  for(const s of corpus()){
    const ts = toks(s.en);
    const ix = ts.indexOf(tok);
    if(ix<0) continue;
    sents.push(s);
    const l = ts[ix-1], r = ts[ix+1];
    if(l && !FN.has(l)) L[l] = (L[l]||0)+1;
    if(r && !FN.has(r)) R[r] = (R[r]||0)+1;
  }
  const sort = o => Object.entries(o).sort((a,b)=>b[1]-a[1]);
  return {left:sort(L).slice(0,4), right:sort(R).slice(0,4), sents:sents.slice(0,4)};
}
function hi(sent, tok){
  /* يظلّل أول ظهور للكلمة */
  const re = new RegExp(`\\b(${tok.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})\\b`, 'i');
  return esc(sent).replace(re, '<b style="color:var(--gold)">$1</b>');
}
function todayColl(){ const c=loadC(); return (c.days||{})[todayISO()]||{n:0,ok:0}; }

/* ---------- الرئيسية ---------- */
function viewHome(){
  const list = top12();
  const c = loadC(), t = todayColl();
  app.innerHTML = `<div class="grades" style="margin-bottom:10px"><button class="btn" style="background:var(--gold);color:#1a2340">سياق الكلمات</button><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewPairs()">اصطلاحات (50) ←</button></div>
  <div class="head"><h2>التراكيب — 12 كلمة</h2><span class="rstreak">اليوم: ${t.ok}/${t.n} صحيح</span></div>
  <div class="grid">${list.map(t=>{
    const w = c.words?.[t]||{n:0,ok:0};
    return `<div class="card"><div class="body"><h3 class="en" dir="ltr" style="text-align:left">${esc(t)}</h3>
      <div class="meta"><span>${w.n?`دريل ${w.ok}/${w.n}`:'لم يُدرَّب'}</span></div>
      <button class="btn" style="margin-top:8px" onclick="viewWord('${t}')">تراكيبها ←</button></div></div>`;
  }).join('')}</div>
  <div class="rlnks" style="margin-top:18px"><a href="vocab.html">مفرداتي</a><a href="library.html">الفهرس</a><a href="practice.html">تمرين اليوم</a></div>`;
}
/* ---------- عرض سياقي ---------- */
let wcur = null;
function viewWord(tok){
  wcur = tok;
  const cl = collates(tok);
  const chip = ([w,n])=>`<span class="w" style="cursor:default">${esc(w)} ×${n}</span>`;
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2 class="en" dir="ltr">${esc(tok)}</h2><span style="color:var(--muted)">${cl.sents.length} سياق</span></div>
  <div class="q">
    ${cl.left.length? `<div style="margin-bottom:8px"><span style="color:var(--muted);font-size:12px">قبلها غالباً:</span> ${cl.left.map(chip).join(' ')} <span class="w" style="cursor:default;background:var(--gold);color:#1a2340">${esc(tok)}</span></div>`:''}
    ${cl.right.length? `<div style="margin-bottom:12px"><span class="w" style="cursor:default;background:var(--gold);color:#1a2340">${esc(tok)}</span> <span style="color:var(--muted);font-size:12px">ثم بعدها:</span> ${cl.right.map(chip).join(' ')}</div>`:''}
    <div style="border-top:1px solid var(--navy-3);padding-top:10px">
      ${cl.sents.map(s=>`<div class="en" dir="ltr" style="font-size:16px;margin:8px 0;text-align:left;line-height:1.8">${hi(s.en,tok)}</div>`).join('')}
    </div>
    <div class="grades" style="margin-top:12px">
      <button class="btn" onclick="startDrill('${tok}')">دريل الفراغ ←</button>
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewHome()">الكلمات ←</button>
    </div>
    <div id="dZone"></div>
  </div></div>`;
}
/* ---------- دريل أكمل الفراغ ---------- */
let dq = [], di = 0;
function startDrill(tok){
  /* جمل تحوي tok بجار محتوى (يميني مفضّل ثم يساري) — الفراغ على الجار */
  const items = [];
  for(const s of corpus()){
    const ts = toks(s.en), ix = ts.indexOf(tok);
    if(ix<0) continue;
    const r = ts[ix+1], l = ts[ix-1];
    let blank = null, bix = -1;
    if(r && !FN.has(r) && r.length>2){ blank = r; bix = ix+1; }
    else if(l && !FN.has(l) && l.length>2){ blank = l; bix = ix-1; }
    if(blank) items.push({en:s.en, src:s.src, blank, raw:rawtoks(s.en), rix:bix});
  }
  dq = items.slice(0,5); di = 0;
  drawDrill();
}
function drawDrill(){
  if(!dq.length){
    app.querySelector('#dZone').innerHTML = `<div class="empty" style="margin-top:10px">لا فراغات متاحة لهذه الكلمة.</div>`;
    return;
  }
  if(di >= dq.length){
    const c = todayColl();
    app.querySelector('#dZone').innerHTML = `<div class="empty" style="margin-top:12px">انتهى الدريل — ${dq.length} فراغات. اليوم: ${c.ok}/${c.n} صحيح.</div>`;
    return;
  }
  const it = dq[di];
  /* النص بالفراغ: استبدل ظهور الجار بـ____ */
  const parts = it.raw.map(w=>w);
  parts[it.rix] = '<span style="color:var(--gold);letter-spacing:2px">＿＿＿＿</span>';
  app.querySelector('#dZone').innerHTML = `<div class="card" style="margin-top:12px"><div class="body">
    <div class="meta"><span>فراغ ${di+1}/${dq.length}</span><span>${esc(it.src)}</span></div>
    <div class="en" dir="ltr" style="font-size:16px;margin:10px 0;text-align:left;line-height:1.8">${parts.map(x=>x.startsWith('<span')?x:esc(x)).join(' ')}</div>
    <div style="display:flex;gap:8px;align-items:center">
      <input id="blankIn" dir="ltr" style="flex:1;background:var(--navy-2);color:var(--ink);border:1px solid var(--navy-3);border-radius:8px;padding:8px 10px;font-size:15px" placeholder="الكلمة الناقصة…">
      <button class="btn" onclick="checkBlank()">تحقق ←</button>
    </div>
    <div id="bRes"></div>
  </div></div>`;
  const inp = app.querySelector('#blankIn');
  inp.focus();
  inp.onkeydown = e=>{ if(e.key==='Enter') checkBlank(); };
}
function checkBlank(){
  const it = dq[di];
  const u = normTok(document.getElementById('blankIn').value);
  const ok = u === it.blank || (u.length>2 && wmatch(it.blank,u)>=1);
  const c = loadC(); const day = ((c.days ||= {})[todayISO()] ||= {n:0,ok:0});
  day.n++; if(ok) day.ok++;
  const w = ((c.words ||= {})[wcur] ||= {n:0,ok:0});
  w.n++; if(ok) w.ok++;
  saveC(c);
  document.getElementById('bRes').innerHTML = `<div style="margin-top:8px;color:${ok?'var(--ok)':'var(--bad)'};font-size:14px">
    ${ok? 'صحيح ✓' : `خطأ — التركيب: <b class="en" dir="ltr">${esc(wcur)} ${esc(it.blank)}</b>`}</div>`;
  di++;
  setTimeout(drawDrill, ok?700:1400);
}

/* ============ الاصطلاحات — 50 زوجاً لفظياً حقيقياً من الكوربس ============
   en_colloc = {pairs:{key:{n,ok}}, days:{date:{n,ok}}} */
const PKEY = 'en_colloc';
const PAIRS = [
['make coffee','يعدّ قهوة',0],['brush teeth','يفرّش أسنانه',0],['wash face','يغسل وجهه',0],['wake up','يستيقظ',0],
['leave house','يغادر البيت',0],['read book','يقرأ كتاباً',0],['go market','يذهب للسوق',0],['buy apples','يشتري تفاحاً',0],
['buy tomatoes','يشتري طماطم',0],['pay man','يدفع للرجل',0],['walk home','يمشي للبيت',0],['walk slowly','يمشي ببطء',0],
['found wallet','وجد محفظة',0],['took wallet','أخذ المحفظة',0],['gave gift','أعطاه هدية',0],['welcomed warmly','رحّبوا بحرارة',0],
['learned work','تعلّمت العمل',0],['made mistakes','ارتكب أخطاء',0],['trains people','تدرب الناس',0],['opened drawer','فتح الدرج',0],
['never sent','لم يُرسلها',0],['gives milk','يعطيها حليباً',0],['plays ball','يلعب بالكرة',0],['can help','يستطيع المساعدة',0],
['looked inside','نظر داخلها',0],['cat sleeps','القطة تنام',1],['bus late','الباص يتأخر',1],['owner called','المالك اتصل',1],
['old man','الرجل العجوز',0],['small cat','قطة صغيرة',0],['red ball','كرة حمراء',0],['new job','عمل جديد',0],
['old photo','صورة قديمة',0],['third floor','الطابق الثالث',0],['many mistakes','أخطاء كثيرة',0],['patient manager','مدير صبور',0],
['blue notebook','دفتر أزرق',0],['little boy','ولد صغير',0],['dusty drawer','درج مُغبر',0],['cheap apples','تفاح رخيص',0],
['free bag','كيس مجاني',0],['every day','كل يوم',0],['next day','اليوم التالي',0],['first time','أول مرة',0],
['three days','ثلاثة أيام',0],['five years','خمس سنوات',0],['had never','لم يحدث أن',0],['under trees','تحت الأشجار',0],
['every saturday','كل سبت',0],['bus stop','موقف الباص',0]
];
function loadP(){ try{ return JSON.parse(localStorage.getItem(PKEY)||'{}'); }catch(e){ return {}; } }
function saveP(s){ localStorage.setItem(PKEY, JSON.stringify(s)); }
const pkey = p => normTok(p[0]);
function recordP(p, ok){
  const d = loadP();
  const r = ((d.pairs ||= {})[pkey(p)] ||= {n:0,ok:0});
  r.n++; if(ok) r.ok++;
  const day = ((d.days ||= {})[todayISO()] ||= {n:0,ok:0});
  day.n++; if(ok) day.ok++;
  saveP(d);
}
function weakestP(){
  const d = loadP();
  return PAIRS.map(p=>{
    const r = (d.pairs||{})[pkey(p)]||{n:0,ok:0};
    return {p, n:r.n, pct:r.n? Math.round(r.ok/r.n*100):100};
  }).filter(x=>x.n>=1 && x.pct<100).sort((a,b)=>a.pct-b.pct||b.n-a.n).slice(0,8);
}
function pExample(p){
  const w = p[0].split(' ');
  for(const s of corpus()){
    const ts = toks(s.en);
    if(w.every(x=>ts.includes(normTok(x)))) return s.en;
  }
  return null;
}
function shuf(a){ const x=[...a]; for(let i=x.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; } return x; }

let pq = [], pi = 0, pscore = 0, pmode = '';
function viewPairs(){
  const d = loadP();
  const t = (d.days||{})[todayISO()]||{n:0,ok:0};
  const seen = Object.values(d.pairs||{}).filter(r=>r.n>0).length;
  const w = weakestP();
  app.innerHTML = `<div class="grades" style="margin-bottom:10px"><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewHome()">سياق الكلمات ←</button><button class="btn" style="background:var(--gold);color:#1a2340">اصطلاحات (50)</button></div>
  <div class="head"><h2>الاصطلاحات — أزواج لفظية</h2><span class="rstreak">اليوم: ${t.ok}/${t.n}</span></div>
  <div class="card"><div class="body" style="text-align:center">
    50 زوجاً لفظياً حقيقياً من محتوى المنصة (make coffee / walk home / old man). ${seen?`غطّيت ${seen}/50.`:''}
    <div class="grades" style="justify-content:center">
      <button class="btn" onclick="startPQ('pick')">أيهما يلائم؟ (10)</button>
      <button class="btn" onclick="startPQ('gap')">فراغ في جملة (10)</button>
    </div></div></div>
  ${w.length?`<div class="head"><h2>أضعف ${w.length} أزواج</h2></div>
  <div class="card"><div class="body">${w.map(x=>`<div class="cbar"><span class="cw" dir="ltr">${esc(x.p[0])}</span><span class="ctr"><span class="cfl" style="width:${100-x.pct}%"></span></span><span class="cv">${x.pct}% (${x.n})</span></div>`).join('')}
  <div class="grades"><button class="btn" onclick="startPQ('pick',true)">راجع الأضعف ←</button></div></div></div>`:''}`;
}
function startPQ(m, weak){
  pmode = m; pscore = 0;
  const pool = weak ? weakestP().map(x=>x.p) : shuf(PAIRS);
  pq = pool.slice(0,10); pi = 0;
  drawPQ();
}
function drawPQ(){
  if(pi >= pq.length){ endPQ(); return; }
  const p = pq[pi];
  const ws = p[0].split(' ');
  const qw = ws[p[2]];
  const rest = ws.map((x,k)=>k===p[2]?'＿＿':x).join(' ');
  if(pmode==='pick'){
    const others = shuf(PAIRS.filter(q=>q!==p).map(q=>q[0].split(' ')[q[2]])).slice(0,3);
    const opts = shuf([qw,...others]);
    app.innerHTML = `<div class="head"><h2>أيهما يلائم؟ ${pi+1}/${pq.length}</h2><span class="muted">صحيح ${pscore}</span></div>
    <div class="quiz"><div class="q" style="text-align:center">
      <div dir="ltr" style="font-size:24px;font-weight:700;color:var(--gold)">${esc(rest)}</div>
      <div class="muted" style="margin:4px 0">${esc(p[1])}</div>
      <div class="opts" style="justify-content:center">${opts.map((o,k)=>`<button onclick="ansPick(this,${o===qw?1:0})">${esc(o)}</button>`).join('')}</div>
      <div id="pRes"></div>
    </div></div>`;
  } else {
    const sent = pExample(p);
    window._pw = qw;
    app.innerHTML = `<div class="head"><h2>أكمل الفراغ ${pi+1}/${pq.length}</h2><span class="muted">${esc(p[0])} — ${esc(p[1])}</span></div>
    <div class="quiz"><div class="q">
      ${sent?`<div dir="ltr" style="font-size:17px;margin:8px 0">${esc(sent).replace(new RegExp('\\\\b'+qw+'\\\\b','i'),'＿＿＿')}</div>`:`<div dir="ltr" style="font-size:20px;margin:8px 0">${esc(rest)}</div>`}
      <div style="display:flex;gap:10px;align-items:center;margin-top:10px">
        <input class="inp" dir="ltr" id="pIn" autocomplete="off" style="flex:1;max-width:220px" placeholder="الكلمة الناقصة؟">
        <button class="btn" onclick="ansGap()">تحقق</button>
      </div>
      <div id="pRes"></div>
    </div></div>`;
    const i = document.getElementById('pIn'); i.focus();
    i.onkeydown = e=>{ if(e.key==='Enter') ansGap(); };
  }
}
function ansPick(btn, ok){
  const p = pq[pi];
  document.querySelectorAll('.opts button').forEach(b=>{ b.disabled=true; if(b===btn) b.classList.add(ok?'right':'wrong'); });
  if(!ok) document.querySelectorAll('.opts button').forEach(b=>{ if(b.textContent===p[0].split(' ')[p[2]]) b.classList.add('right'); });
  recordP(p, !!ok); if(ok) pscore++;
  document.getElementById('pRes').innerHTML = `<div style="margin-top:10px;color:${ok?'var(--ok)':'var(--bad)'};font-size:14px">
    ${ok?'صحيح ✓':`التركيب: <b dir="ltr">${esc(p[0])}</b>`}
    <button class="btn" style="display:block;margin:8px auto 0" onclick="pi++;drawPQ()">${pi+1<pq.length?'التالي ←':'النتيجة ←'}</button></div>`;
}
function ansGap(){
  const p = pq[pi];
  const i = document.getElementById('pIn');
  if(i.disabled) return;
  const m = wmatch(normTok(window._pw), normTok(i.value));
  const ok = m>=0.5;
  recordP(p, ok); if(ok) pscore++;
  i.disabled = true;
  i.style.borderColor = m===1?'var(--ok)': m===0.5?'var(--warn)':'var(--bad)';
  if(!ok) i.value = window._pw;
  document.getElementById('pRes').innerHTML = `<div style="margin-top:10px;color:${ok?'var(--ok)':'var(--bad)'};font-size:14px">
    ${ok?'صحيح ✓':`الصحيح: <b dir="ltr">${esc(window._pw)}</b> — التركيب: <b dir="ltr">${esc(p[0])}</b>`}
    <button class="btn" style="display:block;margin:8px auto 0" onclick="pi++;drawPQ()">${pi+1<pq.length?'التالي ←':'النتيجة ←'}</button></div>`;
}
function endPQ(){
  const w = weakestP();
  app.innerHTML = `<div class="quiz"><div class="q" style="text-align:center">
    <div class="empty">النتيجة: ${pscore}/${pq.length}</div>
    <div class="grades"><button class="btn" onclick="viewPairs()">الاصطلاحات ←</button><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="startPQ('${pmode}')">جولة أخرى</button></div>
  </div></div>
  ${w.length?`<div class="head" style="margin-top:14px"><h2>أضعف ${w.length} الآن</h2></div>
  <div class="card"><div class="body">${w.map(x=>`<div class="cbar"><span class="cw" dir="ltr">${esc(x.p[0])}</span><span class="ctr"><span class="cfl" style="width:${100-x.pct}%"></span></span><span class="cv">${x.pct}% (${x.n})</span></div>`).join('')}</div></div>`:''}`;
}

viewHome();
