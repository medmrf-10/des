/* موقعي — لوحة شخصية واحدة بلا خيارات: تاج اليوم + سلسلة الأيام +
   كلمات ضعيفة + الشيء الواحد التالي (زر واحد) + أسبوع بسيط.
   قرائية فقط — تجمع من كل مفاتيح en_*. */
const app = document.getElementById('app');
const ls = k => { try{ return JSON.parse(localStorage.getItem(k)||'{}'); }catch(e){ return {}; } };
const ISO = i => { const d=new Date(); d.setDate(d.getDate()-i); return d.toISOString().slice(0,10); };
const TODAY = ISO(0);
const AR_DAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

/* نشاط يوم واحد عبر كل المصادر */
function dayCount(d){
  let n = 0;
  const r = ls('en_routine')[d];
  if(r){
    const tc = typeof r.t==='object' && r.t ? Object.values(r.t).filter(Boolean).length : (r.t||0);
    n += (r.v||0)+(r.d||0)+(r.r||0)+tc;
  }
  for(const k of ['en_listen','en_shadow','en_dict','en_coll','en_verbs','en_pairs','en_families','en_jumla'])
    n += (ls(k).days||{})[d]?.n || 0;
  if((ls('en_journal').entries||{})[d]) n++;
  n += Object.values(ls('en_story')).filter(x=>x.ts && x.ts>0 && new Date(x.ts).toISOString().slice(0,10)===d).length;
  n += Object.values(ls('en_srs')).filter(x=>x && x.lastReview===d).length;
  n += Object.values(ls('en_chunks')).filter(x=>x && x.last && new Date(x.last).toISOString().slice(0,10)===d).length;
  return n;
}
function streak(){
  let s = 0, i = dayCount(TODAY) ? 0 : 1;
  while(dayCount(ISO(i))>0){ s++; i++; }
  return s;
}

/* تاج اليوم — ما أُنجز اليوم عبر كل الأدوات */
function crownToday(){
  const r = ls('en_routine')[TODAY]||{};
  const items = [];
  if(r.v) items.push(['🧭','شاهدت',r.v]);
  if(r.d) items.push(['✍️','أمليت',r.d]);
  if(r.r) items.push(['🔁','راجعت',r.r]);
  if(r.t) items.push(['✅','مهام', typeof r.t==='object' ? Object.values(r.t).filter(Boolean).length : r.t]);
  const rows = [
    ['en_listen','🎧','استماع'], ['en_shadow','🗣','تظليل'], ['en_dict','⌨️','إملاء'],
    ['en_coll','🔗','تراكيب'], ['en_verbs','🔤','أفعال'], ['en_pairs','👂','أزواج'],
    ['en_families','🌱','عائلات'], ['en_jumla','🧩','جملة'],
  ];
  for(const [k,ic,lbl] of rows){
    const n = (ls(k).days||{})[TODAY]?.n || 0;
    if(n) items.push([ic,lbl,n]);
  }
  if((ls('en_journal').entries||{})[TODAY]) items.push(['📓','يومية',1]);
  const st = Object.values(ls('en_story')).filter(x=>x.ts && new Date(x.ts).toISOString().slice(0,10)===TODAY).length;
  if(st) items.push(['📖','قصص',st]);
  const sr = Object.values(ls('en_srs')).filter(x=>x && x.lastReview===TODAY).length;
  if(sr) items.push(['🃏','بطاقات',sr]);
  const ck = Object.values(ls('en_chunks')).filter(x=>x && x.last && new Date(x.last).toISOString().slice(0,10)===TODAY).length;
  if(ck) items.push(['🧱','تراكيب جاهزة',ck]);
  return items;
}

/* كلمات ضعيفة: أولوية البنك + متعثرات الاستماع + missbank */
function weakWords(){
  const bank = ls('enbank'), errs = ls('en_listen').errors||[], miss = ls('en_missbank');
  const score = {};
  Object.entries(bank).forEach(([t,w])=>{ if(w.prio || w.box===0 && w.seen>0) score[t]=(score[t]||0)+2; });
  errs.slice().sort((a,b)=>b.n-a.n).slice(0,5).forEach(e=>{ score[e.en]=(score[e.en]||0)+e.n; });
  Object.entries(miss).sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([w,n])=>{ score[w]=(score[w]||0)+n; });
  const dict = typeof DICT!=='undefined'?DICT:{};
  return Object.entries(score).sort((a,b)=>b[1]-a[1]).slice(0,6)
    .map(([w,n])=>({w, ar: bank[w]?.ar || dict[w] || '', n}));
}

