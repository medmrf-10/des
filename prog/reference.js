/* برمج — المرجع السريع: cheat-sheets قابلة للبحث والتصفية + تعلّم محفوظ */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let learned = {};
try { learned = JSON.parse(localStorage.getItem('prog_ref') || '{}') || {}; } catch (e) { learned = {}; }
const save = () => localStorage.setItem('prog_ref', JSON.stringify(learned));

const SHEETS = [
  { id: 'html', name: 'HTML أساسيات', cat: 'html', items: [
    ['<!DOCTYPE html>', 'إعلان نوع المستند — يبدأ كل صفحة'],
    ['<html dir="rtl" lang="ar">', 'العنصر الجذر مع اتجاه ولغة'],
    ['<head> <meta charset> <title>', 'منطقة البيانات الوصفية — لا تُعرض'],
    ['<h1>…<h6>', 'عناوين بستة مستويات'],
    ['<p>', 'فقرة نصية'],
    ['<a href="…">', 'رابط — target="_blank" يفتح بتبويب'],
    ['<img src alt>', 'صورة — alt وصف بديل'],
    ['<ul> <ol> <li>', 'قوائم غير مرتبة ومرتبة'],
    ['<input type="text|number|checkbox">', 'حقول إدخال'],
    ['<button>', 'زر قابل للضغط'],
    ['<div> <span>', 'حاويات عامة: كتلة وسطرية'],
    ['class / id', 'معرفات للتنسيق والجافاسكربت'],
  ]},
  { id: 'css', name: 'CSS أساسيات', cat: 'css', items: [
    ['element { k: v }', 'محدد عنصر'],
    ['.class / #id', 'محدد كلاس ومعرف'],
    ['color / background', 'لون النص والخلفية'],
    ['font-size / font-weight', 'حجم وسمك الخط'],
    ['padding / margin', 'هوامش داخلية وخارجية'],
    ['border / border-radius', 'حدود وتدوير الزوايا'],
    ['display: flex', 'تخطيط مرن'],
    ['justify-content / align-items', 'محاذاة flex رئيسية وعرضية'],
    ['flex-direction: column', 'ترتيب عمودي'],
    ['gap', 'فجوة بين العناصر المرنة'],
    ['width / max-width', 'عرض ثابت وأقصى'],
    [':hover', 'حالة عند مرور المؤشر'],
  ]},
  { id: 'js', name: 'JavaScript أساسيات', cat: 'js', items: [
    ['let x = 5 / const y = 10', 'متغير قابل للتغيير / ثابت'],
    ['typeof x', 'نوع القيمة: string/number/boolean'],
    ['if (c) { } else { }', 'شرط'],
    ['for (let i=0;i<n;i++)', 'حلقة عدّ'],
    ['while (c)', 'حلقة شرطية'],
    ['arr.push(x) / arr.pop()', 'إضافة وحذف من نهاية مصفوفة'],
    ['arr.map(f) / filter(f) / forEach(f)', 'تحويل وتصفية ومرور'],
    ['arr.find(f) / includes(v)', 'بحث في مصفوفة'],
    ['arr.reduce((a,b)=>a+b,0)', 'تجميع لقيمة واحدة'],
    ['function f(p) { return r }', 'دالة بمعاملات وإرجاع'],
    ['(a,b) => a+b', 'دالة سهمية'],
    ['obj.key / obj["key"]', 'خاصية كائن'],
    ['JSON.stringify / JSON.parse', 'كائن ⇄ نص'],
    ['console.log(x)', 'طباعة للتصحيح'],
    ['document.querySelector(sel)', 'اختيار عنصر من الصفحة'],
    ['el.textContent / innerHTML', 'قراءة أو كتابة محتوى عنصر'],
    ['el.addEventListener("click", f)', 'ربط حدث بدالة'],
    ['el.classList.add/remove/toggle', 'إدارة كلاسات عنصر'],
    ['setTimeout(f, ms) / setInterval', 'تأخير وتكرار زمني'],
    ['localStorage.setItem(k, JSON.stringify(v))', 'حفظ على الجهاز'],
    ['fetch(url).then(r=>r.json())', 'جلب بيانات من الشبكة'],
    ['async/await + try/catch', 'انتظار غير متزامن والتقاط أخطاء'],
    ['Promise.all([p1,p2])', 'مهام متوازية'],
  ]},
  { id: 'git', name: 'Git', cat: 'git', items: [
    ['git status', 'حالة الملفات المعدّلة'],
    ['git add file / git commit -m "msg"', 'تجهيز ثم التزام برسالة'],
    ['git log --oneline', 'سجل الالتزامات المختصر'],
    ['git diff', 'فرق غير مجهّز / --staged مجهّز'],
    ['git checkout -b name', 'إنشاء فرع والانتقال إليه'],
    ['git switch name', 'الانتقال بين الفروع'],
    ['git merge branch', 'دمج فرع في الحالي'],
    ['git pull / git push', 'سحب ودفع من/إلى البعيد'],
    ['git stash / git stash pop', 'إخفاء التعديلات واسترجاعها'],
    ['git clone url', 'نسخ مستودع بعيد'],
    ['git remote -v', 'عرض العناوين البعيدة'],
    ['.gitignore', 'ملفات يتجاهلها git'],
  ]},
];

