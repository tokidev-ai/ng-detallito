import { Component, Pipe, PipeTransform, input } from '@angular/core';
import { CardStatus } from './data';

/** Texto legible sobre un color de marca arbitrario, sin librería: luminancia relativa.
 *  ponytail: umbral fijo en 0.45, afinado a ojo. Si hace falta cumplir WCAG AA
 *  medido, esto se cambia por un cálculo de ratio de contraste real. */
export function onBrand(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return '#ffffff';
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.45 ? '#1c1b18' : '#ffffff';
}

const nf = new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 });

@Pipe({ name: 'bs' })
export class BsPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return value == null ? '—' : `Bs ${nf.format(value)}`;
  }
}

@Component({
  selector: 'app-stat',
  imports: [BsPipe],
  template: `
    <div class="rounded-box border border-base-300 bg-base-100 p-4 sm:p-5">
      <p class="text-xs uppercase tracking-wider text-base-content/50">{{ label() }}</p>
      <p class="mt-1 font-semibold tabular-nums" [class]="big() ? 'text-4xl sm:text-6xl' : 'text-2xl sm:text-3xl'">
        {{ value() | bs }}
      </p>
      @if (hint()) { <p class="mt-1 text-sm text-base-content/60">{{ hint() }}</p> }
    </div>
  `,
})
export class Stat {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly hint = input<string>('');
  readonly big = input(false);
}

const BADGE: Record<CardStatus, string> = {
  activa: 'badge-success',
  parcial: 'badge-warning',
  canjeada: 'badge-ghost',
  vencida: 'badge-error',
  pagada: 'badge-info',
};

@Component({
  selector: 'app-status',
  template: `<span class="badge badge-sm badge-soft {{ cls }}">{{ status() }}</span>`,
})
export class Status {
  readonly status = input.required<CardStatus>();
  get cls() { return BADGE[this.status()]; }
}
