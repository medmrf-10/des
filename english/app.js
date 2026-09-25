/* إنجليزي بالمحتوى القصير — SPA بسيطة بلا باك إند.
   التخزين: localStorage key 'enbank' → {word:{en,ar,clip,box,due,seen,ok}} */
const LS = 'enbank';
const BOX_DAYS = [0, 1, 2, 4, 7, 15];       // صناديق SRS مبسطة
const app = document.getElementById('app');
const $ = s => document.querySelector(s);
// esc/normTok/dictDiff/loadCards/todayISO/... في core.js (مشترك مع routine.html)

let bank = JSON.parse(localStorage.getItem(LS) || 'null');
if (!bank) {
  bank = {};
  for (const [en, ar, clip] of SEED_WORDS) bank[en.toLowerCase()] = {en, ar, clip, box: 1, due: Date.now(), seen: 0, ok: 0};
  save();
}
function save(){ localStorage.setItem(LS, JSON.stringify(bank)); }
function dueList(){ return Object.values(bank).filter(w => w.due <= Date.now()); }
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'), 1800); }
function refreshPills(){
  $('#bankCount').textContent = Object.keys(bank).length;
  const d = dueList().length;
  const dc = $('#dueCount'); dc.textContent = d; dc.classList.toggle('zero', !d);
}

/* ---------- المقاطع ---------- */
function viewFeed(){
  app.innerHTML = `<div class="head"><h2>المقاطع القصيرة</h2><span style="color:var(--muted);font-size:13px">اضغط أي كلمة لحفظها في بنكك</span></div>
  <div class="grid">${CLIPS.map((c,i)=>`
    <div class="card">
      <div class="frame"><iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/${c.id}" title="${esc(c.title)}" allowfullscreen></iframe></div>
      <div class="body">
        <h3>${esc(c.title)}</h3>
        <div class="meta"><span>~${Math.round(c.dur/60*10)/10} د</span><span class="kind ${c.kind==='listen'?'listen':''}">${c.kind==='listen'?'استماع':'مفردات'}</span></div>
        ${c.sentences.map((s,j)=>`
          <div class="sent">
            <div class="en">${s.words.map(w=>`<span class="w ${bank[w[0].toLowerCase()]?'saved':''}" data-en="${esc(w[0])}" data-ar="${esc(w[1])}" data-clip="${c.id}">${esc(w[0])}</span>`).join(' ')}</div>
            <button class="toggle" data-t="g${i}_${j}">عرض الترجمة الكلمة-بكلمة ↓</button>
            <div class="gloss" id="g${i}_${j}">${s.words.filter(w=>w[1]).map(w=>`<span class="pair"><b>${esc(w[0])}</b> ← ${esc(w[1])}</span>`).join('')}</div>
          </div>`).join('')}
      </div>
    </div>`).join('')}</div>`;
}

