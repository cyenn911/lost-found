# Product Requirements Document (PRD)
# Lost & Found Platform dengan AI Agent (OpenClaw)

**Versi:** 1.1
**Status:** Draft untuk eksekusi AI Coding Agent
**Tanggal:** 7 September 2026

---

## 1. Ringkasan Produk

Lost & Found adalah platform web yang membantu pengguna melaporkan barang hilang maupun barang temuan, lalu memanfaatkan **AI Agent (OpenClaw)** yang diorkestrasi melalui **n8n** untuk secara otomatis:

1. **Mencari** barang hilang di akun-akun media sosial (Instagram) lokal yang relevan dengan lokasi kehilangan.
2. **Menyebarkan** informasi barang temuan dengan mengirim DM otomatis ke akun-akun Instagram lokal yang relevan dengan lokasi penemuan.

Setiap permintaan pencarian atau penyebaran dari pengguna masuk ke **antrean persisten** terlebih dahulu. AI Agent memproses permintaan **satu per satu secara global**: maksimal satu job OpenClaw aktif di seluruh sistem, bukan satu job per pengguna. Pengguna tetap bisa mengirim laporan dan memantau status sambil menunggu giliran.

Dokumen ini ditujukan sebagai spesifikasi teknis lengkap agar dapat dieksekusi langsung oleh AI coding agent (mis. Claude Code) untuk membangun sistem end-to-end.

---

## 2. Latar Belakang & Masalah

- Barang hilang biasanya dilaporkan secara manual di grup Facebook/Instagram lokal (contoh: `infobdg`), prosesnya lambat dan tidak terstruktur.
- Tidak ada sistem terpusat yang mencocokkan laporan "kehilangan" dengan laporan "penemuan".
- Pencarian manual di media sosial memakan waktu dan tidak konsisten.

## 3. Tujuan Produk

| Tujuan | Metrik Keberhasilan |
|---|---|
| Mempercepat proses pelaporan barang hilang/temuan | Waktu rata-rata submit laporan < 2 menit |
| Meningkatkan peluang barang ditemukan kembali | % laporan hilang yang match dengan laporan temuan |
| Otomatisasi pencarian & penyebaran info via sosmed | % laporan yang berhasil diproses AI Agent tanpa intervensi manual |
| Pengalaman pengguna yang jelas soal status laporan | Retensi pengguna kembali cek status (D7 retention) |

## 4. Target Pengguna

- **Pelapor Kehilangan**: individu yang kehilangan barang di suatu wilayah/kota.
- **Pelapor Penemuan**: individu yang menemukan barang tak bertuan.
- **Admin/Ops** (opsional, fase lanjut): memantau kualitas match & moderasi konten.

---

## 5. Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend Web | **Next.js 14 (App Router) + TypeScript + TailwindCSS** | SSR/SEO baik untuk halaman publik, ekosistem React matang |
| State/Data fetching | **TanStack Query** | Sinkronisasi data real-time dgn Supabase |
| Auth & Database | **Supabase** (Postgres + Auth + Row Level Security) | Sesuai requirement, cepat untuk MVP |
| File/Image Storage | **Supabase Storage** | Terintegrasi langsung dengan DB & Auth |
| Realtime status update | **Supabase Realtime (Postgres Changes)** | Untuk update status laporan & notifikasi live |
| Automasi/Orkestrasi Workflow | **n8n** (self-hosted, Docker) | Menjembatani Supabase ↔ OpenClaw ↔ Instagram |
| AI Agent | **OpenClaw** (agent pencarian & pengiriman DM sosmed) | Sesuai requirement, dipanggil sebagai service via webhook/API |
| Vector similarity (matching semantik) | **pgvector (extension Supabase)** | Untuk mencocokkan deskripsi barang hilang vs temuan |
| Notifikasi | **Supabase Edge Functions + Resend/Email API** (opsional WhatsApp via Fonnte/Twilio di fase lanjut) | Notifikasi status & match |
| Hosting Frontend | **Vercel** | Deploy Next.js paling mulus |
| Hosting n8n | **VPS/Docker (mis. Railway/Fly.io)** | n8n butuh proses long-running |
| Monitoring/Log | **Supabase Logs + n8n Execution Log** | Observability pipeline AI Agent |

