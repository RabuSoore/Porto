// ====== GANTI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA ======
const API_URL = 'https://script.google.com/macros/s/AKfycbwd4vewZKiwQ93kMmP0CCNWr5kIlgd6gjhCwgCPSoEGK_T4bOvgrSrL8dF_8gyy2by5_Q/exec';

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
function projPane() {
  const e = editing || { category: CATS[0], is_visible: true, order: S.projects.length + 1 };
  const items = S.projects.map(p => row(p.title, p.id, vis(p) ? '' : 'opacity-40 line-through',
    `<button data-a="pEdit" data-id="${p.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
     <button data-a="pToggle" data-id="${p.id}" title="Tampil/Sembunyi"><i class="fa-solid ${vis(p) ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
     <button data-a="pDel" data-id="${p.id}" title="Hapus"><i class="fa-solid fa-trash"></i></button>`)).join('');
  return `<div class="mb-6">${items || '<p style="color:var(--mu)">Belum ada proyek.</p>'}</div>
    <h4 class="font-semibold mb-3">${editing ? 'Edit proyek' : 'Tambah proyek baru'}</h4>` +
    f('title', 'Judul', e.title) + ta('description', 'Deskripsi', e.description) + f('category', 'Kategori (mis. Custom Plugin, Server Setup, Web Integration)', e.category) +
    ta('media_url', 'Media (satu URL per baris: YouTube, Vimeo, Google Drive, mp4, gambar, GIF)', e.media_url) + f('github_url', 'GitHub URL', e.github_url) + f('server_ip', 'Server IP', e.server_ip) +
    f('tags', 'Tag (pisahkan koma, mis. Java, Paper, MySQL)', e.tags) + ta('links', 'Link tambahan (satu per baris: Label|URL, mis. Spigot|https://...)', e.links) + f('order', 'Urutan', e.order, 'number') + chk('is_visible', 'Tampilkan di website', vis(e)) +
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
  close: () => { $('#modal').classList.add('hidden'); $('#modalBody').innerHTML = ''; },
  login: async () => { PW = v('pw'); await adminLoad(); if (PW) sessionStorage.setItem('pw', PW); else toast('Password salah', 1); },
  logout: async () => { PW = ''; sessionStorage.removeItem('pw'); acts.close(); await load(); },
  tab: id => { tab = id; editing = null; dash(); },
  pEdit: id => { editing = S.projects.find(p => p.id == id); dash(); },
  pNew: () => { editing = null; dash(); },
  pSave: () => {
    if (!v('title')) return toast('Judul wajib diisi', 1);
    const d = { id: editing?.id || '' };
    ['title', 'description', 'category', 'media_url', 'github_url', 'server_ip', 'tags', 'links'].forEach(k => d[k] = v(k));
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
  const m = { f_primary_color: '--p', f_secondary_color: '--s', f_bg_color: '--bg', f_card_color: '--card', f_text_color: '--tx' }[e.target.id];
  if (m) document.documentElement.style.setProperty(m, e.target.value);
});
$('#adminBtn').onclick = () => { $('#modal').classList.remove('hidden'); PW ? adminLoad() : loginView(); };

async function load() {
  try { S = { ...S, ...(await (await fetch(API_URL)).json()) }; render(); }
  catch (e) { toast('Gagal memuat data. Cek API_URL di script.js', 1); }
}

