import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store, cardState } from '../data';
import { AuthService } from '../auth';
import { daysUntil, pctChange, stampKey } from '../card';
import { BsPipe, FechaPipe } from '../ui';
import { RedeemDialog } from './redeem';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const PAD = 6;  // margen del gráfico, en % del viewBox, para que los puntos no toquen el borde

@Component({
  selector: 'app-resumen',
  imports: [BsPipe, FechaPipe, RouterLink, RedeemDialog],
  template: `
  <div class="space-y-6">

    <!-- ── saludo + acciones rápidas ── -->
    <div class="reveal flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm text-base-content/50 first-letter:uppercase">{{ today }}</p>
        <h2 class="mt-0.5 text-2xl font-extrabold tracking-tight sm:text-3xl">Hola, {{ firstName() }} 👋</h2>
        <p class="mt-1 text-sm text-base-content/60">Así va {{ s.business().name }} este mes.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        @if (s.can('redeem')) {
          <app-redeem btnClass="btn rounded-full border-base-300 bg-base-100 shadow-sm" />
        }
        @if (s.can('viewCards')) {
          <a routerLink="../gift-cards" [queryParams]="{ nueva: 1 }" class="btn btn-primary rounded-full shadow-md shadow-primary/25">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="size-4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
            Nueva gift card
          </a>
        }
      </div>
    </div>

    <!-- ── KPIs ── -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <!-- la deuda es la cifra estrella: la única tarjeta oscura -->
      <article class="reveal reveal-1 col-span-2 rounded-box bg-neutral p-5 text-neutral-content lg:col-span-1">
        <div class="flex items-center justify-between">
          <p class="text-sm text-neutral-content/65">Por canjear</p>
          <span class="grid size-8 place-items-center rounded-xl bg-primary/20 text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M6 3h12M6 21h12M7 3v4l5 5-5 5v4M17 3v4l-5 5 5 5v4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </div>
        <p class="mt-3 text-3xl font-extrabold tracking-[-0.03em] tabular-nums">{{ s.debt() | bs }}</p>
        <p class="mt-1 text-xs text-neutral-content/55">Ya cobrado, todavía no consumido. Es deuda, no ingreso.</p>
      </article>

      <article class="reveal reveal-2 rounded-box border border-base-300 bg-base-100 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm text-base-content/55">Vendido este mes</p>
          <span class="grid size-8 place-items-center rounded-xl bg-primary/10 text-[#c2410c]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M3 17l6-6 4 4 8-8M15 7h6v6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </div>
        <p class="mt-3 text-2xl font-extrabold tracking-[-0.03em] tabular-nums">{{ s.soldThisMonth() | bs }}</p>
        @if (delta() !== null) {
          <p class="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
             [class]="delta()! >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'">
            {{ delta()! >= 0 ? '↑' : '↓' }} {{ abs(delta()!) }}% vs mes anterior
          </p>
        } @else {
          <p class="mt-1 text-xs text-base-content/45">sin mes anterior para comparar</p>
        }
      </article>

      <article class="reveal reveal-3 rounded-box border border-base-300 bg-base-100 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm text-base-content/55">Canjeado este mes</p>
          <span class="grid size-8 place-items-center rounded-xl bg-success/10 text-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="size-4"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </div>
        <p class="mt-3 text-2xl font-extrabold tracking-[-0.03em] tabular-nums">{{ redeemedThisMonth() | bs }}</p>
        <p class="mt-1 text-xs text-base-content/45">esto ya es ingreso</p>
      </article>

      <article class="reveal reveal-4 col-span-2 rounded-box border border-base-300 bg-base-100 p-5 lg:col-span-1">
        <div class="flex items-center justify-between">
          <p class="text-sm text-base-content/55">Gift cards vivas</p>
          <span class="grid size-8 place-items-center rounded-xl bg-base-200 text-base-content/60">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M3 7h18v10H3zM3 11h18" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </div>
        <p class="mt-3 text-2xl font-extrabold tracking-[-0.03em] tabular-nums">{{ s.liveCards() }}</p>
        <p class="mt-1 text-xs text-base-content/45">la próxima vence el {{ s.nextExpiry() | fecha }}</p>
      </article>
    </div>

    <!-- ── gráfico + estado ── -->
    <div class="grid gap-4 lg:grid-cols-3">
      <section class="reveal reveal-2 rounded-box border border-base-300 bg-base-100 p-5 sm:p-6 lg:col-span-2">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-bold">Ventas y canjes</h3>
            <p class="text-sm text-base-content/50">Últimos 6 meses · vendido {{ total6() | bs }}</p>
          </div>
          <div class="flex items-center gap-4 text-xs text-base-content/60">
            <span class="inline-flex items-center gap-1.5"><span class="size-2.5 rounded-full bg-primary"></span> Ventas</span>
            <span class="inline-flex items-center gap-1.5"><span class="size-2.5 rounded-full bg-success"></span> Canjes</span>
          </div>
        </div>

        <div class="relative mt-6 h-56" (mouseleave)="hovered.set(-1)">
          <!-- guías horizontales -->
          <div class="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">
            @for (g of [0, 1, 2, 3]; track g) { <span class="border-t border-dashed border-base-300"></span> }
          </div>

          <svg class="chart-reveal absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <!-- relleno solo bajo ventas: dos áreas superpuestas ensucian el color -->
            <path [attr.d]="area(sold())" class="fill-primary" opacity="0.08" />
            <path [attr.d]="line(sold())" fill="none" class="stroke-primary" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
            <path [attr.d]="line(redeemed())" fill="none" class="stroke-success" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
          </svg>

          @if (hovered() >= 0) {
            <span class="pointer-events-none absolute inset-y-0 border-l border-base-content/20" [style.left.%]="sold()[hovered()].x"></span>
          }

          <!-- puntos (divs para que queden redondos) -->
          @for (p of sold(); track $index) {
            <span class="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-base-100 bg-primary transition-transform"
                  [class.scale-150]="hovered() === $index" [style.left.%]="p.x" [style.top.%]="p.y"></span>
          }
          @for (p of redeemed(); track $index) {
            <span class="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-base-100 bg-success transition-transform"
                  [class.scale-150]="hovered() === $index" [style.left.%]="p.x" [style.top.%]="p.y"></span>
          }

          <!-- zonas de hover: una columna por mes -->
          @for (p of sold(); track $index) {
            <div class="absolute inset-y-0 -translate-x-1/2" [style.left.%]="p.x" [style.width.%]="colW()"
                 (mouseenter)="hovered.set($index)"></div>
          }

          @if (hovered() >= 0) {
            <div class="pointer-events-none absolute top-0 z-10 w-36 -translate-x-1/2 -translate-y-2 rounded-xl border border-base-300 bg-base-100 p-2.5 text-xs shadow-xl"
                 [style.left.%]="sold()[hovered()].x">
              <p class="font-semibold capitalize">{{ label(hovered()) }}</p>
              <p class="mt-1 flex justify-between"><span class="text-base-content/55">Ventas</span><span class="font-semibold tabular-nums">{{ sold()[hovered()].v | bs }}</span></p>
              <p class="flex justify-between"><span class="text-base-content/55">Canjes</span><span class="font-semibold tabular-nums">{{ redeemed()[hovered()].v | bs }}</span></p>
            </div>
          }
        </div>
        <div class="relative mt-2 h-4">
          @for (p of sold(); track $index) {
            <span class="absolute -translate-x-1/2 text-xs text-base-content/50" [style.left.%]="p.x"
                  [class.font-semibold]="hovered() === $index" [class.text-base-content]="hovered() === $index">{{ label($index) }}</span>
          }
        </div>
      </section>

      <!-- estado de las gift cards: dona -->
      <section class="reveal reveal-3 rounded-box border border-base-300 bg-base-100 p-5 sm:p-6">
        <h3 class="font-bold">Tus gift cards</h3>
        <p class="text-sm text-base-content/50">Por estado</p>
        <div class="relative mx-auto mt-5 size-44">
          <svg viewBox="0 0 42 42" class="size-full -rotate-90">
            <circle cx="21" cy="21" r="15.915" fill="none" class="stroke-base-200" stroke-width="5" />
            @for (seg of donut(); track seg.label) {
              <circle cx="21" cy="21" r="15.915" fill="none" stroke-width="5"
                      class="transition-[stroke-dasharray] duration-1000 ease-out" [class]="seg.stroke"
                      [attr.stroke-dasharray]="mounted() ? seg.pct + ' ' + (100 - seg.pct) : '0 100'"
                      [attr.stroke-dashoffset]="-seg.offset" />
            }
          </svg>
          <div class="absolute inset-0 grid place-items-center text-center">
            <div>
              <p class="text-3xl font-extrabold tracking-tight">{{ s.cards().length }}</p>
              <p class="text-xs text-base-content/50">en total</p>
            </div>
          </div>
        </div>
        <ul class="mt-5 space-y-2 text-sm">
          @for (seg of donut(); track seg.label) {
            <li class="flex items-center gap-2">
              <span class="size-2.5 rounded-full" [class]="seg.dot"></span>
              <span class="flex-1 text-base-content/70">{{ seg.label }}</span>
              <span class="font-semibold tabular-nums">{{ seg.n }}</span>
            </li>
          }
        </ul>
      </section>
    </div>

    <!-- ── listas accionables ── -->
    <div class="grid gap-4 lg:grid-cols-2">
      <section class="reveal reveal-3 rounded-box border border-base-300 bg-base-100 p-5 sm:p-6">
        <h3 class="font-bold">Próximos vencimientos</h3>
        <p class="text-sm text-base-content/50">Gift cards con saldo que vencen pronto</p>
        <ul class="mt-4 divide-y divide-base-200">
          @for (c of expiring(); track c.code) {
            <li class="flex items-center gap-3 py-3">
              <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-base-200 text-xs font-bold text-base-content/60">{{ c.to[0] || '?' }}</span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold">{{ c.to || 'Sin nombre' }}</p>
                <p class="font-mono text-xs text-base-content/50">{{ c.code }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold tabular-nums">{{ c.balance | bs }}</p>
                <p class="text-xs font-medium"
                   [class]="c.days <= 7 ? 'text-error' : c.days <= 30 ? 'text-warning' : 'text-base-content/50'">
                  {{ c.days === 0 ? 'vence hoy' : 'en ' + c.days + (c.days === 1 ? ' día' : ' días') }}
                </p>
              </div>
            </li>
          } @empty {
            <li class="py-8 text-center text-sm text-base-content/45">No hay gift cards vivas.</li>
          }
        </ul>
      </section>

      <section class="reveal reveal-4 rounded-box border border-base-300 bg-base-100 p-5 sm:p-6">
        <h3 class="font-bold">Últimos canjes</h3>
        <p class="text-sm text-base-content/50">Lo que tu equipo fue canjeando</p>
        <ul class="mt-4 divide-y divide-base-200">
          @for (r of recent(); track $index) {
            <li class="flex items-center gap-3 py-3">
              <span class="grid size-9 shrink-0 place-items-center rounded-full bg-success/10 text-xs font-bold uppercase text-success">{{ r.by[0] }}</span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm"><span class="font-semibold">{{ r.by }}</span> canjeó</p>
                <p class="font-mono text-xs text-base-content/50">{{ r.code }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold tabular-nums text-success">−{{ r.amount | bs }}</p>
                <p class="text-xs text-base-content/50">{{ r.at }}</p>
              </div>
            </li>
          } @empty {
            <li class="py-8 text-center text-sm text-base-content/45">Todavía no hay canjes.</li>
          }
        </ul>
      </section>
    </div>
  </div>
  `,
})
export class Resumen {
  readonly s = inject(Store);
  private readonly auth = inject(AuthService);

