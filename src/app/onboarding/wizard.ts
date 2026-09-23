import { Component, computed, inject, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Business, EMPTY_BUSINESS, Product, Store } from '../data';
import { Storefront } from '../storefront';
import { Wordmark } from '../brand';
import { BsPipe } from '../ui';

const STEPS = ['Marca', 'Productos', 'Vigencia y términos', 'Datos bancarios', 'Publicar'] as const;
const SWATCHES = ['#18181b', '#0f766e', '#b91c1c', '#1d4ed8', '#a16207', '#7e22ce'];

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

@Component({
  selector: 'app-onboarding',
  imports: [FormsModule, RouterLink, Storefront, BsPipe, Wordmark],
  template: `
  <div class="min-h-dvh bg-base-200 text-base-content">
    <header class="border-b border-base-300 bg-base-100">
      <nav class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <a routerLink="/app"><app-wordmark /></a>
        <a routerLink="/app" class="btn btn-ghost btn-sm ms-auto">Salir del asistente</a>
      </nav>
    </header>

    <div class="p-4 sm:p-6">
    <div class="mx-auto max-w-6xl overflow-hidden rounded-box border border-base-300 bg-base-100">

      <!-- pasos -->
      <header class="border-b border-base-300 p-4 sm:p-6">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-3">
          <h1 class="text-xl font-semibold sm:text-2xl">Configurá tu comercio</h1>
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
          @switch (step()) {

            @case (0) {
              <div class="flex flex-col gap-5 sm:flex-row">
                <label class="grid h-28 w-28 shrink-0 cursor-pointer place-items-center rounded-box border-2 border-dashed border-base-300 text-center text-sm text-base-content/50 hover:border-primary/40">
                  @if (draft().logoUrl) {
                    <img [src]="draft().logoUrl" alt="logo" class="size-full rounded-box object-cover">
                  } @else { <span>subí tu<br>logo</span> }
                  <input type="file" accept="image/*" class="hidden" (change)="onLogo($event)">
                </label>

                <div class="flex-1 space-y-4">
                  <label class="form-control block">
                    <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">Nombre</span>
                    <input class="input input-bordered w-full" [ngModel]="draft().name"
                           (ngModelChange)="onName($event)" name="name" placeholder="Spa Aurora">
                  </label>

                  <label class="form-control block">
                    <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">Link público</span>
                    <div class="join w-full">
                      <span class="join-item flex items-center border border-base-300 bg-base-200 px-3 text-sm text-base-content/60">giftcards.bo/</span>
                      <input class="input input-bordered join-item w-full" [ngModel]="draft().slug"
                             (ngModelChange)="patch({ slug: slugify($event) })" name="slug" placeholder="spa-aurora">
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
                          (ngModelChange)="patch({ description: $event })" name="desc"
                          placeholder="Masajes, faciales y estética en Sopocachi."></textarea>
              </label>

              <fieldset class="mt-4">
                <legend class="mb-2 text-xs uppercase tracking-wider text-base-content/50">Color de marca</legend>
                <div class="flex flex-wrap items-center gap-2">
                  @for (c of swatches; track c) {
                    <button type="button" (click)="patch({ color: c })" [style.background-color]="c"
                            [attr.aria-label]="'Color ' + c" [attr.aria-pressed]="draft().color === c"
                            class="size-10 rounded-field border-2"
                            [class.border-primary]="draft().color === c"
                            [class.border-base-300]="draft().color !== c"></button>
                  }
                  <label class="grid size-10 cursor-pointer place-items-center rounded-field border-2 border-dashed border-base-300 text-lg leading-none">
                    +<input type="color" class="sr-only" [ngModel]="draft().color" name="color"
                            (ngModelChange)="patch({ color: $event })">
                  </label>
                </div>
              </fieldset>

              <p class="mt-4 text-sm text-warning">
                Sin plantillas de diseño en el MVP: logo + 1 color + descripción.
              </p>
            }

            @case (1) {
              <p class="text-sm text-base-content/60">
                Lo que tus clientes pueden comprar. Al menos uno para poder publicar.
              </p>
              <ul class="mt-4 space-y-2">
                @for (p of products(); track p.id) {
                  <li class="flex items-center gap-3 rounded-field border border-base-300 p-3">
                    <span class="badge badge-sm badge-ghost">{{ kindLabel[p.kind] }}</span>
                    <span class="min-w-0 flex-1 truncate">{{ p.name }}</span>
                    <span class="font-semibold tabular-nums">
                      {{ p.kind === 'open' ? (p.min | bs) + ' – ' + (p.max | bs) : (p.amount | bs) }}
                    </span>
                    <button type="button" class="btn btn-ghost btn-xs" (click)="removeProduct(p.id)">quitar</button>
                  </li>
                } @empty {
                  <li class="rounded-field border border-dashed border-base-300 p-6 text-center text-sm text-base-content/50">
                    Todavía no agregaste nada.
                  </li>
                }
              </ul>

              <div class="mt-4 rounded-box border border-base-300 p-4">
                <div class="flex flex-wrap gap-2">
                  @for (k of kinds; track k) {
                    <button type="button" class="btn btn-sm rounded-full font-normal normal-case"
                            [class.btn-primary]="newKind() === k" [class.btn-outline]="newKind() !== k"
                            (click)="newKind.set(k)">{{ kindLabel[k] }}</button>
                  }
                </div>
                <div class="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input class="input input-bordered w-full" [(ngModel)]="newName" name="pname"
                         [placeholder]="newKind() === 'service' ? 'Masaje relajante 60\\'' : 'Nombre visible'">
                  @if (newKind() === 'open') {
                    <div class="join">
                      <input type="number" class="input input-bordered join-item w-24" [(ngModel)]="newMin" name="pmin" placeholder="min">
                      <input type="number" class="input input-bordered join-item w-24" [(ngModel)]="newMax" name="pmax" placeholder="max">
                    </div>
                  } @else {
                    <input type="number" class="input input-bordered w-32" [(ngModel)]="newAmount" name="pamount" placeholder="Bs">
                  }
                </div>
                <button type="button" class="btn btn-outline btn-sm mt-3" (click)="addProduct()">+ Agregar</button>
              </div>
            }

            @case (2) {
              <label class="form-control block">
                <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">Vigencia</span>
                <div class="flex flex-wrap items-center gap-2">
                  @for (m of [6, 12, 18, 24]; track m) {
                    <button type="button" class="btn btn-sm rounded-full font-normal normal-case"
                            [class.btn-primary]="draft().validityMonths === m" [class.btn-outline]="draft().validityMonths !== m"
                            (click)="patch({ validityMonths: m })">{{ m }} meses</button>
                  }
                </div>
              </label>
              <p class="mt-2 text-sm text-base-content/60">
                Cuenta desde la emisión. Aparece al pie de cada gift card.
              </p>

              <label class="form-control mt-5 block">
                <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">Términos del comercio</span>
                <textarea class="textarea textarea-bordered h-32 w-full" [ngModel]="draft().terms"
                          (ngModelChange)="patch({ terms: $event })" name="terms"
                          placeholder="Dónde vale, si se puede transferir, qué pasa si no alcanza el saldo…"></textarea>
              </label>
            }

            @case (3) {
              <p class="text-sm text-base-content/60">
                A esta cuenta te depositamos cada fin de mes. No se comparte con tus empleados.
              </p>
              <div class="mt-4 grid gap-4 sm:grid-cols-2">
                @for (f of bankFields; track f.key) {
                  <label class="form-control block">
                    <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">{{ f.label }}</span>
                    <input class="input input-bordered w-full" [ngModel]="draft().bank[f.key]" [name]="f.key"
                           (ngModelChange)="patchBank(f.key, $event)" [placeholder]="f.placeholder">
                  </label>
                }
              </div>
            }

            @case (4) {
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
          <div class="mx-auto w-full max-w-[320px] overflow-hidden rounded-[2rem] border-4 border-base-content/80 bg-base-100">
            <app-storefront [business]="draft()" [productList]="products()" />
          </div>
        </aside>
      </div>
    </div>
    </div>
  </div>
  `,
})
export class Onboarding {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  readonly steps = STEPS;
  readonly swatches = SWATCHES;
  readonly kinds = ['fixed', 'open', 'service'] as const;
  readonly kindLabel = { fixed: 'Monto fijo', open: 'Monto abierto', service: 'Servicio' } as const;
  readonly bankFields = [
    { key: 'bank' as const, label: 'Banco', placeholder: 'BNB' },
    { key: 'account' as const, label: 'Cuenta', placeholder: '10-2345678' },
    { key: 'holder' as const, label: 'Titular', placeholder: 'Ana Rocha' },
    { key: 'nit' as const, label: 'NIT o CI', placeholder: '4821993015' },
  ];
  readonly slugify = slugify;

