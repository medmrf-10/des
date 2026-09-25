// محتوى المنصة: مقاطع قصيرة + جمل مترجمة كلمة-بكلمة.
// id يوتيوب موثّق، dur بالثواني، kind: vocab (درس مفردات) | listen (تمرين استماع)
const CLIPS = [
  {
    id: 'N9B59PHIFbA', title: "Make & Do — English In A Minute", dur: 45, kind: 'vocab',
    sentences: [
      { text: "Did you make a mistake?", words: [["Did","هل (ماضٍ للسؤال)"],["you","أنتَ"],["make","تصنع/ترتكب"],["a",""],["mistake","خطأ"]] },
      { text: "I do my homework every day.", words: [["I","أنا"],["do","أفعل/أنجز"],["my","الخاص بي"],["homework","الواجب"],["every","كل"],["day","يوم"]] },
      { text: "We made a decision together.", words: [["We","نحن"],["made","اتخذنا"],["a",""],["decision","قرار"],["together","معاً"]] }
    ]
  },
  {
    id: 'uLoZ0OfxXfc', title: "5 uses of 'get' — English In A Minute", dur: 54, kind: 'vocab',
    sentences: [
      { text: "I get up at six.", words: [["I","أنا"],["get","أستيقظ/أحصل"],["up","(مع get: قيام)"],["at","الساعة"],["six","السادسة"]] },
      { text: "She got a present yesterday.", words: [["She","هي"],["got","حصلت على"],["a",""],["present","هدية"],["yesterday","أمس"]] },
      { text: "We get home late.", words: [["We","نحن"],["get","نصل إلى"],["home","البيت"],["late","متأخرين"]] }
    ]
  },
  {
    id: 'B-zN3MbwFTg', title: "Journey and Trip — English In A Minute", dur: 66, kind: 'vocab',
    sentences: [
      { text: "The journey took three days.", words: [["The",""],["journey","الرحلة الطويلة"],["took","استغرقت"],["three","ثلاثة"],["days","أيام"]] },
      { text: "He is on a business trip.", words: [["He","هو"],["is","يكون"],["on","في"],["a",""],["business","عمل"],["trip","رحلة قصيرة"]] },
      { text: "How was your trip to London?", words: [["How","كيف"],["was","كانت"],["your","ـك"],["trip","رحلتك"],["to","إلى"],["London","لندن"]] }
    ]
  },
  {
    id: 'uKQknI9EdrM', title: "'like' or 'as'? — English In A Minute", dur: 61, kind: 'vocab',
    sentences: [
      { text: "She works as a doctor.", words: [["She","هي"],["works","تعمل"],["as","بصفتها/كـ"],["a",""],["doctor","طبيبة"]] },
      { text: "He runs like the wind.", words: [["He","هو"],["runs","يجري"],["like","مثل"],["the",""],["wind","الريح"]] },
      { text: "Use it as a table.", words: [["Use","استعمل"],["it","ـه"],["as","كـ"],["a",""],["table","طاولة"]] }
    ]
  },
  {
    id: '7CeNTtbhYLs', title: "Pronunciation of 'th' — English In A Minute", dur: 62, kind: 'vocab',
    sentences: [
      { text: "I think so.", words: [["I","أنا"],["think","أظن"],["so","كذلك"]] },
      { text: "This is my brother.", words: [["This","هذا"],["is","يكون"],["my","ـي"],["brother","أخي"]] },
      { text: "Three birds sat there.", words: [["Three","ثلاثة"],["birds","طيور"],["sat","جلس"],["there","هناك"]] }
    ]
  },
  {
    id: 'tFpBnKI3w4w', title: "4 slang words — English In A Minute", dur: 57, kind: 'vocab',
    sentences: [
      { text: "Cheers, mate!", words: [["Cheers","شكراً/بصحتك (عامية)"],["mate","صاحبي (عامية)"]] },
      { text: "That film was brilliant!", words: [["That","ذلك"],["film","الفيلم"],["was","كان"],["brilliant","رائعاً (عامية)"]] },
      { text: "Your jacket looks cool.", words: [["Your","ـك"],["jacket","سترة"],["looks","تبدو"],["cool","جميلة/أنيقة (عامية)"]] }
    ]
  },
  {
    id: 'EXS3IcMbzXI', title: "The Schwa — English In A Minute", dur: 62, kind: 'vocab',
    sentences: [
      { text: "The banana is yellow.", words: [["The",""],["banana","الموز (تُنطق بِـنانَا بالشْوا)"],["is","يكون"],["yellow","أصفر"]] },
      { text: "My teacher is kind.", words: [["My","ـي"],["teacher","معلّم"],["is","يكون"],["kind","لطيف"]] },
      { text: "What is it about?", words: [["What","ما"],["is","يكون"],["it","ـه"],["about","عن (الشْوا في بدايته)"]] }
    ]
  },
  {
    id: 'LDkvRFCm8No', title: "How can I speak English more fluently? — BBC", dur: 201, kind: 'listen',
    sentences: [
      { text: "I want to speak fluently.", words: [["I","أنا"],["want","أريد"],["to","أن"],["speak","أتحدث"],["fluently","بطلاقة"]] },
      { text: "Practice every single day.", words: [["Practice","تدرّب"],["every","كل"],["single",""],["day","يوم"]] },
      { text: "Don't be afraid of mistakes.", words: [["Don't","لا"],["be","تكن"],["afraid","خائفاً"],["of","من"],["mistakes","الأخطاء"]] }
    ]
  },
  {
    id: '_5x_h23rXWE', title: "Talking about lunch — Real Easy English", dur: 343, kind: 'listen',
    sentences: [
      { text: "We have lunch at noon.", words: [["We","نحن"],["have","نتناول"],["lunch","الغداء"],["at","الساعة"],["noon","الظهر"]] },
      { text: "Are you hungry?", words: [["Are","هل"],["you","أنت"],["hungry","جائع"]] },
      { text: "I usually eat a sandwich.", words: [["I","أنا"],["usually","عادة"],["eat","آكل"],["a",""],["sandwich","ساندويتش"]] }
    ]
  },
  {
    id: '9PXluC2FMD0', title: "Do you forget words when you speak English?", dur: 278, kind: 'listen',
    sentences: [
      { text: "Don't worry if you forget.", words: [["Don't","لا"],["worry","تقلق"],["if","إذا"],["you","أنت"],["forget","تنسى"]] },
      { text: "Keep talking and smile.", words: [["Keep","واصل"],["talking","التحدث"],["and","و"],["smile","ابتسم"]] },
      { text: "Use a simpler word instead.", words: [["Use","استعمل"],["a",""],["simpler","أبسط"],["word","كلمة"],["instead","بدلاً منها"]] }
    ]
  }
];

