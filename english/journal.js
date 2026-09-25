/* يومياتي — كتابة يومية بالإنجليزية: تقييم ذاتي (طول/تنويع/أخطاء شائعة) + streak في en_journal
   en_journal = {entries:{date:{text,words,uniq,score,ts}}, count} */
const app = document.getElementById('app');
const JKEY = 'en_journal';

function loadJ(){ try{ return JSON.parse(localStorage.getItem(JKEY)||'{}'); }catch(e){ return {}; } }
function saveJ(j){ localStorage.setItem(JKEY, JSON.stringify(j)); }
function jstreak(){
  const j = loadJ(), ent = j.entries || {};
  let d = new Date(), n = 0;
  if(!ent[d.toISOString().slice(0,10)]) d = new Date(d - 864e5);
  while(ent[d.toISOString().slice(0,10)]){ n++; d = new Date(d - 864e5); }
  return n;
}
/* اقتراح موضوع من التعرض: كلمات البنك + موضوع كتابة */
const PROMPTS = [
  'Describe your morning today.',
  'What did you eat today? Describe it.',
  'What is one thing you learned this week?',
  'Describe someone you talked to today.',
  'What will you do tomorrow? Make a small plan.',
  'Describe your room or your street.',
  'What made you happy or annoyed today?'
];
function suggestTopic(){
  const bank = Object.keys(loadBank());
  const seen = JSON.parse(localStorage.getItem(SEEN_KEY)||'[]');
  const ws = shuffle(bank.length? bank : seen).slice(0,4).filter(t=>t.length>2);
  const p = PROMPTS[new Date().getDate() % PROMPTS.length];
  return {prompt:p, words:ws};
}
/* تقييم ذاتي: أخطاء شائعة + طول + تنويع */
function analyze(text){
  const words = (text.match(/[a-zA-Z']+/g)||[]);
  const toks = words.map(w=>w.toLowerCase());
  const uniq = new Set(toks).size;
  const issues = [];
  if(/[\u0600-\u06FF]/.test(text)) issues.push('فيه حروف عربية — اكتب بالإنجليزية فقط');
  const reps = toks.filter((t,i)=>i>0 && t===toks[i-1]);
  if(reps.length) issues.push(`كلمات مكررة وراء بعضها: ${[...new Set(reps)].join(', ')}`);
  const lc = (text.match(/\bi\b/g)||[]).length;
  if(lc) issues.push(`الضمير «I» مكتوب صغيراً ${lc}×`);
  const apost = toks.filter(t=>['dont','cant','wont','isnt','arent','didnt','couldnt','shouldnt','im','ive','ill'].includes(t));
  if(apost.length) issues.push(`اختصارات ناقصة الفاصلة: ${[...new Set(apost)].join(', ')}`);
  const an = (text.match(/\ba\s+[aeiou]/gi)||[]).length;
  if(an) issues.push(`«a» قبل حرف متحرك — الأصح «an» (${an}×)`);
  const caps = (text.match(/[.!?]\s+[a-z]/g)||[]).length;
  if(caps) issues.push(`بدايات جمل بلا حرف كبير (${caps}×)`);
  const sents = text.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
  const longest = Math.max(0, ...sents.map(s=>(s.match(/[a-zA-Z']+/g)||[]).length));
  if(longest > 30) issues.push(`أطول جملة ${longest} كلمة — قسّمها`);
  const wn = words.length;
  const score = Math.min(100, Math.round(wn*1.2 + Math.min(uniq,50) + (wn? uniq/wn*40:0) - issues.length*8));
  return {wn, uniq, issues, score: Math.max(0,score)};
}

function viewHome(){
  const j = loadJ(), ent = j.entries || {};
  const today = todayISO(), cur = ent[today];
  const sk = jstreak();
  const days = Object.keys(ent).sort().reverse().slice(0,7);
  app.innerHTML = `<div class="head"><h2>يومياتي</h2><span class="rstreak">${sk?`🔥 ${sk} يوم متتالٍ`:'لا سلسلة بعد'}</span></div>
  <div class="quiz"><div class="q">
    ${cur
      ? `<div class="empty">كتبت يومية اليوم (${cur.words} كلمة · ${cur.score} نقطة).<br><span style="font-size:12px;color:var(--muted)">يمكنك تعديلها وإعادة التقييم.</span></div>`
      : `<div style="margin-bottom:10px"><span style="color:var(--muted);font-size:13px">موضوع مقترح:</span>
         <div class="en" dir="ltr" style="font-size:17px;color:var(--gold-soft);margin:6px 0;text-align:left">${esc(suggestTopic().prompt)}</div>
         ${suggestTopic().words.length? `<div style="font-size:12px;color:var(--muted)">جرّب استعمال: ${suggestTopic().words.map(t=>`<span class="w" style="cursor:default">${esc(t)}</span>`).join(' ')}</div>`:''}</div>`}
    <textarea id="jtext" dir="ltr" style="width:100%;min-height:170px;background:var(--navy-2);color:var(--ink);border:1px solid var(--navy-3);border-radius:10px;padding:12px;font-size:16px;line-height:1.7" placeholder="Write about your day in English…">${cur? esc(cur.text):''}</textarea>
    <div class="grades" style="margin-top:10px">
      <button class="btn" onclick="assess()">قيّم واحفظ ←</button>
      ${cur? `<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="delEntry()">احذف اليوم</button>`:''}
    </div>
    <div id="assessZone"></div>
  </div></div>
  ${days.length? `<div class="head" style="margin-top:18px"><h2>آخر المدخلات</h2></div>
  <div class="card"><div class="body">${days.map(d=>{const e=ent[d]; return `<div class="meta" style="padding:6px 0;border-bottom:1px solid var(--navy-3)"><span>${d}</span><span>${e.words} كلمة · ${e.uniq} فريدة · ${e.score} نقطة</span></div>`}).join('')}</div></div>`:''}
  <div class="rlnks" style="margin-top:18px"><a href="vocab.html">مفرداتي</a><a href="story.html">القصص</a><a href="practice.html">تمرين اليوم</a></div>`;
}
function assess(){
  const text = document.getElementById('jtext').value.trim();
  if((text.match(/[a-zA-Z']+/g)||[]).length < 5){
    document.getElementById('assessZone').innerHTML = `<div class="empty" style="margin-top:10px">اكتب 5 كلمات إنجليزية على الأقل.</div>`;
    return;
  }
  const a = analyze(text);
  const j = loadJ(); (j.entries ||= {});
  j.entries[todayISO()] = {text, words:a.wn, uniq:a.uniq, score:a.score, ts:Date.now()};
  j.count = Object.keys(j.entries).length;
  saveJ(j);
  document.getElementById('assessZone').innerHTML = `<div class="card" style="margin-top:12px"><div class="body">
    <div class="meta"><span>الطول</span><span>${a.wn} كلمة ${a.wn>=40?'✓':a.wn>=20?'—':'(قصير)'}</span></div>
    <div class="meta"><span>تنويع المفردات</span><span>${a.uniq} فريدة (${a.wn?Math.round(a.uniq/a.wn*100):0}%)</span></div>
    <div class="meta"><span>النقاط</span><span style="color:var(--gold)">${a.score}/100</span></div>
    ${a.issues.length? `<div style="margin-top:8px;color:var(--muted);font-size:13px">${a.issues.map(i=>`· ${esc(i)}`).join('<br>')}</div>`:`<div style="margin-top:8px;color:var(--ok);font-size:13px">لا أخطاء شائعة مكتشفة.</div>`}
  </div></div>`;
}
function delEntry(){
  const j = loadJ();
  if(j.entries) delete j.entries[todayISO()];
  j.count = Object.keys(j.entries||{}).length;
  saveJ(j); viewHome();
}
function shuffle(a){ a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }

viewHome();
