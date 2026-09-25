/* المكتبة — فهرس مقاطع ShortForm + كلماتي + تحتاج عملاً */
const app = document.getElementById('app');

function learnedSet(){
  const s = new Set();
  Object.values(loadCards()).forEach(c=>{ if(c.repetitions>0) c.en.split(' ').forEach(t=>{ const w = normTok(t); if(w) s.add(w); }); });
  Object.values(loadBank()).forEach(w=>{ if(w.box>=3){ const t = normTok(w.en); if(t) s.add(t); } });
  /* جمل «قلّد» المقيّمة ممتاز تُحسب متقنة */
  try{
    const mm = JSON.parse(localStorage.getItem('en_mimic')||'{}');
    for(const [k,v] of Object.entries(mm)) if(v.g==='x'){
      const [cid,ix] = k.split(':');
      const c = CLIPS.find(c=>c.id===cid);
      const sent = c && c.sentences[+ix];
      if(sent) (sent.words||[]).forEach(w=>{ const t = normTok(w[0]); if(t.length>1) s.add(t); });
    }
  }catch(e){}
  return s;
}
function clipWords(c){
  const s = new Set();
  (c.sentences||[]).forEach(x => (x.words||[]).forEach(([e])=>{ const t = normTok(e); if(t.length>1) s.add(t); }));
  return s;
}
function wordMap(){
  const m = {};
  for(const c of CLIPS) for(const s of (c.sentences||[])) for(const [e,a] of (s.words||[])){
    const t = normTok(e);
    if(t.length>1 && !m[t]) m[t] = {en:e, ar:a||'', clip:c.id};
  }
  return m;
}

function render(){
  const seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'));
  const learned = learnedSet();
  const wm = wordMap();
  const bank = loadBank();

  /* بطاقات المقاطع */
  const cards = CLIPS.map((c,i)=>{
    const ws = clipWords(c);
    const ex = [...ws].filter(t=>seen.has(t)).length;
    const ms = [...ws].filter(t=>learned.has(t)).length;
    const tot = ws.size || 1;
    const exPct = Math.round(ex/tot*100), msPct = Math.round(ms/tot*100);
    return `<div class="card"><div class="body">
      <h3>${esc(c.title)}</h3>
      <div class="meta"><span>${(c.sentences||[]).length} جمل</span><span>${tot} كلمة</span></div>
      <div class="lbar" title="تعرّضت ${exPct}% · متقنة ${msPct}%">
        <div class="lbar-ex" style="width:${exPct}%"></div>
        <div class="lbar-ms" style="width:${msPct}%"></div>
      </div>
      <div class="lmeta"><span class="ltag ms">متقنة ${ms}/${tot}</span><span class="ltag">تعرّضت ${ex}/${tot}</span></div>
      <a class="btn" style="margin-top:8px;display:inline-block" href="index.html?clip=${encodeURIComponent(c.id)}#/short">افتح في ShortForm ←</a>
    </div></div>`;
  }).join('');

  /* كلماتي — متقنة مرتبة بقوتها (صندوق bank) */
  const mine = Object.values(bank).filter(w=>w.box>=3).sort((a,b)=> b.box-a.box || a.en.localeCompare(b.en));
  const mineRows = mine.map(w=>`<tr><td class="ltr"><b>${esc(w.en)}</b></td><td>${esc(w.ar)}</td><td><span class="box">${w.box}</span></td><td>${w.ok}/${w.seen}</td></tr>`).join('');

  /* تحتاج عملاً — تعرّضت لها ولم تتقنها */
  const weak = [...seen].filter(t=>!learned.has(t) && wm[t]).map(t=>wm[t]);
  const weakChips = weak.map(w=>`<a class="ltag" style="text-decoration:none" href="index.html?clip=${encodeURIComponent(w.clip)}#/short" title="${esc(w.clip)}">${esc(w.en)}${w.ar?` <i>${esc(w.ar)}</i>`:''}</a>`).join(' ');

  app.innerHTML = `<div class="head"><h2>المكتبة</h2><span style="color:var(--muted);font-size:13px">${CLIPS.length} مقاطع · ${seen.size} كلمة تعرّضت · ${mine.length} متقنة</span></div>
  <h3 class="lsec">مقاطع ShortForm</h3>
  <div class="grid">${cards}</div>
  <h3 class="lsec">كلماتي — المتقنة (${mine.length})</h3>
  ${mine.length? `<table><tr><th>الكلمة</th><th>المعنى</th><th>القوة (صندوق)</th><th>صحيح/مرات</th></tr>${mineRows}</table>`
    : `<div class="empty">لا كلمات متقنة بعد — صناديق البنك تحتاج مراجعة.</div>`}
  <h3 class="lsec">تحتاج عملاً (${weak.length})</h3>
  <div class="card"><div class="body"><div style="color:var(--muted);font-size:12px;margin-bottom:8px">كلمات تعرّضت لها في التغذية ولم تتقنها بعد — اضغطها للعودة لمقطعها:</div>
  ${weakChips || 'لا شيء — كل ما تعرّضت له متقن!'}</div></div>`;
}
render();
