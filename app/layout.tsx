import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import './modern.css';
import './reference.css';
import './auth.css';

export const metadata: Metadata = {
  title: 'Temu — Bantu barang menemukan jalan pulang',
  description: 'Cari barang hilang dan laporkan penemuan di Cimahi, Padalarang, Batujajar, dan Ngamprah. Masuk atau daftar untuk bergabung dengan Temu.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