**Catatan integrasi OpenClaw:** OpenClaw diperlakukan sebagai *black-box service* yang menerima payload terstruktur (lokasi, kata kunci, gambar) dan mengembalikan hasil (daftar akun yang match, status pengiriman DM). n8n bertugas sebagai orkestrator/glue, bukan OpenClaw sendiri yang connect ke Supabase.

---

## 6. Arsitektur Sistem (High-Level)

```
[Next.js Web App] --> [Supabase: Auth, DB, Storage]
                              |
                 [Antrean social_search_jobs]
                 [queued: search + dm_blast]
                              |
                 [n8n dispatcher + worker]
                 [claim atomik; satu job aktif]
                              |
                       [OpenClaw Agent] --> [Instagram]
                              |
                    [Callback hasil ke n8n]
                              |
                 [Supabase: hasil + status]
                              |
                 [Realtime update ke pengguna]
```

Alur ringkas:
1. User submit laporan (lost/found) → tersimpan di Supabase.
2. Pembuatan laporan dan job `queued` dilakukan dalam satu transaksi database agar laporan yang berhasil disimpan selalu memiliki job. Upload foto diselesaikan sebelum transaksi tersebut.
3. Supabase Database Webhook membangunkan dispatcher n8n; polling terjadwal menjadi cadangan jika webhook terlewat. Webhook tidak langsung menjalankan OpenClaw.
4. Dispatcher mengambil job tertua yang siap diproses secara atomik, hanya jika slot worker global kosong. n8n menyiapkan payload dan mengirim satu permintaan ke OpenClaw.
5. Slot tetap terisi selama OpenClaw bekerja, termasuk saat n8n sedang menunggu callback. Job berikutnya menunggu sampai job aktif benar-benar selesai atau dihentikan dan dikonfirmasi.
6. Callback yang valid menyimpan hasil, memperbarui status job/laporan dan notifikasi, lalu melepas slot dalam satu transaksi. Dispatcher kemudian mengambil job berikutnya.
7. Frontend menerima pembaruan antrean dan hasil secara real-time.

### 6.1 Antrean Permintaan AI — Proses Satu per Satu

- **Cakupan:** Semua job pencarian Instagram (`search`) dan penyebaran DM (`dm_blast`) berbagi satu antrean dan satu slot worker. Pencarian internal database, login, dan pemantauan laporan tidak perlu mengantre.
- **Urutan:** FIFO berdasarkan `queued_at`, lalu `id` sebagai pemecah urutan. Tidak ada prioritas khusus per pengguna atau tipe laporan.
- **Status job:** `queued` → `running` → `success` atau `failed`. UI menampilkan “Dalam antrean”, “Sedang diproses”, “Selesai”, atau “Gagal”. Status laporan `diajukan` mencakup waktu menunggu; laporan menjadi `diproses` ketika job diklaim.
- **Posisi antrean:** Tampilkan posisi mulai dari 1 di antara job `queued` yang siap diproses. Job yang menunggu jadwal retry menampilkan waktu percobaan berikutnya. Posisi bukan estimasi waktu selesai karena durasi setiap permintaan dapat berbeda.
- **Claim atomik:** Gunakan fungsi database khusus service role yang mengunci baris slot worker global, memastikan `active_job_id` kosong, mengambil satu job siap, lalu mengubahnya menjadi `running` dan mengisi slot dalam transaksi yang sama. Jangan mengandalkan pola baca-lalu-update dari n8n atau hanya membatasi jumlah workflow yang berjalan.
- **Retry:** Maksimal 3 percobaan total; retry kegagalan sementara yang sudah dipastikan berhenti dengan jeda 30 detik lalu 120 detik. Job retry kembali ke akhir antrean (`queued_at` diperbarui), dan baru eligible saat `available_at` tercapai. Job siap lainnya boleh diproses selama jeda tersebut. Kesalahan permanen langsung menjadi `failed`.
- **Timeout dan pemulihan:** Batas waktu awal 10 menit per percobaan, dapat dikonfigurasi. Timeout atau restart worker tidak otomatis membebaskan slot. Worker pemulihan memeriksa status OpenClaw atau meminta pembatalan; job berikutnya hanya dimulai setelah eksekusi lama dipastikan selesai/berhenti. Jika status tidak dapat dipastikan, antrean ditahan dan ops diberi informasi untuk pemulihan.
- **Idempotensi:** Satu job awal per laporan; pengiriman ulang menggunakan `job_id` sebagai kunci idempotensi dan `attempt_id` untuk mengenali percobaan aktif. Callback duplikat atau callback dari percobaan lama tidak boleh menulis hasil dua kali, melepas slot aktif lain, atau memicu pengiriman DM ulang. Retry DM hanya menargetkan akun yang belum berhasil dikirimi.
- **Ketahanan:** Job disimpan di Supabase, sehingga antrean tetap ada ketika n8n atau OpenClaw restart. Klaim, penyelesaian, dan pemulihan hanya boleh dilakukan oleh service role; pengguna tidak dapat mengubah status atau urutan job.

