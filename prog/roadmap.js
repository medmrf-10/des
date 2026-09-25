/* برمج — خريطة الطريق: شجرة SVG مسار←وحدات من COURSES، ملوّنة بالتقدم */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ls = k => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
const v1 = ls('prog_v1'), lab = ls('prog_lab'), proj = ls('prog_proj'), lvl = ls('prog_level');
const courses = v1.courses || {};
const C = window.COURSES || { tracks: [] };

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (t, at) => { const e = document.createElementNS(NS, t); for (const k in at) e.setAttribute(k, at[k]); return e; };
const colorOf = p => p >= 0.8 ? '#6fc76f' : p >= 0.4 ? '#d4af37' : p >= 0.05 ? '#8a6d1f' : '#555';
const cKey = (ti, cid, ch, li) => `${ti}|${cid}|${ch}|${li}`;

/* تقدم كورس: دروس مكتملة/الكل */
const coursePct = (ti, c) => {
  let tot = 0, dn = 0;
  (c.chapters || []).forEach((ch, chi) => (ch.lessons || []).forEach((_, li) => { tot++; if (courses[cKey(ti, c.id, chi, li)]) dn++; }));
  return { tot, dn, pct: tot ? dn / tot : 0 };
};

/* إحصاء الرأس: تقدم كلي + إشارات المخازن الأخرى */
const head = () => {
  let tot = 0, dn = 0;
  C.tracks.forEach((t, ti) => (t.courses || []).forEach(c => { const p = coursePct(ti, c); tot += p.tot; dn += p.dn; }));
  const labDone = Object.keys(lab).filter(k => !k.startsWith('pg:') && lab[k]).length;
  const projDone = Object.values(proj).filter(v => v).length;
  const levels = Object.values(lvl).filter(v => v != null).length;
  $('#rdStats').innerHTML = [
    `<b>${dn}</b> درساً مكتملاً من ${tot} <i class="rd-mini"><i style="width:${tot ? Math.round(dn / tot * 100) : 0}%"></i></i>`,
    `<b>${labDone}</b> تحدي مختبر`,
    `<b>${projDone}</b> خطوة مشروع`,
    `<b>${levels}</b> مستوى محقّق`].map(x => `<span>${x}</span>`).join('');
};

/* الشجرة: عمود مسارات على اليمين؛ المسار الموسّع تتفرع وحداته يساراً */
const NW = 300, NH = 46, UNW = 260, UNH = 38, GAP = 12, TX = 700, UX = 60;
let open = null, selNode = null;

const trackPct = (ti) => {
  let tot = 0, dn = 0;
  (C.tracks[ti].courses || []).forEach(c => { const p = coursePct(ti, c); tot += p.tot; dn += p.dn; });
  return { tot, dn, pct: tot ? dn / tot : 0 };
};

function layout() {
  /* صفّ المسارات؛ المفتوح يدفع أخوته لأسفل بقدر وحداته */
  const rows = [];
  let y = GAP;
  C.tracks.forEach((t, ti) => {
    rows.push({ kind: 'track', ti, y });
    y += NH + GAP;
    if (ti === open) {
      (t.courses || []).forEach((c, ci) => { rows.push({ kind: 'unit', ti, ci, c, y }); y += UNH + 6; });
      y += 4;
    }
  });
  return { rows, H: y + GAP };
}