const CATS = [{ id: 'all', name: 'الكل' }].concat(SHEETS.map(s => ({ id: s.cat, name: s.name.split(' ')[0] })));
let q = '', cat = 'all';

function renderCats() {
  $('#rfCats').innerHTML = CATS.map(c =>
    `<button class="ptab ${cat === c.id ? 'on' : ''}" data-c="${c.id}">${escH(c.name)}</button>`).join('');
}

function render() {
  const ql = q.trim().toLowerCase();
  const sheets = SHEETS.filter(s => cat === 'all' || s.cat === cat);
  let shown = 0, learnedShown = 0;
  const html = sheets.map(s => {
    const items = s.items.map((it, i) => ({ it, i }))
      .filter(x => !ql || x.it[0].toLowerCase().includes(ql) || x.it[1].includes(ql));
    if (!items.length) return '';
    shown += items.length;
    learnedShown += items.filter(x => learned[s.id + ':' + x.i]).length;
    return `<div class="rf-card">
      <div class="rf-card-h"><h3>${escH(s.name)}</h3><span>${items.filter(x => learned[s.id + ':' + x.i]).length}/${items.length}</span></div>
      <div class="rf-items">${items.map(({ it, i }) => {
        const key = s.id + ':' + i, on = learned[key];
        return `<div class="rf-item ${on ? 'on' : ''}">
          <code class="rf-code">${escH(it[0])}</code>
          <span class="rf-mean">${escH(it[1])}</span>
          <button class="rf-mark ${on ? 'on' : ''}" data-k="${key}" title="${on ? 'تعلّمته' : 'علّم كمُتقَن'}">${on ? '✓' : '○'}</button>
        </div>`;
      }).join('')}</div>
    </div>`;
  }).join('');
  $('#rfList').innerHTML = html || '<p class="ptr-empty">لا نتائج لهذا البحث.</p>';
  $('#rfStat').textContent = `${shown} بنداً — تعلّمت ${learnedShown}`;
}

$('#rfCats').addEventListener('click', e => {
  const b = e.target.closest('.ptab'); if (!b) return;
  cat = b.dataset.c; renderCats(); render();
});
$('#rfQ').addEventListener('input', e => { q = e.target.value; render(); });
$('#rfList').addEventListener('click', e => {
  const b = e.target.closest('.rf-mark'); if (!b) return;
  learned[b.dataset.k] = !learned[b.dataset.k];
  if (!learned[b.dataset.k]) delete learned[b.dataset.k];
  save(); render();
});

renderCats(); render();
})();
