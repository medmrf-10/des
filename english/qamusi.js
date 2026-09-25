/* قاموسي — قاموسك الشخصي: كل كلمة لقيتها (بنكك + مقاطعك المشاهدة)
   معناها، عدد لقائها في الكوربس، مستوى إتقانك، وجملة حقيقية رأيتها فيها.
   مرتّبة الأضعف أولاً — والروابط من موقعي/جملة تهبط على الكلمة (#tok). */
const app = document.getElementById('app');
const ls = k => { try{ return JSON.parse(localStorage.getItem(k)||'{}'); }catch(e){ return {}; } };
const ttsOK = () => window.speechSynthesis && speechSynthesis.getVoices().some(v=>/^en/i.test(v.lang));
function say(t){ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.9; speechSynthesis.speak(u); }
if(window.speechSynthesis) speechSynthesis.onvoiceschanged = ()=>{};

/* فهرس الكوربس: tok → {n, sent, src} */
function corpusIx(){
  const ix = {};
  const put = (tok,w,en,src)=>{
    if(!tok) return;
    const r = ix[tok] ||= {n:0, en:w, sent:null, src:''};
    r.n++;
    if(!r.sent){ r.sent=en; r.src=src; }
  };
  for(const c of (typeof CLIPS!=='undefined'?CLIPS:[]))
    for(const s of c.sentences)
      for(const [w] of s.words||[]) put(normTok(w), w, s.text, c.title||c.id);
  for(const st of (typeof STORIES!=='undefined'?STORIES:[]))
    for(const s of st.sentences)
      for(const w of s.en.split(/\s+/)) put(normTok(w), w, s.en, st.titleAr||st.title);
  return ix;
}

/* مستوى الإتقان 0-100: بنك + SRS − أخطاء */
function mastery(t, bankN, srsN, missN, errs){
  let m = 0;
  const b = bankN[t];
  if(b) m += Math.min(40, (b.box||0)*12 + (b.seen?8:0));
  const s = srsN[t];
  if(s && s.state && s.state!=='new')
    m += Math.min(50, (s.repetitions||0)*8 + Math.min(20,(s.interval||0)*2) - (s.lapses||0)*8);
  m -= (missN[t]||0)*8;
  const e = errs.find(x=>normTok(x.en||x.w||'')===t); if(e) m -= (e.n||1)*10;
  return Math.max(0, Math.min(100, m));
}
const band = m => m>=70 ? ['متقنة','var(--ok)'] : m>=35 ? ['معلّمة','var(--gold)'] : m>0 ? ['ضعيفة','var(--bad)'] : ['جديدة','var(--muted)'];

function buildRows(){
  const bank = ls('enbank'), srs = ls('en_srs'), miss = ls('en_missbank');
  const errs = ls('en_listen').errors||[];
  const dict = typeof DICT!=='undefined'?DICT:{};
  const seen = new Set(JSON.parse(localStorage.getItem('en_feed_seen')||'[]'));
  const ix = corpusIx();

  /* الكلمات: بنكك + كلمات مقاطعك المشاهدة + متعثراتك */
  const toks = new Set();
  Object.keys(bank).forEach(t=>{ const n=normTok(t); if(n) toks.add(n); });
  Object.keys(srs).forEach(t=>{ const n=normTok(t); if(n) toks.add(n); });
  Object.keys(miss).forEach(t=>{ const n=normTok(t); if(n) toks.add(n); });
  errs.forEach(e=>{ const n=normTok(e.en||e.w||''); if(n) toks.add(n); });
  (typeof CLIPS!=='undefined'?CLIPS:[]).filter(c=>seen.has(c.id))
    .forEach(c=>c.sentences.forEach(s=>(s.words||[]).forEach(([w])=>{ const t=normTok(w); if(t) toks.add(t); })));

  const allSents = (typeof CLIPS!=='undefined'?CLIPS:[]).flatMap(c=>c.sentences.map(s=>({en:s.text,src:c.title||c.id})))
    .concat((typeof STORIES!=='undefined'?STORIES:[]).flatMap(st=>st.sentences.map(s=>({en:s.en,src:st.titleAr||st.title}))));
  const bankN = {}; Object.entries(bank).forEach(([t,w])=>{ bankN[normTok(t)]=w; });
  const srsN = {}; Object.entries(srs).forEach(([t,w])=>{ srsN[normTok(t)]=w; });
  const missN = {}; Object.entries(miss).forEach(([t,n])=>{ missN[normTok(t)]=(missN[normTok(t)]||0)+n; });
  return [...toks].map(t=>{
    const b = bankN[t]||{}, x = ix[t]||{n:0,en:t,sent:null,src:''};
    if(!x.sent && t.includes(' ')){
      const hit = allSents.find(s=>s.en.toLowerCase().includes(t));
      if(hit){ x.sent=hit.en; x.src=hit.src; }
    }
    return {
      t, en: b.en || x.en || t,
      ar: b.ar || dict[t] || '',
      met: (b.seen||0) + x.n,
      m: mastery(t, bankN, srsN, missN, errs),
      sent: x.sent, src: x.src, clip: b.clip||''
    };
  }).sort((a,b)=> a.m-b.m || b.met-a.met);
}

