/**
 * Siembra dos comercios de demo en Firestore, con vos como owner.
 *
 *   npm run seed                 → usa el único usuario que exista
 *   npm run seed -- <uid>        → usa ese uid
 *
 * Sin service account: saca el uid del `firebase` CLI y escribe por REST con el
 * token de `gcloud`, los dos ya logueados. No hay claves en disco.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROJECT = 'giftcards-bo';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();

// ── quién es el owner ──────────────────────────────────────────────────────
function resolveOwner(argUid) {
  const out = join(mkdtempSync(join(tmpdir(), 'seed-')), 'users.json');
  sh('npx', ['firebase-tools', 'auth:export', out, '--format=json', '--project', PROJECT]);
  const users = JSON.parse(readFileSync(out, 'utf8')).users ?? [];

  if (!users.length) {
    console.error('\nNo hay ningún usuario todavía.');
    console.error('Entrá una vez en https://giftcards-bo.web.app/login y volvé a correr esto.\n');
    process.exit(1);
  }
  if (argUid) {
    const u = users.find(x => x.localId === argUid || x.email === argUid);
    if (!u) { console.error(`No encontré "${argUid}". Hay: ${users.map(x => x.email).join(', ')}`); process.exit(1); }
    return { uid: u.localId, email: u.email ?? u.localId };
  }
  if (users.length > 1) {
    console.error(`Hay ${users.length} usuarios. Decí cuál: npm run seed -- <uid|email>`);
    users.forEach(u => console.error(`  ${u.localId}  ${u.email}`));
    process.exit(1);
  }
  return { uid: users[0].localId, email: users[0].email ?? users[0].localId };
}

// ── JS → el JSON tipado que quiere la REST de Firestore ────────────────────
function encode(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encode) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, encode(x)])) } };
}

const token = sh('gcloud', ['auth', 'print-access-token']);

async function put(path, data) {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-goog-user-project': PROJECT,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: encode(data).mapValue.fields }),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
}

// ── datos ──────────────────────────────────────────────────────────────────
const ALL_PERMS = {
  redeem: true, viewCards: true, viewSales: true,
  manageProducts: true, manageBranding: true, manageStaff: true,
};

const TENANTS = [
  {
    id: 'spa-aurora',
    business: {
      name: 'Spa Aurora', slug: 'spa-aurora',
      description: 'Masajes, faciales y estética en Sopocachi.',
      logoUrl: null, color: '#3b7d6e', published: true, validityMonths: 12,
      terms: 'No reembolsable. Válida en Sopocachi. Presentar código al momento de la atención.',
      bank: { bank: 'BNB', account: '10-2345678', holder: 'Ana Rocha', nit: '4821993015' },
    },
    soldThisMonth: 2000,
    monthly: [[900, 400], [1400, 620], [1200, 780], [1900, 1050], [1750, 1200], [2000, 1150]],
    products: [
      { kind: 'fixed', name: 'Gift card Bs 150', amount: 150 },
      { kind: 'fixed', name: 'Gift card Bs 250', amount: 250 },
      { kind: 'fixed', name: 'Gift card Bs 400', amount: 400 },
      { kind: 'service', name: "Masaje relajante 60'", amount: 180 },
      { kind: 'open', name: 'Monto abierto', min: 100, max: 1000 },
    ],
    cards: [
      { code: '4821-KQ7', to: 'Ana Quispe', value: 250, balance: 60, status: 'parcial', expires: '14/11/26' },
      { code: '9013-MB2', to: 'Diego R.', value: 400, balance: 400, status: 'activa', expires: '02/12/26' },
      { code: '5577-TX9', to: 'Marta L.', value: 150, balance: 0, status: 'canjeada', expires: '19/10/26' },
      { code: '1204-JD4', to: 'Sofía V.', value: 250, balance: 250, status: 'activa', expires: '30/01/27' },
      { code: '7788-PL1', to: 'Iván C.', value: 200, balance: 200, status: 'vencida', expires: '08/09/26' },
      { code: '3391-WQ8', to: 'Elena M.', value: 300, balance: 300, status: 'pagada', expires: '22/02/27' },
    ],
    redemptions: [
      { by: 'Luis', code: '4821-KQ7', amount: 120, at: '11/09 14:22' },
      { by: 'Luis', code: '5577-TX9', amount: 150, at: '10/09 18:05' },
      { by: 'Ana', code: '2210-RF5', amount: 80, at: '09/09 11:40' },
      { by: 'Luis', code: '6654-HH3', amount: 250, at: '08/09 16:12' },
      { by: 'Ana', code: '8890-KP2', amount: 60, at: '06/09 09:55' },
      { by: 'Luis', code: '4402-ZQ6', amount: 190, at: '04/09 13:30' },
    ],
    extraStaff: [
      { email: 'luis@spaaurora.bo', role: 'staff', lastSeen: '11/09',
        perms: { ...ALL_PERMS, viewSales: false, manageBranding: false, manageStaff: false } },
    ],
  },
  {
    id: 'barberia-nor',
    business: {
      name: 'Barbería Nor', slug: 'barberia-nor',
      description: 'Cortes clásicos y barba en Miraflores.',
      logoUrl: null, color: '#a94434', published: true, validityMonths: 6,
      terms: 'Válida solo en el local de Miraflores. No acumulable con promociones.',
      bank: { bank: 'BCP', account: '4-9911203', holder: 'Rodrigo Nor', nit: '3391882204' },
    },
    soldThisMonth: 1650,
    monthly: [[600, 300], [820, 410], [900, 520], [1100, 700], [1400, 880], [1650, 980]],
    products: [
      { kind: 'fixed', name: 'Gift card Bs 80', amount: 80 },
      { kind: 'service', name: 'Corte + barba', amount: 120 },
    ],
    cards: [
      { code: '6120-AA3', to: 'Pablo M.', value: 120, balance: 120, status: 'activa', expires: '03/03/27' },
      { code: '7742-BQ1', to: 'Ruth S.', value: 80, balance: 0, status: 'canjeada', expires: '12/12/26' },
    ],
    redemptions: [{ by: 'Rodrigo', code: '7742-BQ1', amount: 80, at: '07/09 10:15' }],
    extraStaff: [],
  },
];

// ── siembra ────────────────────────────────────────────────────────────────
const owner = resolveOwner(process.argv[2]);
console.log(`Sembrando como ${owner.email} (${owner.uid})`);

for (const t of TENANTS) {
  await put(`tenants/${t.id}`, {
    business: t.business,
    ownerUid: owner.uid,
    memberUids: [owner.uid],
    soldThisMonth: t.soldThisMonth,
    // Firestore no acepta arrays anidados: cada mes va como {sold, redeemed}
    monthly: t.monthly.map(([sold, redeemed]) => ({ sold, redeemed })),
  });

  await put(`tenants/${t.id}/staff/${owner.email}`,
    { email: owner.email, role: 'owner', lastSeen: 'hoy', perms: ALL_PERMS });
  for (const m of t.extraStaff) await put(`tenants/${t.id}/staff/${m.email}`, m);
  for (const [i, p] of t.products.entries()) await put(`tenants/${t.id}/products/p${i + 1}`, p);
  for (const c of t.cards) await put(`tenants/${t.id}/cards/${c.code}`, c);
  for (const [i, r] of t.redemptions.entries()) await put(`tenants/${t.id}/redemptions/r${i + 1}`, r);

  console.log(`  ✓ ${t.business.name} — ${t.products.length} productos, ${t.cards.length} gift cards`);
}

console.log('\nListo. https://giftcards-bo.web.app/app\n');
