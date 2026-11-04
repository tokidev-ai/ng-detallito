import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Wordmark } from './brand';
import { Reveal } from './reveal';
import { CATEGORIES, PublicTenant, Store, branchLabel, branchesOf, categoryLabel } from './data';
import { cardSurface } from './card-style';
import { BsPipe } from './ui';

type Orden = 'vendidos' | 'barato' | 'caro' | 'nuevos' | 'az';
const ORDENES: { id: Orden; label: string }[] = [
  { id: 'vendidos', label: 'Más vendidos' },
  { id: 'barato', label: 'Menor precio' },
  { id: 'caro', label: 'Mayor precio' },
  { id: 'nuevos', label: 'Más nuevos' },
  { id: 'az', label: 'A–Z' },
];

/** "Ver todos los negocios": el catálogo de comercios publicados, con buscador,
 *  filtro por rubro y orden. Antes vivía en la landing. */
@Component({
  selector: 'app-negocios',
  imports: [RouterLink, Wordmark, Reveal, BsPipe],
  template: `
  <div class="min-h-dvh overflow-x-clip bg-base-100">
    <header class="sticky top-0 z-40 border-b border-base-300/70 bg-base-100/95">
      <nav class="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
        <a routerLink="/" class="flex-1"><app-wordmark /></a>
        <a routerLink="/login" class="btn btn-ghost btn-sm">Entrar</a>
        <a routerLink="/onboarding" class="btn btn-sm btn-primary rounded-full px-4 shadow-md shadow-primary/30">Crear mi comercio</a>
      </nav>
    </header>

    <section class="relative overflow-hidden border-b border-base-300 bg-gradient-to-b from-primary/5 to-transparent">
      <div class="pointer-events-none absolute -right-40 -top-20 size-[30rem] glow" style="--g: color-mix(in oklab, var(--color-primary) 15%, transparent)" aria-hidden="true"></div>
      <div class="relative mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 lg:py-16">
        <h1 class="reveal text-3xl font-extrabold tracking-[-0.04em] text-balance sm:text-5xl">
          Negocios que ya usan <span class="text-primary">GiftKBol</span>
        </h1>
        <p class="reveal reveal-1 mx-auto mt-4 max-w-2xl text-lg text-base-content/65">
          Elige dónde regalar, nosotros hacemos el resto: pagas por QR y la gift card llega al instante.
        </p>
      </div>
    </section>

    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <!-- filtros -->
      <div class="flex flex-col gap-3 sm:flex-row">
        <label class="relative flex-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-base-content/40" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" stroke-linecap="round"/>
          </svg>
          <input class="input input-bordered w-full rounded-full ps-10" [value]="q()" (input)="q.set($any($event.target).value)"
                 placeholder="Buscar negocio o zona" aria-label="Buscar negocio">
        </label>
        <label class="flex items-center gap-2 text-sm text-base-content/60">
          <span class="shrink-0">Ordenar por</span>
          <select class="select select-bordered w-full rounded-full sm:w-48" [value]="orden()"
                  (change)="orden.set($any($event.target).value)" aria-label="Ordenar negocios">
            @for (o of ordenes; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
          </select>
        </label>
      </div>

      <!-- rubros: solo los que tienen negocios; en móvil se desliza de costado -->
      @if (rubros().length > 1) {
        <div class="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtrar por categoría">
          <button type="button" class="btn btn-sm shrink-0 rounded-full" [class.btn-neutral]="!rubro()" [class.btn-ghost]="rubro()"
                  [class.border-base-300]="rubro()" [attr.aria-pressed]="!rubro()" (click)="rubro.set('')">
            Todas <span class="opacity-60">{{ negocios().length }}</span>
          </button>
          @for (r of rubros(); track r.id) {
            <button type="button" class="btn btn-sm shrink-0 rounded-full" [class.btn-neutral]="rubro() === r.id" [class.btn-ghost]="rubro() !== r.id"
                    [class.border-base-300]="rubro() !== r.id" [attr.aria-pressed]="rubro() === r.id" (click)="rubro.set(rubro() === r.id ? '' : r.id)">
              {{ r.label }} <span class="opacity-60">{{ r.n }}</span>
            </button>
          }
        </div>
      }

      @if (!catalog.isLoading()) {
        <p class="mt-6 text-sm text-base-content/55" aria-live="polite">
          {{ filtrados().length }} {{ filtrados().length === 1 ? 'negocio' : 'negocios' }}
        </p>
      }

      <ul class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        @if (catalog.isLoading()) {
          @for (i of [1, 2, 3]; track i) {
            <li class="aspect-[4/5] animate-pulse rounded-[2rem] bg-base-200"></li>
          }
        }
        @for (t of filtrados(); track t.id; let i = $index) {
              <li [reveal]="(i % 3) + 1">
                <!-- vitrina del negocio: la tarjeta entera es su marca (su diseño de gift card),
                     con sus gift cards apiladas que se abren en abanico al pasar el mouse -->
                <a [routerLink]="'/' + t.id" [attr.aria-label]="'Regalar en ' + t.business.name"
                   class="storefront biz-card group relative isolate flex aspect-[4/5] flex-col overflow-hidden rounded-[2rem] p-6 shadow-xl shadow-black/10 ring-1 ring-black/5 transition duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl"
                   [style.--c1]="t.business.color" [style.background]="surface(t).bg" [style.color]="surface(t).ink">
                  <span class="dotgrid-light pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden="true"></span>
                  <span class="pointer-events-none absolute -bottom-24 -right-20 -z-10 size-72 glow transition-transform duration-700 group-hover:scale-125"
                        style="--g: var(--c2)" aria-hidden="true"></span>

                  <!-- marca -->
                  <div class="flex items-center gap-3">
                    <span class="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-current/15 text-xl font-extrabold shadow-lg ring-2 ring-current/20">
                      @if (t.business.logoUrl) { <img [src]="t.business.logoUrl" alt="" class="size-full object-cover" loading="lazy"> }
                      @else { {{ t.business.name[0] }} }
                    </span>
                    @if (zona(t)) {
                      <span class="ms-auto flex min-w-0 items-center gap-1 rounded-full bg-current/10 px-2.5 py-1 text-[11px] font-medium">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="size-3 shrink-0"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.5"/></svg>
                        <span class="truncate">{{ zona(t) }}</span>
                      </span>
                    }
                  </div>

                  <!-- sus gift cards, apiladas -->
                  <div class="relative my-auto h-28" aria-hidden="true">
                    @for (c of pila(t); track c.m) {
                      <span class="biz-chip absolute left-1/2 top-1/2 flex h-20 w-32 flex-col justify-between overflow-hidden rounded-xl bg-white p-2.5 text-neutral-900 shadow-2xl shadow-black/30"
                            [class.items-end]="c.i > 0" [style.--i]="c.i" [style.z-index]="10 - abs(c.i)">
                        <span class="absolute inset-x-0 top-0 h-1.5" style="background: linear-gradient(90deg, var(--c1), var(--c2))"></span>
                        <span class="mt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-400">Gift card</span>
                        <span class="text-xl font-extrabold tabular-nums tracking-tight" style="color: var(--c1)">{{ c.m | bs }}</span>
                      </span>
                    }
                  </div>

                  <!-- nombre y acción -->
                  <div>
                    @if (cat(t); as c) { <p class="mb-1 truncate text-xs font-semibold uppercase tracking-wider opacity-70">{{ c }}</p> }
                    <h3 class="truncate text-2xl font-extrabold tracking-[-0.03em]">{{ t.business.name }}</h3>
                    @if (t.business.description) {
                      <p class="mt-1 line-clamp-2 text-sm opacity-75">{{ t.business.description }}</p>
                    }
                    <div class="mt-5 flex items-center justify-between gap-3">
                      <p class="text-sm"><span class="me-1 opacity-70">desde</span><span class="text-lg font-extrabold tabular-nums">{{ desde(t) | bs }}</span></p>
                      <span class="flex h-11 items-center gap-2 overflow-hidden rounded-full bg-white px-3.5 text-sm font-bold text-neutral-900 shadow-lg transition-all duration-300">
                        <span class="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-24">Regalar</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </span>
                    </div>
                  </div>
                </a>
              </li>
        }
        @if (!catalog.isLoading() && !filtrados().length) {
          <li class="col-span-full py-16 text-center text-base-content/50">
            @if (negocios().length) {
              Ningún negocio coincide con tu búsqueda.
              <button type="button" class="btn btn-ghost btn-sm mt-2 block mx-auto" (click)="q.set(''); rubro.set('')">Ver todos</button>
            } @else {
              Todavía no hay negocios publicados.
            }
          </li>
        }
      </ul>
    </main>

    <footer class="border-t border-base-300">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-7 text-sm text-base-content/45 sm:px-6">
        <app-wordmark />
        <p>Gift cards para negocios en Bolivia.</p>
      </div>
    </footer>
  </div>
  `,
})
export class Negocios {
  readonly ordenes = ORDENES;
  // ponytail: trae todas las páginas publicadas de una y filtra acá; paginar cuando pasen de ~60.
  readonly catalog = inject(Store).publishedTenants();
  /** Solo los que pueden vender (tienen montos). */
  readonly negocios = computed(() => (this.catalog.value() ?? []).filter(t => t.business.suggestedAmounts?.length));

