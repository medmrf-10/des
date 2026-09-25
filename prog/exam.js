/* برمج — امتحان شهادة: 20 سؤالاً من كل المسارات، مؤقّت 25د، تفصيل بكل مجال، prog_exam */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const LS_BEST = 'prog_exam_best', LS_ATT = 'prog_exam';
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => a.slice().sort(() => Math.random() - .5);

let attempts = [];
try { attempts = JSON.parse(localStorage.getItem(LS_ATT) || '[]') || []; } catch (e) { attempts = []; }
let best = {};
try { best = JSON.parse(localStorage.getItem(LS_BEST) || '{}') || {}; } catch (e) { best = {}; }
const saveAtt = () => localStorage.setItem(LS_ATT, JSON.stringify(attempts.slice(-20)));

/* تجميع بنك الأسئلة مع مجاله (الدرس) */
const BANK = [];
TRACKS.forEach(t => t.lessons.forEach((l, li) => {
  (l.quiz || []).forEach(q => BANK.push({
    q: q.q, o: q.o, a: q.a, domain: l.t, tid: t.id, li, tn: t.name,
    code: /&lt;|&gt;|<\w|[=;(){}\[\]]|console\.log|=>/.test(q.q + q.o.join('')),
  }));
}));

const N_Q = 20, TIME = 25 * 60;
let cur = null; // {qs, i, ans:[], t0, timer}

/* ---------- بدء ---------- */
function renderPick() {
  const last = attempts[attempts.length - 1];
  $('#examBody').innerHTML = `
    <div class="ex-pick">
      <h2>امتحان الشهادة — ${N_Q} سؤالاً</h2>
      <p class="ex-intro">مزيج متوازن من أسئلة المفاهيم وقراءة الكود عبر كل المسارات — مؤقّت ${TIME / 60} دقيقة، وتفصيل درجاتك بكل مجال في النهاية.</p>
      ${last ? `<div class="ex-last">آخر محاولة: <b>${last.score}/${last.n}</b> (${Math.round(last.score / last.n * 100)}%) — ${new Date(last.at).toLocaleDateString('ar')}</div>` : ''}
      <button class="btn" id="exGo">ابدأ الامتحان</button>
    </div>`;
  $('#exGo').onclick = startExam;
}

function startExam() {
  /* توازن المسارات: حصة لكل مسار حسب حجم بنكه */
  const perT = TRACKS.map(t => BANK.filter(b => b.tid === t.id)).filter(x => x.length);
  let qs = [];
  const share = Math.floor(N_Q / perT.length);
  perT.forEach(pool => qs = qs.concat(shuffle(pool).slice(0, share)));
  qs = shuffle(qs).concat(shuffle(BANK.filter(b => !qs.includes(b)))).slice(0, N_Q);
  cur = { qs, i: 0, ans: [], t0: Date.now(), left: TIME };
  tick();
  renderQ();
}

/* ---------- مؤقّت ---------- */
let timerId = null;
function tick() {
  clearInterval(timerId);
  timerId = setInterval(() => {
    cur.left--;
    const m = Math.floor(cur.left / 60), s = cur.left % 60;
    const t = $('#exTimer'); if (t) t.textContent = `${m}:${String(s).padStart(2, '0')}`;
    if (cur.left <= 0) { clearInterval(timerId); finishExam(true); }
  }, 1000);
}

/* ---------- سؤال ---------- */
function renderQ() {
  const q = cur.qs[cur.i];
  const m = Math.floor(cur.left / 60), s = cur.left % 60;
  $('#examBody').innerHTML = `
    <div class="ex-top">
      <span class="ex-count">${cur.i + 1}/${cur.qs.length}</span>
      <span class="ex-dom">${escH(q.domain)}</span>
      <span class="ex-timer ${cur.left < 300 ? 'low' : ''}" id="exTimer">${m}:${String(s).padStart(2, '0')}</span>
    </div>
    <div class="track-bar"><i style="width:${Math.round(cur.i / cur.qs.length * 100)}%"></i></div>
    <div class="ex-q ${q.code ? 'code' : ''}">${q.q}</div>
    <div class="ex-opts">${q.o.map((o, i) => `<button class="ex-opt" data-i="${i}">${o}</button>`).join('')}</div>`;
  $('#examBody').querySelectorAll('.ex-opt').forEach(b => b.onclick = () => answer(+b.dataset.i, b));
}

