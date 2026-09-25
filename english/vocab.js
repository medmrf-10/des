/* مفرداتي — كلمات en_bank: دريل بطاقات (كلمة→معنى/مثال) + كويز اختيار المعنى من 4
   الإحصاء في en_vocab: {stats:{new,learning,mastered,total,ts}, quiz:{n,sum,best}, drills} */
const app = document.getElementById('app');
const VKEY = 'en_vocab';

function bankArr(){
  const b = loadBank();
  return Object.keys(b).map(k=>({tok:k, ...b[k]})).filter(w=>w.en);
}
function stage(w){ return (w.box||0)>=3 ? 'mastered' : (w.box||0)>=1 ? 'learning' : 'new'; }
function loadV(){ try{ return JSON.parse(localStorage.getItem(VKEY)||'{}'); }catch(e){ return {}; } }
function saveV(v){ localStorage.setItem(VKEY, JSON.stringify(v)); }
function writeStats(){
  const ws = bankArr();
  const st = {new:0, learning:0, mastered:0, total:ws.length, ts:Date.now()};
  ws.forEach(w=> st[stage(w)]++);
  const v = loadV(); v.stats = st; saveV(v);
  return st;
}
/* مثال جملة تحوي الكلمة — مقاطع المكتبة ثم القصص */
function findExample(tok){
  for(const c of CLIPS) for(const s of (c.sentences||[])){
    if((s.words||[]).some(w=>normTok(w[0])===tok)) return {en:s.text, src:c.title};
  }
  for(const st of STORIES) for(const s of st.sentences){
    if(normTok(s.en).split(/\s+/).includes(tok)) return {en:s.en, src:st.titleAr};
  }
  return null;
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }

/* ---------- الرئيسية ---------- */
function viewHome(){
  const st = writeStats();
  const v = loadV(), q = v.quiz || {};
  app.innerHTML = `<div class="head"><h2>مفرداتي</h2><span class="rstreak">${st.total} كلمة</span></div>
  <div class="grid">
    <div class="card"><div class="body"><h3>جديد</h3><div style="font-size:26px;color:var(--gold)">${st.new}</div></div></div>
    <div class="card"><div class="body"><h3>معلّم</h3><div style="font-size:26px;color:var(--gold-soft)">${st.learning}</div></div></div>
    <div class="card"><div class="body"><h3>متقن</h3><div style="font-size:26px;color:var(--ok)">${st.mastered}</div></div></div>
  </div>
  ${q.n? `<div class="card" style="margin-top:14px"><div class="body"><div class="meta"><span>الكويز: ${q.n} جولة</span><span>متوسط ${Math.round(q.sum/q.n)}% · أفضل ${q.best}%</span></div></div></div>`:''}
  <div class="grid" style="margin-top:14px">
    <div class="card"><div class="body"><h3>دريل البطاقات</h3><div class="meta"><span>اقلب البطاقة: كلمة ← معنى + مثال</span></div>
      <button class="btn" style="margin-top:8px" ${st.total?'':'disabled'} onclick="startDrill()">ابدأ ←</button></div></div>
    <div class="card"><div class="body"><h3>كويز المعنى</h3><div class="meta"><span>١٠ أسئلة — اختر المعنى الصحيح من ٤</span></div>
      <button class="btn" style="margin-top:8px" ${st.total>=4?'':'disabled'} onclick="startQuiz()">ابدأ ←</button></div></div>
  </div>
  <div class="rlnks" style="margin-top:18px"><a href="library.html">الفهرس</a><a href="srs.html">مفردات SRS</a><a href="practice.html">تمرين اليوم</a></div>`;
}

