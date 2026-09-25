/* روتين اليوم — 4 مراحل متسلسلة: شاهد ← اسمع وأملِ ← راجع ← خلاصة */
const app = document.getElementById('app');
const $ = s => document.querySelector(s);

/* ---------- حالة الروتين والتخزين ---------- */
const R = { clip:null, dcItem:null, dictDone:false, dictOk:false, revQueue:[], revDone:0 };

function routineLog(){ try{ return JSON.parse(localStorage.getItem(ROUTINE_KEY)||'{}'); }catch(e){ return {}; } }
function bump(k){
  const r = routineLog(), d = todayISO();
  r[d] = r[d] || {v:0, d:0, r:0};
  r[d][k]++;
  localStorage.setItem(ROUTINE_KEY, JSON.stringify(r));
}
function todayCounts(){ return routineLog()[todayISO()] || {v:0,d:0,r:0}; }
function streakDays(){
  const r = routineLog(); let n = 0; const d = new Date();
  while(true){
    const e = r[d.toISOString().slice(0,10)];
    if(e && (e.v + e.d + e.r) > 0){ n++; d.setDate(d.getDate()-1); }
    else break;
  }
  return n;
}
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'), 1800); }

/* ---------- كلمات المقاطع والإتقان ---------- */
function clipWords(c){
  const s = new Set();
  (c.sentences||[]).forEach(x => (x.words||[]).forEach(([e])=>{ const t = normTok(e); if(t.length>1) s.add(t); }));
  return s;
}
function learnedSet(){
  const s = new Set();
  Object.values(loadCards()).forEach(c=>{ if(c.repetitions>0) c.en.split(' ').forEach(t=>{ const w = normTok(t); if(w) s.add(w); }); });
  Object.values(loadBank()).forEach(w=>{ if(w.box>=3){ const t = normTok(w.en); if(t) s.add(t); } });
  return s;
}
function pickClip(){
  const seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'));
  let best = null, bestUnseen = -1;
  for(const c of CLIPS){
    const un = [...clipWords(c)].filter(t=>!seen.has(t)).length;
    if(un > bestUnseen){ bestUnseen = un; best = c; }
  }
  if(bestUnseen === 0){ // كل المقاطع شوهدت — الأقل إتقاناً
    const learned = learnedSet(); let worst = Infinity;
    for(const c of CLIPS){
      const un = [...clipWords(c)].filter(t=>!learned.has(t)).length;
      if(un < worst){ worst = un; best = c; }
    }
  }
  return best;
}

