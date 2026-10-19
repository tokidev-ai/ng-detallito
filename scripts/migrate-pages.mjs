/**
 * Migración única: separa lo público de lo privado de cada comercio.
 *   antes: tenants/{id} = { business (con bank), memberEmails, …, soldThisMonth, monthly }
 *   ahora: pages/{id}   = { business (sin bank) }        ← lo ve cualquiera
 *          tenants/{id} = { bank, memberEmails, ownerUid, commissionRate? }
 *
 * En dos pasos, para que la app vieja siga andando hasta que despliegue la nueva:
 *   node scripts/migrate-pages.mjs           copia (no borra nada)  → antes del deploy
 *   node scripts/migrate-pages.mjs --clean   borra lo viejo         → después del deploy
 * Dev: GKB_PROJECT=giftcards-bo-dev node scripts/migrate-pages.mjs
 * Usa el token de `gcloud` (logueado como dueño del proyecto). Se puede repetir.
 */
import { execFileSync } from 'node:child_process';

const PROJECT = process.env.GKB_PROJECT ?? 'giftcards-bo';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
const headers = { Authorization: `Bearer ${token}`, 'x-goog-user-project': PROJECT, 'Content-Type': 'application/json' };
const clean = process.argv.includes('--clean');

/** PATCH con updateMask: solo toca esos campos; los que están en la máscara pero
 *  no en `fields` se borran. */
async function patch(path, fields, mask) {
  const q = mask.map(f => `updateMask.fieldPaths=${f}`).join('&');
  const res = await fetch(`${BASE}/${path}?${q}`, { method: 'PATCH', headers, body: JSON.stringify({ fields }) });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
}

const res = await fetch(`${BASE}/tenants?pageSize=300`, { headers });
if (!res.ok) throw new Error(`tenants: ${res.status} ${await res.text()}`);
const { documents = [] } = await res.json();
console.log(`${PROJECT}: ${documents.length} comercios — ${clean ? 'limpiando lo viejo' : 'copiando'}`);

for (const d of documents) {
  const id = d.name.split('/').pop();
  const business = d.fields.business?.mapValue?.fields;

  if (clean) {
    if (!business && !d.fields.soldThisMonth && !d.fields.monthly) { console.log(`  · ${id}: ya limpio`); continue; }
    await patch(`tenants/${id}`, {}, ['business', 'soldThisMonth', 'monthly']);
    console.log(`  ✓ ${id}: sin business/soldThisMonth/monthly`);
    continue;
  }

  if (!business) { console.log(`  · ${id}: sin business (ya migrado)`); continue; }
  const { bank, ...pub } = business;
  await patch(`pages/${id}`, { business: { mapValue: { fields: pub } } }, ['business']);
  if (bank) await patch(`tenants/${id}`, { bank }, ['bank']);
  console.log(`  ✓ ${id}: página copiada${bank ? ' + cuenta bancaria' : ''}`);
}
