/* التراكيب — 60 تركيباً حقيقياً من الكوربس: بطاقة ← تظليل TTS ← كتابة من الذاكرة
   en_chunks: {chunks:{key:{n,ok,box,last}}, days:{date:{n,ok}}} — مراجعة متباعدة (0/1/3/7 أيام) */
const app = document.getElementById('app');
const $ = s => document.querySelector(s);
const CK_LS = 'en_chunks';
const INTERVALS = [0,1,3,7];

const CHUNKS = [
['can i','هل أستطيع أن'],['can i help you','هل أساعدك؟'],['do you','هل تـ؟'],['do you want','هل تريد'],
['do you have','هل لديك'],['are you','هل أنت'],['is it','هل هو'],['it is','إنه/إنها'],
['it was','كان'],['this is','هذا هو'],['that is','ذلك / أي'],['what is','ما هو'],
['where is','أين'],['where are','أين هم'],['who is','من هو'],['there was','كان هناك'],
['i see','أفهم / أرى'],['i think','أظن / أعتقد'],['you see','كما ترى'],['you have','لديك'],
['i have','لديّ'],['you are welcome','على الرحب'],['thank you','شكراً'],['excuse me','عذراً / لو سمحت'],
['see you','أراك لاحقاً'],['may i','هل أستأذن'],['here you are','تفضّل'],['not really','ليس تماماً'],
['of course','بالطبع'],['at first','في البداية'],['at once','فوراً'],['how much','كم الثمن'],
['how long','كم من الوقت'],['every day','كل يوم'],['all day','طوال اليوم'],['as well','أيضاً'],
['a lot','كثيراً'],['a bit','قليلاً'],['a little','قليلاً'],['full of','مليء بـ'],
['the next day','في اليوم التالي'],['at night','في الليل'],['let us','دعنا'],['next to','بجانب'],
['far from','بعيد عن'],['ready for','مستعد لـ'],['need to','يحتاج أن'],['will be','سيكون'],
['no longer','لم يعد'],['even though','رغم أن'],['because of','بسبب'],['instead of','بدلاً من'],
['looking for','يبحث عن'],['think about','يفكر في'],['wake up','استيقظ'],['hold on','انتظر'],
['had never','لم يحدث أن'],['new job','عمل جديد'],['three days','ثلاثة أيام'],['for the first time','لأول مرة']
];

function loadC(){ try{ return JSON.parse(localStorage.getItem(CK_LS)||'{}'); }catch(e){ return {}; } }
function saveC(s){ localStorage.setItem(CK_LS, JSON.stringify(s)); }
function ttsOn(){ try{ return speechSynthesis.getVoices().some(v=>/^en([-_]|$)/i.test(v.lang)); }catch(e){ return false; } }
function speak(t){ if(!ttsOn()) return; try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.85; speechSynthesis.speak(u); }catch(e){} }
function toastMsg(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),1800); }
const key = c => normTok(c);

function record(c, ok){
  const d = loadC();
  (d.chunks ||= {}); (d.days ||= {});
  const r = d.chunks[key(c)] ||= {n:0,ok:0,box:0,last:0};
  r.n++; if(ok){ r.ok++; r.box = Math.min(3,(r.box||0)+1); r.last = Date.now(); }
  else r.box = 0;
  const day = d.days[todayISO()] ||= {n:0,ok:0};
  day.n++; if(ok) day.ok++;
  saveC(d);
}
function dueChunks(){
  const d = loadC(), now = Date.now();
  return CHUNKS.filter(c=>{
    const r = (d.chunks||{})[key(c[0])];
    if(!r) return true; // جديد
    if((r.box||0)>=3) return false;
    const iv = INTERVALS[r.box||0]*864e5;
    return now-(r.last||0) >= iv;
  });
}
function weakest(){
  const d = loadC();
  return CHUNKS.map(c=>{
    const r = (d.chunks||{})[key(c[0])] || {n:0,ok:0,box:0};
    return {c, n:r.n, pct:r.n? Math.round(r.ok/r.n*100):100, box:r.box||0};
  }).filter(x=>x.n>=1 && x.pct<100).sort((a,b)=>a.pct-b.pct || b.n-a.n).slice(0,8);
}
function exampleFor(c){
  const probe = c[0].toLowerCase();
  for(const st of STORIES) for(const s of st.sentences){
    if(s.en.toLowerCase().includes(probe)) return {text:s.en, ar:s.ar};
  }
  for(const cl of CLIPS) for(const s of cl.sentences){
    if(s.text.toLowerCase().includes(probe)) return {text:s.text, ar:''};
  }
  return null;
}