**Acceptance criteria:**
1. Jika 5 pengguna mengirim permintaan bersamaan, semua permintaan tersimpan dan diproses sesuai urutan FIFO; jumlah eksekusi OpenClaw aktif tidak pernah melebihi 1.
2. Job berikutnya tidak dimulai hanya karena request HTTP OpenClaw sudah diterima; sistem menunggu hasil akhir atau konfirmasi penghentian.
3. Pengguna melihat status menunggu, posisi antrean, status sedang diproses, dan hasil akhir tanpa perlu refresh manual.
4. Pemicu webhook berulang, dua dispatcher bersamaan, dan callback duplikat tidak membuat eksekusi atau notifikasi ganda.
5. Kegagalan, retry, timeout, dan restart tidak menghilangkan permintaan atau menjalankan dua job secara bersamaan.

---

## 7. Skema Database (Supabase / PostgreSQL)

```sql
-- Ekstensi
create extension if not exists vector;
create extension if not exists pg_trgm;

-- Profil pengguna (extend auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Master mapping lokasi -> akun instagram lokal
create table social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text default 'instagram',
  handle text not null,             -- contoh: infobdg
  city text not null,               -- contoh: Bandung
  region text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Laporan barang hilang
create table lost_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text,
  keywords text[],                  -- hasil ekstraksi kata kunci
  location_text text not null,
  city text not null,
  latitude double precision,
  longitude double precision,
  lost_date date,
  image_url text,
  embedding vector(1536),           -- untuk semantic matching
  status text default 'diajukan' check (status in ('diajukan','diproses','ditemukan','ditutup')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Laporan barang temuan
create table found_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  description text not null,
  category text,
  location_text text not null,
  city text not null,
  latitude double precision,
  longitude double precision,
  found_date date,
  image_url text not null,
  embedding vector(1536),
  status text default 'diajukan' check (status in ('diajukan','diproses','disebar','diklaim','ditutup')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Job pencarian/penyebaran oleh AI Agent (OpenClaw)
create table social_search_jobs (
  id uuid primary key default gen_random_uuid(),
  report_type text check (report_type in ('lost','found')) not null,
  report_id uuid not null,          -- FK dinamis ke lost_reports/found_reports
  job_type text check (job_type in ('search','dm_blast')) not null,
  target_accounts text[],           -- daftar handle IG yang dituju
  status text not null default 'queued' check (status in ('queued','running','success','failed')),
  queued_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  started_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count between 0 and 3),
  attempt_id uuid,                 -- token unik untuk setiap percobaan
  last_error text,
  result_data jsonb,                -- payload mentah hasil dari OpenClaw
  n8n_execution_id text,
  created_at timestamptz default now(),
  completed_at timestamptz,
  unique (report_type, report_id, job_type)
);

create index social_search_jobs_queue_idx
  on social_search_jobs (queued_at, id) where status = 'queued';

-- Pengaman tambahan: maksimal satu job running secara global.
create unique index social_search_jobs_one_running_idx
  on social_search_jobs ((true)) where status = 'running';

-- Slot tetap terisi selama menunggu callback / pemulihan timeout.
create table ai_worker_slot (
  id integer primary key check (id = 1),
  active_job_id uuid unique references social_search_jobs(id),
  updated_at timestamptz not null default now()
);
insert into ai_worker_slot (id) values (1);

-- Kecocokan antar laporan hilang & temuan
create table matches (
  id uuid primary key default gen_random_uuid(),
  lost_report_id uuid references lost_reports(id) on delete cascade,
  found_report_id uuid references found_reports(id) on delete cascade,
  confidence_score numeric check (confidence_score between 0 and 1),
  match_source text check (match_source in ('ai_semantic','openclaw_social','manual')),
  status text default 'menunggu_konfirmasi' check (status in ('menunggu_konfirmasi','dikonfirmasi','ditolak')),
  created_at timestamptz default now()
);

-- Notifikasi ke pengguna
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  related_report_id uuid,
  type text check (type in ('status_update','match_found','dm_sent','system')),
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);
```

