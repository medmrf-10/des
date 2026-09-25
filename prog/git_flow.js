/* برمج — تدفق Git: 10 سيناريوهات حقيقية متصاعدة — اختر الأمر الذي يحلّ الموقف ثم افهم لماذا */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
let st = {};
try { st = JSON.parse(localStorage.getItem('prog_git') || '{}') || {}; } catch (e) { st = {}; }
st.streak = st.streak || 0; st.best = st.best || 0; st.correct = st.correct || 0; st.answered = st.answered || 0;
const save = () => localStorage.setItem('prog_git', JSON.stringify(st));

const SCEN = [
  { t: 'نسيت ملفاً في آخر commit', sit: 'كتبت <code>git commit -m "feat"</code> ثم تذكرت أن ملفاً ثالثاً لم يُضَف — والـcommit لم يُدفع بعد.',
    opts: ['git add f3 && git commit --amend --no-edit', 'git commit -m "fix"', 'git reset --hard HEAD~1', 'git push -f'],
    a: 'git add f3 && git commit --amend --no-edit',
    why: 'amend يعيد كتابة آخر commit ليضم الملف — آمناً تماماً ما دام لم يُدفع. يبقى التاريخ نظيفاً بلا commit إصلاحي مبتذل.' },
  { t: 'عمل غير مكتمل وطلب عاجل', sit: 'أنت منتصف ميزة على فرع <code>feature</code> بتعديلات غير جاهزة، والمدير يطلب إصلاحاً عاجلاً على <code>main</code> فوراً.',
    opts: ['git checkout main', 'git commit -am "wip"', 'git stash && git checkout main', 'git reset --hard'],
    a: 'git stash && git checkout main',
    why: 'stash يخزّن العمل الجاري جانباً → تنتقل لـmain بشجرة نظيفة، تُصلح، ثم تعود وتسترجعه بـstash pop. الـcommit النصف-جاهز يلوث تاريخ الفرع.' },
  { t: 'نسخة قديمة بلا فرع', sit: 'نفّذت <code>git checkout a1b2c3</code> لفحص نسخة قديمة — أنت الآن detached HEAD وتريد تجربة تعديل.',
    opts: ['git commit -m "test"', 'git switch -c experiment', 'git checkout main', 'لا شيء — العمل عادي'],
    a: 'git switch -c experiment',
    why: 'في detached HEAD لا يشير أي فرع لموقعك — commits تُصنع معلّقة وتضيع مع أول checkout. أنشئ فرعاً أولاً فيُثبَّت عملك.' },
  { t: 'تعارض دمج', sit: 'نفّذت <code>git merge main</code> فأنتج تعارضاً في <code>app.js</code>. حللت علامات <code>&lt;&lt;&lt;&lt;</code> يدوياً وحفظت الملف — ماذا بعد؟',
    opts: ['git merge --abort', 'git checkout --ours app.js', 'git add app.js && git merge --continue', 'git rebase --skip'],
    a: 'git add app.js && git merge --continue',
    why: 'add يخبر git أن التعارض حُلّ، و--continue يستأنف الدمج ويُكمل الـmerge commit. --abort يتخلى عن كل شيء.' },
  { t: 'commit مدفوع معطوب', sit: 'اكتشفت أن آخر commit دفعته إلى <code>main</code> يكسر الإنتاج — والفريق سحبه بالفعل. تريد إبطاله بأمان.',
    opts: ['git reset --hard HEAD~1 && git push -f', 'git revert HEAD', 'git rebase -i HEAD~2', 'git checkout HEAD~1'],
    a: 'git revert HEAD',
    why: 'revert يصنع commitاً معاكساً دون مسح التاريخ المشترك. reset+force يعيد كتابة التاريخ المنشور ويكسر نسخ كل من سحبه — القاعدة الذهبية: لا تعيد كتابة تاريخ دُفع.' },
  { t: 'commit اختفى', sit: 'نفّذت <code>git reset --hard HEAD~5</code> ثم ندمت — الـcommits "اختفت" من git log.',
    opts: ['استحالة — ضاعت للأبد', 'git fsck --lost-found', 'git log --all', 'git reflog ثم git reset --hard <sha>'],
    a: 'git reflog ثم git reset --hard <sha>',
    why: 'reflog يدفتر خاصة بكل حركة HEAD محلياً (~90 يوماً) — تجد الـsha "المفقود" وتسترجعه بـreset أو بفرع جديد.' },
  { t: 'commit واحد من فرع آخر', sit: 'تحتاج إصلاحاً واحداً موجوداً على فرع تجريبي — دون دمج الفرع كله.',
    opts: ['git merge experiment', 'git cherry-pick <sha>', 'git rebase experiment', 'git checkout experiment'],
    a: 'git cherry-pick <sha>',
    why: 'cherry-pick ينسخ فرق ذلك الـcommit الواحد فقط إلى فرعك — merge يجلب تاريخ الفرع كاملاً وما فيه من تجارب.' },
  { t: 'تاريخ متفرع قبل PR', sit: 'فرعك <code>feature</code> انشق قبل 3 commits عن <code>main</code> — تريد تاريخاً خطياً نظيفاً يبدو وكأنه بُني فوق آخر main.',
    opts: ['git merge main', 'git rebase main', 'git cherry-pick main', 'git reset --hard main'],
    a: 'git rebase main',
    why: 'rebase يعيد زرع commits فرعك فوق رأس main → تاريخ خطي بلا merge commits تشوّه القراءة. merge يعمل لكنه يضيف commit دمج زائد.' },
  { t: 'خطأ إملائي في رسالة مدفوعة', sit: 'دفعت commitاً واكتشفت غلطة في نص رسالته فقط. ماذا تفعل؟',
    opts: ['git commit --amend -m "fixed" && git push -f', 'commit جديد أو اتركها — لا تعيد كتابة المنشور', 'git reset HEAD~1', 'git stash'],
    a: 'commit جديد أو اتركها — لا تعيد كتابة المنشور',
    why: 'قاعدة amend الذهبية: تُستعمل فقط على ما لم يُدفع. إعادة كتابة تاريخ مشترك تكسر clones الآخرين — الغلطة الإملائية لا تستحق ذلك.' },
  { t: 'توثيق نقطة الإصدار', sit: 'وصل <code>main</code> لنقطة إطلاق الإصدار v1.0 — كيف تؤرشفها كمرجع دائم؟',
    opts: ['git branch v1.0', 'git commit -m "v1.0"', 'git stash', 'git tag -a v1.0 -m "release" && git push --tags'],
    a: 'git tag -a v1.0 -m "release" && git push --tags',
    why: 'الـtag annotated مرجع ثابت لا يتحرك مع commits جديدة — فرع بنفس الاسم سيتحرك ويفقد معنى "نقطة الإصدار".' },
];