/* ---------- بنك الكلمات ---------- */
function viewBank(){
  const ws = Object.values(bank).sort((a,b)=>a.due-b.due);
  app.innerHTML = `<div class="head"><h2>بنك الكلمات</h2><button class="btn" onclick="addWordPrompt()">+ كلمة يدوية</button></div>
  ${ws.length? `<table><tr><th>الكلمة</th><th>المعنى</th><th>الصندوق</th><th>الاستحقاق</th><th>صحيح/مرات</th><th></th></tr>
  ${ws.map(w=>`<tr>
    <td class="ltr"><b>${esc(w.en)}</b></td><td>${esc(w.ar)}</td>
    <td><span class="box">${w.box}</span></td>
    <td>${w.due<=Date.now()?'الآن':fmtDue(w.due)}</td>
    <td>${w.ok}/${w.seen}</td>
    <td><button class="del" onclick="delWord('${esc(w.en)}')" title="حذف">✕</button></td>
  </tr>`).join('')}</table>` : `<div class="empty">البنك فارغ — اضغط أي كلمة داخل مقطع لحفظها هنا.</div>`}`;
}
function fmtDue(t){ const d=t-Date.now(), m=Math.round(d/60000); if(m<60) return `بعد ${m} د`; const h=Math.round(m/60); if(h<48) return `بعد ${h} س`; return `بعد ${Math.round(h/24)} يوم`; }
function addWordPrompt(){
  app.insertAdjacentHTML('beforeend', `<div class="mov open" id="mword" onclick="if(event.target===this)closeModal('mword')">
  <div class="mbox">
    <h3 style="color:var(--gold-soft);margin-bottom:14px">إضافة كلمة يدوياً</h3>
    <div style="display:flex;flex-direction:column;gap:8px">
      <input id="mw_en" class="tin" placeholder="English word — e.g. journey" autocomplete="off">
      <input id="mw_ar" class="tin" style="direction:rtl;text-align:right" placeholder="المعنى بالعربية — مثال: رحلة" autocomplete="off">
      <div id="mw_err" style="color:var(--bad);font-size:12px;min-height:14px"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="closeModal('mword')">إلغاء</button>
        <button class="btn" onclick="saveWordModal()">حفظ</button>
      </div>
      <div style="color:var(--muted);font-size:11px;margin-top:4px">أمثلة: journey — رحلة · weather — طقس · appointment — موعد</div>
    </div>
  </div></div>`);
  $('#mw_en').focus();
  $('#mw_ar').addEventListener('keydown', e=>{ if(e.key==='Enter') saveWordModal(); });
}
function closeModal(id){ const m = $('#'+id); if(m) m.remove(); }
function saveWordModal(){
  const en = $('#mw_en').value.trim(), ar = $('#mw_ar').value.trim(), err = $('#mw_err');
  if(!/^[a-zA-Z' -]+$/.test(en)){ err.textContent = 'أدخل كلمة إنجليزية صحيحة.'; return; }
  if(!ar){ err.textContent = 'أدخل المعنى العربي.'; return; }
  bank[en.toLowerCase()] = {en, ar, clip:'manual', box:1, due:Date.now(), seen:0, ok:0};
  save(); closeModal('mword'); toast('أُضيفت إلى البنك'); viewBank(); refreshPills();
}
function delWord(en){ delete bank[en.toLowerCase()]; save(); viewBank(); refreshPills(); }

/* ---------- المراجعة SRS ---------- */
let queue = [], cur = null, shown = false;
function viewReview(){
  queue = dueList().sort(()=>Math.random()-.5);
  if(!queue.length){ app.innerHTML = `<div class="empty">لا بطاقات مستحقة الآن 🎉<br><small>عُد لاحقاً أو اضغط «المقاطع» لحفظ كلمات جديدة.</small></div>`; return; }
  next();
}
function next(){
  if(!queue.length){ app.innerHTML = `<div class="empty">انتهت الجلسة ✔</div>`; refreshPills(); return; }
  cur = queue.shift(); shown = false;
  app.innerHTML = `<div class="flashcard">
    <div class="en-word">${esc(cur.en)}</div>
    <div class="ar-word" id="ans">${shown?esc(cur.ar):'؟'}</div>
    <div class="from">${cur.clip==='manual'?'أضفتها يدوياً':'من مقطع: '+clipTitle(cur.clip)}</div>
    <div class="grades" id="g">
      <button class="btn" onclick="reveal()">أظهر المعنى</button>
    </div></div>`;
}
function reveal(){
  $('#ans').textContent = cur.ar;
  $('#g').innerHTML = `<button class="g-bad" onclick="grade(0)">خطأ / نسيت</button><button class="g-good" onclick="grade(1)">صحيح</button>`;
}
function grade(ok){
  cur.seen++; if(ok) cur.ok++;
  cur.box = ok ? Math.min(cur.box+1, BOX_DAYS.length-1) : 1;
  cur.due = Date.now() + BOX_DAYS[cur.box]*86400000;
  save(); next();
}
function clipTitle(id){ const c = CLIPS.find(x=>x.id===id); return c? c.title : id; }

/* ---------- المكتبة ---------- */
let cLevel = '', cTopic = '', cType = '';
function viewContent(){
  const items = CONTENT.filter(c=>(!cLevel||c.level===cLevel)&&(!cTopic||c.topic===cTopic)&&(!cType||c.type===cType));
  app.innerHTML = `<div class="head"><h2>مكتبة التعرض المكثف</h2><span style="color:var(--muted);font-size:13px">${items.length} مادة</span></div>
  <div class="filters">
    <select onchange="cLevel=this.value;viewContent()"><option value="">كل المستويات</option>${LEVELS.map(l=>`<option value="${l}" ${l===cLevel?'selected':''}>${LEVEL_AR[l]}</option>`).join('')}</select>
    <select onchange="cTopic=this.value;viewContent()"><option value="">كل المواضيع</option>${TOPICS.map(t=>`<option ${t===cTopic?'selected':''}>${t}</option>`).join('')}</select>
    <select onchange="cType=this.value;viewContent()"><option value="">كل الأنواع</option>${Object.keys(TYPE_AR).map(t=>`<option value="${t}" ${t===cType?'selected':''}>${TYPE_AR[t]}</option>`).join('')}</select>
  </div>
  ${items.map(c=>`<div class="sent" style="margin-bottom:14px">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
      <h3 style="direction:ltr;color:var(--gold-soft)">${esc(c.title)}</h3>
      <span><span class="kind">${LEVEL_AR[c.level]}</span> <span class="kind">${TYPE_AR[c.type]}</span> <span class="kind listen">${c.topic}</span></span>
    </div>
    ${c.lines.map(l=>`
      <div style="display:flex;align-items:baseline;gap:10px;margin-top:8px;border-bottom:1px dashed var(--line);padding-bottom:6px">
        <button class="spk" data-say="${esc(l.en)}" title="استمع">🔊</button>
        <div style="flex:1"><div class="en" style="font-size:15px">${esc(l.en)}</div><div style="font-size:12px;color:var(--muted)">${esc(l.ar)}</div></div>
      </div>`).join('')}
  </div>`).join('')}
  ${items.length?'':'<div class="empty">لا مواد بهذا التصفية.</div>'}`;
}

/* ---------- النطق (SpeechSynthesis) ---------- */
let ttsRate = 1, ttsAvail = null;
function ttsCheck(){
  if(!('speechSynthesis' in window)) return false;
  const v = speechSynthesis.getVoices();
  if(!v.length) return null;                     // القائمة لم تُحمَّل بعد — وضع غير معروف
  return v.some(x => /^en/i.test(x.lang));
}
function ttsRefresh(){
  const a = ttsCheck();
  if(a !== null) ttsAvail = a;
  const b = document.getElementById('ttsbanner');
  if(b) b.classList.toggle('hidden', ttsAvail !== false);
}
function ttsInit(){
  ttsRefresh();
  if('speechSynthesis' in window) speechSynthesis.onvoiceschanged = ttsRefresh;
  setTimeout(ttsRefresh, 1500);
}
function speak(text, rate){
  try{
    if(!('speechSynthesis' in window) || ttsAvail === false){ toast('النطق غير متاح بجهازك — فعّل أصوات النظام'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = rate || ttsRate;
    speechSynthesis.speak(u);
  }catch(e){ toast('النطق غير مدعوم في متصفحك'); }
}

/* ---------- اختبار الاستماع ---------- */
let lMode = 'dictate', lLevel = 'all', quiz = [], qi = 0, score = 0;
function viewListen(){
  if(lMode==='clips'){ quiz=[...LISTEN_QUIZ].sort(()=>Math.random()-.5); qi=0; score=0; drawQClips(); return; }
  if(lMode==='dicclip'){ viewDicclip(); return; }
  let pool = LISTEN_LINES.filter(l=>lLevel==='all'||l.level===lLevel);
  quiz = pool.sort(()=>Math.random()-.5).slice(0,10); qi=0; score=0;
  drawQ();
}
function drawQ(){
  if(qi>=quiz.length){ app.innerHTML=`<div class="quiz"><div class="score">النتيجة: ${score} / ${quiz.length}</div><div class="empty"><button class="btn" onclick="viewListen()">إعادة</button></div></div>`; return; }
  const q = quiz[qi];
  const head = `<div class="head"><h2>اختبار الاستماع — ${lMode==='dictate'?'إملاء':'اختيار'}</h2><span style="color:var(--muted)">${qi+1}/${quiz.length} · ${LEVEL_AR[q.level]||''}</span></div>
  <div class="listenbar">
    <button class="btn" onclick="speak(quiz[qi].en)">🔊 استمع</button>
    <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="speak(quiz[qi].en,0.6)">🐢 بطيء</button>
    <label style="color:var(--muted);font-size:12px">السرعة <input type="range" min="0.5" max="1.5" step="0.05" value="${ttsRate}" oninput="ttsRate=+this.value"></label>
  </div>`;
  if(lMode==='dictate'){
    app.innerHTML = `<div class="quiz">${head}
    <div class="q"><div class="stem" style="color:var(--muted);font-size:13px">استمع ثم اكتب الجملة بالإنجليزية:</div>
      <div class="opts" style="direction:ltr"><input id="ans_in" class="tin" placeholder="Type what you heard..." autocomplete="off" onkeydown="if(event.key==='Enter')checkDict()"></div>
      <div class="opts"><button class="btn" onclick="checkDict()">تحقق</button></div>
      <div class="res" id="res"></div>
    </div>
    <div style="text-align:center;margin-top:14px"><button class="btn" id="nextBtn" style="display:none" onclick="qi++;drawQ()">التالي ←</button></div></div>`;
    $('#ans_in').focus();
  }else{
    const others = LISTEN_LINES.filter(l=>l.en!==q.en&&l.level===q.level);
    const distract = (others.length>=3?others:LISTEN_LINES.filter(l=>l.en!==q.en)).sort(()=>Math.random()-.5).slice(0,3);
    const opts=[q,...distract].sort(()=>Math.random()-.5);
    app.innerHTML = `<div class="quiz">${head}
    <div class="q" id="qc"><div class="stem" style="color:var(--muted);font-size:13px">استمع ثم اختر الجملة التي سمعتها:</div>
      <div class="opts" style="flex-direction:column;align-items:stretch">${opts.map((o,i)=>`<button style="text-align:left" onclick="pickTTS(this,${i})" data-en="${esc(o.en)}">${esc(o.en)}</button>`).join('')}</div>
      <div class="ar-hint">المعنى: ${esc(q.ar)}</div>
    </div>
    <div style="text-align:center;margin-top:14px"><button class="btn" id="nextBtn" style="display:none" onclick="qi++;drawQ()">التالي ←</button></div></div>`;
  }
}
function checkDict(){
  const q = quiz[qi], inp = $('#ans_in').value.trim();
  const d = dictDiff(q.en, inp);
  if(d.pct===100) score++;
  else if(d.pct>=70) score+=0.5;
  $('#res').innerHTML = `<div style="margin-top:10px"><div class="en" style="font-size:16px">${d.html}</div>
    <div style="color:var(--gold-soft);margin-top:8px">الدقة: ${d.pct}%${d.extra?` · ${d.extra} كلمة زائدة`:''} — ${esc(q.ar)}</div>
    <div style="color:var(--muted);font-size:12px;margin-top:4px">أدخلك: «${esc(inp)}»</div></div>`;
  $('#nextBtn').style.display='inline-block';
}
function pickTTS(btn, i){
  const q = quiz[qi], qc = $('#qc');
  if(qc.classList.contains('done')) return;
  qc.classList.add('done');
  qc.querySelectorAll('.opts button').forEach(b=>{
    if(b.dataset.en===q.en) b.classList.add('right');
    else if(b===btn) b.classList.add('wrong');
    b.disabled=true;
  });
  if(btn.dataset.en===q.en) score++;
  $('#nextBtn').style.display='inline-block';
}
function viewListenMenu(){
  const noTts = (ttsAvail === false);
  if(noTts && (lMode==='dictate' || lMode==='choice')) lMode = 'dicclip';
  app.innerHTML = `<div class="quiz"><div class="head"><h2>اختبار الاستماع</h2></div>
  ${noTts?'<div style="color:var(--gold-soft);font-size:13px;margin-bottom:12px;border:1px dashed var(--gold-dim);border-radius:10px;padding:8px 14px">النطق الاصطناعي غير متاح بجهازك — تمارين TTS معطّلة؛ استعمل «إملاء مقطع» أو «مقاطع يوتيوب».</div>':''}
  <div class="filters">
    <select onchange="lMode=this.value"><option value="dictate" ${noTts?'disabled':''} ${lMode==='dictate'?'selected':''}>إملاء TTS: استمع واكتب${noTts?' (غير متاح)':''}</option><option value="choice" ${noTts?'disabled':''} ${lMode==='choice'?'selected':''}>اختيار: استمع واختر${noTts?' (غير متاح)':''}</option><option value="dicclip" ${lMode==='dicclip'?'selected':''}>إملاء مقطع: صوت حقيقي</option><option value="clips" ${lMode==='clips'?'selected':''}>مقاطع يوتيوب</option></select>
    <select onchange="lLevel=this.value"><option value="all" ${lLevel==='all'?'selected':''}>كل المستويات</option>${LEVELS.map(l=>`<option value="${l}" ${l===lLevel?'selected':''}>${LEVEL_AR[l]}</option>`).join('')}</select>
    <button class="btn" onclick="viewListen()">ابدأ ←</button>
  </div>
  <div class="empty" style="text-align:right">• «إملاء»: يقرأ المتصفح جملة إنجليزية (SpeechSynthesis) وتكتبها بدقة.<br>• «اختيار»: استمع واختر الجملة الصحيحة من أربع.<br>• «مقاطع يوتيوب»: الاختبار الأصلي على المقاطع المدمجة.<br>تحكم بالسرعة أعلى التمرين (0.5×–1.5×).</div></div>`;
}

function drawQClips(){
  if(qi >= quiz.length){
    app.innerHTML = `<div class="quiz"><div class="score">النتيجة: ${score} / ${quiz.length}</div>
      <div class="empty"><button class="btn" onclick="viewListenMenu()">القائمة</button></div></div>`;
    return;
  }
  const q = quiz[qi];
  const opts = [...q.options].sort(()=>Math.random()-.5);
  app.innerHTML = `<div class="quiz">
    <div class="head"><h2>اختبار الاستماع — مقاطع يوتيوب</h2><span style="color:var(--muted)">سؤال ${qi+1}/${quiz.length}</span></div>
    <div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${q.clip}" title="listen" allowfullscreen></iframe></div>
    <div class="q" id="qc">
      <div class="stem">${esc(q.text)}</div>
      <div class="opts">${opts.map((o,i)=>`<button onclick="pick(this,${i})" data-en="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      <div class="ar-hint">المعنى: ${esc(q.ar)}</div>
    </div>
    <div style="text-align:center;margin-top:14px"><button class="btn" id="nextBtn" style="display:none" onclick="qi++;drawQClips()">التالي ←</button></div>
  </div>`;
}
function pick(btn, i){
  const q = quiz[qi], qc = $('#qc');
  if(qc.classList.contains('done')) return;
  qc.classList.add('done');
  qc.querySelectorAll('.opts button').forEach(b=>{
    if(b.dataset.en === q.answer) b.classList.add('right');
    else if(b === btn) b.classList.add('wrong');
    b.disabled = true;
  });
  if(btn.dataset.en === q.answer) score++;
  $('#nextBtn').style.display = 'inline-block';
}

/* ---------- مدرب المفردات FSRS ---------- */
function vocabPool(){
  const seen = new Set(), out = [];
  const push = (en, ar, src) => {
    const k = en.toLowerCase(); if(seen.has(k)) return;
    seen.add(k); out.push({en, ar, src});
  };
  for(const w of SEED_WORDS) push(w[0], w[1], 'seed');
  for(const c of CONTENT) for(const l of c.lines) push(l.en, l.ar, c.id);
  return out;
}
function ensureDeck(){
  let cards = loadCards();
  if(Object.keys(cards).length === 0){
    vocabPool().slice(0, 80).forEach((v, i)=>{
      cards['c'+i] = {en:v.en, ar:v.ar, src:v.src, repetitions:0, ease:2.5, interval:0, lastReview:null, nextReview:null, lapses:0, state:'new'};
    });
    saveCards(cards);
  }
  return cards;
}
let tQueue = [], tCard = null, tRevealed = false;
function viewTrain(){
  const cards = ensureDeck();
  const due = Object.entries(cards).filter(([id,c]) =>
    c.state==='new' || !c.lastReview || !c.nextReview || c.nextReview <= todayISO());
  const learned = Object.values(cards).filter(c=>c.repetitions>0).length;
  const lapses = Object.values(cards).reduce((s,c)=>s+(c.lapses||0),0);
  tQueue = due.sort((a,b)=> (a[1].state==='new'?1:0)-(b[1].state==='new'?1:0));
  if(!tQueue.length){
    app.innerHTML = `<div class="quiz"><div class="head"><h2>مدرب المفردات (FSRS)</h2></div>
    <div class="empty">لا بطاقات مستحقة اليوم — عدّ غداً.<br><br>
    <span style="font-size:13px">المجموع: ${Object.keys(cards).length} · متعلَّمة: ${learned} · نسيان: ${lapses}</span><br><br>
    <button class="btn" onclick="route()">العودة</button></div></div>`;
    return;
  }
  tCard = tQueue[0]; tRevealed = false;
  drawTrain();
}
function drawTrain(){
  const [id, c] = tCard;
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>مدرب المفردات (FSRS)</h2><span style="color:var(--muted)">متبقية: ${tQueue.length} · ${c.state==='new'?'جديدة':'مراجعة'}</span></div>
  <div class="q" style="text-align:center">
    <div class="en" style="font-size:26px;margin:18px 0">${esc(c.en)}</div>
    <div id="back" style="display:none">
      <div style="color:var(--gold-soft);font-size:18px;margin-bottom:16px">${esc(c.ar)}</div>
      <div class="grades">${[['نسيت',1],['صعب',3],['جيد',4],['سهل',5]].map(([t,q])=>{
        const nx = window.FSRS.schedule({repetitions:c.repetitions, ease:c.ease, interval:c.interval, lastReview:c.lastReview, quality:q});
        return `<button class="btn" onclick="gradeCard(${q})"><span style="display:block;font-size:11px;opacity:.75">${nx.newInterval}ي</span>${t}</button>`;
      }).join('')}</div>
    </div>
    <button class="btn" id="revBtn" onclick="document.getElementById('back').style.display='block';this.style.display='none'">أظهر المعنى</button>
  </div></div>`;
}
function gradeCard(q){
  const [id, c] = tCard;
  const res = window.FSRS.schedule({repetitions:c.repetitions, ease:c.ease, interval:c.interval, lastReview:c.lastReview, quality:q}, {fuzz:true});
  const cards = loadCards();
  cards[id] = {...c, repetitions:res.repetitions, ease:res.newEase, interval:res.newInterval,
    lastReview:todayISO(), nextReview:res.nextReview, lapses:res.lapses, state:res.state};
  saveCards(cards);
  tQueue.shift();
  if(!tQueue.length){ viewTrain(); return; }
  tCard = tQueue[0]; drawTrain();
}

/* ---------- إملاء مقطع (صوت المكتبة فقط) ---------- */
let dcItem = null;
function viewDicclip(){
  dcModal = false;
  const pool = [];
  for(const c of CLIPS) for(const s of (c.sentences||[])) if(s.text && s.text.split(' ').length>=3) pool.push({clip:c.id, title:c.title, text:s.text});
  dcItem = pool[Math.floor(Math.random()*pool.length)];
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>إملاء مقطع</h2><span style="color:var(--muted)">استمع للمقطع واكتب الجملة</span></div>
  <div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${dcItem.clip}" title="dictation" allowfullscreen></iframe></div>
  <div class="q"><div class="stem" style="color:var(--muted);font-size:13px">${esc(dcItem.title)} — اكتب الجملة التي تسمعها (حرف بحرف):</div>
    <div class="opts" style="direction:ltr"><input id="dc_in" class="tin" placeholder="Type the sentence..." autocomplete="off" onkeydown="if(event.key==='Enter')checkDicclip()"></div>
    <div class="opts"><button class="btn" onclick="checkDicclip()">تحقق</button>
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewDicclip()">جملة أخرى</button></div>
    <div class="res" id="dc_res"></div>
  </div></div>`;
  $('#dc_in').focus();
}
function checkDicclip(){
  const typed = $('#dc_in').value;
  const d = dictDiff(dcItem.text, typed);
  $('#dc_res').innerHTML = `<div class="en" style="font-size:18px;margin-top:10px;letter-spacing:.3px">${d.html}</div>
    <div style="color:var(--gold-soft);margin-top:8px">الدقة: ${d.pct}%${d.extra?` · ${d.extra} كلمة زائدة`:''}</div>
    <div style="color:var(--muted);font-size:12px;margin-top:4px">أدخلك: «${esc(typed)}»</div>
    <div style="margin-top:10px"><button class="btn" onclick="${dcModal?'openDicclipFor(dcItem.clip)':'viewDicclip()'}">التالي ←</button></div>`;
}

/* ---------- اختبار الإتقان ---------- */
const MASTERY_KEY = 'en_mastery';
let mQs = [], mI = 0, mScore = 0;
function masteryPool(){
  const out = [];
  for(const c of CONTENT) for(const l of c.lines) out.push({en:l.en, ar:l.ar, level:c.level});
  return out;
}
function viewMaster(){
  const pool = masteryPool();
  const used = new Set(); mQs = []; mI = 0; mScore = 0;
  while(mQs.length < 10 && used.size < pool.length){
    const s = pool[Math.floor(Math.random()*pool.length)];
    if(used.has(s.en)) continue;
    const norm = s.en.replace(/[^a-zA-Z' ]/g,'');
    const words = norm.split(' ').filter(w=>w.length>3);
    if(!words.length) continue;
    used.add(s.en);
    const ans = words[Math.floor(Math.random()*words.length)];
    const parts = s.en.split(' ');
    const idx = parts.findIndex(p=>p.toLowerCase().replace(/[^a-z']/g,'')===ans.toLowerCase());
    if(idx < 0) continue;
    parts[idx] = '_____';
    const others = new Set();
    let guard = 0;
    while(others.size < 3 && guard++ < 60){
      const s2 = pool[Math.floor(Math.random()*pool.length)];
      const ws = s2.en.replace(/[^a-zA-Z' ]/g,'').split(' ').filter(w=>w.length>3 && w.toLowerCase()!==ans.toLowerCase());
      if(ws.length) others.add(ws[Math.floor(Math.random()*ws.length)]);
    }
    if(others.size < 3) continue;
    mQs.push({blank:parts.join(' '), ans, opts:[ans, ...others].sort(()=>Math.random()-.5), en:s.en, ar:s.ar});
  }
  drawM();
}
function drawM(){
  if(mI >= mQs.length){
    const hist = JSON.parse(localStorage.getItem(MASTERY_KEY)||'[]');
    hist.push({d:todayISO(), s:mScore, t:mQs.length});
    localStorage.setItem(MASTERY_KEY, JSON.stringify(hist));
    app.innerHTML = `<div class="quiz"><div class="score">الإتقان: ${mScore} / ${mQs.length}</div>
      <div class="empty"><button class="btn" onclick="viewMaster()">إعادة</button>
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="location.hash='#/progress'">التقدم ←</button></div></div>`;
    return;
  }
  const q = mQs[mI];
  app.innerHTML = `<div class="quiz">
    <div class="head"><h2>اختبار الإتقان</h2><span style="color:var(--muted)">سؤال ${mI+1}/${mQs.length}</span></div>
    <div class="q" id="mq"><div class="stem" style="direction:ltr;text-align:left;font-size:17px">${esc(q.blank)}</div>
      <div class="opts">${q.opts.map(o=>`<button data-en="${esc(o)}" onclick="pickM(this)">${esc(o)}</button>`).join('')}</div>
      <div class="ar-hint">${esc(q.ar)}</div>
    </div>
    <div style="text-align:center;margin-top:14px"><button class="btn" id="mNext" style="display:none" onclick="mI++;drawM()">التالي ←</button></div></div>`;
}
function pickM(btn){
  const q = mQs[mI], mq = $('#mq');
  if(mq.classList.contains('done')) return;
  mq.classList.add('done');
  mq.querySelectorAll('.opts button').forEach(b=>{
    if(b.dataset.en === q.ans) b.classList.add('right');
    else if(b === btn) b.classList.add('wrong');
    b.disabled = true;
  });
  if(btn.dataset.en === q.ans) mScore++;
  $('#mNext').style.display = 'inline-block';
}

/* ---------- التقدم ---------- */
function viewProgress(){
  const cards = loadCards();
  const ids = Object.values(cards);
  const due = ids.filter(c=>c.state==='new' || !c.nextReview || c.nextReview <= todayISO()).length;
  const learned = ids.filter(c=>c.repetitions>0).length;
  const lapses = ids.reduce((s,c)=>s+(c.lapses||0),0);
  const mast = JSON.parse(localStorage.getItem(MASTERY_KEY)||'[]');
  const avg = mast.length ? Math.round(mast.reduce((s,m)=>s+m.s/m.t,0)/mast.length*100) : 0;
  app.innerHTML = `<div class="quiz"><div class="head"><h2>التقدم</h2></div>
  <div class="sent" style="margin-bottom:14px"><h3 style="color:var(--gold-soft)">مدرب المفردات (FSRS)</h3>
    <div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:8px">
      <span>البطاقات: <b style="color:var(--gold-soft)">${ids.length}</b></span>
      <span>مستحقة اليوم: <b style="color:var(--gold-soft)">${due}</b></span>
      <span>متعلَّمة: <b style="color:var(--ok)">${learned}</b></span>
      <span>نسيان: <b style="color:var(--bad)">${lapses}</b></span>
    </div>
    <div style="margin-top:10px"><button class="btn" onclick="location.hash='#/train'">ابدأ التدريب ←</button></div>
  </div>
  <div class="sent" style="margin-bottom:14px"><h3 style="color:var(--gold-soft)">بنك الكلمات</h3>
    <div style="margin-top:8px">المحفوظة: <b style="color:var(--gold-soft)">${Object.keys(bank).length}</b> · مستحقة: <b style="color:var(--gold-soft)">${dueList().length}</b></div>
  </div>
  <div class="sent"><h3 style="color:var(--gold-soft)">اختبار الإتقان</h3>
    <div style="margin-top:8px">المحاولات: <b style="color:var(--gold-soft)">${mast.length}</b> · متوسط الدقة: <b style="color:var(--gold-soft)">${avg}%</b></div>
    ${mast.length ? `<div style="margin-top:10px">${mast.slice(-10).map(m=>`<div style="display:flex;justify-content:space-between;border-bottom:1px dashed var(--line);padding:5px 0;font-size:13px"><span>${m.d}</span><span style="color:${m.s/m.t>=0.7?'var(--ok)':'var(--bad)'}">${m.s}/${m.t}</span></div>`).join('')}</div>` : '<div style="color:var(--muted);font-size:13px;margin-top:8px">لا محاولات بعد.</div>'}
    <div style="margin-top:10px"><button class="btn" onclick="viewMaster()">ابدأ اختبار الإتقان ←</button></div>
  </div></div>`;
}

/* ---------- وضع ShortForm ---------- */
let feedSeen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'));
function learnedWords(){
  const s = new Set();
  Object.values(loadCards()).forEach(c=>{ if(c.repetitions>0) c.en.split(' ').forEach(t=>{ const w=normTok(t); if(w) s.add(w); }); });
  Object.values(bank).forEach(w=>{ if(w.box>=3){ const t=normTok(w.en); if(t) s.add(t); } });
  return s;
}
function viewShort(){
  const cards = CLIPS.map((c,i)=>{
    const sents = c.sentences||[];
    return `<div class="fcard" data-i="${i}">
      <div class="fc-top"><span class="fc-idx">${i+1} / ${CLIPS.length}</span><span class="fc-title">${esc(c.title)}</span></div>
      <div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${c.id}" title="${esc(c.title)}" allowfullscreen loading="lazy"></iframe></div>
      <div class="fc-lines">${sents.map(s=>`
        <div class="fc-line" dir="ltr">${esc(s.text)}</div>
        <div class="fc-words">${(s.words||[]).filter(([e])=>normTok(e).length>1).map(([e,a])=>`<span class="w" data-en="${esc(e)}" data-ar="${esc(a)}" data-clip="${c.id}">${esc(e)}</span>`).join('')}</div>`).join('')}
      </div>
      <button class="btn fc-train" onclick="openDicclipFor('${c.id}')">درب — إملاء هذا المقطع</button>
    </div>`;
  }).join('');
  app.innerHTML = `<div class="feed" id="feed">${cards}</div>
  <div class="fprog"><div id="fprogbar"></div></div>
  <div class="fcounter" id="fcounter"></div>
  <div class="farrows"><button onclick="feedGo(-1)" title="السابق">▲</button><button onclick="feedGo(1)" title="التالي">▼</button></div>`;
  const feed = $('#feed');
  const fit = ()=>{ feed.style.height = (innerHeight - document.querySelector('.topbar').offsetHeight - ($('#ttsbanner')?.offsetHeight||0)) + 'px'; };
  fit();
  feed.addEventListener('scroll', onFeedScroll, {passive:true});
  const qc = new URLSearchParams(location.search).get('clip');
  const qi = qc ? CLIPS.findIndex(c=>c.id===qc) : -1;
  if(qi > 0){ setTimeout(()=>{ feed.scrollTop = qi*feed.clientHeight; }, 60); }
  else markFeedCard(0);
}
function onFeedScroll(){
  const feed = $('#feed'); if(!feed) return;
  const i = Math.max(0, Math.min(CLIPS.length-1, Math.round(feed.scrollTop / feed.clientHeight)));
  markFeedCard(i);
}
function markFeedCard(i){
  const feed = $('#feed'); if(!feed) return;
  const card = feed.children[i]; if(!card) return;
  const bar = $('#fprogbar'); if(bar) bar.style.width = ((i+1)/CLIPS.length*100)+'%';
  const learned = learnedWords();
  card.querySelectorAll('.w').forEach(w=>{ const t=normTok(w.dataset.en); if(t) feedSeen.add(t); });
  localStorage.setItem(SEEN_KEY, JSON.stringify([...feedSeen]));
  const mastered = [...feedSeen].filter(w=>learned.has(w)).length;
  const fc = $('#fcounter');
  if(fc) fc.innerHTML = `<b>${i+1}/${CLIPS.length}</b> · متقنة <b>${mastered}</b> · تعرّضت <b>${feedSeen.size}</b>`;
}
function feedGo(d){
  const feed = $('#feed'); if(!feed) return;
  feed.scrollTo({top: feed.scrollTop + d*feed.clientHeight, behavior:'smooth'});
}

/* ---------- إملاء مقطع محدد (مودال) ---------- */
let dcModal = false;
function openDicclipFor(clipId){
  const old = $('#dicm'); if(old) old.remove();
  const c = CLIPS.find(x=>x.id===clipId); if(!c) return;
  const ss = (c.sentences||[]).filter(s=>s.text && s.text.trim().split(/\s+/).length>=3);
  if(!ss.length){ toast('لا جمل لهذا المقطع'); return; }
  const s = ss[Math.floor(Math.random()*ss.length)];
  dcItem = {clip:c.id, title:c.title, text:s.text};
  dcModal = true;
  app.insertAdjacentHTML('beforeend', `<div class="mov open" id="dicm" onclick="if(event.target===this)closeModal('dicm')">
  <div class="mbox">
    <h3 style="color:var(--gold-soft);margin-bottom:10px">إملاء — ${esc(c.title)}</h3>
    <div class="frame" style="margin-bottom:10px"><iframe src="https://www.youtube-nocookie.com/embed/${c.id}" title="dictation" allowfullscreen></iframe></div>
    <input id="dc_in" class="tin" placeholder="اكتب الجملة التي تسمعها..." autocomplete="off" onkeydown="if(event.key==='Enter')checkDicclip()">
    <div id="dc_res" class="res"></div>
    <div style="display:flex;gap:8px;margin-top:10px;justify-content:flex-end">
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="closeModal('dicm')">إغلاق</button>
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="openDicclipFor('${c.id}')">جملة أخرى</button>
      <button class="btn" onclick="checkDicclip()">تحقق</button>
    </div>
  </div></div>`);
  setTimeout(()=>{ const el=$('#dc_in'); if(el) el.focus(); }, 60);
}

/* ---------- توجيه ---------- */
const routes = {'feed':viewFeed, 'content':viewContent, 'train':viewTrain, 'bank':viewBank, 'review':viewReview, 'listen':viewListenMenu, 'progress':viewProgress, 'short':viewShort};
function route(){
  const r = (location.hash.replace('#/','') || 'feed');
  document.body.classList.toggle('shortmode', r==='short');
  (routes[r] || viewFeed)();
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active', a.dataset.nav===r));
  refreshPills();
}
window.addEventListener('hashchange', route);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') document.querySelectorAll('.mov.open').forEach(m=>m.remove()); });
ttsInit();
route();

/* ---------- تفويض النقرات ---------- */
app.addEventListener('click', e=>{
  const t = e.target;
  if(t.classList.contains('toggle')){ document.getElementById(t.dataset.t).classList.toggle('show'); return; }
  if(t.classList.contains('spk')){ speak(t.dataset.say); return; }
  if(t.classList.contains('w')){
    const key = t.dataset.en.toLowerCase();
    if(bank[key]) toast('«'+t.dataset.en+'» محفوظة مسبقاً');
    else{
      bank[key] = {en:t.dataset.en, ar:t.dataset.ar||'؟', clip:t.dataset.clip, box:1, due:Date.now(), seen:0, ok:0};
      save(); toast('حُفظت «'+t.dataset.en+'» في البنك');
    }
    t.classList.add('saved');
    refreshPills();
  }
});
