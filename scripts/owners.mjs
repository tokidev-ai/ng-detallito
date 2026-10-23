/**
 * Cupo de comercios por persona (`owners/{uid}` = { count, max? }).
 *
 *   node scripts/owners.mjs                    recuenta: count = comercios que creó cada uid
 *   node scripts/owners.mjs ana@mail.com 5     le sube el tope a 5 (por defecto 3)
 *
 * Dev: GKB_PROJECT=giftcards-bo-dev node scripts/owners.mjs …
 * Usa el token de `gcloud` (dueño del proyecto). El recuento se puede repetir.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROJECT = process.env.GKB_PROJECT ?? 'giftcards-bo';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
const headers = { Authorization: `Bearer ${token}`, 'x-goog-user-project': PROJECT, 'Content-Type': 'application/json' };

async function patch(path, fields) {
  const q = Object.keys(fields).map(f => `updateMask.fieldPaths=${f}`).join('&');
  const res = await fetch(`${BASE}/${path}?${q}`, { method: 'PATCH', headers, body: JSON.stringify({ fields }) });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
}

const [who, max] = process.argv.slice(2);

if (who) {
  if (!(+max >= 0)) { console.error('Uso: node scripts/owners.mjs <email|uid> <tope>'); process.exit(1); }
  const out = join(mkdtempSync(join(tmpdir(), 'ow-')), 'users.json');
  execFileSync('npx', ['firebase-tools', 'auth:export', out, '--format=json', '--project', PROJECT]);
  const u = (JSON.parse(readFileSync(out, 'utf8')).users ?? []).find(x => x.email === who || x.localId === who);
  if (!u) { console.error(`No encontré "${who}" en ${PROJECT}: tiene que haber entrado una vez.`); process.exit(1); }
  await patch(`owners/${u.localId}`, { max: { integerValue: String(+max) } });
  console.log(`${PROJECT}: ${who} puede tener hasta ${+max} comercios`);
} else {
  const res = await fetch(`${BASE}/tenants?pageSize=1000`, { headers });
  if (!res.ok) throw new Error(`tenants: ${res.status} ${await res.text()}`);
  const counts = {};
  for (const d of (await res.json()).documents ?? []) {
    const uid = d.fields.ownerUid?.stringValue;
    if (uid) counts[uid] = (counts[uid] ?? 0) + 1;
  }
  for (const [uid, n] of Object.entries(counts)) {
    await patch(`owners/${uid}`, { count: { integerValue: String(n) } });
    console.log(`  ✓ ${uid}: ${n}`);
  }
  console.log(`${PROJECT}: ${Object.keys(counts).length} dueños recontados`);
}