  readonly hovered = signal(-1);
  readonly mounted = signal(false);
  constructor() { afterNextRender(() => this.mounted.set(true)); }  // dispara la animación de la dona

  readonly today = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  readonly firstName = computed(() => {
    const u = this.auth.user();
    return u?.displayName?.split(' ')[0] || (u?.email ?? '').split('@')[0] || '';
  });
  readonly abs = Math.abs;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  private readonly months = computed(() => this.s.monthly());
  readonly redeemedThisMonth = computed(() => this.months().at(-1)?.redeemed ?? 0);
  readonly delta = computed(() => {
    const prev = this.months().at(-2)?.sold ?? 0;
    return pctChange(this.s.soldThisMonth(), prev);
  });
  readonly total6 = computed(() => this.months().reduce((sum, m) => sum + m.sold, 0));

  // ── gráfico: dos series con la misma escala ──────────────────────────────
  private readonly peak = computed(() => Math.max(1, ...this.months().flatMap(m => [m.sold, m.redeemed])));
  private series(pick: (m: { sold: number; redeemed: number }) => number) {
    const ms = this.months(), n = ms.length, span = 100 - PAD * 2;
    return ms.map((m, i) => ({
      x: PAD + (n > 1 ? (i / (n - 1)) * span : span / 2),
      y: PAD + (1 - pick(m) / this.peak()) * span,
      v: pick(m),
    }));
  }
  readonly sold = computed(() => this.series(m => m.sold));
  readonly redeemed = computed(() => this.series(m => m.redeemed));
  readonly colW = computed(() => (this.months().length > 1 ? (100 - PAD * 2) / (this.months().length - 1) : 100));

