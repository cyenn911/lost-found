'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Bell, Check, CheckCheck, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Clock3, FileSearch, HeartHandshake, ImagePlus, Camera as Instagram, LayoutGrid, ListFilter, LoaderCircle, LogOut, MapPin, Menu, Package, Plus, Search, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react';
import { categories, cities, finishCurrent, initialNotices, initialReports, items, localAccounts, queuePosition, startNext, statusLabels, type Category, type Item, type Notice, type Profile, type Report } from '@/lib/demo';

type View = 'search' | 'reports' | 'queue' | 'notifications' | 'account';
const nav = [{ id: 'search', label: 'Cari barang', icon: Search }, { id: 'reports', label: 'Laporan saya', icon: FileSearch }, { id: 'queue', label: 'Antrean AI', icon: Sparkles }, { id: 'notifications', label: 'Notifikasi', icon: Bell }] as const;
const viewTitles = { search: 'Cari barang', reports: 'Laporan saya', queue: 'Antrean AI', notifications: 'Notifikasi', account: 'Akun saya' };
const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
const dateLabel = (value: string) => new Date(value + 'T12:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

function Modal({ title, children, close, wide = false }: { title: string; children: ReactNode; close: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { dialog?.close(); document.body.style.overflow = old; }; }, []);
  return <dialog ref={ref} aria-labelledby={titleId} className={`modal ${wide ? 'modal-wide' : ''}`} onCancel={close} onClick={e => { const bounds = e.currentTarget.getBoundingClientRect(); if (e.target === e.currentTarget && (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom)) close(); }}><div className="modal-heading"><h2 id={titleId}>{title}</h2><button className="icon-button" onClick={close} aria-label="Tutup dialog"><X size={20} /></button></div>{children}</dialog>;
}

