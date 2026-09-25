(function () {
  const D = window.AQIDA_REAL_INDEX;
  const $ = (s) => document.querySelector(s);
  const toc = $('#toc'), main = $('#main'), search = $('#search');
  const bookByCode = {};
  D.books.forEach((b) => (bookByCode[b.code] = b));

  // stats
  const nTopics = D.unified.reduce((s, b) => s + b.topics.length, 0);
  const nAtoms = Object.values(D.atoms).reduce((s, m) => s + Object.keys(m).length, 0);
  $('#stat-babs').textContent = D.unified.length;
  $('#stat-topics').textContent = nTopics;
  $('#stat-atoms').textContent = nAtoms;
  $('#stat-books').textContent = D.books.length;

  const DIR = { 'ط': '473', 'ش': '659', 'إ': '454', 'ن': '507', 'غ': '464', 'س': '511', 'ل': '530', 'ف': '475', 'ج': '515', 'ق': 'suf233' };
  function dirOf(code) { return DIR[code] || (code[0] === 'ص' ? 'suf' + code.slice(1) : code); }
  const textCache = {};

  let mode = 'unified';
  let readBook = null; // كتاب القارئ الحالي
  const tocLinks = [];

  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function norm(s) { return String(s).replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase().trim(); }
  function atomHtml(code, id, link) {
    const a = D.atoms[code] && D.atoms[code][id];
    if (!a) return '';
    const ref = a.r ? a.r : (a.u ? 'وحدة ' + a.u : '');
    return `<div class="atom" data-text="${esc(a.t + ' ' + a.q + ' ' + id)}"${link ? ` data-read="${esc(code + '/' + id)}"` : ''}>
      <div class="atom-head"><span class="atom-id">${esc(id)}</span><span class="atom-t">${esc(a.t)}</span>${ref ? `<span class="atom-r">${esc(ref)}</span>` : ''}</div>
      ${a.q ? `<p class="atom-q">«${esc(a.q)}»</p>` : ''}
    </div>`;
  }

  function loadTexts(code, cb) {
    if (textCache[code]) return cb(textCache[code]);
    const files = (window.AQIDA_TEXT_FILES || {})[code] || [dirOf(code) + '.js'];
    const merged = { atoms: {}, units: {} };
    let i = 0;
    (function next() {
      if (i >= files.length) { textCache[code] = merged; return cb(merged); }
      const s = document.createElement('script');
      s.src = 'texts/' + files[i++];
      s.onload = s.onerror = () => {
        const part = (window.AQIDA_TEXTS || {})[code];
        if (part) {
          Object.assign(merged.atoms, part.atoms || {});
          Object.assign(merged.units, part.units || {});
        }
        next();
      };
      document.head.appendChild(s);
    })();
  }

  // ---- unified view: babs → topics → refs(book) → atoms ----
  function buildUnified() {
    D.unified.forEach((b, i) => {
      const link = document.createElement('a');
      link.className = 'bab-link'; link.href = '#ub-' + i; link.dataset.idx = i;
      link.innerHTML = `<span class="bab-num">${i}</span>${esc(b.name)}`;
      link.addEventListener('click', (e) => {
        e.preventDefault(); openSec(i, true);
        document.getElementById('ub-' + i).scrollIntoView({ block: 'start' });
      });
      toc.appendChild(link); tocLinks.push(link);

      const sec = document.createElement('section');
      sec.className = 'bab'; sec.id = 'ub-' + i;
      let inner = '';
      b.topics.forEach((t) => {
        const nBooks = new Set(t.refs.map((r) => r.b)).size;
        const nAt = t.refs.reduce((s, r) => s + r.atoms.length, 0);
        inner += `<div class="topic"><div class="tp-head"><span class="tp-name">${esc(t.name)}</span><span class="tp-cnt">${nBooks} كتب · ${nAt} ذرة</span></div>`;
        t.refs.forEach((r) => {
          const bk = bookByCode[r.b];
          const short = bk ? bk.title : r.b;
          inner += `<div class="ref-group${r.sug ? ' sug' : ''}"><div class="ref-book"><button class="book" title="${bk ? esc(bk.title + ' — ' + bk.author) : ''}"><span class="k">${esc(r.b)}</span>${esc(short)}</button><span class="ref-x">${esc(r.x)}</span>${r.sug ? '<span class="sug-tag">مقترح</span>' : ''}</div>`;
          if (r.atoms.length) {
            inner += '<div class="ref-atoms">' + r.atoms.map((id) => atomHtml(r.b, id, true)).join('') + '</div>';
          }
          inner += '</div>';
        });
        inner += '</div>';
      });
      sec.innerHTML = `<div class="bab-head" role="button" tabindex="0" aria-expanded="false">
          <span class="num">${i}</span><h2>${esc(b.name)}</h2>
          <span class="cnt">${b.topics.length} موضوعاً</span><span class="chev">▾</span></div>
        <div class="bab-body" data-text="${esc(b.name)}">${inner}</div>`;
      sec.querySelector('.bab-head').addEventListener('click', () => toggleSec(sec));
      main.appendChild(sec);
    });
  }

  // ---- books view: book → sections → atoms in order ----
  function buildBooks() {
    D.books.forEach((bk, i) => {
      const link = document.createElement('a');
      link.className = 'bab-link'; link.href = '#bk-' + i; link.dataset.idx = i;
      link.innerHTML = `<span class="bab-num">${bk.code}</span>${esc(bk.title)}`;
      link.addEventListener('click', (e) => {
        e.preventDefault(); openSec(i, true);
        document.getElementById('bk-' + i).scrollIntoView({ block: 'start' });
      });
      toc.appendChild(link); tocLinks.push(link);

      const sec = document.createElement('section');
      sec.className = 'bab'; sec.id = 'bk-' + i;
      const ids = D.order[bk.code] || [];
      let inner = '', cur = null;
      ids.forEach((id) => {
        const a = D.atoms[bk.code][id];
        if (!a) return;
        if (a.b !== cur) { cur = a.b; inner += `<div class="tp-head sec-label">${esc(cur || '—')}</div>`; }
        inner += atomHtml(bk.code, id, true);
      });
      sec.innerHTML = `<div class="bab-head" role="button" tabindex="0" aria-expanded="false">
          <span class="num">${esc(bk.code)}</span><h2>${esc(bk.title)}</h2>
          <span class="cnt">${esc(bk.author)} · ${bk.nAtoms} ذرة</span><span class="chev">▾</span></div>
        <div class="bab-body" data-text="${esc(bk.title + ' ' + bk.author)}">${inner}</div>`;
      sec.querySelector('.bab-head').addEventListener('click', () => toggleSec(sec));
      main.appendChild(sec);
    });
  }

  // ---- قراءة الكتب: نص كامل متصل، ذرة تلو ذرة بعلامات الصفحات ----
  function renderReader(bk) {
    const TX = textCache[bk.code];
    const ids = D.order[bk.code] || [];
    const atomsOf = D.atoms[bk.code] || {};
    let inner = `<div class="reader-book"><h2>${esc(bk.title)}</h2><p class="rb-meta">${esc(bk.author)} · ${ids.length} وحدة · النص حرفي مقصوص من المصدر</p></div>`;
    let cur = '';
    ids.forEach((id) => {
      const a = atomsOf[id];
      if (!a) return;
      if (a.b !== cur) {
        cur = a.b;
        inner += `<h3 class="rd-sec" data-text="${esc(cur || '')}">${esc(cur || '—')}</h3>`;
      }
      const tx = TX.atoms[id];
      inner += `<article class="rd-atom" id="ra-${esc(id)}" data-text="${esc(a.t + ' ' + id)}">
        <div class="atom-head"><span class="atom-id">${esc(id)}</span><span class="atom-t">${esc(a.t)}</span>${tx && tx.pg[0] ? `<span class="atom-r">ص ${tx.pg[0]}${tx.pg[1] && tx.pg[1] !== tx.pg[0] ? '–' + tx.pg[1] : ''}</span>` : ''}</div>`;
      if (tx && tx.x && tx.x.length) {
        inner += '<div class="rd-text">' + tx.x.map((seg) =>
          `${seg[0] ? `<span class="pgmark">ص ${seg[0]}</span>` : ''}${esc(seg[1]).replace(/\n/g, '<br>')}`
        ).join('') + '</div>';
      } else {
        inner += '<div class="rd-text rd-miss">عنوان فرعي — النص متصل ضمن الوحدة السابقة</div>';
      }
      inner += '</article>';
    });
    main.innerHTML = inner;
    // الشريط الجانبي = أقسام الكتاب
    const secs = [...new Set(ids.map((id) => atomsOf[id] && atomsOf[id].b).filter(Boolean))];
    toc.querySelectorAll('.bab-link,.toc-back').forEach((n) => n.remove());
    const back = document.createElement('a');
    back.className = 'bab-link toc-back'; back.href = '#';
    back.innerHTML = '← رجوع إلى قائمة الكتب';
    back.addEventListener('click', (e) => { e.preventDefault(); readBook = null; buildReadToc(); });
    toc.insertBefore(back, toc.children[1] || null);
    secs.forEach((s) => {
      const a = document.createElement('a');
      a.className = 'bab-link'; a.href = '#';
      a.innerHTML = esc(s);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const h = [...main.querySelectorAll('.rd-sec')].find((x) => x.textContent === s);
        if (h) h.scrollIntoView({ block: 'start' });
      });
      toc.appendChild(a);
    });
  }

  function buildReadToc() {
    main.innerHTML = '';
    toc.querySelectorAll('.bab-link,.toc-back').forEach((n) => n.remove());
    D.books.forEach((bk) => {
      const a = document.createElement('a');
      a.className = 'bab-link'; a.href = '#';
      a.innerHTML = `<span class="bab-num">${esc(bk.code)}</span>${esc(bk.title)}`;
      a.addEventListener('click', (e) => { e.preventDefault(); openReader(bk.code); });
      toc.appendChild(a);
    });
    main.innerHTML = '<div class="empty">اختر كتاباً من القائمة للقراءة الكاملة — النص مقصوص حرفياً بوحداته المفهومة وبإحداثيات صفحاته.</div>';
  }

  function openReader(code, atomId) {
    const bk = bookByCode[code];
    if (!bk) return;
    readBook = code;
    setMode('read');
    main.innerHTML = '<div class="empty">جارٍ تحميل نص الكتاب…</div>';
    loadTexts(code, () => {
      renderReader(bk);
      if (atomId) {
        const el = document.getElementById('ra-' + atomId);
        if (el) el.scrollIntoView({ block: 'start' });
      }
      applySearch();
    });
  }

  function setMode(m) {
    mode = m;
    ['unified', 'books', 'read'].forEach((k) => $('#tab-' + k).classList.toggle('active', k === m));
  }

  function toggleSec(sec, open) {
    const willOpen = open !== undefined ? open : !sec.classList.contains('open');
    sec.classList.toggle('open', willOpen);
    sec.querySelector('.bab-head').setAttribute('aria-expanded', willOpen);
    const idx = Array.prototype.indexOf.call(main.children, sec);
    const link = toc.querySelector(`.bab-link[data-idx="${idx}"]`);
    if (link) link.classList.toggle('active', willOpen);
  }
  function openSec(i, open) { toggleSec(main.children[i], open); }

  function applySearch() {
    const q = norm(search.value);
    if (mode === 'read') {
      let any = !q;
      main.querySelectorAll('.rd-atom, .rd-sec').forEach((el) => {
        const hit = !q || norm(el.textContent).includes(q);
        el.classList.toggle('hidden-by-search', !hit && !!q);
        any = any || hit;
      });
      let em = main.querySelector('.empty');
      if (!any && q) { if (!em) { em = document.createElement('div'); em.className = 'empty'; em.textContent = 'لا نتائج مطابقة'; main.appendChild(em); } }
      else if (em) em.remove();
      return;
    }
    let any = false;
    main.querySelectorAll('.bab').forEach((sec) => {
      const body = sec.querySelector('.bab-body');
      const headHit = norm(body.dataset.text).includes(q);
      let innerHit = false;
      body.querySelectorAll('.topic, .atom').forEach((el) => {
        const hit = !q || norm(el.textContent).includes(q);
        el.classList.toggle('hidden-by-search', !hit && !!q);
        innerHit = innerHit || hit;
      });
      const show = !q || headHit || innerHit;
      sec.classList.toggle('hidden-by-search', !show);
      if (show) any = true;
      toggleSec(sec, q ? show : Array.prototype.indexOf.call(main.children, sec) === 0);
    });
    let em = main.querySelector('.empty');
    if (!any) { if (!em) { em = document.createElement('div'); em.className = 'empty'; em.textContent = 'لا نتائج مطابقة'; main.appendChild(em); } }
    else if (em) em.remove();
  }

  function switchMode(m) {
    if (m === mode) return;
    setMode(m);
    toc.querySelectorAll('.bab-link,.toc-back').forEach((a) => a.remove());
    tocLinks.length = 0;
    main.innerHTML = '';
    if (m === 'unified') { buildUnified(); openSec(0, true); }
    else if (m === 'books') { buildBooks(); openSec(0, true); }
    else buildReadToc();
    applySearch();
  }

  $('#tab-unified').addEventListener('click', () => switchMode('unified'));
  $('#tab-books').addEventListener('click', () => switchMode('books'));
  $('#tab-read').addEventListener('click', () => switchMode('read'));

  // رابط من الذرة إلى نصها الكامل في القارئ
  document.addEventListener('click', (e) => {
    const el = e.target.closest('.atom[data-read]');
    if (!el) return;
    const [code, id] = el.dataset.read.split('/');
    openReader(code, id);
  });
  $('#expand-all').addEventListener('click', () => main.querySelectorAll('.bab').forEach((s) => toggleSec(s, true)));
  $('#collapse-all').addEventListener('click', () => main.querySelectorAll('.bab').forEach((s) => toggleSec(s, false)));
  search.addEventListener('input', applySearch);

  buildUnified();
  openSec(0, true);
})();
