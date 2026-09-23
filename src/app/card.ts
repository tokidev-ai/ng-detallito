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

/** Código de gift card: `1234-AB5`. Sin I/O/O/0/1 para que se dicte sin dudas.
 *  ponytail: aleatorio, sin garantía de unicidad. Con ~10^6 combinaciones y
 *  pocas cartas por comercio, choque improbable; si crece, verificar antes de escribir. */
export function newCode(rnd = Math.random): string {
  const d = () => Math.floor(rnd() * 10);
  const L = () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(rnd() * 24)];
  return `${d()}${d()}${d()}${d()}-${L()}${L()}${d()}`;
}

/** Vence a N meses de la emisión, en ISO `yyyy-mm-dd`. */
export function expiryFrom(months: number, from = new Date()): string {
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() + months);  // todo en UTC, igual que toISOString
  return d.toISOString().slice(0, 10);
}
