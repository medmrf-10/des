/* قلّد — تدريب التظليل (Shadowing): جملة-جملة من مقاطع المكتبة
   التخزين: en_mimic {"clipId:idx":{g:'x'|'m'|'r', n}} — 'x' ممتاز يغذّي mastery الفهرس */
const app = document.getElementById('app');
const $ = s => document.querySelector(s);
const MIMIC_LS = 'en_mimic';

function loadMimic(){ try{ return JSON.parse(localStorage.getItem(MIMIC_LS)||'{}'); }catch(e){ return {}; } }
function saveMimic(m){ localStorage.setItem(MIMIC_LS, JSON.stringify(m)); }
function mkey(c, i){ return `${c.id}:${i}`; }
function ttsReady(){ try{ return speechSynthesis.getVoices().some(v=>/^en([-_]|$)/i.test(v.lang)); }catch(e){ return false; } }

/* ---------- اختيار المقطع ---------- */
function viewPick(){
  const m = loadMimic();
  const cards = CLIPS.map(c=>{
    const tot = (c.sentences||[]).length;
    const done = (c.sentences||[]).filter((s,i)=> (m[mkey(c,i)]||{}).g==='x').length;
    const pct = tot ? Math.round(done/tot*100) : 0;
    return `<div class="card"><div class="body">
      <h3>${esc(c.title)}</h3>
      <div class="meta"><span>${tot} جمل</span><span>قلّدت بإتقان: ${done}</span></div>
      <div class="lbar" title="${pct}%"><div class="lbar-ms" style="width:${pct}%"></div></div>
      <button class="btn" style="margin-top:8px" onclick="startClip('${c.id}')">${done? 'أكمل':'ابدأ'} التظليل ←</button>
    </div></div>`;
  }).join('');
  const totX = Object.values(m).filter(v=>v.g==='x').length;
  app.innerHTML = `<div class="head"><h2>اختر مقطعاً للتظليل</h2><span class="rstreak">أتقنت تقليد ${totX} جملة</span></div>
  <div class="grid">${cards}</div>`;
}

/* ---------- جلسة التظليل ---------- */
let cur = null, idx = 0, stream = null, rec = null, chunks = [], recUrl = null;
function startClip(id){
  cur = CLIPS.find(c=>c.id===id);
  idx = 0;
  /* تخطَّ إلى أول جملة لم تُتقن */
  const m = loadMimic();
  const j = cur.sentences.findIndex((s,i)=> (m[mkey(cur,i)]||{}).g!=='x');
  if(j>=0) idx = j;
  drawSent();
}
function sentAt(){ return cur.sentences[idx]; }

function drawSent(){
  const s = sentAt(), m = loadMimic(), st = m[mkey(cur,idx)];
  const tot = cur.sentences.length;
  const done = cur.sentences.filter((x,i)=>(m[mkey(cur,i)]||{}).g==='x').length;
  const gradeLbl = {x:'ممتاز', m:'متوسط', r:'أعد'}[st?.g] || '—';
  recUrl = null;
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>${esc(cur.title)}</h2><span style="color:var(--muted)">جملة ${idx+1}/${tot} · متقنة ${done} · آخر تقييم: ${gradeLbl}</span></div>
  <div class="q">
    <div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${cur.id}" title="original" allowfullscreen></iframe></div>
    <div class="en" dir="ltr" style="font-size:20px;margin:14px 0 4px;text-align:left">${esc(s.text)}</div>
    <div class="en" dir="ltr" style="font-size:12px;margin-bottom:10px;text-align:left;color:var(--muted)">${(s.words||[]).map(w=>`<span class="w" title="${esc(w[1])}">${esc(w[0])}</span>`).join(' ')}</div>
    <div class="grades">
      ${ttsReady()? `<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="playSent()">🔊 شغّل الجملة</button>`:''}
      <button class="btn" id="recb" onclick="toggleRec()">⏺ سجّل إعادتك</button>
    </div>
    <div id="recZone" style="margin-top:10px"></div>
    <div id="gradeZone" style="display:none;margin-top:12px">
      <div style="color:var(--muted);font-size:12px;margin-bottom:6px">قيّم تقليدك — ممتاز يُحسب إتقاناً في الفهرس:</div>
      <div class="grades">
        <button class="btn" onclick="gradeSelf('x')">ممتاز ←</button>
        <button class="btn" onclick="gradeSelf('m')">متوسط ←</button>
        <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="gradeSelf('r')">أعد المحاولة</button>
      </div>
    </div>
    <div class="grades" style="margin-top:12px">
      ${idx>0? `<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="idx--;drawSent()">السابقة</button>`:''}
      ${idx<tot-1? `<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="idx++;drawSent()">تخطَّ للتالية ←</button>`:''}
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewPick()">المقاطع ←</button>
    </div>
  </div></div>`;
}
function playSent(){
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(sentAt().text);
    u.lang = 'en-US'; u.rate = 0.9;
    speechSynthesis.speak(u);
  }catch(e){}
}
async function toggleRec(){
  const b = $('#recb');
  if(rec && rec.state==='recording'){ rec.stop(); return; }
  if(!stream){
    try{ stream = await navigator.mediaDevices.getUserMedia({audio:true}); }
    catch(e){
      $('#recZone').innerHTML = `<div class="empty">الميكروفون غير متاح — اسمح بالوصول أعلاه. يمكنك المتابعة بالاستماع والتقييم الذاتي.</div>`;
      $('#gradeZone').style.display = 'block';
      return;
    }
  }
  chunks = [];
  rec = new MediaRecorder(stream);
  rec.ondataavailable = e => chunks.push(e.data);
  rec.onstop = ()=>{
    const blob = new Blob(chunks, {type: rec.mimeType || 'audio/webm'});
    recUrl = URL.createObjectURL(blob);
    $('#recZone').innerHTML = `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span style="color:var(--muted);font-size:12px">تسجيلك:</span>
      <audio controls src="${recUrl}" style="height:34px"></audio>
      <span style="color:var(--muted);font-size:12px">قارنه بالأصل أعلاه ثم قيّم نفسك.</span></div>`;
    $('#gradeZone').style.display = 'block';
    b.textContent = '⏺ سجّل مجدداً';
  };
  rec.start();
  b.textContent = '⏹ أوقف التسجيل';
  $('#gradeZone').style.display = 'none';
}
function gradeSelf(g){
  const m = loadMimic();
  const k = mkey(cur, idx);
  m[k] = {g, n: (m[k]?.n||0)+1, ts: Date.now()};
  saveMimic(m);
  if(g==='r'){ drawSent(); return; } /* إعادة المحاولة: نفس الجملة */
  if(idx < cur.sentences.length-1){ idx++; drawSent(); }
  else viewPick();
}

viewPick();
