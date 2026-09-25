/* قارئ متدرّج — 6 قصص قصيرة A2-B1
   النقر على كلمة يضيفها إلى en_bank بصيغة الصفحات الأخرى + ترجمة فورية من DICT
   en_story: {storyId:{score,total,best,ts}} */
const app = document.getElementById('app');
const $ = s => document.querySelector(s);
const STORY_LS = 'en_story';

const DICT = {it:'هو/هي (لغير العاقل)',was:'كان',raining:'تمطر',heavily:'بغزارة',left:'غادر',house:'بيت',forgot:'نسي',umbrella:'مظلة',kitchen:'مطبخ',table:'طاولة',bus:'باص',late:'متأخر',everyone:'الجميع',looked:'بدوا',tired:'متعبون',watched:'راقب',through:'عبر',window:'نافذة',suddenly:'فجأة',old:'عجوز/قديم',man:'رجل',sat:'جلس',next:'بجانب',smiled:'ابتسم',daughter:'ابنة',kindly:'بلطف',told:'أخبر',garden:'حديقة',cats:'قطط',laughed:'ضحك',first:'أول',week:'أسبوع',stopped:'توقف',gave:'أعطى',keep:'احتفظ',again:'مجدداً',walked:'مشى',work:'عمل',feeling:'يشعر',strangely:'بغرابة',happy:'سعيد',evening:'مساء',bought:'اشترى',yellow:'أصفر',notebook:'دفتر',wrote:'كتب',page:'صفحة',beginning:'بداية',diary:'مذكرات',little:'قليل',habit:'عادة',cat:'قط',ran:'ركض',away:'بعيداً',morning:'صباح',everywhere:'في كل مكان',neighbors:'الجيران',posters:'ملصقات',days:'أيام',passed:'مرّت',sign:'أثر',cried:'بكى',quietly:'بهدوء',night:'ليل',heard:'سمع',small:'صغير',cry:'صرخة/مواء',bakery:'مخبز',closed:'مغلق',years:'سنوات',ago:'منذ',door:'باب',locked:'موصد',open:'مفتوح',climbed:'تسلق',carefully:'بحذر',inside:'في الداخل',found:'وجد',kittens:'قطط صغيرة',lost:'تائه',father:'أب',baker:'خبّاز',owned:'امتلك',shop:'متجر',box:'صندوق',carried:'حمل',home:'البيت',sleeps:'ينام',bed:'سرير',strange:'غريب',ended:'انتهى',well:'حسناً',started:'بدأ',job:'وظيفة',bookstore:'مكتبة',wooden:'خشبية',floors:'أرضيات',noise:'ضجيج',boss:'مدير',strict:'صارم',fair:'عادل',books:'كتب',patient:'صبور',teachers:'معلمون',dropped:'أسقط',shelf:'رف',terrible:'فظيع',clean:'نظّف',learn:'تعلم',month:'شهر',corner:'زاوية',customers:'زبائن',boy:'فتى',visited:'زار',adventure:'مغامرة',stories:'قصص',saved:'حفظ/احتفظ',best:'أفضل',rainy:'ممطر',afternoon:'عصر',key:'مفتاح',sundays:'أيام الأحد',proud:'فخور',opened:'فتح',early:'باكراً',tea:'شاي',sister:'أخت',full:'ممتلئ',quiet:'هادئ',readers:'قرّاء',lighthouse:'منار',rock:'صخرة',sea:'بحر',hundred:'مئة',ships:'سفن',computers:'حواسيب',keeper:'حارس',refused:'رفض',leave:'يغادر',stairs:'درج',lamp:'مصباح',painted:'طلي',walls:'جدران',white:'أبيض',repaired:'أصلح',broken:'مكسور',village:'قرية',stubborn:'عنيد',lonely:'وحيد',knew:'عرف',forgotten:'نسي (ماضي تام)',winter:'شتاء',storm:'عاصفة',coast:'ساحل',electricity:'كهرباء',fishing:'صيد',boat:'قارب',waves:'أمواج',lit:'أشعل',hands:'أيدي',light:'ضوء',darkness:'ظلام',way:'طريق',thanked:'شكر',promised:'وعد',weekend:'عطلة',shines:'يضيء',deserve:'تستحق',alive:'حية',letter:'رسالة',arrived:'وصلت',stamp:'طابع',address:'عنوان',simply:'ببساطة',person:'شخص',bench:'مقعد',kept:'احتفظ',drawings:'رسومات',cities:'مدن',hospital:'مستشفى',writer:'كاتب',artist:'فنان',continued:'استمر',writing:'كتابة',whole:'كامل',hope:'أمل',humor:'دعابة',met:'التقى',shy:'خجول',sunset:'غروب',market:'سوق',sunrise:'شروق',farmers:'مزارعون',vegetables:'خضار',cheese:'جبن',honey:'عسل',fresh:'طازج',bread:'خبز',olives:'زيتون',region:'منطقة',stall:'كشك',lines:'صفوف',patience:'صبر',weigh:'يزن',money:'نقود',flute:'ناي',fountain:'نافورة',sticky:'لزجة',tourist:'سائح',offered:'عرض',gentle:'لطيف',shared:'تقاسم',lunch:'غداء',trees:'أشجار',fisherman:'صياد',whale:'حوت',caught:'اصطاد',trade:'تجارة',heart:'قلب',beating:'ينبض'};