/* ---------- حالة الجولة ---------- */
let queue = [], qi = 0, stage = 0, n = 0, sum = 0;

/* ---------- الرئيسية ---------- */
function viewHome(){
  const d = loadC();
  const today = (d.days||{})[todayISO()] || {n:0,ok:0};
  const due = dueChunks();
  const w = weakest();
  const seen = Object.values(d.chunks||{}).filter(r=>r.n>0).length;
  const mastered = Object.values(d.chunks||{}).filter(r=>(r.box||0)>=3).length;
  app.innerHTML = `
  <div class="head"><h2>التراكيب الشائعة</h2><span class="muted">اليوم: ${today.ok}/${today.n} · مستحقة: ${due.length}</span></div>
  <div class="card"><div class="body" style="text-align:center">
    60 تركيباً حقيقياً من محتوى المنصة — تعلّم العبارات لا الكلمات: بطاقة ← تظليل صوتي ← كتابة من الذاكرة. ${seen?`غطّيت ${seen}/60 · متقن ${mastered}.`:''}
    ${!ttsOn()?'<div class="muted" style="color:var(--warn);margin-top:6px">النطق غير متاح بجهازك — مرحلة التظليل تصير مراجعة بصرية.</div>':''}
    <div class="grades"><button class="btn" onclick="startRound()">ابدأ جولة (${Math.min(10,due.length||10)})</button></div>
    <div class="muted" style="font-size:12px">المراجعة متباعدة: نجاح يرفع الصندوق (0/1/3/7 أيام)، خطأ يعيده للصفر.</div>
  </div></div>
  ${w.length?`
  <div class="head"><h2>أضعف ${w.length} تراكيب</h2></div>
  <div class="card"><div class="body">
    ${w.map(x=>`<div class="cbar"><span class="cw" dir="ltr">${esc(x.c[0])}</span><span class="ctr"><span class="cfl" style="width:${100-x.pct}%"></span></span><span class="cv">${x.pct}% (${x.n})</span></div>`).join('')}
    <div class="grades"><button class="btn" onclick="startRound(true)">راجع الأضعف ←</button></div>
  </div></div>`:''}`;
}
function startRound(weak){
  const pool = weak ? weakest().map(x=>x.c) : dueChunks();
  queue = pool.slice(0,10); qi = 0; n = 0; sum = 0;
  if(!queue.length){ toastMsg('لا شيء مستحقاً اليوم — أتقنت الحالي ✓'); return; }
  nextStage();
}