  readonly step = signal(0);
  readonly furthest = signal(0);
  readonly draft = signal<Business>({ ...EMPTY_BUSINESS });
  readonly products = signal<Product[]>([]);

  // alta de producto
  readonly newKind = signal<Product['kind']>('fixed');
  newName = '';
  newAmount: number | null = null;
  newMin: number | null = null;
  newMax: number | null = null;

  /** El slug lo escribe el nombre hasta que el usuario lo edita a mano. */
  private slugTouched = false;

  readonly checklist = computed(() => [
    { label: 'Nombre y link público', ok: !!this.draft().name && this.slugFree(), step: 0 },
    { label: 'Al menos un producto', ok: this.products().length > 0, step: 1 },
    { label: 'Vigencia definida', ok: this.draft().validityMonths > 0, step: 2 },
    { label: 'Datos bancarios completos', ok: Object.values(this.draft().bank).every(Boolean), step: 3 },
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

  patchBank(key: keyof Business['bank'], value: string) {
    this.draft.update(d => ({ ...d, bank: { ...d.bank, [key]: value } }));
  }

  onName(name: string) {
    this.draft.update(d => ({ ...d, name, slug: this.slugTouched ? d.slug : slugify(name) }));
  }

  onLogo(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.patch({ logoUrl: URL.createObjectURL(file) });
  }

  addProduct() {
    const kind = this.newKind();
    const name = this.newName.trim() || (kind === 'open' ? 'Monto abierto' : `Gift card Bs ${this.newAmount ?? 0}`);
    if (kind === 'open' ? !(this.newMin && this.newMax) : !this.newAmount) return;

    this.products.update(list => [...list, {
      id: crypto.randomUUID(), kind, name,
      ...(kind === 'open' ? { min: this.newMin!, max: this.newMax! } : { amount: this.newAmount! }),
    }]);
    this.newName = ''; this.newAmount = null; this.newMin = null; this.newMax = null;
  }

  removeProduct(id: string) { this.products.update(l => l.filter(p => p.id !== id)); }

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
      const id = await this.store.createTenant(
        { ...this.draft(), published: true },
        this.products().map(({ id: _drop, ...p }) => p));
      this.store.setCurrent(id);
      await this.router.navigate(['/app', id, 'resumen']);
    } catch {
      this.publishError.set('No pudimos publicar. Revisá tu conexión y probá de nuevo.');
    } finally {
      this.publishing.set(false);
    }
  }
}