const STORIES = [
{id:'rainy', title:'A Rainy Day', titleAr:'يوم ممطر', level:'A2',
 sentences:[
  {en:'It was raining heavily when Sara left her house.',ar:'كانت تمطر بغزارة حين غادرت سارة بيتها.'},
  {en:'She forgot her umbrella on the kitchen table.',ar:'نسيت مظلتها على طاولة المطبخ.'},
  {en:'The bus was late again, and everyone looked tired.',ar:'تأخر الباص مجدداً وبدت على الجميع ملامح التعب.'},
  {en:'Sara watched the rain through the window.',ar:'راقبت سارة المطر من النافذة.'},
  {en:'Suddenly, an old man sat next to her and smiled.',ar:'فجأة جلس رجل عجوز بجانبها وابتسم.'},
  {en:'"You look like my daughter," he said kindly.',ar:'قال بلطف: «تشبهين ابنتي».'},
  {en:'He told her about his garden and his three cats.',ar:'أخبرها عن حديقته وقططه الثلاثة.'},
  {en:'Sara laughed for the first time that week.',ar:'ضحكت سارة لأول مرة ذلك الأسبوع.'},
  {en:'When the bus stopped, the rain had stopped too.',ar:'حين توقف الباص كان المطر قد توقف أيضاً.'},
  {en:'The old man gave her his umbrella.',ar:'أعطاها الرجل العجوز مظلته.'},
  {en:'"Keep it," he said. "Rain will come again."',ar:'قال: «احتفظي بها، فالمطر سيعود».'},
  {en:'Sara walked to work feeling strangely happy.',ar:'مشت سارة إلى عملها تشعر بسعادة غريبة.'},
  {en:'That evening, she bought a yellow notebook.',ar:'اشترت مساءً دفتراً أصفر.'},
  {en:'She wrote about the old man on the first page.',ar:'كتبت عن الرجل العجوز في الصفحة الأولى.'},
  {en:'It was the beginning of her diary.',ar:'كانت بداية مذكراتها.'},
  {en:'Every day after that, she wrote a little more.',ar:'وفي كل يوم بعد ذلك كتبت أكثر قليلاً.'},
  {en:'She keeps the umbrella by the door now.',ar:'تحتفظ بالمظلة قرب الباب الآن.'},
  {en:'Sometimes she still thinks of his kind voice.',ar:'أحياناً ما زالت تتذكر صوته اللطيف.'},
  {en:'And on rainy days, she writes twice as much.',ar:'وفي الأيام الممطرة تكتب ضعف المعتاد.'},
  {en:'The rain had given her a new habit.',ar:'المطر وهبها عادة جديدة.'}],
 quiz:[{q:'سارة تذكّرت أن تأخذ مظلتها.',a:false},{q:'الرجل العجوز أعطى سارة مظلته.',a:true},{q:'سارة بدأت كتابة مذكرات.',a:true}]},
{id:'cat', title:'The Lost Cat', titleAr:'القط التائه', level:'A2',
 sentences:[
  {en:"Milo's cat ran away on Tuesday morning.",ar:'هرب قط ميلو صباح الثلاثاء.'},
  {en:'She looked everywhere: under cars, behind trees, in gardens.',ar:'بحثت في كل مكان: تحت السيارات وخلف الأشجار وفي الحدائق.'},
  {en:'The neighbors helped her put up posters.',ar:'ساعدها الجيران في لصق الملصقات.'},
  {en:'Three days passed and there was no sign of him.',ar:'مرت ثلاثة أيام ولا أثر له.'},
  {en:'Milo cried quietly at night.',ar:'بكت ميلو بهدوء في الليل.'},
  {en:'On Friday, she heard a small cry from the old bakery.',ar:'يوم الجمعة سمعت مواءً ضعيفاً من المخبز القديم.'},
  {en:'The bakery had closed two years ago.',ar:'كان المخبز مغلقاً منذ سنتين.'},
  {en:'The door was locked, but a window was open.',ar:'كان الباب موصداً لكن نافذة كانت مفتوحة.'},
  {en:'Milo climbed through it carefully.',ar:'تسلّلت ميلو منها بحذر.'},
  {en:'Inside, she found her cat with three kittens.',ar:'في الداخل وجدت قطتها مع ثلاث قطط صغيرة.'},
  {en:'He was not lost; he had become a father.',ar:'لم يكن تائهاً — صار أباً.'},
  {en:'The baker, who still owned the shop, laughed when he heard.',ar:'ضحك الخبّاز الذي ما زال يملك المتجر حين سمع الخبر.'},
  {en:'He gave Milo a box for the kittens.',ar:'أعطى ميلو صندوقاً للقطط الصغيرة.'},
  {en:'She carried them home one by one.',ar:'حملتهم إلى البيت واحداً واحداً.'},
  {en:"Now the cat sleeps on Milo's bed every night.",ar:'الآن ينام القط على سرير ميلو كل ليلة.'},
  {en:'The posters had said "Lost Cat" with Milo\'s phone number.',ar:'كانت الملصقات تقول «قط تائه» ورقم هاتف ميلو.'},
  {en:'She took a photo of them all together.',ar:'التقطت لهم صورة جماعية.'},
  {en:'Milo visits the kittens on weekends.',ar:'تزور ميلو القطط الصغيرة في العطلات.'},
  {en:'The kittens live with the neighbors.',ar:'والقطط الصغيرة تعيش عند الجيران.'},
  {en:'It was a strange week, but it ended well.',ar:'كان أسبوعاً غريباً لكنه انتهى نهاية حسنة.'}],
 quiz:[{q:'وُجد القط في مخبز يعمل.',a:false},{q:'صار للقط قطط صغيرة.',a:true},{q:'بقيت القطط الصغيرة عند ميلو.',a:false}]},
{id:'job', title:'A New Job', titleAr:'وظيفة جديدة', level:'A2',
 sentences:[
  {en:'Omar started his new job at a small bookstore.',ar:'بدأ عمر عمله الجديد في مكتبة صغيرة.'},
  {en:'The shop was old, and the wooden floors made noise.',ar:'كان المتجر قديماً وأرضيته الخشبية تصرّ.'},
  {en:'His boss, Mrs Lane, was strict but fair.',ar:'كانت مديرته السيدة لين صارمة لكنها عادلة.'},
  {en:'"Books are patient teachers," she told him.',ar:'قالت له: «الكتب معلمون صبورون».'},
  {en:'On his first day, he dropped a whole shelf.',ar:'في يومه الأول أسقط رفاً كاملاً.'},
  {en:'He felt terrible, but Mrs Lane just smiled.',ar:'شعر بالأسى لكن السيدة لين اكتفت بالابتسام.'},
  {en:'"Clean it up and learn," she said.',ar:'قالت: «رتّبه وتعلّم».'},
  {en:'After one month, Omar knew every corner of the shop.',ar:'بعد شهر عرف عمر كل زاوية في المتجر.'},
  {en:'He learned which books customers loved.',ar:'تعلّم أي الكتب يحب الزبائن.'},
  {en:'A little boy visited every Friday for adventure stories.',ar:'كان فتى صغير يزور كل جمعة لقصص المغامرات.'},
  {en:'Omar saved the best ones for him.',ar:'كان عمر يحتفظ له بأفضلها.'},
  {en:'One rainy afternoon, Mrs Lane gave him a key.',ar:'ذات عصر ممطر أعطته السيدة لين مفتاحاً.'},
  {en:'"The shop is yours on Sundays," she said.',ar:'قالت: «المتجر لك أيام الأحد».'},
  {en:'Omar felt proud for the first time in years.',ar:'شعر عمر بالفخر لأول مرة منذ سنوات.'},
  {en:'He opened early and made tea for the customers.',ar:'فتح باكراً وصنع الشاي للزبائن.'},
  {en:'The little boy brought his sister.',ar:'جاء الفتى الصغير بأخته.'},
  {en:'He learned to love the smell of old paper.',ar:'تعلّم أن يحب رائحة الورق القديم.'},
  {en:'The bell above the door rang all day.',ar:'كان الجرس فوق الباب يرن طوال اليوم.'},
  {en:'Omar never forgot that first broken shelf.',ar:'لم ينسَ عمر أبداً ذلك الرف الأول المكسور.'},
  {en:'That day, the shop was full of quiet readers.',ar:'في ذلك اليوم امتلأ المتجر بقرّاء هادئين.'}],
 quiz:[{q:'كسر عمر نافذة في يومه الأول.',a:false},{q:'السيدة لين أعطت عمر مفتاحاً.',a:true},{q:'كان المتجر فارغاً يوم الأحد.',a:false}]},
{id:'light', title:'The Old Lighthouse', titleAr:'المنار العتيق', level:'B1',
 sentences:[
  {en:'The lighthouse stood on a rock above the sea for a hundred years.',ar:'وقف المنار على صخرة فوق البحر منذ مئة عام.'},
  {en:'Nobody visited it anymore, because ships had computers now.',ar:'لم يعد أحد يزوره لأن السفن صارت تملك حواسيب.'},
  {en:'Tom was the last keeper, and he refused to leave.',ar:'كان توم آخر حارس ورفض المغادرة.'},
  {en:'Every morning he climbed the stairs and cleaned the great lamp.',ar:'كل صباح صعد الدرج ونظّف المصباح العظيم.'},
  {en:'He painted the walls white and repaired the broken door.',ar:'طلّى الجدران بيضاء وأصلح الباب المكسور.'},
  {en:'The village people called him stubborn and lonely.',ar:'وصفه أهل القرية بالعنيد والوحيد.'},
  {en:'But Tom knew something they had forgotten.',ar:'لكن توم عرف ما نسوه.'},
  {en:'One winter night, a storm covered the whole coast.',ar:'في ليلة شتوية غطّت عاصفة الساحل كله.'},
  {en:'The electricity in the village went out, and computers stopped working.',ar:'انقطع كهرباء القرية وتوقفت الحواسيب عن العمل.'},
  {en:'A fishing boat was lost between the waves.',ar:'ضاع قارب صيد بين الأمواج.'},
  {en:'Tom lit the old lamp with his own hands.',ar:'أشعل توم المصباح العتيق بيديه.'},
  {en:'The light turned slowly, cutting through the darkness.',ar:'دارت الإضاءة ببطء قاطعةً الظلام.'},
  {en:'The boat found its way home because of that light.',ar:'وجد القارب طريقه إلى الميناء بفضل تلك الإضاءة.'},
  {en:'The next morning, the whole village climbed the rock.',ar:'صباح اليوم التالي صعد أهل القرية كلهم الصخرة.'},
  {en:'They thanked Tom and promised to repair the lighthouse.',ar:'شكروا توم ووعدوا بإصلاح المنار.'},
  {en:'Now children visit every weekend to hear his stories.',ar:'والآن يزوره الأطفال كل عطلة ليسمعوا قصصه.'},
  {en:'The lamp still shines, even though the ships no longer need it.',ar:'لا يزال المصباح يضيء رغم أن السفن لم تعد تحتاجه.'},
  {en:'Some things deserve to be kept alive.',ar:'بعض الأشياء تستحق أن تبقى حية.'}],
 quiz:[{q:'السفن ما زالت تحتاج المنار.',a:false},{q:'أشعل توم المصباح أثناء العاصفة.',a:true},{q:'وعدت القرية بإصلاح المنار.',a:true}]},
{id:'letter', title:'An Unexpected Letter', titleAr:'رسالة غير متوقعة', level:'B1',
 sentences:[
  {en:'The letter arrived on a Thursday, with no stamp and no address.',ar:'وصلت الرسالة يوم خميس بلا طابع ولا عنوان.'},
  {en:'It simply said: "To the person who found my blue notebook."',ar:'كتب فيها فقط: «إلى من وجد دفتري الأزرق».'},
  {en:'Anna remembered that day at the station clearly.',ar:'تذكرت آنا ذلك اليوم في المحطة بوضوح.'},
  {en:'She had found the notebook on a bench and kept it.',ar:'وجدت الدفتر على مقعد واحتفظت به.'},
  {en:'Inside were beautiful drawings of cities she had never seen.',ar:'كانت بداخله رسومات جميلة لمدن لم ترها قط.'},
  {en:'She wrote back and left the letter at the same bench.',ar:'ردّت وتركت الرسالة على المقعد نفسه.'},
  {en:'The next day, another letter waited for her.',ar:'في اليوم التالي كانت رسالة أخرى بانتظارها.'},
  {en:'"I drew those cities while I was sick in hospital," it said.',ar:'جاء فيها: «رسمت تلك المدن وأنا مريض في المستشفى».'},
  {en:"Anna learned that the writer's name was Yusuf, an artist.",ar:'علمت آنا أن الكاتب اسمه يوسف وهو فنان.'},
  {en:'They continued writing for a whole month.',ar:'استمرا يتكاتبان شهراً كاملاً.'},
  {en:"Yusuf's letters were full of hope and humor.",ar:'كانت رسائل يوسف مليئة بالأمل والدعابة.'},
  {en:'When he left the hospital, they met at the bench.',ar:'حين غادر المستشفى التقيا عند المقعد.'},
  {en:'He was shy and carried a new red notebook.',ar:'كان خجولاً يحمل دفتراً أحمر جديداً.'},
  {en:'"This one is for our own story," he said.',ar:'قال: «هذا لقصتنا نحن».'},
  {en:'They walked together until the sun set.',ar:'مشيا معاً حتى غربت الشمس.'},
  {en:'Anna still keeps the blue notebook on her shelf.',ar:'ما زالت آنا تحتفظ بالدفتر الأزرق على رفها.'},
  {en:'Next to it now stands the red one, full of drawings of their city.',ar:'وبجانبه يقف الأحمر الآن مملوءاً برسومات لمدينتهما.'}],
 quiz:[{q:'وصلت الرسالة بطابع بريدي.',a:false},{q:'رسم يوسف المدن وهو مريض في المستشفى.',a:true},{q:'أعادت آنا الدفتر الأزرق لصاحبه.',a:false}]},
{id:'market', title:'The Village Market', titleAr:'سوق القرية', level:'B1',
 sentences:[
  {en:'Every Saturday, the small village woke before sunrise.',ar:'كل سبت استيقظت القرية الصغيرة قبل شروق الشمس.'},
  {en:'Farmers brought vegetables, cheese, honey, and fresh bread.',ar:'جلب المزارعون الخضار والجبن والعسل والخبز الطازج.'},
  {en:"Layla's grandmother sold the best olives in the region.",ar:'كانت جدة ليلى تبيع أفضل زيتون في المنطقة.'},
  {en:'Her stall was small, but people waited in long lines.',ar:'كان كشكها صغيراً لكن الناس وقفوا في صفوف طويلة.'},
  {en:'"Olives need patience, like everything good," she said.',ar:'قالت: «الزيتون يحتاج صبراً ككل شيء جيد».'},
  {en:'Layla helped her weigh the olives and count the money.',ar:'ساعدت ليلى جدتها في وزن الزيتون وعدّ النقود.'},
  {en:'An old man played the flute near the fountain.',ar:'عزف رجل عجوز الناي قرب النافورة.'},
  {en:'Children ran between the stalls with sticky hands.',ar:'ركض الأطفال بين الأكشاك بأيدٍ لزجة.'},
  {en:'A tourist once offered to buy all her olives at once.',ar:'عرض سائح ذات مرة شراء زيتونها كلها دفعة واحدة.'},
  {en:'Grandmother refused with a gentle smile.',ar:'رفضت الجدة بابتسامة لطيفة.'},
  {en:'"Then my neighbors would have nothing," she explained.',ar:'أوضحت: «حينها لن يبقى لجيراني شيء».'},
  {en:'At noon, everyone shared lunch under the big trees.',ar:'عند الظهر تقاسم الجميع الغداء تحت الأشجار الكبيرة.'},
  {en:'The fisherman told stories about a whale he never caught.',ar:'حكى الصياد قصصاً عن حوت لم يصطده قط.'},
  {en:'Layla understood that the market was more than trade.',ar:'أدركت ليلى أن السوق أكثر من تجارة.'},
  {en:'It was the heart of the village, beating every Saturday.',ar:'كان قلب القرية ينبض كل سبت.'},
  {en:'Years later, she runs the same stall with her own daughter.',ar:'بعد سنوات تدير الكشك نفسه مع ابنتها.'},
  {en:'The flute player is gone, but someone still plays on Saturdays.',ar:'رحل عازف الناي لكن أحدهم ما زال يعزف أيام السبت.'}],
 quiz:[{q:'يفتح السوق أيام الأحد.',a:false},{q:'باعت الجدة كل زيتونها للسائح.',a:false},{q:'تدير ليلى الآن الكشك نفسه.',a:true}]}
];

