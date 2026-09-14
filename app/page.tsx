'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Bell, Check, CheckCheck, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Clock3, FileSearch, HeartHandshake, ImagePlus, Camera as Instagram, LayoutGrid, List, ListFilter, LoaderCircle, LogOut, MapPin, Menu, Package, Plus, Search, ShieldCheck, Sparkles, UserRound, X, Headphones, Wallet, Backpack, KeyRound, Shapes } from 'lucide-react';
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
  const [catalogView, setCatalogView] = useState<'grid' | 'list'>('grid');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
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
  const featured = items[featuredIndex];

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 180);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key === '/' && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement) && !document.querySelector('dialog[open]')) {
        event.preventDefault(); searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

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

  function navigate(next: View) { setView(next); location.hash = next; setSidebar(false); document.getElementById('queue-peek')?.hidePopover(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
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

  return <div className={`app-shell ${view === 'search' ? 'discovery-page' : ''}`}>
    <a href="#main-content" className="skip-link">Lewati ke konten utama</a>
    <header className="site-header">
      <a href="#search" className="brand" onClick={() => navigate('search')} aria-label="Temu beranda">temu<span className="brand-dot">.</span></a>
      <nav className={`main-nav ${sidebar ? 'open' : ''}`} aria-label="Navigasi utama">
        {nav.slice(0, 3).map(link => <button key={link.id} className={view === link.id ? 'active' : ''} onClick={() => navigate(link.id)} aria-current={view === link.id ? 'page' : undefined}>{link.id === 'search' ? 'Jelajahi' : link.label}{link.id === 'queue' && <span className="nav-counter">{queued.length + (active ? 1 : 0)}</span>}</button>)}
        <button onClick={() => setHelp(true)}>Cara kerja</button>
        <button className="mobile-account" onClick={() => navigate('account')}>Akun saya</button>
      </nav>
      <div className="header-actions">
        <button className="icon-button notification-button" onClick={() => navigate('notifications')} aria-label={`Notifikasi, ${unread} belum dibaca`}><Bell size={20} />{unread > 0 && <i />}</button>
        <button className="avatar" onClick={() => navigate('account')} aria-label="Buka akun saya">{signedIn ? profile.name.slice(0, 2).toUpperCase() : <UserRound size={18} />}</button>
        <button className="button header-report" onClick={() => openForm('lost')}>Buat laporan <ArrowUpRight size={18} /></button>
        <button className="icon-button mobile-menu" onClick={() => setSidebar(!sidebar)} aria-label={sidebar ? 'Tutup menu' : 'Buka menu'} aria-expanded={sidebar}>{sidebar ? <X size={23} /> : <Menu size={23} />}</button>
      </div>
    </header>

    <div className="workspace">
      <main id="main-content" tabIndex={-1}>
        {view !== 'search' && <div className="page-heading" key={view}>
          <div><button className="back-link" onClick={() => navigate('search')}><ArrowLeft size={16} /> Kembali jelajahi</button><h1>{viewTitles[view]}<span className="title-period">.</span></h1><p>{view === 'reports' ? 'Semua laporanmu. Semua perkembangannya.' : view === 'queue' ? 'Satu per satu, sampai mendapat kabar.' : view === 'notifications' ? 'Kabar terbaru untukmu.' : 'Kenalan sedikit lebih dekat.'}</p></div>
          <button className="button primary" onClick={() => openForm('lost')}>Buat laporan <Plus size={18} /></button>
        </div>}

        {view === 'search' && <>
          <section className="discovery-hero">
            <img className="hero-landscape" src="/images/park.jpg" alt="Bangku taman di bawah pepohonan yang disinari matahari" fetchPriority="high" />
            <div className="hero-copy">
              <div className="hero-eyebrow"><HeartHandshake size={16} /> DARI TEMUAN, JADI PERTEMUAN</div>
              <h1>Bantu barang<br />menemukan<br /><span>jalan pulang.</span></h1>
              <p>Ada cerita di setiap barang yang tertinggal.<br />Cari milikmu, atau bantu kembalikan milik seseorang.</p>
              <div className="hero-actions"><button className="button primary" onClick={() => { searchRef.current?.focus(); searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>Cari barang saya <ArrowUpRight size={18} /></button><button className="hero-found-link" onClick={() => openForm('found')}>Saya menemukan barang <ArrowUpRight size={16} /></button></div>
            </div>
            <div className="hero-location"><MapPin size={14} /><span>Di suatu tempat, ada yang sedang mencari.</span></div>
          </section>

          <form className="search-form" onSubmit={e => { e.preventDefault(); setSearch(query.trim()); document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
            <label className="search-input"><Search size={21} /><span><span className="search-field-title">Barang apa yang kamu cari?</span><input ref={searchRef} aria-label="Cari nama atau ciri barang" placeholder="Dompet cokelat, kunci, ransel..." value={query} onChange={e => setQuery(e.target.value)} /></span><kbd>/</kbd></label>
            <label className="city-input"><MapPin size={19} /><span><span className="search-field-title">Terakhir terlihat di</span><select aria-label="Pilih kota" value={city} onChange={e => setCity(e.target.value)}>{cities.map(c => <option key={c}>{c}</option>)}</select></span><ChevronDown size={14} /></label>
            <button type="submit" className="search-submit">Cari barang <ArrowRight size={18} /></button>
          </form>

          <section className="community-intro" aria-labelledby="community-title">
            <div className="intro-visual">
              <div className="care-seal"><HeartHandshake size={24} /><span>Saling bantu.<br />Saling jaga.</span></div>
              <button className="intro-photo" onClick={() => { setDetail(featured); setClaim(false); }} aria-label={`Lihat ${featured.title}`}><ItemPhoto src={featured.image} alt={featured.title} /><span className="intro-photo-caption"><span><small>MENUNGGU PEMILIKNYA</small><strong>{featured.title}</strong></span><ArrowUpRight size={21} /></span></button>
              <div className="intro-photo-bottom"><span>Foto ilustrasi · {featured.city}</span><div className="intro-carousel"><button aria-label="Barang sebelumnya" onClick={() => setFeaturedIndex(i => (i + items.length - 1) % items.length)}><ArrowLeft size={16} /></button><span aria-live="polite">{String(featuredIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span><button aria-label="Barang berikutnya" onClick={() => setFeaturedIndex(i => (i + 1) % items.length)}><ArrowRight size={16} /></button></div></div>
            </div>
            <div className="intro-copy"><span className="section-index">KENALAN DENGAN TEMU</span><h2 id="community-title">Yang tertinggal,<br />bisa kembali.</h2><p>Temu mempertemukan orang yang kehilangan dengan mereka yang menemukan. Dari bangku taman hingga perjalanan pulang, kebaikan kecilmu bisa sangat berarti.</p><div className="intro-steps"><span><Search size={17} /> Cari barang</span><ChevronRight size={13} /><span><ShieldCheck size={17} /> Cocokkan cirinya</span><ChevronRight size={13} /><span><HeartHandshake size={17} /> Kembalikan</span></div><button className="button primary" onClick={() => setHelp(true)}>Kenali cara kerjanya <ArrowUpRight size={17} /></button></div>
          </section>

          <section className="results-section" id="catalog">
            <div className="catalog-heading"><div className="catalog-title"><span className="section-index">PENEMUAN TERBARU</span><h2>Siapa tahu, ini punyamu.</h2><p>Barang-barang yang sedang menunggu untuk kembali.</p></div><div className="catalog-location"><MapPin size={15} /><span>{city === 'Semua kota' ? 'Dari seluruh Indonesia' : `Di sekitar ${city}`}</span></div></div>
            <div className="catalog-toolbar">
              <div className="category-row" role="group" aria-label="Kategori barang">{categories.map(c => { const CategoryIcon = ({ Semua: Shapes, Elektronik: Headphones, Dompet: Wallet, Tas: Backpack, Kunci: KeyRound, Lainnya: Package })[c]; return <button key={c} className={category === c ? 'selected' : ''} aria-pressed={category === c} onClick={() => setCategory(c)}><CategoryIcon size={17} /><span>{c === 'Semua' ? 'Semua barang' : c}</span></button>; })}</div>
              <div className="catalog-tools"><button className={`filter-button ${filters ? 'selected' : ''}`} onClick={() => setFilters(!filters)} aria-expanded={filters}><ListFilter size={17} /><span>Filter</span>{source !== 'all' && <span className="filter-dot" />}</button><div className="view-switch" role="group" aria-label="Tampilan hasil"><button className={catalogView === 'grid' ? 'active' : ''} onClick={() => setCatalogView('grid')} aria-label="Tampilan grid" aria-pressed={catalogView === 'grid'}><LayoutGrid size={17} /></button><button className={catalogView === 'list' ? 'active' : ''} onClick={() => setCatalogView('list')} aria-label="Tampilan daftar" aria-pressed={catalogView === 'list'}><List size={19} /></button></div></div>
            </div>
            {filters && <div className="filter-panel"><label>Sumber temuan<select value={source} onChange={e => setSource(e.target.value)}><option value="all">Semua sumber</option><option value="internal">Komunitas Temu</option><option value="social">Instagram lokal</option></select></label><label>Urutkan<select value={sort} onChange={e => setSort(e.target.value)}><option value="new">Paling baru</option><option value="old">Paling lama</option><option value="name">Nama A–Z</option></select></label><button className="text-button" onClick={() => { setSource('all'); setSort('new'); setCity('Semua kota'); setCategory('Semua'); setQuery(''); setSearch(''); }}>Reset filter <X size={14} /></button></div>}
            <div className="results-meta"><span aria-live="polite"><strong>{filtered.length}</strong> barang ditemukan{search && <> untuk <strong>“{search}”</strong></>}</span><span>DATA CONTOH <span className="tiny-dot" /> DIPERBARUI 7 SEP 2026</span></div>
            {search && <button className="search-summary" onClick={() => { setSearch(''); setQuery(''); }}>{search}<X size={13} /></button>}
            <div className={`item-grid ${catalogView === 'list' ? 'list-view' : ''}`} key={`${category}-${source}-${catalogView}`}>
              {filtered.map((item, index) => <button className="item-card" key={item.id} style={{ animationDelay: `${Math.min(index, 7) * 45}ms` }} onClick={() => { setDetail(item); setClaim(false); }}>
                <div className="item-image"><ItemPhoto src={item.image} alt={item.title} /><span className="found-badge"><span /> Ditemukan</span><span className="image-arrow"><ArrowUpRight size={22} /></span><span className="item-image-category">{item.category}</span></div>
                <div className="item-content"><div className="item-meta"><span>{item.source.startsWith('@') ? <><Instagram size={12} /> Instagram</> : <><span className="source-dot" /> Komunitas</>}</span><span>{dateLabel(item.date)}</span></div><h3>{item.title}</h3><p className="item-location"><MapPin size={14} />{item.location}</p><div className="item-source"><span>{item.source}</span><span>Lihat barang <ArrowUpRight size={15} /></span></div></div>
              </button>)}
            </div>
            {!filtered.length && <div className="empty-state"><Search size={35} /><h3>Belum ketemu yang cocok.</h3><p>Coba ciri barang yang lain atau perluas lokasinya.</p><div><button className="button secondary" onClick={() => { setQuery(''); setSearch(''); setCity('Semua kota'); setCategory('Semua'); setSource('all'); }}>Reset pencarian</button><button className="button primary" onClick={() => openForm('lost')}>Buat laporan <ArrowUpRight size={17} /></button></div></div>}
            <div className="results-footer"><span>Kamu sudah melihat semua {filtered.length} temuan.</span><button onClick={() => openForm('lost')}>Belum ketemu? Buat laporan <ArrowUpRight size={16} /></button></div>
          </section>

          <section className="report-banner"><div className="report-banner-heading"><span className="section-index">02 / GILIRANMU MEMBANTU</span><h2>Ketemu barang?<br /><span>Jadilah kabar baiknya.</span></h2></div><div className="report-banner-action"><p>Foto, ceritakan di mana kamu menemukannya.<br />Biar kami bantu mencari pemiliknya.</p><button className="button primary" onClick={() => openForm('found')}>Saya menemukan barang <ArrowUpRight size={20} /></button></div></section>
        </>}

        {view === 'reports' && <><div className="stat-grid"><Stat label="Total laporan" value={reports.length} icon={<FileSearch />} /><Stat label="Dalam antrean" value={queued.length} icon={<Clock3 />} /><Stat label="Sedang diproses" value={active ? 1 : 0} icon={<Sparkles />} /><Stat label="Selesai diproses" value={completed.length} icon={<CheckCircle2 />} /></div><div className="content-panel"><div className="section-heading"><h2>Aktivitas laporan</h2><span className="demo-badge">Data demo · tersimpan di browser</span></div><div className="tabs">{[['all', 'Semua laporan'], ['lost', 'Kehilangan'], ['found', 'Penemuan']].map(([id, label]) => <button key={id} className={reportFilter === id ? 'active' : ''} onClick={() => setReportFilter(id)}>{label}</button>)}</div><div className="report-list">{reports.filter(r => reportFilter === 'all' || r.type === reportFilter).map(r => <button className="report-row" key={r.id} onClick={() => setReportDetail(r.id)}><ItemPhoto src={r.image} alt={r.title} /><div className="report-info"><span className="micro">{r.id} · {r.type === 'lost' ? 'Kehilangan' : 'Penemuan'}</span><h3>{r.title}</h3><span className="muted small"><MapPin size={13} /> {r.location}</span></div><div className="report-state"><span className={`status-badge ${r.resolved ? 'success' : r.status}`}>{r.resolved ? 'Dikembalikan' : statusLabels[r.status]}</span><small>{r.status === 'queued' ? `Antrean #${queuePosition(reports, r.id)}` : r.status === 'success' ? 'Lihat hasil simulasi' : 'Satu permintaan aktif'}</small></div><ChevronRight size={18} /></button>)}</div>{!reports.filter(r => reportFilter === 'all' || r.type === reportFilter).length && <div className="empty-state"><FileSearch size={32} /><h3>Belum ada laporan</h3><p>Laporan yang kamu buat akan muncul di sini.</p><button className="button primary" onClick={() => openForm(reportFilter === 'found' ? 'found' : 'lost')}>Buat laporan pertama</button></div>}</div></>}

        {view === 'queue' && <div className="queue-page"><div><div className="info-banner"><Sparkles size={23} /><div><strong>Satu giliran, satu perhatian penuh.</strong><p>Pencarian barang hilang dan penyebaran barang temuan berbagi antrean yang sama. Permintaan pertama masuk akan diproses lebih dulu.</p></div></div><div className="content-panel"><div className="section-heading"><h2>Urutan permintaan saya</h2><span className="demo-badge">Simulasi lokal</span></div>{[...reports].sort((a, b) => a.createdAt - b.createdAt).map(r => <div className="timeline-row" key={r.id}><span className={`timeline-icon ${r.status}`}>{r.status === 'success' ? <Check size={18} /> : r.status === 'running' ? <LoaderCircle size={18} className={simulation ? 'spin' : ''} /> : queuePosition(reports, r.id)}</span><div><h3>{r.title}</h3><p>{r.type === 'lost' ? 'Pencarian Instagram lokal' : 'Penyebaran ke akun lokal'} · {r.city}</p><span className={`status-badge ${r.status}`}>{statusLabels[r.status]}</span></div><button className="text-button" onClick={() => setReportDetail(r.id)}>Detail <ChevronRight size={15} /></button></div>)}{!reports.length && <div className="empty-state"><Clock3 size={32} /><h3>Antrean masih kosong</h3><p>Buat laporan untuk mencoba antrean.</p></div>}</div><p className="demo-explanation">Pada demo ini, satu permintaan selesai dalam sekitar 12 detik. Simulasi berjalan saat halaman terbuka. Pencarian Instagram dan pengiriman DM belum terhubung.</p></div><QueuePanel expanded /></div>}

        {view === 'notifications' && <div className="content-panel"><div className="section-heading"><h2>Semua notifikasi <span className="count-badge">{unread}</span></h2><button className="text-button" disabled={!unread} onClick={() => { setNotices(n => n.map(v => ({ ...v, read: true }))); setToast('Semua notifikasi ditandai sudah dibaca.'); }}><CheckCheck size={17} /> Tandai semua dibaca</button></div>{notices.map(n => <button className={`notice-row ${!n.read ? 'unread' : ''}`} key={n.id} onClick={() => setNotices(prev => prev.map(v => v.id === n.id ? { ...v, read: true } : v))}><span className="icon-tile blue"><Bell size={21} /></span><div><h3>{n.title}</h3><p>{n.message}</p><span className="micro">{new Date(n.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>{!n.read && <span className="notification-dot" />}</button>)}</div>}

        {view === 'account' && <div className="account-layout"><div className="content-panel"><div className="profile-heading"><div className="avatar large">{profile.name.slice(0, 2).toUpperCase()}</div><div><h2>{signedIn ? profile.name : 'Selamat datang kembali'}</h2><p>{signedIn ? 'Anggota komunitas Temu' : 'Gunakan akun demo untuk mencoba pelaporan.'}</p></div><span className="demo-badge">Akun demo</span></div>{signedIn ? <form onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); setProfile({ name: String(data.get('name')).trim(), email: String(data.get('email')), phone: String(data.get('phone')), city: String(data.get('city')) }); setToast('Profil demo berhasil diperbarui.'); }}><div className="form-grid"><label>Nama lengkap<input name="name" required maxLength={60} pattern=".*\S.*" defaultValue={profile.name} /></label><label>Email<input name="email" type="email" required defaultValue={profile.email} /></label><label>Nomor telepon<input name="phone" type="tel" maxLength={20} defaultValue={profile.phone} placeholder="Contoh: 081234567890" /></label><label>Kota<select name="city" defaultValue={profile.city}>{cities.slice(1).map(c => <option key={c}>{c}</option>)}</select></label></div><div className="form-actions"><button className="text-button danger" type="button" onClick={() => { setSignedIn(false); setToast('Kamu sudah keluar dari akun demo.'); }}><LogOut size={16} /> Keluar</button><button className="button primary" type="submit">Simpan perubahan <Check size={16} /></button></div></form> : <form className="login-form" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); setProfile(p => ({ ...p, email: String(data.get('email')) })); setSignedIn(true); setToast('Berhasil masuk ke akun demo.'); navigate('search'); }}><label>Email<input name="email" type="email" required placeholder="nama@email.com" /></label><p className="muted small">Masuk demo tidak memerlukan kata sandi. Autentikasi Supabase akan dihubungkan pada tahap backend.</p><button className="button primary" type="submit">Masuk / daftar akun demo <ArrowRight size={16} /></button></form>}</div><div className="tip-card"><ShieldCheck size={28} /><h3>Kontakmu tetap pribadi.</h3><p>Informasi kontak tidak ditampilkan pada kartu barang publik. Gunakan data contoh selama mencoba frontend ini.</p></div></div>}
        <footer className="page-footer"><a href="#search" className="brand" onClick={() => navigate('search')}>temu<span className="brand-dot">.</span></a><span>Selalu ada jalan untuk kembali.</span><div><button onClick={() => setHelp(true)}>Bantuan <ArrowUpRight size={14} /></button><span>© 2026 Temu</span><span className="demo-badge">Demo interaktif</span></div></footer>
      </main>
    </div>

    <button className="queue-dock" popoverTarget="queue-peek"><span className={`dock-indicator ${simulation ? 'working' : ''}`} />{simulation ? 'AI sedang bekerja' : 'Antrean saya'}<span className="dock-count">{queued.length + (active ? 1 : 0)}</span><Plus size={17} /></button>
    <div id="queue-peek" className="queue-popover" popover="auto"><button className="queue-popover-close icon-button" popoverTarget="queue-peek" popoverTargetAction="hide" aria-label="Tutup antrean"><X size={17} /></button><QueuePanel /></div>

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
