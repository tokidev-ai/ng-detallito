import { Component, computed, inject, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Bank, Business, EMPTY_BANK, EMPTY_BUSINESS, LIMITS, MAX_OWNED, SUPPORT_EMAIL, Store, logoDataUrl } from '../data';
import { BrandDesign } from '../merchant/brand-design';
import { BsPipe } from '../ui';
import { Storefront } from '../storefront';
import { Wordmark } from '../brand';

const STEPS = ['Marca', 'Montos', 'Datos bancarios', 'Publicar'] as const;

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, LIMITS.slug);

@Component({
  selector: 'app-onboarding',
  imports: [FormsModule, RouterLink, Storefront, Wordmark, BrandDesign, BsPipe],
  template: `
  <div class="min-h-dvh bg-base-200 text-base-content">
    <header class="border-b border-base-300 bg-base-100">
      <nav class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <a routerLink="/app"><app-wordmark /></a>
        <a routerLink="/app" class="btn btn-ghost btn-sm ms-auto">Salir del asistente</a>
      </nav>
    </header>

    <div class="p-4 sm:p-6">
    @if (limitReached()) {
      <div class="mx-auto max-w-xl rounded-box border border-base-300 bg-base-100 p-6 text-center sm:p-8">
        <h1 class="text-xl font-semibold">Llegaste al máximo de {{ maxOwned }} comercios</h1>
        <p class="mt-2 text-base-content/65">
          Para crear más, escríbenos a
          <a class="link link-primary" [href]="'mailto:' + supportEmail + '?subject=Quiero%20crear%20m%C3%A1s%20comercios'">{{ supportEmail }}</a>
          y te habilitamos.
        </p>
        <a routerLink="/app" class="btn btn-primary mt-6">Volver a mis comercios</a>
      </div>
    } @else {
    <div class="mx-auto max-w-6xl overflow-hidden rounded-box border border-base-300 bg-base-100">

      <!-- pasos -->
      <header class="border-b border-base-300 p-4 sm:p-6">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-3">
          <h1 class="text-xl font-semibold sm:text-2xl">Configura tu comercio</h1>
          <ol class="flex flex-1 flex-wrap items-center gap-2">
            @for (s of steps; track s; let i = $index) {
              <li class="flex items-center gap-2">
                <button type="button" (click)="goTo(i)" [disabled]="i > furthest()"
                  class="btn btn-sm rounded-full font-normal normal-case"
                  [class.btn-primary]="i === step()"
                  [class.btn-outline]="i !== step() && i <= furthest()"
                  [class.btn-ghost]="i > furthest()">
                  <span class="tabular-nums opacity-60">{{ i + 1 }}</span> {{ s }}
                </button>
                @if (!$last) { <span class="hidden h-px w-4 bg-base-300 sm:block"></span> }
              </li>
            }
          </ol>
        </div>
      </header>

      <div class="grid lg:grid-cols-[1fr_380px]">
        <!-- formulario -->
        <section class="p-4 sm:p-6">
          @if (store.ownedCount() === maxOwned - 1) {
            <p class="mb-4 rounded-field bg-base-200 p-3 text-sm text-base-content/70">
              Este será tu último comercio: puedes tener hasta {{ maxOwned }}. Para más, escríbenos a {{ supportEmail }}.
            </p>
          }
          @switch (step()) {

            @case (0) {
              <div class="flex flex-col gap-5 sm:flex-row">
                <div class="w-28 shrink-0">
                  <label class="grid h-28 w-28 cursor-pointer place-items-center rounded-box border-2 border-dashed border-base-300 text-center text-sm text-base-content/50 hover:border-primary/40">
                    @if (logoBusy()) { <span class="loading loading-spinner"></span> }
                    @else if (draft().logoUrl) {
                      <img [src]="draft().logoUrl" alt="logo" class="size-full rounded-box object-cover">
                    } @else { <span>sube tu<br>logo</span> }
                    <input type="file" accept="image/*" class="hidden" (change)="onLogo($event)">
                  </label>
                  @if (logoError()) { <p class="mt-1 text-xs text-error">{{ logoError() }}</p> }
                </div>

                <div class="flex-1 space-y-4">
                  <label class="form-control block">
                    <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">Nombre</span>
                    <input class="input input-bordered w-full" [ngModel]="draft().name"
                           (ngModelChange)="onName($event)" name="name" [maxlength]="limits.name"
                           [placeholder]="'Spa Aurora · máx. ' + limits.name">
                  </label>

                  <label class="form-control block">
                    <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">Link público</span>
                    <div class="join w-full">
                      <span class="join-item flex items-center border border-base-300 bg-base-200 px-3 text-sm text-base-content/60">giftcards.bo/</span>
                      <input class="input input-bordered join-item w-full" [ngModel]="draft().slug"
                             (ngModelChange)="patch({ slug: slugify($event) })" name="slug" [maxlength]="limits.slug"
                             [placeholder]="'spa-aurora · máx. ' + limits.slug">
                    </div>
                    @if (draft().slug) {
                      @if (slugChecking()) {
                        <span class="mt-1 block text-sm text-base-content/50">Verificando…</span>
                      } @else if (!slugFree()) {
                        <span class="mt-1 block text-sm text-error">Ese link ya está tomado por otro comercio.</span>
                      } @else {
                        <span class="mt-1 block text-sm text-success">Link disponible.</span>
                      }
                    }
                  </label>
                </div>
              </div>

              <label class="form-control mt-4 block">
                <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">Descripción corta</span>
                <textarea class="textarea textarea-bordered h-24 w-full" [ngModel]="draft().description"
                          (ngModelChange)="patch({ description: $event })" name="desc" [maxlength]="limits.description"
                          [placeholder]="'Masajes, faciales y estética en Sopocachi. · máx. ' + limits.description"></textarea>
              </label>

              <app-brand-design [business]="draft()" (change)="patch($event)" />
            }

            @case (1) {
              <p class="text-sm text-base-content/60">
                Son los montos que tus clientes pueden comprar en tu página. Un monto distinto lo
                cargas tú desde el panel. Los puedes cambiar después en "Gift cards → Montos sugeridos".
              </p>
              <div class="mt-4 flex flex-wrap gap-2">
                @for (a of draft().suggestedAmounts; track a) {
                  <span class="badge badge-lg gap-2 py-3">
                    {{ a | bs }}
                    <button type="button" class="text-base-content/50 hover:text-error" aria-label="Quitar"
                            (click)="removeAmount(a)">✕</button>
                  </span>
                } @empty {
                  <span class="text-sm text-base-content/45">Sin montos todavía.</span>
                }
              </div>
              <div class="mt-3 flex gap-2">
                <input type="number" min="1" [max]="limits.amountMax" class="input input-bordered input-sm w-40" [(ngModel)]="newAmount"
                       name="newAmount" [placeholder]="'Bs 1 a ' + limits.amountMax" (keyup.enter)="addAmount()">
                <button type="button" class="btn btn-outline btn-sm" (click)="addAmount()">+ Agregar</button>
              </div>
            }

            @case (2) {
              <p class="text-sm text-base-content/60">
                A esta cuenta te depositamos cada fin de mes. No se comparte con tus empleados.
              </p>
              <div class="mt-4 grid gap-4 sm:grid-cols-2">
                @for (f of bankFields; track f.key) {
                  <label class="form-control block">
                    <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">{{ f.label }}</span>
                    <input class="input input-bordered w-full" [ngModel]="bank()[f.key]" [name]="f.key" [maxlength]="limits[f.key]"
                           (ngModelChange)="patchBank(f.key, $event)" [placeholder]="f.placeholder + ' · máx. ' + limits[f.key]">
                  </label>
                }
              </div>
            }

            @case (3) {
              <ul class="space-y-2">
                @for (c of checklist(); track c.label) {
                  <li class="flex items-center gap-3 rounded-field border border-base-300 p-3">
                    <span class="badge badge-sm" [class.badge-success]="c.ok" [class.badge-error]="!c.ok">
                      {{ c.ok ? '✓' : '!' }}
                    </span>
                    <span class="flex-1">{{ c.label }}</span>
                    @if (!c.ok) {
                      <button type="button" class="btn btn-ghost btn-xs" (click)="goTo(c.step)">arreglar</button>
                    }
                  </li>
                }
              </ul>

              <div class="mt-5 rounded-box border border-base-300 bg-base-200 p-4">
                <p class="text-xs uppercase tracking-wider text-base-content/50">Tu link</p>
                <p class="mt-1 break-all font-mono">giftcards.bo/{{ draft().slug || '…' }}</p>
              </div>

              <button type="button" class="btn btn-primary mt-5 w-full sm:w-auto"
                      [disabled]="!canPublish()" (click)="publish()">
                @if (publishing()) { <span class="loading loading-spinner loading-sm"></span> }
                Publicar mi página
              </button>
              @if (publishError()) { <p class="mt-2 text-sm text-error">{{ publishError() }}</p> }
              @if (!canPublish()) {
                <p class="mt-2 text-sm text-error">Falta completar lo marcado arriba.</p>
              }
            }
          }

          <!-- navegación -->
          <div class="mt-8 flex justify-end gap-2">
            <button type="button" class="btn btn-ghost" [disabled]="step() === 0" (click)="back()">Atrás</button>
            @if (step() < steps.length - 1) {
              <button type="button" class="btn btn-primary" (click)="next()">Guardar y seguir</button>
            }
          </div>
        </section>

        <!-- vista previa en vivo -->
        <aside class="border-t border-base-300 bg-base-200 p-4 sm:p-6 lg:border-l lg:border-t-0">
          <p class="mb-3 text-xs uppercase tracking-wider text-base-content/50">Vista previa · móvil</p>
          <div class="phone-preview mx-auto w-[328px] max-w-full rounded-[2rem] border-4 border-base-content/80 bg-base-100 shadow-xl">
            <app-storefront [business]="draft()" />
          </div>
        </aside>
      </div>
    </div>
    }
    </div>
  </div>
  `,
})
export class Onboarding {
  readonly store = inject(Store);
  private readonly router = inject(Router);