function loadStory(){ try{ return JSON.parse(localStorage.getItem(STORY_LS)||'{}'); }catch(e){ return {}; } }
function saveStory(s){ localStorage.setItem(STORY_LS, JSON.stringify(s)); }
function ttsOn(){ try{ return speechSynthesis.getVoices().some(v=>/^en([-_]|$)/i.test(v.lang)); }catch(e){ return false; } }
function speak(t){ try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.9; speechSynthesis.speak(u); }catch(e){} }
function toastMsg(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),1800); }

/* ---------- المنتقي ---------- */
function viewPick(){
  const res = loadStory();
  const cards = STORIES.map(st=>{
    const wc = st.sentences.reduce((n,s)=>n+s.en.split(/\s+/).length,0);
    const r = res[st.id];
    return `<div class="card"><div class="body">
      <div class="meta"><span class="ltag ${st.level==='B1'?'':'ms'}">${st.level}</span></div>
      <h3>${esc(st.title)} <span style="color:var(--muted);font-size:13px">— ${esc(st.titleAr)}</span></h3>
      <div class="meta"><span>${st.sentences.length} جملة</span><span>~${wc} كلمة</span>${r?`<span>أفضل نتيجة: ${r.best}/${r.total}</span>`:''}</div>
      <button class="btn" style="margin-top:8px" onclick="openStory('${st.id}')">${r?'أعد القراءة':'اقرأ'} ←</button>
    </div></div>`;
  }).join('');
  app.innerHTML = `<div class="head"><h2>القصص المتدرّجة</h2><span class="rstreak">${STORIES.length} قصص · A2–B1</span></div>
  <div class="grid">${cards}</div>`;
}