function draw() {
  const { rows, H } = layout();
  const W = TX + NW + 40;
  const svg = $('#rdSvg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', '100%');
  svg.innerHTML = '';

  const trackRow = {};
  rows.forEach(r => {
    if (r.kind === 'track') {
      const t = C.tracks[r.ti];
      const p = trackPct(r.ti);
      trackRow[r.ti] = r;
      const g = svgEl('g', { class: 'rd-node', transform: `translate(${TX},${r.y})` });
      g.appendChild(svgEl('rect', { width: NW, height: NH, rx: 12, fill: 'var(--card)', stroke: selNode === `t${r.ti}` ? 'var(--acc2)' : 'var(--border)', 'stroke-width': 1.4 }));
      g.appendChild(svgEl('rect', { width: 6, height: NH, rx: 3, fill: colorOf(p.pct) }));
      const name = svgEl('text', { x: NW - 18, y: 20, 'text-anchor': 'end', class: 'rd-name' }); name.textContent = t.name;
      const meta = svgEl('text', { x: NW - 18, y: 37, 'text-anchor': 'end', class: 'rd-meta' });
      meta.textContent = `${(t.courses || []).length} وحدات • ${p.dn}/${p.tot} • ${Math.round(p.pct * 100)}%`;
      const tog = svgEl('text', { x: 20, y: NH / 2 + 5, 'text-anchor': 'middle', class: 'rd-tog' }); tog.textContent = open === r.ti ? '−' : '+';
      g.append(name, meta, tog);
      g.addEventListener('click', () => { open = open === r.ti ? null : r.ti; selNode = `t${r.ti}`; draw(); showTrack(r.ti); });
      svg.appendChild(g);
    } else {
      /* وحدة: وصلة منحنية من حافة المسار + عقدة صغيرة */
      const ty = trackRow[r.ti].y + NH;
      const x1 = TX - 4, y1 = ty, x2 = UX + UNW + 30, y2 = r.y + UNH / 2;
      const path = svgEl('path', { d: `M ${x1} ${y1} C ${x1 - 70} ${y1}, ${x2 + 90} ${y2}, ${x2} ${y2}`, fill: 'none', stroke: 'var(--border)', 'stroke-width': 1.2 });
      svg.appendChild(path);
      const p = coursePct(r.ti, r.c);
      const g = svgEl('g', { class: 'rd-node rd-unit', transform: `translate(${UX},${r.y})` });
      g.appendChild(svgEl('rect', { width: UNW, height: UNH, rx: 10, fill: 'var(--card2)', stroke: selNode === `u${r.ti}-${r.ci}` ? 'var(--acc2)' : 'var(--border)', 'stroke-width': 1 }));
      g.appendChild(svgEl('rect', { width: 5, height: UNH, rx: 2.5, fill: colorOf(p.pct) }));
      const nm = svgEl('text', { x: UNW - 14, y: 16, 'text-anchor': 'end', class: 'rd-uname' });
      nm.textContent = r.c.title.length > 30 ? r.c.title.slice(0, 29) + '…' : r.c.title;
      const mt = svgEl('text', { x: UNW - 14, y: 31, 'text-anchor': 'end', class: 'rd-meta' });
      mt.textContent = `${r.c.level || ''} • ${p.dn}/${p.tot} درساً`;
      g.append(nm, mt);
      g.addEventListener('click', () => { selNode = `u${r.ti}-${r.ci}`; draw(); showUnit(r.ti, r.ci); });
      svg.appendChild(g);
    }
  });
}

function showTrack(ti) {
  const t = C.tracks[ti], p = trackPct(ti);
  $('#rdDetail').classList.remove('rd-hidden');
  $('#rdDetail').innerHTML = `
    <button class="rd-x" id="rdX">×</button>
    <span class="rf-cat-tag">مسار</span>
    <h3>${escH(t.name)}</h3>
    <div class="rd-d-pct"><i class="rd-mini"><i style="width:${Math.round(p.pct * 100)}%"></i></i> ${p.dn}/${p.tot} درساً (${Math.round(p.pct * 100)}%)</div>
    <div class="rd-d-c">${(t.courses || []).length} وحدات: ${(t.courses || []).map(c => `<div>• ${escH(c.title)}</div>`).join('')}</div>
    <a class="rd-d-lnk" href="index.html#courses">افتح تبويب الكورسات ↗</a>`;
  $('#rdX').onclick = () => $('#rdDetail').classList.add('rd-hidden');
}

function showUnit(ti, ci) {
  const c = C.tracks[ti].courses[ci], p = coursePct(ti, c);
  const chs = (c.chapters || []).map((ch, chi) => {
    const dn = (ch.lessons || []).filter((_, li) => courses[cKey(ti, c.id, chi, li)]).length;
    return `<div class="rd-d-ch">${escH(ch.name)} <span>${dn}/${(ch.lessons || []).length}</span></div>`;
  }).join('');
  $('#rdDetail').classList.remove('rd-hidden');
  $('#rdDetail').innerHTML = `
    <button class="rd-x" id="rdX">×</button>
    <span class="rf-cat-tag">وحدة • ${escH(C.tracks[ti].name)}</span>
    <h3>${escH(c.title)}</h3>
    <div class="rd-d-meta">${escH(c.subject || '')} ${c.instructor ? '• ' + escH(c.instructor) : ''} ${c.level ? '• ' + escH(c.level) : ''}</div>
    <div class="rd-d-pct"><i class="rd-mini"><i style="width:${Math.round(p.pct * 100)}%"></i></i> ${p.dn}/${p.tot} درساً (${Math.round(p.pct * 100)}%)</div>
    ${chs}
    <a class="rd-d-lnk" href="index.html#courses=${ti}:${ci}">افتح الوحدة في الكورسات ↗</a>`;
  $('#rdX').onclick = () => $('#rdDetail').classList.add('rd-hidden');
}

head(); draw();
})();
