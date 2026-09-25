/* shared/llm.js — Gemini helper for all tools.
   Usage: <script src="../shared/llm.js"></script>
   window.llmKey() → key or ''
   window.llmReady() → bool
   await window.gemAsk(prompt, opts) → text  (opts: {model,temperature,maxTokens})
   Key lives in localStorage.jadid_llm, written by the PIN-gated jadid page on unlock.
*/
(function(){
const M='gemini-3.5-flash-lite';
window.llmKey=function(){return localStorage.getItem('jadid_llm')||''};
window.llmReady=function(){return !!window.llmKey()};
window.gemAsk=async function(prompt,o){
 o=o||{};const k=window.llmKey();if(!k)throw new Error('no key — افتح «جديد» برقمك أولاً');
 const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+(o.model||M)+':generateContent?key='+k,{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:o.temperature??.4,maxOutputTokens:o.maxTokens||1200}})});
 const d=await r.json();
 if(d.error)throw new Error(d.error.message||'خطأ من الواجهة');
 return (d.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim()||'—';
};
})();