**Row Level Security (RLS):** aktifkan di semua tabel milik user (`lost_reports`, `found_reports`, `notifications`) — user hanya bisa `select/update` baris miliknya sendiri; `insert` hanya untuk `auth.uid() = user_id`. Tabel `social_search_jobs` dan `matches` dibaca read-only oleh user terkait, ditulis hanya oleh service role (dipakai n8n via Supabase service key).

Aktifkan RLS di `ai_worker_slot`; tabel ini hanya dapat diakses service role. Sediakan RPC posisi antrean yang memverifikasi kepemilikan job dan hanya mengembalikan posisi/jumlah agregat, tanpa membocorkan laporan pengguna lain. Frontend memperbarui posisi lewat invalidasi agregat yang aman atau polling ringan, karena perubahan job pengguna lain tidak terlihat melalui RLS. Fungsi claim dan finalisasi menggunakan lock slot yang sama; fungsi finalisasi memvalidasi `active_job_id` dan `attempt_id` sebelum mengubah status serta melepas slot. Fungsi tersebut tidak dapat dieksekusi oleh role pengguna biasa.

---

## 8. Rincian Fitur per Fase

### FASE 1 — Cari Barang Hilang (Search)
**Tujuan:** User bisa mencari apakah barangnya sudah pernah dilaporkan ditemukan.

| Sub Fitur | Deskripsi | Acceptance Criteria |
|---|---|---|
| Cari kata kunci | Input pencarian bebas (nama barang, ciri khas) | Query full-text search (`pg_trgm`) ke `found_reports` |
| Pilih lokasi | Filter berdasarkan kota/wilayah | Dropdown kota, filter `city` di query |
| Hasil akun info | Menampilkan hasil match, termasuk sumber (internal DB / hasil OpenClaw dari sosmed) | Card hasil dengan foto, deskripsi, jarak kecocokan (%) |

### FASE 2 — Lapor Kehilangan & Lapor Penemuan

**Lapor Kehilangan**
| Sub Fitur | Deskripsi |
|---|---|
| Detail kehilangan | Form: judul, deskripsi, kategori, lokasi, tanggal hilang, foto (opsional) |
| Cari unggahan info | Setelah submit, masukkan permintaan ke antrean; AI Agent scan Instagram lokal saat giliran tiba |

Alur teknis:
1. Dalam satu transaksi, insert `lost_reports` (status `diajukan`) dan `social_search_jobs` (`job_type='search'`, `status='queued'`). Tampilkan status dan posisi antrean ke pengguna.
2. Supabase Webhook membangunkan dispatcher n8n. Dispatcher menunggu slot kosong lalu melakukan claim atomik sesuai urutan FIFO.
3. Saat giliran tiba, ubah laporan menjadi `diproses`, generate embedding deskripsi untuk semantic matching, dan lookup `social_accounts` berdasarkan `city`.
4. Panggil OpenClaw `/search` dengan identitas job/percobaan, kata kunci, kota, dan akun target. Pertahankan slot sampai hasil akhir diketahui.
5. OpenClaw callback ke n8n → finalisasi job, simpan `result_data`, buat notifikasi, dan lepaskan slot secara atomik. Pencarian selesai tidak otomatis berarti barang `ditemukan`; diperlukan konfirmasi pengguna.

**Lapor Penemuan**
| Sub Fitur | Deskripsi |
|---|---|
| Detail penemuan | Form: deskripsi, lokasi ditemukan, tanggal |
| Unggah foto | Wajib upload foto ke Supabase Storage bucket `found-items` |
| Pilih akun info | User bisa melihat/menyaring daftar akun IG lokal yang akan dituju (opsional override manual) |