// بنك الكلمات المبدئي (يُستورد تلقائياً عند أول تشغيل) — en/ar/clip
const SEED_WORDS = [
  ["make","يصنع / يرتكب","N9B59PHIFbA"],["mistake","خطأ","N9B59PHIFbA"],["decision","قرار","N9B59PHIFbA"],
  ["do","يفعل / ينجز","N9B59PHIFbA"],["homework","الواجب","N9B59PHIFbA"],["together","معاً","N9B59PHIFbA"],
  ["get","يحصل / يصل / يستيقظ","uLoZ0OfxXfc"],["present","هدية","uLoZ0OfxXfc"],["yesterday","أمس","uLoZ0OfxXfc"],["late","متأخر","uLoZ0OfxXfc"],
  ["journey","رحلة طويلة","B-zN3MbwFTg"],["trip","رحلة قصيرة","B-zN3MbwFTg"],["business","عمل/تجارة","B-zN3MbwFTg"],
  ["as","بصفة / كـ","uKQknI9EdrM"],["like","مثل","uKQknI9EdrM"],["doctor","طبيب","uKQknI9EdrM"],["wind","ريح","uKQknI9EdrM"],
  ["think","يظن/يفكر","7CeNTtbhYLs"],["brother","أخ","7CeNTtbhYLs"],["three","ثلاثة","7CeNTtbhYLs"],["birds","طيور","7CeNTtbhYLs"],
  ["cheers","شكراً/بصحتك (عامية)","tFpBnKI3w4w"],["mate","صاحب (عامية)","tFpBnKI3w4w"],["brilliant","رائع (عامية)","tFpBnKI3w4w"],["cool","جميل (عامية)","tFpBnKI3w4w"],
  ["banana","موز","EXS3IcMbzXI"],["teacher","معلّم","EXS3IcMbzXI"],["kind","لطيف","EXS3IcMbzXI"],["about","عن/حول","EXS3IcMbzXI"],
  ["fluently","بطلاقة","LDkvRFCm8No"],["practice","تدريب/يتدرّب","LDkvRFCm8No"],["afraid","خائف","LDkvRFCm8No"],
  ["lunch","غداء","_5x_h23rXWE"],["noon","الظهر","_5x_h23rXWE"],["hungry","جائع","_5x_h23rXWE"],["sandwich","ساندويتش","_5x_h23rXWE"],["usually","عادة","_5x_h23rXWE"],
  ["worry","قلق/يقلق","9PXluC2FMD0"],["forget","ينسى","9PXluC2FMD0"],["smile","يبتسم","9PXluC2FMD0"],["simpler","أبسط","9PXluC2FMD0"],["instead","بدلاً","9PXluC2FMD0"],["word","كلمة","9PXluC2FMD0"]
];

