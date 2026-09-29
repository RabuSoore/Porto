// ====== GANTI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA ======
const API_URL = 'PASTE_URL_WEB_APP_DI_SINI';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vis = p => String(p.is_visible).toLowerCase() !== 'false';
const CATS = ['Custom Plugin', 'Server Setup', 'Web Integration'];
const SKILL_CATS = ['Java/Paper API', 'Database', 'Optimizations', '3D Modeling'];
let S = { settings: {}, projects: [], skills: [] };
let PW = sessionStorage.getItem('pw') || '', filter = 'All', tab = 'look', editing = null;

const toast = (m, err) => {
  const t = $('#toast'); t.textContent = m; t.style.background = err ? '#e5534b' : 'var(--p)';
  t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 2500);
};
async function api(action, data = {}) {
  const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, password: PW, data }) });
  return r.json();
}

// ---------- PUBLIC VIEW ----------
function render() {
  const s = S.settings, root = document.documentElement;
  if (s.primary_color) root.style.setProperty('--p', s.primary_color);
  if (s.secondary_color) root.style.setProperty('--s', s.secondary_color);
  root.classList.toggle('light', String(s.dark_mode).toLowerCase() === 'false');
  document.title = s.hero_title || document.title;
  $('#heroTitle').textContent = s.hero_title || '';
  $('#heroSub').textContent = s.hero_subtitle || '';
  $('#bio').textContent = s.bio_text || '';

  $('#skillGrid').innerHTML = S.skills.map(k => `
    <div class="card p-4"><i class="${esc(k.icon_class)} text-2xl mb-3" style="color:var(--p)"></i>
    <div class="font-semibold">${esc(k.skill_name)}</div>
    <div class="text-xs mb-3" style="color:var(--mu)">${esc(k.category)}</div>
    <div class="bar"><i style="width:${Math.min(100, +k.level || 0)}%"></i></div></div>`).join('');

  const list = S.projects.filter(vis);
  const cats = ['All', 'Custom Plugin', 'Server Setup', 'Web/Other'];
  $('#filters').innerHTML = cats.map(c => `<button data-a="filter" data-id="${c}" class="chip ${filter === c ? 'on' : ''}">${c}</button>`).join('');
  const shown = list.filter(p => filter === 'All' || (filter === 'Web/Other' ? !['Custom Plugin', 'Server Setup'].includes(p.category) : p.category === filter));
  $('#projGrid').innerHTML = shown.map(p => `
    <article class="card flex flex-col">${media(p.media_url)}
      <div class="p-5 flex flex-col gap-3 flex-1">
        <div class="text-xs" style="color:var(--s)">${esc(p.category)}</div>
        <h3 class="font-semibold text-lg">${esc(p.title)}</h3>
        <p class="text-sm flex-1" style="color:var(--mu)">${esc(p.description)}</p>
        <div class="flex flex-wrap gap-2 items-center">
          ${p.github_url ? `<a href="${esc(p.github_url)}" target="_blank" rel="noopener" class="chip"><i class="fa-brands fa-github"></i> GitHub</a>` : ''}
          ${p.server_ip ? `<button data-a="copy" data-id="${esc(p.server_ip)}" class="chip mono"><i class="fa-regular fa-copy"></i> ${esc(p.server_ip)}</button><span class="text-xs" data-ip="${esc(p.server_ip)}"></span>` : ''}
        </div></div></article>`).join('') || '<p style="color:var(--mu)">Belum ada proyek.</p>';

  $('#contactLinks').innerHTML = [
    s.discord_tag && `<span class="chip"><i class="fa-brands fa-discord"></i> ${esc(s.discord_tag)}</span>`,
    s.email && `<a class="chip" href="mailto:${esc(s.email)}"><i class="fa-solid fa-envelope"></i> ${esc(s.email)}</a>`,
    s.github_url && `<a class="chip" href="${esc(s.github_url)}" target="_blank" rel="noopener"><i class="fa-brands fa-github"></i> GitHub</a>`
  ].filter(Boolean).join('');
  liveStatus();
}
const media = u => !u ? '' : /\.(mp4|webm)(\?|$)/i.test(u)
  ? `<video src="${esc(u)}" autoplay loop muted playsinline class="w-full h-48 object-cover"></video>`
  : `<img src="${esc(u)}" alt="" loading="lazy" class="w-full h-48 object-cover">`;