  readonly steps = STEPS;
  readonly limits = LIMITS;
  readonly maxOwned = MAX_OWNED;
  readonly supportEmail = SUPPORT_EMAIL;
  /** ponytail: tope solo en la app; las reglas no cuentan comercios (haría falta un contador). */
  readonly limitReached = computed(() =>
    this.store.tenantsLoaded() && this.store.ownedCount() >= MAX_OWNED && !this.publishing());
  readonly bankFields = [
    { key: 'bank' as const, label: 'Banco', placeholder: 'BNB' },
    { key: 'account' as const, label: 'Cuenta', placeholder: '10-2345678' },
    { key: 'holder' as const, label: 'Titular', placeholder: 'Ana Rocha' },
    { key: 'nit' as const, label: 'NIT o CI', placeholder: '4821993015' },
  ];
  readonly slugify = slugify;

  readonly step = signal(0);
  readonly furthest = signal(0);
  /** Arranca con montos típicos: sin al menos uno la página no vende. */
  readonly draft = signal<Business>({ ...EMPTY_BUSINESS, suggestedAmounts: [100, 200, 500] });

  /** El slug lo escribe el nombre hasta que el usuario lo edita a mano. */
  private slugTouched = false;

  readonly checklist = computed(() => [
    { label: 'Nombre y link público', ok: !!this.draft().name && this.slugFree(), step: 0 },
    { label: 'Al menos un monto para vender', ok: this.draft().suggestedAmounts.length > 0, step: 1 },
    { label: 'Datos bancarios completos', ok: Object.values(this.bank()).every(Boolean), step: 2 },
  ]);
  readonly canPublish = computed(() => this.checklist().every(c => c.ok) && !this.publishing());

