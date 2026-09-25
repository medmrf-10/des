/* برمج — مختبر الريجيكس: 12 تحدياً تصاعدياً، 6 نصوص تُقيَّم حياً، تلميح + حل مشروح */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let st = {};
try { st = JSON.parse(localStorage.getItem('prog_regex') || '{}') || {}; } catch (e) { st = {}; }
const save = () => localStorage.setItem('prog_regex', JSON.stringify(st));

/* match:true = النمط يجب أن يطابق النص كلياً (اختبار .test) */
const CH = [
  { id: 'word', t: 'الكلمة hello فقط', cases: [['hello', 1], ['hello world', 1], ['say hello', 1], ['hell', 0], ['HELLO', 0], ['bello', 0]],
    hint: 'لا رموز خاصة — حروف حرفية فقط.',
    sol: 'hello', expl: [{ p: 'hello', d: 'يطابق الحروف كما هي حرفاً بحرف — حساس لحالة الأحرف فلا يطابق HELLO.' }] },
  { id: 'digits', t: 'ثلاثة أرقام متتالية', cases: [['123', 1], ['رقم 456', 1], ['12a34', 0], ['12', 0], ['أرقام فقط', 0], ['١٢٣', 0]],
    hint: 'من تريد \\d — لكن كم مرة؟',
    sol: '\\d{3}', expl: [{ p: '\\d', d: 'رقم عشري 0-9' }, { p: '{3}', d: 'ثلاث مرات بالضبط — لا تطابق رقمين ولا أربعة متصلة جزئياً؟ بل تطابق أي 3 متتالية داخل نص أطول أيضاً.' }] },
  { id: 'ardigits', t: 'أرقام عربية مشرقية', cases: [['١٢٣٤٥', 1], ['سنة ١٤٤٥هـ', 1], ['١٢', 1], ['123', 0], ['خمسة', 0], ['٥x', 1]],
    hint: 'الأرقام العربية ٠-٩ مجال يونيكود خاص.',
    sol: '[٠-٩]+', expl: [{ p: '[٠-٩]', d: 'مجال حروف من ٠ إلى ٩ العربية (١٦٣٢-١٦٤١ يونيكود)' }, { p: '+', d: 'واحداً فأكثر' }] },
  { id: 'anchor', t: 'سطر يبدأ بـ start', cases: [['start now', 1], ['started', 0], ['the start', 0], ['start', 1], ['restart', 0], ['start end', 1]],
    hint: 'مرساة البداية ^ — وانتبه لـ started.',
    sol: '^start\\b', expl: [{ p: '^', d: 'بداية النص' }, { p: 'start', d: 'حرفي' }, { p: '\\b', d: 'حدّ كلمة — فيمنع started لأنها كلمة واحدة' }] },
  { id: 'end', t: 'سطر ينتهي بفاصلة منقوطة', cases: [['let x = 5;', 1], ['x++;', 1], ['let x = 5', 0], ['؛', 0], [';only', 0], ['end;', 1]],
    hint: 'مرساة النهاية $ + حرف ; حرفي.',
    sol: ';$', expl: [{ p: ';', d: 'الفاصلة المنقوطة حرفياً' }, { p: '$', d: 'نهاية النص — فيجب أن يكون ; آخر حرف' }] },
  { id: 'email', t: 'بريد إلكتروني بسيط', cases: [['a@b.com', 1], ['user.name@mail.co', 1], ['dev@site.org', 1], ['a@b', 0], ['@site.com', 0], ['a b@c', 0]],
    hint: 'حروف+@+حروف+نقطة+امتداد حرفين على الأقل. \\w يشمل _ والأرقام.',
    sol: '[\\w.]+@[\\w-]+\\.[a-z.]{2,}', expl: [{ p: '[\\w.]+', d: 'اسم المستخدم: حروف/أرقام/نقاط' }, { p: '@', d: 'الفاصل حرفياً' }, { p: '[\\w-]+', d: 'النطاق' }, { p: '\\.', d: 'نقطة حرفية — \\ يلغي معنى النقطة الخاص' }, { p: '[a-z.]{2,}', d: 'امتداد حرفين على الأقل' }] },
  { id: 'date', t: 'تاريخ YYYY/MM/DD', cases: [['2024/01/15', 1], ['1999/12/31', 1], ['في 2020/05/01 صدر', 1], ['2024-01-15', 0], ['24/1/5', 0], ['no date', 0]],
    hint: 'أربع خانات / خانتان / خانتان.',
    sol: '\\d{4}/\\d{2}/\\d{2}', expl: [{ p: '\\d{4}', d: 'السنة 4 أرقام' }, { p: '/', d: 'حرفية — لا تحتاج تهريباً' }, { p: '\\d{2}', d: 'الشهر واليوم خانتان' }] },
  { id: 'either', t: 'color أو colour', cases: [['color', 1], ['colour', 1], ['the color ran', 1], ['colors', 0], ['discolor', 0], ['colourless', 0]],
    hint: '? تجعل الحرف قبلها اختيارياً — واحاطها بـ\\b من الطرفين.',
    sol: '\\bcolou?r\\b', expl: [{ p: '\\b', d: 'حدّ كلمة قبل وبعد — فيمنع colors/discolor/colourless' }, { p: 'colo', d: 'حرفي' }, { p: 'u?', d: 'u اختيارية — فتقبل الصيغتين' }, { p: 'r', d: 'حرفي' }] },
  { id: 'tag', t: 'وسم HTML بسيط', cases: [['<div>', 1], ['<span class="x">', 1], ['<br/>', 1], ['div', 0], ['<div', 0], ['<>', 0]],
    hint: '< ثم أي شيء غير > مرة على الأقل ثم >.',
    sol: '<[^>]+>', expl: [{ p: '<', d: 'حرفي' }, { p: '[^>]+', d: 'أي حرف ليس > — فئة منفية' }, { p: '>', d: 'الإغلاق حرفي' }, { p: '(ملاحظة)', d: 'لا يطابق <> لأن + تتطلب حرفاً واحداً على الأقل' }] },
  { id: 'price', t: 'سعر بالدولار', cases: [['$5', 1], ['$19.99', 1], ['price $3.50', 1], ['5$', 0], ['$', 0], ['free', 0]],
    hint: '$ رمز خاص — اهربه، ثم أرقام وكسور اختيارية.',
    sol: '\\$\\d+(\\.\\d{2})?', expl: [{ p: '\\$', d: 'علامة الدولار حرفية — $ وحدها تعني النهاية فلا بد من \\' }, { p: '\\d+', d: 'الدولارات' }, { p: '(\\.\\d{2})?', d: 'سنتات اختيارية: نقطة + خانتان، المجموعة بـ؟ قد تغيب' }] },
  { id: 'hex', t: 'لون هكس', cases: [['#fff', 1], ['#a0b1c2', 1], ['#GG', 0], ['fff', 0], ['#12345', 0], ['#12f', 1]],
    hint: '# ثم 3 أو 6 من [0-9a-f]. استعمل المجال {n,m}.',
    sol: '#[0-9a-f]{3}(?:[0-9a-f]{3})?\\b', expl: [{ p: '#', d: 'حرفي' }, { p: '[0-9a-f]', d: 'رقم أو حرف a-f' }, { p: '{3}', d: 'ثلاثة أولاً' }, { p: '(?:[0-9a-f]{3})?', d: 'ثلاثة أخرى اختيارية — (?:) مجموعة بلا التقاط' }, { p: '\\b', d: 'حدّ كلمة يمنع #12345' }] },
  { id: 'dupe', t: 'كلمة مكررة متتالية', cases: [['the the', 1], ['go go go', 1], ['مرة مرة', 1], ['the', 0], ['that', 0], ['hello world', 0]],
    hint: 'الإسناد الراجع \\1 يطابق ما التقطته المجموعة — و\\S يقبل العربية (\\w لا يقبلها).',
    sol: '(\\S+)\\s+\\1', expl: [{ p: '(\\S+)', d: 'مجموعة 1 تلتقط واصلة غير الفراغ — تعمل مع العربية خلافاً لـ\\w' }, { p: '\\s+', d: 'فراغات فاصلة' }, { p: '\\1', d: 'نفس الملتقَط حرفياً — أقوى رموز الريجيكس للتكرار' }] },
];

