/* برمج — أنماط: مدرب التعرف على الأنماط — 4 عناصر معروضة، تنبّأ بالخامس، 15 جولة متدرجة */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
let st = {};
try { st = JSON.parse(localStorage.getItem('prog_patterns') || '{}') || {}; } catch (e) { st = {}; }
st.best_streak = st.best_streak || 0; st.correct = st.correct || 0; st.answered = st.answered || 0; st.sessions = st.sessions || 0;
const save = () => localStorage.setItem('prog_patterns', JSON.stringify(st));

/* كل مولّد يعيد {label, shown:[4 items], answer, opts:[4 strings]} — opts كنصوص */
const uniq = arr => [...new Set(arr)];
const G = [
  /* 1-3 تقدم حسابي */
  () => { const a = rnd(1, 9), d = rnd(2, 7); const s = [a, a + d, a + 2 * d, a + 3 * d]; const an = a + 4 * d;
    return { label: 'تسلسل عددي', shown: s, answer: an, opts: shuffle(uniq([an, an + d, an - 1, an + 1, an + 2]).slice(0, 4)).map(String) }; },
  /* تناقص */
  () => { const a = rnd(40, 80), d = rnd(3, 9); const s = [a, a - d, a - 2 * d, a - 3 * d]; const an = a - 4 * d;
    return { label: 'تسلسل متناقص', shown: s, answer: an, opts: shuffle(uniq([an, an + d, an - d, an + 1]).slice(0, 4)).map(String) }; },
  /* فرق متزايد */
  () => { let a = rnd(1, 6); const s = [a]; for (let i = 1; i <= 4; i++) s.push(s[i - 1] + i * rnd(2, 3)); const d5 = s[4] - s[3];
    const an = s[4] + (d5 + (s[4] - s[3]) - (s[3] - s[2])); const correct = s[4] + (s[4] - s[3]) + ((s[4] - s[3]) - (s[3] - s[2]));
    return { label: 'فروق متزايدة', shown: s.slice(0, 4), answer: correct, opts: shuffle(uniq([correct, s[4] + d5, correct + 1, correct - 1]).slice(0, 4)).map(String) }; },
  /* 4-6 هندسي */
  () => { const a = rnd(1, 4), r = [2, 3][rnd(0, 1)]; const s = [a, a * r, a * r * r, a * r * r * r]; const an = a * Math.pow(r, 4);
    return { label: 'تسلسل هندسي', shown: s, answer: an, opts: shuffle(uniq([an, an + r, an - a, an * r]).slice(0, 4)).map(String) }; },
  /* تناوب ×2 +n */
  () => { let a = rnd(1, 5), n = rnd(1, 4); const s = [a]; for (let i = 1; i <= 4; i++) s.push(i % 2 ? s[i - 1] * 2 : s[i - 1] + n);
    const an = s[4] * 2;
    return { label: 'تناوب ×2 ثم +' + n, shown: s.slice(0, 4), answer: an, opts: shuffle(uniq([an, an + n, s[4] + n, an - n]).slice(0, 4)).map(String) }; },
  /* مربعات */
  () => { const a = rnd(2, 6); const s = [a * a, (a + 1) * (a + 1), (a + 2) * (a + 2), (a + 3) * (a + 3)]; const an = (a + 4) * (a + 4);
    return { label: 'مربعات كاملة', shown: s, answer: an, opts: shuffle(uniq([an, an - 1, an + 2, an - (2 * a + 4)]).slice(0, 4)).map(String) }; },
  /* 7-9 فيبوناتشي وأشباه */
  () => { const a = rnd(1, 4), b = rnd(2, 6); const s = [a, b, a + b, b + a + b, a + b + b + a + b]; const an = s[3] + s[4];
    return { label: 'كل عنصر = مجموع السابقين', shown: s.slice(0, 4), answer: an, opts: shuffle(uniq([an, an - s[3], an + s[2], s[4] + s[2]]).slice(0, 4)).map(String) }; },
  /* نمط نصي متكرر أبجدي */
  () => { const ch = 'abcde'[rnd(0, 4)]; const s = [ch, ch + ch, ch + ch + ch, ch + ch + ch + ch]; const an = ch.repeat(5);
    return { label: 'نمط نصّي متنامٍ', shown: s, answer: an, opts: shuffle(uniq([an, ch.repeat(6), ch.repeat(4) + 'x', an + ch]).slice(0, 4)).map(String) }; },
  /* مثلثات رقمية */
  () => { const a = rnd(1, 5); const tri = n => n * (n + 1) / 2; const s = [tri(a), tri(a + 1), tri(a + 2), tri(a + 3)]; const an = tri(a + 4);
    return { label: 'أعداد مثلّثية', shown: s, answer: an, opts: shuffle(uniq([an, an - (a + 4), an + a, an + (a + 5)]).slice(0, 4)).map(String) }; },
  /* 10-12 مخرجات كود */
  () => { const k = rnd(2, 4), m = rnd(3, 7); const f = i => i * k + m; const s = [f(0), f(1), f(2), f(3)]; const an = f(4);
    return { label: `ناتج f(i) = i*${k}+${m} لـ i=0..`, shown: s, answer: an, opts: shuffle(uniq([an, an + k, an - m, an + 1]).slice(0, 4)).map(String) }; },
  () => { const s = [2, 6, 12, 20]; const an = 30; /* n*(n+1) */
    return { label: 'n(n+1): 1×2, 2×3, 3×4, 4×5…', shown: s, answer: an, opts: shuffle(uniq([an, 25, 36, 28]).slice(0, 4)).map(String) }; },
  () => { const words = ['if', 'else', 'for', 'while', 'const']; const idx = rnd(0, 3);
    const s = [words[idx].length, words[idx + 1].length, words[idx + 2].length, words[Math.min(idx + 3, 4)].length];
    const ans = idx + 3 <= 4 ? words[Math.min(idx + 4, 4)].length : s[3];
    return { label: 'طول الكلمات المفتاحية بالترتيب', shown: s, answer: ans, opts: shuffle(uniq([ans, ans + 1, ans + 2, ans - 1]).slice(0, 4)).map(String) }; },
  /* 13-15 منطق أعقد */
  () => { const s = [1, 3, 7, 15]; const an = 31; /* 2^(n+1)-1 */
    return { label: '2ⁿ⁻¹: 1,3,7,15…', shown: s, answer: an, opts: shuffle(uniq([an, 30, 23, 33]).slice(0, 4)).map(String) }; },
  () => { const s = ['a1', 'b2', 'c3', 'd4']; const an = 'e5';
    return { label: 'حرف + رقم متزايدان', shown: s, answer: an, opts: shuffle(['e5', 'd5', 'e4', 'f5']) }; },
  () => { const s = [3, 8, 15, 24]; const an = 35; /* n²-1 */
    return { label: 'n²−1: 3,8,15,24…', shown: s, answer: an, opts: shuffle(uniq([an, 34, 36, 31]).slice(0, 4)).map(String) }; },
];