/* الشيء الواحد التالي — سلسلة أولوية، زر واحد */
function nextThing(){
  const rt = ls('en_routine')[TODAY]||{};
  if(!(rt.v>0 && rt.d>0 && rt.r>0))
    return ['أكمل روتين اليوم — شاهد، أملِ، راجع','routine.html'];
  const due = Object.values(ls('en_srs')).filter(c=>c && c.nextReview && c.nextReview<=TODAY).length;
  if(due) return [`راجع ${due} بطاقة مستحقة قبل نسيانها`,'srs.html'];
  if(!((ls('en_listen').days||{})[TODAY]?.n)) return ['إملاء جملة اليوم — استمع واكتب','listen.html'];
  if(!(ls('en_journal').entries||{})[TODAY]) return ['اكتب يومية قصيرة بالإنجليزية','journal.html'];
  const rot = [
    ['en_dict','dictation.html','إملاء صوتي — استمع ×2 واكتب'],
    ['en_shadow','shadow_chain.html','سلسلة الظل — استمع واكتب'],
    ['en_coll','collocations.html','تراكيب — سياق كلماتك'],
    ['en_verbs','verb_drills.html','الأفعال الشاذة'],
    ['en_families','word_families.html','عائلات الكلمات'],
    ['en_pairs','minimal_pairs.html','الأزواج الدنيا'],
    ['en_jumla','jumla.html','جملة — رتّب وترجم'],
  ];
  for(const [k,url,lbl] of rot)
    if(!(ls(k).days||{})[TODAY]?.n) return [lbl+' ← لم تُجرّبه اليوم', url];
  return ['اقرأ قصة قصيرة جديدة','story.html'];
}

/* ---------- العرض ---------- */
function view(){
  const cr = crownToday(), sk = streak(), weak = weakWords(), [nxt,url] = nextThing();
  const week = [6,5,4,3,2,1,0].map(i=>{
    const d = ISO(i), c = dayCount(d);
    const nm = i===0 ? 'اليوم' : AR_DAYS[new Date(d+'T12:00').getDay()];
    const mx = Math.max(1, ...[6,5,4,3,2,1,0].map(j=>dayCount(ISO(j))));
    return {d, c, nm, h: Math.round(c/mx*46)};
  });
  app.innerHTML = `<div class="head"><h2>موقعي</h2><span class="rstreak">🔥 ${sk} ${sk===1?'يوم':'أيام'} متتابعة</span></div>

  <div class="card"><div class="body" style="text-align:center">
    <div class="muted" style="font-size:13px">الشيء التالي — لا تخيار:</div>
    <a href="${url}"><button class="btn" style="font-size:17px;padding:14px 34px;margin-top:8px">${esc(nxt)} ←</button></a>
  </div></div>

  <div class="head"><h2>تاج اليوم</h2></div>
  <div class="card"><div class="body">
    ${cr.length ? `<div class="opts" style="justify-content:center">${cr.map(([ic,lbl,n])=>`<span class="crown"><b>${ic}</b> ${lbl} ×${n}</span>`).join('')}</div>`
      : `<div class="empty" style="text-align:center">لا شيء اليوم بعد — ابدأ بالزر الأعلى.</div>`}
  </div></div>

  ${weak.length?`<div class="head"><h2>كلمات تحتاج عملاً</h2></div>
  <div class="card"><div class="body" dir="ltr" style="text-align:left">${weak.map(x=>`<span class="fc-chip" style="margin:2px">${esc(x.w)} <i style="color:var(--muted)">${esc(x.ar)}</i></span>`).join('')}</div></div>`:''}

  <div class="head"><h2>أسبوعك</h2></div>
  <div class="card"><div class="body">
    <div style="display:flex;align-items:flex-end;gap:8px;justify-content:center;height:70px">
      ${week.map(w=>`<div style="text-align:center;flex:1">
        <div style="height:${w.h}px;min-height:2px;background:${w.c?'var(--gold)':'var(--navy-3)'};border-radius:4px 4px 0 0"></div>
        <div style="font-size:10px;color:var(--muted);margin-top:4px">${w.nm}</div>
        <div style="font-size:11px;color:${w.c?'var(--gold)':'var(--muted)'}">${w.c||'—'}</div>
      </div>`).join('')}
    </div>
  </div></div>`;
}
view();
