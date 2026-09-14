/**
 * Da o quita superadmin (nosotros, la startup).
 *
 *   npm run superadmin -- tu@mail.com          otorga
 *   npm run superadmin -- tu@mail.com --quitar revoca
 *
 * Nadie se lo puede dar a sí mismo desde la app: las reglas prohíben escribir
 * en /superadmins. Solo desde acá, con las credenciales de gcloud.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROJECT = 'giftcards-bo';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const sh = (c, a) => execFileSync(c, a, { encoding: 'utf8' }).trim();

const who = process.argv[2];
const revoke = process.argv.includes('--quitar');
if (!who) {
  console.error('Uso: npm run superadmin -- <email|uid> [--quitar]');
  process.exit(1);
}

const out = join(mkdtempSync(join(tmpdir(), 'sa-')), 'users.json');
sh('npx', ['firebase-tools', 'auth:export', out, '--format=json', '--project', PROJECT]);
const users = JSON.parse(readFileSync(out, 'utf8')).users ?? [];
const u = users.find(x => x.email === who || x.localId === who);
if (!u) {
  console.error(`No encontré "${who}". Hay: ${users.map(x => x.email).join(', ') || '(ninguno)'}`);
  process.exit(1);
}

const token = sh('gcloud', ['auth', 'print-access-token']);
const headers = { Authorization: `Bearer ${token}`, 'x-goog-user-project': PROJECT, 'Content-Type': 'application/json' };
const url = `${BASE}/superadmins/${u.localId}`;

const res = revoke
  ? await fetch(url, { method: 'DELETE', headers })
  : await fetch(url, {
      method: 'PATCH', headers,
      body: JSON.stringify({ fields: { email: { stringValue: u.email ?? '' }, since: { stringValue: new Date().toISOString() } } }),
    });

if (!res.ok) { console.error(res.status, await res.text()); process.exit(1); }
console.log(`${revoke ? 'Quitado' : 'Otorgado'} superadmin a ${u.email} (${u.localId})`);
