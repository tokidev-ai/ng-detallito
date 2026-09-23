import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsPipe, onBrand } from './ui';
import { Business, GiftCard, Store } from './data';
import { expiryFrom, giftMessage, giftPath, mailtoLink, newCode, waLink } from './card';
import { GiftcardArt } from './giftcard';

/** La página pública del comercio: comprar una gift card en pasos. Se usa tal
 *  cual en /:slug y como vista previa en vivo del wizard (ahí no es interactiva,
 *  se queda en el primer paso). El color y el logo son los del comercio. */
@Component({
  selector: 'app-storefront',
  imports: [FormsModule, BsPipe, GiftcardArt],
  template: `
    <div class="storefront flex h-full flex-col bg-base-100 text-base-content">
      <!-- portada con el color de marca -->
      <div class="relative aspect-[16/7] w-full" [style.background-color]="b().color">
        <div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]"></div>
      </div>

      <div class="flex-1 p-5">
        <div class="-mt-12 flex items-end gap-3">
          <div class="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-base-100 bg-base-200 text-[10px] text-base-content/40 shadow-sm">
            @if (b().logoUrl) { <img [src]="b().logoUrl" alt="" class="size-full object-cover"> } @else { logo }
          </div>
          <div class="min-w-0 pb-1">
            <p class="truncate text-lg font-semibold leading-tight">{{ b().name || 'Tu comercio' }}</p>
            @if (b().slug) { <p class="truncate text-xs text-base-content/50">giftcards.bo/{{ b().slug }}</p> }
          </div>
        </div>

        <p class="mt-3 text-sm text-base-content/70">
          {{ b().description || 'Cuenta en una línea qué ofreces.' }}
        </p>

        <!-- ── compra terminada: la gift card lista para compartir ── -->
        @if (issuedCard(); as card) {
          <div class="mt-6">
            <p class="text-center text-sm font-medium text-base-content/70">🎉 ¡Tu gift card está lista!</p>
            <div class="mt-3"><app-giftcard-art [card]="card" [business]="b()" /></div>

            <p class="mt-5 text-center text-xs uppercase tracking-wider text-base-content/50">Enviásela a quien la recibe</p>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <a class="btn gap-2 text-white" style="background-color:#25D366;border-color:#25D366"
                 [href]="waHref()" target="_blank" rel="noopener">WhatsApp</a>
              <a class="btn btn-outline gap-2" [href]="mailHref()">Correo</a>
            </div>
            <button type="button" class="btn btn-ghost btn-sm mt-2 w-full" (click)="copy()">
              {{ copied() ? '¡Link copiado!' : 'Copiar link' }}
            </button>
            <button type="button" class="btn btn-ghost btn-sm mt-1 w-full" (click)="reset()">Comprar otra</button>
          </div>

        <!-- ── pasos de compra ── -->
        } @else {
          @if (interactive()) {
            <div class="mt-6 flex items-center gap-1.5">
              @for (i of [0, 1, 2]; track i) {
                <span class="h-1.5 flex-1 rounded-full transition-colors"
                      [style.background-color]="i <= step() ? b().color : 'var(--fallback-b3,#e5e5e5)'"></span>
              }
            </div>
          }

          @switch (view()) {
            <!-- paso 1: monto -->
            @case (0) {
              <p class="mt-5 text-xs uppercase tracking-wider text-base-content/50">Elegí el monto</p>
              @if (amounts().length) {
                <div class="mt-2 grid grid-cols-3 gap-2">
                  @for (a of amounts(); track a) {
                    <button type="button" (click)="pick(a)"
                      class="btn font-semibold normal-case"
                      [class.btn-outline]="amount !== a"
                      [style.background-color]="amount === a ? b().color : ''"
                      [style.color]="amount === a ? onBrand() : ''"
                      [style.border-color]="amount === a ? b().color : ''">
                      {{ a | bs }}
                    </button>
                  }
                </div>
              }
              <input type="number" min="1" class="input input-bordered mt-2 w-full" [(ngModel)]="amount" name="amount"
                     [placeholder]="amounts().length ? 'Otro monto (Bs)' : 'Monto de la gift card (Bs)'">

              <button type="button" class="btn mt-4 w-full border-none"
                      [disabled]="!amount || amount < 1"
                      [style.background-color]="b().color" [style.color]="onBrand()"
                      (click)="next()">Continuar</button>
              <p class="mt-3 text-center text-xs text-base-content/50">
                Vence en {{ b().validityMonths }} meses · términos del comercio
              </p>
            }

            <!-- paso 2: para quién / de parte de -->
            @case (1) {
              <p class="mt-5 text-xs uppercase tracking-wider text-base-content/50">¿Para quién es?</p>
              <input class="input input-bordered mt-2 w-full" [(ngModel)]="to" name="to" placeholder="Nombre de quien la recibe">
              <input class="input input-bordered mt-2 w-full" [(ngModel)]="from" name="from"
                     placeholder="De parte de… (opcional)">
              <p class="mt-1 text-xs text-base-content/50">Dejalo vacío si querés que el regalo sea anónimo.</p>

              <div class="mt-4 flex gap-2">
                <button type="button" class="btn btn-ghost flex-1" (click)="back()">Atrás</button>
                <button type="button" class="btn flex-1 border-none" [disabled]="!to.trim()"
                        [style.background-color]="b().color" [style.color]="onBrand()"
                        (click)="next()">Continuar</button>
              </div>
            }

            <!-- paso 3: revisar y comprar -->
            @case (2) {
              <p class="mt-5 text-xs uppercase tracking-wider text-base-content/50">Revisá y confirmá</p>
              <dl class="mt-2 divide-y divide-base-200 rounded-box border border-base-300">
                <div class="flex justify-between gap-3 p-3"><dt class="text-base-content/55">Monto</dt><dd class="font-semibold tabular-nums">{{ amount | bs }}</dd></div>
                <div class="flex justify-between gap-3 p-3"><dt class="text-base-content/55">Para</dt><dd>{{ to }}</dd></div>
                @if (from.trim()) {
                  <div class="flex justify-between gap-3 p-3"><dt class="text-base-content/55">De parte de</dt><dd>{{ from }}</dd></div>
                }
                <div class="flex justify-between gap-3 p-3"><dt class="text-base-content/55">Vence</dt><dd>{{ b().validityMonths }} meses desde hoy</dd></div>
              </dl>

              <div class="mt-4 flex gap-2">
                <button type="button" class="btn btn-ghost flex-1" (click)="back()" [disabled]="busy()">Atrás</button>
                <button type="button" class="btn flex-1 border-none" [disabled]="busy()"
                        [style.background-color]="b().color" [style.color]="onBrand()"
                        (click)="buy()">{{ busy() ? 'Emitiendo…' : 'Comprar' }}</button>
              </div>
              @if (error()) { <p class="mt-2 text-center text-sm text-error">{{ error() }}</p> }
              <p class="mt-3 text-center text-xs text-base-content/50">
                El pago se coordina con el comercio.
              </p>
            }
          }
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

  // ── compra por pasos ───────────────────────────────────────────────────────
  readonly step = signal(0);
  /** La preview del wizard se queda en el primer paso. */
  readonly view = computed(() => (this.interactive() ? this.step() : 0));
  readonly busy = signal(false);
  readonly issuedCard = signal<GiftCard | null>(null);
  readonly copied = signal(false);
  readonly error = signal('');
  to = '';
  from = '';
  amount: number | null = null;

  pick(a: number) { this.amount = a; }
  back() { this.step.update(s => Math.max(0, s - 1)); }
  next() { if (this.interactive()) this.step.update(s => Math.min(2, s + 1)); }

  async buy() {
    const id = this.tenantId();
    if (!id || !this.to.trim() || !this.amount || this.amount < 1 || this.busy()) return;
    const value = this.amount;
    const card: GiftCard = {
      code: newCode(), to: this.to.trim(), value, balance: value,
      expires: expiryFrom(this.b().validityMonths),
      ...(this.from.trim() ? { from: this.from.trim() } : {}),
    };
    this.busy.set(true);
    this.error.set('');
    try {
      await this.store.issueCard(id, card);
      this.issuedCard.set(card);
    } catch {
      this.error.set('No pudimos emitir la gift card. Probá de nuevo en un momento.');
    } finally {
      this.busy.set(false);
    }
  }

  private shareUrl() { return `${location.origin}${giftPath(this.b().slug, this.issuedCard()!.code)}`; }
  waHref() { return waLink(giftMessage(this.b().name, this.shareUrl(), this.issuedCard()!)); }
  mailHref() {
    return mailtoLink(`Tu gift card de ${this.b().name}`, giftMessage(this.b().name, this.shareUrl(), this.issuedCard()!));
  }
  async copy() {
    try { await navigator.clipboard.writeText(this.shareUrl()); this.copied.set(true); } catch { /* sin clipboard */ }
  }

  reset() {
    this.issuedCard.set(null); this.copied.set(false); this.error.set(''); this.step.set(0);
    this.to = ''; this.from = ''; this.amount = null;
  }
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
