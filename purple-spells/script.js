let currentTab = 'enum';
const VAR_MAP = {};

const CHANGELOG = {
  version: '1.4.0',
  entries: [
    { ver: '1.4.0', date: '2025-03-01', items: [
      'CREDS VAULT: panel opens on the right (CREDS button); add credentials (source, user, domain, pass, NTLM hash, note)',
      'USE button fills User, Domain, Pass, NTLM fields in target bar; CSV export; NTLM field added to target bar',
    ]},
    { ver: '1.3.0', date: '2025-03-01', items: [
      'Keyboard shortcuts: 1–9 switch tabs (Enumeration → MISC), 0 opens Favorites; Ctrl+number works too',
      'Favorites tab: star (★) on each section and subsection to favorite; Favorites tab lists them for quick jump',
      'Favorites persisted in localStorage; sidebar shows favorites when on Favorites tab',
    ]},
    { ver: '1.2.0', date: '2025-03-01', items: [
      'Shareable deep links: anchor (link) button on every section and subsection title',
      'Click anchor → copies URL with hash; opening link switches tab, uncollapses section, scrolls to target',
      'Sidebar links now update URL hash and uncollapse section when clicked',
      'Zoom fix: font size − / + now scales main content (root font-size on html); top bar and tabs stay frozen',
      'RevShells embed: full-height iframe (no internal scroll), fallback text removed',
    ]},
    { ver: '1.1.0', date: '2025-03-01', items: [
      'Deep links: URL hash (e.g. #s-lateral-movement) opens tab and scrolls to section',
      'Escape clears search and restores collapsed state',
      'MSFvenom command generator (payload, format, LHOST, LPORT, output)',
      'Hashcat command generator (mode, hash file, wordlist, rules, --force)',
      'Font size: − / + buttons (12–20px), persisted',
      'Click code block to copy (plus COPY button)',
      'Light theme toggle (THEME button), persisted',
      'Clipboard fallback when Clipboard API unavailable',
      'Notes panel: scratch area (NOTES button), persisted',
    ]},
    { ver: '1.0.1', date: '2025-03-01', items: [
      'Default WORDLIST: /usr/share/wordlist/rockyou.txt',
      'Default DIRLIST: /usr/share/wordlist/SecLists-master/.../DirBuster-2007_directory-list-2.3-medium.txt',
      'Version format: 1.0.0 style',
      'What\'s New: version and date on same line',
    ]},
    { ver: '1.0.0', date: '2025-03-01', items: [
      'What\'s New modal, PIVOTING → NETWORKING',
      'Networking: Ping/Port sweep, Network analysis, Tunneling (SSH, Ligolo, Chisel, dnscat2)',
      'AD Lateral Movement: nxc, WinRM, PsExec, smbexec, wmiexec, RDP, DCOM',
      'WORDLIST/DIRLIST placeholders, nxc SSH key spray',
      'Search: restore collapsed state when clearing',
    ]},
  ]
};

function openWhatsNew() {
  const body = document.getElementById('whatsnew-body');
  let html = '';
  CHANGELOG.entries.forEach(e => {
    html += `<div class="version-row"><span class="version">v${e.ver}</span><span class="date">${e.date}</span></div><ul>`;
    e.items.forEach(i => { html += `<li>${i}</li>`; });
    html += '</ul>';
  });
  body.innerHTML = html || '<p>No updates yet.</p>';
  document.getElementById('whatsnew-overlay').classList.add('show');
}
function closeWhatsNew() {
  document.getElementById('whatsnew-overlay').classList.remove('show');
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');
  document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
  localStorage.setItem('cs_tab', tab);
  buildSidebar();
  window.scrollTo(0, 0);
  updateCollapseAllBtn();
}

function applyHash() {
  const id = location.hash.slice(1);
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  const panel = el.closest('.panel');
  if (!panel) return;
  const tab = panel.id.replace('panel-', '');
  if (tab && tab !== currentTab) {
    switchTab(tab);
  }
  const section = el.classList.contains('section') ? el : el.closest('.section');
  const subsection = el.classList.contains('subsection') ? el : el.closest('.subsection');
  if (section) section.classList.remove('collapsed');
  if (subsection) subsection.classList.remove('collapsed');
  saveCollapsedState();
  // Wait for layout after uncollapse, then scroll so target sits just below sticky header
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const topbarH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h'), 10) || 100;
        const tabsEl = document.querySelector('.tabs');
        const stickyOffset = topbarH + (tabsEl ? tabsEl.offsetHeight : 50) + 8;
        const rect = el.getBoundingClientRect();
        const targetScrollY = window.scrollY + rect.top - stickyOffset;
        window.scrollTo({ top: Math.max(0, targetScrollY), behavior: 'smooth' });
      }, 80);
    });
  });
}

