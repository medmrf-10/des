/* التظليل — استرجاع جمل من الذاكرة: جملة تحوي كلمات بنكك → تكتب ما سمعت/حفظت → مقارنة
   بـdictDiff (ناقص/زائد/قريب) + نقاط. 10 جمل/يوم ونسبة تراكمية في en_shadow.
   en_shadow = {days:{date:{n,sum}}, n, sum} */
const app = document.getElementById('app');
const SKEY = 'en_shadow';
const DAILY = 10;

function loadS(){ try{ return JSON.parse(localStorage.getItem(SKEY)||'{}'); }catch(e){ return {}; } }
function saveS(s){ localStorage.setItem(SKEY, JSON.stringify(s)); }
function todayStats(){ const s=loadS(); return (s.days||{})[todayISO()]||{n:0,sum:0}; }
function cumStats(){ const s=loadS(); return {n:s.n||0, avg:s.n?Math.round(s.sum/s.n):0}; }
function ttsOn(){ try{ return speechSynthesis.getVoices().some(v=>/^en([-_]|$)/i.test(v.lang)); }catch(e){ return false; } }
function speak(t){ try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.9; speechSynthesis.speak(u); }catch(e){} }

/* مخزون الجمل: جمل تحوي كلمة من بنكك — المكتبة ثم القصص */
function sentPool(){
  const bank = new Set(Object.keys(loadBank()));
  const seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'));
  const want = bank.size? bank : seen;
  const pool = [];
  for(const c of CLIPS) (c.sentences||[]).forEach(s=>{
    const toks = (s.words||[]).map(w=>normTok(w[0]));
    if(toks.some(t=>want.has(t))) pool.push({en:s.text, src:c.title});
  });
  for(const st of STORIES) st.sentences.forEach(s=>{
    if(normTok(s.en).split(/\s+/).some(t=>want.has(t))) pool.push({en:s.en, src:st.titleAr});
  });
  if(!pool.length) for(const c of CLIPS) (c.sentences||[]).forEach(s=>pool.push({en:s.text, src:c.title}));
  return pool;
}

let cur = null;
function viewHome(){
  const t = todayStats(), c = cumStats();
  const left = Math.max(0, DAILY - t.n);
  app.innerHTML = `<div class="head"><h2>التظليل</h2><span class="rstreak">اليوم ${t.n}/${DAILY} · تراكمي ${c.n} جمل ${c.n?`· ${c.avg}%`:''}</span></div>
  <div class="quiz"><div class="q" style="text-align:center">
    <div class="empty">${left? `استرجع ${left} جملة — استمع (أو تذكّر) ثم اكتب بلا نسخ.` : 'أتممت حصة اليوم — عُد غداً أو تدرّب زيادة.'}</div>
    <button class="btn" style="padding:12px 30px;margin-top:6px" onclick="nextSent()">${left?'ابدأ الجملة ←':'تدرّب زيادة'}</button>
  </div></div>
  <div class="rlnks" style="margin-top:18px"><a href="listen.html">الإملاء</a><a href="mimic.html">قلّد</a><a href="practice.html">تمرين اليوم</a></div>`;
}
function nextSent(){
  const pool = sentPool();
  cur = pool[Math.floor(Math.random()*pool.length)];
  const wc = (cur.en.match(/[a-zA-Z']+/g)||[]).length;
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>استرجع الجملة</h2><span style="color:var(--muted)">${wc} كلمة · ${esc(cur.src)}</span></div>
  <div class="q">
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
      ${ttsOn()? `<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="speak(cur.en)">🔊 استمع</button>`:''}
      <span style="color:var(--muted);font-size:12px">الجملة مخفية — اكتبها من الذاكرة:</span>
    </div>
    <textarea id="shadowIn" dir="ltr" style="width:100%;min-height:80px;background:var(--navy-2);color:var(--ink);border:1px solid var(--navy-3);border-radius:10px;padding:10px;font-size:16px" placeholder="Type the sentence from memory…"></textarea>
    <div class="grades" style="margin-top:10px">
      <button class="btn" onclick="checkShadow()">قارن ←</button>
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="nextSent()">تخطَّ</button>
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewHome()">الصفحة ←</button>
    </div>
    <div id="shZone"></div>
  </div></div>`;
  setTimeout(()=>document.getElementById('shadowIn').focus(), 50);
}
function checkShadow(){
  const u = document.getElementById('shadowIn').value;
  if(!u.trim()) return;
  const d = dictDiff(cur.en, u);
  const s = loadS(); const day = ((s.days ||= {})[todayISO()] ||= {n:0,sum:0});
  day.n++; day.sum += d.pct; s.n = (s.n||0)+1; s.sum = (s.sum||0)+d.pct; saveS(s);
  const col = d.pct>=85?'var(--ok)':d.pct>=60?'var(--gold)':'var(--bad)';
  document.getElementById('shZone').innerHTML = `<div class="card" style="margin-top:12px"><div class="body">
    <div class="meta"><span>النقاط</span><span style="color:${col};font-size:18px">${d.pct}%</span></div>
    <div class="en" dir="ltr" style="font-size:17px;line-height:1.9;margin:10px 0;text-align:left">${d.html}</div>
    ${d.extra? `<div style="font-size:13px;color:var(--muted)">كلمات زائدة عندك: ${d.extra}</div>`:''}
    ${d.missed.length? `<div style="font-size:13px;color:var(--muted)">فاتتك: ${d.missed.map(esc).join(', ')}</div>`:''}
    <div class="grades" style="margin-top:10px"><button class="btn" onclick="nextSent()">الجملة التالية ←</button></div>
  </div></div>`;
  /* إنقاصات تُدفَع أولوية لبنك الكلمات — نفس قناة الإملاء */
  if(d.missed.length){
    const b = loadBank();
    d.missed.forEach(t=>{
      if(b[t]) b[t].prio = 1;
      else {
        let hit = null;
        for(const c of CLIPS) for(const s of (c.sentences||[])) for(const [e,a] of (s.words||[]))
          if(normTok(e)===t && !hit) hit = {en:e, ar:a||''};
        if(hit) b[t] = {en:hit.en, ar:hit.ar, clip:'shadow', box:0, due:todayISO(), seen:0, ok:0, prio:1};
      }
    });
    localStorage.setItem(BANK_LS, JSON.stringify(b));
  }
}

viewHome();
