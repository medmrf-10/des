/* الإملاء — 25 جملة (6-12 كلمة) من الكوربس: استمع ×2 ← اكتب ← قارن ← أعد.
   en_dictate = {idx:{ok,tries,misses:[word]}} ; en_missbank = {word:count} */
const app = document.getElementById('app');
const DKEY = 'en_dictate';
const MKEY = 'en_missbank';

const DT = [
'I do my homework every day.',
'He is on a business trip.',
'How was your trip to London?',
'I brush my teeth and wash my face.',
'Then I make a cup of coffee.',
'I eat bread and cheese for breakfast.',
'At eight I leave the house.',
'I walk to the bus stop.',
'I read a book on the bus.',
'The cat is white and very soft.',
'Every day the cat sleeps a lot.',
'It wakes up when it is hungry.',
'Sara gives it milk and fish.',
'On Friday I go to the market.',
'The market is big and crowded.',
'I buy apples, tomatoes and bread.',
'I pay the man ten dirhams.',
'He gives me a bag for free.',
'Omar found a wallet on the train.',
'It was full of money and cards.',
'There was a photo of an old man.',
'Her office was on the third floor.',
'She learned the work in two weeks.',
'Her manager was patient and kind.',
'Inside lay a letter he had never sent.',
];

function loadD(){ try{ return JSON.parse(localStorage.getItem(DKEY)||'{}'); }catch(e){ return {}; } }
function saveD(d){ localStorage.setItem(DKEY, JSON.stringify(d)); }
function loadM(){ try{ return JSON.parse(localStorage.getItem(MKEY)||'{}'); }catch(e){ return {}; } }
function saveM(m){ localStorage.setItem(MKEY, JSON.stringify(m)); }
function rec(i){ return loadD()[i]||{ok:0,tries:0,misses:[]}; }
function topMisses(){
  const m = loadM();
  return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,8);
}
function shuf(a){ const x=[...a]; for(let i=x.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; } return x; }
const ttsOK = () => window.speechSynthesis && speechSynthesis.getVoices().some(v=>/^en/i.test(v.lang));
function say2(t){
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.9;
  const u2 = new SpeechSynthesisUtterance(t); u2.lang='en-US'; u2.rate=0.9;
  speechSynthesis.speak(u); speechSynthesis.speak(u2);
}
if(window.speechSynthesis) speechSynthesis.onvoiceschanged = ()=>{};