function answer(i, btn) {
  const q = cur.qs[cur.i];
  cur.ans[cur.i] = i;
  $('#examBody').querySelectorAll('.ex-opt').forEach((b, bi) => {
    b.disabled = true;
    if (bi === q.a) b.classList.add('ok');
    else if (bi === i) b.classList.add('bad');
  });
  setTimeout(() => { cur.i++; cur.i >= cur.qs.length ? finishExam(false) : renderQ(); }, 850);
}

/* ---------- النتيجة ---------- */
function finishExam(timeout) {
  clearInterval(timerId);
  const qs = cur.qs, n = qs.length;
  const ok = qs.filter((q, i) => cur.ans[i] === q.a).length;
  const doms = {};
  qs.forEach((q, i) => {
    if (!doms[q.domain]) doms[q.domain] = { ok: 0, tot: 0, tid: q.tid, li: q.li, tn: q.tn };
    doms[q.domain].tot++;
    if (cur.ans[i] === q.a) doms[q.domain].ok++;
  });
  attempts.push({ at: new Date().toISOString(), score: ok, n, domains: Object.keys(doms).reduce((o, k) => { o[k] = doms[k].ok + '/' + doms[k].tot; return o; }, {}) });
  saveAtt();
  const pct = Math.round(ok / n * 100);
  /* أضعف مجال */
  const weak = Object.entries(doms).sort((a, b) => a[1].ok / a[1].tot - b[1].ok / b[1].tot)[0];
  const wrong = qs.map((q, i) => ({ q, i })).filter(x => cur.ans[x.i] !== x.q.a);
  const wrongByDom = {};
  wrong.forEach(x => { (wrongByDom[x.q.domain] = wrongByDom[x.q.domain] || []).push(x.q); });
  $('#examBody').innerHTML = `
    <div class="ex-pick">
      ${timeout ? '<div class="ex-timeout">⏱ انتهى الوقت!</div>' : ''}
      <h2>النتيجة: ${ok}/${n} — ${pct}%</h2>
      <div class="track-bar" style="margin:14px 0"><i style="width:${pct}%"></i></div>
      <h3 class="sec-h">الدرجة بكل مجال</h3>
      <div class="ex-doms">${Object.entries(doms).sort((a, b) => a[1].ok / a[1].tot - b[1].ok / b[1].tot).map(([d, v]) => {
        const p = Math.round(v.ok / v.tot * 100);
        return `<div class="ex-dom-row"><span class="ex-dom-n">${escH(d)}</span><div class="track-bar sm"><i style="width:${p}%"></i></div><b>${v.ok}/${v.tot}</b></div>`;
      }).join('')}</div>
      ${weak && weak[1].ok < weak[1].tot ? `<div class="ex-weak">
        <div class="ex-weak-t">أضعف مجال: «${escH(weak[0])}» — ${weak[1].ok}/${weak[1].tot}</div>
        <div class="ex-weak-a">راجع الدرس ثم أعد المحاولة.</div>
        <a class="btn sm" href="index.html#l=${weak[1].tid}:${weak[1].li}">افتح درس «${escH(weak[0])}» ←</a>
        <a class="btn ghost sm" href="map.html">خريطة الإتقان</a>
      </div>` : ''}
      ${wrong.length ? `<h3 class="sec-h" style="margin-top:20px">الأخطاء (${wrong.length})</h3>
        ${Object.entries(wrongByDom).map(([d, list]) => `<div class="ex-wrong"><div class="ex-w-q"><b>${escH(d)}</b></div>${list.map(q => `<div class="ex-w-item">${q.q} <span class="ex-w-a">الصحيحة: ${q.o[q.a]}</span></div>`).join('')}</div>`).join('')}` : '<div class="ex-win">🎓 امتحان كامل بلا خطأ!</div>'}
      <div class="ex-act"><button class="btn" id="exAgain">ابدأ امتحاناً آخر</button></div>
    </div>`;
  $('#exAgain').onclick = startExam;
  const hist = attempts.slice(-5).map(a => `${a.score}/${a.n} · ${new Date(a.at).toLocaleDateString('ar')}`).join(' — ');
  if (hist) $('#examBody').insertAdjacentHTML('beforeend', `<div class="ex-last">المحاولات الأخيرة: ${hist}</div>`);
}

renderPick();
})();