// ================= v2: media, detail proyek, kustomisasi =================
const bool = (k, d = true) => { const x = String(S.settings[k] ?? '').toLowerCase(); return x === '' ? d : x !== 'false'; };
const lines = t => String(t || '').split('\n').map(x => x.trim()).filter(Boolean);
const FONTS = ['Press Start 2P', 'Silkscreen', 'VT323', 'Inter', 'Poppins', 'Space Grotesk', 'JetBrains Mono', 'Rubik'];
const DEF = { font_heading: 'Press Start 2P', font_body: 'Inter' };
const COLS = ['primary_color', 'secondary_color', 'bg_color', 'card_color', 'text_color'];
const PRESETS = {
  Diamond: ['#5dd6c4', '#e8a33d', '#14161a', '#1d2026', '#e6e8eb'], Emerald: ['#4ade80', '#facc15', '#0f1a14', '#16241b', '#e6f2ea'],
  Redstone: ['#ef4444', '#f59e0b', '#1a1010', '#241616', '#f5e6e6'], Nether: ['#f97316', '#a855f7', '#1c0f0f', '#2a1616', '#f5e6dc'],
  Amethyst: ['#a78bfa', '#38bdf8', '#15121f', '#1e1a2e', '#ece8f5']
};
const OFF = ['use_custom_bg', 'typing_effect'];
// [key, label, tipe]  — tipe: 'area' | 'color' | 'check' | array (select) | kosong (teks). Item tanpa label = judul grup.
const FIELDS = [
  ['Konten'], ['hero_title', 'Hero title'], ['hero_subtitle', 'Hero subtitle'], ['bio_text', 'Bio', 'area'], ['cta1_text', 'Teks tombol 1'], ['cta2_text', 'Teks tombol 2'],
  ['main_server_ip', 'IP server utama (widget di hero)'], ['status_text', 'Teks status (mis. Open for commission)'], ['status_type', 'Warna status', ['open', 'busy', 'none']],
  ['stats', 'Statistik (satu per baris: 50+|Plugin)', 'area'],
  ['Warna'], ['primary_color', 'Warna primer', 'color'], ['secondary_color', 'Warna sekunder', 'color'], ['use_custom_bg', 'Pakai warna kustom di bawah', 'check'],
  ['bg_color', 'Background', 'color'], ['card_color', 'Kartu', 'color'], ['text_color', 'Teks', 'color'], ['dark_mode', 'Mode gelap', 'check'],
  ['Tipografi & gaya'], ['font_heading', 'Font judul', FONTS], ['font_body', 'Font isi', FONTS], ['radius', 'Sudut kartu (px)', ['0', '6', '12', '20']],
  ['shadow_style', 'Bayangan', ['pixel', 'soft', 'none']], ['card_size', 'Ukuran kartu', ['small', 'medium', 'large']], ['hero_align', 'Posisi hero', ['left', 'center']],
  ['hero_bg', 'Background hero (URL gambar)'], ['typing_effect', 'Efek mengetik pada bio', 'check'],
  ['Section'], ['show_skills', 'Tampilkan Skills', 'check'], ['show_projects', 'Tampilkan Portofolio', 'check'], ['show_contact', 'Tampilkan Kontak', 'check'],
  ['show_status', 'Status server live', 'check'], ['skills_title', 'Judul Skills'], ['projects_title', 'Judul Portofolio'], ['contact_title', 'Judul Kontak'],
  ['Kontak & situs'], ['discord_tag', 'Discord'], ['email', 'Email'], ['github_url', 'GitHub URL'], ['social_links', 'Link sosial (per baris: Label|URL|fa-brands fa-youtube)', 'area'],
  ['site_name', 'Nama situs (navbar)'], ['favicon', 'Favicon (emoji)'], ['footer_text', 'Teks footer'], ['custom_css', 'CSS kustom', 'area']
];

