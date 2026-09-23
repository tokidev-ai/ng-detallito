import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsPipe, onBrand } from './ui';
import { Business, Product, Store } from './data';
import { expiryFrom, newCode } from './card';

/** La página pública del comercio. Se usa tal cual en /:slug y dentro del
 *  wizard como vista previa en vivo — misma plantilla, distinto contenedor. */
@Component({
  selector: 'app-storefront',
  imports: [FormsModule, BsPipe],
  template: `
    <div class="storefront flex h-full flex-col bg-base-100 text-base-content" [style.--brand]="b().color">
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
          {{ b().description || 'Cuenta en una línea qué ofreces.' }}
        </p>

        <!-- compra hecha: mostramos el código y salimos -->
        @if (issued(); as code) {
          <div class="mt-6 rounded-box border border-base-300 bg-base-200/50 p-5 text-center">
            <p class="text-sm text-base-content/60">¡Listo! Tu gift card</p>
            <p class="mt-1 font-mono text-2xl font-semibold">{{ code }}</p>
            <p class="mt-2 text-sm text-base-content/60">
              {{ selected()!.kind === 'open' ? (amount | bs) : (selected()!.amount | bs) }} ·
              vence {{ b().validityMonths }} meses desde hoy
            </p>
            <button type="button" class="btn btn-ghost btn-sm mt-3" (click)="reset()">Comprar otra</button>
          </div>
        } @else {
          <p class="mt-6 text-xs uppercase tracking-wider text-base-content/50">Elige el monto</p>
          <div class="mt-2 grid grid-cols-2 gap-2">
            @for (p of buyable(); track p.id) {
              <button type="button" (click)="pick(p)"
                class="btn h-auto justify-between px-3 py-3 font-normal normal-case"
                [class.btn-outline]="selected() !== p"
                [class.btn-primary]="selected() === p">
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

          <!-- datos de la compra: solo en la página real, con un monto elegido -->
          @if (interactive() && selected(); as p) {
            <div class="mt-3 space-y-2">
              @if (p.kind === 'open') {
                <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="amount" name="amount"
                       [placeholder]="'Monto entre ' + (p.min | bs) + ' y ' + (p.max | bs)">
              }
              <input class="input input-bordered input-sm w-full" [(ngModel)]="to" name="to"
                     placeholder="¿Para quién? (nombre)">
            </div>
          }

          <button type="button" class="btn mt-4 w-full"
                  [disabled]="busy() || (interactive() && !canBuy())"
                  [style.background-color]="b().color" [style.color]="onBrand()"
                  (click)="buy()">
            {{ busy() ? 'Emitiendo…' : 'Comprar' }}
          </button>

          <p class="mt-3 text-center text-xs text-base-content/50">
            Vence en {{ b().validityMonths }} meses · términos del comercio
          </p>
        }
      </div>
    </div>
  `,
})
export class Storefront {
  private readonly store = inject(Store);

  /** Sin inputs usa el store — así /:slug no necesita pasarle nada. */
  readonly business = input<Business | null>(null);
  readonly productList = input<Product[] | null>(null);
  /** Solo la página pública real es interactiva; la vista previa del wizard, no. */
  readonly interactive = input(false);
  readonly tenantId = input<string | null>(null);

  readonly b = computed(() => this.business() ?? this.store.business());
  readonly buyable = computed(() => (this.productList() ?? this.store.products()).slice(0, 4));
  readonly onBrand = computed(() => onBrand(this.b().color));

  // ── compra ───────────────────────────────────────────────────────────────
  readonly selected = signal<Product | null>(null);
  readonly busy = signal(false);
  readonly issued = signal<string | null>(null);
  to = '';
  amount: number | null = null;

  pick(p: Product) { this.selected.set(p); if (p.kind !== 'open') this.amount = p.amount ?? null; }

  canBuy(): boolean {
    const p = this.selected();
    if (!p || !this.to.trim()) return false;
    if (p.kind !== 'open') return true;
    return this.amount != null && this.amount >= (p.min ?? 0) && this.amount <= (p.max ?? Infinity);
  }

  async buy() {
    const id = this.tenantId();
    if (!this.interactive() || !id || !this.canBuy() || this.busy()) return;
    const p = this.selected()!;
    const value = p.kind === 'open' ? this.amount! : p.amount!;
    const code = newCode();
    this.busy.set(true);
    try {
      await this.store.issueCard(id, {
        code, to: this.to.trim(), value, balance: value,
        expires: expiryFrom(this.b().validityMonths),
      });
      this.issued.set(code);
    } finally {
      this.busy.set(false);
    }
  }

  reset() { this.issued.set(null); this.selected.set(null); this.to = ''; this.amount = null; }
}

@Component({
  selector: 'app-storefront-page',
  imports: [Storefront],
  template: `
    @if (page.isLoading()) {
      <div class="grid min-h-dvh place-items-center"><span class="loading loading-spinner"></span></div>
    } @else if (page.hasValue() && page.value(); as p) {
      <div class="storefront min-h-dvh bg-base-200">
        <div class="mx-auto min-h-dvh max-w-md bg-base-100 shadow-sm">
          <app-storefront [business]="p.tenant.business" [productList]="p.products"
                          [interactive]="true" [tenantId]="p.tenant.id" />
        </div>
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