/* ---------- المرحلة 0: نظرة عامة ---------- */
function phaseStart(){
  const t = todayCounts(), s = streakDays();
  const due = dueCards(loadCards()).length;
  const done = (t.v>0 || t.d>0 || t.r>0);
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>روتين اليوم</h2><span class="rstreak">🔥 ${s} ${s===1?'يوم':'أيام'} متتابعة</span></div>
  <div class="q" style="text-align:center">
    <p style="color:var(--muted);margin:8px 0 18px">جلسة واحدة تجمع فلسفة الموقع: تعرّض مكثف للمحتوى القصير ثم إملاء ثم مراجعة مُجدولة.</p>
    <div class="rsteps">
      <div class="rstep ${t.v?'rdone':''}"><b>١ · شاهد</b><span>مقطع قصير لم تُتقنه، كلمة-بكلمة</span></div>
      <div class="rstep ${t.d?'rdone':''}"><b>٢ · اسمع وأملِ</b><span>إملاء جملة من نفس المقطع</span></div>
      <div class="rstep ${t.r?'rdone':''}"><b>٣ · راجع</b><span>بطاقات FSRS المستحقة (${due} الآن)</span></div>
      <div class="rstep"><b>٤ · خلاصة</b><span>إحصائية اليوم والشارة المتتابعة</span></div>
    </div>
    <div style="margin:20px 0">
      <button class="btn" style="font-size:16px;padding:14px 34px" onclick="phaseWatch()">${done?'أكمل روتين اليوم':'ابدأ الروتين ←'}</button>
    </div>
    <div class="rlnks">
      <a href="index.html#/feed">المقاطع</a><a href="index.html#/short">ShortForm</a><a href="index.html#/content">المكتبة</a>
      <a href="index.html#/train">التدريب</a><a href="index.html#/listen">الاستماع</a><a href="index.html#/progress">التقدم</a>
    </div>
    ${done?`<div style="color:var(--muted);font-size:13px;margin-top:14px">اليوم حتى الآن: ${t.v} مشاهدة · ${t.d} إملاء صحيح · ${t.r} مراجعة</div>`:''}
  </div></div>`;
}

/* ---------- المرحلة 1: شاهد ---------- */
function phaseWatch(){
  R.clip = pickClip();
  const c = R.clip;
  const learned = learnedSet();
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>١ · شاهد</h2><span class="rphase">المرحلة 1 من 4</span></div>
  <div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${c.id}" title="${esc(c.title)}" allowfullscreen></iframe></div>
  <div class="q">
    <div class="stem" style="color:var(--gold-soft)">${esc(c.title)}</div>
    ${(c.sentences||[]).map(s=>`
      <div class="sent" style="margin-top:12px">
        <div class="en" dir="ltr">${(s.words||[]).map(([e,a])=>{
          const m = learned.has(normTok(e));
          return `<span class="w${m?' saved':''}" title="${esc(a||'')}">${esc(e)}</span>`;
        }).join(' ')}</div>
      </div>`).join('')}
    <div style="color:var(--muted);font-size:12px;margin-top:10px">الكلمات المظللة بإطار ذهبي متقنة عندك مسبقاً.</div>
    <div style="text-align:center;margin-top:16px">
      <button class="btn" style="padding:12px 30px" onclick="watched()">شاهدته ← إملاء الآن</button>
    </div>
  </div></div>`;
}
function watched(){
  const seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'));
  clipWords(R.clip).forEach(t=>seen.add(t));
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  bump('v');
  phaseDict();
}