  /** El link público es global: hay que preguntarle a Firestore, no al store local. */
  private readonly slugCheck = resource({
    params: () => this.draft().slug,
    loader: ({ params }) => this.store.slugTaken(params),
  });
  readonly slugChecking = computed(() => this.slugCheck.isLoading());
  readonly slugFree = computed(() => !!this.draft().slug && this.slugCheck.value() === false);

  readonly publishing = signal(false);
  readonly publishError = signal('');

  patch(p: Partial<Business>) {
    if (p.slug !== undefined) this.slugTouched = true;
    this.draft.update(d => ({ ...d, ...p }));
  }

  /** Aparte de la página: es privado y va a `tenants/{id}`, no a `pages/{id}`. */
  readonly bank = signal<Bank>({ ...EMPTY_BANK });
  patchBank(key: keyof Bank, value: string) {
    this.bank.update(b => ({ ...b, [key]: value }));
  }

  newAmount: number | null = null;
  addAmount() {
    const a = this.newAmount;
    if (!a || a <= 0 || a > LIMITS.amountMax) return;
    const list = this.draft().suggestedAmounts;
    if (!list.includes(a)) this.patch({ suggestedAmounts: [...list, a].sort((x, y) => x - y) });
    this.newAmount = null;
  }
  removeAmount(a: number) {
    this.patch({ suggestedAmounts: this.draft().suggestedAmounts.filter(x => x !== a) });
  }

  onName(name: string) {
    this.draft.update(d => ({ ...d, name, slug: this.slugTouched ? d.slug : slugify(name) }));
  }

  readonly logoBusy = signal(false);
  readonly logoError = signal('');
  async onLogo(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.logoBusy.set(true); this.logoError.set('');
    try { this.patch({ logoUrl: await logoDataUrl(file) }); }
    catch (err) { this.logoError.set((err as Error).message); }
    finally { this.logoBusy.set(false); input.value = ''; }
  }

  goTo(i: number) { if (i <= this.furthest()) this.step.set(i); }
  back() { this.step.update(s => Math.max(0, s - 1)); }
  next() {
    const s = Math.min(STEPS.length - 1, this.step() + 1);
    this.step.set(s);
    this.furthest.update(f => Math.max(f, s));
  }

  async publish() {
    this.publishing.set(true);
    this.publishError.set('');
    try {
      const id = await this.store.createTenant({ ...this.draft(), published: true }, this.bank());
      this.store.setCurrent(id);
      await this.router.navigate(['/app', id, 'resumen']);
    } catch {
      this.publishError.set('No pudimos publicar. Revisa tu conexión y prueba de nuevo.');
    } finally {
      this.publishing.set(false);
    }
  }
}
