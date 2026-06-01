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

const allPages = [...document.querySelectorAll('.page')].map(el => el.id.replace('page-', ''));
const gridPages = [...document.querySelectorAll('.page[data="grid"]')].map(el => el.id.replace('page-', ''));
const descPages = [...document.querySelectorAll('.page[data="desc"]')].map(el => el.id.replace('page-', '')); 
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
  try {
    const res = await fetch(`${API}/data/entries.json`);
    const text = await res.text();
    allEntries = JSON.parse(text);
  } catch (e) {
    allEntries = Object.fromEntries(allPages.map(p => [p, []]));
  }
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
  container.innerHTML = '';
  const entries = allEntries[page] || [];
  if (descPages.includes(page)) {
    container.className = 'entries entries-desc';
    container.appendChild(buildDescEntryEl(entries[0], page));
  } else if (gridPages.includes(page)) {
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

  const isDesc = descPages.includes(page);
  const composer = createComposer(isDesc ? (allEntries[page]?.[0] || null) : null, !isDesc);
  composer.dataset.page = page;

  if (isDesc) {
    container.innerHTML = '';
    container.insertAdjacentElement('beforebegin', composer);
  } else if (gridPages.includes(page)) {
    container.insertAdjacentElement('beforebegin', composer);
  } else {
    container.prepend(composer);
  }

  composer.querySelector('.composer-cancel').addEventListener('click', () => {
    composer.remove();
    if (isDesc) renderEntries(page);
  });

  composer.querySelector('.composer-save').addEventListener('click', async () => {
    const body = composer.querySelector('.composer-body').value.trim();
    if (!body) return;
    if (isDesc) {
      allEntries[page] = [{ id: page, date: new Date().toLocaleDateString('en-CA'), body }];
    } else {
      allEntries[page].unshift({
        id: Date.now().toString(),
        title: composer.querySelector('.composer-title')?.value.trim() || 'Untitled',
        date: new Date().toLocaleDateString('en-CA'),
        body
      });
    }
    await persistEntries();
    composer.remove();
    renderEntries(page);
  });
}

function createComposer(entry) {
  const composer = document.createElement('div');
  composer.className = 'entry-composer';
  composer.innerHTML = `
    <input type="text" placeholder="Title" class="composer-title" value="${entry?.title || ''}" />
    <textarea placeholder="enter text here" class="composer-body">${entry?.body || ''}</textarea>
    <div class="composer-actions">
      <button class="composer-save">Save</button>
      <button class="composer-cancel">Cancel</button>
    </div>
  `;
  return composer;
}

function createActionButtons(onEdit, onDelete) {
  const del = document.createElement('button');
  del.className = 'entry-btn entry-delete';
  del.textContent = '✕ delete';
  del.addEventListener('click', async (e) => {
    e.stopPropagation();
    await onDelete();
  });
  const ed = document.createElement('button');
  ed.className = 'entry-btn entry-edit';
  ed.textContent = '✎ edit';
  ed.addEventListener('click', (e) => {
    e.stopPropagation();
    onEdit();
  });
  return { del, ed };
}

function editor(el, entry, page, onSave, onCancel) {
  if (el.querySelector('.entry-composer')) return;
  el.classList.add('entry-card-editing');

  const originalContent = Array.from(el.children);
  originalContent.forEach(child => child.style.display = 'none');

  const composer = createComposer(entry);
  el.appendChild(composer);

  composer.querySelector('.composer-cancel').addEventListener('click', () => {
    composer.remove();
    originalContent.forEach(child => child.style.display = '');
    el.classList.remove('entry-card-editing');
    if (onCancel) onCancel();
  });

  composer.querySelector('.composer-save').addEventListener('click', async () => {
    const title = composer.querySelector('.composer-title')?.value.trim();
    const body  = composer.querySelector('.composer-body').value.trim();
    if (!body) return;
    if (title !== undefined) entry.title = title || 'Untitled';
    entry.body = body;
    const idx = allEntries[page].findIndex(e => e.id === entry.id);
    if (idx !== -1) allEntries[page][idx] = entry;
    await persistEntries();
    composer.remove();
    originalContent.forEach(child => child.style.display = '');
    el.classList.remove('entry-card-editing');
    onSave(entry);
    
  });
}


// ── Grid entry ────────────────────────────────────────────────
function buildGridEntryEl(entry, page) {
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
    if (e.target.closest('.entry-composer') || e.target.classList.contains('entry-btn')) return;

    el.classList.toggle('entry-card-expanded');
    if (el.classList.contains('entry-card-expanded')) {
      const body = document.createElement('div');
      body.className = 'entry-card-body';
      body.innerHTML = renderMarkdown(entry.body);
      el.appendChild(body);

      if (IS_LOCAL) {
        const { del, ed } = createActionButtons(
          () => editor(el, entry, page, (updated) => {
            el.querySelector('.entry-card-title').textContent = updated.title;
            el.querySelector('.entry-card-body').innerHTML = renderMarkdown(updated.body);
          }),
          async () => {
            allEntries[page] = allEntries[page].filter(e => e.id !== entry.id);
            await persistEntries();
            el.remove();
          }
        );
        el.appendChild(del);
        el.appendChild(ed);
      }
    } else {
      el.querySelector('.entry-card-body')?.remove();
      el.querySelector('.entry-delete')?.remove();
      el.querySelector('.entry-edit')?.remove();
    }
  });

  return el;
}

// ── Blog entry ────────────────────────────────────────────────
function buildEntryEl(entry, page) {
  const el = document.createElement('div');
  el.className = 'entry';
  el.dataset.id = entry.id;
  el.innerHTML = `
    <div class="entry-meta">
      <span class="entry-title">${entry.title || 'Untitled'}</span>
      <span>
        <span class="entry-date">${entry.date}</span>
        ${IS_LOCAL ? `
          <button class="entry-delete entry-btn">✕</button>
          <button class="entry-edit entry-btn">✎</button>
        ` : ''}
      </span>
    </div>
    <div class="entry-body">${renderMarkdown(entry.body)}</div>
  `;

  if (IS_LOCAL) {
    el.querySelector('.entry-delete').addEventListener('click', async () => {
      allEntries[page] = allEntries[page].filter(e => e.id !== entry.id);
      await persistEntries();
      el.remove();
    });

    el.querySelector('.entry-edit').addEventListener('click', () => {
      editor(el, entry, page, (updated) => {
        el.querySelector('.entry-title').textContent = updated.title;
        el.querySelector('.entry-body').innerHTML = renderMarkdown(updated.body);
      });
    });
  }

  return el;
}

// ── Desc entry ────────────────────────────────────────────────
function buildDescEntryEl(entry, page) {
  const el = document.createElement('div');
  el.className = 'entry';

  if (entry) {
    el.dataset.id = entry.id;
    el.innerHTML = `<div class="entry-body">${renderMarkdown(entry.body)}</div>`;
  }

  if (IS_LOCAL) {
    const btn = document.createElement('button');
    btn.className = 'add-entry-btn';
    btn.textContent = entry ? '✎ edit' : '+';
    btn.addEventListener('click', () => openComposer(page));
    el.appendChild(btn);
  }

  return el;
}

async function init() {
  await fetchEntries();
  allPages.forEach(renderEntries);
}
init();


