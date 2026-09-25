/* english/core.js — منطق مشترك بين index.html و routine.html (بلا DOM) */
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const todayISO = () => new Date().toISOString().slice(0,10);
const CARDS_KEY = 'en_cards';
const SEEN_KEY = 'en_feed_seen';
const ROUTINE_KEY = 'en_routine';
const BANK_LS = 'enbank';

/* ---------- تدقيق إملاء متسامح ---------- */
const HOMO = {to:'too two',too:'to two',two:'to too',there:"their they're",their:"there they're","they're":'there their',your:"you're","you're":'your',its:"it's","it's":'its',here:'hear',hear:'here',right:'write',write:'right',know:'no',no:'know',where:'wear',wear:'where',for:'four',four:'for',by:'buy bye',buy:'by bye',bye:'by buy',one:'won',won:'one',hour:'our',our:'hour',week:'weak',weak:'week',see:'sea',sea:'see',son:'sun',sun:'son',peace:'piece',piece:'peace',ate:'eight',eight:'ate',i:'eye',eye:'i'};
function normTok(w){ return w.toLowerCase().replace(/[^a-z'0-9]/g,''); }
function editDist1(a,b){ // هل تبعدان بتحرير واحد على الأكثر؟
  let i=0,j=0,d=0;
  while(i<a.length && j<b.length){
    if(a[i]===b[j]){ i++; j++; }
    else{
      d++; if(d>1) return false;
      if(a.length>b.length) i++; else if(a.length<b.length) j++; else { i++; j++; }
    }
  }
  return d+(a.length-i)+(b.length-j) <= 1;
}
function wmatch(tw, u){
  if(tw === u) return 1;
  if((HOMO[tw]||'').split(' ').includes(u)) return 1;
  if(tw.length>3 && editDist1(tw,u)) return 0.5;
  return 0;
}
function dictDiff(target, typed){
  const Traw = target.trim().split(/\s+/).filter(Boolean);
  const T = Traw.map(normTok);
  const U = typed.trim().split(/\s+/).filter(Boolean).map(normTok);
  const m = T.length, n = U.length;
  const dp = Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=m-1;i>=0;i--) for(let j=n-1;j>=0;j--)
    dp[i][j] = Math.max(dp[i+1][j+1] + wmatch(T[i],U[j]), dp[i+1][j], dp[i][j+1]);
  let i=0, j=0, ok=0, extra=0; const cells=[]; const missed=[];
  while(i<m && j<n){
    const w = wmatch(T[i],U[j]);
    if(w>0 && dp[i][j] === dp[i+1][j+1] + w){
      ok += w;
      cells.push(w===1
        ? `<span class="rw">${esc(Traw[i])}</span>`
        : `<span class="rn">${esc(Traw[i])}</span>`);
      i++; j++;
    } else if(dp[i+1][j] >= dp[i][j+1]){
      cells.push(`<span class="rb">${esc(Traw[i])}</span>`); missed.push(T[i]); i++;
    } else { extra++; j++; }
  }
  while(i<m){ cells.push(`<span class="rb">${esc(Traw[i])}</span>`); missed.push(T[i]); i++; }
  extra += n - j;
  const pct = m ? Math.round(ok/m*100) : 0;
  return {html:cells.join(' '), pct, extra, missed};
}

/* ---------- مخزن بطاقات FSRS ---------- */
function loadCards(){ try{ return JSON.parse(localStorage.getItem(CARDS_KEY)||'{}'); }catch(e){ return {}; } }
function saveCards(c){ localStorage.setItem(CARDS_KEY, JSON.stringify(c)); }
function dueCards(cards){
  return Object.entries(cards)
    .filter(([id,c]) => c.state==='new' || !c.lastReview || !c.nextReview || c.nextReview <= todayISO())
    .sort((a,b)=> (a[1].nextReview||'9999').localeCompare(b[1].nextReview||'9999'));
}
function loadBank(){ try{ return JSON.parse(localStorage.getItem(BANK_LS)||'{}'); }catch(e){ return {}; } }
