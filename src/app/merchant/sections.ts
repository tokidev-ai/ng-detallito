import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardStatus, Perm, ProductKind, Store } from '../data';
import { Storefront } from '../storefront';
import { BsPipe, Status } from '../ui';

const STATES: (CardStatus | 'todas')[] = ['todas', 'activa', 'parcial', 'canjeada', 'vencida', 'pagada'];

@Component({
  selector: 'app-gift-cards',
  imports: [BsPipe, Status],
  template: `
  <div class="flex flex-wrap items-center gap-2">
    @for (f of states; track f) {
      <button type="button" class="btn btn-sm rounded-full font-normal normal-case"
              [class.btn-primary]="filter() === f" [class.btn-outline]="filter() !== f"
              (click)="filter.set(f)">{{ f }}</button>
    }
  </div>

  <!-- escritorio: tabla -->
  <div class="mt-4 hidden overflow-x-auto rounded-box border border-base-300 sm:block">
    <table class="table">
      <thead>
        <tr class="text-xs uppercase tracking-wider">
          <th>Código</th><th>Destinatario</th><th>Valor</th><th>Saldo</th><th>Vence</th><th>Estado</th>
        </tr>
      </thead>
      <tbody>
        @for (c of visible(); track c.code) {
          <tr>
            <td class="font-mono">{{ c.code }}</td>
            <td>{{ c.to }}</td>
            <td class="tabular-nums">{{ c.value | bs }}</td>
            <td class="tabular-nums font-medium">{{ c.balance | bs }}</td>
            <td class="text-base-content/60">{{ c.expires }}</td>
            <td><app-status [status]="c.status" /></td>
          </tr>
        } @empty {
          <tr><td colspan="6" class="py-8 text-center text-base-content/50">Nada con ese filtro.</td></tr>
        }
      </tbody>
    </table>
  </div>

  <!-- móvil: tarjetas, que una tabla de 6 columnas no entra -->
  <ul class="mt-4 space-y-2 sm:hidden">
    @for (c of visible(); track c.code) {
      <li class="rounded-box border border-base-300 bg-base-100 p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-mono">{{ c.code }}</p>
            <p class="truncate text-sm text-base-content/60">{{ c.to }}</p>
          </div>
          <app-status [status]="c.status" />
        </div>
        <div class="mt-3 flex items-end justify-between">
          <p class="text-2xl font-semibold tabular-nums">{{ c.balance | bs }}</p>
          <p class="text-sm text-base-content/50">de {{ c.value | bs }} · vence {{ c.expires }}</p>
        </div>
      </li>
    } @empty {
      <li class="py-8 text-center text-base-content/50">Nada con ese filtro.</li>
    }
  </ul>
  `,
})
export class GiftCards {
  private readonly s = inject(Store);
  readonly states = STATES;
  readonly filter = signal<CardStatus | 'todas'>('todas');
  readonly visible = computed(() => {
    const f = this.filter();
    return f === 'todas' ? this.s.cards() : this.s.cards().filter(c => c.status === f);
  });
}

@Component({
  selector: 'app-canjes',
  imports: [BsPipe],
  template: `
  <ul class="divide-y divide-base-200 rounded-box border border-base-300 bg-base-100">
    @for (r of s.redemptions(); track r.at) {
      <li class="flex flex-wrap items-center gap-x-3 gap-y-1 p-4">
        <span class="font-mono">{{ r.code }}</span>
        <span class="text-base-content/60">{{ r.by }}</span>
        <span class="text-sm text-base-content/50">{{ r.at }}</span>
        <span class="ms-auto tabular-nums font-medium">−{{ r.amount | bs }}</span>
      </li>
    }
  </ul>
  <p class="mt-3 text-sm text-warning">append-only: acá no se edita nada, solo se agregan canjes.</p>
  `,
})
export class Canjes { readonly s = inject(Store); }

