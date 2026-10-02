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
  function relRows(id) {
    return Object.keys(REL).flatMap(type => adj.get(id).filter(l => l.type === type).map(l => {
      const out = l.source.id === id, other = out ? l.target : l.source, r = REL[type];
      const label = r.dir ? (out ? r.out : r.in) : r.l;
      return `<li><span class="sw line ${r.st || ''} t-${type}" aria-hidden="true"></span>
        <div><span class="rt">${label}</span> <button type="button" class="linkbtn" data-char="${other.id}">${esc(other.n)}</button>
        <div class="why">${esc(l.d)}</div></div></li>`;
    })).join('');
  }
  function renderChar(id) {
    const d = byId.get(id);
    const mine = adj.get(id);
    const rows = relRows(id);
    const evs = evByChar.get(id) || [];
    panel.innerHTML = `
      <span class="badge al-${d.a}">${ALIGN[d.a]}</span>
      <h2>${esc(d.n)}</h2>
      <div class="sub">${esc(d.r)} \u00b7 ${esc(d.t)}</div>
      <div class="meta"><span>${esc(d.s)}</span><span>${esc(GROUPS[d.g].l)}</span></div>
      <p>${esc(d.b)}</p>
      ${bioButton(id)}
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
    else if (b.dataset.bio) openBio(b.dataset.bio);
  });

  // ---------- Full biographies ----------
  const bioView = document.getElementById('bioView');
  const webParts = [document.querySelector('#view-web .toolbar'), document.querySelector('#view-web .stage')];
  let bioScroll = 0;
  const wordsIn = st => st.reduce((n, [, ps]) => n + ps.join(' ').split(/\s+/).length, 0);
  const hasBio = id => !!(window.CHAR_BIOS || {})[id];
  function bioButton(id) {
    const st = (window.CHAR_BIOS || {})[id];
    if (!st) return '';
    return `<p><button type="button" class="storybtn" data-bio="${id}"><span class="chev" aria-hidden="true"></span>` +
      `<span class="tl">Read full biography</span><span class="mins">${Math.max(1, Math.round(wordsIn(st) / 230))} min</span></button></p>`;
  }
  const orgsOf = id => (window.ORGS || []).filter(o => o.leaders.includes(id) || o.members.includes(id));
  function openBio(id) {
    const d = byId.get(id), st = (window.CHAR_BIOS || {})[id];
    if (!d || !st) return;
    showView('web');
    if (bioView.hidden) bioScroll = window.scrollY;
    const mine = adj.get(id), evs = evByChar.get(id) || [], orgs = orgsOf(id);
    const back = '<p><button type="button" class="btn" data-back="1">&larr; Back to the map</button></p>';
    bioView.innerHTML = `${back}
      <article class="racebody bio al-${d.a}">
        <div class="rhead"><span class="badge al-${d.a}">${ALIGN[d.a]}</span><h2>${esc(d.n)}</h2><div class="sub">${esc(d.t)}</div></div>
        <dl class="facts">${[['Race', d.r], ['Status', d.s], ['Belongs to', GROUPS[d.g].l]].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <p class="rsum">${esc(d.b)}</p>
        <p class="readtime">Full biography below &middot; about ${Math.max(1, Math.round(wordsIn(st) / 230))} minute read</p>
        <div class="rmain">
          <article class="story">${st.map(([h, ps]) => `<section><h3>${esc(h)}</h3>${ps.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('')}</article>
          <aside class="raside">
            ${evs.length ? `<h3>In the timeline</h3><ol class="rhist">${evs.map(ev =>
              `<li><span class="yr">${esc(ev.y)}</span><span><button type="button" class="linkbtn" data-ev="${ev.id}">${esc(ev.t)}</button></span></li>`).join('')}</ol>` : ''}
            ${orgs.length ? `<h3>Factions</h3><ul class="kin">${orgs.map(o =>
              `<li><button type="button" class="linkbtn" data-org="${o.id}">${esc(o.n)}</button> <span class="why">${o.leaders.includes(id) ? 'Leader' : 'Member'}</span></li>`).join('')}</ul>` : ''}
            <h3>Ties &middot; ${mine.length}</h3>
            <ul class="rels">${relRows(id)}</ul>
            <h3>Further reading</h3>
            ${readMore(WIKI.chars[id] ? [['Warcraft Wiki', WIKI.chars[id]]] : [])}
            ${essays(READING.chars[id])}
          </aside>
        </div>
      </article>${back}`;
    webParts.forEach(el => { el.hidden = true; });
    bioView.hidden = false;
    hideTip();
    bioView.scrollIntoView({ block: 'start' });
  }
  function closeBio(restore) {
    if (bioView.hidden) return;
    bioView.hidden = true;
    webParts.forEach(el => { el.hidden = false; });
    if (restore) window.scrollTo(0, bioScroll);
  }
  bioView.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.back) closeBio(true);
    else if (b.dataset.char) { if (hasBio(b.dataset.char)) openBio(b.dataset.char); else goToChar(b.dataset.char); }
    else if (b.dataset.ev) goToEvent(b.dataset.ev);
    else if (b.dataset.org && typeof openOrg === 'function') openOrg(b.dataset.org);
  });

  function goToChar(id) {
    const d = byId.get(id); if (!d) return;
    closeBio(false);
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

  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f'\u2019]/g, '');
  document.getElementById('resetBtn').onclick = () => {
    Object.keys(ALIGN).forEach(a => alignOn.add(a)); Object.keys(REL).forEach(t => relOn.add(t));
    nodeSel.classed('match', false);
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
  setRaceMode('profiles');

  // ---------- Factions ----------
  const ORGS = window.ORGS || [];
  const orgById = new Map(ORGS.map(o => [o.id, o]));
  const orgNav = document.getElementById('orgNav');
  const orgSel = document.getElementById('orgSelect');
  const orgBody = document.getElementById('orgBody');
  const ORG_GROUPS = { hero: 'Orders and defenders', grey: 'Uneasy allies', villain: 'Cults and conspiracies' };
  const orgName = id => (orgById.get(id) || {}).n || id;
  if (ORGS.length) {
    orgNav.innerHTML = Object.entries(ORG_GROUPS).map(([a, label]) => {
      const list = ORGS.filter(o => o.align === a);
      return list.length ? `<div class="rgroup al-${a}"><h3>${label}<span>${list.length}</span></h3><ul>${list.map(o =>
        `<li><button type="button" class="rbtn" data-org="${o.id}">${esc(o.n)}</button></li>`).join('')}</ul></div>` : '';
    }).join('');
    orgSel.innerHTML = Object.entries(ORG_GROUPS).map(([a, label]) => {
      const list = ORGS.filter(o => o.align === a);
      return list.length ? `<optgroup label="${label}">${list.map(o => `<option value="${o.id}">${esc(o.n)}</option>`).join('')}</optgroup>` : '';
    }).join('');
  } else {
    orgBody.innerHTML = '<p class="rsum">Factions are being written.</p>';
  }
  function renderOrg(id) {
    const o = orgById.get(id); if (!o) return;
    orgNav.querySelectorAll('.rbtn').forEach(b => b.setAttribute('aria-current', b.dataset.org === id ? 'true' : 'false'));
    orgSel.value = id;
    const facts = [['Founded', o.founded], ['Based in', o.base], ['Status', o.status]].filter(x => x[1]);
    const lead = o.leaders.filter(c => byId.has(c)), mem = o.members.filter(c => byId.has(c) && !o.leaders.includes(c));
    const races = (o.races || []).map(r => raceById.get(r)).filter(Boolean);
    const evs = (o.events || []).map(e => ERAS.flatMap(x => x.events).find(ev => ev.id === e)).filter(Boolean);
    const words = wordsIn(o.story || []);
    orgBody.className = 'racebody org al-' + o.align;
    orgBody.innerHTML = `
      <div class="rhead"><span class="badge al-${o.align}">${esc(o.kind)}</span><h2>${esc(o.n)}</h2></div>
      <dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <p class="rsum">${esc(o.s)}</p>
      ${races.length > 1 ? `<div class="xrace"><span class="more-label">Crosses races</span>${races.map(r =>
        `<button type="button" class="lone f-${r.f}" data-race="${r.id}">${esc(r.n)}</button>`).join('')}</div>` : ''}
      <p class="readtime">About ${Math.max(1, Math.round(words / 230))} minute read</p>
      <div class="rmain">
        <article class="story">${(o.story || []).map(([h, ps]) => `<section><h3>${esc(h)}</h3>${ps.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('')}</article>
        <aside class="raside">
          ${lead.length ? `<h3>Led by</h3><div class="cchips">${lead.map(chipFor).join('')}</div>` : ''}
          ${mem.length || (o.other || []).length ? `<h3>Notable members</h3>
            ${mem.length ? `<div class="cchips">${mem.map(chipFor).join('')}</div>` : ''}
            ${(o.other || []).length ? `<p class="also">${mem.length ? 'Also: ' : ''}${o.other.map(esc).join(' &middot; ')}</p>` : ''}` : ''}
          ${races.length === 1 ? `<h3>Race</h3><div class="lonerow">${races.map(r =>
            `<button type="button" class="lone f-${r.f}" data-race="${r.id}">${esc(r.n)}</button>`).join('')}</div>` : ''}
          ${evs.length ? `<h3>In the timeline</h3><ol class="rhist">${evs.map(ev =>
            `<li><span class="yr">${esc(ev.y)}</span><span><button type="button" class="linkbtn" data-ev="${ev.id}">${esc(ev.t)}</button></span></li>`).join('')}</ol>` : ''}
          ${(o.related || []).filter(r => orgById.has(r)).length ? `<h3>Related factions</h3><ul class="kin">${o.related.filter(r => orgById.has(r)).map(r =>
            `<li><button type="button" class="linkbtn" data-org="${r}">${esc(orgName(r))}</button></li>`).join('')}</ul>` : ''}
          <h3>Further reading</h3>
          ${readMore(o.wiki ? [['Warcraft Wiki', o.wiki]] : [])}
        </aside>
      </div>`;
  }
  function openOrg(id) {
    showView('orgs'); renderOrg(id);
    document.getElementById('view-orgs').scrollIntoView({ block: 'start' });
  }
  orgNav.addEventListener('click', e => { const b = e.target.closest('[data-org]'); if (b) renderOrg(b.dataset.org); });
  orgSel.addEventListener('change', () => renderOrg(orgSel.value));
  orgBody.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.char) { if (hasBio(b.dataset.char)) openBio(b.dataset.char); else goToChar(b.dataset.char); }
    else if (b.dataset.race) { showView('races'); openRace(b.dataset.race); }
    else if (b.dataset.ev) goToEvent(b.dataset.ev);
    else if (b.dataset.org) { renderOrg(b.dataset.org); if (orgBody.getBoundingClientRect().top < 0) orgBody.scrollIntoView({ block: 'start' }); }
  });
  if (ORGS.length) renderOrg(ORGS[0].id);

  // ---------- Cosmology ----------
  const COS = window.COSMOS;
  const cosmosBody = document.getElementById('cosmosBody');
  const forceById = new Map(((COS || {}).forces || []).map(f => [f.id, f]));
  // Positions follow the Warcraft Chronicle chart: Light top, Void bottom, Life and Disorder above, Order and Death below.
  const CPOS = { top: [320, 78], 'upper-left': [96, 200], 'upper-right': [544, 200], 'lower-left': [96, 440], 'lower-right': [544, 440],
    bottom: [320, 562], left: [70, 320], right: [570, 320] };
  const ELEMENTS = ['Spirit', 'Fire', 'Air', 'Decay', 'Earth', 'Water'];
  function cosmosSVG() {
    const fs = COS.forces, pt = f => CPOS[f.place] || [320, 320];
    const seen = new Set();
    const lines = fs.filter(f => { const k = [f.id, f.pair].sort().join(); if (seen.has(k) || !forceById.has(f.pair)) return false; seen.add(k); return true; })
      .map(f => { const [x1, y1] = pt(f), [x2, y2] = pt(forceById.get(f.pair)); return `<line class="cpair" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; }).join('');
    const ring = ELEMENTS.map((e, i) => {
      const a = -Math.PI / 3 + i * Math.PI / 3, x = 320 + Math.cos(a) * 150, y = 320 + Math.sin(a) * 150 + 4;
      return `<text class="celem" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${e}</text>`;
    }).join('');
    const nodes = fs.map(f => {
      const [x, y] = pt(f);
      return `<g class="cnode" data-force="${f.id}" style="--k:var(--k-${f.id})" tabindex="0" role="button" aria-label="${esc(f.n)}" transform="translate(${x},${y})">
        <circle r="62"/><text class="cn" y="-2">${esc(f.n.replace(/^The /, ''))}</text><text class="ca" y="20">${esc(f.alt || '')}</text></g>`;
    }).join('');
    return `<svg class="cosmos" viewBox="0 0 640 640" role="img" aria-label="The six forces of the Warcraft cosmos and how they oppose one another">
      ${lines}
      <circle class="cring" cx="320" cy="320" r="150"/>
      <circle class="crealm dream" cx="279" cy="279" r="46"/><circle class="crealm shadow" cx="361" cy="361" r="46"/>
      <circle class="creal" cx="320" cy="320" r="58"/>
      <text class="crl" x="320" y="316">Reality</text><text class="crs" x="320" y="336">the physical worlds</text>
      <text class="crn" x="256" y="253">Emerald</text><text class="crn" x="256" y="266">Dream</text>
      <text class="crn" x="384" y="381">Shadow-</text><text class="crn" x="384" y="394">lands</text>
      ${ring}${nodes}</svg>`;
  }
  function renderForce(id) {
    const f = forceById.get(id); if (!f) return;
    cosmosBody.querySelectorAll('.cnode').forEach(g => g.classList.toggle('on', g.dataset.force === id));
    const opp = forceById.get(f.pair);
    const evs = (f.events || []).map(e => ERAS.flatMap(x => x.events).find(ev => ev.id === e)).filter(Boolean);
    const races = (f.races || []).map(r => raceById.get(r)).filter(Boolean);
    const box = document.getElementById('forceBody');
    box.style.setProperty('--fc', `var(--k-${f.id})`);
    box.innerHTML = `
      <div class="rhead"><span class="fbadge" style="--fc:var(--k-${f.id})">Cosmic force</span><h2>${esc(f.n)}</h2>${f.alt ? `<div class="sub">${esc(f.alt)}</div>` : ''}</div>
      <dl class="facts">
        ${opp ? `<div><dt>Opposes</dt><dd><button type="button" class="linkbtn" data-force="${opp.id}">${esc(opp.n)}</button></dd></div>` : ''}
        ${f.realm ? `<div><dt>Realm</dt><dd>${esc(f.realm)}</dd></div>` : ''}
      </dl>
      <p class="rsum">${esc(f.s)}</p>
      <div class="story">${(f.text || []).map(p => `<p>${esc(p)}</p>`).join('')}</div>
      ${(f.beings || []).length ? `<h3>Powers and beings</h3><p class="also">${f.beings.map(esc).join(' &middot; ')}</p>` : ''}
      ${(f.chars || []).filter(c => byId.has(c)).length ? `<h3>Key figures</h3><div class="cchips">${f.chars.filter(c => byId.has(c)).map(chipFor).join('')}</div>` : ''}
      ${races.length ? `<h3>Races touched by it</h3><div class="lonerow">${races.map(r => `<button type="button" class="lone f-${r.f}" data-race="${r.id}">${esc(r.n)}</button>`).join('')}</div>` : ''}
      ${evs.length ? `<h3>In the timeline</h3><ol class="rhist">${evs.map(ev =>
        `<li><span class="yr">${esc(ev.y)}</span><span><button type="button" class="linkbtn" data-ev="${ev.id}">${esc(ev.t)}</button></span></li>`).join('')}</ol>` : ''}
      <h3>Further reading</h3>${readMore(f.wiki ? [['Warcraft Wiki', f.wiki]] : [])}`;
  }
  function openForce(id) {
    showView('cosmos'); renderForce(id);
    document.getElementById('forceBody').scrollIntoView({ block: 'start' });
  }
  if (COS && COS.forces) {
    cosmosBody.innerHTML = `
      <div class="cos-intro"><h2>The six forces</h2>${COS.intro.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      <div class="cos-grid">
        <figure class="cos-chart">${cosmosSVG()}
          <figcaption><span class="more-label">About this chart</span> ${esc(COS.chart)}</figcaption></figure>
        <article class="racebody cforce" id="forceBody" aria-live="polite"></article>
      </div>
      <article class="story cos-sections">${COS.sections.map(([h, ps]) => `<section><h3>${esc(h)}</h3>${ps.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('')}</article>`;
    renderForce(COS.forces[0].id);
    cosmosBody.addEventListener('click', e => {
      const t = e.target.closest('[data-force],button'); if (!t) return;
      if (t.dataset.force) { renderForce(t.dataset.force); if (t.closest('#forceBody')) document.getElementById('forceBody').scrollIntoView({ block: 'nearest' }); }
      else if (t.dataset.char) { if (hasBio(t.dataset.char)) openBio(t.dataset.char); else goToChar(t.dataset.char); }
      else if (t.dataset.race) { showView('races'); openRace(t.dataset.race); }
      else if (t.dataset.ev) goToEvent(t.dataset.ev);
    });
    cosmosBody.addEventListener('keydown', e => {
      const g = e.target.closest('g[data-force]');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); renderForce(g.dataset.force); }
    });
  }

  // ---------- Views ----------
  const tabs = { web: document.getElementById('tab-web'), time: document.getElementById('tab-time'), races: document.getElementById('tab-races'),
    orgs: document.getElementById('tab-orgs'), cosmos: document.getElementById('tab-cosmos') };
  const views = { web: document.getElementById('view-web'), time: document.getElementById('view-time'), races: document.getElementById('view-races'),
    orgs: document.getElementById('view-orgs'), cosmos: document.getElementById('view-cosmos') };
  let fitted = false;
  function showView(v) {
    Object.keys(views).forEach(k => { views[k].hidden = k !== v; tabs[k].setAttribute('aria-selected', k === v); });
    hideTip();
    if (v === 'web' && !fitted) { fit(0); fitted = true; }
  }
  tabs.web.onclick = () => showView('web');
  tabs.time.onclick = () => showView('time');
  tabs.races.onclick = () => showView('races');
  tabs.orgs.onclick = () => showView('orgs');
  tabs.cosmos.onclick = () => showView('cosmos');

  // ---------- Search everything ----------
  const gq = document.getElementById('gq');
  const gres = document.getElementById('gres');
  const GTYPES = [['char', 'Characters'], ['event', 'Timeline'], ['race', 'Races'], ['org', 'Factions'], ['force', 'Cosmology']];
  let gIndex = null, searchHits = [], gCur = -1;
  const flatStory = st => st ? st.map(([h, ps]) => h + '. ' + ps.join(' ')).join(' ') : '';
  function buildIndex() {
    const out = [];
    nodes.forEach(c => out.push({ type: 'char', id: c.id, label: c.n, sub: c.t, a: c.a,
      body: [c.r, c.b, flatStory((window.CHAR_BIOS || {})[c.id])].join(' ') }));
    ERAS.forEach(era => era.events.forEach(ev => out.push({ type: 'event', id: ev.id, label: ev.t, sub: ev.y + ' \u00b7 ' + era.name,
      body: [ev.d, ((window.EVENT_STORIES || {})[ev.id] || []).join(' ')].join(' ') })));
    RACES.forEach(r => out.push({ type: 'race', id: r.id, label: r.n, sub: [r.nn, r.tag].filter(Boolean).join(' \u00b7 '),
      body: [r.s, r.home, r.cap, r.lead, r.h.map(x => x[1]).join(' '), flatStory((window.RACE_STORIES || {})[r.id])].join(' ') }));
    (window.ORGS || []).forEach(o => out.push({ type: 'org', id: o.id, label: o.n, sub: o.kind, body: [o.s, flatStory(o.story)].join(' ') }));
    ((window.COSMOS || {}).forces || []).forEach(f => out.push({ type: 'force', id: f.id, label: f.n, sub: f.alt || '',
      body: [f.s, (f.text || []).join(' ')].join(' ') }));
    out.forEach(x => { x.nl = norm(x.label); x.ns = norm(x.sub || ''); x.nb = norm(x.body); x.lb = x.body.toLowerCase(); });
    return out;
  }
  function runSearch(qs) {
    const v = norm(qs.trim());
    if (v.length < 2) return [];
    gIndex = gIndex || buildIndex();
    const res = [];
    for (const x of gIndex) {
      let score, inBody = false;
      if (x.nl.startsWith(v) || x.nl.includes(' ' + v)) score = 100;
      else if (x.nl.includes(v)) score = 70;
      else if (x.ns.includes(v)) score = 40;
      else {
        let p = x.nb.indexOf(v), n = 0;
        const whole = v.length <= 3;
        while (p >= 0 && n < 30) {
          const startOk = p === 0 || !/[a-z0-9]/.test(x.nb[p - 1]), endOk = !whole || !/[a-z0-9]/.test(x.nb[p + v.length] || '');
          if (startOk && endOk) n++;
          p = x.nb.indexOf(v, p + 1);
        }
        if (!n) continue;
        score = 10 + n; inBody = true;
      }
      res.push({ x, score, inBody });
    }
    return res.sort((a, b) => b.score - a.score || a.x.label.localeCompare(b.x.label));
  }
  function snippet(x, qs) {
    const q = qs.trim().toLowerCase();
    let i = x.lb.indexOf(q);
    while (i > 0 && /[a-z0-9]/.test(x.lb[i - 1])) i = x.lb.indexOf(q, i + 1);
    if (i < 0) return '';
    const s = Math.max(0, x.body.lastIndexOf(' ', Math.max(0, i - 70)) + 1);
    const e = Math.min(x.body.length, i + q.length + 90);
    return (s > 0 ? '\u2026' : '') + esc(x.body.slice(s, i)) + '<mark>' + esc(x.body.slice(i, i + q.length)) + '</mark>' +
      esc(x.body.slice(i + q.length, e)) + (e < x.body.length ? '\u2026' : '');
  }
  function closeResults() { gres.hidden = true; gq.setAttribute('aria-expanded', 'false'); gq.removeAttribute('aria-activedescendant'); gCur = -1; }
  function renderResults() {
    const qs = gq.value, all = runSearch(qs);
    const nameHits = new Set(all.filter(r => r.x.type === 'char' && !r.inBody).map(r => r.x.id));
    nodeSel.classed('match', d => nameHits.has(d.id));
    if (qs.trim().length < 2) { closeResults(); return; }
    searchHits = [];
    let html = '';
    for (const [t, label] of GTYPES) {
      const group = all.filter(r => r.x.type === t);
      if (!group.length) continue;
      html += `<div class="ghead">${label}<span>${group.length}</span></div>`;
      group.slice(0, 6).forEach(r => {
        const k = searchHits.length; searchHits.push(r.x);
        const sn = r.inBody ? snippet(r.x, qs) : '';
        html += `<button type="button" class="ghit" role="option" id="gh-${k}" data-k="${k}">` +
          `<span class="gl">${r.x.type === 'char' ? `<i class="dot al-${r.x.a}"></i>` : ''}${esc(r.x.label)}</span>` +
          (r.x.sub ? `<span class="gs">${esc(r.x.sub)}</span>` : '') + (sn ? `<span class="gsn">${sn}</span>` : '') + '</button>';
      });
      if (group.length > 6) html += `<div class="gmore">${group.length - 6} more ${label.toLowerCase()} mention this. Try a longer search to narrow it down.</div>`;
    }
    gres.innerHTML = html || `<div class="gempty">Nothing in the atlas matches \u201c${esc(qs.trim())}\u201d.</div>`;
    gres.hidden = false; gq.setAttribute('aria-expanded', 'true'); gCur = -1;
  }
  function setActive(k) {
    const btns = gres.querySelectorAll('.ghit');
    if (!btns.length) return;
    gCur = (k + btns.length) % btns.length;
    btns.forEach((b, i) => b.classList.toggle('active', i === gCur));
    btns[gCur].scrollIntoView({ block: 'nearest' });
    gq.setAttribute('aria-activedescendant', btns[gCur].id);
  }
  function openHit(x) {
    closeResults(); gq.blur();
    if (x.type === 'char') goToChar(x.id);
    else if (x.type === 'event') goToEvent(x.id);
    else if (x.type === 'race') { showView('races'); openRace(x.id); }
    else if (x.type === 'org' && typeof openOrg === 'function') openOrg(x.id);
    else if (x.type === 'force' && typeof openForce === 'function') openForce(x.id);
  }
  gq.addEventListener('input', renderResults);
  gq.addEventListener('focus', () => { if (gq.value.trim().length >= 2) renderResults(); });
  gq.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (gres.hidden) renderResults(); setActive(gCur + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(gCur - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); const x = searchHits[gCur >= 0 ? gCur : 0]; if (x && !gres.hidden) openHit(x); }
    else if (e.key === 'Escape') { closeResults(); }
  });
  gres.addEventListener('mousedown', e => e.preventDefault());
  gres.addEventListener('click', e => { const b = e.target.closest('.ghit'); if (b) openHit(searchHits[+b.dataset.k]); });
  document.addEventListener('click', e => { if (!e.target.closest('.gsearch')) closeResults(); });

  renderIntro();
  applyFilters();
  showView({ '#timeline': 'time', '#races': 'races', '#factions': 'orgs', '#cosmology': 'cosmos' }[location.hash] || 'web');
  let lastW = graphEl.clientWidth;
  window.addEventListener('resize', () => {
    if (views.web.hidden || !graphEl.clientWidth || graphEl.clientWidth === lastW) return;
    lastW = graphEl.clientWidth; fit(0);
  });
})();