let cur = 0;
const done = () => CH.filter(c => st[c.id]).length;

function head() {
  $('#rxCount').textContent = `${done()}/${CH.length}`;
  $('#rxBar').style.width = done() / CH.length * 100 + '%';
}

function list() {
  $('#rxList').innerHTML = CH.map((c, i) => `<button class="lb-item${i === cur ? ' on' : ''}" data-i="${i}">
    <span class="lb-n">${i + 1}</span><span class="lb-t2">${escH(c.t)}</span>${st[c.id] ? '<span class="lb-ok">✓</span>' : ''}
  </button>`).join('');
  $('#rxList').querySelectorAll('button').forEach(b => b.onclick = () => { cur = +b.dataset.i; list(); render(); });
}

function evalCases(c, pat) {
  if (!pat) return c.cases.map(x => ({ s: x[0], want: x[1], got: null }));
  let re;
  try { re = new RegExp(pat); } catch (e) { return c.cases.map(x => ({ s: x[0], want: x[1], got: 'err' })); }
  return c.cases.map(x => ({ s: x[0], want: x[1], got: re.test(x[0]) }));
}

function render() {
  const c = CH[cur], solved = st[c.id];
  $('#rxMain').innerHTML = `
    <div class="lb-head">
      <span class="lb-idx">${cur + 1}/${CH.length}</span>
      <span class="lb-cat-tag">ريجيكس</span>
      <h2 class="lb-t">${solved ? '✅' : '🔎'} ${escH(c.t)}</h2>
    </div>
    <div class="rx-in-wrap" dir="ltr">
      <span class="rx-slash">/</span><input id="rxIn" class="rx-in" placeholder="اكتب النمط هنا" autocomplete="off" spellcheck="false"><span class="rx-slash">/</span>
    </div>
    <div class="rx-cases" id="rxCases"></div>
    <div id="rxOk">${solved ? '<div class="pn-ok">✓ محلول — نمطك يجتاز الستة</div>' : ''}</div>
    <div class="dh-nav" style="margin-top:14px">
      <button class="btn ghost sm" id="rxHintB">💡 تلميح</button>
      <span class="dh-count">${done()} حُلّت</span>
      <button class="btn ghost sm" id="rxSolB">الحل + الشرح</button>
    </div>
    <div id="rxHint"></div>
    <div id="rxSol"></div>`;
  const input = $('#rxIn');
  const paint = () => {
    const rows = evalCases(c, input.value.trim());
    $('#rxCases').innerHTML = rows.map(r => {
      const cls = r.got === null ? 'rx-c' : r.got === 'err' ? 'rx-c err' : (r.got === !!r.want ? 'rx-c ok' : 'rx-c bad');
      const mark = r.got === null ? '·' : r.got === 'err' ? '؟' : (r.got === !!r.want ? '✓' : '✗');
      return `<div class="${cls}" dir="ltr"><span class="rx-mark">${mark}</span><code>${escH(r.s)}</code><span class="rx-want">${r.want ? 'يطابق' : 'يرفض'}</span></div>`;
    }).join('');
    const allOk = rows.every(r => r.got === !!r.want);
    if (allOk && !st[c.id]) {
      st[c.id] = input.value.trim(); save(); head(); list();
      $('#rxOk').innerHTML = '<div class="pn-ok">✓ أحسنت — نمطك يجتاز الستة!</div>';
      $('#rxMain').querySelector('.lb-t').innerHTML = `✅ ${escH(c.t)}`;
      const dc = $('#rxMain').querySelector('.dh-count'); if (dc) dc.textContent = `${done()} حُلّت`;
    }
  };
  input.addEventListener('input', paint);
  input.value = solved === true ? '' : (typeof st[c.id] === 'string' ? st[c.id] : '');
  paint();
  $('#rxHintB').onclick = () => { $('#rxHint').innerHTML = `<div class="dh-why" style="margin-top:10px"><b>تلميح:</b> ${escH(c.hint)}</div>`; };
  $('#rxSolB').onclick = () => {
    $('#rxSol').innerHTML = `<div class="dh-why" style="margin-top:10px"><b>الحل:</b> <code dir="ltr" class="rx-solc">/${escH(c.sol)}/</code></div>
      <div class="rx-expl">${c.expl.map(x => `<div class="rx-ex" dir="ltr"><code>${escH(x.p)}</code><span dir="rtl">${escH(x.d)}</span></div>`).join('')}</div>`;
  };
}

head(); list(); render();
})();
