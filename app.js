(function () {
  const CHARS = window.CHARS, ERAS = window.ERAS;
  const W = 1400, H = 1000;

  // Where each faction's cluster sits on the map (fractions of W/H).
  // Neighbors are placed next to the groups they share the most history with.
  const GROUPS = {
    titans:      { l: 'Titans & World-Soul',  x: .50, y: .04 },
    light:       { l: 'Naaru & Draenei',      x: .20, y: .12 },
    void:        { l: 'Old Gods & the Void',  x: .82, y: .12 },
    magi:        { l: 'Guardians & Kirin Tor',x: .34, y: .32 },
    dragons:     { l: 'Dragonflights',        x: .68, y: .32 },
    legion:      { l: 'The Burning Legion',   x: .08, y: .40 },
    alliance:    { l: 'The Alliance',         x: .47, y: .55 },
    kaldorei:    { l: 'Elves of Kalimdor',    x: .94, y: .50 },
    oldhorde:    { l: 'The Old Horde',        x: .14, y: .74 },
    scourge:     { l: 'The Scourge',          x: .30, y: .96 },
    horde:       { l: 'The Horde',            x: .55, y: .86 },
    quel:        { l: "Elves of Quel'Thalas", x: .80, y: .74 },
    shadowlands: { l: 'The Shadowlands',      x: .92, y: .98 }
  };
  const ALIGN = { hero: 'Hero', villain: 'Villain', fallen: 'Fallen hero', redeemed: 'Redeemed', grey: 'Morally grey' };
  const REL = {
    family:  { l: 'Family' },
    romance: { l: 'Love' },
    ally:    { l: 'Ally' },
    rival:   { l: 'Rival or enemy' },
    mentor:  { l: 'Mentor or maker', dir: 1, st: 'dash', out: 'Mentor to', in: 'Mentored by' },
    slew:    { l: 'Killed', dir: 1, out: 'Killed', in: 'Killed by' },
    corrupt: { l: 'Corrupted', dir: 1, st: 'dash', out: 'Corrupted', in: 'Corrupted by' },
    serves:  { l: 'Served', dir: 1, st: 'dot', out: 'Served', in: 'Served by' }
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const R = d => [0, 7, 10, 15][d.i];

  const nodes = CHARS;
  const byId = new Map(nodes.map(n => [n.id, n]));
  const links = window.LINKS.filter(([a, b]) => {
    const ok = byId.has(a) && byId.has(b);
    if (!ok) console.warn('Unknown character in link', a, b);
    return ok;
  }).map(([a, b, type, d]) => ({ source: a, target: b, type, d, vis: true }));
  const adj = new Map(nodes.map(n => [n.id, []]));
  links.forEach(l => { adj.get(l.source).push(l); adj.get(l.target).push(l); });

  const evByChar = new Map();
  ERAS.forEach(era => era.events.forEach((ev, j) => {
    ev.id = era.id + '-' + j; ev.era = era;
    ev.c.forEach(c => {
      if (!byId.has(c)) { console.warn('Unknown character in event', c); return; }
      if (!evByChar.has(c)) evByChar.set(c, []);
      evByChar.get(c).push(ev);
    });
  }));

  // ---------- Layout ----------
  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id)
      .distance(l => l.source.g === l.target.g ? 55 : 150)
      .strength(l => l.source.g === l.target.g ? .3 : .015))
    .force('charge', d3.forceManyBody().strength(-260))
    .force('x', d3.forceX(d => GROUPS[d.g].x * W).strength(.085))
    .force('y', d3.forceY(d => GROUPS[d.g].y * H).strength(.085))
    .force('collide', d3.forceCollide(d => R(d) + 22).iterations(3))
    .stop();
  for (let i = 0; i < 450; i++) sim.tick();

  // ---------- Drawing ----------
  const graphEl = document.getElementById('graph');
  const svg = d3.select('#svg');
  const defs = svg.append('defs');
  Object.entries(REL).filter(([, r]) => r.dir).forEach(([t]) => {
    defs.append('marker').attr('id', 'm-' + t).attr('class', 't-' + t)
      .attr('viewBox', '0 0 10 10').attr('refX', 9).attr('refY', 5)
      .attr('markerUnits', 'userSpaceOnUse').attr('markerWidth', 9).attr('markerHeight', 9)
      .attr('orient', 'auto')
      .append('path').attr('d', 'M0,0L10,5L0,10z');
  });
  const root = svg.append('g');
  const gLabels = root.append('g');
  const gLinks = root.append('g');
  const gHits = root.append('g');
  const gNodes = root.append('g');

  const groupLabelSel = gLabels.selectAll('text').data(Object.keys(GROUPS)).join('text')
    .attr('class', 'glabel').text(g => GROUPS[g].l);

  const linkSel = gLinks.selectAll('path').data(links).join('path')
    .attr('class', l => 'link t-' + l.type)
    .attr('marker-end', l => REL[l.type].dir ? `url(#m-${l.type})` : null);
  const hitSel = gHits.selectAll('path').data(links).join('path').attr('class', 'linkhit')
    .on('mousemove', (e, l) => showTip(linkTip(l), e))
    .on('mouseleave', hideTip);

  const nodeSel = gNodes.selectAll('g').data(nodes).join('g')
    .attr('class', d => `node i${d.i} al-${d.a}`)
    .attr('tabindex', 0).attr('role', 'button').attr('aria-label', d => d.n)
    .on('mouseenter', (e, d) => { hovered = d.id; applyFocus(); })
    .on('mousemove', (e, d) => showTip(nodeTip(d), e))
    .on('mouseleave', () => { hovered = null; applyFocus(); hideTip(); })
    .on('click', (e, d) => { e.stopPropagation(); select(selected === d.id ? null : d.id); })
    .on('keydown', (e, d) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(d.id); } });
  nodeSel.filter(d => d.i === 3).append('circle').attr('class', 'halo').attr('r', d => R(d) + 4.5);
  nodeSel.append('circle').attr('class', 'core').attr('r', R);
  nodeSel.append('text').attr('y', d => R(d) + (d.i === 3 ? 17 : 14)).text(d => d.n.replace(/ \(.*\)$/, ''));

  function curve(l) {
    const s = l.source, t = l.target;
    const dx = t.x - s.x, dy = t.y - s.y, dist = Math.hypot(dx, dy) || 1;
    const off = dist * .12;
    const mx = (s.x + t.x) / 2 - dy / dist * off, my = (s.y + t.y) / 2 + dx / dist * off;
    const cx = t.x - mx, cy = t.y - my, cl = Math.hypot(cx, cy) || 1;
    const back = R(t) + (REL[l.type].dir ? 2 : 0);
    return `M${s.x},${s.y}Q${mx},${my} ${t.x - cx / cl * back},${t.y - cy / cl * back}`;
  }
  function draw() {
    linkSel.attr('d', curve);
    hitSel.attr('d', curve);
    nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
    groupLabelSel.each(function (g) {
      const ms = nodes.filter(n => n.g === g);
      const x = d3.mean(ms, n => n.x), y = d3.min(ms, n => n.y - R(n));
      d3.select(this).attr('x', x).attr('y', y - 26);
    });
  }
  draw();
  sim.on('tick', draw);

  nodeSel.call(d3.drag()
    .on('start', (e, d) => { if (!e.active) sim.alphaTarget(.12).restart(); d.fx = d.x; d.fy = d.y; hideTip(); })
    .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
    .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

  const zoom = d3.zoom().scaleExtent([.25, 4]).on('zoom', e => {
    const k = e.transform.k;
    root.attr('transform', e.transform);
    svg.classed('far', k < .42);
    const ls = Math.min(1.9, Math.max(1, 1 / Math.sqrt(k)));
    nodeSel.select('text').style('font-size', d => (d.i === 3 ? 16 : d.i === 2 ? 13.5 : 12) * ls + 'px')
      .attr('y', d => R(d) + (d.i === 3 ? 17 : 13) * ls);
    groupLabelSel.style('font-size', 26 * ls + 'px');
  });
  svg.call(zoom).on('dblclick.zoom', null);
  svg.on('click', () => { if (selected) select(null); });
  document.getElementById('zin').onclick = () => svg.transition().duration(250).call(zoom.scaleBy, 1.35);
  document.getElementById('zout').onclick = () => svg.transition().duration(250).call(zoom.scaleBy, 1 / 1.35);

  function fit(dur) {
    const { width, height } = graphEl.getBoundingClientRect();
    if (!width) return;
    const vis = nodes.filter(n => alignOn.has(n.a));
    const pts = vis.length ? vis : nodes;
    const x0 = d3.min(pts, n => n.x) - 150, x1 = d3.max(pts, n => n.x) + 150;
    const y0 = d3.min(pts, n => n.y) - 80, y1 = d3.max(pts, n => n.y) + 50;
    const k = Math.min(width / (x1 - x0), height / (y1 - y0), 1.4);
    const t = d3.zoomIdentity.translate(width / 2 - k * (x0 + x1) / 2, height / 2 - k * (y0 + y1) / 2).scale(k);
    (dur ? svg.transition().duration(dur) : svg).call(zoom.transform, t);
  }
  function zoomTo(d) {
    const { width, height } = graphEl.getBoundingClientRect();
    const k = Math.max(1.1, d3.zoomTransform(svg.node()).k);
    svg.transition().duration(600).call(zoom.transform,
      d3.zoomIdentity.translate(width / 2 - d.x * k, height / 2 - d.y * k).scale(k));
  }

  // ---------- Tooltip ----------
  const tip = document.getElementById('tip');
  function showTip(html, e) {
    tip.innerHTML = html; tip.hidden = false;
    const r = graphEl.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = e.clientX - r.left + 16, y = e.clientY - r.top + 16;
    if (x + tw > r.width - 8) x = e.clientX - r.left - tw - 16;
    if (y + th > r.height - 8) y = Math.max(8, r.height - th - 8);
    tip.style.left = Math.max(8, x) + 'px'; tip.style.top = y + 'px';
  }
  function hideTip() { tip.hidden = true; }
  const shortName = n => n.n.replace(/ \(.*\)$/, '');
  const WIKI = window.WIKI || { chars: {}, events: {} };
  const wikiUrl = title => 'https://warcraft.wiki.gg/wiki/' + encodeURIComponent(title.replace(/ /g, '_')).replace(/%3A/g, ':').replace(/%2C/g, ',');
  function readMore(list) {
    if (!list || !list.length) return '';
    return `<div class="more"><span class="more-label">Read more</span>${list.map(([label, title]) =>
      `<a href="${wikiUrl(title)}" target="_blank" rel="noopener">${esc(label)}<span aria-hidden="true"> \u2197</span></a>`).join('')}</div>`;
  }
  const READING = window.READING || { articles: [], chars: {}, events: {} };
  function evStory(id) {
    const ps = (window.EVENT_STORIES || {})[id];
    if (!ps || !ps.length) return '';
    const mins = Math.max(1, Math.round(ps.join(' ').split(/\s+/).length / 230));
    return `<button type="button" class="storybtn" data-toggle="1" aria-expanded="false" aria-controls="st-${id}">` +
      `<span class="chev" aria-hidden="true"></span><span class="tl">Read the full story</span><span class="mins">${mins} min</span></button>` +
      `<div class="evstory" id="st-${id}" hidden>${ps.map(p => `<p>${esc(p)}</p>`).join('')}</div>`;
  }
  function essays(ids) {
    if (!ids || !ids.length) return '';
    return `<div class="essays"><span class="more-label">Essays \u00b7 Blizzard Watch</span><ul>${ids.map(i => READING.articles[i]).map(a =>
      `<li><a href="${esc(a.u)}" target="_blank" rel="noopener">${esc(a.t)}<span aria-hidden="true"> \u2197</span></a> <span class="yr">${a.y}</span>${a.s ? ' <span class="spec">speculation</span>' : ''}</li>`).join('')}</ul></div>`;
  }
  function nodeTip(d) {
    return `<span class="badge al-${d.a}">${ALIGN[d.a]}</span>
      <h4>${esc(d.n)}</h4><div class="sub">${esc(d.r)} \u00b7 ${esc(d.t)}</div>
      <div class="meta"><span>${esc(d.s)}</span><span>${adj.get(d.id).length} ties</span><span>${esc(GROUPS[d.g].l)}</span></div>
      <p>${esc(d.b)}</p>`;
  }
  function linkTip(l) {
    const r = REL[l.type];
    const join = r.dir ? ' \u2192 ' : ' & ';
    return `<span class="badge" style="--c:var(--r-${l.type})">${r.l}</span>
      <h4 style="font-size:16px">${esc(shortName(l.source))}${join}${esc(shortName(l.target))}</h4><p>${esc(l.d)}</p>`;
  }

  // ---------- State and focus ----------
  let hovered = null, selected = null;
  const alignOn = new Set(Object.keys(ALIGN));
  const relOn = new Set(Object.keys(REL));

  function applyFilters() {
    links.forEach(l => { l.vis = relOn.has(l.type) && alignOn.has(l.source.a) && alignOn.has(l.target.a); });
    nodeSel.classed('off', d => !alignOn.has(d.a));
    linkSel.classed('off', l => !l.vis);
    hitSel.classed('off', l => !l.vis);
    if (selected && !alignOn.has(byId.get(selected).a)) select(null); else applyFocus();
  }
  function applyFocus() {
    const id = hovered || selected;
    svg.classed('focus', !!id);
    nodeSel.classed('sel', d => d.id === selected);
    if (!id) { nodeSel.classed('dim', false); linkSel.classed('dim', false).classed('hot', false); hitSel.classed('dim', false); return; }
    const near = new Set([id]);
    adj.get(id).forEach(l => { if (l.vis) { near.add(l.source.id); near.add(l.target.id); } });
    const touches = l => l.source.id === id || l.target.id === id;
    nodeSel.classed('dim', d => !near.has(d.id));
    linkSel.classed('dim', l => !touches(l)).classed('hot', touches);
    hitSel.classed('dim', l => !touches(l));
  }

  // ---------- Dossier panel ----------
  const panel = document.getElementById('panel');
  const STARTERS = ['thrall', 'arthas', 'sylvanas', 'jaina', 'illidan', 'xalatath', 'anduin', 'deathwing'];

  function renderIntro() {
    const counts = {}; nodes.forEach(n => counts[n.a] = (counts[n.a] || 0) + 1);
    panel.innerHTML = `
      <h2>Reading the map</h2>
      <p>${nodes.length} characters and ${links.length} ties from thirty years of Warcraft.</p>
      <ul class="howto">
        <li><b>Color</b> is the side a character ended up on. <i>Fallen</i> heroes started good and turned; <i>redeemed</i> ones did the reverse.</li>
        <li><b>Position</b> is the faction they belong to. Labels float above each cluster.</li>
        <li><b>Lines</b> are relationships. Arrows point from the one who acted: killer to victim, master to servant.</li>
        <li><b>Big ringed dots</b> are the central figures of the saga.</li>
      </ul>
      <h3>Start with</h3>
      <div class="starters">${STARTERS.map(id => chipFor(id)).join('')}</div>
      <h3>By side</h3>
      <ul class="evlist">${Object.keys(ALIGN).map(a => `<li><span class="badge al-${a}">${ALIGN[a]}</span> <span class="yr">${counts[a] || 0}</span></li>`).join('')}</ul>`;
  }
  function chipFor(id) {
    const c = byId.get(id);
    return `<button type="button" class="cchip al-${c.a}" data-char="${c.id}">${esc(shortName(c))}</button>`;
  }
  function renderChar(id) {
    const d = byId.get(id);
    const mine = adj.get(id);
    const rows = Object.keys(REL).flatMap(type => mine.filter(l => l.type === type).map(l => {
      const out = l.source.id === id, other = out ? l.target : l.source, r = REL[type];
      const label = r.dir ? (out ? r.out : r.in) : r.l;
      return `<li><span class="sw line ${r.st || ''} t-${type}" aria-hidden="true"></span>
        <div><span class="rt">${label}</span> <button type="button" class="linkbtn" data-char="${other.id}">${esc(other.n)}</button>
        <div class="why">${esc(l.d)}</div></div></li>`;
    })).join('');
    const evs = evByChar.get(id) || [];
    panel.innerHTML = `
      <span class="badge al-${d.a}">${ALIGN[d.a]}</span>
      <h2>${esc(d.n)}</h2>
      <div class="sub">${esc(d.r)} \u00b7 ${esc(d.t)}</div>
      <div class="meta"><span>${esc(d.s)}</span><span>${esc(GROUPS[d.g].l)}</span></div>
      <p>${esc(d.b)}</p>
      ${readMore(WIKI.chars[id] ? [['Warcraft Wiki', WIKI.chars[id]]] : [])}
      ${essays(READING.chars[id])}
      <h3>Ties \u00b7 ${mine.length}</h3>
      <ul class="rels">${rows}</ul>
      ${evs.length ? `<h3>In the timeline \u00b7 ${evs.length}</h3>
      <ul class="evlist">${evs.map(ev => `<li><span class="yr">${esc(ev.y)}</span> \u00b7 <button type="button" class="linkbtn" data-ev="${ev.id}">${esc(ev.t)}</button></li>`).join('')}</ul>` : ''}
      <p><button type="button" class="btn" data-clear="1">Back to overview</button></p>`;
    panel.scrollTop = 0;
  }
  function select(id) {
    selected = id;
    applyFocus();
    id ? renderChar(id) : renderIntro();
  }
  panel.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.char) goToChar(b.dataset.char);
    else if (b.dataset.ev) goToEvent(b.dataset.ev);
    else if (b.dataset.clear) select(null);
  });

  function goToChar(id) {
    const d = byId.get(id); if (!d) return;
    showView('web');
    if (!alignOn.has(d.a)) { alignOn.add(d.a); syncChips(); applyFilters(); }
    select(id);
    zoomTo(d);
  }

  // ---------- Toolbar ----------
  const alignBox = document.getElementById('alignChips');
  const relBox = document.getElementById('relChips');
  Object.entries(ALIGN).forEach(([a, l]) => {
    alignBox.insertAdjacentHTML('beforeend',
      `<button type="button" class="chip" data-align="${a}" aria-pressed="true"><span class="sw" style="color:var(--a-${a});background:var(--a-${a})"></span>${l}</button>`);
  });
  Object.entries(REL).forEach(([t, r]) => {
    relBox.insertAdjacentHTML('beforeend',
      `<button type="button" class="chip" data-rel="${t}" aria-pressed="true"><span class="sw line ${r.st || ''} t-${t}"></span>${r.l}</button>`);
  });
  function syncChips() {
    alignBox.querySelectorAll('[data-align]').forEach(b => b.setAttribute('aria-pressed', alignOn.has(b.dataset.align)));
    relBox.querySelectorAll('[data-rel]').forEach(b => b.setAttribute('aria-pressed', relOn.has(b.dataset.rel)));
  }
  alignBox.addEventListener('click', e => {
    const b = e.target.closest('[data-align]'); if (!b) return;
    const a = b.dataset.align; alignOn.has(a) ? alignOn.delete(a) : alignOn.add(a);
    syncChips(); applyFilters();
  });
  relBox.addEventListener('click', e => {
    const b = e.target.closest('[data-rel]'); if (!b) return;
    const t = b.dataset.rel; relOn.has(t) ? relOn.delete(t) : relOn.add(t);
    syncChips(); applyFilters();
  });

  const q = document.getElementById('q');
  document.getElementById('names').innerHTML = nodes.slice().sort((a, b) => a.n.localeCompare(b.n))
    .map(n => `<option value="${esc(n.n)}"></option>`).join('');
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f'\u2019]/g, '');
  function matches() {
    const v = norm(q.value.trim());
    return v.length < 2 ? [] : nodes.filter(n => norm(n.n).includes(v) || norm(n.t).includes(v));
  }
  q.addEventListener('input', () => {
    const m = new Set(matches().map(n => n.id));
    nodeSel.classed('match', d => m.has(d.id));
    const exact = nodes.find(n => n.n === q.value);
    if (exact) goToChar(exact.id);
  });
  q.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const m = matches(); if (m.length) goToChar(m[0].id);
  });
  document.getElementById('resetBtn').onclick = () => {
    Object.keys(ALIGN).forEach(a => alignOn.add(a)); Object.keys(REL).forEach(t => relOn.add(t));
    q.value = ''; nodeSel.classed('match', false);
    syncChips(); applyFilters(); select(null); fit(500);
  };

  // ---------- Timeline ----------
  const eraNav = document.getElementById('eraNav');
  const eraList = document.getElementById('eraList');
  eraNav.innerHTML = ERAS.map(era =>
    `<button type="button" class="era-btn" data-era="${era.id}"><b>${esc(era.name)}</b><span>${esc(era.span)} \u00b7 ${era.events.length} events</span></button>`).join('');
  eraList.innerHTML = ERAS.map(era => `
    <section class="era" id="era-${era.id}">
      <div class="era-head">
        <div class="span">${esc(era.span)}</div>
        <h2>${esc(era.name)}</h2>
        <p>${esc(era.blurb)}</p>
        ${era.forces ? `<div class="forces">${era.forces.map(([a, b]) => `<div class="force"><span>${esc(a)}</span><span>opposes ${esc(b)}</span></div>`).join('')}</div>` : ''}
        ${era.games.length ? `<div class="games">${era.games.map(g => `<span class="game">${esc(g)}</span>`).join('')}</div>` : ''}
      </div>
      <ol class="events">${era.events.map(ev => `
        <li class="ev${ev.upcoming ? ' upcoming' : ''}" id="ev-${ev.id}">
          <div class="yr">${esc(ev.y)}</div>
          <div class="card">
            <h4>${esc(ev.t)}</h4>
            <p>${esc(ev.d)}</p>
            ${evStory(ev.id)}
            ${readMore(WIKI.events[ev.id])}
            ${essays(READING.events[ev.id])}
            ${ev.rel ? `<div class="rel">${ev.upcoming ? '' : 'Released '}${esc(ev.rel)}</div>` : ''}
            ${ev.c.length ? `<div class="cchips">${ev.c.filter(c => byId.has(c)).map(chipFor).join('')}</div>` : ''}
          </div>
        </li>`).join('')}
      </ol>
    </section>`).join('');
  eraNav.addEventListener('click', e => {
    const b = e.target.closest('[data-era]'); if (!b) return;
    document.getElementById('era-' + b.dataset.era).scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  eraList.addEventListener('click', e => {
    const t = e.target.closest('[data-toggle]');
    if (t) { toggleStory(t.closest('.ev'), t.getAttribute('aria-expanded') !== 'true'); return; }
    const b = e.target.closest('[data-char]'); if (b) goToChar(b.dataset.char);
  });
  function toggleStory(li, open) {
    const btn = li && li.querySelector('[data-toggle]'); if (!btn) return;
    btn.setAttribute('aria-expanded', open);
    li.querySelector('.evstory').hidden = !open;
    btn.querySelector('.tl').textContent = open ? 'Hide the full story' : 'Read the full story';
    li.classList.toggle('open', open);
  }
  const allBtn = document.getElementById('toggleAll');
  if (allBtn) {
    if (!eraList.querySelector('[data-toggle]')) allBtn.hidden = true;
    allBtn.addEventListener('click', () => {
      const open = allBtn.getAttribute('aria-pressed') !== 'true';
      eraList.querySelectorAll('.ev').forEach(li => toggleStory(li, open));
      allBtn.setAttribute('aria-pressed', open);
      allBtn.textContent = open ? 'Collapse all stories' : 'Expand all stories';
    });
  }
  eraList.addEventListener('mouseover', e => {
    const b = e.target.closest('.cchip'); if (!b) return;
    b.title = byId.get(b.dataset.char).t;
  });
  function goToEvent(id) {
    showView('time');
    const li = document.getElementById('ev-' + id); if (!li) return;
    toggleStory(li, true);
    li.scrollIntoView({ behavior: 'smooth', block: 'start' });
    li.classList.add('flash');
    setTimeout(() => li.classList.remove('flash'), 1800);
  }

  // ---------- Races ----------
  const RACES = window.RACES || [];
  const raceById = new Map(RACES.map(r => [r.id, r]));
  const FACTIONS = { alliance: 'Alliance', horde: 'Horde', both: 'Open to both factions', other: 'Other peoples' };
  const raceNav = document.getElementById('raceNav');
  const raceSel = document.getElementById('raceSelect');
  const raceBody = document.getElementById('raceBody');
  const isAllied = r => /^Allied/.test(r.tag);
  raceNav.innerHTML = Object.entries(FACTIONS).map(([f, label]) => {
    const list = RACES.filter(r => r.f === f);
    return `<div class="rgroup f-${f}"><h3>${label}<span>${list.length}</span></h3><ul>${list.map(r =>
      `<li><button type="button" class="rbtn" data-race="${r.id}">${esc(r.n)}${isAllied(r) ? '<span class="atag">Allied</span>' : ''}</button></li>`).join('')}</ul></div>`;
  }).join('');
  raceSel.innerHTML = Object.entries(FACTIONS).map(([f, label]) =>
    `<optgroup label="${label}">${RACES.filter(r => r.f === f).map(r => `<option value="${r.id}">${esc(r.n)}</option>`).join('')}</optgroup>`).join('');
  function renderRace(id) {
    const r = raceById.get(id); if (!r) return;
    raceNav.querySelectorAll('.rbtn').forEach(b => b.setAttribute('aria-current', b.dataset.race === id ? 'true' : 'false'));
    raceSel.value = id;
    const facts = [['Homeland', r.home], ['Capital', r.cap], ['Led by', r.lead]].filter(x => x[1]);
    const figs = r.fig.filter(c => byId.has(c));
    const story = (window.RACE_STORIES || {})[id];
    const words = story ? story.reduce((n, [, ps]) => n + ps.join(' ').split(/\s+/).length, 0) : 0;
    raceBody.className = 'racebody f-' + r.f;
    raceBody.innerHTML = `
      <div class="rhead">
        <span class="fbadge">${FACTIONS[r.f]}</span><span class="rtag">${esc(r.tag)}</span>
        <h2>${esc(r.n)}</h2>${r.nn ? `<div class="sub">${esc(r.nn)}</div>` : ''}
      </div>
      <dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <p class="rsum">${esc(r.s)}</p>
      ${story ? `<p class="readtime">Full history below \u00b7 about ${Math.max(1, Math.round(words / 230))} minute read</p>` : ''}
      <div class="${story ? 'rmain' : 'rcols'}">
        ${story ? `<article class="story">${story.map(([head, paras]) =>
          `<section><h3>${esc(head)}</h3>${paras.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('')}</article>` : ''}
        <${story ? 'aside' : 'section'} class="raside">
          <h3>${story ? 'At a glance' : 'History'}</h3>
          <ol class="rhist">${r.h.map(([w, t]) => `<li><span class="yr">${esc(w)}</span><span>${esc(t)}</span></li>`).join('')}</ol>
        ${story ? '' : '</section><section>'}
          ${figs.length || r.more.length ? `<h3>Major figures</h3>
            ${figs.length ? `<div class="cchips">${figs.map(chipFor).join('')}</div>` : ''}
            ${r.more.length ? `<p class="also">${figs.length ? 'Also: ' : ''}${r.more.map(esc).join(' \u00b7 ')}</p>` : ''}` : ''}
          ${r.kin.length ? `<h3>Kin</h3><ul class="kin">${r.kin.filter(([k]) => raceById.has(k)).map(([k, t]) =>
            `<li><button type="button" class="linkbtn" data-race="${k}">${esc(raceById.get(k).n)}</button> <span class="why">${esc(t)}</span></li>`).join('')}</ul>` : ''}
          <h3>Further reading</h3>
          ${readMore([['Warcraft Wiki', r.wiki]])}
          ${essays(READING.races && READING.races[id])}
        </${story ? 'aside' : 'section'}>
      </div>`;
  }
  raceNav.addEventListener('click', e => { const b = e.target.closest('[data-race]'); if (b) renderRace(b.dataset.race); });
  raceSel.addEventListener('change', () => renderRace(raceSel.value));
  raceBody.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.char) goToChar(b.dataset.char);
    else if (b.dataset.race) {
      renderRace(b.dataset.race);
      if (raceBody.getBoundingClientRect().top < 0) raceBody.scrollIntoView({ block: 'start' });
    }
  });
  if (RACES.length) renderRace('humans');

  // Family tree
  const raceProfiles = document.getElementById('raceProfiles');
  const raceTree = document.getElementById('raceTree');
  const modeBtns = document.querySelectorAll('[data-rmode]');
  function setRaceMode(m) {
    raceProfiles.hidden = m !== 'profiles';
    raceTree.hidden = m !== 'tree';
    modeBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.rmode === m));
  }
  modeBtns.forEach(b => b.addEventListener('click', () => setRaceMode(b.dataset.rmode)));
  const SHORT = { lightforged: 'Lightforged', darkiron: 'Dark Iron', highmountain: 'Highmountain', kultirans: 'Kul Tirans',
    maghar: "Mag'har", zandalari: 'Zandalari', trolls: 'Trolls' };
  const nodeName = n => n.id ? (SHORT[n.id] || raceById.get(n.id).n) : n.p;
  function treeSVG(fam) {
    const NW = 116, NH = 32, DX = 130, DY = 86, PAD = 14;
    const root = d3.hierarchy(fam.root, d => d.c);
    const wOf = n => Math.max(NW, nodeName(n.data).length * (n.data.p ? 5.9 : 7.6) + 24);
    d3.tree().nodeSize([DX, DY]).separation((a, b) => Math.max(a.parent === b.parent ? 1 : 1.2, ((wOf(a) + wOf(b)) / 2 + 16) / DX))(root);
    let x0 = Infinity, x1 = -Infinity;
    root.each(n => { x0 = Math.min(x0, n.x - wOf(n) / 2); x1 = Math.max(x1, n.x + wOf(n) / 2); });
    const W = x1 - x0 + PAD * 2, H = root.height * DY + NH + PAD * 2;
    const X = n => n.x - x0 + PAD, Y = n => n.y + NH / 2 + PAD;
    const edges = root.links().map(({ source: s, target: t }) => {
      const my = (Y(s) + Y(t)) / 2 - 6;
      return `<path class="tedge${t.data.p ? ' soft' : ''}" d="M${X(s)},${Y(s) + NH / 2}V${my}H${X(t)}V${Y(t) - NH / 2}"/>` +
        (t.data.e ? `<text class="elabel" x="${X(t)}" y="${Y(t) - NH / 2 - 8}">${esc(t.data.e)}</text>` : '');
    }).join('');
    const nodes = root.descendants().map(n => {
      const race = n.data.id && raceById.get(n.data.id);
      const cls = race ? `tnode f-${race.f}` : 'tnode pseudo';
      const attrs = race ? ` data-race="${race.id}" tabindex="0" role="button" aria-label="Open ${esc(race.n)}"` : '';
      return `<g class="${cls}" transform="translate(${X(n)},${Y(n)})"${attrs}>
        <rect x="${-wOf(n) / 2}" y="${-NH / 2}" width="${wOf(n)}" height="${NH}" rx="8"/>
        <text y="4.5">${esc(nodeName(n.data))}</text></g>`;
    }).join('');
    return `<svg class="tree" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(fam.t)} family tree">${edges}${nodes}</svg>`;
  }
  const loners = window.FAMILY_LONERS;
  raceTree.innerHTML = `
    <div class="tlegend">
      <span><i class="lg f-alliance"></i>Alliance</span><span><i class="lg f-horde"></i>Horde</span>
      <span><i class="lg f-both"></i>Both factions</span><span><i class="lg f-other"></i>Other peoples</span>
      <span><i class="lg pseudo"></i>Ancestral group without its own page</span>
    </div>
    <div class="families">
      ${(window.FAMILIES || []).map(f => `<section class="fam${f.wide ? ' wide' : ''}">
        <h3>${esc(f.t)}</h3><p>${esc(f.d)}</p>
        <div class="treewrap">${treeSVG(f)}</div></section>`).join('')}
      ${loners ? `<section class="fam">
        <h3>${esc(loners.t)}</h3><p>${esc(loners.d)}</p>
        <div class="lonerow">${loners.ids.map(id => raceById.get(id)).map(r =>
          `<button type="button" class="lone f-${r.f}" data-race="${r.id}">${esc(r.n)}</button>`).join('')}</div></section>` : ''}
    </div>
    <section class="ties">
      <h3>Ties between families</h3>
      <ul>${(window.FAMILY_TIES || []).map(([a, b, t]) => `<li><button type="button" class="linkbtn" data-race="${a}">${esc(raceById.get(a).n)}</button> and <button type="button" class="linkbtn" data-race="${b}">${esc(raceById.get(b).n)}</button> <span class="why">${esc(t)}</span></li>`).join('')}</ul>
    </section>`;
  function openRace(id) {
    setRaceMode('profiles'); renderRace(id);
    document.getElementById('view-races').scrollIntoView({ block: 'start' });
  }
  raceTree.addEventListener('click', e => { const g = e.target.closest('[data-race]'); if (g) openRace(g.dataset.race); });
  raceTree.addEventListener('keydown', e => {
    const g = e.target.closest('g[data-race]');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openRace(g.dataset.race); }
  });
  setRaceMode('tree');

  // ---------- Views ----------
  const tabs = { web: document.getElementById('tab-web'), time: document.getElementById('tab-time'), races: document.getElementById('tab-races') };
  const views = { web: document.getElementById('view-web'), time: document.getElementById('view-time'), races: document.getElementById('view-races') };
  let fitted = false;
  function showView(v) {
    Object.keys(views).forEach(k => { views[k].hidden = k !== v; tabs[k].setAttribute('aria-selected', k === v); });
    hideTip();
    if (v === 'web' && !fitted) { fit(0); fitted = true; }
  }
  tabs.web.onclick = () => showView('web');
  tabs.time.onclick = () => showView('time');
  tabs.races.onclick = () => showView('races');

  renderIntro();
  applyFilters();
  showView({ '#timeline': 'time', '#races': 'races' }[location.hash] || 'web');
  let lastW = graphEl.clientWidth;
  window.addEventListener('resize', () => {
    if (views.web.hidden || graphEl.clientWidth === lastW) return;
    lastW = graphEl.clientWidth; fit(0);
  });
})();