// أسئلة اختبار الاستماع: جملة فيها فراغ + خيارات (الصحيح index 0 يُخلط عند العرض)
const LISTEN_QUIZ = [
  { clip: 'LDkvRFCm8No', text: 'I want to speak ___.', answer: 'fluently', options: ['fluently','slowly','loudly','quietly'], ar: 'أريد أن أتحدث بطلاقة' },
  { clip: 'LDkvRFCm8No', text: "Don't be afraid of ___.", answer: 'mistakes', options: ['mistakes','people','books','teachers'], ar: 'لا تخف من الأخطاء' },
  { clip: '_5x_h23rXWE', text: 'We have ___ at noon.', answer: 'lunch', options: ['lunch','dinner','breakfast','coffee'], ar: 'نتناول الغداء في الظهر' },
  { clip: '_5x_h23rXWE', text: 'I usually eat a ___.', answer: 'sandwich', options: ['sandwich','salad','soup','pizza'], ar: 'عادة آكل ساندويتش' },
  { clip: '9PXluC2FMD0', text: "Don't ___ if you forget.", answer: 'worry', options: ['worry','stop','run','hide'], ar: 'لا تقلق إن نسيت' },
  { clip: '9PXluC2FMD0', text: 'Keep talking and ___.', answer: 'smile', options: ['smile','sleep','write','cry'], ar: 'واصل التحدث وابتسم' },
  { clip: 'N9B59PHIFbA', text: 'Did you make a ___?', answer: 'mistake', options: ['mistake','journey','present','decision'], ar: 'هل ارتكبت خطأ؟' },
  { clip: 'uLoZ0OfxXfc', text: 'She got a ___ yesterday.', answer: 'present', options: ['present','trip','sandwich','wind'], ar: 'حصلت على هدية أمس' }
];

/* ===== مكتبة المحتوى المتدرج (أسبوعا تعرض مكثف) =====
   type: story | dialogue | phrases
   level: beginner | intermediate | advanced
   topic: وسم موضوعي */
const LEVELS = ['beginner','intermediate','advanced'];
const TOPICS = ['الروتين','طعام','سفر','عمل','تسوق','صحة','تواصل','عائلة','تقنية','دراسة'];
const LEVEL_AR = {beginner:'مبتدئ', intermediate:'متوسط', advanced:'متقدم'};
const TYPE_AR = {story:'قصة', dialogue:'حوار', phrases:'عبارات'};