function mInfo(u) {
  let m;
  if (m = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/)) return { t: 'f', src: 'https://www.youtube.com/embed/' + m[1], th: `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` };
  if (m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)) return { t: 'f', src: 'https://player.vimeo.com/video/' + m[1] };
  if (m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/)) return { t: 'f', src: `https://drive.google.com/file/d/${m[1]}/preview`, th: `https://drive.google.com/thumbnail?id=${m[1]}&sz=w800` };
  if (/\.(mp4|webm)(\?|$)/i.test(u)) return { t: 'v', src: u };
  return { t: 'i', src: u, th: u };
}
function typeText(el, t, on) {
  clearInterval(el.tm); if (!on) { el.textContent = t; return; }
  let i = 0; el.tm = setInterval(() => { el.textContent = t.slice(0, ++i); if (i >= t.length) clearInterval(el.tm); }, 30);
}
const tagsHtml = p => String(p.tags || '').split(',').map(x => x.trim()).filter(Boolean).map(t => `<span class="chip text-xs">${esc(t)}</span>`).join('');
function chips(p, all) {
  const ext = all ? lines(p.links).map(l => l.split('|')).filter(a => a[1]).map(a => `<a href="${esc(a[1].trim())}" target="_blank" rel="noopener" class="chip"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${esc(a[0])}</a>`).join('') : '';
  return (p.github_url ? `<a href="${esc(p.github_url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" class="chip"><i class="fa-brands fa-github"></i> GitHub</a>` : '') + ext +
    (p.server_ip ? `<button data-a="copy" data-id="${esc(p.server_ip)}" class="chip mono"><i class="fa-regular fa-copy"></i> ${esc(p.server_ip)}</button><span class="text-xs" data-ip="${esc(p.server_ip)}"></span>` : '');
}
function card(p) {
  const m = lines(p.media_url).map(mInfo)[0];
  const th = !m ? '' : m.th ? `<img src="${esc(m.th)}" alt="" loading="lazy" class="w-full h-48 object-cover">` : `<video src="${esc(m.src)}#t=0.5" muted playsinline preload="metadata" class="w-full h-48 object-cover"></video>`;
  return `<article class="card flex flex-col cursor-pointer" data-a="open" data-id="${esc(p.id)}">
    <div class="relative">${th}${m && m.t !== 'i' ? '<i class="fa-solid fa-circle-play absolute inset-0 m-auto w-fit h-fit text-5xl" style="color:#fff;text-shadow:0 2px 8px #000"></i>' : ''}</div>
    <div class="p-5 flex flex-col gap-3 flex-1"><div class="text-xs" style="color:var(--s)">${esc(p.category)}</div>
      <h3 class="font-semibold text-lg">${esc(p.title)}</h3>
      <p class="text-sm flex-1" style="color:var(--mu)">${esc(String(p.description || '').slice(0, 140))}</p>
      <div class="flex flex-wrap gap-2">${tagsHtml(p)}</div>
      <div class="flex flex-wrap gap-2 items-center">${chips(p, false)}</div></div></article>`;
}