@Component({
  selector: 'app-productos',
  imports: [FormsModule, BsPipe],
  template: `
  <ul class="space-y-2">
    @for (p of s.products(); track p.id) {
      <li class="flex flex-wrap items-center gap-3 rounded-box border border-base-300 bg-base-100 p-4">
        <span class="badge badge-sm badge-ghost">{{ label[p.kind] }}</span>
        <span class="min-w-0 flex-1 truncate">{{ p.name }}</span>
        <span class="tabular-nums font-semibold">
          {{ p.kind === 'open' ? (p.min | bs) + ' – ' + (p.max | bs) : (p.amount | bs) }}
        </span>
        <button type="button" class="btn btn-ghost btn-xs" (click)="s.removeProduct(p.id)">quitar</button>
      </li>
    } @empty {
      <li class="rounded-box border border-dashed border-base-300 p-8 text-center text-base-content/55">
        Sin productos tu página no puede vender nada.
      </li>
    }
  </ul>

  <div class="mt-4 rounded-box border border-base-300 bg-base-100 p-4 sm:p-5">
    <p class="text-xs uppercase tracking-wider text-base-content/50">Agregar</p>
    <div class="mt-3 flex flex-wrap gap-2">
      @for (k of kinds; track k) {
        <button type="button" class="btn btn-sm rounded-full font-normal normal-case"
                [class.btn-primary]="kind() === k" [class.btn-outline]="kind() !== k"
                (click)="kind.set(k)">{{ label[k] }}</button>
      }
    </div>
    <div class="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
      <input class="input input-bordered w-full" [(ngModel)]="name" name="pname" placeholder="Nombre visible">
      @if (kind() === 'open') {
        <div class="join">
          <input type="number" class="input input-bordered join-item w-24" [(ngModel)]="min" name="pmin" placeholder="min">
          <input type="number" class="input input-bordered join-item w-24" [(ngModel)]="max" name="pmax" placeholder="max">
        </div>
      } @else {
        <input type="number" class="input input-bordered w-32" [(ngModel)]="amount" name="pamount" placeholder="Bs">
      }
    </div>
    <button type="button" class="btn btn-outline btn-sm mt-3" (click)="add()">+ Agregar</button>
  </div>
  `,
})
export class Productos {
  readonly s = inject(Store);
  readonly label = { fixed: 'Monto fijo', open: 'Monto abierto', service: 'Servicio' } as const;
  readonly kinds = ['fixed', 'open', 'service'] as const;

  readonly kind = signal<ProductKind>('fixed');
  name = '';
  amount: number | null = null;
  min: number | null = null;
  max: number | null = null;

  async add() {
    const kind = this.kind();
    if (kind === 'open' ? !(this.min && this.max) : !this.amount) return;
    const name = this.name.trim() || (kind === 'open' ? 'Monto abierto' : `Gift card Bs ${this.amount}`);
    await this.s.addProduct({
      kind, name,
      ...(kind === 'open' ? { min: this.min!, max: this.max! } : { amount: this.amount! }),
    });
    this.name = ''; this.amount = null; this.min = null; this.max = null;
  }
}

