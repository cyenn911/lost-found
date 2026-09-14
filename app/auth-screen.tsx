'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, HeartHandshake, LoaderCircle, MapPin } from 'lucide-react';
import { cities } from '@/lib/demo';

export type AuthInput = { mode: 'login' | 'signup'; name: string; email: string; password: string; city: string };

export default function AuthScreen({ onAuthenticate, notice = '' }: {
  onAuthenticate: (input: AuthInput) => Promise<void>;
  notice?: string;
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function switchMode(next: 'login' | 'signup') {
    setMode(next); setError(''); setShowPassword(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password') || '');
    const name = String(data.get('name') || '').trim();
    if (mode === 'signup' && name.length < 2) { setError('Isi nama minimal 2 karakter.'); return; }
    if (mode === 'signup' && password !== data.get('confirmPassword')) { setError('Konfirmasi kata sandi belum cocok.'); return; }
    setBusy(true);
    try {
      await onAuthenticate({ mode, name, email: String(data.get('email') || '').trim().toLowerCase(), password, city: String(data.get('city') || cities[1]) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Belum berhasil masuk. Silakan coba lagi.');
    } finally { setBusy(false); }
  }

  return <div className="auth-page">
    <section className="auth-story" aria-label="Temu untuk Cimahi dan sekitarnya">
      <img src="/images/park.jpg" alt="Suasana taman dengan bangku di bawah pepohonan" className="auth-landscape" />
      <span className="brand auth-brand">temu<span className="brand-dot">.</span></span>
      <div className="auth-story-copy"><span className="auth-region"><MapPin size={15} /> Cimahi & sekitarnya</span><h1>Dekat tempatnya.<br />Dekat orangnya.</h1><p>Barang yang tertinggal, kebaikan yang ditemukan.<br />Mari bantu barang menemukan jalan pulang.</p></div>
      <div className="auth-story-footer"><HeartHandshake size={20} /><span>Saling bantu, mulai dari sekitar kita.</span></div>
    </section>
    <main className="auth-main" id="auth-content">
      <div className="auth-form-wrap">
        <span className="section-index">KOMUNITAS TEMU</span>
        <h2>{mode === 'login' ? 'Selamat datang kembali.' : 'Mulai dari satu kebaikan.'}</h2>
        <p className="auth-description">{mode === 'login' ? 'Masuk untuk mencari barang dan mengirim laporan di Cimahi dan sekitarnya.' : 'Buat akun untuk melaporkan kehilangan atau membantu mengembalikan barang temuan.'}</p>
        <div className="auth-mode" role="group" aria-label="Pilih masuk atau daftar"><button type="button" aria-pressed={mode === 'login'} onClick={() => switchMode('login')} disabled={busy}>Masuk</button><button type="button" aria-pressed={mode === 'signup'} onClick={() => switchMode('signup')} disabled={busy}>Daftar akun</button></div>
        <form key={mode} className="auth-form" onSubmit={submit} aria-busy={busy}>
          <fieldset disabled={busy}>
            {mode === 'signup' && <label>Nama lengkap<input name="name" autoComplete="name" placeholder="Nama kamu" required minLength={2} maxLength={60} /></label>}
            <label>Email<input name="email" type="email" autoComplete="username" placeholder="nama@email.com" required maxLength={254} autoCapitalize="none" spellCheck={false} /></label>
            {mode === 'signup' && <label>Wilayah<select name="city" defaultValue={cities[1]}>{cities.slice(1).map(city => <option key={city}>{city}</option>)}</select></label>}
            <label>Kata sandi<div className="password-field"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? 'Minimal 8 karakter' : 'Masukkan kata sandi'} minLength={mode === 'signup' ? 8 : undefined} maxLength={128} required /><button type="button" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            {mode === 'signup' && <label>Konfirmasi kata sandi<input name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Ulangi kata sandi" required minLength={8} maxLength={128} /></label>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="button primary auth-submit" type="submit">{busy ? 'Mohon tunggu…' : mode === 'login' ? 'Masuk ke Temu' : 'Buat akun'}{busy ? <LoaderCircle size={18} className="spin" /> : <ArrowRight size={18} />}</button>
          </fieldset>
        </form>
        <p className="auth-switch">{mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'} <button type="button" disabled={busy} onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Daftar sekarang' : 'Masuk di sini'}</button></p>
        {notice && <p className="auth-notice">{notice}</p>}
      </div>
      <footer className="auth-footer"><span>© 2026 Temu</span><span>Cimahi & sekitarnya</span></footer>
    </main>
  </div>;
}
