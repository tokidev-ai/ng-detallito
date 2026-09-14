import { Component, computed, inject, input } from '@angular/core';
import { BsPipe, onBrand } from './ui';
import { Business, Product, Store } from './data';

/** La página pública del comercio. Se usa tal cual en /:slug y dentro del
 *  wizard como vista previa en vivo — misma plantilla, distinto contenedor. */
@Component({
  selector: 'app-storefront',
  imports: [BsPipe],
  template: `
    <div class="flex h-full flex-col bg-base-100" [style.--brand]="b().color">
      <div class="aspect-[16/7] w-full bg-base-300/60 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,.05)_6px,rgba(0,0,0,.05)_12px)]"></div>

      <div class="flex-1 p-5">
        <div class="flex items-center gap-3">
          <div class="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border border-base-300 bg-base-200 text-[10px] text-base-content/40">
            @if (b().logoUrl) { <img [src]="b().logoUrl" alt="" class="size-full object-cover"> } @else { logo }
          </div>
          <div class="min-w-0">
            <p class="truncate text-lg font-semibold">{{ b().name || 'Tu comercio' }}</p>
            @if (b().slug) { <p class="truncate text-xs text-base-content/50">giftcards.bo/{{ b().slug }}</p> }
          </div>
        </div>

        <p class="mt-3 text-sm text-base-content/70">
          {{ b().description || 'Contá en una línea qué ofrecés.' }}
        </p>

        <p class="mt-6 text-xs uppercase tracking-wider text-base-content/50">Elegí el monto</p>
        <div class="mt-2 grid grid-cols-2 gap-2">
          @for (p of buyable(); track p.id) {
            <button type="button"
              class="btn btn-outline h-auto justify-between px-3 py-3 font-normal normal-case">
              <span class="truncate text-left text-sm">{{ p.kind === 'fixed' ? '' : p.name }}</span>
              <span class="font-semibold">
                {{ p.kind === 'open' ? (p.min | bs) + '+' : (p.amount | bs) }}
              </span>
            </button>
          } @empty {
            <p class="col-span-2 rounded-field border border-dashed border-base-300 p-4 text-center text-sm text-base-content/50">
              Todavía no cargaste productos.
            </p>
          }
        </div>

        <button type="button" class="btn mt-4 w-full text-[--brand-contrast]"
                [style.background-color]="b().color" [style.color]="onBrand()">
          Comprar
        </button>

        <p class="mt-3 text-center text-xs text-base-content/50">
          Vence en {{ b().validityMonths }} meses · términos del comercio
        </p>
      </div>
    </div>
  `,
})
export class Storefront {
  private readonly store = inject(Store);

  /** Sin inputs usa el store — así /:slug no necesita pasarle nada. */
  readonly business = input<Business | null>(null);
  readonly productList = input<Product[] | null>(null);

  readonly b = computed(() => this.business() ?? this.store.business());
  readonly buyable = computed(() => (this.productList() ?? this.store.products()).slice(0, 4));

  readonly onBrand = computed(() => onBrand(this.b().color));
}

@Component({
  selector: 'app-storefront-page',
  imports: [Storefront],
  template: `
    @if (page.isLoading()) {
      <div class="grid min-h-dvh place-items-center"><span class="loading loading-spinner"></span></div>
    } @else if (page.value(); as p) {
      <div class="mx-auto min-h-dvh max-w-md bg-base-100 shadow-sm">
        <app-storefront [business]="p.tenant.business" [productList]="p.products" />
      </div>
    } @else {
      <div class="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p class="text-lg font-medium">No encontramos esta página.</p>
          <p class="mt-1 text-base-content/60">giftcards.bo/{{ slug() }}</p>
        </div>
      </div>
    }
  `,
})
export class StorefrontPage {
  private readonly store = inject(Store);
  readonly slug = input<string>('');
  readonly page = this.store.publicTenant(() => this.slug());
}