let Q = '';
function view(){
  const rows = buildRows();
  const f = Q ? rows.filter(r=>r.en.toLowerCase().includes(Q)||r.ar.includes(Q)||r.t.includes(Q)) : rows;
  const [w,ml,st,nw] = [f.filter(r=>r.m>0&&r.m<35).length, f.filter(r=>r.m>=35&&r.m<70).length, f.filter(r=>r.m>=70).length, f.filter(r=>r.m===0).length];
  app.innerHTML = `<div class="head"><h2>قاموسي — ${rows.length} كلمة</h2></div>
  <div class="card"><div class="body" style="text-align:center">
    قاموسك الحي — مبنيّ مما جمعته وتدرّبت عليه، مرتّب <b>الأضعف أولاً</b> حتى تعرف من أين تبدأ.
    <div class="opts" style="justify-content:center;margin-top:6px">
      <span class="meta"><span style="color:var(--bad)">ضعيفة ${w}</span> · <span style="color:var(--gold)">معلّمة ${ml}</span> · <span style="color:var(--ok)">متقنة ${st}</span> · جديدة ${nw}</span>
    </div>
    <input id="qIn" class="inp" dir="ltr" placeholder="🔎 ابحث في قاموسك…" value="${esc(Q)}" style="max-width:300px;margin-top:8px" oninput="Q=this.value;viewList()">
  </div></div>
  <div id="qList"></div>`;
  viewList();
  if(location.hash) { const el = document.getElementById('w_'+decodeURIComponent(location.hash.slice(1))); el && el.scrollIntoView({block:'center'}); }
}
function viewList(){
  const rows = buildRows();
  const f = Q ? rows.filter(r=>r.en.toLowerCase().includes(Q)||r.ar.includes(Q)||r.t.includes(Q)) : rows;
  document.getElementById('qList').innerHTML = f.slice(0,300).map(r=>{
    const [lbl,col] = band(r.m);
    return `<div class="card" id="w_${r.t}"><div class="body" style="padding:10px 14px">
      <div style="display:flex;align-items:center;gap:8px">
        <b dir="ltr" style="color:var(--gold);font-size:17px">${esc(r.en)}</b>
        ${r.ar?`<span style="font-size:14px">${esc(r.ar)}</span>`:''}
        <span style="margin-inline-start:auto"></span>
        ${ttsOK()?`<button class="btn" style="padding:3px 9px;font-size:12px;background:var(--navy-3);color:var(--gold-soft)" onclick="say('${r.en.replace(/'/g,"\\'")}')">🔊</button>`:''}
        <span class="ltag" style="color:${col};border-color:${col}">${lbl}</span>
      </div>
      <div class="meta">لقيتها ×${r.met}${r.sent?` · في «${esc(r.src)}»`:''}${r.clip?` · مقطعك ${esc(r.clip)}`:''}</div>
      ${r.sent?`<div dir="ltr" style="font-size:13px;color:var(--muted);margin-top:4px;text-align:left">«${esc(r.sent)}»</div>`:''}
    </div></div>`;
  }).join('') || '<div class="empty" style="text-align:center">لا نتائج</div>';
}
view();
