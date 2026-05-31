// ── Minimal markdown renderer ──────────────────────────────────
function renderMarkdown(md) {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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

// ── Render all saved entries for a page ───────────────────────
let allEntries = { academics: [], writing: [], forays: [] };
const gridPages = ['academics', 'forays'];
const allPages = ['academics', 'writing', 'forays']
const IS_LOCAL = window.location.hostname === 'localhost';
const API = IS_LOCAL ? '' : 'https://manisetayesh.github.io/';

document.querySelectorAll('.add-entry-btn').forEach(btn => {
  if (IS_LOCAL) {
    btn.style.display = 'block';
    btn.addEventListener('click', () => openComposer(btn.dataset.page));
  } else {
    btn.style.display = 'none'
  }
});

async function fetchEntries() {
  const res = await fetch(`${API}/data/entries.json`);
  const text = await res.text();
  allEntries = JSON.parse(text);
}

async function persistEntries() {
  if (!IS_LOCAL) return; 
  await fetch('/api/entries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(allEntries)
  });
}

function renderEntries(page) {
  const container = document.getElementById(`entries-${page}`);
  if (!container) return;
  const entries = allEntries[page] || [];
  if (gridPages.includes(page)) {
    container.className = 'entries entries-grid';
    entries.forEach(entry => container.appendChild(buildGridEntryEl(entry, page, entries)));
  } else {
    container.className = 'entries';
    entries.forEach(entry => container.appendChild(buildEntryEl(entry, page, entries)));
  }
}

function openComposer(page) {
  const container = document.getElementById(`entries-${page}`);
  if (document.querySelector(`.entry-composer[data-page="${page}"]`)) return;

  const composer = document.createElement('div');
  composer.className = 'entry-composer';
  composer.dataset.page = page;
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
  composer.querySelector('.composer-save').addEventListener('click', async () => {
    const title = composer.querySelector('.composer-title').value.trim();
    const body  = composer.querySelector('.composer-body').value.trim();
    if (!body) return;

    const entry = {
      id:    Date.now().toString(),
      title: title || 'Untitled',
      date:  new Date().toLocaleDateString('en-CA'),
      body
    };

    allEntries[page].unshift(entry);
    await persistEntries();

    composer.remove();
    const entryEl = gridPages.includes(page)
      ? buildGridEntryEl(entry, page, allEntries[page])
      : buildEntryEl(entry, page, allEntries[page]);
    document.getElementById(`entries-${page}`).prepend(entryEl);
  });
}

// ── Render a GRID entry  ──────────────────
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

    el.classList.toggle('entry-card-expanded');
    if (el.classList.contains('entry-card-expanded')) {
      const body = document.createElement('div');
      body.className = 'entry-card-body';
      body.innerHTML = renderMarkdown(entry.body);
      el.appendChild(body);

      if (IS_LOCAL) {
        const del = document.createElement('button');
        del.className = 'entry-delete';
        del.textContent = '✕ delete';
        del.addEventListener('click', async (e) => {
          e.stopPropagation();
          allEntries[page] = allEntries[page].filter(e => e.id !== entry.id);
          await persistEntries();
          el.remove();
        });
        el.appendChild(del);
      }
    } else {
      el.querySelector('.entry-card-body')?.remove();
      el.querySelector('.entry-delete')?.remove();
    }
  });
  return el;
}

// ── Render a BLOG entry ─────────────────────────────
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
  el.querySelector('.entry-delete').addEventListener('click', async () => {
    allEntries[page] = allEntries[page].filter(e => e.id !== entry.id);
    await persistEntries();
    el.remove();
  });
  return el;
}

// ── Init ──────────────────────────────────────────────────────
async function init() {
  await fetchEntries();
  allPages.forEach(renderEntries);
}
init();