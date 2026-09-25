/* الفكرة العامة — 15 جملة (10-15 كلمة) من كوربس القصص: استمع TTS ← اختر الفكرة من 4
   (صحيحة + 3 مشتتات من جمل قريبة بنفس القصة) ← النص + الترجمة + النقطة الحرجة.
   en_gist = {idx:{ok,w}} — x:1 = مشتّت فقط لا يُختبر. */
const app = document.getElementById('app');
const GKEY = 'en_gist';

const GISTS = [
// — قصة الرجل العجوز —
{s:'Suddenly, an old man sat next to her and smiled.',a:'فجأة جلس رجل عجوز بجانبها وابتسم.',g:'رجل عجوز جلس بجانبها فجأة',k:'old man sat next to her',grp:0},
{s:'He told her about his garden and his three cats.',a:'أخبرها عن حديقته وقططه الثلاثة.',g:'أخبرها عن حديقته وقططه',k:'garden and his three cats',grp:0},
{s:'She wrote about the old man on the first page.',a:'كتبت عن الرجل العجوز في الصفحة الأولى.',g:'كتبت عنه في الصفحة الأولى',k:'on the first page',grp:0},
{s:'Three days passed and there was no sign of him.',a:'مرت ثلاثة أيام ولا أثر له.',g:'اختفى ثلاثة أيام بلا أثر',k:'no sign of him',grp:0},
// — قصة القط التائه —
{s:'On Friday, she heard a small cry from the old bakery.',a:'يوم الجمعة سمعت مواءً ضعيفاً من المخبز القديم.',g:'سمعت مواءً من المخبز القديم',k:'small cry from the old bakery',grp:1},
{s:'The baker, who still owned the shop, laughed when he heard.',a:'ضحك الخبّاز الذي ما زال يملك المتجر حين سمع الخبر.',g:'ضحك الخبّاز حين سمع',k:'laughed when he heard',grp:1},
{s:'The posters had said "Lost Cat" with Milo\'s phone number.',a:'كانت الملصقات تقول «قط تائه» ورقم هاتف ميلو.',g:'ملصقات «قط تائه» ورقم هاتف',k:'Lost Cat',grp:1},
{s:'The shop was old, and the wooden floors made noise.',a:'كان المتجر قديماً وأرضيته الخشبية تصرّ.',g:'متجر قديم أرضيته الخشبية تصرّ',k:'wooden floors',grp:1,x:1},
// — قصة المنار —
{s:'The lighthouse stood on a rock above the sea for a hundred years.',a:'وقف المنار على صخرة فوق البحر منذ مئة عام.',g:'منار عمره مئة عام فوق صخرة',k:'for a hundred years',grp:2},
{s:'Tom was the last keeper, and he refused to leave.',a:'كان توم آخر حارس ورفض المغادرة.',g:'آخر حارس رفض الرحيل',k:'refused to leave',grp:2},
{s:'Every morning he climbed the stairs and cleaned the great lamp.',a:'كل صباح صعد الدرج ونظّف المصباح العظيم.',g:'يرعى المصباح كل صباح',k:'cleaned the great lamp',grp:2},
{s:'He painted the walls white and repaired the broken door.',a:'طلّى الجدران بيضاء وأصلح الباب المكسور.',g:'رمّم الجدران والباب المكسور',k:'repaired the broken door',grp:2},
// — قصة الرسالة —
{s:'The letter arrived on a Thursday, with no stamp and no address.',a:'وصلت الرسالة يوم خميس بلا طابع ولا عنوان.',g:'رسالة مجهولة بلا طابع ولا عنوان',k:'no stamp and no address',grp:3},
{s:'She had found the notebook on a bench and kept it.',a:'وجدت الدفتر على مقعد واحتفظت به.',g:'وجدت دفتراً على مقعد',k:'found the notebook on a bench',grp:3},
{s:'Inside were beautiful drawings of cities she had never seen.',a:'كانت بداخله رسومات جميلة لمدن لم ترها قط.',g:'رسومات لمدن لم ترها قط',k:'cities she had never seen',grp:3},
{s:'She wrote back and left the letter at the same bench.',a:'ردّت وتركت الرسالة على المقعد نفسه.',g:'ردّت وتركت الرسالة عند المقعد',k:'at the same bench',grp:3},
];
const QU = GISTS.map((x,i)=>({...x,i})).filter(x=>!x.x);

function loadG(){ try{ return JSON.parse(localStorage.getItem(GKEY)||'{}'); }catch(e){ return {}; } }
function saveG(d){ localStorage.setItem(GKEY, JSON.stringify(d)); }
function rec(i){ return loadG()[i]||{ok:0,w:0}; }
function hardest(){
  const d = loadG();
  return QU.map(q=>{
    const r = d[q.i]||{ok:0,w:0};
    const t = r.ok+r.w;
    return {i:q.i,s:q.s,n:t, pct:t? Math.round(r.ok/t*100):100};
  }).filter(x=>x.n>=1 && x.pct<100).sort((a,b)=>a.pct-b.pct||b.n-a.n).slice(0,8);
}
function shuf(a){ const x=[...a]; for(let i=x.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; } return x; }
const ttsOK = () => window.speechSynthesis && speechSynthesis.getVoices().some(v=>/^en/i.test(v.lang));
function say(t,rate){
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=rate||0.92;
  speechSynthesis.speak(u);
}
if(window.speechSynthesis) speechSynthesis.onvoiceschanged = ()=>{};

