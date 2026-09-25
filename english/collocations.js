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
  app.innerHTML = `<div class="head"><h2>التراكيب — 12 كلمة</h2><span class="rstreak">اليوم: ${t.ok}/${t.n} صحيح</span></div>
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

viewHome();