function liveStatus() {
  document.querySelectorAll('[data-ip]').forEach(async el => {
    try {
      const d = await (await fetch('https://api.mcsrvstat.us/3/' + encodeURIComponent(el.dataset.ip))).json();
      el.innerHTML = d.online ? `<i class="fa-solid fa-circle text-green-500"></i> ${d.players?.online ?? 0}/${d.players?.max ?? 0}` : '<i class="fa-solid fa-circle text-red-500"></i> Offline';
    } catch (e) { }
  });
}

// ---------- ADMIN ----------
const f = (k, l, v, t = 'text') => `<label class="block text-sm mb-3">${l}<input id="f_${k}" type="${t}" value="${esc(v)}" class="inp mt-1"></label>`;
const ta = (k, l, v) => `<label class="block text-sm mb-3">${l}<textarea id="f_${k}" rows="3" class="inp mt-1">${esc(v)}</textarea></label>`;
const sel = (k, l, opts, v) => `<label class="block text-sm mb-3">${l}<select id="f_${k}" class="inp mt-1">${opts.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
const chk = (k, l, on) => `<label class="flex gap-2 mb-3 items-center"><input type="checkbox" id="f_${k}" ${on ? 'checked' : ''}>${l}</label>`;
const v = k => $('#f_' + k).value.trim();
const row = (label, id, extra, actions) => `<div class="flex items-center justify-between gap-2 py-2" style="border-bottom:1px solid var(--bd)"><span class="truncate ${extra}">${esc(label)}</span><span class="shrink-0 flex gap-3">${actions}</span></div>`;

function loginView() {
  $('#modalBody').innerHTML = `<div class="flex justify-between mb-4"><h3 class="px text-sm">Admin Login</h3><button data-a="close" aria-label="Tutup">✕</button></div>
    ${f('pw', 'Password', '', 'password')}<button data-a="login" class="btn">Masuk</button>`;
  $('#f_pw').focus();
}
function dash() {
  const t = (id, l) => `<button data-a="tab" data-id="${id}" class="chip ${tab === id ? 'on' : ''}">${l}</button>`;
  $('#modalBody').innerHTML = `<div class="flex justify-between gap-2 mb-5"><div class="flex flex-wrap gap-2">${t('look', 'Tampilan & Warna')}${t('proj', 'Kelola Proyek')}${t('skill', 'Kelola Skills')}</div>
    <div class="flex gap-3"><button data-a="logout" title="Logout"><i class="fa-solid fa-right-from-bracket"></i></button><button data-a="close" aria-label="Tutup">✕</button></div></div><div id="pane"></div>`;
  $('#pane').innerHTML = { look: lookPane, proj: projPane, skill: skillPane }[tab]();
}
function lookPane() {
  const s = S.settings;
  return f('hero_title', 'Hero Title', s.hero_title) + f('hero_subtitle', 'Hero Subtitle', s.hero_subtitle) + ta('bio_text', 'Bio', s.bio_text) +
    `<div class="grid grid-cols-2 gap-3">${f('primary_color', 'Warna primer', s.primary_color || '#5dd6c4', 'color')}${f('secondary_color', 'Warna sekunder', s.secondary_color || '#e8a33d', 'color')}</div>` +
    f('discord_tag', 'Discord', s.discord_tag) + f('email', 'Email', s.email) + f('github_url', 'GitHub URL', s.github_url) +
    chk('dark_mode', 'Mode gelap', String(s.dark_mode).toLowerCase() !== 'false') +
    f('new_pw', 'Ganti password admin (kosongkan jika tidak diganti)', '', 'password') +
    '<button data-a="saveLook" class="btn">Simpan Perubahan</button>';
}
function projPane() {
  const e = editing || { category: CATS[0], is_visible: true, order: S.projects.length + 1 };
  const items = S.projects.map(p => row(p.title, p.id, vis(p) ? '' : 'opacity-40 line-through',
    `<button data-a="pEdit" data-id="${p.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
     <button data-a="pToggle" data-id="${p.id}" title="Tampil/Sembunyi"><i class="fa-solid ${vis(p) ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
     <button data-a="pDel" data-id="${p.id}" title="Hapus"><i class="fa-solid fa-trash"></i></button>`)).join('');
  return `<div class="mb-6">${items || '<p style="color:var(--mu)">Belum ada proyek.</p>'}</div>
    <h4 class="font-semibold mb-3">${editing ? 'Edit proyek' : 'Tambah proyek baru'}</h4>` +
    f('title', 'Judul', e.title) + ta('description', 'Deskripsi', e.description) + sel('category', 'Kategori', CATS, e.category) +
    f('media_url', 'Media URL (gambar/GIF/mp4)', e.media_url) + f('github_url', 'GitHub URL', e.github_url) + f('server_ip', 'Server IP', e.server_ip) +
    f('order', 'Urutan', e.order, 'number') + chk('is_visible', 'Tampilkan di website', vis(e)) +
    `<div class="flex gap-3"><button data-a="pSave" class="btn">Simpan Proyek</button>${editing ? '<button data-a="pNew" class="btn2">Batal</button>' : ''}</div>`;
}
function skillPane() {
  const items = S.skills.map(k => row(`${k.skill_name} (${k.level})`, k.id, '', `<button data-a="kDel" data-id="${k.id}" title="Hapus"><i class="fa-solid fa-trash"></i></button>`)).join('');
  return `<div class="mb-6">${items || '<p style="color:var(--mu)">Belum ada skill.</p>'}</div><h4 class="font-semibold mb-3">Tambah skill</h4>` +
    f('skill_name', 'Nama skill', '') + sel('category', 'Kategori', SKILL_CATS, '') + f('icon_class', 'Icon (Font Awesome)', 'fa-brands fa-java') +
    f('level', 'Level (0-100)', 80, 'number') + '<button data-a="kAdd" class="btn">Tambah Skill</button>';
}

async function adminLoad() {
  const r = await api('adminData');
  if (!r.ok) { PW = ''; sessionStorage.removeItem('pw'); return loginView(); }
  S = { ...S, ...r }; render(); dash();
}
async function mut(action, data, msg = 'Tersimpan') {
  const r = await api(action, data);
  if (!r.ok) return toast(r.error, 1);
  editing = null; await adminLoad(); toast(msg);
}

const acts = {
  filter: id => { filter = id; render(); },
  copy: id => { navigator.clipboard.writeText(id); toast('IP disalin: ' + id); },
  close: () => $('#modal').classList.add('hidden'),
  login: async () => { PW = v('pw'); await adminLoad(); if (PW) sessionStorage.setItem('pw', PW); else toast('Password salah', 1); },
  logout: async () => { PW = ''; sessionStorage.removeItem('pw'); acts.close(); await load(); },
  tab: id => { tab = id; editing = null; dash(); },
  saveLook: async () => {
    const d = {};
    ['hero_title', 'hero_subtitle', 'bio_text', 'primary_color', 'secondary_color', 'discord_tag', 'email', 'github_url'].forEach(k => d[k] = v(k));
    d.dark_mode = $('#f_dark_mode').checked;
    const np = v('new_pw'); if (np) d.admin_password = np;
    const r = await api('saveSettings', d);
    if (!r.ok) return toast(r.error, 1);
    if (np) { PW = np; sessionStorage.setItem('pw', PW); delete d.admin_password; }
    Object.assign(S.settings, d); render(); toast('Perubahan disimpan');
  },
  pEdit: id => { editing = S.projects.find(p => p.id == id); dash(); },
  pNew: () => { editing = null; dash(); },
  pSave: () => {
    if (!v('title')) return toast('Judul wajib diisi', 1);
    const d = { id: editing?.id || '' };
    ['title', 'description', 'category', 'media_url', 'github_url', 'server_ip'].forEach(k => d[k] = v(k));
    d.order = +v('order') || 0; d.is_visible = $('#f_is_visible').checked;
    mut('saveProject', d, 'Proyek disimpan');
  },
  pToggle: id => mut('saveProject', { id, is_visible: !vis(S.projects.find(p => p.id == id)) }, 'Visibilitas diubah'),
  pDel: id => confirm('Hapus proyek ini?') && mut('deleteProject', { id }, 'Proyek dihapus'),
  kAdd: () => {
    if (!v('skill_name')) return toast('Nama skill wajib diisi', 1);
    mut('saveSkill', { skill_name: v('skill_name'), category: v('category'), icon_class: v('icon_class'), level: +v('level') || 0 }, 'Skill ditambahkan');
  },
  kDel: id => confirm('Hapus skill ini?') && mut('deleteSkill', { id }, 'Skill dihapus')
};

document.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && acts[b.dataset.a]) acts[b.dataset.a](b.dataset.id); });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'f_pw') acts.login(); });
document.addEventListener('input', e => {   // pratinjau warna langsung
  const m = { f_primary_color: '--p', f_secondary_color: '--s' }[e.target.id];
  if (m) document.documentElement.style.setProperty(m, e.target.value);
});
$('#adminBtn').onclick = () => { $('#modal').classList.remove('hidden'); PW ? adminLoad() : loginView(); };

async function load() {
  try { S = { ...S, ...(await (await fetch(API_URL)).json()) }; render(); }
  catch (e) { toast('Gagal memuat data. Cek API_URL di script.js', 1); }
}
load();
