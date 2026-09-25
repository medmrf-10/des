/* بناء القصة — تختار 8 كلمات من بنكك ← قصة بإطارات وفراغات بدليل عربي ← تشغيل كامل بكاريوكي TTS
   en_story['builder'] = {score,total,best,ts} */
const app = document.getElementById('app');
const $ = s => document.querySelector(s);
const SB_LS = 'en_story';

function loadStory(){ try{ return JSON.parse(localStorage.getItem(SB_LS)||'{}'); }catch(e){ return {}; } }
function saveStory(s){ localStorage.setItem(SB_LS, JSON.stringify(s)); }
function ttsOn(){ try{ return speechSynthesis.getVoices().some(v=>/^en([-_]|$)/i.test(v.lang)); }catch(e){ return false; } }
let voice = null;
function pickVoice(){ try{ const vs = speechSynthesis.getVoices(); voice = vs.find(v=>/^en([-_]|$)/i.test(v.lang)) || null; }catch(e){} }
pickVoice(); try{ speechSynthesis.onvoiceschanged = pickVoice; }catch(e){}
function speak(t, onend){
  if(!ttsOn()){ if(onend) onend(); return; }
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'en-US'; u.rate = 0.9; if(voice) u.voice = voice;
    if(onend) u.onend = onend;
    speechSynthesis.speak(u);
  }catch(e){ if(onend) onend(); }
}
function toastMsg(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),1800); }
const tok = s => normTok(s);

