/* صفحة الإملاء — مقطع بنص مخفي، اكتب ما تسمع، مقارنة كلمة-بكلمة
   التخزين: en_listen {errors:[{tok,en,ar,clip,n}], days:{date:{n,sum}}}
   الكلمات الفاشلة تُدفَع إلى en_bank بعلم prio=1 → أولوية في srs.html */
const app = document.getElementById('app');
const $ = s => document.querySelector(s);
const LISTEN_LS = 'en_listen';

function loadListen(){ try{ return JSON.parse(localStorage.getItem(LISTEN_LS)||'{"errors":[],"days":{}}'); }catch(e){ return {errors:[],days:{}}; } }
function saveListen(l){ localStorage.setItem(LISTEN_LS, JSON.stringify(l)); }

/* جمل كل المقاطع — نفس مصدر library.html */
function sents(){
  const out = [];
  for(const c of CLIPS) for(const s of (c.sentences||[])) out.push({clip:c.id, title:c.title, text:s.text, words:s.words||[]});
  return out;
}
/* نفضّل مقاطع شوهدت في feed (كلماتها في feedSeen) */
function pickItem(){
  const seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'));
  const all = sents();
  const seenClips = new Set(all.filter(s => s.words.some(w => seen.has(normTok(w[0])))).map(s => s.clip));
  const pool = seenClips.size ? all.filter(s => seenClips.has(s.clip)) : all;
  return pool[Math.floor(Math.random()*pool.length)];
}
/* الكلمة العربية لمفردة الجملة */
function wordAr(item, tok){
  const hit = item.words.find(w => normTok(w[0])===tok);
  return hit ? hit[1] : '';
}

/* ---------- إحصاء الرأس ---------- */
function statsHtml(){
  const l = loadListen();
  const d = (l.days||{})[todayISO()];
  const acc = d && d.n ? Math.round(d.sum/d.n) : null;
  const top = (l.errors||[]).slice().sort((a,b)=>b.n-a.n).slice(0,6);
  return `<div class="rstats" style="margin-bottom:14px">
    <div class="rstat"><b>${acc===null?'—':acc+'%'}</b><span>دقة اليوم (${d?d.n:0} محاولة)</span></div>
    <div class="rstat"><b>${(l.errors||[]).length}</b><span>كلمة متعثرة</span></div>
  </div>
  ${top.length? `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;margin-bottom:6px">أكثر تعثراً: ${top.map(e=>`<span class="ltag">${esc(e.en)} <i>×${e.n}</i></span>`).join(' ')}</div>`:''}`;
}

/* ---------- الجلسة ---------- */
let item = null;
function viewListen(){
  item = pickItem();
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>الإملاء — ${esc(item.title)}</h2></div>
  ${statsHtml()}
  <div class="q">
    <div class="frame"><iframe id="lif" src="https://www.youtube-nocookie.com/embed/${item.clip}" title="dictation" allowfullscreen></iframe></div>
    <div class="stem" style="color:var(--muted);font-size:13px;margin:10px 0 6px">الجملة مخفية — اكتب ما تسمعه كلمة-بكلمة:</div>
    <textarea id="lin" dir="ltr" rows="2" placeholder="type what you hear…" style="width:100%;font-size:17px;padding:10px;border-radius:10px;border:1px solid var(--navy-3);background:var(--navy-2);color:var(--ink)"></textarea>
    <div class="grades" style="margin-top:10px">
      <button class="btn" onclick="checkListen()">تحقق ←</button>
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="relisten()">أعد الاستماع</button>
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewListen()">جملة أخرى ←</button>
    </div>
    <div id="lres"></div>
  </div></div>`;
  const ta = $('#lin');
  ta.focus();
  ta.addEventListener('keydown', e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); checkListen(); } });
}
function relisten(){
  const f = $('#lif');
  if(f) f.src = `https://www.youtube-nocookie.com/embed/${item.clip}?rel=0`;
}
function checkListen(){
  const typed = $('#lin').value;
  if(!typed.trim()) return;
  const d = dictDiff(item.text, typed);

  /* سجّل المحاولة: دقة اليوم + الأخطاء */
  const l = loadListen();
  const day = (l.days[todayISO()] ||= {n:0, sum:0});
  day.n++; day.sum += d.pct;
  for(const tok of d.missed){
    let e = l.errors.find(e => e.tok===tok);
    if(e) e.n++;
    else { e = {tok, en:item.words.find(w=>normTok(w[0])===tok)?.[0] || tok, ar:wordAr(item,tok), clip:item.clip, n:1}; l.errors.push(e); }
    /* أولوية SRS عبر en_bank */
    const bank = loadBank();
    const key = tok;
    if(bank[key]) bank[key].prio = 1;
    else bank[key] = {en:e.en, ar:e.ar, clip:item.clip, box:0, due:Date.now(), seen:0, ok:0, prio:1};
    localStorage.setItem(BANK_LS, JSON.stringify(bank));
  }
  saveListen(l);

  $('#lres').innerHTML = `<div class="en" dir="ltr" style="font-size:18px;margin-top:10px;letter-spacing:.3px;text-align:left">${d.html}</div>
    <div style="color:var(--gold-soft);margin-top:8px">الدقة: ${d.pct}%${d.extra?` · ${d.extra} كلمة زائدة`:''}</div>
    <div style="color:var(--muted);font-size:12px;margin-top:4px">${d.missed.length? `أخطاء سُجّلت للمراجعة: ${d.missed.join(', ')}` : 'مثالي — لا أخطاء'}</div>
    <div class="grades" style="margin-top:10px">
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="relisten()">أعد الاستماع</button>
      <button class="btn" onclick="viewListen()">جملة أخرى ←</button>
    </div>`;
}

viewListen();