function ItemPhoto({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  return broken || !src ? <div className={`photo-fallback ${className}`}><Package size={40} /><span>Foto belum tersedia</span></div> : <img className={className} src={src} alt={alt} onError={() => setBroken(true)} loading="lazy" />;
}

export default function Home() {
  const [view, setView] = useState<View>('search');
  const [sidebar, setSidebar] = useState(false);
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [profile, setProfile] = useState<Profile>({ name: 'Aditya', email: 'aditya@example.com', phone: '', city: 'Bandung' });
  const [signedIn, setSignedIn] = useState(true);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('Semua kota');
  const [category, setCategory] = useState<Category>('Semua');
  const [source, setSource] = useState('all');
  const [sort, setSort] = useState('new');
  const [filters, setFilters] = useState(false);
  const [reportFilter, setReportFilter] = useState('all');
  const [form, setForm] = useState<'lost' | 'found' | null>(null);
  const [detail, setDetail] = useState<Item | null>(null);
  const [reportDetail, setReportDetail] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [claim, setClaim] = useState(false);
  const [simulation, setSimulation] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const queueRef = useRef(reports);
  const unread = notices.filter(n => !n.read).length;
  const active = reports.find(r => r.status === 'running');
  const queued = reports.filter(r => r.status === 'queued');
  const completed = reports.filter(r => r.status === 'success');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('temu-demo-v1') || 'null');
      if (saved && Array.isArray(saved.reports) && Array.isArray(saved.notices) && saved.profile?.name) {
        setReports(saved.reports); setNotices(saved.notices); setProfile(saved.profile); setSignedIn(saved.signedIn !== false);
      }
    } catch { setToast('Data lokal tidak dapat dimuat. Demo awal ditampilkan.'); }
    setReady(true);
    const update = () => { const value = location.hash.slice(1) as View; if (Object.prototype.hasOwnProperty.call(viewTitles, value)) setView(value); };
    update(); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => { queueRef.current = reports; }, [reports]);
  useEffect(() => { if (ready) { try { localStorage.setItem('temu-demo-v1', JSON.stringify({ reports, notices, profile, signedIn })); } catch { setToast('Penyimpanan browser penuh. Perubahan hanya tersimpan selama halaman terbuka.'); } } }, [reports, notices, profile, signedIn, ready]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 5000); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (!simulation) return;
    const timer = setInterval(() => {
      const now = Date.now(); setClock(now);
      const current = queueRef.current.find(r => r.status === 'running');
      if (current && now - (current.startedAt || now) >= 12000) {
        const next = finishCurrent(queueRef.current, now); queueRef.current = next; setReports(next);
        setNotices(previous => [{ id: crypto.randomUUID(), title: 'Simulasi permintaan selesai', message: `${current.title}: ${current.type === 'lost' ? 'contoh pencarian selesai. Belum ada kecocokan yang dikonfirmasi.' : 'contoh penyebaran selesai. Tidak ada DM sungguhan yang dikirim.'}`, read: false, createdAt: now }, ...previous]);
        if (!next.some(r => r.status === 'running' || r.status === 'queued')) { setSimulation(false); setToast('Semua permintaan demo selesai diproses.'); }
      } else if (!current && queueRef.current.some(r => r.status === 'queued')) {
        const next = startNext(queueRef.current, now); queueRef.current = next; setReports(next);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [simulation]);

  function navigate(next: View) { setView(next); location.hash = next; setSidebar(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function openForm(type: 'lost' | 'found') { if (!signedIn) { navigate('account'); setToast('Masuk ke akun demo untuk membuat laporan.'); return; } setForm(type); }
  function runDemo() {
    const now = Date.now();
    const updated = startNext(reports.map(r => r.status === 'running' ? { ...r, startedAt: now } : r), now);
    queueRef.current = updated; setReports(updated); setClock(now); setSimulation(true);
  }
  function submitReport(report: Report) {
    const updated = [...reports, report]; queueRef.current = updated; setReports(updated);
    setNotices(previous => [{ id: crypto.randomUUID(), title: 'Laporan masuk antrean', message: `${report.title} akan diproses setelah permintaan sebelumnya selesai.`, read: false, createdAt: Date.now() }, ...previous]);
    setForm(null); navigate('reports'); setToast('Laporan berhasil disimpan dan masuk antrean demo.');
  }
  const userFound: Item[] = reports.filter(r => r.type === 'found').map(r => ({ ...r, category: r.category as Category, source: 'Laporan saya' }));
  const filtered = [...items, ...userFound].filter(item => {
    const haystack = `${item.title} ${item.description} ${item.location}`.toLowerCase();
    return search.toLowerCase().split(/\s+/).every(word => haystack.includes(word)) && (city === 'Semua kota' || item.city === city) && (category === 'Semua' || item.category === category) && (source === 'all' || (source === 'social' ? item.source.startsWith('@') : !item.source.startsWith('@')));
  }).sort((a, b) => sort === 'name' ? a.title.localeCompare(b.title) : sort === 'old' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
  const selectedReport = reports.find(r => r.id === reportDetail);
  const progress = active && simulation ? Math.min(94, Math.max(5, ((clock - (active.startedAt || clock)) / 12000) * 100)) : 0;

  function QueuePanel({ expanded = false }: { expanded?: boolean }) {
    return <section className={`queue-panel ${expanded ? 'expanded' : ''}`}>
      <div className="panel-heading"><div className="icon-tile blue"><Sparkles size={19} /></div><h3>Asisten AI</h3><span className={`live-dot ${simulation ? 'on' : ''}`} /> <span className="micro">{simulation ? 'Aktif' : 'Demo'}</span></div>
      <p className="panel-description">Membantu mencari dan menyebarkan informasi, satu permintaan setiap giliran.</p>
      <div className="queue-status"><span className="eyebrow">{active ? 'SEDANG DIPROSES' : 'PERMINTAAN BERIKUTNYA'}</span><div className="queue-title"><span className="small-icon"><Search size={17} /></span><strong>{active?.title || queued[0]?.title || 'Semua sudah selesai'}</strong></div><span className="muted small">{active ? `${active.city} · ${active.type === 'lost' ? 'Pencarian unggahan' : 'Penyebaran informasi'}` : queued.length ? 'Menunggu simulasi dimulai' : 'Belum ada permintaan yang menunggu'}</span>{active && <><div className="progress-track"><div style={{ width: `${progress}%` }} /></div><span className="micro">{simulation ? 'Simulasi sedang berjalan…' : 'Simulasi dijeda'}</span></>}</div>
      <div className="queue-counts"><div><strong>{queued.length.toString().padStart(2, '0')}</strong><span>Dalam antrean</span></div><div><strong>{completed.length.toString().padStart(2, '0')}</strong><span>Selesai</span></div></div>
      {queued.slice(0, expanded ? 20 : 2).map(r => <div className="mini-job" key={r.id}><span className="queue-number">{queuePosition(reports, r.id).toString().padStart(2, '0')}</span><div><strong>{r.title}</strong><span>{r.type === 'lost' ? 'Cari barang hilang' : 'Sebarkan barang temuan'}</span></div><Clock3 size={15} /></div>)}
      <div className="queue-note"><ShieldCheck size={16} /><span>Hanya 1 permintaan aktif pada satu waktu.</span></div>
      <button className="button full secondary" disabled={!queued.length && !active} onClick={() => simulation ? setSimulation(false) : runDemo()}>{simulation ? 'Jeda simulasi' : active ? 'Lanjutkan simulasi' : 'Coba simulasi antrean'}<ArrowRight size={16} /></button>
      {!expanded && <button className="text-button full" onClick={() => navigate('queue')}>Lihat antrean saya <ChevronRight size={16} /></button>}
    </section>;
  }

  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Lewati ke konten utama</a>
    {sidebar && <button className="sidebar-scrim" aria-label="Tutup menu" onClick={() => setSidebar(false)} />}
    <aside className={`sidebar ${sidebar ? 'open' : ''}`}>
      <a href="#search" className="brand" onClick={() => navigate('search')} aria-label="Temu beranda"><span className="brand-mark"><Search size={23} strokeWidth={3} /></span>temu<span className="brand-dot">.</span></a>
      <p className="brand-caption">Lost things. New hope.</p>
      <div className="nav-label">RUANG TEMU</div>
      <nav aria-label="Navigasi utama">{nav.map(link => <button key={link.id} className={`nav-link ${view === link.id ? 'active' : ''}`} onClick={() => navigate(link.id)} aria-current={view === link.id ? 'page' : undefined}><link.icon size={20} /><span>{link.label}</span>{link.id === 'reports' && <span className="nav-count">{reports.length}</span>}{link.id === 'notifications' && unread > 0 && <span className="notification-dot" />}</button>)}</nav>
      <button className="sidebar-report" onClick={() => openForm('lost')}><Plus size={18} /> Buat laporan</button>
      <div className="sidebar-bottom"><div className="community-note"><span className="community-symbol"><HeartHandshake size={24} /></span><strong>Sedikit peduli,<br />besar artinya.</strong><p>Temuanmu bisa jadi kabar baik untuk seseorang.</p><button onClick={() => openForm('found')}>Laporkan penemuan <ArrowRight size={14} /></button></div><button className="nav-link" onClick={() => setHelp(true)}><CircleHelp size={20} /><span>Pusat bantuan</span></button><button className={`nav-link ${view === 'account' ? 'active' : ''}`} onClick={() => navigate('account')}><UserRound size={20} /><span>Akun saya</span></button><div className="sidebar-footer"><span className="demo-dot" /> Demo interaktif <button aria-label="Tentang demo" onClick={() => setHelp(true)}><CircleHelp size={14} /></button></div></div>
    </aside>

    <div className="workspace">
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" onClick={() => setSidebar(true)} aria-label="Buka menu"><Menu size={22} /></button><span>Ruang Temu</span><ChevronRight size={15} /><strong>{viewTitles[view]}</strong></div><div className="topbar-actions"><span className="location-label"><MapPin size={15} /> {profile.city}, Indonesia</span><span className="topbar-separator" /><button className="notification-button icon-button" onClick={() => navigate('notifications')} aria-label={`Notifikasi, ${unread} belum dibaca`}><Bell size={20} />{unread > 0 && <i />}</button><button className="avatar" onClick={() => navigate('account')} aria-label="Buka akun saya">{signedIn ? profile.name.slice(0, 2).toUpperCase() : <UserRound size={19} />}</button></div></header>
      <main id="main-content" tabIndex={-1}>
        <div className="page-heading"><div><div className="eyebrow page-eyebrow">BERSAMA, LEBIH MUDAH DITEMUKAN</div><h1>{viewTitles[view]}</h1><p>{view === 'search' ? 'Mungkin yang kamu cari, sudah ditemukan seseorang.' : view === 'reports' ? 'Setiap laporan punya cerita. Ikuti perkembangannya di sini.' : view === 'queue' ? 'Permintaanmu mendapat giliran, satu per satu.' : view === 'notifications' ? 'Kabar terbaru tentang laporan dan pencarianmu.' : 'Kelola profil dan informasi kontakmu.'}</p></div><button className="button primary" onClick={() => openForm('lost')}><Plus size={18} /> Buat laporan</button></div>

        {view === 'search' && <>
          <section className="search-hero"><div className="hero-top"><div><div className="hero-kicker"><span /> SETIAP BARANG PUNYA JALAN PULANG</div><h2>Hilang dari pandangan.<br /><em>Bukan dari harapan.</em></h2><p>Cari barangmu dari temuan komunitas dan informasi lokal.</p></div><div className="hero-stamp"><span className="stamp-icon"><HeartHandshake size={31} strokeWidth={1.5} /></span><strong>Saling bantu.<br />Saling menemukan.</strong><span>Dari orang baik, untuk orang baik.</span></div></div>
            <form className="search-form" onSubmit={e => { e.preventDefault(); setSearch(query.trim()); }}><label className="search-input"><Search size={21} /><input aria-label="Cari nama atau ciri barang" placeholder="Apa yang kamu cari? Misalnya, dompet cokelat" value={query} onChange={e => setQuery(e.target.value)} /></label><label className="city-input"><MapPin size={19} /><select aria-label="Pilih kota" value={city} onChange={e => setCity(e.target.value)}>{cities.map(c => <option key={c}>{c}</option>)}</select><ChevronDown size={15} /></label><button className="button primary" type="submit">Cari barang <ArrowRight size={17} /></button></form>
            <div className="popular-search"><span>Sering dicari:</span>{['Dompet', 'Kunci', 'Earbuds', 'Ransel'].map(word => <button key={word} onClick={() => { setQuery(word); setSearch(word); setCategory('Semua'); }}>{word}</button>)}</div>
          </section>
          <div className="action-strip"><button onClick={() => openForm('lost')}><span className="icon-tile peach"><FileSearch size={22} /></span><span><strong>Kehilangan sesuatu?</strong><small>Buat laporan, biar AI ikut membantu.</small></span><ArrowUpRightIcon /></button><span className="action-divider" /><button onClick={() => openForm('found')}><span className="icon-tile mint"><Package size={22} /></span><span><strong>Menemukan barang?</strong><small>Bantu barang kembali ke pemiliknya.</small></span><ArrowUpRightIcon /></button></div>
          <div className="discovery-layout"><section className="results-section"><div className="section-heading"><div><h2>Temuan terbaru <span className="count-badge">{filtered.length}</span></h2><p>Barang-barang yang sedang menunggu pemiliknya.</p></div><button className={`filter-button ${filters ? 'selected' : ''}`} onClick={() => setFilters(!filters)} aria-expanded={filters}><ListFilter size={16} /> Filter</button></div>
              <div className="category-row" role="group" aria-label="Kategori barang">{categories.map(c => <button key={c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c === 'Semua' && <LayoutGrid size={14} />}{c}</button>)}</div>
              {filters && <div className="filter-panel"><label>Sumber<select value={source} onChange={e => setSource(e.target.value)}><option value="all">Semua sumber</option><option value="internal">Komunitas Temu</option><option value="social">Instagram lokal</option></select></label><label>Urutkan<select value={sort} onChange={e => setSort(e.target.value)}><option value="new">Terbaru</option><option value="old">Terlama</option><option value="name">Nama A–Z</option></select></label></div>}
              {search && <div className="search-summary">Hasil untuk “{search}”<button onClick={() => { setSearch(''); setQuery(''); }} aria-label="Hapus kata pencarian"><X size={15} /></button></div>}
              <div className="item-grid">{filtered.map(item => <button className="item-card" key={item.id} onClick={() => { setDetail(item); setClaim(false); }}><div className="item-image"><ItemPhoto src={item.image} alt={item.title} /><span className="found-badge"><span /> Ditemukan</span><span className="image-arrow"><ArrowUpRightIcon /></span></div><div className="item-content"><div className="item-meta"><span>{item.category}</span><span>{dateLabel(item.date)}</span></div><h3>{item.title}</h3><p className="item-location"><MapPin size={14} /> {item.location}</p><div className="item-source">{item.source.startsWith('@') ? <Instagram size={14} /> : <HeartHandshake size={14} />}<span>{item.source}</span><ChevronRight size={15} /></div></div></button>)}</div>
              {!filtered.length && <div className="empty-state"><Search size={32} /><h3>Belum ada barang yang sesuai</h3><p>Coba kata kunci lain, atau perluas kota dan kategori.</p><button className="button secondary" onClick={() => { setQuery(''); setSearch(''); setCity('Semua kota'); setCategory('Semua'); setSource('all'); }}>Reset pencarian</button></div>}
              <div className="results-footer"><span>{filtered.length} barang ditampilkan · Data contoh</span><span><ShieldCheck size={14} /> Verifikasi sebelum serah terima</span></div>
            </section><aside className="right-rail"><QueuePanel /><section className="tip-card"><div className="tip-heading"><ShieldCheck size={20} /><strong>Tetap aman, tetap peduli.</strong></div><p>Jangan bagikan isi dompet, nomor identitas, atau ciri rahasia barang di laporan publik.</p><button className="text-button" onClick={() => setHelp(true)}>Panduan serah terima <ArrowRight size={15} /></button></section></aside></div>
        </>}

        {view === 'reports' && <><div className="stat-grid"><Stat label="Total laporan" value={reports.length} icon={<FileSearch />} /><Stat label="Dalam antrean" value={queued.length} icon={<Clock3 />} /><Stat label="Sedang diproses" value={active ? 1 : 0} icon={<Sparkles />} /><Stat label="Selesai diproses" value={completed.length} icon={<CheckCircle2 />} /></div><div className="content-panel"><div className="section-heading"><h2>Aktivitas laporan</h2><span className="demo-badge">Data demo · tersimpan di browser</span></div><div className="tabs">{[['all', 'Semua laporan'], ['lost', 'Kehilangan'], ['found', 'Penemuan']].map(([id, label]) => <button key={id} className={reportFilter === id ? 'active' : ''} onClick={() => setReportFilter(id)}>{label}</button>)}</div><div className="report-list">{reports.filter(r => reportFilter === 'all' || r.type === reportFilter).map(r => <button className="report-row" key={r.id} onClick={() => setReportDetail(r.id)}><ItemPhoto src={r.image} alt={r.title} /><div className="report-info"><span className="micro">{r.id} · {r.type === 'lost' ? 'Kehilangan' : 'Penemuan'}</span><h3>{r.title}</h3><span className="muted small"><MapPin size={13} /> {r.location}</span></div><div className="report-state"><span className={`status-badge ${r.resolved ? 'success' : r.status}`}>{r.resolved ? 'Dikembalikan' : statusLabels[r.status]}</span><small>{r.status === 'queued' ? `Antrean #${queuePosition(reports, r.id)}` : r.status === 'success' ? 'Lihat hasil simulasi' : 'Satu permintaan aktif'}</small></div><ChevronRight size={18} /></button>)}</div>{!reports.filter(r => reportFilter === 'all' || r.type === reportFilter).length && <div className="empty-state"><FileSearch size={32} /><h3>Belum ada laporan</h3><p>Laporan yang kamu buat akan muncul di sini.</p><button className="button primary" onClick={() => openForm(reportFilter === 'found' ? 'found' : 'lost')}>Buat laporan pertama</button></div>}</div></>}

        {view === 'queue' && <div className="queue-page"><div><div className="info-banner"><Sparkles size={23} /><div><strong>Satu giliran, satu perhatian penuh.</strong><p>Pencarian barang hilang dan penyebaran barang temuan berbagi antrean yang sama. Permintaan pertama masuk akan diproses lebih dulu.</p></div></div><div className="content-panel"><div className="section-heading"><h2>Urutan permintaan saya</h2><span className="demo-badge">Simulasi lokal</span></div>{[...reports].sort((a, b) => a.createdAt - b.createdAt).map(r => <div className="timeline-row" key={r.id}><span className={`timeline-icon ${r.status}`}>{r.status === 'success' ? <Check size={18} /> : r.status === 'running' ? <LoaderCircle size={18} className={simulation ? 'spin' : ''} /> : queuePosition(reports, r.id)}</span><div><h3>{r.title}</h3><p>{r.type === 'lost' ? 'Pencarian Instagram lokal' : 'Penyebaran ke akun lokal'} · {r.city}</p><span className={`status-badge ${r.status}`}>{statusLabels[r.status]}</span></div><button className="text-button" onClick={() => setReportDetail(r.id)}>Detail <ChevronRight size={15} /></button></div>)}{!reports.length && <div className="empty-state"><Clock3 size={32} /><h3>Antrean masih kosong</h3><p>Buat laporan untuk mencoba antrean.</p></div>}</div><p className="demo-explanation">Pada demo ini, satu permintaan selesai dalam sekitar 12 detik. Simulasi berjalan saat halaman terbuka. Pencarian Instagram dan pengiriman DM belum terhubung.</p></div><QueuePanel expanded /></div>}

        {view === 'notifications' && <div className="content-panel"><div className="section-heading"><h2>Semua notifikasi <span className="count-badge">{unread}</span></h2><button className="text-button" disabled={!unread} onClick={() => { setNotices(n => n.map(v => ({ ...v, read: true }))); setToast('Semua notifikasi ditandai sudah dibaca.'); }}><CheckCheck size={17} /> Tandai semua dibaca</button></div>{notices.map(n => <button className={`notice-row ${!n.read ? 'unread' : ''}`} key={n.id} onClick={() => setNotices(prev => prev.map(v => v.id === n.id ? { ...v, read: true } : v))}><span className="icon-tile blue"><Bell size={21} /></span><div><h3>{n.title}</h3><p>{n.message}</p><span className="micro">{new Date(n.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>{!n.read && <span className="notification-dot" />}</button>)}</div>}

        {view === 'account' && <div className="account-layout"><div className="content-panel"><div className="profile-heading"><div className="avatar large">{profile.name.slice(0, 2).toUpperCase()}</div><div><h2>{signedIn ? profile.name : 'Selamat datang kembali'}</h2><p>{signedIn ? 'Anggota komunitas Temu' : 'Gunakan akun demo untuk mencoba pelaporan.'}</p></div><span className="demo-badge">Akun demo</span></div>{signedIn ? <form onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); setProfile({ name: String(data.get('name')).trim(), email: String(data.get('email')), phone: String(data.get('phone')), city: String(data.get('city')) }); setToast('Profil demo berhasil diperbarui.'); }}><div className="form-grid"><label>Nama lengkap<input name="name" required maxLength={60} pattern=".*\S.*" defaultValue={profile.name} /></label><label>Email<input name="email" type="email" required defaultValue={profile.email} /></label><label>Nomor telepon<input name="phone" type="tel" maxLength={20} defaultValue={profile.phone} placeholder="Contoh: 081234567890" /></label><label>Kota<select name="city" defaultValue={profile.city}>{cities.slice(1).map(c => <option key={c}>{c}</option>)}</select></label></div><div className="form-actions"><button className="text-button danger" type="button" onClick={() => { setSignedIn(false); setToast('Kamu sudah keluar dari akun demo.'); }}><LogOut size={16} /> Keluar</button><button className="button primary" type="submit">Simpan perubahan <Check size={16} /></button></div></form> : <form className="login-form" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); setProfile(p => ({ ...p, email: String(data.get('email')) })); setSignedIn(true); setToast('Berhasil masuk ke akun demo.'); navigate('search'); }}><label>Email<input name="email" type="email" required placeholder="nama@email.com" /></label><p className="muted small">Masuk demo tidak memerlukan kata sandi. Autentikasi Supabase akan dihubungkan pada tahap backend.</p><button className="button primary" type="submit">Masuk / daftar akun demo <ArrowRight size={16} /></button></form>}</div><div className="tip-card"><ShieldCheck size={28} /><h3>Kontakmu tetap pribadi.</h3><p>Informasi kontak tidak ditampilkan pada kartu barang publik. Gunakan data contoh selama mencoba frontend ini.</p></div></div>}
        <footer className="page-footer"><span>© 2026 Temu. Setiap temuan berarti.</span><span>Dibuat untuk saling membantu <HeartHandshake size={15} /></span></footer>
      </main>
    </div>

    {form && <ReportForm type={form} onType={setForm} close={() => setForm(null)} onSubmit={submitReport} />}
    {detail && <Modal title={claim ? 'Ajukan kecocokan barang' : 'Detail barang temuan'} close={() => setDetail(null)} wide><div className="detail-grid"><ItemPhoto src={detail.image} alt={detail.title} className="detail-photo" /><div><span className="status-badge success">Barang ditemukan · contoh</span><h2 className="detail-title">{detail.title}</h2><p className="item-location"><MapPin size={16} /> {detail.location}</p><p className="muted small">Ditemukan {dateLabel(detail.date)} · {detail.id}</p><p className="detail-description">{detail.description}</p><div className="source-box">{detail.source.startsWith('@') ? <Instagram size={18} /> : <HeartHandshake size={18} />}<span>Sumber: <strong>{detail.source}</strong></span></div><p className="privacy-note"><ShieldCheck size={16} /> Cocokkan ciri khusus sebelum serah terima.</p></div></div>{claim ? <form onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); const chosen = reports.find(r => r.id === data.get('report')); if (!chosen) return; setNotices(n => [{ id: crypto.randomUUID(), title: 'Kecocokan menunggu verifikasi', message: `${detail.title} diajukan sebagai kemungkinan cocok untuk ${chosen.title}. Pengajuan ini hanya disimpan dalam demo, belum dikirim ke penemu.`, read: false, createdAt: Date.now() }, ...n]); setDetail(null); navigate('notifications'); setToast('Pengajuan demo dicatat. Kepemilikan belum dikonfirmasi.'); }}><div className="form-grid"><label>Laporan kehilanganmu<select name="report" required><option value="">Pilih laporan</option>{reports.filter(r => r.type === 'lost' && !r.resolved).map(r => <option value={r.id} key={r.id}>{r.title}</option>)}</select></label><label>Ciri khusus yang hanya kamu ketahui<input name="evidence" required minLength={10} maxLength={200} placeholder="Jelaskan minimal 10 karakter" /></label></div><p className="muted small">Jangan masukkan nomor identitas atau data sensitif dalam demo ini.</p><div className="form-actions"><button className="text-button" type="button" onClick={() => setClaim(false)}><ArrowLeft size={16} /> Kembali</button><button className="button primary" type="submit">Ajukan verifikasi demo</button></div></form> : <div className="form-actions"><span className="muted small">Foto dan laporan adalah data contoh.</span><button className="button primary" onClick={() => { if (!signedIn) { setDetail(null); navigate('account'); } else if (!reports.some(r => r.type === 'lost' && !r.resolved)) { setDetail(null); openForm('lost'); } else setClaim(true); }}>Ini mungkin barang saya <ArrowRight size={16} /></button></div>}</Modal>}
    {selectedReport && <Modal title="Detail laporan" close={() => setReportDetail(null)}><span className={`status-badge ${selectedReport.status}`}>{statusLabels[selectedReport.status]}</span><h2 className="detail-title">{selectedReport.title}</h2><p className="muted">{selectedReport.id} · {selectedReport.location}</p><p className="detail-description">{selectedReport.description}</p><div className="info-banner compact"><Sparkles size={22} /><div><strong>{selectedReport.status === 'queued' ? `Posisi antrean #${queuePosition(reports, selectedReport.id)}` : selectedReport.status === 'running' ? 'Permintaan sedang mendapat giliran' : 'Pemrosesan demo selesai'}</strong><p>{selectedReport.status === 'success' ? selectedReport.type === 'lost' ? 'Contoh pencarian selesai. Belum ada kecocokan yang dikonfirmasi.' : 'Contoh penyebaran selesai. Tidak ada DM sungguhan dikirim.' : 'AI memproses satu permintaan pada satu waktu. Hasil akan muncul setelah giliran selesai.'}</p></div></div><h3 className="subheading">Akun lokal yang dituju</h3><div className="account-chips">{selectedReport.accounts.map(account => <span key={account}><Instagram size={14} /> @{account}</span>)}</div>{selectedReport.resolved ? <p className="success-message"><CheckCircle2 size={18} /> Barang sudah ditandai dikembalikan.</p> : selectedReport.status === 'success' && <form onSubmit={e => { e.preventDefault(); setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, resolved: true } : r)); setToast('Laporan ditandai selesai setelah konfirmasimu.'); }}><label className="checkbox-label"><input type="checkbox" required /> Saya mengonfirmasi barang sudah kembali ke pemiliknya.</label><button className="button primary full" type="submit">Tandai sudah dikembalikan</button></form>}</Modal>}
    {help && <Modal title="Sedikit panduan, banyak membantu" close={() => setHelp(false)}><div className="help-step"><span>01</span><div><h3>Cari atau buat laporan</h3><p>Gunakan kata kunci dan kota. Belum ketemu? Buat laporan kehilangan. Foto wajib untuk barang temuan.</p></div></div><div className="help-step"><span>02</span><div><h3>Tunggu giliran asisten AI</h3><p>Permintaan masuk antrean sesuai urutan. Hanya satu permintaan yang diproses pada satu waktu.</p></div></div><div className="help-step"><span>03</span><div><h3>Verifikasi, lalu serah terima</h3><p>Minta ciri khusus sebagai bukti kepemilikan. Hindari membagikan dokumen pribadi dan pilih tempat umum untuk bertemu.</p></div></div><div className="info-banner compact"><Sparkles size={22} /><div><strong>Tentang demo ini</strong><p>Semua item awal adalah contoh. Data disimpan di browser ini. Akun, pencarian Instagram, DM, dan antrean global belum terhubung ke backend. Simulasi antrean hanya berjalan pada halaman ini.</p></div></div></Modal>}
    {toast && <div className="toast" role="status"><CheckCircle2 size={20} /><span>{toast}</span><button aria-label="Tutup pemberitahuan" onClick={() => setToast('')}><X size={17} /></button></div>}
  </div>;
}

