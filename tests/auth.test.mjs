import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoAuth, accountDataKey } from '../lib/demo-auth.ts';
import { isServiceArea, serviceAreas, items, initialReports, localAccounts } from '../lib/demo.ts';

const memoryStore = () => {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
};
const profile = { name: 'Penguji Temu', email: 'uji@example.com', phone: '', city: 'Cimahi Tengah' };
const password = 'contoh-temu-2026';

test('fresh and legacy auto-login data cannot create an authenticated session', () => {
  const local = memoryStore();
  local.setItem('temu-demo-v1', JSON.stringify({ signedIn: true, profile }));
  assert.equal(new DemoAuth(local, memoryStore()).getSession(), null);
});

test('signup normalizes email, stores a hash, rejects duplicate accounts and wrong passwords', async () => {
  const local = memoryStore(), session = memoryStore(), auth = new DemoAuth(local, session);
  const user = await auth.signup({ ...profile, email: ' UJI@EXAMPLE.COM ' }, password);
  assert.equal(user.profile.email, 'uji@example.com');
  assert.equal(local.getItem('temu-demo-accounts-v2').includes(password), false);
  assert.equal(session.getItem('temu-demo-session-v2').includes(password), false);
  await assert.rejects(() => auth.signup(profile, password), /sudah terdaftar/);
  auth.logout();
  await assert.rejects(() => auth.login(profile.email, 'salah'), /Email atau kata sandi salah/);
  assert.equal(auth.getSession(), null);
  assert.equal((await auth.login(' UJI@EXAMPLE.COM ', password)).id, user.id);
});

test('session survives reload in the same tab, ends on logout and cannot revive from old report data', async () => {
  const local = memoryStore(), session = memoryStore(), auth = new DemoAuth(local, session);
  const user = await auth.signup(profile, password);
  assert.equal(new DemoAuth(local, session).getSession().id, user.id);
  assert.equal(new DemoAuth(local, memoryStore()).getSession(), null);
  local.setItem(accountDataKey(user.id), JSON.stringify({ reports: [{ title: 'Dompet' }] }));
  auth.logout();
  assert.equal(new DemoAuth(local, session).getSession(), null);
  assert.ok(local.getItem(accountDataKey(user.id)));
});

test('accounts have isolated report keys and profile updates survive login', async () => {
  const local = memoryStore(), auth = new DemoAuth(local, memoryStore());
  const first = await auth.signup(profile, password);
  local.setItem(accountDataKey(first.id), 'laporan akun pertama');
  auth.updateProfile({ ...profile, name: 'Nama Baru', email: 'change@example.com', city: 'Ngamprah' });
  auth.logout();
  const second = await auth.signup({ ...profile, email: 'kedua@example.com' }, password);
  assert.notEqual(accountDataKey(first.id), accountDataKey(second.id));
  assert.equal(local.getItem(accountDataKey(second.id)), null);
  auth.logout();
  const restored = await auth.login(profile.email, password);
  assert.equal(restored.profile.name, 'Nama Baru');
  assert.equal(restored.profile.city, 'Ngamprah');
  assert.equal(restored.profile.email, profile.email);
});

test('expired or missing-account sessions fail closed', async () => {
  const local = memoryStore(), session = memoryStore(), auth = new DemoAuth(local, session);
  const user = await auth.signup(profile, password);
  session.setItem('temu-demo-session-v2', JSON.stringify({ id: user.id, expiresAt: 1 }));
  assert.equal(auth.getSession(), null);
  assert.equal(session.getItem('temu-demo-session-v2'), null);
  session.setItem('temu-demo-session-v2', JSON.stringify({ id: 'missing', expiresAt: Date.now() + 10000 }));
  assert.equal(auth.getSession(), null);
});

test('failed storage and invalid signup do not authenticate the user', async () => {
  const session = memoryStore();
  const blocked = { ...memoryStore(), setItem() { throw new Error('Storage unavailable'); } };
  const auth = new DemoAuth(blocked, session);
  await assert.rejects(() => auth.signup(profile, password), /Storage unavailable/);
  assert.equal(auth.getSession(), null);
  await assert.rejects(() => auth.signup(profile, 'short'), /8–128/);
});

test('every catalog item, sample report, and selectable account stays in the agreed service area', () => {
  assert.deepEqual(serviceAreas, ['Cimahi Utara', 'Cimahi Tengah', 'Cimahi Selatan', 'Padalarang', 'Batujajar', 'Ngamprah']);
  assert.ok([...items, ...initialReports].every(item => isServiceArea(item.city)));
  for (const area of serviceAreas) assert.ok(localAccounts[area].length);
  for (const outside of ['Jakarta', 'Surabaya', 'Bandung', 'Semua wilayah', '']) assert.equal(isServiceArea(outside), false);
});
