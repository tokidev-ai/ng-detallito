import { Component, computed, inject, input, resource, signal } from '@angular/core';
import QRCode from 'qrcode';
import { Business, GiftCard, Store, cardState } from './data';
import { giftPath } from './card';
import { BsPipe, FechaPipe, onBrand } from './ui';
import { Wordmark } from './brand';

/** El diseño de la gift card: color y logo del comercio, monto, para/de, código
 *  y un QR que lleva a esta misma página pública. Se reutiliza en el panel (para
 *  mandarla), en el checkout (recién comprada) y en la página pública del regalo. */
@Component({
  selector: 'app-giftcard-art',
  imports: [BsPipe, FechaPipe],
  template: `
  <!-- .storefront solo para heredar la paleta derivada (--c2) del color del comercio -->
  <div class="storefront shine relative overflow-hidden rounded-2xl shadow-2xl" [style.--c1]="business().color"
       [style.background-color]="business().color" style="background-image:linear-gradient(135deg,var(--c1),var(--c2))"
       [style.color]="ink()">
    <!-- decoración: dos círculos como en las tarjetas de banco -->
    <span class="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-white/15" aria-hidden="true"></span>
    <span class="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-black/10" aria-hidden="true"></span>

    <div class="relative p-5 sm:p-6">
      <div class="flex items-center gap-3">
        <div class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white/25 text-[10px] ring-2 ring-white/30">
          @if (business().logoUrl) { <img [src]="business().logoUrl" alt="" class="size-full object-cover"> }
          @else { logo }
        </div>
        <p class="min-w-0 flex-1 truncate font-semibold">{{ business().name }}</p>
        <span class="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">🎁 Gift card</span>
      </div>

      <p class="mt-6 text-[3.25rem] font-extrabold leading-none tracking-[-0.03em] tabular-nums">{{ card().value | bs }}</p>
      @if (card().balance !== card().value) {
        <p class="mt-1 text-sm font-medium opacity-85">saldo disponible {{ card().balance | bs }}</p>
      }

      <!-- corte tipo ticket -->
      <div class="relative my-5 border-t-2 border-dashed border-white/35"></div>

      <div class="flex items-end justify-between gap-4">
        <div class="min-w-0 space-y-2 text-sm">
          @if (card().to) {
            <div><p class="text-[10px] uppercase tracking-wider opacity-70">Para</p><p class="truncate text-base font-bold">{{ card().to }}</p></div>
          }
          @if (card().from) {
            <div><p class="text-[10px] uppercase tracking-wider opacity-70">De parte de</p><p class="truncate font-semibold">{{ card().from }}</p></div>
          }
          <div>
            <p class="inline-block rounded-lg bg-black/15 px-2 py-1 font-mono text-base font-semibold tracking-wider">{{ card().code }}</p>
            <p class="mt-1 text-xs opacity-75">vence {{ card().expires | fecha }}</p>
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
  `,
})
export class GiftcardArt {
  readonly card = input.required<GiftCard>();
  readonly business = input.required<Business>();
  readonly ink = computed(() => onBrand(this.business().color));

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
              <app-giftcard-art [card]="p.card" [business]="p.business" />
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
                      <button type="button" (click)="copy(p.card.code)"
                              class="mt-2 flex w-full items-center justify-between gap-2 rounded-2xl bg-base-200 px-4 py-3 transition active:scale-[.98]">
                        <span class="font-mono text-lg font-bold tracking-wider">{{ p.card.code }}</span>
                        <span class="text-xs font-semibold text-success">{{ copied() ? '¡Copiado!' : 'Copiar' }}</span>
                      </button>
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
