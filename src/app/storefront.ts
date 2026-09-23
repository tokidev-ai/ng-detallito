import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsPipe, onBrand } from './ui';
import { Business, Store } from './data';
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
              {{ amount | bs }} · vence {{ b().validityMonths }} meses desde hoy
            </p>
            <button type="button" class="btn btn-ghost btn-sm mt-3" (click)="reset()">Comprar otra</button>
          </div>
        } @else {
          <p class="mt-6 text-xs uppercase tracking-wider text-base-content/50">Elige el monto</p>
          @if (amounts().length) {
            <div class="mt-2 grid grid-cols-3 gap-2">
              @for (a of amounts(); track a) {
                <button type="button" (click)="pick(a)"
                  class="btn font-semibold normal-case"
                  [class.btn-outline]="amount !== a" [class.btn-primary]="amount === a">
                  {{ a | bs }}
                </button>
              }
            </div>
          }

          <!-- monto libre: siempre disponible, con o sin sugeridos -->
          <input type="number" min="1" class="input input-bordered mt-2 w-full" [(ngModel)]="amount" name="amount"
                 [placeholder]="amounts().length ? 'Otro monto (Bs)' : 'Monto de la gift card (Bs)'">

          <!-- para quién: solo en la página real -->
          @if (interactive()) {
            <input class="input input-bordered mt-2 w-full" [(ngModel)]="to" name="to"
                   placeholder="¿Para quién? (nombre)">
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
  /** Solo la página pública real es interactiva; la vista previa del wizard, no. */
  readonly interactive = input(false);
  readonly tenantId = input<string | null>(null);

  readonly b = computed(() => this.business() ?? this.store.business());
  readonly amounts = computed(() => this.b().suggestedAmounts ?? []);
  readonly onBrand = computed(() => onBrand(this.b().color));

  // ── compra ───────────────────────────────────────────────────────────────
  readonly busy = signal(false);
  readonly issued = signal<string | null>(null);
  to = '';
  amount: number | null = null;

  pick(a: number) { this.amount = a; }

  canBuy(): boolean {
    return !!this.to.trim() && this.amount != null && this.amount > 0;
  }

  async buy() {
    const id = this.tenantId();
    if (!this.interactive() || !id || !this.canBuy() || this.busy()) return;
    const value = this.amount!;
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

  reset() { this.issued.set(null); this.to = ''; this.amount = null; }
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
          <app-storefront [business]="p.tenant.business"
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
