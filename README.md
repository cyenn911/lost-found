# Temu — Lost & Found frontend

Frontend interaktif berbahasa Indonesia berdasarkan `PRD-LostFound.md` versi 1.1, dengan lingkup layanan Cimahi Utara, Cimahi Tengah, Cimahi Selatan, Padalarang, Batujajar, dan Ngamprah.

## Menjalankan

```powershell
npm install
npm run dev
```

Buka alamat lokal yang ditampilkan terminal. `npm run build` menghasilkan situs statis di `out/`. `npm run typecheck` memeriksa TypeScript, dan `npm test` memeriksa aturan antrean. Node.js 22.18+ diperlukan untuk pengujian TypeScript langsung.

Scripts memanggil entrypoint Node secara langsung agar bekerja pada folder Windows yang mengandung `&`, seperti `LOST&FOUND`.

## Fitur frontend

- Halaman masuk/daftar wajib sebelum aplikasi dapat diakses, termasuk lewat tautan hash langsung.
- Pencarian kata kunci, enam wilayah layanan, kategori, sumber, dan pengurutan temuan.
- Detail barang, pengajuan kecocokan demo, dan konfirmasi pengembalian oleh pengguna.
- Form kehilangan/penemuan dengan validasi tanggal, foto wajib untuk penemuan, pratinjau foto, pilihan akun lokal, dan persetujuan penyebaran.
- Foto JPG/PNG/WebP maksimal 5 MB, diperkecil secara lokal sebelum disimpan.
- Dashboard laporan dan antrean FIFO bersama untuk pencarian dan penyebaran.
- Simulasi satu job aktif, 12 detik per job, dengan jeda dan lanjutkan.
- Notifikasi, status belum dibaca, profil, masuk/keluar akun demo.
- Navigasi hash yang dapat ditautkan, tata letak mobile, dialog native, dan dukungan keyboard.

## Batas frontend

Semua item awal, akun, dan hasil adalah **data contoh**, ditandai pada UI. Laporan/profil/notifikasi tersimpan di localStorage browser ini. Jangan gunakan informasi sensitif. Ini bukan autentikasi sungguhan atau penyimpanan multi-user.

Daftar akun demo menggunakan nama, email, wilayah, kata sandi minimal 8 karakter, dan konfirmasi kata sandi. Login memverifikasi email serta kata sandi akun yang sudah didaftarkan. Kata sandi disimpan sebagai hash PBKDF2 dengan salt, bukan teks asli. Ini tetap simulasi di browser, bukan kontrol akses produksi.

Sesi demo berada di sessionStorage (maksimal 12 jam); refresh di tab yang sama mempertahankan sesi. Logout mengembalikan pengguna ke halaman masuk. Laporan dan notifikasi dipisahkan per ID akun, dan akun baru dimulai tanpa laporan pribadi. Data lama `temu-demo-v1` tetap disimpan tetapi tidak dipakai untuk login atau dimasukkan ke akun baru. Membuka maupun mengirim kedua jenis laporan memeriksa sesi; wilayah di luar daftar layanan ditolak. Akun sosial berakhiran `_demo` adalah placeholder, bukan tujuan pengiriman sungguhan.

Simulasi antrean hanya berlaku pada halaman/browser ini. Jeda menghentikan simulasi; lanjutkan memulai ulang durasi job aktif. Refresh mempertahankan laporan, tetapi pengguna perlu melanjutkan simulasi. Tidak ada scraping, DM, email, atau operasi Supabase/OpenClaw nyata. Posisi antrean demo hanya menghitung laporan lokal. Kecocokan demo dicatat sebagai notifikasi; bukti kepemilikan tidak dikirim atau disimpan.

Integrasi produksi berikutnya: Supabase Auth/Storage/RLS, enqueue transaksi database, slot worker global yang diklaim atomik, n8n dispatcher, callback OpenClaw terautentikasi, retry/timeout/recovery, matching, dan realtime. Backend tersebut harus menegakkan konkurensi global; state React bukan pengaman server.

## Implementasi

Next.js App Router + React + TypeScript + Tailwind CSS v4 + Lucide. Next.js 16.3.4 dipakai sebagai pengganti versi 14 pada PRD setelah pemeriksaan paket menemukan advisori di versi lama. Arsitektur frontend tetap App Router dan dapat dihubungkan ke backend dalam PRD. TanStack Query tersedia untuk integrasi data server berikutnya.

- `app/page.tsx`: tampilan, form, modal, state demo.
- `app/auth-screen.tsx` dan `app/auth.css`: form masuk/daftar dan tampilan responsif.
- `lib/demo-auth.ts`: akun serta sesi demo lokal dan pemisahan data per akun.
- `app/globals.css`: tema dan layout responsif.
- `app/modern.css`: komponen, formulir, dan layout aplikasi.
- `app/reference.css`: tema hijau-krem dan landing page berdasarkan referensi visual.
- `lib/demo.ts`: data contoh dan transisi antrean murni.
- `tests/queue.test.mjs`: validasi FIFO dan satu pekerjaan aktif.
- `tests/auth.test.mjs`: login, sesi, isolasi akun, kegagalan penyimpanan, dan batas wilayah.
- `public/images/`: foto contoh lokal.

## Referensi UI/UX

[iLost](https://ilost.co/) — referensi alur pencarian langsung, lokasi, serta jalur terpisah untuk melaporkan penemuan. Desain visual mengikuti referensi gambar yang diberikan: bingkai sage, kanvas krem, foto taman, pencarian mengambang, dan kartu temuan. Identitas serta konten tetap milik Temu.

## Kredit foto

Foto hanya ilustrasi, bukan barang temuan nyata. Foto diunduh ke proyek agar tidak bergantung pada URL CDN saat digunakan.

- Taman (hero): [Amine BELHAIZA / Unsplash](https://unsplash.com/photos/sh98Qcs8Ub4).

- Dompet: [Josh Withers / Pexels](https://www.pexels.com/photo/brown-leather-wallet-on-white-back-15763948/).
- Ransel: [Luis Quintero / Unsplash](https://unsplash.com/photos/person-in-black-jacket-holding-black-backpack-8TSqJoI-NVs).
- Earbuds: [Barrett Ward / Unsplash](https://unsplash.com/photos/apple-airpods-on-white-surface-0lMpQaXfOCg).
- Kunci: [Filip Szalbot / Unsplash](https://unsplash.com/photos/a-bunch-of-keys-sitting-on-top-of-a-wooden-table-PxiAc1aElFQ).
- Kamera: [Christopher Alvarenga / Unsplash](https://unsplash.com/photos/a-camera-sitting-on-top-of-a-wooden-table-4TDpcSZfMnM).
- Kacamata: [Sandi Benedicta / Unsplash](https://unsplash.com/photos/black-framed-eyeglasses-on-white-table-tBpGIeNoCnM).

Lisensi: [Unsplash](https://unsplash.com/license), [Pexels](https://www.pexels.com/license/).