  readonly q = signal('');
  /** Rubro elegido ('' = todos). */
  readonly rubro = signal('');
  readonly orden = signal<Orden>('vendidos');

  /** Los rubros que tienen al menos un negocio, en el orden de CATEGORIES. */
  readonly rubros = computed(() => CATEGORIES
    .map(c => ({ ...c, n: this.negocios().filter(t => t.business.category === c.id).length }))
    .filter(c => c.n > 0));

  readonly filtrados = computed(() => {
    const q = this.q().trim().toLowerCase(), cat = this.rubro();
    const byName = (a: PublicTenant, b: PublicTenant) => a.business.name.localeCompare(b.business.name, 'es');
    const cmp: Record<Orden, (a: PublicTenant, b: PublicTenant) => number> = {
      vendidos: (a, b) => (b.stats?.sold ?? 0) - (a.stats?.sold ?? 0) || byName(a, b),
      barato: (a, b) => this.desde(a) - this.desde(b) || byName(a, b),
      caro: (a, b) => this.desde(b) - this.desde(a) || byName(a, b),
      nuevos: (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0) || byName(a, b),
      az: byName,
    };
    return this.negocios()
      .filter(t => !cat || t.business.category === cat)
      .filter(t => !q || `${t.business.name} ${t.business.description} ${categoryLabel(t.business.category)} ${branchesOf(t.business).map(branchLabel).join(' ')}`
        .toLowerCase().includes(q))
      .sort(cmp[this.orden()]);
  });