/* ---------- مجموعة الكلمات ---------- */
function bankPool(){
  const b = loadBank();
  const arr = Object.entries(b).map(([k,w])=>({tok:k,en:w.en,ar:w.ar||'',box:w.box||0,src:'بنكك'}));
  return arr;
}
function corpusPool(avoid){
  const out = [];
  const seen = new Set(avoid.map(w=>w.tok));
  for(const c of CLIPS) for(const s of c.sentences){
    for(const wp of (s.words||[])){
      const t = tok(wp[0]);
      if(t && t.length>2 && !seen.has(t)){ seen.add(t); out.push({tok:t,en:wp[0],ar:wp[1]||'',box:0,src:'المكتبة'}); }
    }
  }
  for(const st of STORIES) for(const s of st.sentences){
    for(const w of (s.en.match(/[a-zA-Z']+/g)||[])){
      const t = tok(w);
      if(t && t.length>3 && DICT[t] && !seen.has(t)){ seen.add(t); out.push({tok:t,en:w.toLowerCase(),ar:DICT[t],box:0,src:'القصص'}); }
    }
  }
  return out;
}

/* ---------- إطارات القصة ---------- */
const CONN = ['أولاً','ثم','بعد ذلك','وفجأة','ثم','بعدها','في النهاية','وأخيراً'];
const FALLBACK = [
  'Today I learned the word ___.',
  'She wrote ___ in her notebook.',
  'He said "___" out loud.',
  'I hear ___ everywhere now.',
  'Can you spell ___ for me?',
  'The best word today is ___.',
  'I will use ___ tomorrow.',
  'And the last word was ___!'
];
function blankify(sent, t){
  const ms = [...sent.matchAll(/[a-zA-Z']+/g)];
  for(const m of ms){
    if(tok(m[0])===t){
      return {text: sent.slice(0,m.index)+'___'+sent.slice(m.index+m[0].length), full: sent};
    }
  }
  return null;
}
function findFrame(w, fi){
  for(const st of STORIES) for(const s of st.sentences){
    const b = blankify(s.en, w.tok);
    if(b) return {sent:b.text, full:b.full, clue:s.ar, src:'القصص'};
  }
  for(const c of CLIPS) for(const s of c.sentences){
    if((s.words||[]).some(wp=>tok(wp[0])===w.tok)){
      const b = blankify(s.text, w.tok);
      if(b) return {sent:b.text, full:b.full, clue:'', src:c.title};
    }
  }
  return {sent:FALLBACK[fi%FALLBACK.length], full:FALLBACK[fi%FALLBACK.length].replace('___',w.en), clue:'', src:''};
}

/* ---------- الحالة ---------- */
let picked = [];      // الكلمات المختارة
let frames = [];      // الإطارات بعد الخلط
let score = 0;
let playing = -1;

/* ---------- الاختيار ---------- */
function viewPick(){
  playing = -1; try{ speechSynthesis.cancel(); }catch(e){}
  const bank = bankPool();
  const filler = bank.length<8 ? corpusPool(bank).slice(0,12) : [];
  const pool = [...bank, ...filler];
  const res = loadStory();
  const prev = res['builder'];
  app.innerHTML = `
  <div class="head"><h2>بناء القصة</h2></div>
  <div class="card"><div class="body" style="text-align:center">
    اختر <b>8 كلمات</b> من مفرداتك — نبني بها قصة بفراغات، تملؤها بالكلمة الصحيحة (الدليل بالعربية)، ثم نقرأها لك بكاريوكي صوتي.
    ${prev?`<div class="muted" style="margin-top:6px">آخر نتيجة: ${prev.score}/${prev.total} · الأفضل: ${prev.best}</div>`:''}
    ${!ttsOn()?'<div class="muted" style="color:var(--warn);margin-top:6px">النطق غير متاح بجهازك — ستعمل الكاريوكي بصرياً فقط. فعّل أصوات النظام.</div>':''}
    <div class="grades"><button class="btn" id="sbGo" disabled onclick="startBuild()">ابدأ البناء (0/8)</button><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="autoPick()">اختر لي 8</button></div>
  </div></div>
  <div class="head"><h2>مفرداتك (${pool.length})</h2></div>
  <div class="chips" id="sbPool">${pool.map((w,i)=>`<button class="chip sbw" data-i="${i}" onclick="toggleWord(this)"><b dir="ltr">${esc(w.en)}</b> <span class="war">${esc(w.ar)}</span>${w.src!=='بنكك'?` <span class="muted">· ${w.src}</span>`:''}</button>`).join('')}</div>
  ${pool.length<8?'<div class="card"><div class="body muted">تحتاج 8 كلمات — احفظ المزيد من ShortForm أو القصص.</div></div>':''}`;
  window._pool = pool; picked = [];
}
function toggleWord(btn){
  const i = +btn.dataset.i;
  const w = window._pool[i];
  const at = picked.findIndex(x=>x.tok===w.tok);
  if(at>=0){ picked.splice(at,1); btn.classList.remove('sel'); }
  else if(picked.length<8){ picked.push(w); btn.classList.add('sel'); }
  else { toastMsg('اخترت 8 بالفعل — انقر كلمة لإزالتها'); return; }
  const go = document.getElementById('sbGo');
  go.disabled = picked.length!==8;
  go.textContent = `ابدأ البناء (${picked.length}/8)`;
}
function autoPick(){
  const pool = window._pool;
  if(pool.length<8) return;
  picked = [];
  const idx = [...pool.keys()];
  for(let i=idx.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; }
  for(let k=0;k<8;k++) picked.push(pool[idx[k]]);
  document.querySelectorAll('.sbw').forEach(b=>{
    const w = pool[+b.dataset.i];
    b.classList.toggle('sel', picked.some(x=>x.tok===w.tok));
  });
  const go = document.getElementById('sbGo');
  go.disabled = false; go.textContent = 'ابدأ البناء (8/8)';
}

/* ---------- البناء ---------- */
function startBuild(){
  frames = picked.map((w,i)=>{ const f = findFrame(w,i); return {...f, word:w, conn:CONN[i]}; });
  // خلط الإطارات حتى لا تتطابق مع ترتيب الاختيار
  for(let i=frames.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [frames[i],frames[j]]=[frames[j],frames[i]]; }
  score = 0;
  app.innerHTML = `
  <div class="head"><h2>املأ الفراغات</h2><span class="muted" id="sbStat">كل فراغ يقبل كلمة واحدة — الدليل بالعربية</span></div>
  <div class="card"><div class="body">
    ${frames.map((f,i)=>`
      <div class="sbframe" id="sbf${i}">
        <div class="muted" style="font-size:12px;margin-bottom:2px">${f.conn}${f.src?` · ${esc(f.src)}`:''}</div>
        <div dir="ltr" style="font-size:16px;margin:4px 0">${esc(f.sent)}</div>
        ${f.clue?`<div class="muted" style="font-size:13px">${esc(f.clue)}</div>`:''}
        <div style="margin-top:6px;display:flex;gap:8px;align-items:center">
          <input class="inp" dir="ltr" id="sbi${i}" placeholder="الكلمة الناقصة؟" autocomplete="off" style="flex:1;max-width:220px">
          <span class="muted" dir="rtl">«${esc(f.word.ar)}»</span>
        </div>
      </div>`).join('')}
    <div class="grades"><button class="btn" onclick="checkBuild()">تحقق واملأ القصة</button></div>
  </div></div>`;
}
function checkBuild(){
  score = 0;
  frames.forEach((f,i)=>{
    const inp = document.getElementById('sbi'+i);
    const v = inp.value.trim();
    const m = wmatch(tok(f.word.en), tok(v));
    inp.disabled = true;
    const fr = document.getElementById('sbf'+i);
    if(m===1){ score++; inp.style.borderColor='var(--ok)'; fr.insertAdjacentHTML('beforeend',`<div style="color:var(--ok);font-size:13px;margin-top:4px">صحيح ✓</div>`); }
    else if(m===0.5){ score++; inp.style.borderColor='var(--warn)'; fr.insertAdjacentHTML('beforeend',`<div style="color:var(--warn);font-size:13px;margin-top:4px">قريب — الصحيح: <b dir="ltr">${esc(f.word.en)}</b></div>`); }
    else { inp.style.borderColor='var(--bad)'; inp.value = f.word.en; fr.insertAdjacentHTML('beforeend',`<div style="color:var(--bad);font-size:13px;margin-top:4px">الصحيح: <b dir="ltr">${esc(f.word.en)}</b>${v?` (كتبت «${esc(v)}»)`:''}</div>`); }
  });
  const res = loadStory();
  const prev = res['builder'] || {best:0};
  res['builder'] = {score, total:frames.length, best:Math.max(prev.best||0, score), ts:Date.now()};
  saveStory(res);
  document.getElementById('sbStat').innerHTML = `النتيجة: <b style="color:var(--gold)">${score}/${frames.length}</b>`;
  document.querySelector('.grades').innerHTML = `<button class="btn" onclick="viewKaraoke()">شغّل القصة كاملة ←</button>`;
  toastMsg(`نتيجتك ${score}/${frames.length} — حُفظت في en_story`);
}

/* ---------- الكاريوكي ---------- */
function karaokeText(f){
  // النص الكامل مع إبراز الكلمة
  const b = blankify(f.full, f.word.tok);
  if(b) return b.text.replace('___', `<span class="kw">${esc(f.word.en)}</span>`);
  return esc(f.full);
}
function viewKaraoke(){
  app.innerHTML = `
  <div class="head"><h2>قصتك — استمع وتابع</h2><span class="muted">${score}/${frames.length} صحيحة</span></div>
  <div class="card"><div class="body">
    ${frames.map((f,i)=>`
      <div class="sbline" id="sbl${i}">
        <span class="muted" style="font-size:12px">${f.conn}</span>
        <div dir="ltr" style="font-size:17px;margin:3px 0">${karaokeText(f)}</div>
        ${f.clue?`<div class="muted" style="font-size:13px">${esc(f.clue)}</div>`:''}
        ${f.word.ar&&!f.clue?`<div class="muted" style="font-size:13px">«${esc(f.word.ar)}»</div>`:''}
      </div>`).join('')}
    <div class="grades">
      <button class="btn" onclick="playAll(0)">▶ شغّل القصة</button>
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="stopPlay()">إيقاف</button>
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewPick()">قصة جديدة</button>
    </div>
    <div class="muted" style="font-size:12px;margin-top:6px">اضغط أي جملة لتشغيلها من هناك.</div>
  </div></div>`;
  frames.forEach((f,i)=>{ document.getElementById('sbl'+i).onclick = ()=>playAll(i); });
}
function stopPlay(){ playing = -1; try{ speechSynthesis.cancel(); }catch(e){} document.querySelectorAll('.sbline').forEach(e=>e.classList.remove('on')); }
function playAll(i){
  if(i>=frames.length){ stopPlay(); toastMsg('انتهت القصة'); return; }
  playing = i;
  document.querySelectorAll('.sbline').forEach((e,j)=>e.classList.toggle('on', j===i));
  const el = document.getElementById('sbl'+i);
  el.scrollIntoView({block:'center',behavior:'smooth'});
  speak(frames[i].full, ()=>{ if(playing===i) playAll(i+1); });
}

viewPick();
