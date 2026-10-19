/**
 * Las Firestore Rules son toda la seguridad de la app (no hay backend). Esto prueba
 * los casos que importan contra el emulador: `npm run test:rules`.
 */
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const ALL = { redeem: true, viewCards: true, viewSales: true, manageProducts: true, manageBranding: true, manageStaff: true };
const NONE = Object.fromEntries(Object.keys(ALL).map(k => [k, false]));
const OWNER = 'duena@x.com', CAJERO = 'cajero@x.com', DISENO = 'diseno@x.com';

let env;
const as = (uid, email, verified = true) => env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const card = (extra = {}) => ({ code: 'AAAA-BBBB', to: 'Ana', value: 100, balance: 100, expires: '2027-01-01', soldAt: 'x', channel: 'qr', ...extra });

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-gkb',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
after(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'tenants/t1'), { ownerUid: 'owner', memberEmails: [OWNER, CAJERO, DISENO], bank: { account: '111' } });
    await setDoc(doc(db, 'pages/t1'), { business: { name: 'Spa', slug: 't1', published: true, suggestedAmounts: [100, 200] } });
    await setDoc(doc(db, 'tenants/t1/staff', OWNER), { email: OWNER, role: 'owner', perms: ALL });
    await setDoc(doc(db, 'tenants/t1/staff', CAJERO), { email: CAJERO, role: 'staff', perms: { ...NONE, redeem: true } });
    await setDoc(doc(db, 'tenants/t1/staff', DISENO), { email: DISENO, role: 'staff', perms: { ...NONE, manageBranding: true } });
    await setDoc(doc(db, 'tenants/t1/cards/C1'), card({ code: 'C1' }));
  });
});

test('lo privado no se ve desde afuera; la página sí', async () => {
  await assertFails(getDoc(doc(anon(), 'tenants/t1')));
  await assertFails(getDoc(doc(as('x', 'otro@x.com'), 'tenants/t1')));
  await assertSucceeds(getDoc(doc(anon(), 'pages/t1')));
  await assertSucceeds(getDoc(doc(anon(), 'pages/libre')));  // el wizard pregunta si un link está libre
});

test('la cuenta bancaria solo la cambia el dueño', async () => {
  await assertFails(updateDoc(doc(as('u2', DISENO), 'tenants/t1'), { 'bank.account': '999' }));
  await assertFails(updateDoc(doc(as('u3', CAJERO), 'tenants/t1'), { 'bank.account': '999' }));
  await assertSucceeds(updateDoc(doc(as('owner', OWNER), 'tenants/t1'), { 'bank.account': '999' }));
});

test('la página la edita quien tiene el permiso, no cualquier empleado', async () => {
  await assertSucceeds(updateDoc(doc(as('u2', DISENO), 'pages/t1'), { 'business.name': 'Spa 2' }));
  await assertFails(updateDoc(doc(as('u3', CAJERO), 'pages/t1'), { 'business.name': 'Hack' }));
  await assertFails(updateDoc(doc(as('u2', DISENO), 'pages/t1'), { 'business.slug': 'otro' }));
});

test('el cajero solo baja saldos; no emite ni sube saldo', async () => {
  const db = as('u3', CAJERO);
  await assertSucceeds(updateDoc(doc(db, 'tenants/t1/cards/C1'), { balance: 40 }));
  await assertFails(updateDoc(doc(db, 'tenants/t1/cards/C1'), { balance: 500 }));
  await assertFails(updateDoc(doc(db, 'tenants/t1/cards/C1'), { balance: 30, value: 30 }));
  await assertFails(setDoc(doc(db, 'tenants/t1/cards/C9'), card({ code: 'C9', channel: 'panel' })));
});

test('compra pública: solo montos del comercio y campos conocidos', async () => {
  const db = anon();
  await assertSucceeds(setDoc(doc(db, 'tenants/t1/cards/AAAA-BBBB'), card()));
  await assertFails(setDoc(doc(db, 'tenants/t1/cards/AAAA-CCCC'), card({ code: 'AAAA-CCCC', value: 5000, balance: 5000 })));
  await assertFails(setDoc(doc(db, 'tenants/t1/cards/AAAA-DDDD'), card({ code: 'AAAA-DDDD', admin: true })));
  await assertFails(setDoc(doc(db, 'tenants/t1/cards/C1'), card({ code: 'C1' })));  // pisar una existente
});

test('un correo sin verificar no entra al comercio', async () => {
  await assertFails(getDoc(doc(as('x', OWNER, false), 'tenants/t1')));
  await assertSucceeds(getDoc(doc(as('owner', OWNER), 'tenants/t1')));
});

test('un empleado no se vuelve dueño ni toca al dueño', async () => {
  await env.withSecurityRulesDisabled(ctx =>
    updateDoc(doc(ctx.firestore(), 'tenants/t1/staff', CAJERO), { 'perms.manageStaff': true }));
  const db = as('u3', CAJERO);
  await assertFails(setDoc(doc(db, 'tenants/t1/staff', CAJERO), { email: CAJERO, role: 'owner', perms: ALL }));
  await assertFails(updateDoc(doc(db, 'tenants/t1/staff', OWNER), { role: 'staff' }));
  await assertFails(updateDoc(doc(db, 'tenants/t1'), { memberEmails: [CAJERO, DISENO] }));
});