let queue = [], qi = 0, score = 0, cur = -1, opts = [];
function optsFor(it){
  const mates = QU.filter(x=>x.grp===it.grp && x.i!==it.i).map(x=>x.g);
  const extra = GISTS.filter(x=>x.grp===it.grp && x.i!==it.i && x.x).map(x=>x.g);
  return shuf([it.g, ...shuf([...mates, ...extra]).slice(0,3)]);
}
function bars(h){
  return h.map(x=>`<div class="cbar"><span class="cw" dir="ltr">${esc(x.s.slice(0,26))}${x.s.length>26?'…':''}</span><span class="ctr"><span class="cfl" style="width:${100-x.pct}%"></span></span><span class="cv">${x.pct}% (${x.n})</span></div>`).join('');
}
function viewHome(){
  const d = loadG();
  const seen = QU.filter(q=>d[q.i]).length;
  const totOk = Object.values(d).reduce((s,r)=>s+(r.ok||0),0);
  const totW = Object.values(d).reduce((s,r)=>s+(r.w||0),0);
  const h = hardest();
  app.innerHTML = `<div class="head"><h2>الفكرة العامة — ${QU.length} مقطعاً</h2><span class="rstreak">${totOk+totW?`صحيحة ${totOk}/${totOk+totW}`:''}</span></div>
  <div class="card"><div class="body" style="text-align:center">
    استمع للجملة (بلا نص) واختر فكرتها العامة من أربعة — المشتتات من جمل قريبة في نفس القصة. ${seen?`أنجزت ${seen}/${QU.length}.`:''}
    <div class="grades" style="justify-content:center">
      <button class="btn" onclick="startG()">ابدأ ←</button>
      ${h.length?`<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="startG(true)">أصعب ${h.length} ←</button>`:''}
    </div></div></div>
  ${h.length?`<div class="head"><h2>أصعب المقاطع عندك</h2></div>
  <div class="card"><div class="body">${bars(h)}</div></div>`:''}`;
}
function startG(hard){
  score = 0;
  const untried = QU.filter(q=>!rec(q.i).ok && !rec(q.i).w).map(q=>q.i);
  queue = hard ? hardest().map(x=>x.i) : (untried.length? untried : QU.map(q=>q.i));
  qi = 0;
  drawG();
}
function drawG(){
  cur = queue[qi];
  const it = QU.find(q=>q.i===cur);
  opts = optsFor(it);
  const hasT = ttsOK();
  app.innerHTML = `<div class="head"><h2>المقطع ${qi+1}/${queue.length}</h2><span class="muted">صحيحة ${score}</span></div>
  <div class="quiz"><div class="q">
    ${hasT
      ?`<div style="text-align:center;margin-bottom:8px">
        <button class="btn" onclick="say(QU.find(q=>q.i===${cur}).s)">أعد الاستماع 🔊</button>
        <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="say(QU.find(q=>q.i===${cur}).s,0.7)">بطيء</button>
      </div>
      <div class="muted" style="text-align:center;margin-bottom:6px">ما الفكرة العامة لما سمعت؟</div>`
      :`<div class="muted" style="margin-bottom:8px">النطق غير متاح في هذا المتصفح — اقرأ الجملة واختر فكرتها:</div>
      <div dir="ltr" style="text-align:left;font-size:17px;margin-bottom:10px">${esc(it.s)}</div>`}
    <div class="opts">${opts.map(o=>`<button onclick="pickG(this,'${o.replace(/'/g,"\\'")}')">${o}</button>`).join('')}</div>
    <div id="gRes"></div>
  </div></div>`;
  if(hasT) say(it.s);
}
function pickG(btn,o){
  const it = QU.find(q=>q.i===cur);
  const ok = o === it.g;
  document.querySelectorAll('.opts button').forEach(b=>{
    b.disabled = true;
    if(b.textContent === it.g) b.classList.add('right');
    else if(b === btn) b.classList.add('wrong');
  });
  const d = loadG();
  const r = d[cur] ||= {ok:0,w:0};
  ok ? r.ok++ : r.w++;
  saveG(d);
  if(ok) score++;
  const kIdx = it.s.indexOf(it.k);
  const marked = kIdx>=0
    ? esc(it.s.slice(0,kIdx))+'<b style="color:var(--gold)">'+esc(it.k)+'</b>'+esc(it.s.slice(kIdx+it.k.length))
    : esc(it.s);
  document.getElementById('gRes').innerHTML = `<div style="margin-top:12px">
    <div style="color:${ok?'var(--ok)':'var(--bad)'}">${ok?'✓ صحيح':'✗ الصحيحة: '+it.g}</div>
    <div dir="ltr" style="text-align:left;font-size:16px;margin-top:8px">${marked}</div>
    <div style="color:var(--muted);font-size:14px;margin-top:4px">${it.a}</div>
    <div style="margin-top:8px;font-size:13px">النقطة الحرجة: <b dir="ltr" style="color:var(--gold)">${it.k}</b></div>
    <button class="btn" style="display:block;margin:12px auto 0" onclick="nextG()">${qi+1<queue.length?'التالي ←':'النتيجة ←'}</button></div>`;
}
function nextG(){
  qi++;
  if(qi >= queue.length) endG(); else drawG();
}
function endG(){
  const h = hardest();
  app.innerHTML = `<div class="quiz"><div class="q" style="text-align:center">
    <div class="empty">انتهت — صحيحة ${score}/${queue.length}</div>
    <div class="grades"><button class="btn" onclick="viewHome()">الفكرة العامة ←</button><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="startG()">جولة أخرى</button></div>
  </div></div>
  ${h.length?`<div class="head" style="margin-top:14px"><h2>أصعب ${h.length} مقاطع</h2></div>
  <div class="card"><div class="body">${bars(h)}
  <div class="grades"><button class="btn" onclick="startG(true)">راجعها ←</button></div></div></div>`:''}`;
}

viewHome();