Alur teknis:
1. Upload foto ke Storage. Dalam satu transaksi, insert `found_reports` (status `diajukan`, dengan `image_url`) dan job `dm_blast` berstatus `queued`, termasuk pilihan akun target pengguna.
2. Saat mendapat giliran melalui dispatcher yang sama, claim job dan ubah laporan menjadi `diproses`. Lookup akun lokal jika pengguna tidak memilih target secara manual.
3. Panggil OpenClaw `/dm-blast`. Agent mengirim DM ke akun target dengan jeda sesuai batas platform; semua pengiriman dalam job ini harus selesai sebelum job lain dimulai.
4. Callback hasil (`sent`/`failed` per akun) disimpan di `result_data`. Tandai job `success` dan laporan `disebar` jika semua target berhasil. Untuk hasil sebagian, tampilkan rincian dan retry hanya target yang gagal; setelah batas retry, job menjadi `failed` dengan hasil parsial tetap tersedia.
5. Finalisasi atau jadwalkan retry sesuai aturan antrean, lalu lepaskan slot secara atomik setelah eksekusi dipastikan berhenti.

### FASE 3 — Pantau Laporan
| Sub Fitur | Deskripsi |
|---|---|
| Daftar laporan | List semua laporan milik user (lost & found), dengan status |
| Status terbaru | Realtime update via Supabase Realtime channel |
| Status antrean AI | Tampilkan status job, posisi antrean untuk job yang siap, jadwal retry jika ada, waktu mulai, dan kegagalan yang dapat dipahami pengguna |
| Beri tahu kecocokan | Notifikasi push/in-app saat ada baris baru di `matches` yang relevan dengan laporan user |

Job matching semantik (cron/edge function terjadwal, mis. tiap 15 menit):
- Bandingkan `embedding` di `lost_reports` (status aktif) vs `found_reports` (status aktif) menggunakan cosine similarity (`<->` operator pgvector).
- Jika `confidence_score >= 0.8` → insert ke `matches` (`match_source='ai_semantic'`) dan buat notifikasi ke kedua user.
- Hasil dari OpenClaw (`social_search_jobs.result_data`) yang mengindikasikan kecocokan kuat juga dapat memicu insert ke `matches` (`match_source='openclaw_social'`).

### FASE 4 — Akun Saya
| Sub Fitur | Deskripsi |
|---|---|
| Daftar akun | Registrasi via Supabase Auth (email/OTP atau Google OAuth) |
| Masuk & keluar | Login/logout standar Supabase Auth |
| Atur kontak | Edit profil: nama, no. HP, foto profil (tabel `profiles`) |

---

## 9. Kontrak API antara n8n ↔ OpenClaw (usulan)

**Request — Search Job**
```json
POST /openclaw/search
{
  "job_id": "uuid",
  "attempt_id": "uuid",
  "idempotency_key": "job_id",
  "keywords": ["dompet", "coklat", "kulit"],
  "city": "Bandung",
  "target_accounts": ["infobdg", "bandunghits"],
  "callback_url": "https://n8n.domain.com/webhook/search-result"
}
```

**Request — DM Blast Job**
```json
POST /openclaw/dm-blast
{
  "job_id": "uuid",
  "attempt_id": "uuid",
  "idempotency_key": "job_id",
  "description": "Ditemukan dompet coklat di area Dago",
  "image_url": "https://.../found-items/xxx.jpg",
  "target_accounts": ["infobdg", "bandunghits"],
  "callback_url": "https://n8n.domain.com/webhook/dm-result"
}
```

**Callback dari OpenClaw ke n8n**
```json
{
  "job_id": "uuid",
  "attempt_id": "uuid",
  "status": "success",
  "results": [
    { "account": "infobdg", "action": "post_found | dm_sent", "url_or_ref": "...", "matched_confidence": 0.72 }
  ]
}
```