const N = 15;
let rI = 0, score = 0, streak = 0, sessionAnswers = 0;
const order = [];
/* املأ الجولات بالمولدات مع تكرار المبكرة بصعوبات أعلى */
(function seed() { for (let i = 0; i < N; i++) order.push(G[i % G.length]); })();

function stats() {
  const acc = st.answered ? Math.round(st.correct / st.answered * 100) : 0;
  $('#pnStats').innerHTML = `الجولة <b>${Math.min(rI + 1, N)}/${N}</b> • سلسلة حالية <b>${streak}</b> • أفضل سلسلة <b>${st.best_streak}</b> • دقة تراكمية <b>${acc}%</b>`;
}

function end() {
  const acc = sessionAnswers ? Math.round(score / sessionAnswers * 100) : 0;
  $('#pnMain').innerHTML = `
    <div class="pn-end">
      <div class="pn-end-ic">${score >= 12 ? '🏆' : score >= 8 ? '🎯' : '🔁'}</div>
      <h2>${score}/${N} — دقة ${acc}%</h2>
      <div class="pn-end-sub">أفضل سلسلة لك الآن: ${st.best_streak} • إجمالي دقتك عبر الجلسات: ${st.answered ? Math.round(st.correct / st.answered * 100) : 0}%</div>
      <button class="btn" onclick="location.reload()">جلسة جديدة ⟵</button>
    </div>`;
  st.sessions++; save();
}

function round() {
  if (rI >= N) return end();
  const g = order[rI]();
  g.opts = g.opts.map(String); g.answer = String(g.answer);
  stats();
  const lvl = rI < 3 ? 'سهل' : rI < 6 ? 'متوسط' : rI < 9 ? 'متقدم' : rI < 12 ? 'كود' : 'خبير';
  $('#pnMain').innerHTML = `
    <div class="pn-card">
      <div class="pn-lvl">${lvl} • ${escH(g.label)}</div>
      <div class="pn-seq" dir="ltr">${g.shown.map(x => `<span>${escH(String(x))}</span>`).join('')}<span class="pn-q">؟</span></div>
      <div class="pn-ask">ما العنصر الخامس؟</div>
      <div class="pn-opts" dir="ltr">${g.opts.map(o => `<button class="pn-opt" data-o="${escH(o)}">${escH(o)}</button>`).join('')}</div>
      <div class="pn-msg" id="pnMsg"></div>
    </div>`;
  let answered = false;
  $('#pnMain').querySelectorAll('.pn-opt').forEach(b => b.onclick = () => {
    if (answered) return; answered = true;
    const ok = b.dataset.o === g.answer;
    st.answered++; sessionAnswers++;
    if (ok) { score++; streak++; st.correct++; st.best_streak = Math.max(st.best_streak, streak); b.classList.add('ok'); }
    else { streak = 0; b.classList.add('bad'); $('#pnMain').querySelector(`[data-o="${escH(g.answer)}"]`).classList.add('ok'); }
    save();
    $('#pnMsg').innerHTML = ok ? '<span class="pn-ok">✓ صحيح!</span>' : `<span class="pn-bad">✗ — الصحيح: <b dir="ltr">${escH(g.answer)}</b></span>`;
    setTimeout(() => { rI++; round(); }, ok ? 650 : 1400);
  });
}

round();
})();
