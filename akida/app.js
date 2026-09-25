(function () {
  const D = window.AQIDA_INDEX;
  const $ = (s) => document.querySelector(s);
  const toc = $('#toc'), main = $('#main'), search = $('#search');
  const KIND = { 'متن': 'متن', 'شرح': 'شرح', 'شرح معاصر': 'شرح', 'شرح كلامي': 'شرح', 'كلام': 'كلام', 'متن كلامي': 'متن', 'مقالات': 'مقالات', 'أثري': 'أثري', 'شرح أثري': 'أثري', 'رد': 'رد', 'رد/مقالات': 'رد', 'رسالة كلامية': 'رسالة', 'متن معلّق': 'متن', 'متن موسَّع': 'متن', 'تعليقات': 'تعليقات' };
  const kindTag = (k) => KIND[k] || k || '';

  // stats
  const nCh = D.babs.reduce((s, b) => s + b.chapters.length, 0);
  $('#stat-chapters').textContent = nCh;
  $('#stat-books').textContent = Object.keys(D.books).length;

  // sidebar
  D.babs.forEach((b, i) => {
    const a = document.createElement('a');
    a.className = 'bab-link'; a.href = '#bab-' + b.num; a.dataset.bab = b.num;
    a.innerHTML = `<span class="bab-num">${b.num}</span>${esc(b.title)}`;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openBab(i, true);
      document.getElementById('bab-' + b.num).scrollIntoView({ block: 'start' });
    });
    toc.appendChild(a);
  });

  // main
  D.babs.forEach((b, i) => {
    const sec = document.createElement('section');
    sec.className = 'bab'; sec.id = 'bab-' + b.num; sec.dataset.bab = b.num;
    sec.innerHTML = `<div class="bab-head" role="button" tabindex="0" aria-expanded="false">
        <span class="num">${b.num}</span><h2>${esc(b.title)}</h2>
        <span class="cnt">${b.chapters.length} فصلاً</span><span class="chev">▾</span></div>
      <div class="bab-body"></div>`;
    const body = sec.querySelector('.bab-body');
    b.chapters.forEach((c) => {
      const ch = document.createElement('div');
      ch.className = 'chapter';
      ch.dataset.text = c.title;
      let books = '';
      c.refs.forEach((r) => {
        const bk = D.books[r];
        if (!bk) return;
        books += `<button class="book" data-ref="${r}"><span class="k">${esc(kindTag(bk.kind))}</span>${esc(short(bk.title))}</button>`;
      });
      ch.innerHTML = `<div class="ch-head"><span class="ch-num">${c.num}</span><span class="ch-title">${esc(c.title)}</span></div>
        <div class="books">${books}</div>`;
      body.appendChild(ch);
    });
    sec.querySelector('.bab-head').addEventListener('click', () => toggle(i));
    sec.querySelector('.bab-head').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } });
    main.appendChild(sec);
  });

  function toggle(i, open) {
    const sec = main.children[i];
    const willOpen = open !== undefined ? open : !sec.classList.contains('open');
    sec.classList.toggle('open', willOpen);
    sec.querySelector('.bab-head').setAttribute('aria-expanded', willOpen);
    document.querySelector(`#toc .bab-link[data-bab="${sec.dataset.bab}"]`).classList.toggle('active', willOpen);
  }
  function openBab(i) { toggle(i, true); }
  openBab(0);
  $('#expand-all').addEventListener('click', () => D.babs.forEach((_, i) => toggle(i, true)));
  $('#collapse-all').addEventListener('click', () => D.babs.forEach((_, i) => toggle(i, false)));

  // book card
  const card = $('#book-card'); let overlay = null;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.book');
    if (btn) {
      const bk = D.books[btn.dataset.ref];
      card.innerHTML = `<button class="close" aria-label="إغلاق">✕</button>
        <h3>${esc(bk.title)}</h3>
        <div class="meta">${esc(bk.author)}</div>
        <span class="tag">${esc(bk.kind)}</span><span class="tag">${bk.source === 'soufia' ? 'الشاملة الصوفية 2021' : 'أرشيف SufismBooks — archive.org'}</span>
        <p class="meta" style="margin-top:10px">المعرف: <code>${btn.dataset.ref}</code></p>`;
      card.hidden = false;
      overlay = document.createElement('div'); overlay.className = 'overlay';
      overlay.addEventListener('click', closeCard); document.body.appendChild(overlay);
      card.querySelector('.close').addEventListener('click', closeCard);
      return;
    }
    if (!e.target.closest('#book-card')) closeCard();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCard(); });
  function closeCard() { card.hidden = true; if (overlay) { overlay.remove(); overlay = null; } }

  // search
  search.addEventListener('input', () => {
    const q = norm(search.value);
    let any = false;
    D.babs.forEach((b, i) => {
      const sec = main.children[i];
      let babHit = norm(b.title).includes(q);
      let chHit = false;
      sec.querySelectorAll('.chapter').forEach((ch, ci) => {
        const c = b.chapters[ci];
        const bookTitles = c.refs.map((r) => D.books[r] ? D.books[r].title + ' ' + D.books[r].author : '').join(' ');
        const hit = !q || norm(c.title).includes(q) || norm(bookTitles).includes(q);
        ch.classList.toggle('hidden-by-search', !hit && q);
        chHit = chHit || hit;
      });
      const show = !q || babHit || chHit;
      sec.classList.toggle('hidden-by-search', !show);
      if (show) any = true;
      if (q) toggle(i, show);
      else toggle(i, i === 0);
    });
    let em = main.querySelector('.empty');
    if (!any) { if (!em) { em = document.createElement('div'); em.className = 'empty'; em.textContent = 'لا نتائج مطابقة'; main.appendChild(em); } }
    else if (em) em.remove();
  });

  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function short(t) { return t.length > 34 ? t.slice(0, 33) + '…' : t; }
  function norm(s) { return String(s).replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase().trim(); }
})();