**Ketentuan kontrak antrean:** Respons penerimaan request (mis. HTTP 202) hanya berarti job diterima, bukan selesai. Callback harus diautentikasi dan membawa `job_id` serta `attempt_id` yang sesuai dengan slot aktif. OpenClaw atau adapter integrasinya harus menyediakan pemeriksaan status eksekusi dan pembatalan dengan konfirmasi berhenti untuk pemulihan timeout. Dukungan idempotensi harus mencegah duplikasi eksekusi/DM saat request diulang, tetapi tetap mengizinkan retry eksplisit atas percobaan yang telah berhenti. Kemampuan ini perlu diverifikasi sebelum integrasi dianggap siap produksi; jika status eksekusi tidak dapat dipastikan, slot tetap ditahan.

---

## 10. Non-Functional Requirements

- **Keamanan:** Semua akses Supabase dari n8n memakai *service role key* yang disimpan sebagai credential terenkripsi di n8n, tidak pernah diekspos ke frontend. RLS wajib aktif di semua tabel publik.
- **Privasi data:** Foto & deskripsi barang temuan bisa memuat data pribadi (KTP, dsb.) — perlu validasi/blur otomatis sebelum disebar ke Instagram (catatan untuk fase lanjut: content moderation step di n8n sebelum kirim ke OpenClaw).
- **Rate limiting:** OpenClaw/DM ke Instagram harus mematuhi rate limit platform agar akun tidak diblokir — n8n mengatur *queue* & delay antar job.
- **Antrean & konkurensi:** Search job dan DM blast job disimpan persisten di Supabase dan dieksekusi asinkron melalui n8n dengan batas global **1 job OpenClaw aktif**. Penambahan dispatcher tidak boleh meningkatkan konkurensi agent; submit frontend tetap tidak menunggu eksekusi AI.
- **Pemulihan & idempotensi:** Retry terbatas, callback tervalidasi, serta pemulihan timeout/restart wajib mengikuti aturan antrean di Bagian 6.1.
- **Observability:** Setiap job tercatat di `social_search_jobs` dengan `n8n_execution_id` untuk audit trail.

---

## 11. Roadmap Implementasi

| Sprint | Scope |
|---|---|
| Sprint 1 | Setup Supabase schema + RLS, tabel antrean + slot worker, Auth, Frontend skeleton (Fase 4: Akun Saya) |
| Sprint 2 | Fase 2: Form Lapor Kehilangan & Lapor Penemuan + upload storage + enqueue atomik + tampilan status menunggu |
| Sprint 3 | Dispatcher FIFO satu job aktif, integrasi n8n ↔ OpenClaw (search & dm-blast), callback, retry, timeout, dan pemulihan restart |
| Sprint 4 | Fase 1: Fitur pencarian internal (full-text + semantic) |
| Sprint 5 | Fase 3: Dashboard pantau laporan + matching engine + notifikasi realtime |
| Sprint 6 | QA termasuk submit serentak/duplikasi callback/restart worker, rate-limit tuning, content moderation, deploy production |

---

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Instagram memblokir aktivitas otomatis (scraping/DM) | Batasi jumlah request per jam, gunakan akun resmi/API resmi bila tersedia, monitor error rate dari OpenClaw |
| False positive matching | Set threshold confidence tinggi + minta konfirmasi manual user sebelum status "ditemukan" final |
| Data pribadi tersebar tanpa izin | Tambahkan consent checkbox saat submit laporan + review sebelum broadcast |
| Ketergantungan pada layanan pihak ketiga (OpenClaw) | Desain n8n workflow dengan retry & fallback status `failed` yang jelas ke user |
| Antrean menumpuk karena pemrosesan satu per satu | Tampilkan posisi antrean, pantau panjang antrean dan durasi job; perubahan konkurensi memerlukan keputusan produk terpisah |
| Job macet atau callback hilang | Periksa status eksekusi dan hentikan dengan konfirmasi sebelum melepas slot; jangan menjalankan job baru saat job lama belum pasti berhenti |

---

## 13. Lampiran: Struktur Folder Proyek (usulan)

```
/apps
  /web (Next.js)
    /app
    /components
    /lib/supabase.ts
/n8n-workflows
  queue-dispatcher.json
  queue-recovery.json
  search-job.json
  dm-blast-job.json
  matching-cron.json
/supabase
  /migrations
  /functions (edge functions: embedding generator, matching cron)
```
