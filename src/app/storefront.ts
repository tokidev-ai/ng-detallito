import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsPipe, onBrand } from './ui';
import { Business, GiftCard, Store } from './data';
import { expiryFrom, giftMessage, giftPath, mailtoLink, newCode, waLink } from './card';
import { GiftcardArt } from './giftcard';
import { Wordmark } from './brand';
// ponytail: sin `reveal` acá — la animación de entrada se traga la tarjeta en la
// preview embebida del panel. La página igual queda atractiva sin ella.

/** La página pública del comercio: comprar una gift card en pasos. Se usa tal
 *  cual en /:slug y como vista previa en vivo del wizard (ahí no es interactiva,
 *  se queda en el primer paso). El color y el logo son los del comercio. */
@Component({
  selector: 'app-storefront',
  imports: [FormsModule, BsPipe, GiftcardArt, Wordmark],
  template: `
    <div class="storefront flex flex-col bg-base-100 text-base-content" [class.min-h-dvh]="interactive()">

      <!-- barra superior -->
      <header class="sticky top-0 z-30 border-b border-base-300 bg-base-100/85 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3 sm:px-8">
          <div class="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-base-300 bg-base-200 text-[9px] text-base-content/40">
            @if (b().logoUrl) { <img [src]="b().logoUrl" alt="" class="size-full object-cover"> } @else { logo }
          </div>
          <p class="min-w-0 flex-1 truncate font-semibold tracking-tight">{{ b().name || 'Tu comercio' }}</p>
          <span class="hidden text-xs text-base-content/45 sm:block">giftcards.bo/{{ b().slug || 'tu-link' }}</span>
        </div>
      </header>

      <!-- hero: la sección centra el contenido verticalmente en todos los tamaños;
           el grid de dos columnas resuelve el layout horizontal en desktop -->
      <section class="relative flex flex-1 flex-col justify-center overflow-hidden">
        <div class="dotgrid pointer-events-none absolute inset-0" aria-hidden="true"></div>
        <div class="pointer-events-none absolute -right-28 -top-28 size-96 rounded-full opacity-[0.12] blur-3xl"
             [style.background-color]="b().color" aria-hidden="true"></div>

        <div class="relative mx-auto grid w-full max-w-6xl gap-x-12 gap-y-8 px-5 py-8 text-center sm:px-8 sm:py-12 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-y-8 lg:py-16 lg:text-left">

          <!-- 1 · título -->
          <h1 class="order-1 text-[2.5rem] font-extrabold leading-[0.98] tracking-[-0.04em] text-balance sm:text-5xl lg:col-start-1 lg:row-start-1 lg:self-end lg:text-[3.75rem] lg:leading-[0.95]">
            Regala una gift card de
            <span class="relative inline-block" [style.color]="b().color">
              {{ b().name || 'tu comercio' }}
              <svg class="subrayado absolute -bottom-1.5 left-0 w-full" height="14"
                   viewBox="0 0 200 14" preserveAspectRatio="none" fill="none" aria-hidden="true">
                <path d="M3 9.5C42 4 86 2.6 130 4.2c25 .9 48 2.6 67 5.3"
                      stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
              </svg>
            </span>
          </h1>

          <!-- 2 · tarjeta de compra -->
          <div class="relative order-2 text-left lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center">
            <div class="pointer-events-none absolute -inset-3 rounded-[2rem] opacity-20 blur-2xl"
                 [style.background-color]="b().color" aria-hidden="true"></div>

            <div class="relative rounded-3xl border border-base-300 bg-base-100 p-5 shadow-xl sm:p-7">

              <!-- ── compra terminada ── -->
              @if (issuedCard(); as card) {
                <p class="reveal text-center text-sm font-medium text-base-content/70">
                  <span class="pop inline-block">🎉</span> ¡Tu gift card está lista!
                </p>
                <div class="pop mt-3" style="animation-delay:.08s"><app-giftcard-art [card]="card" [business]="b()" /></div>
                <p class="reveal reveal-3 mt-5 text-center text-xs uppercase tracking-wider text-base-content/50">Envíasela a quien la recibe</p>
                <div class="reveal reveal-4 mt-2 grid grid-cols-2 gap-2">
                  <a class="btn gap-2 text-white" style="background-color:#25D366;border-color:#25D366"
                     [href]="waHref()" target="_blank" rel="noopener">WhatsApp</a>
                  <a class="btn btn-outline gap-2" [href]="mailHref()">Correo</a>
                </div>
                <button type="button" class="reveal reveal-5 btn btn-ghost btn-sm mt-2 w-full" (click)="copy()">
                  {{ copied() ? '¡Link copiado!' : 'Copiar link' }}
                </button>
                <button type="button" class="reveal reveal-5 btn btn-ghost btn-sm mt-1 w-full" (click)="reset()">Comprar otra</button>

              <!-- ── pasos de compra ── -->
              } @else {
                <p class="text-xs font-semibold uppercase tracking-wider text-base-content/50">Comprar / Regalar gift card</p>
                @if (interactive()) {
                  <!-- stepper: círculos numerados, check en los pasos hechos,
                       conector que se llena con el color de la marca -->
                  <div class="mt-4 flex items-center gap-2">
                    @for (name of steps; track $index) {
                      <div class="flex flex-col items-center gap-1.5">
                        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-base-200 text-xs font-bold text-base-content/40 transition-all"
                              [class.scale-110]="$index === step()"
                              [style.background-color]="$index <= step() ? b().color : null"
                              [style.color]="$index <= step() ? onBrand() : null">
                          @if ($index < step()) {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="size-4">
                              <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          } @else { {{ $index + 1 }} }
                        </span>
                        <span class="text-[10px] font-medium text-base-content/40 transition-colors"
                              [style.color]="$index === step() ? b().color : null">{{ name }}</span>
                      </div>
                      @if (!$last) {
                        <span class="mb-5 h-0.5 flex-1 rounded-full bg-base-200 transition-colors"
                              [style.background-color]="$index < step() ? b().color : null"></span>
                      }
                    }
                  </div>
                }

                @switch (view()) {
                  @case (0) {
                    <p class="mt-5 text-xs uppercase tracking-wider text-base-content/50">Elige el monto</p>
                    @if (amounts().length) {
                      <div class="mt-2 grid grid-cols-3 gap-2">
                        @for (a of amounts(); track a) {
                          <button type="button" (click)="pick(a)"
                            class="btn h-12 font-semibold normal-case transition-transform active:scale-95"
                            [class.btn-outline]="amount !== a"
                            [style.background-color]="amount === a ? b().color : ''"
                            [style.color]="amount === a ? onBrand() : ''"
                            [style.border-color]="amount === a ? b().color : ''">
                            {{ a | bs }}
                          </button>
                        }
                      </div>
                    }
                    @if (showCustom()) {
                      <input type="number" min="1" class="input input-bordered mt-2 h-12 w-full" [(ngModel)]="amount" name="amount"
                             [placeholder]="amounts().length ? 'Otro monto (Bs)' : 'Monto de la gift card (Bs)'">
                    }
                    <button type="button" class="btn mt-4 h-12 w-full border-none text-base shadow-sm"
                            [disabled]="!amount || amount < 1"
                            [style.background-color]="b().color" [style.color]="onBrand()"
                            (click)="next()">Continuar</button>
                  }

                  @case (1) {
                    <p class="mt-5 text-xs uppercase tracking-wider text-base-content/50">¿Para quién es?</p>
                    <input class="input input-bordered mt-2 h-12 w-full" [(ngModel)]="to" name="to" placeholder="Nombre de quien la recibe">
                    <input class="input input-bordered mt-2 h-12 w-full" [(ngModel)]="from" name="from"
                           placeholder="De parte de… (opcional)">
                    <p class="mt-1 text-xs text-base-content/50">Déjalo vacío si quieres que el regalo sea anónimo.</p>
                    <div class="mt-4 flex gap-2">
                      <button type="button" class="btn btn-ghost h-12 flex-1" (click)="back()">Atrás</button>
                      <button type="button" class="btn h-12 flex-1 border-none" [disabled]="!to.trim()"
                              [style.background-color]="b().color" [style.color]="onBrand()"
                              (click)="next()">Continuar</button>
                    </div>
                  }

                  @case (2) {
                    <p class="mt-5 text-xs uppercase tracking-wider text-base-content/50">Revisa y confirma</p>
                    <dl class="mt-2 divide-y divide-base-200 overflow-hidden rounded-box border border-base-300">
                      <div class="flex justify-between gap-3 p-3"><dt class="text-base-content/55">Monto</dt><dd class="text-lg font-bold tabular-nums" [style.color]="b().color">{{ amount | bs }}</dd></div>
                      <div class="flex justify-between gap-3 p-3"><dt class="text-base-content/55">Para</dt><dd class="font-medium">{{ to }}</dd></div>
                      @if (from.trim()) {
                        <div class="flex justify-between gap-3 p-3"><dt class="text-base-content/55">De parte de</dt><dd>{{ from }}</dd></div>
                      }
                      <div class="flex justify-between gap-3 p-3"><dt class="text-base-content/55">Vence</dt><dd>{{ b().validityMonths }} meses desde hoy</dd></div>
                    </dl>
                    <div class="mt-4 flex gap-2">
                      <button type="button" class="btn btn-ghost h-12 flex-1" (click)="back()" [disabled]="busy()">Atrás</button>
                      <button type="button" class="btn h-12 flex-1 border-none" [disabled]="busy()"
                              [style.background-color]="b().color" [style.color]="onBrand()"
                              (click)="buy()">{{ busy() ? 'Emitiendo…' : 'Comprar' }}</button>
                    </div>
                    <p class="mt-3 text-center text-xs text-base-content/50">Pago coordinado con el comercio</p>
                    @if (error()) { <p class="mt-2 text-center text-sm text-error">{{ error() }}</p> }
                  }
                }
              }
            </div>
          </div>

          <!-- 3 · descripción y detalles -->
          <div class="order-3 lg:col-start-1 lg:row-start-2 lg:self-start">
            <p class="mx-auto max-w-md text-lg text-base-content/70 lg:mx-0">
              {{ b().description || 'Cuenta en una línea qué ofreces.' }}
            </p>
            <ul class="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-base-content/60 lg:justify-start">
              @for (v of trust(); track v) {
                <li class="inline-flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" class="size-4" [style.color]="b().color">
                    <path d="M4 12.5l5 5 11-11" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  {{ v }}
                </li>
              }
            </ul>
          </div>
        </div>
      </section>

      <!-- footer -->
      <footer class="border-t border-base-300">
        <div class="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-7 text-center sm:px-8">
          @if (b().terms) { <p class="max-w-2xl text-xs leading-relaxed text-base-content/50">{{ b().terms }}</p> }
          <p class="flex items-center gap-1.5 text-xs text-base-content/40">
            Hecho con <app-wordmark />
          </p>
        </div>
      </footer>
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
  /** El dueño puede apagar el monto libre. Pero si no hay montos sugeridos,
   *  igual lo mostramos: si no, no habría forma de comprar. */
  readonly showCustom = computed(() => this.b().allowCustomAmount !== false || !this.amounts().length);
  readonly onBrand = computed(() => onBrand(this.b().color));
  readonly trust = computed(() => [
    'Un código al instante',
    'Se canjea con QR o código',
    `Vence en ${this.b().validityMonths} meses`,
  ]);

  // ── compra por pasos ───────────────────────────────────────────────────────
  readonly steps = ['Monto', 'Para quién', 'Confirmar'];
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
      this.error.set('No pudimos emitir la gift card. Prueba de nuevo en un momento.');
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
      <div class="grid min-h-dvh place-items-center"><span class="loading loading-spinner loading-lg text-primary"></span></div>
    } @else if (page.hasValue() && page.value(); as p) {
      <div class="storefront min-h-dvh">
        <app-storefront [business]="p.tenant.business" [interactive]="true" [tenantId]="p.tenant.id" />
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
