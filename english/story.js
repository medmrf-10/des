/* قارئ متدرّج — 6 قصص قصيرة A2-B1
   النقر على كلمة يضيفها إلى en_bank بصيغة الصفحات الأخرى + ترجمة فورية من DICT
   en_story: {storyId:{score,total,best,ts}} */
const app = document.getElementById('app');
const $ = s => document.querySelector(s);
const STORY_LS = 'en_story';

function loadStory(){ try{ return JSON.parse(localStorage.getItem(STORY_LS)||'{}'); }catch(e){ return {}; } }
function saveStory(s){ localStorage.setItem(STORY_LS, JSON.stringify(s)); }
function ttsOn(){ try{ return speechSynthesis.getVoices().some(v=>/^en([-_]|$)/i.test(v.lang)); }catch(e){ return false; } }
function speak(t){ try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.9; speechSynthesis.speak(u); }catch(e){} }
function toastMsg(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),1800); }

/* ---------- المنتقي ---------- */
function viewPick(){
  const res = loadStory();
  const rows = STORIES.map(st=>{
    const wc = st.sentences.reduce((n,s)=>n+s.en.split(/\s+/).length,0);
    const r = res[st.id];
    return `<div class="card"><div class="body" style="display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap">
      <div style="flex:1;min-width:170px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="ltag ${st.level==='B1'?'':'ms'}">${st.level}</span>
          <b style="font-size:15px">${esc(st.titleAr)}</b>
          <span class="muted" dir="ltr" style="font-size:12px">${esc(st.title)}</span>
        </div>
        <div class="muted" style="font-size:12px;margin-top:4px">${st.sentences.length} جملة · ~${wc} كلمة${r?` · أفضل نتيجة ${r.best}/${r.total}`:''}</div>
      </div>
      <button class="btn" style="flex:0 0 auto" onclick="openStory('${st.id}')">${r?'أعد القراءة':'اقرأ القصة'} ←</button>
    </div></div>`;
  }).join('');
  app.innerHTML = `<div class="card"><div class="body" style="text-align:center">
    اقرأ قصة قصيرة بالإنجليزية <b>جملة-جملة</b>: كل جملة لها زر استماع وترجمة تُكشف بالضغط، وأي كلمة تضغطها تُترجم فوراً وتُحفظ في بنكك.
    <div class="muted" style="margin-top:6px;font-size:13px">الخطوة الأولى: اختر قصة من القائمة ↓</div>
  </div></div>
  <div class="head"><h2>اختر قصة</h2><span class="rstreak">${STORIES.length} قصص · مستوى A2–B1</span></div>
  ${rows}`;
}

/* ---------- القارئ ---------- */
let cur = null, idx = 0, showAr = false;
function openStory(id){ cur = STORIES.find(s=>s.id===id); idx = 0; showAr = false; drawSent(); }
function drawSent(){
  const s = cur.sentences[idx], tot = cur.sentences.length;
  const spans = s.en.split(/\s+/).map(w=>`<span class="w" onclick="wordClick(this)" data-w="${esc(w)}">${esc(w)}</span>`).join(' ');
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>${esc(cur.titleAr)} — ${esc(cur.title)}</h2><span style="color:var(--muted)">جملة ${idx+1}/${tot} · ${cur.level}</span></div>
  <div class="q">
    <div class="en" dir="ltr" style="font-size:20px;line-height:1.9;text-align:left;margin:12px 0">${spans}</div>
    <div style="color:var(--gold-soft);min-height:26px;margin-bottom:8px">${showAr? esc(s.ar):''}</div>
    <div id="whint" style="color:var(--muted);font-size:13px;min-height:20px;margin-bottom:8px"></div>
    <div class="grades">
      ${ttsOn()? `<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="speak(cur.sentences[idx].en)">🔊 استمع</button>`:''}
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="showAr=!showAr;drawSent()">${showAr?'إخفاء الترجمة':'الترجمة'}</button>
    </div>
    <div class="grades" style="margin-top:12px">
      ${idx>0? `<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="idx--;showAr=false;drawSent()">السابقة</button>`:''}
      ${idx<tot-1? `<button class="btn" onclick="idx++;showAr=false;drawSent()">التالية ←</button>`
        : `<button class="btn" onclick="viewQuiz()">أسئلة الفهم ←</button>`}
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewPick()">القصص ←</button>
    </div>
  </div></div>`;
}
function wordClick(el){
  const w = el.dataset.w, tok = normTok(w);
  if(!tok) return;
  const ar = DICT[tok] || '؟';
  const bank = loadBank();
  if(!bank[tok]){
    bank[tok] = {en:w, ar, clip:'story:'+cur.id, box:1, due:Date.now(), seen:0, ok:0};
    localStorage.setItem(BANK_LS, JSON.stringify(bank));
    toastMsg(`«${w}» حُفظت في البنك`);
  }
  el.classList.add('saved');
  document.getElementById('whint').innerHTML = `<b class="ltr">${esc(w)}</b> = ${esc(ar)}${ar==='؟'?' (ليست في القاموس — عدّلها من بنك الكلمات)':''}`;
}

/* ---------- أسئلة الفهم ---------- */
let qi = 0, qScore = 0;
function viewQuiz(){ qi = 0; qScore = 0; drawQuiz(); }
function drawQuiz(){
  const q = cur.quiz[qi];
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>فهم المقروء — ${esc(cur.titleAr)}</h2><span style="color:var(--muted)">سؤال ${qi+1}/${cur.quiz.length}</span></div>
  <div class="q" style="text-align:center">
    <div style="font-size:18px;margin:16px 0">${esc(q.q)}</div>
    <div class="grades">
      <button class="btn" onclick="ansQuiz(true)">صح ✓</button>
      <button class="btn" onclick="ansQuiz(false)">خطأ ✗</button>
    </div>
    <div id="qres" style="margin-top:10px"></div>
  </div></div>`;
}
function ansQuiz(a){
  const q = cur.quiz[qi];
  const ok = a === q.a;
  if(ok) qScore++;
  $('#qres').innerHTML = `<span style="color:${ok?'var(--ok)':'var(--bad)'}">${ok?'صحيح':'خطأ — الجواب: '+(q.a?'صح':'خطأ')}</span>`;
  setTimeout(()=>{
    qi++;
    if(qi < cur.quiz.length) drawQuiz();
    else endStory();
  }, 700);
}
function endStory(){
  const res = loadStory();
  const prev = res[cur.id];
  res[cur.id] = {score:qScore, total:cur.quiz.length, best:Math.max(qScore, prev?.best||0), ts:Date.now()};
  saveStory(res);
  app.innerHTML = `<div class="quiz"><div class="score">أنهيت «${esc(cur.titleAr)}» — فهم: ${qScore}/${cur.quiz.length}</div>
  <div class="empty" style="text-align:center">
    <button class="btn" onclick="openStory('${cur.id}')">أعد القراءة ←</button>
    <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewPick()">قصة أخرى ←</button>
  </div></div>`;
}

viewPick();