  line(p: { x: number; y: number }[]) { return p.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' '); }
  area(p: { x: number; y: number }[]) {
    return p.length ? `M${p[0].x.toFixed(1)} 100 ${this.line(p).slice(1)} L${p.at(-1)!.x.toFixed(1)} 100 Z` : '';
  }

  /** Etiqueta del mes: los últimos N meses terminando en el actual. */
  label(i: number): string {
    const n = this.months().length;
    return MESES[(new Date().getMonth() - (n - 1 - i) + 12) % 12];
  }

  // ── dona por estado ──────────────────────────────────────────────────────
  readonly donut = computed(() => {
    const cards = this.s.cards(), total = cards.length || 1;
    const count = (st: string) => cards.filter(c => cardState(c) === st).length;
    const raw = [
      { label: 'Activas', n: count('activa'), stroke: 'stroke-success', dot: 'bg-success' },
      { label: 'Canjeadas', n: count('canjeada'), stroke: 'stroke-neutral', dot: 'bg-neutral' },
      { label: 'Vencidas', n: count('vencida'), stroke: 'stroke-error', dot: 'bg-error' },
    ];
    let offset = 0;
    return raw.map(r => {
      const pct = (r.n / total) * 100;
      const seg = { ...r, pct, offset };
      offset += pct;
      return seg;
    });
  });

  // ── listas ───────────────────────────────────────────────────────────────
  readonly expiring = computed(() => this.s.cards()
    .filter(c => cardState(c) === 'activa')
    .sort((a, b) => a.expires.localeCompare(b.expires))
    .slice(0, 5)
    .map(c => ({ ...c, days: daysUntil(c.expires) })));

  readonly recent = computed(() => [...this.s.redemptions()]
    .sort((a, b) => stampKey(b.at).localeCompare(stampKey(a.at)))
    .slice(0, 5));
}