  cat(t: PublicTenant) { return categoryLabel(t.business.category); }
  surface(t: PublicTenant) { return cardSurface(t.business.cardStyle, t.business.color, t.business.logoUrl, t.business.cardPhoto); }
  desde(t: PublicTenant) { return Math.min(...t.business.suggestedAmounts); }
  /** Hasta 3 montos para la pila: el más bajo al centro y arriba; los otros a los
   *  costados (i = -1 izquierda, 1 derecha), que se abren al pasar el mouse. */
  pila(t: PublicTenant) {
    const [a, b, c] = [...t.business.suggestedAmounts].sort((x, y) => x - y);
    return [b !== undefined && { m: b, i: -1 }, c !== undefined && { m: c, i: 1 }, { m: a, i: 0 }]
      .filter((x): x is { m: number; i: number } => !!x);
  }
  readonly abs = Math.abs;
  /** La zona, no la dirección entera: lo que va después de la primera coma ("Sopocachi, La Paz"). */
  zona(t: PublicTenant) {
    const l = branchesOf(t.business);
    if (l.length > 1) return `${l.length} sucursales`;
    const parts = (l[0]?.address ?? '').split(',').map(p => p.trim()).filter(Boolean);
    return parts.length > 1 ? parts.slice(1, 3).join(', ') : parts[0] ?? '';
  }
}
