// ── Minimal markdown renderer ──────────────────────────────────
function renderMarkdown(md) {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

// ── Entry storage ──────────────────────────────────────────────
function loadEntries(page) {
  return JSON.parse(localStorage.getItem(`entries-${page}`) || '[]');
}

function saveEntries(page, entries) {
  localStorage.setItem(`entries-${page}`, JSON.stringify(entries));
}

// ── Render all saved entries for a page ───────────────────────
const gridPages = ['academics', 'forays'];

function renderEntries(page) {
  const container = document.getElementById(`entries-${page}`);
  if (!container) return;
  const entries = loadEntries(page);

  if (gridPages.includes(page)) {
    container.className = 'entries entries-grid';
    entries.forEach(entry => container.appendChild(buildGridEntryEl(entry, page, entries)));
  } else {
    container.className = 'entries';
    entries.forEach(entry => container.appendChild(buildEntryEl(entry, page, entries)));
  }
}

// ── Composer (open/close + save) ──────────────────────────────
function openComposer(page) {
    const container = document.getElementById(`entries-${page}`);
    if (container.querySelector('.entry-composer')) return; // already open
    console.log(page)
    const composer = document.createElement('div');
    composer.className = 'entry-composer';
    composer.innerHTML = `
    <input type="text" placeholder="Title" class="composer-title" />
    <textarea placeholder="Write in markdown…" class="composer-body"></textarea>
    <div class="composer-actions">
    <button class="composer-save">Save</button>
    <button class="composer-cancel">Cancel</button>
    </div>
    `;

    if (gridPages.includes(page)) {
        container.insertAdjacentElement('beforebegin', composer);
    } else {
        container.prepend(composer);
    }
    composer.querySelector('.composer-title').focus();

    composer.querySelector('.composer-cancel').addEventListener('click', () => composer.remove());

    composer.querySelector('.composer-save').addEventListener('click', () => {
    const title = composer.querySelector('.composer-title').value.trim();
    const body  = composer.querySelector('.composer-body').value.trim();
    if (!body) return;

    const entries = loadEntries(page);
    const entry = {
        id:    Date.now().toString(),
        title: title || 'Untitled',
        date:  new Date().toLocaleDateString('en-CA'),
        body
    };
    entries.unshift(entry);
    saveEntries(page, entry.id ? entries : [entry, ...entries]);
    saveEntries(page, entries);

    composer.remove();
    const container = document.getElementById(`entries-${page}`);
    const entryEl = gridPages.includes(page)
        ? buildGridEntryEl(entry, page, entries)
        : buildEntryEl(entry, page, entries);
    container.prepend(entryEl);
    });
}



// ── Render a GRID entry (academics + forays) ──────────────────
function buildGridEntryEl(entry, page, entries) {
  const el = document.createElement('div');
  el.className = 'entry-card';
  el.dataset.id = entry.id;
  el.innerHTML = `
    <div class="entry-card-inner">
      <div class="entry-card-title">${entry.title || 'Untitled'}</div>
      <div class="entry-card-date">${entry.date}</div>
    </div>
  `;

  el.addEventListener('click', (e) => {
    if (e.target.classList.contains('entry-delete')) return;
    const expanded = document.querySelector('.entry-card-expanded');
    if (expanded && expanded !== el) {
      expanded.classList.remove('entry-card-expanded');
      expanded.querySelector('.entry-card-body')?.remove();
      expanded.querySelector('.entry-delete')?.remove();
    }

    el.classList.toggle('entry-card-expanded');
    if (el.classList.contains('entry-card-expanded')) {
      const body = document.createElement('div');
      body.className = 'entry-card-body';
      body.innerHTML = renderMarkdown(entry.body);

      const del = document.createElement('button');
      del.className = 'entry-delete';
      del.textContent = '✕ delete';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        const updated = entries.filter(e => e.id !== entry.id);
        saveEntries(page, updated);
        el.remove();
      });

      el.appendChild(body);
      el.appendChild(del);
    } else {
      el.querySelector('.entry-card-body')?.remove();
      el.querySelector('.entry-delete')?.remove();
    }
  });

  return el;
}

// ── Render a BLOG entry (writing) ─────────────────────────────
function buildEntryEl(entry, page, entries) {
  const el = document.createElement('div');
  el.className = 'entry';
  el.dataset.id = entry.id;
  el.innerHTML = `
    <div class="entry-meta">
      <span class="entry-title">${entry.title || 'Untitled'}</span>
      <span>
        <span class="entry-date">${entry.date}</span>
        <button class="entry-delete" title="Delete">✕</button>
      </span>
    </div>
    <div class="entry-body">${renderMarkdown(entry.body)}</div>
  `;
  el.querySelector('.entry-delete').addEventListener('click', () => {
    const updated = entries.filter(e => e.id !== entry.id);
    saveEntries(page, entries.filter(e => e.id !== entry.id));
    el.remove();
  });
  return el;
}

// ── Wire up + buttons and load on init ────────────────────────
document.querySelectorAll('.add-entry-btn').forEach(btn => {
  btn.addEventListener('click', () => openComposer(btn.dataset.page));
});

['academics', 'writing', 'forays'].forEach(renderEntries);
