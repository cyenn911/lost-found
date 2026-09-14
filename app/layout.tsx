import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import './modern.css';
import './reference.css';

export const metadata: Metadata = {
  title: 'Temu — Bantu barang menemukan jalan pulang',
  description: 'Cari barang hilang, laporkan penemuan, dan pantau antrean pencarian AI di satu tempat.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