@Component({
  selector: 'app-marca',
  imports: [FormsModule, Storefront],
  template: `
  <div class="grid gap-6 lg:grid-cols-[1fr_320px]">

    <div class="space-y-6">
      <section class="rounded-box border border-base-300 bg-base-100 p-5 sm:p-6">
        <h2 class="text-lg font-medium">Tu marca</h2>

        <div class="mt-5 flex flex-col gap-5 sm:flex-row">
          <label class="grid h-28 w-28 shrink-0 cursor-pointer place-items-center rounded-box border-2 border-dashed border-base-300 text-center text-sm text-base-content/50 hover:border-primary/50">
            @if (b().logoUrl) {
              <img [src]="b().logoUrl" alt="logo" class="size-full rounded-box object-cover">
            } @else { <span>subí tu<br>logo</span> }
            <input type="file" accept="image/*" class="hidden" (change)="onLogo($event)">
          </label>

          <div class="flex-1 space-y-4">
            <label class="form-control block">
              <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">Nombre</span>
              <input class="input input-bordered w-full" [ngModel]="b().name" name="name"
                     (ngModelChange)="s.saveBusiness({ name: $event })">
            </label>

            <label class="form-control block">
              <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">Descripción corta</span>
              <textarea class="textarea textarea-bordered h-20 w-full" [ngModel]="b().description" name="desc"
                        (ngModelChange)="s.saveBusiness({ description: $event })"></textarea>
            </label>
          </div>
        </div>

        <fieldset class="mt-5">
          <legend class="mb-2 text-xs uppercase tracking-wider text-base-content/50">Color de marca</legend>
          <div class="flex flex-wrap items-center gap-2">
            @for (c of swatches; track c) {
              <button type="button" (click)="s.saveBusiness({ color: c })" [style.background-color]="c"
                      [attr.aria-label]="'Color ' + c" [attr.aria-pressed]="b().color === c"
                      class="size-10 rounded-field border-2"
                      [class.border-primary]="b().color === c"
                      [class.border-base-300]="b().color !== c"></button>
            }
            <label class="grid size-10 cursor-pointer place-items-center rounded-field border-2 border-dashed border-base-300 text-lg leading-none">
              +<input type="color" class="sr-only" [ngModel]="b().color" name="color"
                      (ngModelChange)="s.saveBusiness({ color: $event })">
            </label>
          </div>
        </fieldset>
      </section>

      <section class="rounded-box border border-base-300 bg-base-100 p-5 sm:p-6">
        <h2 class="text-lg font-medium">Vigencia y términos</h2>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          @for (m of [6, 12, 18, 24]; track m) {
            <button type="button" class="btn btn-sm rounded-full font-normal normal-case"
                    [class.btn-primary]="b().validityMonths === m" [class.btn-outline]="b().validityMonths !== m"
                    (click)="s.saveBusiness({ validityMonths: m })">{{ m }} meses</button>
          }
        </div>
        <p class="mt-2 text-sm text-base-content/55">Cuenta desde la emisión. Aparece al pie de cada gift card.</p>

        <label class="form-control mt-5 block">
          <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">Términos del comercio</span>
          <textarea class="textarea textarea-bordered h-28 w-full" [ngModel]="b().terms" name="terms"
                    (ngModelChange)="s.saveBusiness({ terms: $event })"
                    placeholder="Dónde vale, si se puede transferir, qué pasa si no alcanza el saldo…"></textarea>
        </label>
      </section>

      <section class="rounded-box border border-base-300 bg-base-100 p-5 sm:p-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="min-w-0 flex-1">
            <h2 class="text-lg font-medium">{{ b().published ? 'Tu página está publicada' : 'Tu página está en borrador' }}</h2>
            <p class="mt-1 break-all font-mono text-sm text-base-content/55">giftcards.bo/{{ b().slug }}</p>
          </div>
          <a class="btn btn-outline btn-sm" [href]="'/' + b().slug" target="_blank" rel="noopener">Ver mi página</a>
          <button type="button" class="btn btn-sm"
                  [class.btn-outline]="b().published" [class.btn-primary]="!b().published"
                  (click)="s.saveBusiness({ published: !b().published })">
            {{ b().published ? 'Despublicar' : 'Publicar' }}
          </button>
        </div>
        <p class="mt-3 text-sm text-base-content/55">
          Despublicada, el link deja de funcionar para tus clientes. Las gift cards ya vendidas se siguen canjeando.
        </p>
      </section>
    </div>

    <!-- lo que se está editando, en vivo -->
    <aside class="lg:sticky lg:top-6 lg:self-start">
      <p class="mb-3 text-xs uppercase tracking-wider text-base-content/50">Así se ve tu página</p>
      <div class="mx-auto w-full max-w-[300px] overflow-hidden rounded-[2rem] border-4 border-base-300 bg-base-100">
        <app-storefront />
      </div>
    </aside>
  </div>
  `,
})
export class Marca {
  readonly s = inject(Store);
  readonly b = this.s.business;
  readonly swatches = ['#1c1b18', '#3b7d6e', '#a94434', '#3b6ea5', '#b07d22', '#951fd2'];

