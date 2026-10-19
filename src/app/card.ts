/** Lógica pura de gift cards, sin Firebase, para poder testearla suelta.
 *  El estado no se guarda: se deriva del saldo y la fecha. */

/** Estado derivado, nunca guardado. */
export type CardState = 'activa' | 'canjeada' | 'vencida';

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Saldo 0 → canjeada; si no, vencida cuando pasó su fecha, activa mientras tanto.
 *  `expires` es ISO `yyyy-mm-dd`, que ordena y compara como texto.
 *  ponytail: `hoy` en UTC; en el borde de medianoche puede errar por el huso
 *  de Bolivia (−4). Irrelevante para vigencia; si molesta, pasar a hora local. */
export function cardState(c: { balance: number; expires: string }, today = todayIso()): CardState {
  if (c.balance <= 0) return 'canjeada';
  return c.expires < today ? 'vencida' : 'activa';
}

/** Alfabeto de los códigos: sin 0/O, 1/I/L para que se dicten sin dudas. */
const CODE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** Código de gift card: `K7QM-3XPA`, 31^8 ≈ 8,5·10^11 combinaciones con azar
 *  criptográfico. El código es el secreto que abre la página pública de la carta:
 *  corto o predecible (Math.random), un bot adivinaría cartas ajenas. Los códigos
 *  viejos (`1234-AB5`) siguen valiendo: se buscan por id, no por formato. */
export function newCode(rnd = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32): string {
  const c = () => CODE_CHARS[Math.floor(rnd() * CODE_CHARS.length)];
  return `${c()}${c()}${c()}${c()}-${c()}${c()}${c()}${c()}`;
}

/** Vence a N meses de la emisión, en ISO `yyyy-mm-dd`. */
export function expiryFrom(months: number, from = new Date()): string {
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() + months);  // todo en UTC, igual que toISOString
  return d.toISOString().slice(0, 10);
}

// ── compartir la gift card ───────────────────────────────────────────────────

/** Ruta pública de una gift card: la página con diseño de marca y QR. */
export const giftPath = (slug: string, code: string) => `/${slug}/g/${code}`;

/** Mensaje que acompaña el link al mandarla por WhatsApp o correo. */
export function giftMessage(businessName: string, url: string, c: { to?: string; from?: string }): string {
  const para = c.to ? ` para ${c.to}` : '';
  const de = c.from ? `, de parte de ${c.from}` : '';
  return `¡Tienes una gift card de ${businessName}${para}${de}! 🎁\nÁbrela aquí: ${url}`;
}

export const waLink = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
export const mailtoLink = (subject: string, body: string) =>
  `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

// ── números del dashboard ────────────────────────────────────────────────────

/** Días enteros de hoy a `iso` (yyyy-mm-dd). 0 = vence hoy, negativo = ya venció. */
export function daysUntil(iso: string, today = todayIso()): number {
  return Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
}

/** Cambio porcentual de `prev` a `cur`, redondeado. null si no hay base para comparar. */
export function pctChange(cur: number, prev: number): number | null {
  if (!prev) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

/** Clave ordenable de un sello de canje `dd/mm HH:mm` → `mm/dd HH:mm`.
 *  ponytail: el sello no trae año; en enero un canje de diciembre ordena como
 *  "futuro". Guardar ISO en el canje lo arregla cuando importe. */
export const stampKey = (at: string) => `${at.slice(3, 5)}/${at.slice(0, 2)}${at.slice(5)}`;