function saveCollapsedState() {
  const collapsed = [];
  document.querySelectorAll('.section').forEach(s => {
    if (s.classList.contains('collapsed')) collapsed.push(s.id);
  });
  localStorage.setItem('cs_collapsed', JSON.stringify(collapsed));
  const subCollapsed = [];
  document.querySelectorAll('.subsection').forEach(s => {
    if (s.id && s.classList.contains('collapsed')) subCollapsed.push(s.id);
  });
  localStorage.setItem('cs_collapsed_subsections', JSON.stringify(subCollapsed));
}

function toggleSection(header) {
  header.closest('.section').classList.toggle('collapsed');
  saveCollapsedState();
  updateCollapseAllBtn();
}

function toggleSubsection(header) {
  header.closest('.subsection').classList.toggle('collapsed');
  saveCollapsedState();
}

function wrapSubsections() {
  document.querySelectorAll('.section-body').forEach(body => {
    const kids = [...body.children];
    const runs = [];
    let current = null;
    for (const el of kids) {
      if (el.classList && el.classList.contains('sub-title')) {
        current = { header: el, body: [] };
        runs.push(current);
      } else if (current) {
        current.body.push(el);
      }
    }
    runs.forEach((run, i) => {
      const insertBefore = runs[i + 1] ? runs[i + 1].header : null;
      const subsection = document.createElement('div');
      subsection.className = 'subsection collapsed';
      const section = body.closest('.section');
      const sid = section ? section.id : '';
      subsection.id = sid ? sid + '--sub' + i : null;
      const headerDiv = document.createElement('div');
      headerDiv.className = 'subsection-header';
      headerDiv.innerHTML = '<span class="subsection-icon">&#9660;</span>';
      headerDiv.appendChild(run.header);
      headerDiv.onclick = function() { toggleSubsection(this); };
      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'subsection-body';
      run.body.forEach(el => bodyDiv.appendChild(el));
      subsection.appendChild(headerDiv);
      subsection.appendChild(bodyDiv);
      if (insertBefore) body.insertBefore(subsection, insertBefore);
      else body.appendChild(subsection);
    });
  });
}

function buildSidebar() {
  const sb = document.getElementById('sidebar');
  if (!sb) return;
  if (currentTab === 'favorites') {
    const ids = getFavorites();
    let html = '<div class="sidebar-title">FAVORITES</div>';
    ids.forEach(id => {
      const title = getTitleForId(id);
      if (title) html += `<a href="#${id}" onclick="location.hash='${id}'; applyHash(); document.querySelector('.sidebar').classList.remove('open'); return false;">${title}</a>`;
    });
    sb.innerHTML = html || '<div class="sidebar-title">FAVORITES</div>';
    return;
  }
  const panel = document.getElementById('panel-' + currentTab);
  if (!panel) return;
  let html = '<div class="sidebar-title">' + currentTab.toUpperCase() + '</div>';
  panel.querySelectorAll('.section').forEach(s => {
    if (s.style.display === 'none') return;
    const title = s.querySelector('.section-title')?.textContent || '';
    html += `<a href="#${s.id}" onclick="location.hash='${s.id}'; applyHash(); document.querySelector('.sidebar').classList.remove('open'); return false;">${title}</a>`;
  });
  sb.innerHTML = html;
}

const LINK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>';
const STAR_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
const STAR_OUTLINE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';

function getFavorites() {
  try {
    const raw = localStorage.getItem('cs_favorites');
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function setFavorites(ids) {
  localStorage.setItem('cs_favorites', JSON.stringify(ids));
  updateFavoritesUI();
}
function toggleFavorite(id) {
  const ids = getFavorites();
  const i = ids.indexOf(id);
  if (i >= 0) ids.splice(i, 1);
  else ids.push(id);
  setFavorites(ids);
}
function getTitleForId(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (el.classList.contains('section')) return el.querySelector('.section-title')?.textContent?.trim() || id;
  if (el.classList.contains('subsection')) return el.querySelector('.sub-title')?.textContent?.trim() || id;
  return id;
}
function renderFavoritesPanel() {
  const list = document.getElementById('favorites-list');
  const panel = document.querySelector('.favorites-panel');
  if (!list || !panel) return;
  let ids = getFavorites();
  const valid = ids.filter(id => getTitleForId(id));
  if (valid.length !== ids.length) setFavorites(valid);
  ids = valid;
  panel.classList.toggle('has-items', ids.length > 0);
  list.innerHTML = ids.map(id => {
    const title = getTitleForId(id);
    return `<a href="#${id}" onclick="location.hash='${id}'; applyHash(); return false;">${title}</a>`;
  }).join('');
}
function updateFavoritesUI() {
  renderFavoritesPanel();
  const ids = getFavorites();
  document.querySelectorAll('.fav-btn').forEach(btn => {
    const id = btn.dataset.favId;
    btn.classList.toggle('favorited', id && ids.includes(id));
    btn.innerHTML = id && ids.includes(id) ? STAR_ICON : STAR_OUTLINE_ICON;
    btn.title = id && ids.includes(id) ? 'Remove from favorites' : 'Add to favorites';
  });
  const tabBtn = document.querySelector('.tab[data-tab="favorites"]');
  if (tabBtn) tabBtn.title = 'Favorites (' + ids.length + ')';
}

function copySectionLink(btn, targetId) {
  const url = location.origin + location.pathname + '#' + targetId;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => flash('Link copied'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      flash('Link copied');
    } catch (e) {}
    document.body.removeChild(ta);
  }
}

function addFavoriteButton(header, id, isSection) {
  if (!header || header.querySelector('.fav-btn')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'fav-btn';
  btn.setAttribute('aria-label', 'Add to favorites');
  btn.dataset.favId = id;
  btn.innerHTML = getFavorites().includes(id) ? STAR_ICON : STAR_OUTLINE_ICON;
  btn.title = 'Add to favorites';
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  });
  header.appendChild(btn);
}

