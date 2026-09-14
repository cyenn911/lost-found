export type Category = 'Semua' | 'Elektronik' | 'Dompet' | 'Tas' | 'Kunci' | 'Lainnya';
export type Item = { id: string; title: string; description: string; category: Category; city: string; location: string; date: string; image: string; source: string };
export type Report = { id: string; type: 'lost' | 'found'; title: string; description: string; category: string; city: string; location: string; date: string; image: string; accounts: string[]; status: 'queued' | 'running' | 'success' | 'failed'; createdAt: number; startedAt?: number; resolved?: boolean };
export type Notice = { id: string; title: string; message: string; read: boolean; createdAt: number };
export type Profile = { name: string; email: string; phone: string; city: string };
export const serviceAreas = ['Cimahi Utara', 'Cimahi Tengah', 'Cimahi Selatan', 'Padalarang', 'Batujajar', 'Ngamprah'] as const;
export const cities = ['Semua wilayah', ...serviceAreas];
export const isServiceArea = (value: string) => serviceAreas.some(area => area === value);
export const categories: Category[] = ['Semua', 'Elektronik', 'Dompet', 'Tas', 'Kunci', 'Lainnya'];
// Placeholder handles for the local demo; no external accounts are contacted.
export const localAccounts: Record<string, string[]> = Object.fromEntries(serviceAreas.map(area => [area, ['temu_cimahi_demo', 'temu_sekitar_demo']]));
// Illustrative catalog only. Photos and attribution are documented in README.md.
export const items: Item[] = [
  { id: 'F-1042', title: 'Dompet kulit cokelat', description: 'Dompet kulit berwarna cokelat ditemukan di area tempat duduk. Jika merasa memiliki, jelaskan ciri khusus dan isi dompet untuk verifikasi.', category: 'Dompet', city: 'Cimahi Tengah', location: 'Alun-alun Cimahi, Cimahi Tengah', date: '2026-09-07', image: '/images/wallet.jpg', source: 'Komunitas Temu' },
  { id: 'F-1041', title: 'Ransel hitam', description: 'Ransel hitam ditemukan tertinggal di dekat pintu masuk. Ada barang pribadi di dalamnya yang bisa digunakan untuk verifikasi kepemilikan.', category: 'Tas', city: 'Cimahi Utara', location: 'Cibabat, Cimahi Utara', date: '2026-09-07', image: '/images/backpack.jpg', source: '@temu_cimahi_demo' },
  { id: 'F-1040', title: 'Earbuds putih', description: 'Sepasang earbuds putih ditemukan di meja kafe. Sebutkan ciri khusus perangkat saat mengajukan kecocokan.', category: 'Elektronik', city: 'Cimahi Selatan', location: 'Cibeureum, Cimahi Selatan', date: '2026-09-06', image: '/images/earbuds.jpg', source: 'Komunitas Temu' },
  { id: 'F-1039', title: 'Kunci dengan gantungan', description: 'Satu set kunci ditemukan di area parkir. Jelaskan jumlah kunci dan bentuk gantungannya untuk membantu verifikasi.', category: 'Kunci', city: 'Padalarang', location: 'Area parkir, Padalarang', date: '2026-09-06', image: '/images/keys.jpg', source: '@temu_sekitar_demo' },
  { id: 'F-1038', title: 'Kamera analog hitam', description: 'Kamera analog berwarna hitam dan perak ditemukan di bangku taman. Pemilik dapat menyebutkan merek, jenis lensa, dan ciri khusus untuk verifikasi.', category: 'Elektronik', city: 'Batujajar', location: 'Bangku taman, Batujajar', date: '2026-09-05', image: '/images/camera.jpg', source: 'Komunitas Temu' },
  { id: 'F-1037', title: 'Kacamata bingkai hitam', description: 'Kacamata dengan bingkai hitam tertinggal di area perpustakaan. Silakan jelaskan karakteristik lensa dan tempat penyimpanannya.', category: 'Lainnya', city: 'Ngamprah', location: 'Area perpustakaan, Ngamprah', date: '2026-09-05', image: '/images/glasses.jpg', source: 'Komunitas Temu' },
];
export const initialReports: Report[] = [
  { id: 'LF-2026-001', type: 'lost', title: 'Dompet cokelat di Cimahi', description: 'Dompet kulit cokelat dengan jahitan di sisi depan, hilang saat pulang dari kampus.', category: 'Dompet', city: 'Cimahi Tengah', location: 'Cimahi Tengah', date: '2026-09-07', image: '/images/wallet.jpg', accounts: ['temu_cimahi_demo', 'temu_sekitar_demo'], status: 'queued', createdAt: 1788750000000 },
  { id: 'LF-2026-002', type: 'found', title: 'Kunci di area parkir', description: 'Ditemukan satu set kunci di area parkir dekat gerbang utama.', category: 'Kunci', city: 'Cimahi Utara', location: 'Cibabat, Cimahi Utara', date: '2026-09-07', image: '/images/keys.jpg', accounts: ['temu_cimahi_demo'], status: 'queued', createdAt: 1788750060000 },
];
export const initialNotices: Notice[] = [{ id: 'welcome', title: 'Selamat datang di Temu', message: 'Ini adalah demo interaktif. Laporan disimpan di browser ini dan antrean AI dapat disimulasikan.', read: false, createdAt: 1788750000000 }];
export function startNext(reports: Report[], now: number): Report[] {
  if (reports.some(report => report.status === 'running')) return reports;
  const next = [...reports].filter(report => report.status === 'queued').sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))[0];
  return next ? reports.map(report => report.id === next.id ? { ...report, status: 'running', startedAt: now } : report) : reports;
}
export function finishCurrent(reports: Report[], now: number): Report[] {
  return startNext(reports.map(report => report.status === 'running' ? { ...report, status: 'success' } : report), now);
}
export function queuePosition(reports: Report[], id: string): number {
  return [...reports].filter(report => report.status === 'queued').sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)).findIndex(report => report.id === id) + 1;
}
export const statusLabels = { queued: 'Dalam antrean', running: 'Sedang diproses', success: 'Selesai', failed: 'Gagal' };