/* ---------- المراحل الثلاث ---------- */
function nextStage(){
  if(qi >= queue.length){ endRound(); return; }
  stage = 0; renderFlash();
}
function renderFlash(){
  const c = queue[qi]; const ex = exampleFor(c);
  app.innerHTML = `
  <div class="head"><h2>تركيب ${qi+1}/${queue.length} · بطاقة</h2><span class="muted">اقرأه واحفظه</span></div>
  <div class="quiz"><div class="q" style="text-align:center">
    <div dir="ltr" style="font-size:28px;font-weight:700;color:var(--gold)">${esc(c[0])}</div>
    <div class="muted" style="margin:4px 0">${esc(c[1])}</div>
    ${ex?`<div dir="ltr" class="muted" style="font-size:13px;margin-top:8px">«${esc(ex.text)}»${ex.ar?`<div dir="rtl" style="margin-top:3px">${esc(ex.ar)}</div>`:''}</div>`:''}
    <div class="grades">
      <button class="btn" onclick="renderShadow()">تظليل ←</button>
      ${ttsOn()?`<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="speak('${esc(c[0])}')">🔊</button>`:''}
    </div>
  </div></div>`;
  speak(c[0]);
}
function renderShadow(){
  const c = queue[qi]; stage = 1;
  app.innerHTML = `
  <div class="head"><h2>تركيب ${qi+1}/${queue.length} · تظليل</h2><span class="muted">استمع وردّد بصوت عالٍ</span></div>
  <div class="quiz"><div class="q" style="text-align:center">
    <div dir="ltr" style="font-size:26px;font-weight:700;color:var(--gold)">${esc(c[0])}</div>
    <div class="muted" style="margin:4px 0">${esc(c[1])}</div>
    <div class="grades">
      ${ttsOn()?`<button class="btn" onclick="speak('${esc(c[0])}')">🔊 استمع وردّد</button>`:'<div class="muted">لا نطق بجهازك — ردّد بصرياً</div>'}
      <button class="btn" onclick="renderType()">تظلّيتها ← اكتبها</button>
    </div>
  </div></div>`;
  speak(c[0]);
}
function renderType(){
  const c = queue[qi]; stage = 2;
  app.innerHTML = `
  <div class="head"><h2>تركيب ${qi+1}/${queue.length} · من الذاكرة</h2><span class="muted">${esc(c[1])}</span></div>
  <div class="quiz"><div class="q" style="text-align:center">
    <div style="font-size:18px;margin:6px 0">اكتب التركيب الإنجليزي:</div>
    <div class="muted" dir="ltr" style="font-size:14px;margin-bottom:10px">${'___ '.repeat(c[0].split(' ').length).trim()}</div>
    <input class="inp" dir="ltr" id="ckIn" autocomplete="off" style="width:min(320px,90%);font-size:18px;text-align:center" placeholder="...">
    <div class="grades"><button class="btn" onclick="checkType()">تحقق</button></div>
    <div id="ckRes"></div>
  </div></div>`;
  const i = document.getElementById('ckIn'); i.focus();
  i.addEventListener('keydown',e=>{ if(e.key==='Enter') checkType(); });
}
function checkType(){
  const c = queue[qi];
  const i = document.getElementById('ckIn');
  if(i.disabled) return;
  const tgt = c[0].split(/\s+/).map(normTok);
  const got = i.value.trim().split(/\s+/).filter(Boolean).map(normTok);
  let hits = 0;
  tgt.forEach((t,k)=>{ const u = got[k]||''; if(wmatch(t,u)>=1) hits++; else if(wmatch(t,u)>=0.5) hits+=0.5; });
  const ok = hits >= tgt.length - (tgt.length>2?0.5:0);
  record(c[0], ok); n++; sum += Math.round(hits/tgt.length*100);
  i.disabled = true;
  i.style.borderColor = ok?'var(--ok)':'var(--bad)';
  document.getElementById('ckRes').innerHTML = `<div style="margin-top:10px;color:${ok?'var(--ok)':'var(--bad)'};font-size:15px">
    ${ok?'صحيح ✓':`الصحيح: <b dir="ltr">${esc(c[0])}</b>`}
    <button class="btn" style="display:block;margin:10px auto 0" onclick="advance()">${qi+1<queue.length?'التالي ←':'النتيجة ←'}</button></div>`;
}
function advance(){ qi++; nextStage(); }

/* ---------- النهاية ---------- */
function endRound(){
  const avg = n? Math.round(sum/n) : 0;
  const w = weakest();
  app.innerHTML = `
  <div class="quiz"><div class="q" style="text-align:center">
    <div class="empty">الجولة: متوسط الدقة ${avg}% عبر ${n} تركيباً</div>
    <div class="grades"><button class="btn" onclick="viewHome()">التراكيب ←</button><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="startRound()">جولة أخرى</button></div>
  </div></div>
  ${w.length? `<div class="head" style="margin-top:16px"><h2>أضعف ${w.length} الآن</h2></div>
  <div class="card"><div class="body">${w.map(x=>`<div class="cbar"><span class="cw" dir="ltr">${esc(x.c[0])}</span><span class="ctr"><span class="cfl" style="width:${100-x.pct}%"></span></span><span class="cv">${x.pct}% (${x.n})</span></div>`).join('')}</div></div>`:''}`;
}

viewHome();