/* ---------- القارئ ---------- */
let cur = null, idx = 0, showAr = false;
function openStory(id){ cur = STORIES.find(s=>s.id===id); idx = 0; showAr = false; drawSent(); }
function drawSent(){
  const s = cur.sentences[idx], tot = cur.sentences.length;
  const spans = s.en.split(/\s+/).map(w=>`<span class="w" onclick="wordClick(this)" data-w="${esc(w)}">${esc(w)}</span>`).join(' ');
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>${esc(cur.titleAr)} — ${esc(cur.title)}</h2><span style="color:var(--muted)">جملة ${idx+1}/${tot} · ${cur.level}</span></div>
  <div class="q">
    <div class="en" dir="ltr" style="font-size:20px;line-height:1.9;text-align:left;margin:12px 0">${spans}</div>
    <div style="color:var(--gold-soft);min-height:26px;margin-bottom:8px">${showAr? esc(s.ar):''}</div>
    <div id="whint" style="color:var(--muted);font-size:13px;min-height:20px;margin-bottom:8px"></div>
    <div class="grades">
      ${ttsOn()? `<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="speak(cur.sentences[idx].en)">🔊 استمع</button>`:''}
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="showAr=!showAr;drawSent()">${showAr?'إخفاء الترجمة':'الترجمة'}</button>
    </div>
    <div class="grades" style="margin-top:12px">
      ${idx>0? `<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="idx--;showAr=false;drawSent()">السابقة</button>`:''}
      ${idx<tot-1? `<button class="btn" onclick="idx++;showAr=false;drawSent()">التالية ←</button>`
        : `<button class="btn" onclick="viewQuiz()">أسئلة الفهم ←</button>`}
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewPick()">القصص ←</button>
    </div>
  </div></div>`;
}
function wordClick(el){
  const w = el.dataset.w, tok = normTok(w);
  if(!tok) return;
  const ar = DICT[tok] || '؟';
  const bank = loadBank();
  if(!bank[tok]){
    bank[tok] = {en:w, ar, clip:'story:'+cur.id, box:1, due:Date.now(), seen:0, ok:0};
    localStorage.setItem(BANK_LS, JSON.stringify(bank));
    toastMsg(`«${w}» حُفظت في البنك`);
  }
  el.classList.add('saved');
  document.getElementById('whint').innerHTML = `<b class="ltr">${esc(w)}</b> = ${esc(ar)}${ar==='؟'?' (ليست في القاموس — عدّلها من بنك الكلمات)':''}`;
}

/* ---------- أسئلة الفهم ---------- */
let qi = 0, qScore = 0;
function viewQuiz(){ qi = 0; qScore = 0; drawQuiz(); }
function drawQuiz(){
  const q = cur.quiz[qi];
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>فهم المقروء — ${esc(cur.titleAr)}</h2><span style="color:var(--muted)">سؤال ${qi+1}/${cur.quiz.length}</span></div>
  <div class="q" style="text-align:center">
    <div style="font-size:18px;margin:16px 0">${esc(q.q)}</div>
    <div class="grades">
      <button class="btn" onclick="ansQuiz(true)">صح ✓</button>
      <button class="btn" onclick="ansQuiz(false)">خطأ ✗</button>
    </div>
    <div id="qres" style="margin-top:10px"></div>
  </div></div>`;
}
function ansQuiz(a){
  const q = cur.quiz[qi];
  const ok = a === q.a;
  if(ok) qScore++;
  $('#qres').innerHTML = `<span style="color:${ok?'var(--ok)':'var(--bad)'}">${ok?'صحيح':'خطأ — الجواب: '+(q.a?'صح':'خطأ')}</span>`;
  setTimeout(()=>{
    qi++;
    if(qi < cur.quiz.length) drawQuiz();
    else endStory();
  }, 700);
}
function endStory(){
  const res = loadStory();
  const prev = res[cur.id];
  res[cur.id] = {score:qScore, total:cur.quiz.length, best:Math.max(qScore, prev?.best||0), ts:Date.now()};
  saveStory(res);
  app.innerHTML = `<div class="quiz"><div class="score">أنهيت «${esc(cur.titleAr)}» — فهم: ${qScore}/${cur.quiz.length}</div>
  <div class="empty" style="text-align:center">
    <button class="btn" onclick="openStory('${cur.id}')">أعد القراءة ←</button>
    <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewPick()">قصة أخرى ←</button>
  </div></div>`;
}

viewPick();
