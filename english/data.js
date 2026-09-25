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
