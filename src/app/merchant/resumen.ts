import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { Store, cardState } from '../data';
import { BsPipe, FechaPipe } from '../ui';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

@Component({
  selector: 'app-resumen',
  imports: [BsPipe, FechaPipe],
  template: `
  <div class="space-y-6">

    <!-- la deuda es la cifra estrella; jerarquía por tipografía, no por cajas -->
    <section class="rounded-box border border-base-300 bg-base-100 p-5 sm:p-8">
      <p class="text-xs uppercase tracking-wider text-base-content/50">Saldo pendiente de canje · deuda</p>
      <p class="mt-1 text-5xl font-extrabold tracking-tight tabular-nums sm:text-7xl">{{ s.debt() | bs }}</p>
      <p class="mt-2 max-w-lg text-sm text-base-content/60">
        Plata que tus clientes ya pagaron y todavía no consumieron. Recién es ingreso cuando se canjea.
      </p>

      <!-- reparto de las cartas vivas -->
      <div class="mt-6 flex h-3 overflow-hidden rounded-full bg-base-200">
        @for (seg of mix(); track seg.label) {
          <div class="transition-[width] duration-700 ease-out"
               [style.width.%]="mounted() ? seg.pct : 0"
               [style.background-color]="b().color" [style.opacity]="seg.alpha" [title]="seg.label"></div>
        }
      </div>
      <ul class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-base-content/60">
        @for (seg of mix(); track seg.label) {
          <li class="flex items-center gap-1.5">
            <span class="size-2.5 rounded-sm" [style.background-color]="b().color" [style.opacity]="seg.alpha"></span>
            {{ seg.label }} · <span class="tabular-nums">{{ seg.n }}</span>
          </li>
        }
      </ul>

      <!-- cifras secundarias, separadas por línea, sin encerrar -->
      <div class="mt-7 flex flex-wrap gap-x-8 gap-y-4 border-t border-base-200 pt-5">
        <div>
          <p class="text-2xl font-bold tabular-nums">{{ s.liveCards() }}</p>
          <p class="text-sm text-base-content/55">gift cards vivas</p>
        </div>
        <div class="border-l border-base-200 pl-8">
          <p class="text-2xl font-bold tabular-nums">{{ s.soldThisMonth() | bs }}</p>
          <p class="text-sm text-base-content/55">vendido este mes</p>
        </div>
        <div class="border-l border-base-200 pl-8">
          <p class="text-2xl font-bold tabular-nums">{{ s.nextExpiry() | fecha }}</p>
          <p class="text-sm text-base-content/55">vence la más próxima</p>
        </div>
      </div>
    </section>

    <!-- ventas 6 meses: interactivo (hover muestra el valor, barras animan al entrar) -->
    <section class="rounded-box border border-base-300 bg-base-100 p-5 sm:p-6">
      <div class="flex items-baseline justify-between">
        <p class="text-xs uppercase tracking-wider text-base-content/50">Ventas · 6 meses</p>
        <p class="text-sm text-base-content/50">total <span class="tabular-nums font-medium text-base-content/70">{{ total6() | bs }}</span></p>
      </div>

      <div class="mt-8 flex h-48 items-end gap-2 sm:gap-3">
        @for (m of s.monthly(); track $index) {
          <div class="group relative flex h-full flex-1 flex-col items-center gap-2"
               (mouseenter)="hovered.set($index)" (mouseleave)="hovered.set(-1)">
            <div class="pointer-events-none absolute -top-7 whitespace-nowrap rounded-md bg-base-content px-2 py-1 text-xs font-medium text-base-100 opacity-0 shadow transition-opacity"
                 [class.opacity-100]="hovered() === $index">{{ m.sold | bs }}</div>
            <div class="flex w-full flex-1 items-end">
              <div class="w-full rounded-t-md transition-[height,opacity] duration-500 ease-out"
                   [style.height.%]="mounted() ? pct(m.sold) : 0"
                   [style.background-color]="b().color"
                   [style.opacity]="hovered() === -1 || hovered() === $index ? 1 : 0.4"></div>
            </div>
            <span class="text-xs text-base-content/50" [class.font-semibold]="hovered() === $index"
                  [class.text-base-content]="hovered() === $index">{{ label($index) }}</span>
          </div>
        }
      </div>
    </section>
  </div>
  `,
})
export class Resumen {
  readonly s = inject(Store);
  readonly b = this.s.business;

  readonly hovered = signal(-1);
  readonly mounted = signal(false);
  constructor() { afterNextRender(() => this.mounted.set(true)); }  // dispara la animación de entrada

  private readonly peak = computed(() => Math.max(1, ...this.s.monthly().map(m => m.sold)));
  pct(v: number) { return Math.round((v / this.peak()) * 100); }
  readonly total6 = computed(() => this.s.monthly().reduce((sum, m) => sum + m.sold, 0));

  /** Etiqueta del mes: los últimos N meses terminando en el actual. */
  label(i: number): string {
    const n = this.s.monthly().length;
    return MESES[(new Date().getMonth() - (n - 1 - i) + 12) % 12];
  }

  readonly mix = computed(() => {
    const live = this.s.cards().filter(c => cardState(c) === 'activa');
    const n = live.length || 1;
    const enteras = live.filter(c => c.balance >= c.value).length;
    const parciales = live.length - enteras;
    return [
      { label: 'enteras', n: enteras, pct: (enteras / n) * 100, alpha: 1 },
      { label: 'parciales', n: parciales, pct: (parciales / n) * 100, alpha: 0.45 },
    ];
  });
}
