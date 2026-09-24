/** Libro de cobros de la plataforma: lógica pura, sin Firebase, para testearla
 *  suelta. Un "cobro" es una gift card vendida; de cada una nos quedamos con la
 *  comisión del comercio (variable, negociada con cada uno). */
import { CardState, cardState } from '../card';

/** Comisión si no se negoció otra. */
export const DEFAULT_RATE = 0.05;

export interface TenantLike {
  id: string;
  business: { name: string; slug: string; color: string; published: boolean; validityMonths: number;
              bank?: { bank: string; account: string; holder: string; nit: string } };
  memberEmails?: string[];
  commissionRate?: number;
}
export interface CardLike {
  code: string; to: string; from?: string; value: number; balance: number; expires: string;
  soldAt?: string; channel?: 'qr' | 'panel';
}

export interface Cobro {
  tenantId: string; tenant: string; color: string;
  code: string; to: string; value: number; balance: number;
  /** Fecha de venta ISO `yyyy-mm-dd`. */
  date: string;
  /** true si la fecha se dedujo del vencimiento (cartas anteriores a `soldAt`). */
  estimated: boolean;
  channel: 'qr' | 'panel' | '—';
  state: CardState;
  rate: number; fee: number; net: number;
}

export const rateOf = (t: { commissionRate?: number }) => t.commissionRate ?? DEFAULT_RATE;

/** Redondeo a centavos: la comisión rara vez da entero. */
export const cents = (n: number) => Math.round(n * 100) / 100;

/** Fecha de venta. Si la carta no la guardó, se deduce exacta: al emitirla,
 *  `expires = venta + validityMonths` (ver `expiryFrom`), así que se resta. */
export function soldDate(c: { soldAt?: string; expires: string }, validityMonths: number): string {
  if (c.soldAt) return c.soldAt.slice(0, 10);
  const d = new Date(`${c.expires}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - validityMonths);
  return d.toISOString().slice(0, 10);
}

export function toCobro(t: TenantLike, c: CardLike, today?: string): Cobro {
  const rate = rateOf(t);
  const fee = cents(c.value * rate);
  return {
    tenantId: t.id, tenant: t.business.name, color: t.business.color,
    code: c.code, to: c.to, value: c.value, balance: c.balance,
    date: soldDate(c, t.business.validityMonths), estimated: !c.soldAt,
    channel: c.channel ?? '—',
    state: cardState(c, today),
    rate, fee, net: cents(c.value - fee),
  };
}

/** Los últimos `n` meses como `yyyy-mm`, terminando en el de `today`. */
export function lastMonths(n: number, today = new Date().toISOString().slice(0, 10)): string[] {
  const [y, m] = today.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}

/** Totales de un grupo de cobros. */
export function totals(cs: Cobro[]) {
  const gross = cents(cs.reduce((s, c) => s + c.value, 0));
  const fee = cents(cs.reduce((s, c) => s + c.fee, 0));
  return { count: cs.length, gross, fee, net: cents(gross - fee) };
}

/** CSV que Excel abre bien: BOM UTF-8 (tildes), `;` como separador (Excel en
 *  español usa coma decimal) y comillas escapadas. */
export function toCsv(rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    const s = typeof v === 'number' ? String(v).replace('.', ',') : v;
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map(r => r.map(cell).join(';')).join('\n');
}
