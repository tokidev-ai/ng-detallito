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

      <div class="mt-8">
        <!-- línea + puntos. La línea es un SVG estirado (non-scaling-stroke la
             mantiene fina); los puntos son divs para quedar redondos y ser buen
             blanco de hover. -->
        <div class="relative h-44" (mouseleave)="hovered.set(-1)">
          <svg class="absolute inset-0 h-full w-full transition-opacity duration-700"
               [class.opacity-0]="!mounted()" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path [attr.d]="areaPath()" [attr.fill]="b().color" opacity="0.08" />
            <path [attr.d]="linePath()" fill="none" [attr.stroke]="b().color" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
          </svg>
          @for (p of pts(); track $index) {
            <div class="absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center"
                 [style.left.%]="p.x" [style.top.%]="p.y" (mouseenter)="hovered.set($index)">
              <div class="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-base-content px-2 py-1 text-xs font-medium text-base-100 opacity-0 shadow transition-opacity"
                   [class.opacity-100]="hovered() === $index">{{ p.sold | bs }}</div>
              <span class="size-2.5 rounded-full border-2 border-base-100 transition-transform"
                    [class.scale-150]="hovered() === $index" [style.background-color]="b().color"></span>
            </div>
          }
        </div>
        <div class="relative mt-2 h-4">
          @for (p of pts(); track $index) {
            <span class="absolute -translate-x-1/2 text-xs text-base-content/50" [style.left.%]="p.x"
                  [class.font-semibold]="hovered() === $index" [class.text-base-content]="hovered() === $index">{{ p.label }}</span>
          }
        </div>
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
  readonly total6 = computed(() => this.s.monthly().reduce((sum, m) => sum + m.sold, 0));

  /** Puntos de la línea en coordenadas 0–100 (viewBox), con margen para que los
   *  dots no queden pegados al borde. y invertido: más ventas, más arriba. */
  private readonly PAD = 8;
  readonly pts = computed(() => {
    const ms = this.s.monthly(), n = ms.length, peak = this.peak(), span = 100 - this.PAD * 2;
    return ms.map((m, i) => ({
      x: this.PAD + (n > 1 ? (i / (n - 1)) * span : span / 2),
      y: this.PAD + (1 - m.sold / peak) * span,
      sold: m.sold,
      label: this.label(i),
    }));
  });
  readonly linePath = computed(() =>
    this.pts().map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '));
  /** Misma línea cerrada contra la base, para el relleno tenue debajo. */
  readonly areaPath = computed(() => {
    const p = this.pts();
    if (!p.length) return '';
    return `M${p[0].x.toFixed(1)} 100 ${this.linePath().slice(1)} L${p[p.length - 1].x.toFixed(1)} 100 Z`;
  });

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