  onLogo(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    // ponytail: objectURL, no Storage: se ve al instante y no sobrevive al reload.
    // Cuando entre Firebase Storage se sube acá y se guarda la URL real.
    if (file) this.s.saveBusiness({ logoUrl: URL.createObjectURL(file) });
  }
}

const PERMS = [
  ['redeem', 'Canjear gift cards'],
  ['viewCards', 'Ver listado y saldos'],
  ['viewSales', 'Ver ventas y dashboard'],
  ['manageProducts', 'Crear y editar productos'],
  ['manageBranding', 'Editar marca y página'],
  ['manageStaff', 'Agregar y quitar empleados'],
] as const;

@Component({
  selector: 'app-equipo',
  template: `
  <ul class="space-y-4">
    @for (m of s.staff(); track m.email) {
      <li class="rounded-box border border-base-300 bg-base-100">
        <div class="flex flex-wrap items-center gap-2 border-b border-base-300 p-4">
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium">{{ m.email }}</p>
            <p class="text-sm text-base-content/50">{{ m.role }} · último acceso {{ m.lastSeen }}</p>
          </div>
          <button type="button" class="btn btn-ghost btn-xs">quitar</button>
        </div>
        <ul class="grid gap-1 p-4 sm:grid-cols-2">
          @for (p of perms; track p[0]) {
            <li>
              <label class="flex cursor-pointer items-start gap-3 rounded-field p-2 hover:bg-base-200">
                <input type="checkbox" class="checkbox checkbox-sm mt-0.5"
                       [checked]="m.perms[p[0]]" (change)="toggle(m.email, p[0])">
                <span>
                  <span class="block font-mono text-sm">{{ p[0] }}</span>
                  <span class="block text-sm text-base-content/55">{{ p[1] }}</span>
                </span>
              </label>
            </li>
          }
        </ul>
        <p class="border-t border-base-300 p-4 text-sm text-base-content/60">
          Datos bancarios y liquidaciones no se delegan nunca.
        </p>
      </li>
    }
  </ul>
  <p class="mt-4 text-sm text-warning">la UI oculta; las Firestore Rules son las que mandan.</p>
  `,
})
export class Equipo {
  readonly s = inject(Store);
  readonly perms = PERMS;
  toggle(email: string, key: Perm) { this.s.togglePerm(email, key); }
}

@Component({
  selector: 'app-cobros',
  imports: [BsPipe],
  template: `
  <div class="grid gap-4 sm:grid-cols-2">
    <div class="rounded-box border border-base-300 bg-base-100 p-4 sm:p-6">
      <p class="text-xs uppercase tracking-wider text-base-content/50">A depositarte (30/09)</p>
      <p class="mt-1 text-4xl font-semibold tabular-nums">{{ s.netToCollect() | bs }}</p>
      <p class="mt-1 text-sm text-base-content/60">bruto {{ s.soldThisMonth() | bs }} − comisión 5%</p>
    </div>
    <div class="rounded-box border border-base-300 bg-base-100 p-4 sm:p-6">
      <p class="text-xs uppercase tracking-wider text-base-content/50">Cuenta de depósito</p>
      <dl class="mt-2 space-y-1 text-sm">
        <div class="flex justify-between gap-3"><dt class="text-base-content/50">Banco</dt><dd>{{ s.business().bank.bank }}</dd></div>
        <div class="flex justify-between gap-3"><dt class="text-base-content/50">Cuenta</dt><dd class="font-mono">{{ s.business().bank.account }}</dd></div>
        <div class="flex justify-between gap-3"><dt class="text-base-content/50">Titular</dt><dd>{{ s.business().bank.holder }}</dd></div>
        <div class="flex justify-between gap-3"><dt class="text-base-content/50">NIT</dt><dd class="font-mono">{{ s.business().bank.nit }}</dd></div>
      </dl>
    </div>
  </div>
  `,
})
export class Cobros { readonly s = inject(Store); }