function initDeepLinks() {
  document.querySelectorAll('.section').forEach(section => {
    const header = section.querySelector('.section-header');
    if (!header || header.querySelector('.anchor-link')) return;
    addFavoriteButton(header, section.id, true);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'anchor-link';
    btn.title = 'Copy link to this section';
    btn.setAttribute('aria-label', 'Copy link');
    btn.innerHTML = LINK_ICON;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      copySectionLink(btn, section.id);
    });
    header.appendChild(btn);
  });
  document.querySelectorAll('.subsection').forEach(subsection => {
    const header = subsection.querySelector('.subsection-header');
    if (!header || !subsection.id || header.querySelector('.anchor-link')) return;
    addFavoriteButton(header, subsection.id, false);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'anchor-link';
    btn.title = 'Copy link to this part';
    btn.setAttribute('aria-label', 'Copy link');
    btn.innerHTML = LINK_ICON;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      copySectionLink(btn, subsection.id);
    });
    header.appendChild(btn);
  });
  updateFavoritesUI();
}

// CREDS VAULT
function getCreds() {
  try {
    const raw = localStorage.getItem('cs_creds');
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function setCreds(arr) {
  localStorage.setItem('cs_creds', JSON.stringify(arr));
  renderCredsVault();
}
function addCred() {
  const source = document.getElementById('vault-source')?.value?.trim() || '';
  const user = document.getElementById('vault-user')?.value?.trim() || '';
  const domain = document.getElementById('vault-domain')?.value?.trim() || '';
  const pass = document.getElementById('vault-pass')?.value?.trim() || '';
  const ntlm = document.getElementById('vault-ntlm')?.value?.trim() || '';
  const note = document.getElementById('vault-note')?.value?.trim() || '';
  const id = source || user || 'cred-' + Date.now();
  const cred = { id, source, user, domain, pass, ntlm, note, ts: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
  const creds = getCreds();
  creds.unshift(cred);
  setCreds(creds);
  document.getElementById('vault-source').value = '';
  document.getElementById('vault-user').value = '';
  document.getElementById('vault-domain').value = '';
  document.getElementById('vault-pass').value = '';
  document.getElementById('vault-ntlm').value = '';
  document.getElementById('vault-note').value = '';
  flash('Credential added');
}
function removeCred(index) {
  const creds = getCreds();
  creds.splice(index, 1);
  setCreds(creds);
  flash('Credential removed');
}
function useCred(index) {
  const creds = getCreds();
  const cred = creds[index];
  if (!cred) return;
  const userEl = document.getElementById('var-user');
  const domainEl = document.getElementById('var-domain');
  const passEl = document.getElementById('var-pass');
  const ntlmEl = document.getElementById('var-ntlm');
  if (userEl && cred.user) { userEl.value = cred.user; userEl.dispatchEvent(new Event('input')); }
  if (domainEl && cred.domain) { domainEl.value = cred.domain; domainEl.dispatchEvent(new Event('input')); }
  if (passEl && cred.pass) { passEl.value = cred.pass; passEl.dispatchEvent(new Event('input')); }
  if (ntlmEl && cred.ntlm) { ntlmEl.value = cred.ntlm; ntlmEl.dispatchEvent(new Event('input')); }
  flash('Credential applied');
}
function renderCredsVault() {
  const list = document.getElementById('creds-vault-list');
  const countEl = document.getElementById('creds-vault-count');
  const creds = getCreds();
  if (countEl) countEl.textContent = creds.length + ' cred' + (creds.length !== 1 ? 's' : '');
  if (!list) return;
  list.innerHTML = creds.map((c, i) => {
    const tags = [];
    if (c.user) tags.push(`<span class="creds-vault-item-tag">USER ${escapeHtml(c.user)}</span>`);
    if (c.domain) tags.push(`<span class="creds-vault-item-tag">DOM ${escapeHtml(c.domain)}</span>`);
    if (c.pass) tags.push(`<span class="creds-vault-item-tag">PASS ${escapeHtml(c.pass)}</span>`);
    if (c.ntlm) tags.push(`<span class="creds-vault-item-tag">NTLM</span>`);
    return `<div class="creds-vault-item" id="cred-item-${i}">
      <div class="creds-vault-item-header"><span class="creds-vault-item-id">${escapeHtml(c.id)}</span><span class="creds-vault-item-ts">${escapeHtml(c.ts)}</span></div>
      <div class="creds-vault-item-tags">${tags.join('')}</div>
      ${c.note ? `<div class="creds-vault-item-note">${escapeHtml(c.note)}</div>` : ''}
      <div class="creds-vault-item-actions">
        <button type="button" class="creds-vault-use-btn" onclick="useCred(${i})">$ USE</button>
        <button type="button" class="creds-vault-edit-btn" onclick="editCred(${i})">✎ EDIT</button>
        <button type="button" class="creds-vault-del-btn" onclick="removeCred(${i})">× DEL</button>
      </div>
    </div>`;
  }).join('');
}
function editCred(index) {
  const creds = getCreds();
  const c = creds[index];
  if (!c) return;
  const item = document.getElementById('cred-item-' + index);
  if (!item || item.querySelector('.creds-vault-edit-form')) return;
  const form = document.createElement('div');
  form.className = 'creds-vault-edit-form';
  form.innerHTML = `
    <div class="vault-edit-row">
      <div><label>Source / ID</label><input type="text" id="edit-source-${index}" value="${escapeHtml(c.source||'')}"></div>
      <div><label>Username</label><input type="text" id="edit-user-${index}" value="${escapeHtml(c.user||'')}"></div>
    </div>
    <div class="vault-edit-row">
      <div><label>Domain</label><input type="text" id="edit-domain-${index}" value="${escapeHtml(c.domain||'')}"></div>
      <div><label>Password</label><input type="text" id="edit-pass-${index}" value="${escapeHtml(c.pass||'')}"></div>
    </div>
    <div class="vault-edit-row">
      <div><label>NTLM Hash</label><input type="text" id="edit-ntlm-${index}" value="${escapeHtml(c.ntlm||'')}"></div>
      <div><label>Note</label><input type="text" id="edit-note-${index}" value="${escapeHtml(c.note||'')}"></div>
    </div>
    <div class="creds-vault-edit-actions">
      <button type="button" class="creds-vault-save-btn" onclick="saveCred(${index})">✔ SAVE</button>
      <button type="button" class="creds-vault-cancel-btn" onclick="renderCredsVault()">✕ CANCEL</button>
    </div>`;
  item.appendChild(form);
}
function saveCred(index) {
  const creds = getCreds();
  if (!creds[index]) return;
  const source = document.getElementById('edit-source-'+index)?.value?.trim()||'';
  const user   = document.getElementById('edit-user-'+index)?.value?.trim()||'';
  const domain = document.getElementById('edit-domain-'+index)?.value?.trim()||'';
  const pass   = document.getElementById('edit-pass-'+index)?.value?.trim()||'';
  const ntlm   = document.getElementById('edit-ntlm-'+index)?.value?.trim()||'';
  const note   = document.getElementById('edit-note-'+index)?.value?.trim()||'';
  creds[index] = { ...creds[index], id: source||user||creds[index].id, source, user, domain, pass, ntlm, note };
  setCreds(creds);
  flash('Credential updated');
}
function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
function exportCredsCsv() {
  const creds = getCreds();
  const headers = ['Source','Username','Domain','Password','NTLM Hash','Note','Added'];
  const rows = creds.map(c => [c.source,c.user,c.domain,c.pass,c.ntlm,c.note,c.ts].map(v => '"' + String(v || '').replace(/"/g, '""') + '"').join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'creds-vault-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  flash('CSV exported');
}
function toggleCredsVault() {
  const panel = document.getElementById('creds-vault-panel');
  const overlay = document.getElementById('creds-vault-overlay');
  const open = !panel?.classList.contains('open');
  panel?.classList.toggle('open', open);
  overlay?.classList.toggle('open', open);
  if (open) renderCredsVault();
}
function toggleArrayTools() {
  const panel = document.getElementById('array-tools-panel');
  const overlay = document.getElementById('array-tools-overlay');
  const open = !panel?.classList.contains('open');
  panel?.classList.toggle('open', open);
  overlay?.classList.toggle('open', open);
}

function initCredsVault() {
  const addBtn = document.getElementById('vault-add-btn');
  const csvBtn = document.getElementById('creds-vault-csv');
  addBtn?.addEventListener('click', addCred);
  csvBtn?.addEventListener('click', exportCredsCsv);
  renderCredsVault();
}

// Variable substitution & Validation
function initVarInputs() {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:-(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))?$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;

  document.querySelectorAll('.target-bar input[data-vars]').forEach(input => {
    const vars = input.dataset.vars.split(',');
    const stored = localStorage.getItem('cs_' + input.id);
    if (stored) input.value = stored;

    const validate = () => {
      if (input.id === 'var-ip') {
        const value = input.value.trim();
        if (value !== "") {
          const isValid = ipRegex.test(value);
          input.parentElement.classList.toggle('invalid', !isValid);
        } else {
          input.parentElement.classList.remove('invalid');
        }
      }
    };

    if (input.value) {
      vars.forEach(v => VAR_MAP[v] = input.value);
    }
    validate();

    input.addEventListener('input', () => {
      localStorage.setItem('cs_' + input.id, input.value);
      vars.forEach(v => VAR_MAP[v] = input.value);
      applySubstitutions();

      if (input.id === 'var-ip') {
          input.parentElement.classList.remove('invalid');
      }
    });

    input.addEventListener('blur', () => {
      validate();
    });
  });
}


function applySubstitutions() {
  document.querySelectorAll('pre[data-template]').forEach(pre => {
    if (!pre.dataset.original) pre.dataset.original = pre.innerHTML;
    let html = pre.dataset.original;
    for (const [key, val] of Object.entries(VAR_MAP)) {
      if (!val) continue;
      const escaped = val.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const re = new RegExp('&lt;' + key + '&gt;', 'g');
      html = html.replace(re, `<span class="var-highlight">${escaped}</span>`);
    }
    pre.innerHTML = html;
  });
  // On ne déclenche la coloration QUE sur le YAML
  if (window.Prism) {
    document.querySelectorAll('pre.language-yaml').forEach((block) => {
      Prism.highlightElement(block);
      });
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed'; ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    return Promise.resolve();
  } catch (e) {
    return Promise.reject(e);
  } finally {
    document.body.removeChild(ta);
  }
}

function addCopyButtons() {
  document.querySelectorAll('.code-wrap').forEach(wrap => {
    if (wrap.querySelector('.copy-btn')) return;
    const pre = wrap.querySelector('pre');
    if (!pre) return;
    const doCopy = () => {
      const text = pre.innerText;
      copyToClipboard(text).then(() => {
        flash('Copied');
        if (btn) { btn.textContent = 'COPIED'; btn.classList.add('copied'); setTimeout(() => { btn.textContent = 'COPY'; btn.classList.remove('copied'); }, 1500); }
      }).catch(() => flash('Copy failed'));
    };
    pre.style.cursor = 'pointer';
    pre.title = 'Click to copy';
    pre.addEventListener('click', (e) => { if (e.target.closest('.copy-btn')) return; doCopy(); });
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'COPY';
    btn.onclick = (e) => { e.stopPropagation(); doCopy(); };
    wrap.appendChild(btn);
  });
}

// Search (global across all tabs, filters at subsection level when available)
function initSearch() {
  const input = document.getElementById('search');
  let preSearchState = null;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    const panelsWithMatch = new Set();
    if (q && !preSearchState) {
      preSearchState = {
        collapsed: [...document.querySelectorAll('.section.collapsed')].map(s => s.id),
        subCollapsed: [...document.querySelectorAll('.subsection.collapsed')].filter(s => s.id).map(s => s.id)
      };
    }
    document.querySelectorAll('.panel .section').forEach(section => {
      const subsections = section.querySelectorAll(':scope .subsection');
      if (!q) {
        section.style.display = '';
        subsections.forEach(sub => sub.style.display = '');
        return;
      }
      if (subsections.length === 0) {
        const match = section.textContent.toLowerCase().includes(q);
        section.style.display = match ? '' : 'none';
        if (match) {
          section.classList.remove('collapsed');
          const panel = section.closest('.panel');
          if (panel) panelsWithMatch.add(panel.id);
        }
        return;
      }
      let anyVisible = false;
      subsections.forEach(sub => {
        const match = sub.textContent.toLowerCase().includes(q);
        sub.style.display = match ? '' : 'none';
        if (match) {
          anyVisible = true;
          section.classList.remove('collapsed');
          sub.classList.remove('collapsed');
          const panel = section.closest('.panel');
          if (panel) panelsWithMatch.add(panel.id);
        }
      });
      section.style.display = anyVisible ? '' : 'none';
    });
    if (!q) {
      if (preSearchState) {
        document.querySelectorAll('.section').forEach(s => s.classList.toggle('collapsed', preSearchState.collapsed.includes(s.id)));
        document.querySelectorAll('.subsection').forEach(s => s.classList.toggle('collapsed', preSearchState.subCollapsed.includes(s.id)));
        preSearchState = null;
      } else {
        const savedCollapsed = localStorage.getItem('cs_collapsed');
        const savedSubCollapsed = localStorage.getItem('cs_collapsed_subsections');
        if (savedCollapsed) {
          const collapsed = JSON.parse(savedCollapsed);
          document.querySelectorAll('.section').forEach(s => s.classList.toggle('collapsed', collapsed.includes(s.id)));
        } else {
          document.querySelectorAll('.section').forEach(s => s.classList.add('collapsed'));
        }
        if (savedSubCollapsed) {
          const subCollapsed = JSON.parse(savedSubCollapsed);
          document.querySelectorAll('.subsection').forEach(s => s.classList.toggle('collapsed', subCollapsed.includes(s.id)));
        } else {
          document.querySelectorAll('.subsection').forEach(s => s.classList.add('collapsed'));
        }
      }
    }
    document.querySelectorAll('.tab').forEach(tab => {
      const tabId = tab.dataset.tab;
      const panelId = 'panel-' + tabId;
      tab.classList.toggle('has-match', q && panelsWithMatch.has(panelId));
    });
    buildSidebar();
  });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); input.focus(); input.select(); return; }
    if (e.key === 'Escape' && document.activeElement === input) {
      input.value = '';
      input.blur();
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}

function flash(msg) {
  const el = document.getElementById('flash-msg');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}

function syncTopbarHeight() {
  const h = document.querySelector('.target-bar').offsetHeight;
  document.documentElement.style.setProperty('--topbar-h', h + 'px');
}

// Hydra command generator
function updateHydraGen() {
  const proto = document.getElementById('hg-protocol').value;
  const creds = document.getElementById('hg-creds').value;
  const target = document.getElementById('hg-target').value || '<IP>';
  const port = document.getElementById('hg-port').value.trim();
  const threads = document.getElementById('hg-threads').value || '16';
  const ssl = document.getElementById('hg-ssl').checked;
  const stop = document.getElementById('hg-stop').checked;
  const user = document.getElementById('hg-user').value || 'admin';
  const passfile = document.getElementById('hg-passfile').value || VAR_MAP.WORDLIST || '/usr/share/wordlist/rockyou.txt';
  const usersfile = document.getElementById('hg-usersfile').value || 'users.txt';
  const combo = document.getElementById('hg-combo').value || 'combo.txt';
  const path = document.getElementById('hg-path').value || '/login.php';
  const formbody = document.getElementById('hg-formbody').value || 'username=^USER^&password=^PASS^';
  let fail = (document.getElementById('hg-fail').value || 'Login failed').replace(/^F=/, '');
  let success = (document.getElementById('hg-success').value || '').replace(/^S=/, '');
  const basicpath = document.getElementById('hg-basicpath').value || '/';
  let t = target;
  if (VAR_MAP.IP && t.includes('<IP>')) t = t.replace(/<IP>/g, VAR_MAP.IP);
  if (VAR_MAP.TARGET && t.includes('<TARGET>')) t = t.replace(/<TARGET>/g, VAR_MAP.TARGET);
  let parts = [];
  if (creds === 'lP') parts.push('-l', user, '-P', passfile);
  else if (creds === 'LP') parts.push('-L', usersfile, '-P', passfile);
  else if (creds === 'lp') parts.push('-l', user, '-p', document.getElementById('hg-pass').value || 'password');
  else if (creds === 'C') parts.push('-C', combo);
  if (stop) parts.push('-f');
  if (port) parts.push('-s', port);
  if (ssl && !proto.includes('https') && !proto.includes('ftps') && !proto.includes('smtps') && !proto.includes('pop3s')) parts.push('-S');
  parts.push('-t', threads);
  if (proto === 'http-post-form' || proto === 'https-post-form') {
    const formStr = path + ':' + formbody + ':' + (fail ? 'F=' + fail : '') + (success ? (fail ? ' ' : '') + 'S=' + success : '');
    parts.push(t, proto, '"' + formStr + '"');
  } else if (proto === 'http-get' || proto === 'https-get') {
    const bp = basicpath.startsWith('/') ? basicpath : '/' + basicpath;
    parts.push(proto + '://' + t + (port ? ':' + port : '') + bp);
  } else {
    parts.push(proto + '://' + t);
  }
  const cmd = 'hydra ' + parts.filter(Boolean).join(' ');
  document.getElementById('hg-output').textContent = cmd;
}
function initHydraGen() {
  const gen = document.getElementById('hydra-gen');
  if (!gen) return;
  const protoSel = document.getElementById('hg-protocol');
  const credSel = document.getElementById('hg-creds');
  const formRow = document.getElementById('hg-form-row');
  const basicRow = document.getElementById('hg-basic-row');
  const toggleRows = () => {
    const p = protoSel.value;
    formRow.style.display = (p === 'http-post-form' || p === 'https-post-form') ? 'flex' : 'none';
    basicRow.style.display = (p === 'http-get' || p === 'https-get') ? 'flex' : 'none';
  };
  const toggleCreds = () => {
    const c = credSel.value;
    document.getElementById('hg-user-wrap').style.display = (c === 'lP' || c === 'lp') ? 'block' : 'none';
    document.getElementById('hg-passfile-wrap').style.display = (c === 'lP' || c === 'LP') ? 'block' : 'none';
    document.getElementById('hg-pass-wrap').style.display = c === 'lp' ? 'block' : 'none';
    document.getElementById('hg-usersfile-wrap').style.display = c === 'LP' ? 'block' : 'none';
    document.getElementById('hg-combo-wrap').style.display = c === 'C' ? 'block' : 'none';
  };
  protoSel.addEventListener('change', () => { toggleRows(); updateHydraGen(); });
  credSel.addEventListener('change', () => { toggleCreds(); updateHydraGen(); });
  gen.querySelectorAll('input, select').forEach(el => el.addEventListener('input', updateHydraGen));
  gen.querySelectorAll('input, select').forEach(el => el.addEventListener('change', updateHydraGen));
  const ipInput = document.getElementById('var-ip');
  if (ipInput) {
    ipInput.addEventListener('input', updateHydraGen);
    const tg = document.getElementById('hg-target');
    if (tg && !tg.value && ipInput.value) tg.placeholder = ipInput.value;
  }
  toggleRows();
  toggleCreds();
  updateHydraGen();
}

function updateMsfvenomGen() {
  const payload = document.getElementById('mv-payload')?.value || 'windows/x64/shell_reverse_tcp';
  const fmt = document.getElementById('mv-format')?.value || 'exe';
  const lhost = document.getElementById('mv-lhost')?.value || VAR_MAP.LHOST || '<LHOST>';
  const lport = document.getElementById('mv-lport')?.value || VAR_MAP.LPORT || '443';
  const out = document.getElementById('mv-out')?.value || 'shell.exe';
  const el = document.getElementById('mv-output');
  if (el) el.textContent = `msfvenom -p ${payload} LHOST=${lhost} LPORT=${lport} -f ${fmt} -o ${out}`;
}
function initMsfvenomGen() {
  const gen = document.getElementById('msfvenom-gen');
  if (!gen) return;
  gen.querySelectorAll('input, select').forEach(el => el.addEventListener('input', updateMsfvenomGen));
  gen.querySelectorAll('input, select').forEach(el => el.addEventListener('change', updateMsfvenomGen));
  const lh = document.getElementById('var-lhost');
  if (lh) lh.addEventListener('input', updateMsfvenomGen);
  const lp = document.getElementById('var-lport');
  if (lp) lp.addEventListener('input', updateMsfvenomGen);
  updateMsfvenomGen();
}

function updateHashcatGen() {
  const mode = document.getElementById('hc-mode')?.value || '0';
  const hashFile = document.getElementById('hc-hash')?.value || 'hash.txt';
  const wordlist = document.getElementById('hc-wordlist')?.value || VAR_MAP.WORDLIST || '<WORDLIST>';
  const rules = document.getElementById('hc-rules')?.value?.trim() || '';
  const force = document.getElementById('hc-force')?.checked ?? true;
  const parts = ['hashcat', '-m', mode, hashFile, wordlist];
  if (rules) parts.push('-r', rules);
  if (force) parts.push('--force');
  const el = document.getElementById('hc-output');
  if (el) el.textContent = parts.join(' ');
}
function initHashcatGen() {
  const gen = document.getElementById('hashcat-gen');
  if (!gen) return;
  gen.querySelectorAll('input, select').forEach(el => el.addEventListener('input', updateHashcatGen));
  gen.querySelectorAll('input, select').forEach(el => el.addEventListener('change', updateHashcatGen));
  const wl = document.getElementById('var-wordlist');
  if (wl) wl.addEventListener('input', updateHashcatGen);
  updateHashcatGen();
}

// Boot
wrapSubsections();
initDeepLinks();
let savedTab = localStorage.getItem('cs_tab');
if (savedTab === 'ad') { savedTab = 'domain'; localStorage.setItem('cs_tab', 'domain'); }
if (savedTab === 'pivot') { savedTab = 'network'; localStorage.setItem('cs_tab', 'network'); }
if (savedTab && document.getElementById('panel-' + savedTab)) {
  currentTab = savedTab;
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('panel-' + savedTab).classList.add('active');
  const tabEl = document.querySelector(`.tab[data-tab="${savedTab}"]`);
  if (tabEl) tabEl.classList.add('active');
}
const savedCollapsed = localStorage.getItem('cs_collapsed');
if (savedCollapsed) {
  const collapsed = JSON.parse(savedCollapsed);
  document.querySelectorAll('.section').forEach(s => {
    s.classList.toggle('collapsed', collapsed.includes(s.id));
  });
} else {
  document.querySelectorAll('.section').forEach(s => s.classList.add('collapsed'));
}
const savedSubCollapsed = localStorage.getItem('cs_collapsed_subsections');
if (savedSubCollapsed) {
  const subCollapsed = JSON.parse(savedSubCollapsed);
  document.querySelectorAll('.subsection').forEach(s => {
    s.classList.toggle('collapsed', subCollapsed.includes(s.id));
  });
} else {
  document.querySelectorAll('.subsection').forEach(s => {
    const sec = s.closest('.section');
    if (sec && sec.id === 's-lateral-movement') s.classList.remove('collapsed');
    else s.classList.add('collapsed');
  });
}
document.body.classList.remove('cs-loading');
document.body.classList.add('cs-ready');
syncTopbarHeight();

window.addEventListener('resize', syncTopbarHeight);
initVarInputs();
applySubstitutions();
addCopyButtons();
buildSidebar();
initSearch();
initHydraGen();
initMsfvenomGen();
initHashcatGen();

// ===== COLLAPSE ALL =====
function updateCollapseAllBtn() {
  const btn = document.getElementById('collapse-all-btn');
  if (!btn) return;
  const panel = document.querySelector('.panel.active');
  const open = panel ? panel.querySelectorAll('.section:not(.collapsed)').length : 0;
  btn.classList.toggle('visible', open >= 1);
}
function collapseAllSections() {
  const panel = document.querySelector('.panel.active');
  if (!panel) return;
  panel.querySelectorAll('.section:not(.collapsed)').forEach(s => s.classList.add('collapsed'));
  panel.querySelectorAll('.subsection:not(.collapsed)').forEach(s => s.classList.add('collapsed'));
  saveCollapsedState();
  updateCollapseAllBtn();
}

// ===== CLEAR ALL INPUTS =====
function openConfirmModal() {
  document.getElementById('confirm-overlay').classList.add('show');
}
function closeConfirmModal() {
  document.getElementById('confirm-overlay').classList.remove('show');
}
function clearAllInputs() {
  ['var-ip','var-url','var-domain','var-user','var-pass','var-ntlm','var-lhost','var-lport','var-wordlist','var-dirlist'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = '';
    el.dispatchEvent(new Event('input'));
    localStorage.removeItem('cs_' + id);
    const clearBtn = el.parentElement.querySelector('.input-clear');
    if (clearBtn) clearBtn.classList.remove('has-value');
  });
  closeConfirmModal();
  flash('Champs effacés');
}

// ===== INPUT CLEAR CROSSES =====
function initInputClears() {
  document.querySelectorAll('.tfield .input-clear').forEach(btn => {
    const input = document.getElementById(btn.dataset.for);
    if (!input) return;
    if (input.value) btn.classList.add('has-value');
    input.addEventListener('input', () => btn.classList.toggle('has-value', input.value.length > 0));
    btn.addEventListener('mousedown', e => {
      e.preventDefault();
      input.value = '';
      input.dispatchEvent(new Event('input'));
      btn.classList.remove('has-value');
      input.focus();
    });
  });
  const searchInput = document.getElementById('search');
  const searchClear = document.getElementById('search-clear');
  if (searchInput && searchClear) {
    searchInput.addEventListener('input', () => searchClear.classList.toggle('has-value', searchInput.value.length > 0));
    searchClear.addEventListener('mousedown', e => {
      e.preventDefault();
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      searchClear.classList.remove('has-value');
      searchInput.focus();
    });
  }
  document.getElementById('clear-all-btn')?.addEventListener('click', openConfirmModal);
  document.getElementById('collapse-all-btn')?.addEventListener('click', collapseAllSections);
  const overlay = document.getElementById('confirm-overlay');
  if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeConfirmModal(); });
}

