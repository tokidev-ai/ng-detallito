import { Component, computed, inject } from '@angular/core';
import { Store } from '../data';
import { BsPipe, Stat } from '../ui';

@Component({
  selector: 'app-resumen',
  imports: [BsPipe, Stat],
  template: `
  <div class="grid gap-4 lg:grid-cols-2">

    <div class="flex flex-col gap-4">
      <!-- la deuda es la cifra principal -->
      <section class="rounded-box border border-base-300 bg-base-100 p-4 sm:p-6">
        <p class="text-xs uppercase tracking-wider text-base-content/50">Saldo pendiente de canje (deuda)</p>
        <p class="mt-1 text-5xl font-semibold tabular-nums sm:text-6xl">{{ s.debt() | bs }}</p>
        <p class="mt-2 text-sm text-base-content/60">
          de {{ s.liveCards() }} gift cards vivas · vence la más próxima el {{ s.nextExpiry() }}
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

      <div class="grid gap-4 sm:grid-cols-2">
        <app-stat label="Vendido sep" [value]="s.soldThisMonth()" [hint]="s.cards().length + ' gift cards'" />
        <app-stat label="Neto a cobrar" [value]="s.netToCollect()" hint="bruto − comisión 5%" />
      </div>

      <section class="rounded-box border border-base-300 bg-base-100 p-4 sm:p-6">
        <p class="text-xs uppercase tracking-wider text-base-content/50">Ventas vs canjes · 6 meses</p>
        <div class="mt-4 flex h-40 items-end gap-3">
          @for (m of s.monthly(); track $index) {
            <div class="flex h-full flex-1 items-end gap-1">
              <div class="flex-1 rounded-t-sm bg-primary" [style.height.%]="pct(m.sold)" [title]="'vendido ' + (m.sold | bs)"></div>
              <div class="flex-1 rounded-t-sm bg-[#d4d4d8]" [style.height.%]="pct(m.redeemed)" [title]="'canjeado ' + (m.redeemed | bs)"></div>
            </div>
          }
        </div>
        <ul class="mt-3 flex gap-4 text-sm text-base-content/60">
          <li class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-primary"></span>vendido</li>
          <li class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-[#d4d4d8]"></span>canjeado</li>
        </ul>
      </section>
    </div>

    <section class="rounded-box border border-base-300 bg-base-100 p-4 sm:p-6">
      <p class="text-xs uppercase tracking-wider text-base-content/50">Últimos canjes</p>
      <ul class="mt-2 divide-y divide-base-200">
        @for (r of s.redemptions(); track r.code) {
          <li class="flex items-center gap-3 py-3">
            <span class="min-w-0 flex-1 truncate">{{ r.by }} · <span class="font-mono text-sm">{{ r.code }}</span></span>
            <span class="shrink-0 tabular-nums text-base-content/70">−{{ r.amount | bs }}</span>
          </li>
        }
      </ul>
      <p class="mt-3 text-sm text-warning">append-only: el saldo se recalcula, nunca se edita.</p>
    </section>
  </div>
  `,
})
export class Resumen {
  readonly s = inject(Store);

  private readonly peak = computed(() =>
    Math.max(1, ...this.s.monthly().flatMap(m => [m.sold, m.redeemed])));
  pct(v: number) { return Math.round((v / this.peak()) * 100); }

  readonly mix = computed(() => {
    const cards = this.s.cards();
    const live = cards.filter(c => c.status === 'activa' || c.status === 'parcial' || c.status === 'pagada');
    const n = live.length || 1;
    const count = (f: (s: string) => boolean) => (live.filter(c => f(c.status)).length / n) * 100;
    return [
      // sobre blanco, zinc-100 no se ve: la escala va de naranja a gris medio
      { label: 'activas', pct: count(s => s === 'activa' || s === 'pagada'), cls: 'bg-[#ea580c]' },
      { label: 'parciales', pct: count(s => s === 'parcial'), cls: 'bg-[#fdba74]' },
      { label: 'por vencer', pct: 12, cls: 'bg-[#d4d4d8]' },
    ];
  });
}
