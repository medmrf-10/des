/* المعجم المصور — 6 مشاهد بأيقونات كبيرة: مطبخ/سوق/مسجد/مكتبة/غابة/شاطئ، كل مشهد 8-12 عنصراً.
   الضغط ← الكلمة + النطق TTS + جملة. المتقن في en_dict.pics = {id:1} */
const app = document.getElementById('app');

const SCENES = [
{id:'kitchen', nm:'المطبخ', ic:'🍳', items:[
 ['🍳','frying pan','مقلاة','I fry eggs in the frying pan.'],
 ['🧊','ice cube','مكعب ثلج','Put an ice cube in the glass.'],
 ['🍽️','plate','طبق','The plate is on the table.'],
 ['🔪','knife','سكين','Be careful with the knife.'],
 ['🥄','spoon','ملعقة','She stirs the tea with a spoon.'],
 ['🫖','kettle','غلاية','The kettle is boiling.'],
 ['🍞','toaster','محمصة','The toaster makes two slices.'],
 ['🧂','salt','ملح','Pass me the salt, please.'],
 ['🥛','milk','حليب','I drink milk every morning.'],
 ['🗑️','trash bin','سلة مهملات','Throw it in the trash bin.'],
]},
{id:'market', nm:'السوق', ic:'🛒', items:[
 ['🛒','shopping cart','عربة تسوق','Push the shopping cart slowly.'],
 ['💰','money','مال','I paid money for the fruit.'],
 ['🥕','carrot','جزرة','The rabbit eats a carrot.'],
 ['🍎','apple','تفاحة','An apple a day keeps the doctor away.'],
 ['🧀','cheese','جبن','She bought a piece of cheese.'],
 ['🐟','fish','سمكة','Fresh fish is in the market today.'],
 ['🧅','onion','بصلة','The onion made him cry.'],
 ['🍞','bread','خبز','We buy bread every day.'],
 ['💳','credit card','بطاقة ائتمان','Can I pay by credit card?'],
 ['🏷️','price tag','بطاقة سعر','Check the price tag first.'],
]},
{id:'mosque', nm:'المسجد', ic:'🕌', items:[
 ['🕌','mosque','مسجد','The mosque is near my house.'],
 ['📿','prayer beads','مسبحة','He holds his prayer beads.'],
 ['🕋','Kaaba','الكعبة','Muslims pray toward the Kaaba.'],
 ['🧎','prayer mat','سجادة صلاة','She put the prayer mat on the floor.'],
 ['🤲','supplication','دعاء','Raise your hands in supplication.'],
 ['📖','holy book','كتاب مقدس','He reads the holy book daily.'],
 ['🕯️','candle','شمعة','A candle lights the dark room.'],
 ['🌙','crescent','هلال','The crescent appears in the sky.'],
 ['🚪','door','باب','The door of the mosque is open.'],
 ['🕌','minaret','مئذنة','The minaret is very tall.'],
]},
{id:'library', nm:'المكتبة', ic:'📚', items:[
 ['📚','books','كتب','The library has many books.'],
 ['🔖','bookmark','علامة مرجعية','Put a bookmark in the page.'],
 ['🖊️','pen','قلم حبر','Write your name with a pen.'],
 ['📓','notebook','دفتر','I write notes in my notebook.'],
 ['🪑','chair','كرسي','Sit on the chair and read.'],
 ['🕮','open book','كتاب مفتوح','An open book is on the desk.'],
 ['🔍','magnifying glass','عدسة مكبرة','He reads the small print with a magnifying glass.'],
 ['📖','storybook','قصص','The children love the storybook.'],
 ['🧾','receipt','إيصال','Keep the receipt of the book.'],
 ['💡','lamp','مصباح','Turn on the lamp to read.'],
]},
{id:'forest', nm:'الغابة', ic:'🌲', items:[
 ['🌲','pine tree','شجرة صنوبر','The pine tree is very tall.'],
 ['🦌','deer','غزال','A deer runs through the forest.'],
 ['🍄','mushroom','فطر','A red mushroom grows under the tree.'],
 ['🌳','oak tree','شجرة بلوط','The oak tree is very old.'],
 ['🐦','bird','طائر','A bird sings in the morning.'],
 ['🐿️','squirrel','سنجاب','The squirrel hides nuts underground.'],
 ['🍃','leaf','ورقة شجر','A green leaf fell on the path.'],
 ['🦉','owl','بومة','The owl sleeps during the day.'],
 ['🌧️','rain','مطر','Rain falls on the forest.'],
 ['⛰️','mountain','جبل','The mountain is behind the forest.'],
]},
{id:'beach', nm:'الشاطئ', ic:'🏖️', items:[
 ['🏖️','beach','شاطئ','We walked on the beach.'],
 ['🌊','wave','موجة','A big wave hit the shore.'],
 ['⛱️','umbrella','مظلة شاطئ','Sit under the umbrella.'],
 ['🐚','seashell','صدفة','She found a seashell on the sand.'],
 ['🏊','swimmer','سبّاح','The swimmer swims fast.'],
 ['☀️','sun','شمس','The sun is very hot today.'],
 ['🩴','flip flops','شبشب','Wear flip flops on the sand.'],
 ['🍦','ice cream','مثلجات','The children want ice cream.'],
 ['⛵','sailboat','قارب شراعي','A sailboat crosses the sea.'],
 ['🦀','crab','سلطعون','The crab walks sideways.'],
]},
];