initCredsVault();
applyHash();
window.addEventListener('hashchange', applyHash);
initInputClears();
updateCollapseAllBtn();

function initTheme() {
  const theme = localStorage.getItem('cs_theme') || 'dark';
  document.body.classList.toggle('light-theme', theme === 'light');
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'light' ? 'DARK' : 'LIGHT';
  btn?.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('cs_theme', isLight ? 'light' : 'dark');
    btn.textContent = isLight ? 'DARK' : 'LIGHT';
  });
}
function initFontSize() {
  const minSize = 12, maxSize = 20;
  let size = parseInt(localStorage.getItem('cs_fontsize') || '15', 10);
  size = Math.max(minSize, Math.min(maxSize, size));
  const apply = () => {
    const px = size + 'px';
    document.documentElement.style.fontSize = px;
    document.body.style.setProperty('--base-font-size', px);
    localStorage.setItem('cs_fontsize', String(size));
  };
  apply();
  const minusBtn = document.getElementById('font-minus');
  const plusBtn = document.getElementById('font-plus');
  if (minusBtn) minusBtn.addEventListener('click', () => { size = Math.max(minSize, size - 1); apply(); });
  if (plusBtn) plusBtn.addEventListener('click', () => { size = Math.min(maxSize, size + 1); apply(); });
}
function initNotes() {
  const area = document.getElementById('notes-area');
  const panel = document.getElementById('notes-panel');
  const btn = document.getElementById('notes-toggle');
  if (area) area.value = localStorage.getItem('cs_notes') || '';
  if (area) area.addEventListener('input', () => localStorage.setItem('cs_notes', area.value));
  const isOpen = localStorage.getItem('cs_notes_open') === '1';
  if (panel) panel.classList.toggle('collapsed', !isOpen);
  if (btn) btn.addEventListener('click', () => {
    const open = !panel.classList.toggle('collapsed');
    localStorage.setItem('cs_notes_open', open ? '1' : '0');
  });
}
initTheme();
initFontSize();
initNotes();