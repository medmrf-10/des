/* learner.js — ملف المتعلم الموحد للمنظومة.
   مكتبة مشتركة بين بطاقات البوابة: تخزن محلياً (localStorage['learner.v1'])
   حالة كل عقدة معرفة بمعرّفها الموحد: ay:2:255 / hd:g319 / hd:h1 / hd:r42929 / fq:tahara:ghasl / en:i1:0234
   الاستعمال: <script src="learner.js"></script> ثم:
     Learner.see(id)            — علّم العقدة «شوهدت»
     Learner.mark(id, grade)    — grade: 0 نسيت · 1 صعب · 2 جيد · 3 سهل — يحدّث الإتقان ومجدولة المراجعة
     Learner.get(id)            — {s:'seen'|'learning'|'mastered', g, reps, stab, due, last}
     Learner.due()              — العقد المستحقة الآن (due <= الآن)
     Learner.all() / stats() / clear() */
(function(){
const KEY='learner.v1';
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}}
function save(d){try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}}
const DAY=86400000;
/* جدولة مبسّطة مستلهمة من FSRS: stab بالأيام. ليست FSRS الكاملة — جدولة أولية صادقة. */
function nextState(st,grade){
 st=st||{};const now=Date.now();
 st.reps=(st.reps||0)+1;st.g=grade;st.last=now;
 if(grade===0){st.s='learning';st.stab=0;st.due=now+10*60000}          /* نسيت: إعادة بعد ١٠د */
 else{
   const f=grade===1?1.4:grade===2?2.3:3.2;                              /* صعب/جيد/سهل */
   st.stab=st.stab?st.stab*f:(grade===1?0.5:grade===2?1:2);
   st.due=now+st.stab*DAY;
   st.s=st.stab>=7?'mastered':'learning';
 }
 return st;
}
window.Learner={
 see(id){const d=load();d[id]=d[id]||{};if(!d[id].s){d[id].s='seen';d[id].seen=Date.now();save(d)}return d[id]},
 mark(id,grade){const d=load();d[id]=nextState(d[id]||{},grade);save(d);return d[id]},
 get(id){return load()[id]||null},
 all(){return load()},
 due(){const n=Date.now(),d=load();return Object.keys(d).filter(k=>d[k].due&&d[k].due<=n)},
 stats(){const d=load(),o={total:0,seen:0,learning:0,mastered:0,byPrefix:{}};
  for(const k in d){o.total++;const s=d[k].s||'seen';o[s]=(o[s]||0)+1;const p=k.split(':')[0];o.byPrefix[p]=(o.byPrefix[p]||0)+1}
  return o},
 clear(){localStorage.removeItem(KEY)}
};
})();
