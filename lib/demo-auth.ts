import type { Profile } from './demo';

// Local prototype only. This is not a server-side authentication boundary.
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type Account = { id: string; profile: Profile; salt: string; passwordHash: string };
export type DemoSession = { id: string; profile: Profile };
const ACCOUNTS_KEY = 'temu-demo-accounts-v2';
const SESSION_KEY = 'temu-demo-session-v2';
const SESSION_DURATION = 12 * 60 * 60 * 1000;

export const accountDataKey = (id: string) => `temu-demo-data-v2:${id}`;
const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function passwordHash(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100_000, hash: 'SHA-256' }, key, 256);
  return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('');
}

export class DemoAuth {
  private accountsStore: Store;
  private sessionStore: Store;
  constructor(accountsStore: Store, sessionStore: Store) {
    this.accountsStore = accountsStore;
    this.sessionStore = sessionStore;
  }

  private accounts(): Account[] {
    const raw = this.accountsStore.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || value.some(account => !account?.id || !account?.profile?.email || !account?.salt || !account?.passwordHash)) {
      throw new Error('Data akun demo tidak dapat dibaca. Coba gunakan browser lain.');
    }
    return value;
  }

  private startSession(account: Account): DemoSession {
    this.sessionStore.setItem(SESSION_KEY, JSON.stringify({ id: account.id, expiresAt: Date.now() + SESSION_DURATION }));
    return { id: account.id, profile: account.profile };
  }

  getSession(): DemoSession | null {
    const raw = this.sessionStore.getItem(SESSION_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (typeof saved?.expiresAt !== 'number' || saved.expiresAt <= Date.now()) {
      this.logout(); return null;
    }
    const account = this.accounts().find(account => account.id === saved.id);
    return account ? { id: account.id, profile: account.profile } : null;
  }

  async signup(profile: Profile, password: string): Promise<DemoSession> {
    const email = normalizeEmail(profile.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Masukkan alamat email yang valid.');
    if (profile.name.trim().length < 2) throw new Error('Isi nama minimal 2 karakter.');
    if (password.length < 8 || password.length > 128) throw new Error('Gunakan kata sandi sepanjang 8–128 karakter.');
    const accounts = this.accounts();
    if (accounts.some(account => account.profile.email === email)) throw new Error('Email sudah terdaftar di demo ini. Silakan masuk.');
    const salt = crypto.randomUUID();
    const account: Account = { id: crypto.randomUUID(), profile: { ...profile, name: profile.name.trim(), email }, salt, passwordHash: await passwordHash(password, salt) };
    this.accountsStore.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
    return this.startSession(account);
  }

  async login(email: string, password: string): Promise<DemoSession> {
    const account = this.accounts().find(account => account.profile.email === normalizeEmail(email));
    if (!account || await passwordHash(password, account.salt) !== account.passwordHash) {
      throw new Error('Email atau kata sandi salah. Jika belum punya akun, daftar terlebih dahulu.');
    }
    return this.startSession(account);
  }

  updateProfile(profile: Profile): DemoSession {
    const session = this.getSession();
    if (!session) throw new Error('Sesi sudah berakhir. Silakan masuk kembali.');
    const nextProfile = { ...profile, email: session.profile.email };
    this.accountsStore.setItem(ACCOUNTS_KEY, JSON.stringify(this.accounts().map(account => account.id === session.id ? { ...account, profile: nextProfile } : account)));
    return { id: session.id, profile: nextProfile };
  }

  logout() { this.sessionStore.removeItem(SESSION_KEY); }
}

export function getDemoAuth() { return new DemoAuth(localStorage, sessionStorage); }