const CONTENT = [
{ id:'st1', type:'story', level:'beginner', topic:'الروتين', title:'My Morning', lines:[
  {en:'I wake up at seven.', ar:'أستيقظ في السابعة.'},
  {en:'I brush my teeth and wash my face.', ar:'أفرش أسناني وأغسل وجهي.'},
  {en:'Then I make a cup of coffee.', ar:'ثم أعدّ فنجان قهوة.'},
  {en:'I eat bread and cheese for breakfast.', ar:'آكل الخبز والجبن على الفطور.'},
  {en:'At eight I leave the house.', ar:'في الثامنة أغادر البيت.'},
  {en:'I walk to the bus stop.', ar:'أمشي إلى موقف الحافلة.'},
  {en:'The bus is often late.', ar:'الحافلة تتأخر غالباً.'},
  {en:'I read a book on the bus.', ar:'أقرأ كتاباً في الحافلة.'}
]},
{ id:'st2', type:'story', level:'beginner', topic:'عائلة', title:'A Small Cat', lines:[
  {en:'Sara has a small cat.', ar:'سارة لديها قطة صغيرة.'},
  {en:'The cat is white and very soft.', ar:'القطة بيضاء وناعمة جداً.'},
  {en:'Every day the cat sleeps a lot.', ar:'كل يوم تنام القطة كثيراً.'},
  {en:'It wakes up when it is hungry.', ar:'تستيقظ عندما تجوع.'},
  {en:'Sara gives it milk and fish.', ar:'سارة تعطيها الحليب والسمك.'},
  {en:'The cat plays with a red ball.', ar:'القطة تلعب بكرة حمراء.'},
  {en:'At night it sleeps on Sara\'s bed.', ar:'في الليل تنام على سرير سارة.'}
]},
{ id:'st3', type:'story', level:'beginner', topic:'تسوق', title:'At the Market', lines:[
  {en:'On Friday I go to the market.', ar:'يوم الجمعة أذهب إلى السوق.'},
  {en:'The market is big and crowded.', ar:'السوق كبير ومزدحم.'},
  {en:'I buy apples, tomatoes and bread.', ar:'أشتري تفاحاً وطماطم وخبزاً.'},
  {en:'The apples are cheap today.', ar:'التفاح رخيص اليوم.'},
  {en:'I pay the man ten dirhams.', ar:'أدفع للرجل عشرة دراهم.'},
  {en:'He gives me a bag for free.', ar:'يعطيني كيساً مجاناً.'},
  {en:'Then I walk home slowly.', ar:'ثم أمشي إلى البيت متمهلاً.'}
]},
{ id:'st4', type:'story', level:'intermediate', topic:'عمل', title:'The Lost Wallet', lines:[
  {en:'Omar found a wallet on the train.', ar:'وجد عمر محفظة في القطار.'},
  {en:'It was full of money and cards.', ar:'كانت مليئة بالمال والبطاقات.'},
  {en:'He looked inside for a name.', ar:'بحث فيها عن اسم.'},
  {en:'There was a photo of an old man.', ar:'كان فيها صورة لرجل عجوز.'},
  {en:'Omar took the wallet to the police.', ar:'أخذ عمر المحفظة إلى الشرطة.'},
  {en:'The next day the owner called him.', ar:'في اليوم التالي اتصل به صاحبها.'},
  {en:'He thanked Omar and gave him a gift.', ar:'شكر عمر وأهداه هدية.'},
  {en:'Honesty is its own reward.', ar:'الأمانة مكافأة بحد ذاتها.'}
]},
{ id:'st5', type:'story', level:'intermediate', topic:'عمل', title:'A New Job', lines:[
  {en:'Laila started her new job on Monday.', ar:'بدأت ليلى عملها الجديد يوم الاثنين.'},
  {en:'Her office was on the third floor.', ar:'كان مكتبها في الطابق الثالث.'},
  {en:'Her colleagues welcomed her warmly.', ar:'رحّب بها زملاؤها بحفاوة.'},
  {en:'She learned the work in two weeks.', ar:'تعلمت العمل في أسبوعين.'},
  {en:'At first she made many mistakes.', ar:'في البداية أخطأت كثيراً.'},
  {en:'Her manager was patient and kind.', ar:'كان مديرها صبوراً ولطيفاً.'},
  {en:'Now she trains the new people herself.', ar:'الآن هي من يدرّب الموظفين الجدد.'}
]},
{ id:'st6', type:'story', level:'advanced', topic:'تقنية', title:'The Letter', lines:[
  {en:'The old man opened the dusty drawer.', ar:'فتح الرجل العجوز الدرج المغبر.'},
  {en:'Inside lay a letter he had never sent.', ar:'بداخله كانت رسالة لم يرسلها قط.'},
  {en:'He had written it forty years earlier.', ar:'كتبها قبل أربعين عاماً.'},
  {en:'It was addressed to his brother in Beirut.', ar:'كانت موجهة إلى أخيه في بيروت.'},
  {en:'They had quarreled and never spoken again.', ar:'تشاجرا ولم يتحدثا ثانية أبداً.'},
  {en:'His hands trembled as he read the first line.', ar:'ارتعشت يداه وهو يقرأ السطر الأول.'},
  {en:'"Dear brother, forgive me," it began.', ar:'"أخي العزيز، سامحني" — هكذا بدأت.'},
  {en:'He folded it carefully and made a decision.', ar:'طواها بعناية واتخذ قراراً.'},
  {en:'Some words must be said, even late.', ar:'بعض الكلمات يجب أن تقال ولو متأخرة.'}
]},
{ id:'st7', type:'story', level:'advanced', topic:'سفر', title:'Two Roads', lines:[
  {en:'The path divided into two narrow roads.', ar:'انقسم الطريق إلى دربين ضيقين.'},
  {en:'One led down to the river.', ar:'أحدهما يهبط إلى النهر.'},
  {en:'The other climbed toward the cold mountains.', ar:'والآخر يصعد نحو الجبال الباردة.'},
  {en:'The traveler stood still for a long time.', ar:'وقف المسافر ساكناً طويلاً.'},
  {en:'He knew both roads ended at the sea.', ar:'كان يعلم أن كلا الدربين ينتهيان عند البحر.'},
  {en:'Yet the choice still mattered to him.', ar:'ومع ذلك كان الاختيار يعنيه.'},
  {en:'He chose the mountain road without regret.', ar:'اختار درب الجبل بلا ندم.'},
  {en:'It is the walking, not the arriving, that shapes us.', ar:'السير لا الوصول هو ما يصيغنا.'}
]},
{ id:'dg1', type:'dialogue', level:'beginner', topic:'طعام', title:'At the Coffee Shop', lines:[
  {en:'Good morning! What can I get you?', ar:'صباح الخير! ماذا أحضر لك؟'},
  {en:'A small coffee, please.', ar:'قهوة صغيرة من فضلك.'},
  {en:'With milk or without?', ar:'بالحليب أم بدون؟'},
  {en:'With a little milk, please.', ar:'بقليل من الحليب من فضلك.'},
  {en:'Anything to eat with it?', ar:'شيء تأكله معها؟'},
  {en:'Yes, one croissant, please.', ar:'نعم، كرواسون واحد من فضلك.'},
  {en:'That will be six dirhams.', ar:'ذلك ستة دراهم.'},
  {en:'Here you are. Thank you!', ar:'تفضل. شكراً!'},
  {en:'You are welcome. Enjoy your day!', ar:'عفواً. يوماً سعيداً!'}
]},
{ id:'dg2', type:'dialogue', level:'beginner', topic:'سفر', title:'Asking for Directions', lines:[
  {en:'Excuse me, where is the museum?', ar:'عفواً، أين المتحف؟'},
  {en:'Go straight down this street.', ar:'سر مباشرة في هذا الشارع.'},
  {en:'Then turn left at the bank.', ar:'ثم انعطف يساراً عند البنك.'},
  {en:'Is it far from here?', ar:'هل هو بعيد من هنا؟'},
  {en:'About ten minutes on foot.', ar:'حوالي عشر دقائق مشياً.'},
  {en:'Can I go there by bus?', ar:'هل أستطيع الذهاب إليه بالحافلة؟'},
  {en:'Yes, take bus number twelve.', ar:'نعم، خذ الحافلة رقم اثني عشر.'},
  {en:'Thank you very much!', ar:'شكراً جزيلاً!'},
  {en:'Not at all.', ar:'لا شكر على واجب.'}
]},
{ id:'dg3', type:'dialogue', level:'intermediate', topic:'صحة', title:'At the Doctor', lines:[
  {en:'What seems to be the problem today?', ar:'ما المشكلة اليوم على ما يبدو؟'},
  {en:'I have had a headache for three days.', ar:'أعاني من صداع منذ ثلاثة أيام.'},
  {en:'Do you feel dizzy or tired as well?', ar:'هل تشعر بدوار أو تعب أيضاً؟'},
  {en:'A little tired, but not dizzy.', ar:'تعب قليل، لكن بلا دوار.'},
  {en:'Are you sleeping well at night?', ar:'هل تنام جيداً في الليل؟'},
  {en:'Not really. I sleep very late.', ar:'ليس حقاً. أنام متأخراً جداً.'},
  {en:'Try to sleep earlier and drink more water.', ar:'حاول النوم مبكراً واشرب ماء أكثر.'},
  {en:'I will also give you a mild painkiller.', ar:'سأعطيك أيضاً مسكناً خفيفاً.'},
  {en:'Thank you, doctor.', ar:'شكراً يا دكتور.'}
]},
{ id:'dg4', type:'dialogue', level:'intermediate', topic:'تواصل', title:'A Phone Call', lines:[
  {en:'Hello, may I speak to Mr. Haddad?', ar:'مرحباً، هل يمكنني التحدث مع السيد حداد؟'},
  {en:'Speaking. Who is calling, please?', ar:'معك هو. من المتصل من فضلك؟'},
  {en:'This is Karim from the bank.', ar:'أنا كريم من البنك.'},
  {en:'Oh, hello Karim. How can I help you?', ar:'آه مرحباً كريم، كيف أساعدك؟'},
  {en:'Your papers are ready for signing.', ar:'أوراقك جاهزة للتوقيع.'},
  {en:'When can I come to the office?', ar:'متى أستطيع الحضور إلى المكتب؟'},
  {en:'Any time tomorrow before five.', ar:'أي وقت غداً قبل الخامسة.'},
  {en:'Perfect. See you tomorrow then.', ar:'ممتاز. أراك غداً إذن.'},
  {en:'Goodbye, and have a nice evening.', ar:'وداعاً، ومساء سعيد.'}
]},
{ id:'dg5', type:'dialogue', level:'intermediate', topic:'تسوق', title:'Shopping for Clothes', lines:[
  {en:'Can I help you find something?', ar:'هل أساعدك في إيجاد شيء؟'},
  {en:'I am looking for a winter jacket.', ar:'أبحث عن سترة شتوية.'},
  {en:'What size do you wear?', ar:'ما المقاس الذي تلبسه؟'},
  {en:'Medium, I think.', ar:'وسط على الأرجح.'},
  {en:'Try this one. It is on sale today.', ar:'جرّب هذه. إنها في التخفيض اليوم.'},
  {en:'How much is it after the discount?', ar:'كم سعرها بعد التخفيض؟'},
  {en:'Two hundred dirhams instead of three.', ar:'مئتا درهم بدل ثلاثمائة.'},
  {en:'I will take it. Do you accept cards?', ar:'سآخذها. هل تقبلون البطاقات؟'},
  {en:'Of course. The till is over there.', ar:'طبعاً. الصندوق هناك.'}
]},
{ id:'dg6', type:'dialogue', level:'advanced', topic:'عمل', title:'A Job Interview', lines:[
  {en:'Tell me a little about yourself.', ar:'حدثني قليلاً عن نفسك.'},
  {en:'I studied engineering and worked five years in logistics.', ar:'درست الهندسة وعملت خمس سنوات في اللوجستيات.'},
  {en:'Why do you want to join our company?', ar:'لماذا تريد الانضمام لشركتنا؟'},
  {en:'Because your projects solve real problems.', ar:'لأن مشاريعكم تحل مشاكل حقيقية.'},
  {en:'What is your biggest weakness?', ar:'ما أكبر نقاط ضعفك؟'},
  {en:'I am impatient with slow decisions, but I am working on it.', ar:'أقلق مع القرارات البطيئة، لكنني أعمل على ذلك.'},
  {en:'Where do you see yourself in five years?', ar:'أين ترى نفسك بعد خمس سنوات؟'},
  {en:'Leading a team that ships products people love.', ar:'أقود فريقاً يصنع منتجات يحبها الناس.'}
]},
{ id:'dg7', type:'dialogue', level:'advanced', topic:'سفر', title:'At the Airport', lines:[
  {en:'May I see your passport and ticket?', ar:'هل أرى جوازك وتذكرتك؟'},
  {en:'Of course. Here they are.', ar:'طبعاً. تفضل.'},
  {en:'You have one bag to check in?', ar:'لديك حقيبة واحدة للشحن؟'},
  {en:'Yes, and this small backpack with me.', ar:'نعم، وهذه الحقيبة الصغيرة معي.'},
  {en:'Your flight boards at gate B twelve.', ar:'رحلتك تصعد من البوابة ب اثني عشر.'},
  {en:'How long is the layover in Doha?', ar:'كم مدة التوقف في الدوحة؟'},
  {en:'Two hours. Enough time to relax.', ar:'ساعتان. وقت كافٍ للراحة.'},
  {en:'Have a safe flight, sir.', ar:'رحلة آمنة يا سيدي.'}
]},
{ id:'ph1', type:'phrases', level:'beginner', topic:'تواصل', title:'Greetings & Small Talk', lines:[
  {en:'How are you doing today?', ar:'كيف حالك اليوم؟'},
  {en:'Not bad, thanks. And you?', ar:'لست بخير سيئ، شكراً. وأنت؟'},
  {en:'Nice to meet you.', ar:'سعيد بلقائك.'},
  {en:'The weather is lovely today.', ar:'الطقس جميل اليوم.'},
  {en:'What do you do for a living?', ar:'بماذا تعمل للرزق؟'},
  {en:'Where are you from?', ar:'من أين أنت؟'},
  {en:'It was great talking to you.', ar:'كان جميلاً الحديث معك.'},
  {en:'See you around!', ar:'أراك قريباً!'}
]},
{ id:'ph2', type:'phrases', level:'beginner', topic:'طعام', title:'Ordering Food', lines:[
  {en:'A table for two, please.', ar:'طاولة لشخصين من فضلك.'},
  {en:'Can I see the menu?', ar:'هل أرى القائمة؟'},
  {en:'What do you recommend?', ar:'بماذا تنصح؟'},
  {en:'I will have the fish.', ar:'سآخذ السمك.'},
  {en:'Without onions, please.', ar:'بدون بصل من فضلك.'},
  {en:'Could we have some water?', ar:'هل يمكننا بعض الماء؟'},
  {en:'The bill, please.', ar:'الحساب من فضلك.'},
  {en:'Keep the change.', ar:'احتفظ بالباقي.'}
]},
{ id:'ph3', type:'phrases', level:'intermediate', topic:'سفر', title:'Getting Around', lines:[
  {en:'Where is the nearest station?', ar:'أين أقرب محطة؟'},
  {en:'Does this bus go to the center?', ar:'هل تذهب هذه الحافلة إلى المركز؟'},
  {en:'How much is a return ticket?', ar:'كم سعر تذكرة الذهاب والإياب؟'},
  {en:'Could you drop me off here?', ar:'هل تنزلني هنا؟'},
  {en:'I missed my stop!', ar:'فاتتني محطتي!'},
  {en:'Is this seat taken?', ar:'هل هذا المقعد محجوز؟'},
  {en:'We are stuck in traffic.', ar:'نحن عالقون في الزحام.'}
]},
{ id:'ph4', type:'phrases', level:'intermediate', topic:'تسوق', title:'Shopping Phrases', lines:[
  {en:'I am just looking, thanks.', ar:'أتفرج فقط، شكراً.'},
  {en:'Do you have this in another color?', ar:'هل لديكم هذا بلون آخر؟'},
  {en:'It is a bit expensive.', ar:'إنه غالٍ قليلاً.'},
  {en:'Can you give me a better price?', ar:'هل تعطيني سعراً أفضل؟'},
  {en:'I will think about it.', ar:'سأفكر في الأمر.'},
  {en:'Can I return it if it does not fit?', ar:'هل أستطيع إرجاعه إن لم يناسب؟'},
  {en:'Do you have a receipt?', ar:'هل لديك إيصال؟'}
]},
{ id:'ph5', type:'phrases', level:'intermediate', topic:'تواصل', title:'On the Phone', lines:[
  {en:'Sorry, I cannot hear you well.', ar:'آسف، لا أسمعك جيداً.'},
  {en:'The line is cutting off.', ar:'الخط يتقطع.'},
  {en:'Can I call you back later?', ar:'هل أعاود الاتصال بك لاحقاً؟'},
  {en:'I will text you the address.', ar:'سأرسل لك العنوان رسالة.'},
  {en:'Please hold on a moment.', ar:'انتظر لحظة من فضلك.'},
  {en:'You have the wrong number.', ar:'لديك رقم خاطئ.'},
  {en:'Let me put you on speaker.', ar:'دعني أضعك على السماعة.'}
]},
{ id:'ph6', type:'phrases', level:'advanced', topic:'تواصل', title:'Feelings & Opinions', lines:[
  {en:'I could not agree more.', ar:'لا أستطيع أن أوافق أكثر.'},
  {en:'That is a fair point.', ar:'هذه نقطة وجيهة.'},
  {en:'I am not sure I follow you.', ar:'لست متأكداً أنني أفهمك.'},
  {en:'It is not that simple.', ar:'الأمر ليس بتلك البساطة.'},
  {en:'I see where you are coming from.', ar:'أرى من أين تأتي بكلامك.'},
  {en:'Let us agree to disagree.', ar:'لنتفق على الاختلاف.'},
  {en:'Honestly, I have mixed feelings.', ar:'بصراحة، مشاعري مختلطة.'}
]},
{ id:'ph7', type:'phrases', level:'advanced', topic:'عمل', title:'Work & Study', lines:[
  {en:'Let us push the deadline to Friday.', ar:'لنؤجل الموعد النهائي إلى الجمعة.'},
  {en:'Could you walk me through the plan?', ar:'هل تشرح لي الخطة خطوة خطوة؟'},
  {en:'I am swamped this week.', ar:'أنا غارق في العمل هذا الأسبوع.'},
  {en:'We need to think outside the box.', ar:'نحتاج تفكيراً خارج الصندوق.'},
  {en:'Let us call it a day.', ar:'لننهِ عمل اليوم.'},
  {en:'I will pick your brain on this.', ar:'سأستشيرك في هذا.'},
  {en:'It is a steep learning curve.', ar:'إنها منحنى تعلم صعب.'}
]}
];

/* خطوط المحتوى المسطّحة لاختبار الاستماع النصي (TTS) */
const LISTEN_LINES = [];
for (const c of CONTENT) for (const l of c.lines)
  LISTEN_LINES.push({en: l.en, ar: l.ar, src: c.id, level: c.level});
