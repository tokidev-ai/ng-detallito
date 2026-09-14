import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardStatus, Perm, Store } from '../data';
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
  imports: [BsPipe],
  template: `
  <ul class="space-y-2">
    @for (p of s.products(); track p.id) {
      <li class="flex flex-wrap items-center gap-3 rounded-box border border-base-300 bg-base-100 p-4">
        <span class="badge badge-sm badge-ghost">{{ label[p.kind] }}</span>
        <span class="min-w-0 flex-1 truncate">{{ p.name }}</span>
        <span class="tabular-nums font-semibold">
          {{ p.kind === 'open' ? (p.min | bs) + ' – ' + (p.max | bs) : (p.amount | bs) }}
        </span>
      </li>
    }
  </ul>
  `,
})
export class Productos {
  readonly s = inject(Store);
  readonly label = { fixed: 'Monto fijo', open: 'Monto abierto', service: 'Servicio' } as const;
}

@Component({
  selector: 'app-marca',
  imports: [FormsModule],
  template: `
  <div class="grid gap-6 lg:grid-cols-2">
    <div class="space-y-4">
      <label class="form-control block">
        <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">Nombre</span>
        <input class="input input-bordered w-full" [ngModel]="s.business().name"
               (ngModelChange)="s.saveBusiness({ name: $event })" name="name">
      </label>
      <label class="form-control block">
        <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">Descripción</span>
        <textarea class="textarea textarea-bordered h-24 w-full" [ngModel]="s.business().description"
                  (ngModelChange)="s.saveBusiness({ description: $event })" name="desc"></textarea>
      </label>
      <label class="form-control block">
        <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">Color de marca</span>
        <input type="color" class="h-12 w-24 rounded-field border border-base-300"
               [ngModel]="s.business().color" (ngModelChange)="s.saveBusiness({ color: $event })" name="color">
      </label>
    </div>

    <div class="rounded-box border border-base-300 bg-base-200 p-4">
      <p class="mb-3 text-xs uppercase tracking-wider text-base-content/50">Estado</p>
      <p class="text-lg">{{ s.business().published ? 'Publicada' : 'Borrador' }}</p>
      <p class="mt-1 break-all font-mono text-sm text-base-content/60">giftcards.bo/{{ s.business().slug }}</p>
      <button type="button" class="btn btn-outline btn-sm mt-4"
              (click)="s.saveBusiness({ published: !s.business().published })">
        {{ s.business().published ? 'Despublicar' : 'Publicar' }}
      </button>
    </div>
  </div>
  `,
})
export class Marca { readonly s = inject(Store); }

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
