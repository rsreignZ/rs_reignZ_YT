(() => {
  const $ = id => document.getElementById(id);
  // Every value from data.json is set with textContent / attributes, never as HTML.
  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined && text !== null) n.textContent = text; return n; }
  const channelUrl = id => `https://www.youtube.com/channel/${encodeURIComponent(id)}`;
  function person(cls, name, channelId) {
    const n = el(channelId ? 'a' : 'span', cls, name);
    if (channelId) { n.href = channelUrl(channelId); n.target = '_blank'; n.rel = 'noopener'; n.title = `${name} on YouTube`; }
    return n;
  }
  const length = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const points = n => n.toLocaleString();
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  function ago(iso) {
    const s = (Date.parse(iso) - Date.now()) / 1000;
    for (const [unit, size] of [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]]) if (Math.abs(s) >= size) return rtf.format(Math.round(s / size), unit);
    return 'just now';
  }
  const monthName = key => { const [y, m] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 15)).toLocaleString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' }); };
  const day = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  function empty(title, text) { const box = el('div', 'empty'); box.append(el('b', null, title), el('span', null, text)); return box; }

  function renderClips(d) {
    const grid = $('clip-grid');
    if (!d.clips.length) return grid.replaceChildren(empty('No clips yet', 'Type !clip in chat during the next stream and it will show up here.'));
    grid.replaceChildren(...d.clips.map(c => {
      const card = el('article', 'clip');
      const thumb = el('button', 'thumb'); thumb.type = 'button'; thumb.setAttribute('aria-label', `Play “${c.title}”, ${length(c.seconds)}`);
      if (c.thumb) { const img = el('img'); img.src = c.thumb; img.alt = ''; img.loading = 'lazy'; img.onerror = () => img.replaceWith(el('span', 'initial', c.title.slice(0, 1).toUpperCase())); thumb.append(img); }
      else thumb.append(el('span', 'initial', c.title.slice(0, 1).toUpperCase()));
      thumb.append(el('span', 'play', '▶'), el('span', 'len', length(c.seconds)));
      thumb.onclick = () => play(c);
      const body = el('div', 'clip-body'), by = el('p', 'by');
      by.append('✂ clipped by ', el('b', null, c.by));
      body.append(el('h3', null, c.title), by, el('p', 'when', ago(c.createdAt)));
      const dl = el('a', 'dl', '↓'); dl.href = c.download; dl.rel = 'noopener'; dl.setAttribute('aria-label', `Download “${c.title}”`); dl.title = 'Download';
      card.append(thumb, body, dl); return card;
    }));
  }

  function renderBoard(d) {
    const top = d.leaderboard[0]?.score || 1;
    if (!d.leaderboard.length) { $('podium').replaceChildren(empty('The board is empty', 'The first person to get a clip saved takes the #1 spot.')); $('board').replaceChildren(); return; }
    $('podium').replaceChildren(...[1, 0, 2].map(i => d.leaderboard[i]).filter(Boolean).map(p => {
      const card = el('div', `place p${p.rank}`);
      card.append(el('span', 'medal', p.rank), person('who', p.name, p.channelId), el('div', 'score', points(p.score)), el('div', 'meta', `${p.clips} clip${p.clips === 1 ? '' : 's'}`));
      return card;
    }));
    $('board').replaceChildren(...d.leaderboard.slice(3).map(p => {
      const li = el('li', 'row'), name = el('div'), bar = el('span', 'bar'), fill = el('i');
      fill.style.width = `${Math.max(3, p.score / top * 100)}%`; bar.append(fill);
      name.append(person('who', p.name, p.channelId), bar);
      li.append(el('span', 'r', p.rank), name, el('span', 'c', `${p.clips} clip${p.clips === 1 ? '' : 's'}`), el('span', 's', points(p.score)));
      return li;
    }));
  }

  function renderMonthly(d) {
    if (!d.months.length) { $('spotlight').replaceChildren(empty('No winner yet', 'Whoever earns the most clip points this month takes the crown.')); $('history').replaceChildren(); return; }
    const [first, ...rest] = d.months, w = first.winner;
    const spot = el('div', 'spot'), mid = el('div'), label = el('div', 'label', first.inProgress ? `${monthName(first.month)} · leading` : monthName(first.month));
    if (first.inProgress) label.append(el('span', 'live', 'LIVE'));
    mid.append(label, person('name', w.name, w.channelId), el('div', 'cid', w.channelId));
    const score = el('div', 'pts-big', points(w.score)); score.append(el('small', null, `points · ${w.clips} clip${w.clips === 1 ? '' : 's'}`));
    spot.append(el('div', 'crown', '👑'), mid, score);
    if (first.runnersUp.length) { const r = el('div', 'runners'); first.runnersUp.forEach((p, i) => { const s = el('span', null, `#${i + 2} `); s.append(el('b', null, p.name), ` · ${points(p.score)}`); r.append(s); }); spot.append(r); }
    $('spotlight').replaceChildren(spot);
    $('history').replaceChildren(...rest.map(m => {
      const card = el('div', 'past'); card.append(el('span', 'p', points(m.winner.score)), el('div', 'm', monthName(m.month)), person('w', m.winner.name, m.winner.channelId), el('div', 'cid', m.winner.channelId));
      return card;
    }));
  }

  function renderTournaments(d) {
    if (!d.tournaments.length) return $('tourneys').replaceChildren(empty('No tournaments yet', 'Results will appear here after the next community tournament.'));
    $('tourneys').replaceChildren(...d.tournaments.map(t => {
      const card = el('article', 'tourney'), head = el('div', 't-head');
      head.append(el('span', 'game', t.game), el('span', 'date', day(t.date)));
      card.append(head, el('h3', null, t.title || t.game));
      if (!t.participants.length) { card.append(el('p', 'upcoming', Date.parse(t.date) > Date.now() ? 'Coming up. Sign-ups in chat.' : 'Results coming soon.')); return card; }
      const list = el('ol', 'ranks'), limit = 8;
      t.participants.forEach((p, i) => {
        const li = el('li', i === 0 ? 'win' : null); li.append(el('span', 'n', i === 0 ? '🏆' : i + 1), el('span', 'pn', p.name), el('span', 'sc', p.score || ''));
        if (i >= limit) li.hidden = true; list.append(li);
      });
      card.append(list);
      if (t.participants.length > limit) { const more = el('button', 'more', `Show all ${t.participants.length} players`); more.type = 'button'; more.onclick = () => { list.querySelectorAll('li[hidden]').forEach(li => { li.hidden = false; }); more.remove(); }; card.append(more); }
      return card;
    }));
  }

  const dialog = $('player');
  function play(c) {
    $('player-title').textContent = c.title;
    const meta = $('player-meta'); meta.replaceChildren('Clipped by ', el('b', null, c.by), ` · ${length(c.seconds)} · ${new Date(c.createdAt).toLocaleDateString()}`);
    $('player-frame').src = c.preview; $('player-drive').href = c.view; $('player-dl').href = c.download;
    dialog.showModal();
  }
  dialog.addEventListener('close', () => { $('player-frame').src = 'about:blank'; });
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  $('player-close').onclick = () => dialog.close();

  async function load() {
    try {
      const r = await fetch(`data.json?v=${Date.now()}`, { cache: 'no-store' }); if (!r.ok) throw new Error();
      const d = await r.json();
      if (/^#[0-9a-f]{6}$/i.test(d.accent || '')) document.documentElement.style.setProperty('--accent', d.accent);
      document.title = `${d.title} · Clips`; $('brand').textContent = d.title; $('title').textContent = d.title;
      if (d.channel?.url) { $('yt').href = d.channel.url; $('yt').hidden = false; }
      if (d.folderUrl) { $('folder').href = d.folderUrl; $('folder').hidden = false; }
      document.querySelectorAll('.pts').forEach(n => { n.textContent = d.pointsPerClip; });
      $('stat-clips').textContent = d.leaderboard.reduce((sum, p) => sum + p.clips, 0);
      $('stat-clippers').textContent = d.leaderboard.length;
      $('stat-top').textContent = d.leaderboard[0]?.name || '—';
      renderClips(d); renderBoard(d); renderMonthly(d); renderTournaments(d);
      $('updated').textContent = `Updated ${ago(d.updatedAt)}`;
    } catch { $('updated').textContent = 'Could not load the latest clips. Refresh to try again.'; }
  }
  load();
})();
