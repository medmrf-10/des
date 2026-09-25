/* إنجليزي بالمحتوى القصير — SPA بسيطة بلا باك إند.
   التخزين: localStorage key 'enbank' → {word:{en,ar,clip,box,due,seen,ok}} */
const LS = 'enbank';
const BOX_DAYS = [0, 1, 2, 4, 7, 15];       // صناديق SRS مبسطة
const app = document.getElementById('app');
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

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
  const en = prompt('الكلمة بالإنجليزية:'); if(!en) return;
  const ar = prompt('المعنى بالعربية:'); if(!ar) return;
  bank[en.trim().toLowerCase()] = {en:en.trim(), ar:ar.trim(), clip:'manual', box:1, due:Date.now(), seen:0, ok:0};
  save(); toast('أُضيفت إلى البنك'); viewBank(); refreshPills();
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

/* ---------- اختبار الاستماع ---------- */
let quiz = [], qi = 0, score = 0;
function viewListen(){
  quiz = [...LISTEN_QUIZ].sort(()=>Math.random()-.5); qi = 0; score = 0;
  drawQ();
}
function drawQ(){
  if(qi >= quiz.length){
    app.innerHTML = `<div class="quiz"><div class="score">النتيجة: ${score} / ${quiz.length}</div>
      <div class="empty"><button class="btn" onclick="viewListen()">إعادة الاختبار</button></div></div>`;
    return;
  }
  const q = quiz[qi];
  const opts = [...q.options].sort(()=>Math.random()-.5);
  app.innerHTML = `<div class="quiz">
    <div class="head"><h2>اختبار الاستماع</h2><span style="color:var(--muted)">سؤال ${qi+1}/${quiz.length}</span></div>
    <div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${q.clip}" title="listen" allowfullscreen></iframe></div>
    <div class="q" id="qc">
      <div class="stem">${esc(q.text)}</div>
      <div class="opts">${opts.map(o=>`<button onclick="pick(this,'${esc(o)}')">${esc(o)}</button>`).join('')}</div>
      <div class="ar-hint">المعنى: ${esc(q.ar)}</div>
    </div>
    <div style="text-align:center;margin-top:14px"><button class="btn" id="nextBtn" style="display:none" onclick="qi++;drawQ()">التالي ←</button></div>
  </div>`;
}
function pick(btn, o){
  const q = quiz[qi], qc = $('#qc');
  if(qc.classList.contains('done')) return;
  qc.classList.add('done');
  qc.querySelectorAll('.opts button').forEach(b=>{
    if(b.textContent === q.answer) b.classList.add('right');
    else if(b === btn) b.classList.add('wrong');
    b.disabled = true;
  });
  if(o === q.answer) score++;
  $('#nextBtn').style.display = 'inline-block';
}

/* ---------- توجيه ---------- */
const routes = {'feed':viewFeed, 'bank':viewBank, 'review':viewReview, 'listen':viewListen};
function route(){
  const r = (location.hash.replace('#/','') || 'feed');
  (routes[r] || viewFeed)();
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active', a.dataset.nav===r));
  refreshPills();
}
window.addEventListener('hashchange', route);
route();

/* ---------- تفويض النقرات ---------- */
app.addEventListener('click', e=>{
  const t = e.target;
  if(t.classList.contains('toggle')){ document.getElementById(t.dataset.t).classList.toggle('show'); return; }
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