function ArrowUpRightIcon() { return <ArrowRight size={18} className="diagonal-arrow" />; }
function Stat({ label, value, icon }: { label: string; value: number; icon: ReactNode }) { return <div className="stat-card"><span className="icon-tile blue">{icon}</span><strong>{value.toString().padStart(2, '0')}</strong><span>{label}</span></div>; }

function ReportForm({ type, onType, close, onSubmit }: { type: 'lost' | 'found'; onType: (type: 'lost' | 'found') => void; close: () => void; onSubmit: (report: Report) => void }) {
  const [city, setCity] = useState('Bandung');
  const [photo, setPhoto] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>(localAccounts.Bandung);
  const [error, setError] = useState('');
  const upload = async (file?: File) => {
    if (!file) return;
    setPhotoError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setPhotoError('Pilih JPG, PNG, atau WebP berukuran maksimal 5 MB.'); return; }
    setBusy(true);
    try { const bitmap = await createImageBitmap(file); const canvas = document.createElement('canvas'); const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height)); canvas.width = bitmap.width * scale; canvas.height = bitmap.height * scale; canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); setPhoto(canvas.toDataURL('image/jpeg', 0.8)); bitmap.close(); } catch { setPhotoError('Foto tidak dapat dibaca. Coba file lain.'); } finally { setBusy(false); }
  };
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');
    if (type === 'found' && !photo) { setPhotoError('Foto barang wajib untuk laporan penemuan.'); return; }
    if (type === 'found' && !selected.length) { setError('Pilih setidaknya satu akun lokal.'); return; }
    const data = new FormData(e.currentTarget);
    if (!String(data.get('title')).trim() || String(data.get('description')).trim().length < 10 || !String(data.get('location')).trim()) { setError('Lengkapi judul, lokasi, dan deskripsi minimal 10 karakter.'); return; }
    onSubmit({ id: `LF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, type, title: String(data.get('title')).trim(), description: String(data.get('description')).trim(), category: String(data.get('category')), city, location: String(data.get('location')).trim(), date: String(data.get('date')), image: photo, accounts: type === 'found' ? selected : localAccounts[city], status: 'queued', createdAt: Date.now() });
  }
  return <Modal title="Buat laporan baru" close={close} wide><div className="report-type-picker"><button className={type === 'lost' ? 'selected' : ''} onClick={() => onType('lost')}><FileSearch size={21} /><span>Saya kehilangan barang</span>{type === 'lost' && <CheckCircle2 size={17} />}</button><button className={type === 'found' ? 'selected' : ''} onClick={() => onType('found')}><Package size={21} /><span>Saya menemukan barang</span>{type === 'found' && <CheckCircle2 size={17} />}</button></div><form onSubmit={submit}><div className="form-grid"><label>Nama barang <span>*</span><input name="title" placeholder="Contoh: Dompet kulit cokelat" required maxLength={80} /></label><label>Kategori <span>*</span><select name="category" required><option value="">Pilih kategori barang</option>{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select></label><label className="span-2">Deskripsi barang <span>*</span><textarea name="description" required minLength={10} maxLength={1000} rows={3} placeholder="Jelaskan warna, merek, dan lokasi umum. Simpan ciri rahasia untuk verifikasi." /></label><label>Kota <span>*</span><select value={city} onChange={e => { setCity(e.target.value); setSelected(localAccounts[e.target.value]); }}>{cities.slice(1).map(c => <option key={c}>{c}</option>)}</select></label><label>Tanggal {type === 'lost' ? 'kehilangan' : 'penemuan'} <span>*</span><input type="date" name="date" required max={today()} defaultValue={today()} /></label><label className="span-2">Lokasi lebih detail <span>*</span><input name="location" placeholder="Contoh: dekat pintu masuk Taman Gasibu" required maxLength={150} /></label><div className="span-2"><label className="field-label">Foto barang {type === 'found' ? '*' : '(opsional)'}</label><label className={`upload-area ${photo ? 'has-photo' : ''}`}>{photo ? <><img src={photo} alt="Pratinjau foto barang" /><span><strong>Foto siap digunakan</strong><small>Klik untuk mengganti foto</small></span></> : <><span className="upload-icon">{busy ? <LoaderCircle className="spin" size={22} /> : <ImagePlus size={24} />}</span><strong>Klik untuk unggah foto</strong><small>JPG, PNG, atau WebP · maksimal 5 MB</small></>}<input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Unggah foto barang" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} disabled={busy} /></label>{photo && <button className="text-button danger remove-photo" type="button" onClick={() => setPhoto('')}>Hapus foto</button>}{photoError && <p className="error-message" role="alert">{photoError}</p>}</div></div>{type === 'found' && <div className="target-accounts"><h3>Akun lokal yang dituju</h3><p className="muted small">Pilih akun untuk penyebaran informasi saat giliranmu tiba.</p><div className="account-chips">{localAccounts[city].map(account => <label key={account}><input type="checkbox" checked={selected.includes(account)} onChange={e => setSelected(prev => e.target.checked ? [...prev, account] : prev.filter(a => a !== account))} /><Instagram size={14} /> @{account}</label>)}</div></div>}<label className="checkbox-label"><input type="checkbox" required /> <span>{type === 'found' ? 'Saya menyetujui penyebaran foto dan deskripsi barang ke akun lokal yang dipilih. Foto tidak memuat data pribadi.' : 'Informasi laporan sudah benar dan tidak memuat data pribadi sensitif.'}</span></label><div className="enqueue-note"><Clock3 size={18} /><span>Laporan masuk antrean. AI memproses satu permintaan setiap giliran.</span></div>{error && <p className="error-message" role="alert">{error}</p>}<div className="form-actions"><button className="button secondary" type="button" onClick={close}>Batal</button><button className="button primary" type="submit" disabled={busy}>{busy ? 'Menyiapkan foto…' : 'Kirim ke antrean demo'}<ArrowRight size={17} /></button></div></form></Modal>;
}
