import { Component, computed, inject, input, model, resource, signal } from '@angular/core';
import QRCode from 'qrcode';
import { Business, CardStyle, GiftCard, Store, cardState } from './data';
import { giftPath } from './card';
import { BsPipe, FechaPipe, onBrand } from './ui';
import { Wordmark } from './brand';

export const CARD_STYLES: { id: CardStyle; label: string }[] = [
  { id: 'degradado', label: 'Degradado' },
  { id: 'logo', label: 'Tu logo' },
  { id: 'cubierta', label: 'Logo completo' },
  { id: 'claro', label: 'Claro' },
  { id: 'oscuro', label: 'Oscuro' },
];

/** Fondo y tinta de cada diseño, a partir del color del comercio. Va dentro de
 *  un `.storefront` con `--c1`, que deriva `--c2` (el segundo tono del degradado). */
export function cardSurface(style: CardStyle | undefined, color: string, logo?: string | null): { bg: string; ink: string } {
  switch (style) {
    // el logo cubre toda la tarjeta; un velo oscuro arriba y abajo deja leer el texto.
    // Sin logo, el color de marca.
    case 'cubierta': return {
      bg: `linear-gradient(rgba(0,0,0,.4), rgba(0,0,0,.05) 40%, rgba(0,0,0,.6))${logo ? `, url("${logo}") center / cover` : ''}, var(--c1)`,
      ink: logo ? '#ffffff' : onBrand(color),
    };
    case 'logo': return { bg: 'var(--c1)', ink: onBrand(color) };
    case 'claro': return { bg: '#faf8f3', ink: '#1c1b18' };
    case 'oscuro': return {
      bg: 'radial-gradient(120% 90% at 100% 0%, color-mix(in oklab, var(--c1) 60%, transparent), transparent 65%), #141414',
      ink: '#ffffff',
    };
    default: return { bg: 'linear-gradient(135deg, var(--c1), var(--c2))', ink: onBrand(color) };
  }
}

/** La gift card, con dos caras. El frente es solo marca y monto, nada que sirva
 *  para canjearla: se puede mostrar sin cuidado. El revés tiene para quién, el
 *  código y el QR, y un ojito que los difumina. Se gira tocando la tarjeta o con
 *  el botón de abajo. Se usa en el panel, al terminar la compra y en la página del regalo. */
