import { Component, computed, inject } from '@angular/core';
import { Store, cardState } from '../data';
import { BsPipe, FechaPipe, Stat } from '../ui';

@Component({
  selector: 'app-resumen',
  imports: [BsPipe, FechaPipe, Stat],
  template: `
  <div class="mx-auto flex max-w-2xl flex-col gap-4">
    <!-- la deuda es la cifra principal -->
    <section class="rounded-box border border-base-300 bg-base-100 p-4 sm:p-6">
      <p class="text-xs uppercase tracking-wider text-base-content/50">Saldo pendiente de canje (deuda)</p>
      <p class="mt-1 text-5xl font-semibold tabular-nums sm:text-6xl">{{ s.debt() | bs }}</p>
      <p class="mt-2 text-sm text-base-content/60">
        de {{ s.liveCards() }} gift cards vivas · vence la más próxima el {{ s.nextExpiry() | fecha }}
      </p>

      <div class="mt-4 flex h-2.5 overflow-hidden rounded-full bg-base-300">
        @for (seg of mix(); track seg.label) {
          <div [style.width.%]="seg.pct" [class]="seg.cls" [title]="seg.label"></div>
        }
      </div>
      <ul class="mt-2 flex flex-wrap gap-4 text-sm text-base-content/60">
        @for (seg of mix(); track seg.label) {
          <li class="flex items-center gap-1.5">
            <span class="size-2.5 rounded-sm" [class]="seg.cls"></span>{{ seg.label }}
          </li>
        }
      </ul>

      <p class="mt-4 text-sm text-base-content/60">
        Plata que tus clientes ya pagaron y todavía no consumieron. Recién es ingreso cuando se canjea.
      </p>
    </section>

    <app-stat label="Vendido sep" [value]="s.soldThisMonth()" [hint]="s.cards().length + ' gift cards'" />

    <section class="rounded-box border border-base-300 bg-base-100 p-4 sm:p-6">
      <p class="text-xs uppercase tracking-wider text-base-content/50">Ventas · 6 meses</p>
      <div class="mt-4 flex h-40 items-end gap-3">
        @for (m of s.monthly(); track $index) {
          <div class="flex-1 rounded-t-sm bg-primary" [style.height.%]="pct(m.sold)" [title]="'vendido ' + (m.sold | bs)"></div>
        }
      </div>
    </section>
  </div>
  `,
})
export class Resumen {
  readonly s = inject(Store);

  private readonly peak = computed(() =>
    Math.max(1, ...this.s.monthly().map(m => m.sold)));
  pct(v: number) { return Math.round((v / this.peak()) * 100); }

  readonly mix = computed(() => {
    const live = this.s.cards().filter(c => cardState(c) === 'activa');
    const n = live.length || 1;
    const pct = (k: number) => (k / n) * 100;
    const enteras = live.filter(c => c.balance >= c.value).length;
    return [
      // sobre blanco, zinc-100 no se ve: la escala va de naranja a gris medio
      { label: 'enteras', pct: pct(enteras), cls: 'bg-[#ea580c]' },
      { label: 'parciales', pct: pct(live.length - enteras), cls: 'bg-[#fdba74]' },
    ];
  });
}
