import { Component, computed, inject, input, resource } from '@angular/core';
import QRCode from 'qrcode';
import { Business, GiftCard, Store, cardState } from './data';
import { giftPath } from './card';
import { BsPipe, FechaPipe, onBrand } from './ui';

/** El diseño de la gift card: color y logo del comercio, monto, para/de, código
 *  y un QR que lleva a esta misma página pública. Se reutiliza en el panel (para
 *  mandarla), en el checkout (recién comprada) y en la página pública del regalo. */
@Component({
  selector: 'app-giftcard-art',
  imports: [BsPipe, FechaPipe],
  template: `
  <div class="overflow-hidden rounded-2xl shadow-lg" [style.background-color]="business().color" [style.color]="ink()">
    <div class="p-5 sm:p-6">
      <div class="flex items-center gap-3">
        <div class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white/20 text-[10px]">
          @if (business().logoUrl) { <img [src]="business().logoUrl" alt="" class="size-full object-cover"> }
          @else { logo }
        </div>
        <p class="min-w-0 flex-1 truncate font-semibold">{{ business().name }}</p>
        <span class="text-[11px] uppercase tracking-[0.2em] opacity-75">Gift card</span>
      </div>

      <p class="mt-6 text-5xl font-bold tabular-nums">{{ card().value | bs }}</p>
      @if (card().balance !== card().value) {
        <p class="text-sm opacity-80">saldo disponible {{ card().balance | bs }}</p>
      }

      <div class="mt-5 flex items-end justify-between gap-4">
        <div class="min-w-0 space-y-0.5 text-sm">
          @if (card().to) { <p class="truncate"><span class="opacity-70">Para</span> · {{ card().to }}</p> }
          @if (card().from) { <p class="truncate"><span class="opacity-70">De</span> · {{ card().from }}</p> }
          <p class="pt-1 font-mono text-base tracking-wide">{{ card().code }}</p>
          <p class="text-xs opacity-70">vence {{ card().expires | fecha }}</p>
        </div>
        <div class="shrink-0 rounded-xl bg-white p-2">
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

/** La página pública del regalo: `/{slug}/g/{code}`. Lo que se abre al compartir. */
@Component({
  selector: 'app-giftcard-view',
  imports: [GiftcardArt],
  template: `
    <div class="min-h-dvh bg-base-200 p-4">
      @if (page.isLoading()) {
        <div class="grid min-h-dvh place-items-center"><span class="loading loading-spinner"></span></div>
      } @else if (page.value(); as p) {
        <div class="mx-auto grid min-h-dvh max-w-sm place-items-center">
          <div class="w-full py-8">
            <app-giftcard-art [card]="p.card" [business]="p.business" />

            <div class="mt-4 rounded-box border border-base-300 bg-base-100 p-4 text-center text-sm">
              @switch (state(p.card)) {
                @case ('canjeada') { <p class="font-medium text-error">Esta gift card ya fue usada.</p> }
                @case ('vencida') { <p class="font-medium text-error">Esta gift card venció.</p> }
                @default {
                  <p class="text-base-content/70">
                    Muestra este código o el QR en <span class="font-medium text-base-content">{{ p.business.name }}</span> para usar tu gift card.
                  </p>
                }
              }
              @if (p.business.terms) {
                <p class="mt-3 border-t border-base-200 pt-3 text-xs text-base-content/55">{{ p.business.terms }}</p>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="grid min-h-dvh place-items-center text-center">
          <div>
            <p class="text-lg font-medium">No encontramos esta gift card.</p>
            <p class="mt-1 text-base-content/60">El link puede estar mal o la página no está publicada.</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class GiftCardView {
  private readonly store = inject(Store);
  readonly slug = input<string>('');
  readonly code = input<string>('');
  readonly page = this.store.publicCard(() => `${this.slug()}|${this.code()}`);
  readonly state = (c: GiftCard) => cardState(c);
}