@Component({
  selector: 'app-giftcard-art',
  imports: [BsPipe, FechaPipe],
  template: `
  <div class="storefront flip" [style.--c1]="business().color">
    <div class="flip-inner cursor-pointer" [class.is-flipped]="flipped()" (click)="flipped.set(!flipped())">

      <!-- ── frente: la marca ── -->
      <div class="flip-face shine relative flex min-h-52 flex-col justify-between overflow-hidden rounded-2xl p-5 shadow-2xl sm:p-6"
           [style.background]="surface().bg" [style.color]="surface().ink" [attr.aria-hidden]="flipped()">
        @switch (style()) {
          @case ('logo') {
            <!-- el logo grande, de marca de agua -->
            <div class="pointer-events-none absolute -bottom-10 -right-8 grid size-56 rotate-[-12deg] place-items-center overflow-hidden rounded-[2.5rem] opacity-20" aria-hidden="true">
              @if (business().logoUrl) { <img [src]="business().logoUrl" alt="" class="size-full object-cover"> }
              @else { <span class="text-[9rem] font-extrabold leading-none">{{ initial() }}</span> }
            </div>
          }
          @case ('cubierta') { <!-- el logo ya es el fondo: nada encima --> }
          @case ('claro') {
            <span class="pointer-events-none absolute inset-y-0 left-0 w-2" style="background:linear-gradient(var(--c1),var(--c2))" aria-hidden="true"></span>
            <span class="pointer-events-none absolute -right-14 -top-14 size-48 rounded-full opacity-15" style="background:var(--c1)" aria-hidden="true"></span>
          }
          @case ('oscuro') {
            <span class="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" aria-hidden="true"></span>
          }
          @default {
            <span class="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-white/15" aria-hidden="true"></span>
            <span class="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-black/10" aria-hidden="true"></span>
          }
        }

        <div class="relative flex items-center gap-3">
          @if (style() !== 'cubierta' || !business().logoUrl) {
            <div class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-current/15 text-sm font-bold">
              @if (business().logoUrl) { <img [src]="business().logoUrl" alt="" class="size-full object-cover"> }
              @else { {{ initial() }} }
            </div>
          }
          <p class="min-w-0 flex-1 truncate font-semibold">{{ business().name }}</p>
          <span class="rounded-full bg-current/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">Gift card</span>
        </div>

        <div class="relative mt-8 flex items-end justify-between gap-3">
          <p class="text-[3.25rem] font-extrabold leading-none tracking-[-0.03em] tabular-nums">{{ card().value | bs }}</p>
          <span class="mb-1 flex items-center gap-1 text-xs font-medium opacity-60">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            toca para girar
          </span>
        </div>
      </div>

      <!-- ── revés: los datos para usarla ── -->
      <div class="flip-face flip-back relative flex min-h-52 flex-col overflow-hidden rounded-2xl p-5 shadow-2xl sm:p-6"
           [style.background]="surface().bg" [style.color]="surface().ink" [attr.aria-hidden]="!flipped()">
        <div class="flex items-center gap-2">
          <p class="min-w-0 flex-1 truncate text-sm font-semibold opacity-80">{{ business().name }}</p>
          <button type="button" class="grid size-9 place-items-center rounded-full bg-current/10 transition hover:bg-current/20"
                  [attr.aria-label]="hidden() ? 'Mostrar datos' : 'Ocultar datos'" [attr.aria-pressed]="hidden()"
                  (click)="$event.stopPropagation(); hidden.set(!hidden())">
            @if (hidden()) {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4.5"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.4 5.2A9.8 9.8 0 0 1 12 5c5 0 9 5 9 7a9 9 0 0 1-2.3 3.2M6.2 6.6C4 8 3 10.6 3 12c0 2 4 7 9 7a9.6 9.6 0 0 0 4.2-1" stroke-linecap="round" stroke-linejoin="round"/></svg>
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4.5"><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.5"/></svg>
            }
          </button>
        </div>

        <div class="mt-3 flex flex-1 items-end justify-between gap-4 transition" [class.blur-md]="hidden()" [class.select-none]="hidden()">
          <div class="min-w-0 space-y-2 text-sm">
            @if (card().to) {
              <div><p class="text-[10px] uppercase tracking-wider opacity-60">Para</p><p class="truncate text-base font-bold">{{ card().to }}</p></div>
            }
            @if (card().from) {
              <div><p class="text-[10px] uppercase tracking-wider opacity-60">De parte de</p><p class="truncate font-semibold">{{ card().from }}</p></div>
            }
            <div>
              <p class="inline-block rounded-lg bg-current/10 px-2 py-1 font-mono text-base font-semibold tracking-wider">{{ card().code }}</p>
              <p class="mt-1 text-xs opacity-70">
                @if (card().balance !== card().value) { saldo {{ card().balance | bs }} · }
                vence {{ card().expires | fecha }}
              </p>
            </div>
          </div>
          <div class="shrink-0 rounded-xl bg-white p-2 shadow-lg">
            @if (qr.value(); as src) {
              <img [src]="src" alt="Código QR de la gift card" class="size-24">
            } @else {
              <div class="size-24 animate-pulse rounded bg-neutral-200"></div>
            }
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- controles accesibles (teclado y lector), además de tocar la tarjeta -->
  <div class="mt-3 flex justify-center gap-2">
    <button type="button" class="btn btn-sm rounded-full border-base-300 bg-base-100 text-base-content" (click)="flipped.set(!flipped())">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      {{ flipped() ? 'Ver frente' : 'Ver QR y código' }}
    </button>
    @if (flipped()) {
      <button type="button" class="btn btn-sm rounded-full border-base-300 bg-base-100 text-base-content" (click)="hidden.set(!hidden())">
        {{ hidden() ? 'Mostrar datos' : 'Ocultar datos' }}
      </button>
    }
  </div>
  `,
})
export class GiftcardArt {
  readonly card = input.required<GiftCard>();
  readonly business = input.required<Business>();
  /** De qué lado está y si los datos del revés están difuminados. Son model()
   *  para que la página del regalo los lea y los cambie (botón "Ver QR", código oculto). */
  readonly flipped = model(false);
  readonly hidden = model(false);