function loadD(){ try{ return JSON.parse(localStorage.getItem('en_dict')||'{}'); }catch(e){ return {}; } }
function saveD(d){ localStorage.setItem('en_dict', JSON.stringify(d)); }
function picsDone(){ return loadD().pics || {}; }
function ttsOn(){ try{ return speechSynthesis.getVoices().some(v=>/^en([-_]|$)/i.test(v.lang)); }catch(e){ return false; } }
function speak(t){ try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.9; speechSynthesis.speak(u); }catch(e){} }

let scene = null;
function viewHome(){
  const done = picsDone();
  const total = SCENES.reduce((n,s)=>n+s.items.length,0);
  const dn = Object.keys(done).length;
  app.innerHTML = `<div class="head"><h2>المشاهد</h2><span class="rstreak">${dn}/${total} عنصراً متقناً</span></div>
  <div class="muted" style="font-size:13px;margin-bottom:8px">اضغط مشهداً ثم اضغط أي عنصر فيه لتسمع كلمته الإنجليزية وترى جملة عليه.</div>
  <div class="scenes">${SCENES.map(s=>{
    const d = s.items.filter((_,i)=>done[`${s.id}:${i}`]).length;
    return `<div class="scn" onclick="openScene('${s.id}')"><div class="ico">${s.ic}</div><div class="nm">${s.nm}</div><div class="cnt">${d}/${s.items.length}</div></div>`;
  }).join('')}</div>
  <div class="rlnks" style="margin-top:18px"><a href="vocab.html">مفرداتي</a><a href="library.html">الفهرس</a><a href="practice.html">تمرين اليوم</a></div>`;
}
function openScene(id){
  scene = SCENES.find(s=>s.id===id);
  drawScene();
}
function drawScene(){
  const done = picsDone();
  app.innerHTML = `<div class="head"><h2>${scene.ic} ${scene.nm}</h2><span style="color:var(--muted)">${scene.items.length} عنصر</span></div>
  <div class="stage">${scene.items.map((it,i)=>{
    const id = `${scene.id}:${i}`;
    return `<div class="itm ${done[id]?'done':''}" onclick="pickItem(${i})" title="${esc(it[2])}">${it[0]}${done[id]?`<div class="lbl">${esc(it[1])}</div>`:''}</div>`;
  }).join('')}</div>
  <div id="wZone"></div>
  <div class="grades" style="margin-top:14px"><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewHome()">المشاهد ←</button></div>`;
}
function pickItem(i){
  const it = scene.items[i], id = `${scene.id}:${i}`;
  const known = picsDone()[id];
  document.getElementById('wZone').innerHTML = `<div class="wcard">
    <div class="wen">${esc(it[1])} ${ttsOn()? `<button class="btn" style="padding:4px 10px;font-size:14px" onclick="speak(scene.items[${i}][1])">🔊</button>`:''}</div>
    <div class="war">${esc(it[2])}</div>
    <div class="wsent">${esc(it[3])} ${ttsOn()? `<button class="btn" style="padding:2px 8px;font-size:12px" onclick="speak(scene.items[${i}][3])">🔊 جملة</button>`:''}</div>
    <button class="btn" onclick="markPic(${i})">${known?'متقنة ✓':'أتقنتها ←'}</button>
  </div>`;
  if(ttsOn()) speak(it[1]);
}
function markPic(i){
  const id = `${scene.id}:${i}`;
  const d = loadD(); (d.pics ||= {})[id] = 1;
  /* الكلمة تدخل بنك الكلمات أيضاً */
  const it = scene.items[i];
  const b = loadBank(); const t = normTok(it[1]);
  if(t && !b[t]) b[t] = {en:it[1], ar:it[2], clip:'pic:'+scene.id, box:1, due:Date.now(), seen:1, ok:0};
  saveD(d); localStorage.setItem(BANK_LS, JSON.stringify(b));
  drawScene();
  pickItem(i);
}

viewHome();
