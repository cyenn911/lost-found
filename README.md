# Temu — Lost & Found frontend

Frontend interaktif berbahasa Indonesia berdasarkan `PRD-LostFound.md` versi 1.1.

## Menjalankan

```powershell
npm install
npm run dev
```

Buka alamat lokal yang ditampilkan terminal. `npm run build` menghasilkan situs statis di `out/`. `npm run typecheck` memeriksa TypeScript, dan `npm test` memeriksa aturan antrean. Node.js 22.18+ diperlukan untuk pengujian TypeScript langsung.

Scripts memanggil entrypoint Node secara langsung agar bekerja pada folder Windows yang mengandung `&`, seperti `LOST&FOUND`.

## Fitur frontend

- Pencarian kata kunci, kota, kategori, sumber, dan pengurutan temuan.
- Detail barang, pengajuan kecocokan demo, dan konfirmasi pengembalian oleh pengguna.
- Form kehilangan/penemuan dengan validasi tanggal, foto wajib untuk penemuan, pratinjau foto, pilihan akun lokal, dan persetujuan penyebaran.
- Foto JPG/PNG/WebP maksimal 5 MB, diperkecil secara lokal sebelum disimpan.
- Dashboard laporan dan antrean FIFO bersama untuk pencarian dan penyebaran.
- Simulasi satu job aktif, 12 detik per job, dengan jeda dan lanjutkan.
- Notifikasi, status belum dibaca, profil, masuk/keluar akun demo.
- Navigasi hash yang dapat ditautkan, tata letak mobile, dialog native, dan dukungan keyboard.

## Batas frontend

Semua item awal, akun, dan hasil adalah **data contoh**, ditandai pada UI. Laporan/profil/notifikasi tersimpan di localStorage browser ini. Jangan gunakan informasi sensitif. Ini bukan autentikasi sungguhan atau penyimpanan multi-user.

Simulasi antrean hanya berlaku pada halaman/browser ini. Jeda menghentikan simulasi; lanjutkan memulai ulang durasi job aktif. Refresh mempertahankan laporan, tetapi pengguna perlu melanjutkan simulasi. Tidak ada scraping, DM, email, atau operasi Supabase/OpenClaw nyata. Posisi antrean demo hanya menghitung laporan lokal. Kecocokan demo dicatat sebagai notifikasi; bukti kepemilikan tidak dikirim atau disimpan.

Integrasi produksi berikutnya: Supabase Auth/Storage/RLS, enqueue transaksi database, slot worker global yang diklaim atomik, n8n dispatcher, callback OpenClaw terautentikasi, retry/timeout/recovery, matching, dan realtime. Backend tersebut harus menegakkan konkurensi global; state React bukan pengaman server.

## Implementasi

Next.js App Router + React + TypeScript + Tailwind CSS v4 + Lucide. Next.js 16.3.4 dipakai sebagai pengganti versi 14 pada PRD setelah pemeriksaan paket menemukan advisori di versi lama. Arsitektur frontend tetap App Router dan dapat dihubungkan ke backend dalam PRD. TanStack Query tersedia untuk integrasi data server berikutnya.

- `app/page.tsx`: tampilan, form, modal, state demo.
- `app/globals.css`: tema dan layout responsif.
- `lib/demo.ts`: data contoh dan transisi antrean murni.
- `tests/queue.test.mjs`: validasi FIFO dan satu pekerjaan aktif.
- `public/images/`: foto contoh lokal.

## Referensi UI/UX

[iLost](https://ilost.co/) — referensi alur pencarian langsung, lokasi, serta jalur terpisah untuk melaporkan penemuan. Tampilan Temu dirancang sendiri: navigasi samping, palet biru, kartu foto, dan panel antrean sesuai kebutuhan PRD. Tidak menyalin identitas merek atau aset iLost.

## Kredit foto

Foto hanya ilustrasi, bukan barang temuan nyata. Foto diunduh ke proyek agar tidak bergantung pada URL CDN saat digunakan.

- Dompet: [Josh Withers / Pexels](https://www.pexels.com/photo/brown-leather-wallet-on-white-back-15763948/).
- Ransel: [Luis Quintero / Unsplash](https://unsplash.com/photos/person-in-black-jacket-holding-black-backpack-8TSqJoI-NVs).
- Earbuds: [Barrett Ward / Unsplash](https://unsplash.com/photos/apple-airpods-on-white-surface-0lMpQaXfOCg).
- Kunci: [Filip Szalbot / Unsplash](https://unsplash.com/photos/a-bunch-of-keys-sitting-on-top-of-a-wooden-table-PxiAc1aElFQ).
- Kamera: [Christopher Alvarenga / Unsplash](https://unsplash.com/photos/a-camera-sitting-on-top-of-a-wooden-table-4TDpcSZfMnM).
- Kacamata: [Sandi Benedicta / Unsplash](https://unsplash.com/photos/black-framed-eyeglasses-on-white-table-tBpGIeNoCnM).

Lisensi: [Unsplash](https://unsplash.com/license), [Pexels](https://www.pexels.com/license/).