  readonly style = computed(() => this.business().cardStyle ?? 'degradado');
  readonly surface = computed(() => cardSurface(this.style(), this.business().color, this.business().logoUrl));
  readonly initial = computed(() => (this.business().name || '?')[0].toUpperCase());

  /** El QR codifica el link público de la carta, así el que la recibe la abre y
   *  el local la escanea para verla/canjear. Se regenera si cambia código o slug. */
  readonly qr = resource({
    params: () => `${this.business().slug}|${this.card().code}`,
    loader: ({ params }) => {
      const [slug, code] = params.split('|');
      const url = `${location.origin}${giftPath(slug, code)}`;
      return QRCode.toDataURL(url, { margin: 1, width: 240 });
    },
  });
}

/** La página pública del regalo: `/{slug}/g/{code}`. Lo que se abre al compartir.
 *  Es una experiencia, no un comprobante: fondo con la paleta del comercio, titular
 *  personal, la tarjeta flotando, cómo usarla y confeti si está activa. */
@Component({
  selector: 'app-giftcard-view',
  imports: [GiftcardArt, BsPipe, FechaPipe, Wordmark],
  template: `
    @if (page.isLoading()) {
      <div class="grid min-h-dvh place-items-center bg-base-200"><span class="loading loading-spinner loading-lg"></span></div>
    } @else if (page.hasValue() && page.value(); as p) {
      <div class="storefront sf-hero relative min-h-dvh overflow-hidden text-white" [style.--c1]="p.business.color">
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <span class="blob blob-1" style="background:var(--c1)"></span>
          <span class="blob blob-2" style="background:var(--c2)"></span>
          <span class="blob blob-3" style="background:var(--c3)"></span>
          <div class="dotgrid-light absolute inset-0"></div>
        </div>

        @if (state(p.card) === 'activa') {
          <div class="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
            @for (c of confetti; track $index) {
              <span class="confetti" [style.left.%]="c.left" [style.width.px]="c.w" [style.background]="c.color"
                    [style.--d]="c.dur + 's'" [style.--delay]="c.delay + 's'" [style.--r]="c.rot + 'deg'"></span>
            }
          </div>
        }

        <header class="relative z-10 mx-auto flex max-w-md items-center gap-3 px-5 py-4">
          <div class="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/10 text-[9px] text-white/50 ring-1 ring-white/20">
            @if (p.business.logoUrl) { <img [src]="p.business.logoUrl" alt="" class="size-full object-cover"> } @else { logo }
          </div>
          <p class="min-w-0 flex-1 truncate font-semibold tracking-tight">{{ p.business.name }}</p>
        </header>

        <main class="relative z-10 mx-auto max-w-md px-5 pb-10 pt-4">
          <p class="reveal text-center text-sm font-medium text-white/70">🎁 Tienes un regalo</p>
          <h1 class="reveal reveal-1 mt-2 text-center text-[2.4rem] font-extrabold leading-[1] tracking-[-0.045em] text-balance">
            {{ p.card.to }}, te regalaron <span class="text-aurora">{{ p.card.value | bs }}</span>
          </h1>
          <p class="reveal reveal-2 mt-3 text-center text-white/75">
            @if (p.card.from) { De parte de <span class="font-semibold text-white">{{ p.card.from }}</span>, para usar en }
            @else { Para usar en }
            <span class="font-semibold text-white">{{ p.business.name }}</span>
          </p>

          <div class="pop mt-8" style="animation-delay:.25s">
            <div class="float" [class.grayscale]="state(p.card) !== 'activa'" [class.opacity-70]="state(p.card) !== 'activa'">
              <app-giftcard-art [card]="p.card" [business]="p.business" [(flipped)]="flipped" [(hidden)]="hidden" />
            </div>
          </div>

          <section class="reveal reveal-4 mt-10 rounded-[2rem] bg-base-100 p-6 text-base-content shadow-2xl shadow-black/40">
            @switch (state(p.card)) {
              @case ('canjeada') {
                <p class="text-center text-lg font-bold text-error">Esta gift card ya fue usada.</p>
                <p class="mt-1 text-center text-sm text-base-content/60">Ya no le queda saldo. ¡Esperamos que la hayas disfrutado!</p>
              }
              @case ('vencida') {
                <p class="text-center text-lg font-bold text-error">Esta gift card venció.</p>
                <p class="mt-1 text-center text-sm text-base-content/60">Venció el {{ p.card.expires | fecha }}. Consulta con {{ p.business.name }}.</p>
              }
              @default {
                <p class="text-xs font-semibold uppercase tracking-wider text-base-content/50">Cómo usarla</p>
                <ol class="mt-4 space-y-5">
                  <li class="flex gap-3">
                    <span class="grid size-8 shrink-0 place-items-center rounded-full bg-success text-sm font-bold text-success-content">1</span>
                    <div>
                      <p class="font-semibold">Ve a {{ p.business.name }}</p>
                      <p class="text-sm text-base-content/60">Cuando quieras, antes del {{ p.card.expires | fecha }}.</p>
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <span class="grid size-8 shrink-0 place-items-center rounded-full bg-success text-sm font-bold text-success-content">2</span>
                    <div class="min-w-0 flex-1">
                      <p class="font-semibold">Muestra el QR o el código</p>
                      <p class="text-sm text-base-content/60">Están al reverso de la tarjeta.</p>
                      <div class="mt-2 flex gap-2">
                        <button type="button" class="btn btn-sm flex-1 rounded-full" (click)="flipped.set(true); hidden.set(false); scrollTop()">Ver QR</button>
                        <button type="button" (click)="copy(p.card.code)"
                                class="flex flex-[2] items-center justify-between gap-2 rounded-full bg-base-200 px-4 py-1.5 transition active:scale-[.98]">
                          <span class="font-mono font-bold tracking-wider">{{ hidden() ? '••••-•••' : p.card.code }}</span>
                          <span class="text-xs font-semibold text-success">{{ copied() ? '¡Copiado!' : 'Copiar' }}</span>
                        </button>
                      </div>
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <span class="grid size-8 shrink-0 place-items-center rounded-full bg-success text-sm font-bold text-success-content">3</span>
                    <div>
                      <p class="font-semibold">¡Disfrútala!</p>
                      <p class="text-sm text-base-content/60">
                        Te queda {{ p.card.balance | bs }}. Si no usas todo, el saldo queda para la próxima.
                      </p>
                    </div>
                  </li>
                </ol>
              }
            }
            @if (p.business.terms) {
              <p class="mt-6 border-t border-base-200 pt-4 text-center text-xs text-base-content/50">{{ p.business.terms }}</p>
            }
            <p class="mt-4 flex items-center justify-center gap-1.5 text-xs text-base-content/40">Hecho con <app-wordmark /></p>
          </section>
        </main>
      </div>
    } @else {
      <div class="grid min-h-dvh place-items-center bg-base-200 p-6 text-center">
        <div>
          <p class="text-lg font-medium">No encontramos esta gift card.</p>
          <p class="mt-1 text-base-content/60">El link puede estar mal o la página no está publicada.</p>
        </div>
      </div>
    }
  `,
})
export class GiftCardView {
  private readonly store = inject(Store);
  readonly slug = input<string>('');
  readonly code = input<string>('');
  readonly page = this.store.publicCard(() => `${this.slug()}|${this.code()}`);
  readonly state = (c: GiftCard) => cardState(c);
  readonly copied = signal(false);
  readonly flipped = signal(false);
  readonly hidden = signal(false);
  scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  /** Confeti al abrir el regalo: posiciones al azar una sola vez, colores de la paleta. */
  readonly confetti = Array.from({ length: 44 }, (_, i) => ({
    left: Math.random() * 100,
    w: 6 + Math.random() * 6,
    dur: 2 + Math.random() * 1.6,
    delay: 0.3 + Math.random() * 0.6,
    rot: Math.round(Math.random() * 720 - 360),
    color: ['var(--c1-soft)', 'var(--c2)', 'var(--c3)', 'var(--color-success)', '#facc15'][i % 5],
  }));

  async copy(code: string) {
    try { await navigator.clipboard.writeText(code); this.copied.set(true); } catch { /* sin clipboard */ }
  }
}
