/* إملاء — 3 جمل يومياً تُقرأ بـSpeechSynthesis (تفضيل جمل كلماتك المتعثرة من en_listen)
   ← كتابة ← مقارنة كلمة-بكلمة (صحيح/ناقص/زائد/إملائي) بـdictDiff. حصة 10/يوم في en_dict.
   en_dict = {days:{date:{n,sum}}, n, sum} */
const app = document.getElementById('app');
const DKEY = 'en_dict';
const DAILY = 10, ROUND = 3;

function loadD(){ try{ return JSON.parse(localStorage.getItem(DKEY)||'{}'); }catch(e){ return {}; } }
function saveD(d){ localStorage.setItem(DKEY, JSON.stringify(d)); }
function todayD(){ const d=loadD(); return (d.days||{})[todayISO()]||{n:0,sum:0}; }
function ttsOn(){ try{ return speechSynthesis.getVoices().some(v=>/^en([-_]|$)/i.test(v.lang)); }catch(e){ return false; } }
function speak(t, rate){ try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=rate||0.85; speechSynthesis.speak(u); }catch(e){} }

/* جمل الجولة: تفضيل كلمات متعثرة من en_listen ثم تكملة عشوائية */
function sentPool(){
  const err = new Set(((JSON.parse(localStorage.getItem('en_listen')||'{}').errors)||[]).map(e=>e.tok));
  const pool = [], preferred = [];
  const add = (en, src)=>{
    const t = (en.match(/[a-zA-Z']+/g)||[]).map(normTok);
    (t.some(x=>err.has(x)) ? preferred : pool).push({en, src});
  };
  for(const c of CLIPS) (c.sentences||[]).forEach(s=>add(s.text, c.title));
  for(const st of STORIES) st.sentences.forEach(s=>add(s.en, st.titleAr));
  return preferred.concat(pool);
}
let round = [], ri = 0, cur = null;

function viewHome(){
  const t = todayD(), d = loadD();
  const left = Math.max(0, DAILY - t.n);
  app.innerHTML = `<div class="head"><h2>إملاء</h2><span class="rstreak">اليوم ${t.n}/${DAILY} · ${t.n?`دقة ${Math.round(t.sum/t.n)}%`:''} · تراكمي ${d.n||0} جمل</span></div>
  <div class="quiz"><div class="q" style="text-align:center">
    <div class="empty">${left? `جولة من ${Math.min(ROUND,left)} جمل — استمع ثم اكتب.` : 'أتممت حصة اليوم — عُد غداً أو تدرّب زيادة.'}</div>
    ${ttsOn()? '' : '<div style="color:var(--gold);font-size:12px;margin-top:6px">النطق غير متاح بجهازك — فعّل أصوات النظام لسماع الجمل.</div>'}
    <button class="btn" style="padding:12px 30px;margin-top:8px" onclick="startRound()">${left?'ابدأ الجولة ←':'تدرّب زيادة'}</button>
  </div></div>
  <div class="rlnks" style="margin-top:18px"><a href="listen.html">الإملاء بالمقاطع</a><a href="shadowing.html">التظليل</a><a href="practice.html">تمرين اليوم</a></div>`;
}
function startRound(){
  const pool = sentPool();
  /* بلا تكرار داخل الجولة */
  const idx = new Set();
  round = [];
  while(round.length < ROUND && idx.size < pool.length){
    const i = Math.floor(Math.random()*pool.length);
    if(idx.has(i)) continue;
    idx.add(i); round.push(pool[i]);
  }
  ri = 0;
  nextD();
}
function nextD(){
  cur = round[ri];
  const wc = (cur.en.match(/[a-zA-Z']+/g)||[]).length;
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>الجملة ${ri+1}/${round.length}</h2><span style="color:var(--muted)">${wc} كلمة · ${esc(cur.src)}</span></div>
  <div class="q">
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
      ${ttsOn()? `<button class="btn" onclick="speak(cur.en,0.85)">🔊 استمع</button>
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="speak(cur.en,0.6)">ببطء</button>`:'<span style="color:var(--gold)">النطق غير متاح</span>'}
    </div>
    <textarea id="dictIn" dir="ltr" style="width:100%;min-height:80px;background:var(--navy-2);color:var(--ink);border:1px solid var(--navy-3);border-radius:10px;padding:10px;font-size:16px" placeholder="Type what you heard…"></textarea>
    <div class="grades" style="margin-top:10px">
      <button class="btn" onclick="checkDict()">قارن ←</button>
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="skipD()">تخطَّ</button>
    </div>
    <div id="dZone"></div>
  </div></div>`;
  setTimeout(()=>{ document.getElementById('dictIn').focus(); if(ttsOn()) speak(cur.en,0.85); }, 100);
}
function skipD(){ ri++; if(ri < round.length) nextD(); else viewHome(); }
function checkDict(){
  const u = document.getElementById('dictIn').value;
  if(!u.trim()) return;
  const d = dictDiff(cur.en, u);
  const s = loadD(); const day = ((s.days ||= {})[todayISO()] ||= {n:0,sum:0});
  day.n++; day.sum += d.pct; s.n = (s.n||0)+1; s.sum = (s.sum||0)+d.pct; saveD(s);
  const col = d.pct>=85?'var(--ok)':d.pct>=60?'var(--gold)':'var(--bad)';
  const near = (cur.en.match(/[a-zA-Z']+/g)||[]).map(normTok).filter(t=>(u.match(/[a-zA-Z']+/g)||[]).map(normTok).some(x=>x!==t && wmatch(t,x)===1));
  document.getElementById('dZone').innerHTML = `<div class="card" style="margin-top:12px"><div class="body">
    <div class="meta"><span>النقاط</span><span style="color:${col};font-size:18px">${d.pct}%</span></div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:4px">المعيار:</div>
    <div class="en" dir="ltr" style="font-size:17px;line-height:1.9;text-align:left">${d.html}</div>
    <div style="font-size:13px;color:var(--muted);margin-top:8px">
      ${d.missed.length? `ناقصة: ${d.missed.map(esc).join(', ')} · ` : ''}
      ${d.extra? `زائدة: ${d.extra} كلمة · ` : ''}
      ${near.length? `إملائية قريبة: ${[...new Set(near)].map(esc).join(', ')}` : ''}
      ${!d.missed.length && !d.extra && !near.length? '<span style="color:var(--ok)">مطابقة تامة ✓</span>' : ''}
    </div>
    <div class="grades" style="margin-top:10px"><button class="btn" onclick="skipD()">التالية ←</button></div>
  </div></div>`;
}

viewHome();