/* ---------- دريل البطاقات ---------- */
let dq = [], di = 0;
function startDrill(){
  dq = shuffle(bankArr());
  di = 0;
  drawDrill();
}
function drawDrill(){
  if(di >= dq.length){
    const v = loadV(); v.drills = (v.drills||0) + dq.length; saveV(v); writeStats();
    app.innerHTML = `<div class="quiz"><div class="empty">انتهى الدريل — ${dq.length} بطاقة.</div><button class="btn" onclick="viewHome()">مفرداتي ←</button></div>`;
    return;
  }
  const w = dq[di];
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>دريل البطاقات</h2><span style="color:var(--muted)">${di+1}/${dq.length} · ${stage(w)==='mastered'?'متقن':stage(w)==='learning'?'معلّم':'جديد'}</span></div>
  <div class="q" style="text-align:center">
    <div class="en" style="font-size:30px;margin:16px 0;direction:ltr">${esc(w.en)}</div>
    <div id="back" style="display:none">
      <div style="color:var(--gold-soft);font-size:19px">${esc(w.ar)||'—'}</div>
      ${(()=>{const x=findExample(w.tok); return x? `<div class="en" dir="ltr" style="font-size:15px;color:var(--muted);margin:10px 0 4px;text-align:left">${esc(x.en)}</div><div style="font-size:11px;color:var(--muted)">— ${esc(x.src)}</div>`:''})()}
      <div class="grades" style="margin-top:14px">
        <button class="btn" onclick="drillGrade(1)">عرفتها ←</button>
        <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="drillGrade(0)">ما عرفتها</button>
      </div>
    </div>
    <button class="btn" style="padding:12px 30px" onclick="document.getElementById('back').style.display='block';this.style.display='none'">اقلب البطاقة</button>
    <div class="grades" style="margin-top:12px"><button class="btn" style="background:var(--navy-3);color:var(--gold-soft);font-size:12px" onclick="viewHome()">إنهاء الدريل</button></div>
  </div></div>`;
}
function drillGrade(ok){
  const w = dq[di];
  const b = loadBank();
  if(b[w.tok]){ b[w.tok].box = ok ? Math.min((b[w.tok].box||0)+1, 3) : 0; localStorage.setItem(BANK_LS, JSON.stringify(b)); }
  di++;
  drawDrill();
}

/* ---------- كويز المعنى ---------- */
let qq = [], qi = 0, qscore = 0;
function startQuiz(){
  const ws = shuffle(bankArr());
  qq = ws.slice(0,10).map(w=>{
    const others = shuffle(ws.filter(x=>x.tok!==w.tok && x.ar && x.ar!==w.ar)).slice(0,3).map(x=>x.ar);
    while(others.length<3) others.push('—');
    return {w, opts: shuffle([w.ar, ...others])};
  });
  qi = 0; qscore = 0;
  drawQuiz();
}
function drawQuiz(){
  if(qi >= qq.length){
    const pct = Math.round(qscore/qq.length*100);
    const v = loadV(); (v.quiz ||= {n:0,sum:0,best:0});
    v.quiz.n++; v.quiz.sum += pct; v.quiz.best = Math.max(v.quiz.best, pct); saveV(v);
    app.innerHTML = `<div class="quiz"><div class="empty">النتيجة: ${qscore}/${qq.length} (${pct}%)<br><span style="font-size:13px;color:var(--muted)">أفضل نتيجة: ${v.quiz.best}%</span></div>
      <div class="grades"><button class="btn" onclick="viewHome()">مفرداتي ←</button><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="startQuiz()">جولة أخرى</button></div></div>`;
    return;
  }
  const {w, opts} = qq[qi];
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>كويز المعنى</h2><span style="color:var(--muted)">${qi+1}/${qq.length} · صحيح ${qscore}</span></div>
  <div class="q" style="text-align:center">
    <div style="color:var(--muted);font-size:12px;margin-bottom:8px">ما معنى:</div>
    <div class="en" style="font-size:28px;margin-bottom:18px;direction:ltr">${esc(w.en)}</div>
    <div class="opts" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${opts.map((o,k)=>`<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="ansQuiz(${k},this)">${esc(o)}</button>`).join('')}
    </div>
  </div></div>`;
}
function ansQuiz(k, btn){
  const {w} = qq[qi];
  const ok = qq[qi].opts[k] === w.ar;
  document.querySelectorAll('#app .opts .btn').forEach(b=>{
    b.disabled = true;
    if(b.textContent === w.ar) b.style.background = 'var(--ok)';
  });
  if(!ok) btn.style.background = 'var(--bad)';
  else qscore++;
  setTimeout(()=>{ qi++; drawQuiz(); }, ok?500:1100);
}

viewHome();