/* ---------- المرحلة 2: اسمع وأملِ ---------- */
function phaseDict(){
  const ss = (R.clip.sentences||[]).filter(s=>s.text && s.text.trim().split(/\s+/).length>=3);
  const s = ss[Math.floor(Math.random()*ss.length)] || (R.clip.sentences||[])[0];
  R.dcItem = {text:s.text}; R.dictDone = false; R.dictOk = false;
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>٢ · اسمع وأملِ</h2><span class="rphase">المرحلة 2 من 4</span></div>
  <div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${R.clip.id}" title="dictation" allowfullscreen></iframe></div>
  <div class="q">
    <div class="stem" style="color:var(--muted);font-size:13px">شغّل المقطع واكتب الجملة التي تسمعها (من «${esc(R.clip.title)}»):</div>
    <div class="opts" style="direction:ltr"><input id="dc_in" class="tin" placeholder="Type the sentence..." autocomplete="off" onkeydown="if(event.key==='Enter')checkRoutineDict()"></div>
    <div class="opts"><button class="btn" onclick="checkRoutineDict()">تحقق</button></div>
    <div class="res" id="dc_res"></div>
    <div style="text-align:center;margin-top:14px"><button class="btn" id="rdNext" style="display:none" onclick="phaseReview()">التالي ← المراجعة</button></div>
  </div></div>`;
  setTimeout(()=>{ const el = $('#dc_in'); if(el) el.focus(); }, 60);
}
function checkRoutineDict(){
  if(R.dictDone) return;
  const typed = $('#dc_in').value;
  const d = dictDiff(R.dcItem.text, typed);
  R.dictDone = true; R.dictOk = d.pct >= 70;
  if(R.dictOk) bump('d');
  $('#dc_res').innerHTML = `<div class="en" style="font-size:18px;margin-top:10px;letter-spacing:.3px">${d.html}</div>
    <div style="color:var(--gold-soft);margin-top:8px">الدقة: ${d.pct}%${d.extra?` · ${d.extra} كلمة زائدة`:''}${R.dictOk?' — أُحصيت في خلاصة اليوم':''}</div>
    <div style="color:var(--muted);font-size:12px;margin-top:4px">أدخلك: «${esc(typed)}»</div>`;
  $('#rdNext').style.display = 'inline-block';
}

/* ---------- المرحلة 3: راجع ---------- */
function phaseReview(){
  R.revQueue = dueCards(loadCards()).slice(0, 10);
  if(!R.revQueue.length){
    app.innerHTML = `<div class="quiz"><div class="head"><h2>٣ · راجع</h2><span class="rphase">المرحلة 3 من 4</span></div>
    <div class="empty">لا بطاقات مستحقة الآن — ممتاز.<br><br><button class="btn" onclick="phaseSummary()">إلى الخلاصة ←</button></div></div>`;
    return;
  }
  drawReview();
}
function drawReview(){
  const [id, c] = R.revQueue[0];
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>٣ · راجع</h2><span style="color:var(--muted)">متبقية: ${R.revQueue.length} · ${c.state==='new'?'جديدة':'مراجعة'}</span></div>
  <div class="q" style="text-align:center">
    <div class="en" style="font-size:26px;margin:18px 0">${esc(c.en)}</div>
    <div id="back" style="display:none">
      <div style="color:var(--gold-soft);font-size:18px;margin-bottom:16px">${esc(c.ar)}</div>
      <div class="grades">${[['نسيت',1],['صعب',3],['جيد',4],['سهل',5]].map(([t,q])=>{
        const nx = window.FSRS.schedule({repetitions:c.repetitions, ease:c.ease, interval:c.interval, lastReview:c.lastReview, quality:q});
        return `<button class="btn" onclick="gradeRoutine(${q})"><span style="display:block;font-size:11px;opacity:.75">${nx.newInterval}ي</span>${t}</button>`;
      }).join('')}</div>
    </div>
    <button class="btn" onclick="document.getElementById('back').style.display='block';this.style.display='none'">أظهر المعنى</button>
  </div></div>`;
}
function gradeRoutine(q){
  const [id, c] = R.revQueue[0];
  const res = window.FSRS.schedule({repetitions:c.repetitions, ease:c.ease, interval:c.interval, lastReview:c.lastReview, quality:q}, {fuzz:true});
  const cards = loadCards();
  cards[id] = {...c, repetitions:res.repetitions, ease:res.newEase, interval:res.newInterval,
    lastReview:todayISO(), nextReview:res.nextReview, lapses:res.lapses, state:res.state};
  saveCards(cards);
  bump('r'); R.revDone++;
  R.revQueue.shift();
  if(!R.revQueue.length){ phaseSummary(); return; }
  drawReview();
}

/* ---------- المرحلة 4: خلاصة ---------- */
function phaseSummary(){
  const t = todayCounts(), s = streakDays();
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>٤ · خلاصة اليوم</h2><span class="rstreak">🔥 ${s} ${s===1?'يوم':'أيام'} متتابعة</span></div>
  <div class="q" style="text-align:center">
    <div class="rstats">
      <div class="rstat"><b>${t.v}</b><span>مشاهدة جديدة</span></div>
      <div class="rstat"><b>${t.d}</b><span>إملاء صحيح</span></div>
      <div class="rstat"><b>${t.r}</b><span>مراجعة</span></div>
    </div>
    ${s>=3?`<div style="color:var(--gold-soft);margin-top:14px">شارة الالتزام: ${s} أيام متتابعة — استمر!</div>`:''}
    <div class="rlnks" style="margin-top:22px">
      <a href="index.html#/short">واصل التعرض في ShortForm</a>
      <a href="index.html#/train">تدريب FSRS إضافي</a>
      <a href="index.html#/listen">اختبار استماع</a>
      <a href="index.html#/progress">التقدم الكلي</a>
    </div>
    <div style="margin-top:18px"><button class="btn" onclick="phaseStart()">إعادة الروتين ↺</button></div>
  </div></div>`;
}

phaseStart();