let queue = [], qi = 0, score = 0, cur = -1;
function viewHome(){
  const d = loadD();
  const seen = Object.keys(d).length;
  const totalOk = Object.values(d).reduce((s,r)=>s+(r.ok||0),0);
  const totalTr = Object.values(d).reduce((s,r)=>s+(r.tries||0),0);
  const tm = topMisses();
  const tt = ttsOK();
  app.innerHTML = `<div class="head"><h2>الإملاء — ${DT.length} جملة</h2><span class="rstreak">${totalTr?`دقة عامة ${Math.round(totalOk/totalTr*100)}%`:''}</span></div>
  ${!tt?'<div class="card"><div class="body" style="color:var(--warn);text-align:center">النطق غير متاح بجهازك — فعّل أصوات النظام.</div></div>':''}
  <div class="card"><div class="body" style="text-align:center">
    استمع للجملة مرتين بسرعة هادئة، اكتبها، قارن كلمة-بكلمة، وأعد كتابة ما أخطأت فيه. ${seen?`أنجزت ${seen}/${DT.length}.`:''}
    <div class="grades" style="justify-content:center"><button class="btn" onclick="startD()">ابدأ جولة (10) ←</button></div>
  </div></div>
  ${tm.length?`<div class="head"><h2>أكثر الكلمات تعثراً عبر جلساتك</h2></div>
  <div class="card"><div class="body" dir="ltr" style="text-align:left">${tm.map(([w,n])=>`<span class="fc-chip" style="margin:2px">${esc(w)} <b style="color:var(--bad)">×${n}</b></span>`).join('')}</div></div>`:''}`;
}
function startD(){
  score = 0;
  const untried = DT.map((_,i)=>i).filter(i=>!rec(i).tries);
  queue = shuf(untried.length>=10? untried : DT.map((_,i)=>i)).slice(0,10);
  qi = 0;
  drawD();
}
function drawD(){
  cur = queue[qi];
  app.innerHTML = `<div class="head"><h2>الجملة ${qi+1}/${queue.length}</h2><span class="muted">مضبوطة ${score}</span></div>
  <div class="quiz"><div class="q" style="text-align:center">
    <div class="muted">النص مخفي — استمع ثم اكتب</div>
    ${ttsOK()?'<button class="btn" style="margin:10px auto;display:block" onclick="replay()">استمع ×2 🔊</button>':'<div style="color:var(--warn);margin:10px">النطق غير متاح بجهازك</div>'}
    <input class="inp" dir="ltr" id="dIn" autocomplete="off" style="width:100%;max-width:440px;margin-top:8px" placeholder="اكتب الجملة كاملة…">
    <button class="btn" style="margin-top:10px" onclick="checkD()">تحقق</button>
    <div id="dRes"></div>
  </div></div>`;
  const el = document.getElementById('dIn');
  el.onkeydown = e=>{ if(e.key==='Enter') checkD(); };
  if(ttsOK()) say2(DT[cur]);
}
function replay(){ say2(DT[cur]); }
function checkD(){
  const el = document.getElementById('dIn');
  if(el.disabled) return;
  const d = dictDiff(DT[cur], el.value);
  el.disabled = true;
  const dd = loadD();
  const r = dd[cur] ||= {ok:0,tries:0,misses:[]};
  r.tries++;
  if(d.pct===100){ r.ok++; score++; }
  r.misses = (r.misses||[]).concat(d.missed);
  saveD(dd);
  if(d.missed.length){
    const m = loadM();
    d.missed.forEach(w=>{ m[w]=(m[w]||0)+1; });
    saveM(m);
  }
  const color = d.pct>=90?'var(--ok)': d.pct>=60?'var(--warn)':'var(--bad)';
  document.getElementById('dRes').innerHTML = `<div dir="ltr" style="text-align:left;margin-top:14px;font-size:17px;line-height:1.9">${d.html}</div>
  <div style="margin-top:6px;font-size:14px">الدقة: <b style="color:${color}">${d.pct}%</b>${d.extra?` · ${d.extra} زائدة`:''}</div>
  <div dir="ltr" style="text-align:left;margin-top:4px;font-size:14px;color:var(--muted)">الصحيحة: ${esc(DT[cur])}</div>
  <div class="grades" style="justify-content:center;margin-top:12px">
    ${d.pct<100?'<button class="btn" onclick="retryD()">أعد كتابةها ⟲</button>':''}
    <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="nextD()">${qi+1<queue.length?'التالي ←':'النتيجة ←'}</button>
  </div>`;
}
function retryD(){
  const el = document.getElementById('dIn');
  el.disabled = false; el.value = ''; el.focus();
  document.getElementById('dRes').innerHTML = '';
}
function nextD(){
  qi++;
  if(qi >= queue.length) endD(); else drawD();
}
function endD(){
  const tm = topMisses();
  app.innerHTML = `<div class="quiz"><div class="q" style="text-align:center">
    <div class="empty">الجولة انتهت — مضبوطة ${score}/${queue.length}</div>
    <div class="grades"><button class="btn" onclick="viewHome()">الإملاء ←</button><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="startD()">جولة أخرى</button></div>
  </div></div>
  ${tm.length?`<div class="head" style="margin-top:14px"><h2>أكثر الكلمات تعثراً</h2></div>
  <div class="card"><div class="body" dir="ltr" style="text-align:left">${tm.map(([w,n])=>`<span class="fc-chip" style="margin:2px">${esc(w)} <b style="color:var(--bad)">×${n}</b></span>`).join('')}</div></div>`:''}`;
}

viewHome();
