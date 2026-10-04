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
  const ytEmbed = id => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1`;
  const ytWatch = id => `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
  const length = s => Number.isFinite(s) && s > 0 ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : null;
  const points = n => Number(n || 0).toLocaleString();
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  function ago(iso) {
    const s = (Date.parse(iso) - Date.now()) / 1000;
    for (const [unit, size] of [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]]) if (Math.abs(s) >= size) return rtf.format(Math.round(s / size), unit);
    return 'just now';
  }
  const monthName = key => { const [y, m] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 15)).toLocaleString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' }); };
  const day = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  function empty(title, text) { const box = el('div', 'empty'); box.append(el('b', null, title), el('span', null, text)); return box; }

  const ICONS = {
    youtube: '<rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor"/><path d="M10 9.2v5.6l4.8-2.8z" fill="var(--bg)"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor"/>',
    discord: '<path d="M6.2 6.4C8 5.4 10 5 12 5s4 .4 5.8 1.4c1.5 2.6 2.3 5.4 2.2 8.7-1.5 1.3-3.2 2.2-4.9 2.7l-1-1.9c-.7.2-1.4.3-2.1.3s-1.4-.1-2.1-.3l-1 1.9c-1.7-.5-3.4-1.4-4.9-2.7-.1-3.3.7-6.1 2.2-8.7z" fill="currentColor"/><circle cx="9.3" cy="11.8" r="1.5" fill="var(--bg)"/><circle cx="14.7" cy="11.8" r="1.5" fill="var(--bg)"/>'
  };
  const LABELS = { youtube: 'YouTube', instagram: 'Instagram', discord: 'Discord' };
  function renderProfile(d) {
    const p = d.profile || {};
    if (p.description) { $('bio').textContent = p.description; $('bio').classList.add('custom'); }
    if (p.socials?.length) {
      $('socials').hidden = false;
      $('socials').replaceChildren(...p.socials.filter(s => ICONS[s.platform] && /^https:\/\//.test(s.url)).map(s => {
        const li = el('li'), a = el('a', `social ${s.platform}`); a.href = s.url; a.target = '_blank'; a.rel = 'noopener me';
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('aria-hidden', 'true'); icon.innerHTML = ICONS[s.platform]; // fixed markup, not data
        a.append(icon, el('span', null, LABELS[s.platform])); li.append(a); return li;
      }));
    }
    if (p.games?.length) {
      $('games').hidden = false; $('nav-games').hidden = false;
      $('game-list').replaceChildren(...p.games.map((g, i) => {
        const li = el('li', 'fav'), art = el('div', 'fav-art');
        if (g.art) { const img = el('img'); img.src = g.art; img.alt = ''; img.loading = 'lazy'; art.append(img); }
        else art.append(el('span', 'fav-initial', g.name.slice(0, 1).toUpperCase()));
        art.append(el('span', 'fav-no', String(i + 1).padStart(2, '0')));
        li.append(art, el('span', 'fav-name', g.name)); return li;
      }));
    }
  }
  function renderCommands(d) {
    if (!d.commands?.length) return;
    $('command-list').replaceChildren(...d.commands.map(c => {
      const card = el('div', 'command'), head = el('div', 'cmd-head');
      head.append(el('code', 'cmd', c.cmd)); if (c.tag) head.append(el('span', 'cmd-tag', c.tag));
      const ex = el('p', 'cmd-ex'); ex.append('e.g. ', el('code', null, c.example));
      card.append(head, el('p', 'cmd-text', c.text), ex); return card;
    }));
  }

  function renderFeature(d) {
    if (!d.featured?.id) return;
    $('feature').hidden = false; $('hero').classList.add('with-feature');
    $('feature-frame').src = ytEmbed(d.featured.id); $('feature-link').href = ytWatch(d.featured.id);
    $('feature').querySelector('figcaption span').textContent = d.featured.latest ? 'Latest stream' : 'Featured video';
  }

  function thumbBox(src, title, vertical) {
    const box = el('span', 'thumb-art' + (vertical ? ' vertical' : ''));
    if (!src) { box.append(el('span', 'initial', title.slice(0, 1).toUpperCase())); return box; }
    if (vertical) { const bg = el('img', 'bg'); bg.src = src; bg.alt = ''; bg.loading = 'lazy'; box.append(bg); }
    const img = el('img', 'fg'); img.src = src; img.alt = ''; img.loading = 'lazy';
    img.onerror = () => box.replaceChildren(el('span', 'initial', title.slice(0, 1).toUpperCase()));
    box.append(img); return box;
  }
  function renderClips(d) {
    const grid = $('clip-grid');
    if (!d.clips.length) return grid.replaceChildren(empty('No clips yet', 'Type !clip in chat during the next stream and it will show up here.'));
    grid.replaceChildren(...d.clips.map(c => {
      const card = el('article', 'clip'), len = length(c.seconds);
      const thumb = el('button', 'thumb'); thumb.type = 'button'; thumb.setAttribute('aria-label', `Play “${c.title}”${len ? ', ' + len : ''}`);
      thumb.append(thumbBox(c.thumb, c.title, c.vertical), el('span', 'play', '▶'));
      if (len) thumb.append(el('span', 'len', len));
      thumb.onclick = () => play({ title: c.title, src: c.preview, open: c.view, openLabel: 'Open in Drive ↗', download: c.download, vertical: c.vertical, meta: ['Clipped by ', el('b', null, c.by), `${len ? ' · ' + len : ''} · ${new Date(c.createdAt).toLocaleDateString()}`] });
      const body = el('div', 'clip-body'), by = el('p', 'by');
      by.append('✂ clipped by ', el('b', null, c.by));
      body.append(el('h3', null, c.title), by, el('p', 'when', ago(c.createdAt)));
      const dl = el('a', 'dl', '↓'); dl.href = c.download; dl.rel = 'noopener'; dl.setAttribute('aria-label', `Download “${c.title}”`); dl.title = 'Download';
      card.append(thumb, body, dl); return card;
    }));
  }

  function renderActive(d) {
    const week = d.active?.weekStart;
    if (week) $('active-note').textContent = `Week of ${day(week)} · +${d.activityRules.showUp} for showing up in chat, +${d.activityRules.perMinute} per minute chatting`;
    if (!d.active?.top.length) return $('active-top').replaceChildren(empty('Nobody yet this week', 'Chat during the stream to get on the board. It resets every Monday.'));
    $('active-top').replaceChildren(...d.active.top.map((p, i) => {
      const card = el('div', `fan f${i + 1}`);
      card.append(el('span', 'fan-rank', ['🔥', '⚡', '✨'][i] || i + 1), person('fan-name', p.name, p.channelId), el('div', 'fan-pts', `${points(p.points)} pts`), el('div', 'fan-meta', `${plural(p.streams, 'stream')} · ${plural(p.messages, 'message')}`));
      return card;
    }));
  }

  function renderBoard(d) {
    const top = d.leaderboard[0]?.score || 1;
    if (!d.leaderboard.length) { $('podium').replaceChildren(empty('The board is empty', 'The first person to get a clip saved takes the #1 spot.')); $('board').replaceChildren(); return; }
    $('podium').replaceChildren(...[1, 0, 2].map(i => d.leaderboard[i]).filter(Boolean).map(p => {
      const card = el('div', `place p${p.rank}`);
      card.append(el('span', 'medal', p.rank), person('who', p.name, p.channelId), el('div', 'score', points(p.score)), el('div', 'meta', plural(p.clips, 'clip')));
      return card;
    }));
    $('board').replaceChildren(...d.leaderboard.slice(3).map(p => {
      const li = el('li', 'row'), name = el('div'), bar = el('span', 'bar'), fill = el('i');
      fill.style.width = `${Math.max(3, p.score / top * 100)}%`; bar.append(fill);
      name.append(person('who', p.name, p.channelId), bar);
      li.append(el('span', 'r', p.rank), name, el('span', 'c', plural(p.clips, 'clip')), el('span', 's', points(p.score)));
      return li;
    }));
  }

  function renderMonthly(d) {
    if (!d.months.length) { $('spotlight').replaceChildren(empty('No winner yet', 'Clip points plus chat activity points. The most each month takes the crown.')); $('history').replaceChildren(); return; }
    const [first, ...rest] = d.months, w = first.winner;
    const spot = el('div', 'spot'), mid = el('div'), label = el('div', 'label', first.inProgress ? `${monthName(first.month)} · leading` : monthName(first.month));
    if (first.inProgress) label.append(el('span', 'live', 'LIVE'));
    mid.append(label, person('name', w.name, w.channelId), el('div', 'cid', w.channelId));
    const score = el('div', 'pts-big', points(w.total)); score.append(el('small', null, `${points(w.clipPoints)} clip + ${points(w.activityPoints)} activity`));
    spot.append(el('div', 'crown', '👑'), mid, score);
    if (first.runnersUp.length) { const r = el('div', 'runners'); first.runnersUp.forEach((p, i) => { const s = el('span', null, `#${i + 2} `); s.append(el('b', null, p.name), ` · ${points(p.total)}`); r.append(s); }); spot.append(r); }
    $('spotlight').replaceChildren(spot);
    $('history').replaceChildren(...rest.map(m => {
      const card = el('div', 'past'); card.append(el('span', 'p', points(m.winner.total)), el('div', 'm', monthName(m.month)), person('w', m.winner.name, m.winner.channelId), el('div', 'cid', m.winner.channelId));
      return card;
    }));
  }

  function rankItem(p, i) {
    const li = el('li', i === 0 ? 'win' : null);
    li.append(el('span', 'n', i === 0 ? '🏆' : i + 1), el('span', 'pn', p.name), el('span', 'sc', p.score || ''));
    return li;
  }
  function renderTournaments(d) {
    if (!d.tournaments.length) return $('tourneys').replaceChildren(empty('No tournaments yet', 'Results will appear here after the next community tournament.'));
    $('tourneys').replaceChildren(...d.tournaments.map(t => {
      const card = el('article', 'tourney');
      if (t.video) {
        const v = el('button', 'thumb t-video'); v.type = 'button'; v.setAttribute('aria-label', `Watch ${t.title || t.game}`);
        const img = el('img'); img.src = `https://i.ytimg.com/vi/${encodeURIComponent(t.video)}/hqdefault.jpg`; img.alt = ''; img.loading = 'lazy';
        v.append(img, el('span', 'play', '▶'));
        v.onclick = () => play({ title: t.title || t.game, src: ytEmbed(t.video) + '&autoplay=1', open: ytWatch(t.video), openLabel: 'Watch on YouTube ↗', meta: [`${t.game} · ${day(t.date)}`] });
        card.append(v);
      }
      const body = el('div', 't-body'), head = el('div', 't-head');
      head.append(el('span', 'game', t.game), el('span', 'date', day(t.date)));
      body.append(head, el('h3', null, t.title || t.game));
      if (!t.participants.length) body.append(el('p', 'upcoming', Date.parse(t.date) > Date.now() ? 'Coming up. Sign-ups in chat.' : 'Results coming soon.'));
      else {
        const podium = el('ol', 'ranks t-top'); t.participants.slice(0, 3).forEach((p, i) => podium.append(rankItem(p, i)));
        body.append(podium);
        if (t.participants.length > 3) {
          // Expanding swaps the top 3 for the full ranked list of everyone who played.
          const all = el('details', 'all'), list = el('ol', 'ranks full'), summary = el('summary', null, `All ${plural(t.participants.length, 'participant')}`);
          t.participants.forEach((p, i) => list.append(rankItem(p, i)));
          all.append(summary, list); body.append(all);
          all.addEventListener('toggle', () => { podium.hidden = all.open; summary.textContent = all.open ? 'Show top 3 only' : `All ${plural(t.participants.length, 'participant')}`; });
        }
      }
      card.append(body); return card;
    }));
  }

  const dialog = $('player');
  function play({ title, src, open, openLabel, download, vertical, meta }) {
    $('player-title').textContent = title; $('player-meta').replaceChildren(...meta);
    $('player-box').classList.toggle('vertical', !!vertical);
    $('player-frame').src = src;
    $('player-open').href = open; $('player-open').textContent = openLabel;
    $('player-dl').hidden = !download; if (download) $('player-dl').href = download;
    dialog.showModal();
  }
  dialog.addEventListener('close', () => { $('player-frame').src = 'about:blank'; });
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  $('player-close').onclick = () => dialog.close();

  // Links posted in chat look like …/#clip=<id> and open that clip straight away.
  function openLinkedClip(d) {
    const id = new URLSearchParams(location.hash.slice(1)).get('clip'); if (!id) return;
    const index = d.clips.findIndex(c => c.id === id);
    if (index < 0) { $('updated').textContent = 'That clip is still being added. Refresh in a minute.'; $('clips').scrollIntoView(); return; }
    const card = $('clip-grid').children[index]; card?.scrollIntoView({ block: 'center' }); card?.querySelector('.thumb')?.click();
  }

  async function load() {
    try {
      const r = await fetch(`data.json?v=${Date.now()}`, { cache: 'no-store' }); if (!r.ok) throw new Error();
      const d = await r.json();
      if (/^#[0-9a-f]{6}$/i.test(d.accent || '')) document.documentElement.style.setProperty('--accent', d.accent);
      document.title = `${d.title} · Clips`; $('brand').textContent = d.title; $('title').textContent = d.title;
      if (d.channel?.url) { $('yt').href = d.channel.url; $('yt').hidden = false; }
      if (d.folderUrl) { $('folder').href = d.folderUrl; $('folder').hidden = false; }
      document.querySelectorAll('.pts').forEach(n => { n.textContent = d.pointsPerClip; });
      $('stat-clips').textContent = points(d.stats?.clips ?? d.clips.length);
      $('stat-active').textContent = d.stats?.mostActive || '—';
      $('stat-top').textContent = d.stats?.topClipper || '—';
      renderProfile(d); renderFeature(d); renderClips(d); renderCommands(d); renderActive(d); renderBoard(d); renderMonthly(d); renderTournaments(d);
      $('updated').textContent = `Updated ${ago(d.updatedAt)}`;
      openLinkedClip(d);
    } catch { $('updated').textContent = 'Could not load the latest clips. Refresh to try again.'; }
  }
  load();
})();
