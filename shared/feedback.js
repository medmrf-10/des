/* المنظومة — زر تعليق/اقتراح موحد داخل كل تطبيق.
   الاستخدام: <script src="/des/shared/feedback.js" data-pid="turath" data-title="مكتبة Turath"></script>
   التعليقات والاقتراحات تُحفظ في نفس مخزن البوابة الموحدة فتظهر في المكانين. */
(function(){
  const tag=document.currentScript;
  const pid=tag?.dataset.pid||location.pathname;
  const title=tag?.dataset.title||document.title;
  const CK='portal_comments',SK='portal_suggestions';
  const get=(k)=>JSON.parse(localStorage.getItem(k)||'{}');
  const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const css=`
  .fb-btn{position:fixed;bottom:10px;inset-inline-start:10px;z-index:900;width:36px;height:36px;border-radius:50%;border:1px solid #3a4670;background:#1a2238;color:#e8c97a;font-size:.95rem;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.4);font-family:inherit;opacity:.45;transition:opacity .2s}
  .fb-btn:hover{background:#242f4d;opacity:1}
  .fb-btn .n{position:absolute;top:-4px;inset-inline-end:-4px;background:#c9a24b;color:#0b0f1a;font-size:.6rem;font-weight:700;border-radius:99px;padding:2px 7px}
  .fb-home{position:fixed;bottom:10px;inset-inline-start:52px;z-index:900;width:36px;height:36px;border-radius:50%;border:1px solid #3a4670;background:#1a2238;color:#e8c97a;font-size:.95rem;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;text-decoration:none;opacity:.45;transition:opacity .2s}
  .fb-home:hover{background:#242f4d;opacity:1}
  .fb-ov{position:fixed;inset:0;background:rgba(5,8,16,.6);backdrop-filter:blur(3px);z-index:950;display:none}
  .fb-ov.open{display:block}
  .fb-sheet{position:absolute;bottom:0;left:0;right:0;max-height:70dvh;background:#131a2a;border-radius:22px 22px 0 0;border-top:1px solid #3a4670;display:flex;flex-direction:column;animation:fbup .25s ease;font-family:'Amiri','Noto Naskh Arabic',serif;color:#f5f1e8}
  @keyframes fbup{from{transform:translateY(40px);opacity:0}}
  .fb-hd{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #232b45}
  .fb-hd .t{font-size:.9rem;color:#e8c97a;font-weight:700}
  .fb-hd .c{background:none;border:none;color:#8b93b0;font-size:1.1rem;cursor:pointer}
  .fb-tabs{display:flex;gap:6px;padding:10px 18px 0}
  .fb-tab{background:none;border:1px solid #2a3350;border-radius:99px;color:#8b93b0;font-family:inherit;font-size:.72rem;padding:5px 14px;cursor:pointer}
  .fb-tab.on{color:#e8c97a;border-color:#c9a24b}
  .fb-body{overflow-y:auto;padding:12px 18px 20px}
  .fb-cm{font-size:.8rem;background:#0b0f1a;border-radius:8px;padding:8px 10px;margin-bottom:6px;line-height:1.7}
  .fb-cm .n{color:#e8c97a;font-size:.66rem;display:block;margin-bottom:2px}
  .fb-sg{font-size:.8rem;color:#8b93b0;background:#0b0f1a;border:1px dashed rgba(232,201,122,.4);border-radius:8px;padding:8px 10px;margin-bottom:6px;line-height:1.7}
  .fb-sg .st{color:#e8c97a;font-size:.62rem;display:block;margin-bottom:2px}
  .fb-sg.ok{border-style:solid;border-color:rgba(70,201,109,.4)}
  .fb-sg.ok .st{color:#46c96d}
  .fb-in{display:flex;gap:6px;margin-top:8px}
  .fb-in input{flex:1;background:#0b0f1a;border:1px solid #2a3350;border-radius:8px;color:#f5f1e8;font-family:inherit;font-size:.8rem;padding:8px 10px}
  .fb-in input:focus{outline:none;border-color:#c9a24b}
  .fb-in button{background:linear-gradient(135deg,#c9a24b,#8a6a2f);border:none;border-radius:8px;color:#0b0f1a;font-family:inherit;font-size:.72rem;font-weight:700;padding:8px 14px;cursor:pointer}
  .fb-mut{color:#8b93b0;font-size:.78rem;text-align:center;padding:14px}`;

  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  let tab='c';
  const btn=document.createElement('button');btn.className='fb-btn';btn.innerHTML='💬';
  const ov=document.createElement('div');ov.className='fb-ov';
  ov.innerHTML=`<div class="fb-sheet">
    <div class="fb-hd"><span class="t">${esc(title)} — ملاحظات</span><button class="c">✕</button></div>
    <div class="fb-tabs"><button class="fb-tab on" data-t="c">التعليقات</button><button class="fb-tab" data-t="s">اقتراح تحسين</button></div>
    <div class="fb-body"></div>
  </div>`;
  const home=document.createElement('a');home.className='fb-home';
  home.href=location.protocol==='file:'?'../portal/':'/des/portal/';
  home.title='البوابة';home.textContent='≡';
  document.body.appendChild(btn);document.body.appendChild(ov);document.body.appendChild(home);
  const body=ov.querySelector('.fb-body');

  function render(){
    const cm=get(CK)[pid]||[],sg=get(SK)[pid]||[];
    btn.querySelector('.n')?.remove();
    if(cm.length+sg.length){const n=document.createElement('span');n.className='n';n.textContent=cm.length+sg.length;btn.appendChild(n)}
    if(tab==='c'){
      body.innerHTML=(cm.map(c=>`<div class="fb-cm"><span class="n">${esc(c.n)}</span>${esc(c.t)}</div>`).join('')||'<div class="fb-mut">لا تعليقات — كن أول من يعلّق</div>')+
      `<div class="fb-in"><input placeholder="اسمك — تعليقك"><button>أضف</button></div>`;
    }else{
      body.innerHTML=(sg.map(s=>`<div class="fb-sg${s.st==='ok'?' ok':''}"><span class="st">${s.st==='pending'?'⏳ بانتظار موافقة الصانع':'✓ مقبول'} — ${esc(s.n)}</span>${esc(s.t)}</div>`).join('')||'<div class="fb-mut">لا اقتراحات بعد</div>')+
      `<div class="fb-in"><input placeholder="اسمك — اقتراحك للصانع"><button>أرسل</button></div>`;
    }
  }
  btn.onclick=()=>{ov.classList.add('open');render()};
  ov.onclick=e=>{if(e.target===ov)ov.classList.remove('open')};
  ov.querySelector('.c').onclick=()=>ov.classList.remove('open');
  ov.querySelectorAll('.fb-tab').forEach(t=>t.onclick=()=>{tab=t.dataset.t;ov.querySelectorAll('.fb-tab').forEach(x=>x.classList.toggle('on',x===t));render()});
  body.addEventListener('click',e=>{
    const b=e.target.closest('.fb-in button');if(!b)return;
    const inp=body.querySelector('input'),v=inp.value.trim();if(!v)return;
    const d=v.includes('—')?{n:v.split('—')[0].trim(),t:v.split('—').slice(1).join('—').trim()}:{n:'عضو',t:v};
    if(tab==='c'){const a=get(CK);(a[pid]=a[pid]||[]).push(d);set(CK,a)}
    else{const a=get(SK);(a[pid]=a[pid]||[]).push({...d,st:'pending'});set(SK,a)}
    render();
  });
  body.addEventListener('keydown',e=>{
    if(e.key!=='Enter'||e.target.tagName!=='INPUT')return;
    e.target.closest('.fb-in')?.querySelector('button')?.click();
  });
})();