function render() {
  const s = S.settings, r = document.documentElement, st = r.style;
  const set = (p, x) => x ? st.setProperty(p, x) : st.removeProperty(p);
  const custom = bool('use_custom_bg', false);
  set('--p', s.primary_color); set('--s', s.secondary_color);
  set('--bg', custom && s.bg_color); set('--card', custom && s.card_color); set('--tx', custom && s.text_color);
  set('--fh', s.font_heading && `'${s.font_heading}'`); set('--fb', s.font_body && `'${s.font_body}'`);
  set('--r', s.radius && s.radius + 'px');
  r.dataset.sh = s.shadow_style || 'pixel'; r.classList.toggle('light', !bool('dark_mode'));
  [s.font_heading, s.font_body].forEach(n => {
    const id = 'gf' + String(n).replace(/\W/g, '');
    if (n && !document.getElementById(id)) document.head.insertAdjacentHTML('beforeend', `<link id="${id}" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${n.replace(/ /g, '+')}&display=swap">`);
  });
  $('#customCss').textContent = s.custom_css || '';
  if (s.favicon) $('#fav').href = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${s.favicon}</text></svg>`);

  // hero
  document.title = s.hero_title || document.title;
  $('#brand').textContent = s.site_name || s.hero_title || '';
  $('#heroTitle').textContent = s.hero_title || ''; $('#heroSub').textContent = s.hero_subtitle || '';
  $('#cta1').textContent = s.cta1_text || 'Lihat Proyek'; $('#cta2').textContent = s.cta2_text || 'Kontak';
  const bio = $('#bio'), txt = s.bio_text || '';
  if (bio.dataset.t !== txt) { bio.dataset.t = txt; typeText(bio, txt, bool('typing_effect', false)); }
  const c = s.hero_align === 'center';
  $('#heroWrap').style.textAlign = c ? 'center' : 'left';
  ['badge', 'heroIp', 'heroBtns', 'stats'].forEach(id => { $('#' + id).style.justifyContent = c ? 'center' : 'flex-start'; });
  $('#hero').style.backgroundImage = s.hero_bg ? `linear-gradient(rgba(0,0,0,.65),var(--bg)),url("${s.hero_bg}")` : 'none';
  const bt = s.status_type || 'open';
  $('#badge').innerHTML = s.status_text && bt !== 'none' ? `<span class="chip"><i class="fa-solid fa-circle ${bt === 'open' ? 'text-green-500' : 'text-red-500'}"></i> ${esc(s.status_text)}</span>` : '';
  $('#stats').innerHTML = lines(s.stats).map(l => { const [a, b] = l.split('|'); return `<div><div class="px text-lg" style="color:var(--p)">${esc(a)}</div><div class="text-xs" style="color:var(--mu)">${esc(b)}</div></div>`; }).join('');
  $('#heroIp').innerHTML = s.main_server_ip ? `<button data-a="copy" data-id="${esc(s.main_server_ip)}" class="chip mono"><i class="fa-regular fa-copy"></i> ${esc(s.main_server_ip)}</button><span class="text-xs" data-ip="${esc(s.main_server_ip)}"></span>` : '';

  // section, judul & navbar
  const nav = [];
  [['skills', 'skills_title', 'Skills'], ['projects', 'projects_title', 'Portofolio'], ['contact', 'contact_title', 'Kontak']].forEach(([id, k, d]) => {
    const on = bool('show_' + id); $('#' + id).hidden = !on; $('#' + id + 'T').textContent = s[k] || d;
    if (on) nav.push(`<a href="#${id}">${esc(s[k] || d)}</a>`);
  });
  $('#navLinks').innerHTML = nav.join('');

  $('#skillGrid').innerHTML = S.skills.map(k => `
    <div class="card p-4"><i class="${esc(k.icon_class)} text-2xl mb-3" style="color:var(--p)"></i>
    <div class="font-semibold">${esc(k.skill_name)}</div><div class="text-xs mb-3" style="color:var(--mu)">${esc(k.category)}</div>
    <div class="bar"><i style="width:${Math.min(100, +k.level || 0)}%"></i></div></div>`).join('');

  // portofolio: filter kategori dinamis + pencarian
  const q = ($('#q').value || '').toLowerCase(), list = S.projects.filter(vis);
  const cats = ['All', ...new Set(list.map(p => p.category).filter(Boolean))];
  if (!cats.includes(filter)) filter = 'All';
  $('#filters').innerHTML = cats.map(x => `<button data-a="filter" data-id="${esc(x)}" class="chip ${filter === x ? 'on' : ''}">${esc(x)}</button>`).join('');
  const size = { small: 240, medium: 300, large: 380 }[s.card_size] || 300;
  $('#projGrid').style.gridTemplateColumns = `repeat(auto-fill,minmax(min(100%,${size}px),1fr))`;
  $('#projGrid').innerHTML = list.filter(p => (filter === 'All' || p.category === filter) && (!q || [p.title, p.description, p.tags].join(' ').toLowerCase().includes(q))).map(card).join('') || '<p style="color:var(--mu)">Tidak ada proyek.</p>';

  // kontak & footer
  const soc = lines(s.social_links).map(l => l.split('|')).filter(a => a[1]).map(a => `<a class="chip" href="${esc(a[1])}" target="_blank" rel="noopener"><i class="${esc(a[2] || 'fa-solid fa-link')}"></i> ${esc(a[0])}</a>`);
  $('#contactLinks').innerHTML = [
    s.discord_tag && `<span class="chip"><i class="fa-brands fa-discord"></i> ${esc(s.discord_tag)}</span>`,
    s.email && `<a class="chip" href="mailto:${esc(s.email)}"><i class="fa-solid fa-envelope"></i> ${esc(s.email)}</a>`,
    s.github_url && `<a class="chip" href="${esc(s.github_url)}" target="_blank" rel="noopener"><i class="fa-brands fa-github"></i> GitHub</a>`, ...soc
  ].filter(Boolean).join('');
  $('#footerText').textContent = s.footer_text || '';
  if (bool('show_status')) liveStatus();
}

function lookPane() {
  const s = S.settings;
  const pre = Object.keys(PRESETS).map(n => `<button data-a="preset" data-id="${n}" class="chip">${n}</button>`).join('');
  return `<div class="flex flex-wrap gap-2 mb-2 items-center"><span class="text-sm">Preset tema:</span>${pre}</div>` + FIELDS.map(([k, l, t]) => {
    if (!l) return `<h4 class="font-semibold mt-6 mb-3 pb-1" style="color:var(--s);border-bottom:2px solid var(--bd)">${k}</h4>`;
    const x = s[k] ?? '';
    if (t === 'area') return ta(k, l, x);
    if (t === 'check') return chk(k, l, bool(k, !OFF.includes(k)));
    if (t === 'color') return f(k, l, x || PRESETS.Diamond[COLS.indexOf(k)], 'color');
    if (Array.isArray(t)) return sel(k, l, t, String(x || DEF[k] || t[0]));
    return f(k, l, x);
  }).join('') + f('new_pw', 'Ganti password admin (kosongkan jika tidak diganti)', '', 'password') + '<button data-a="saveLook" class="btn">Simpan Perubahan</button>';
}

Object.assign(acts, {
  open: id => {
    const p = S.projects.find(x => x.id == id); if (!p) return;
    const med = lines(p.media_url).map(mInfo).map(m => m.t === 'f'
      ? `<iframe src="${esc(m.src)}" allow="fullscreen; autoplay; encrypted-media" allowfullscreen class="w-full aspect-video border-0"></iframe>`
      : m.t === 'v' ? `<video src="${esc(m.src)}" controls playsinline class="w-full"></video>` : `<img src="${esc(m.src)}" alt="" class="w-full">`).join('');
    $('#modalBody').innerHTML = `<div class="flex justify-between gap-3 mb-4"><div><div class="text-xs mb-1" style="color:var(--s)">${esc(p.category)}</div><h3 class="px text-sm md:text-base">${esc(p.title)}</h3></div><button data-a="close" aria-label="Tutup">✕</button></div>
      <div class="grid gap-3 mb-4">${med}</div><p class="mb-4" style="white-space:pre-line;color:var(--mu)">${esc(p.description)}</p>
      <div class="flex flex-wrap gap-2 mb-4">${tagsHtml(p)}</div><div class="flex flex-wrap gap-2 items-center">${chips(p, true)}</div>`;
    $('#modal').classList.remove('hidden'); if (bool('show_status')) liveStatus();
  },
  preset: n => {
    PRESETS[n].forEach((c, i) => { const el = $('#f_' + COLS[i]); el.value = c; el.dispatchEvent(new Event('input', { bubbles: true })); });
    $('#f_use_custom_bg').checked = true; $('#f_dark_mode').checked = true;
  },
  saveLook: async () => {
    const d = {};
    FIELDS.forEach(([k, l, t]) => { if (l) d[k] = t === 'check' ? $('#f_' + k).checked : $('#f_' + k).value; });
    const np = v('new_pw'); if (np) d.admin_password = np;
    const r = await api('saveSettings', d);
    if (!r.ok) return toast(r.error, 1);
    if (np) { PW = np; sessionStorage.setItem('pw', PW); delete d.admin_password; }
    Object.assign(S.settings, d); render(); toast('Perubahan disimpan');
  }
});
$('#q').oninput = render;
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') acts.close(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') acts.close(); });
load();