let i = 0;
function stats() {
  const acc = st.answered ? Math.round(st.correct / st.answered * 100) : 0;
  $('#gfStats').innerHTML = `السيناريو <b>${Math.min(i + 1, SCEN.length)}/${SCEN.length}</b> • سلسلة حالية <b>${st.streak}</b> • أفضل <b>${st.best}</b> • دقة <b>${acc}%</b>`;
}
function end() {
  $('#gfMain').innerHTML = `<div class="pn-end"><div class="pn-end-ic">${st.streak >= 8 ? '🏆' : '📊'}</div>
    <h2>انتهت الجولة — دقة الجلسة ${st.answered ? Math.round(st.correct / st.answered * 100) : 0}%</h2>
    <div class="pn-end-sub">أفضل سلسلة: ${st.best} • إجمالي الإجابات: ${st.answered}</div>
    <button class="btn" onclick="location.reload()">جولة جديدة ⟵</button></div>`;
}
function render() {
  if (i >= SCEN.length) return end();
  stats();
  const s = SCEN[i];
  const opts = shuffle([...s.opts]);
  $('#gfMain').innerHTML = `
    <div class="lb-head" style="margin-bottom:14px">
      <span class="lb-cat-tag">Git</span>
      <span class="dh-idx">${i + 1}/${SCEN.length}</span>
      <h2 class="lb-t">🌿 ${escH(s.t)}</h2>
    </div>
    <div class="gf-sit">${s.sit}</div>
    <div class="dh-ask">أي أمر يحلّ الموقف بشكل صحيح؟</div>
    <div class="gf-opts" dir="ltr">${opts.map(o => `<button class="gf-opt" data-o="${escH(o)}">${escH(o)}</button>`).join('')}</div>
    <div id="gfRes"></div>
    <div class="dh-nav">
      <span></span>
      <span class="dh-count">${st.streak} سلسلة</span>
      <button class="btn ghost sm" id="gfSkip">تخطي ›</button>
    </div>`;
  $('#gfSkip').onclick = () => { st.streak = 0; st.answered++; save(); i++; render(); };
  $('#gfMain').querySelectorAll('.gf-opt').forEach(b => b.onclick = () => {
    const pick = b.dataset.o;
    const ok = pick === s.a;
    st.answered++;
    if (ok) { st.streak++; st.correct++; st.best = Math.max(st.best, st.streak); }
    else st.streak = 0;
    save();
    $('#gfMain').querySelectorAll('.gf-opt').forEach(x => {
      x.disabled = true;
      if (x.dataset.o === s.a) x.classList.add('ok');
      else if (x.dataset.o === pick) x.classList.add('bad');
    });
    $('#gfRes').innerHTML = `
      <div class="${ok ? 'pn-ok' : 'pn-bad'}" style="margin:12px 0 8px">${ok ? '✓ صحيح!' : `✗ — الصحيح: <b dir="ltr">${escH(s.a)}</b>`}</div>
      <div class="dh-why"><b>لماذا؟</b> ${escH(s.why)}</div>
      <button class="btn" style="margin-top:14px" id="gfNext">${i === SCEN.length - 1 ? 'النتيجة ⟵' : 'التالي ⟵'}</button>`;
    $('#gfNext').onclick = () => { i++; render(); };
    const c = $('#gfMain').querySelector('.dh-count'); if (c) c.textContent = `${st.streak} سلسلة`;
    stats();
  });
}
render();
})();
