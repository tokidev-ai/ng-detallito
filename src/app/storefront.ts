import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsPipe, onBrand } from './ui';
import { Business, GiftCard, Store } from './data';
import { expiryFrom, giftMessage, giftPath, mailtoLink, newCode, waLink } from './card';
import { GiftcardArt } from './giftcard';
import { Wordmark } from './brand';

/** La página pública del comercio: comprar una gift card en pasos. Se usa tal
 *  cual en /:slug y como vista previa en vivo del wizard (ahí no es interactiva,
 *  se queda en el primer paso). Toda la paleta sale del color del comercio:
 *  `--c1` es su color y styles.css deriva los vecinos (--c2, --c3, suaves, fondo). */
@Component({
  selector: 'app-storefront',
  imports: [FormsModule, BsPipe, GiftcardArt, Wordmark],
  // @container: el layout responde al ancho del componente, no del viewport. Así la
  // vista previa angosta del panel se ve como móvil aunque la pantalla sea de escritorio.
  template: `
    <div class="@container">
    <div class="storefront flex flex-col bg-base-100 text-base-content" [class.min-h-dvh]="interactive()"
         [style.--c1]="b().color">

      <!-- ── zona de color: header + hero, fondo oscuro teñido con la marca ── -->
      <div class="sf-hero relative flex flex-1 flex-col overflow-hidden text-white">
        <!-- aurora: tres manchas de la paleta que derivan lento -->
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <span class="blob blob-1" style="background:var(--c1)"></span>
          <span class="blob blob-2" style="background:var(--c2)"></span>
          <span class="blob blob-3" style="background:var(--c3)"></span>
          <div class="dotgrid-light absolute inset-0"></div>
        </div>

        <header class="relative z-10">
          <div class="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4 @2xl:px-8">
            <div class="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/10 text-[9px] text-white/50 ring-1 ring-white/20">
              @if (b().logoUrl) { <img [src]="b().logoUrl" alt="" class="size-full object-cover"> } @else { logo }
            </div>
            <p class="min-w-0 flex-1 truncate font-semibold tracking-tight">{{ b().name || 'Tu comercio' }}</p>
            <span class="hidden rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 ring-1 ring-white/15 @2xl:block">
              giftcards.bo/{{ b().slug || 'tu-link' }}
            </span>
          </div>
        </header>

        <div class="relative z-10 flex flex-1 flex-col @5xl:justify-center">
          <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col @5xl:grid @5xl:flex-none @5xl:grid-cols-[1fr_minmax(0,440px)] @5xl:items-center @5xl:gap-16 @5xl:px-8 @5xl:py-12">

            <!-- ── pitch + tarjeta en vivo ── -->
            <div class="px-5 pb-14 pt-2 text-center @2xl:px-8 @5xl:p-0 @5xl:text-left">
              <h1 class="reveal reveal-1 mt-3 text-[2.3rem] font-extrabold leading-[0.98] tracking-[-0.045em] text-balance @2xl:text-5xl @5xl:text-[4.1rem]">
                Regala algo especial en
                <span class="relative inline-block">
                  <span class="text-aurora">{{ b().name || 'tu comercio' }}</span>
                  <svg class="subrayado absolute -bottom-1.5 left-0 w-full" height="14" style="color:var(--c2-soft)"
                       viewBox="0 0 200 14" preserveAspectRatio="none" fill="none" aria-hidden="true">
                    <path d="M3 9.5C42 4 86 2.6 130 4.2c25 .9 48 2.6 67 5.3"
                          stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
                  </svg>
                </span>
              </h1>

              @if (b().description) {
                <p class="reveal reveal-2 mx-auto mt-4 line-clamp-2 max-w-md text-base text-white/75 @5xl:mx-0 @5xl:text-lg">{{ b().description }}</p>
              }

              @if (!issuedCard()) {
                <!-- la tarjeta que se arma mientras el cliente elige: lo que llama la atención -->
                <div class="pop relative mx-auto mt-8 w-full max-w-[270px] @2xl:max-w-[340px] @5xl:mx-0 @5xl:mt-10" style="animation-delay:.2s">
                  <span class="chip-float absolute -left-3 -top-4 z-10 grid size-11 place-items-center rounded-2xl bg-white text-xl shadow-xl @5xl:-left-6">🎁</span>
                  <span class="chip-float absolute -bottom-4 -right-2 z-10 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-xl @5xl:-right-8"
                        style="background:var(--color-success);animation-delay:-2s">✓ Al instante</span>
                  <div class="float">
                    <div class="shine relative flex aspect-[1.586] -rotate-3 flex-col justify-between overflow-hidden rounded-2xl p-5 text-left shadow-2xl shadow-black/50 ring-1 ring-white/25"
                         style="background:linear-gradient(135deg,var(--c1),var(--c2))" [style.color]="onBrand()">
                      <span class="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/15" aria-hidden="true"></span>
                      <span class="pointer-events-none absolute -bottom-20 -left-6 size-48 rounded-full bg-black/10" aria-hidden="true"></span>

                      <div class="relative flex items-center gap-2">
                        <div class="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-white/25 text-[8px]">
                          @if (b().logoUrl) { <img [src]="b().logoUrl" alt="" class="size-full object-cover"> } @else { logo }
                        </div>
                        <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ b().name || 'Tu comercio' }}</p>
                        <span class="text-[10px] uppercase tracking-[0.2em] opacity-80">Gift card</span>
                      </div>

                      <!-- @for de un solo elemento: al cambiar el monto se recrea y rebota -->
                      @for (k of [amount]; track k) {
                        <p class="pop relative text-4xl font-extrabold tracking-[-0.03em] tabular-nums @2xl:text-5xl">
                          {{ amount ? (amount | bs) : 'Bs ···' }}
                        </p>
                      }

                      <div class="relative flex items-end justify-between gap-3 text-xs">
                        <div class="min-w-0">
                          <p class="opacity-70">Para</p>
                          <p class="truncate text-sm font-semibold">{{ to.trim() || 'Alguien especial' }}</p>
                        </div>
                        @if (from.trim()) {
                          <div class="min-w-0 text-right">
                            <p class="opacity-70">De</p>
                            <p class="truncate text-sm font-semibold">{{ from }}</p>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- ── panel de compra: hoja que sube en móvil, tarjeta flotante en desktop ── -->
            <div class="sheet-up relative z-10 -mt-6 flex-1 overflow-hidden rounded-t-[2rem] bg-base-100 px-5 pb-8 pt-7 text-base-content @2xl:px-8 @5xl:mt-0 @5xl:flex-none @5xl:rounded-[2rem] @5xl:p-8 @5xl:shadow-2xl @5xl:shadow-black/40">
              <!-- franja de la paleta arriba del panel -->
              <div class="absolute inset-x-0 top-0 h-1.5" style="background:linear-gradient(90deg,var(--c3),var(--c1),var(--c2))"></div>

              <!-- ── compra terminada ── -->
              @if (issuedCard(); as card) {
                <div class="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
                  @for (p of confetti; track $index) {
                    <span class="confetti" [style.left.%]="p.left" [style.width.px]="p.w" [style.background]="p.color"
                          [style.--d]="p.dur + 's'" [style.--delay]="p.delay + 's'" [style.--r]="p.rot + 'deg'"></span>
                  }
                </div>
                <div class="relative">
                  <p class="reveal text-center text-2xl font-extrabold tracking-tight">
                    <span class="pop inline-block">🎉</span> ¡Tu gift card está lista!
                  </p>
                  <p class="reveal reveal-1 mt-1 text-center text-sm text-base-content/60">Ahora envíasela a quien la va a disfrutar.</p>
                  <div class="pop mt-5" style="animation-delay:.12s"><app-giftcard-art [card]="card" [business]="b()" /></div>
                  <div class="reveal reveal-4 mt-5 grid grid-cols-2 gap-2">
                    <a class="cta text-white" style="background:#25D366;box-shadow:0 12px 28px -12px #25D366"
                       [href]="waHref()" target="_blank" rel="noopener">WhatsApp</a>
                    <a class="cta bg-base-200" [href]="mailHref()">Correo</a>
                  </div>
                  <button type="button" class="reveal reveal-5 btn btn-ghost btn-sm mt-2 w-full" (click)="copy()">
                    {{ copied() ? '¡Link copiado!' : 'Copiar link' }}
                  </button>
                  <button type="button" class="reveal reveal-5 btn btn-ghost btn-sm mt-1 w-full" (click)="reset()">Regalar otra</button>
                </div>

              <!-- ── pasos de compra ── -->
              } @else {
                <p class="text-xs font-semibold uppercase tracking-wider text-base-content/50">Comprar / Regalar gift card</p>

                @if (interactive()) {
                  <!-- stepper verde: hecho = check, actual = pulso -->
                  <div class="mt-4 flex items-center gap-2">
                    @for (name of steps; track $index) {
                      <div class="flex flex-col items-center gap-1.5">
                        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-base-200 text-xs font-bold text-base-content/40 transition-all duration-300"
                              [class.step-pulse]="$index === step()"
                              [style.background-color]="$index <= step() ? 'var(--color-success)' : null"
                              [style.color]="$index <= step() ? 'var(--color-success-content)' : null">
                          @if ($index < step()) {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="pop size-4">
                              <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          } @else { {{ $index + 1 }} }
                        </span>
                        <span class="text-[10px] font-semibold text-base-content/40 transition-colors"
                              [style.color]="$index <= step() ? 'var(--color-success)' : null">{{ name }}</span>
                      </div>
                      @if (!$last) {
                        <span class="relative mb-5 h-1 flex-1 overflow-hidden rounded-full bg-base-200">
                          <span class="absolute inset-y-0 left-0 rounded-full bg-success transition-all duration-500 ease-out"
                                [style.width.%]="$index < step() ? 100 : 0"></span>
                        </span>
                      }
                    }
                  </div>
                }

                <!-- @for de un solo elemento: cada paso entra con animación al cambiar -->
                @for (v of [view()]; track v) {
                  <div class="step-in">
                    @switch (v) {
                      @case (0) {
                        <h2 class="mt-6 text-2xl font-extrabold tracking-tight">¿Cuánto quieres regalar?</h2>
                        @if (amounts().length) {
                          <div class="mt-4 grid gap-2" [style.grid-template-columns]="'repeat(' + cols() + ', minmax(0, 1fr))'">
                            @for (a of amounts(); track a; let i = $index) {
                              <button type="button" (click)="pick(a)"
                                class="pill reveal h-14 rounded-2xl bg-base-200 text-lg font-extrabold tabular-nums"
                                [class.pill-on]="amount === a"
                                [style.animation-delay]="(0.05 + i * 0.06) + 's'"
                                [style.background]="amount === a ? 'linear-gradient(135deg,var(--c1),var(--c2))' : null"
                                [style.color]="amount === a ? onBrand() : null">
                                {{ a | bs }}
                              </button>
                            }
                          </div>
                        }
                        @if (showCustom()) {
                          <label class="field mt-3 flex items-center gap-2">
                            <span class="font-bold text-base-content/45">Bs</span>
                            <input type="number" min="1" class="h-full w-full bg-transparent text-lg font-semibold outline-none"
                                   [(ngModel)]="amount" name="amount"
                                   [placeholder]="amounts().length ? 'Otro monto' : 'Monto de la gift card'">
                          </label>
                        }
                        <button type="button" class="cta cta-brand mt-5" [disabled]="!amount || amount < 1"
                                [style.color]="onBrand()" (click)="next()">
                          Continuar
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="size-5"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                      }

                      @case (1) {
                        <h2 class="mt-6 text-2xl font-extrabold tracking-tight">¿Para quién es?</h2>
                        <p class="mt-1 text-sm text-base-content/55">Su nombre aparece en la gift card.</p>
                        <input class="field mt-4" [(ngModel)]="to" name="to" placeholder="Nombre de quien la recibe">
                        <input class="field mt-2" [(ngModel)]="from" name="from" placeholder="De parte de… (opcional)">
                        <p class="mt-2 text-xs text-base-content/50">Déjalo vacío si quieres que el regalo sea anónimo.</p>
                        <div class="mt-5 flex gap-2">
                          <button type="button" class="grid size-14 shrink-0 place-items-center rounded-2xl bg-base-200 transition active:scale-95" aria-label="Atrás" (click)="back()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="size-5"><path d="M19 12H5M11 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                          </button>
                          <button type="button" class="cta cta-brand flex-1" [disabled]="!to.trim()"
                                  [style.color]="onBrand()" (click)="next()">
                            Continuar
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="size-5"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                          </button>
                        </div>
                      }

                      @case (2) {
                        <h2 class="mt-6 text-2xl font-extrabold tracking-tight">Revisa tu regalo</h2>
                        <dl class="mt-4 divide-y divide-base-300/70 rounded-2xl bg-base-200 px-4 text-sm">
                          <div class="flex items-center justify-between gap-3 py-3"><dt class="text-base-content/55">Monto</dt><dd class="text-xl font-extrabold tabular-nums">{{ amount | bs }}</dd></div>
                          <div class="flex justify-between gap-3 py-3"><dt class="text-base-content/55">Para</dt><dd class="font-semibold">{{ to }}</dd></div>
                          @if (from.trim()) {
                            <div class="flex justify-between gap-3 py-3"><dt class="text-base-content/55">De parte de</dt><dd class="font-semibold">{{ from }}</dd></div>
                          }
                          <div class="flex justify-between gap-3 py-3"><dt class="text-base-content/55">Vence</dt><dd class="font-semibold">{{ b().validityMonths }} meses desde hoy</dd></div>
                        </dl>
                        <div class="mt-5 flex gap-2">
                          <button type="button" class="grid size-14 shrink-0 place-items-center rounded-2xl bg-base-200 transition active:scale-95" aria-label="Atrás" (click)="back()" [disabled]="busy()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="size-5"><path d="M19 12H5M11 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                          </button>
                          <button type="button" class="cta cta-brand flex-1" [disabled]="busy()"
                                  [style.color]="onBrand()" (click)="buy()">
                            @if (busy()) { <span class="loading loading-spinner loading-sm"></span> Emitiendo… }
                            @else { Regalar {{ amount | bs }} 🎁 }
                          </button>
                        </div>
                        <p class="mt-3 text-center text-xs text-base-content/50">Pago coordinado con el comercio</p>
                        @if (error()) { <p class="mt-2 text-center text-sm text-error">{{ error() }}</p> }
                      }
                    }
                  </div>
                }

                <ul class="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-base-200 pt-5 text-xs text-base-content/60">
                  @for (v of trust(); track v) {
                    <li class="inline-flex items-center gap-1.5">
                      <span class="grid size-4 place-items-center rounded-full bg-success text-success-content">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" class="size-2.5"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </span>
                      {{ v }}
                    </li>
                  }
                </ul>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- footer -->
      <footer class="border-t border-base-300 bg-base-100">
        <div class="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-7 text-center @2xl:px-8">
          @if (b().terms) { <p class="max-w-2xl text-xs leading-relaxed text-base-content/50">{{ b().terms }}</p> }
          <p class="flex items-center gap-1.5 text-xs text-base-content/40">
            Hecho con <app-wordmark />
          </p>
        </div>
      </footer>
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
  /** Columnas de los montos: hasta 3, sin huecos si hay menos. */
  readonly cols = computed(() => Math.min(this.amounts().length, 3) || 1);
  /** El dueño puede apagar el monto libre. Pero si no hay montos sugeridos,
   *  igual lo mostramos: si no, no habría forma de comprar. */
  readonly showCustom = computed(() => this.b().allowCustomAmount !== false || !this.amounts().length);
  readonly onBrand = computed(() => onBrand(this.b().color));
  readonly trust = computed(() => [
    'Un código al instante',
    'Se canjea con QR o código',
    `Vence en ${this.b().validityMonths} meses`,
  ]);

  /** Confeti de la pantalla final: posiciones al azar una sola vez, colores de la paleta. */
  readonly confetti = Array.from({ length: 44 }, (_, i) => ({
    left: Math.random() * 100,
    w: 6 + Math.random() * 6,
    dur: 1.6 + Math.random() * 1.4,
    delay: Math.random() * 0.5,
    rot: Math.round(Math.random() * 720 - 360),
    color: ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--color-success)', '#facc15'][i % 5],
  }));

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
