import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardState, GiftCard, Perm, Store, cardState } from '../data';
import { Storefront } from '../storefront';
import { BsPipe, FechaPipe, Status } from '../ui';

const TABS: { id: CardState; label: string }[] = [
  { id: 'activa', label: 'Activas' },
  { id: 'canjeada', label: 'Canjeadas' },
  { id: 'vencida', label: 'Vencidas' },
];

/** CRUD de las gift cards emitidas. El estado (activa/canjeada/vencida) no se
 *  guarda: se deriva del saldo y la fecha (`cardState`), así que las pestañas
 *  no filtran un campo sino que reparten por ese cálculo. Crear/editar/borrar
 *  escribe la subcolección `cards`; `code` es la identidad y no se edita. */
@Component({
  selector: 'app-emitidas',
  imports: [FormsModule, BsPipe, FechaPipe, Status],
  template: `
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div role="tablist" class="tabs tabs-box w-fit">
      @for (t of tabs; track t.id) {
        <button type="button" role="tab" class="tab" [class.tab-active]="tab() === t.id"
                (click)="tab.set(t.id)">{{ t.label }} ({{ count(t.id) }})</button>
      }
    </div>
    <button type="button" class="btn btn-primary btn-sm" (click)="openNew()">+ Nueva gift card</button>
  </div>

  <!-- filtro de fecha, solo en canjeadas -->
  @if (tab() === 'canjeada') {
    <div class="mt-4 flex flex-wrap items-end gap-3">
      <label class="form-control">
        <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">Desde</span>
        <input type="date" class="input input-bordered input-sm" [(ngModel)]="desde" name="desde">
      </label>
      <label class="form-control">
        <span class="mb-1 block text-xs uppercase tracking-wider text-base-content/50">Hasta</span>
        <input type="date" class="input input-bordered input-sm" [(ngModel)]="hasta" name="hasta">
      </label>
      @if (desde || hasta) {
        <button type="button" class="btn btn-ghost btn-sm" (click)="desde = ''; hasta = ''">limpiar</button>
      }
    </div>
  }

  <!-- alta / edición -->
  @if (formOpen()) {
    <div class="mt-4 rounded-box border border-base-300 bg-base-100 p-4 sm:p-5">
      <p class="text-xs uppercase tracking-wider text-base-content/50">
        {{ editingCode ? 'Editar ' + editingCode : 'Nueva gift card' }}
      </p>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <label class="form-control">
          <span class="mb-1 block text-sm text-base-content/60">Código</span>
          <input class="input input-bordered w-full font-mono" [(ngModel)]="fCode" name="code"
                 [disabled]="!!editingCode" placeholder="1234-AB5">
        </label>
        <label class="form-control">
          <span class="mb-1 block text-sm text-base-content/60">Destinatario</span>
          <input class="input input-bordered w-full" [(ngModel)]="fTo" name="to" placeholder="Nombre">
        </label>
        <label class="form-control">
          <span class="mb-1 block text-sm text-base-content/60">Valor (Bs)</span>
          <input type="number" class="input input-bordered w-full" [(ngModel)]="fValue" name="value">
        </label>
        <label class="form-control">
          <span class="mb-1 block text-sm text-base-content/60">Saldo (Bs)</span>
          <input type="number" class="input input-bordered w-full" [(ngModel)]="fBalance" name="balance"
                 placeholder="por defecto, el valor">
        </label>
        <label class="form-control sm:col-span-2">
          <span class="mb-1 block text-sm text-base-content/60">Vence</span>
          <input type="date" class="input input-bordered w-full sm:w-52" [(ngModel)]="fExpires" name="expires">
        </label>
      </div>
      <div class="mt-4 flex gap-2">
        <button type="button" class="btn btn-primary btn-sm" (click)="save()">Guardar</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="formOpen.set(false)">Cancelar</button>
      </div>
    </div>
  }

  <!-- escritorio: tabla -->
  <div class="mt-4 hidden overflow-x-auto rounded-box border border-base-300 sm:block">
    <table class="table">
      <thead>
        <tr class="text-xs uppercase tracking-wider">
          <th>Código</th><th>Destinatario</th><th>Valor</th><th>Saldo</th><th>Vence</th><th>Estado</th><th></th>
        </tr>
      </thead>
      <tbody>
        @for (c of visible(); track c.code) {
          <tr>
            <td class="font-mono">{{ c.code }}</td>
            <td>{{ c.to }}</td>
            <td class="tabular-nums">{{ c.value | bs }}</td>
            <td class="tabular-nums font-medium">{{ c.balance | bs }}</td>
            <td class="text-base-content/60">{{ c.expires | fecha }}</td>
            <td><app-status [status]="state(c)" /></td>
            <td class="text-right whitespace-nowrap">
              <button type="button" class="btn btn-ghost btn-xs" (click)="openEdit(c)">editar</button>
              <button type="button" class="btn btn-ghost btn-xs text-error" (click)="del(c)">borrar</button>
            </td>
          </tr>
        } @empty {
          <tr><td colspan="7" class="py-8 text-center text-base-content/50">Nada aquí.</td></tr>
        }
      </tbody>
    </table>
  </div>

  <!-- móvil: tarjetas, que una tabla de 7 columnas no entra -->
  <ul class="mt-4 space-y-2 sm:hidden">
    @for (c of visible(); track c.code) {
      <li class="rounded-box border border-base-300 bg-base-100 p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-mono">{{ c.code }}</p>
            <p class="truncate text-sm text-base-content/60">{{ c.to }}</p>
          </div>
          <app-status [status]="state(c)" />
        </div>
        <div class="mt-3 flex items-end justify-between">
          <p class="text-2xl font-semibold tabular-nums">{{ c.balance | bs }}</p>
          <p class="text-sm text-base-content/50">de {{ c.value | bs }} · vence {{ c.expires | fecha }}</p>
        </div>
        <div class="mt-3 flex gap-2">
          <button type="button" class="btn btn-ghost btn-xs" (click)="openEdit(c)">editar</button>
          <button type="button" class="btn btn-ghost btn-xs text-error" (click)="del(c)">borrar</button>
        </div>
      </li>
    } @empty {
      <li class="py-8 text-center text-base-content/50">Nada aquí.</li>
    }
  </ul>
  `,
})
export class Emitidas {
  private readonly s = inject(Store);
  readonly tabs = TABS;
  readonly tab = signal<CardState>('activa');
  readonly state = (c: GiftCard) => cardState(c);
  count(t: CardState) { return this.s.cards().filter(c => cardState(c) === t).length; }

  // filtro de fecha (solo canjeadas), ISO yyyy-mm-dd para comparar como texto
  desde = '';
  hasta = '';

  readonly visible = computed(() => {
    const list = this.s.cards().filter(c => cardState(c) === this.tab());
    if (this.tab() !== 'canjeada') return list;
    return list.filter(c =>
      (!this.desde || c.expires >= this.desde) && (!this.hasta || c.expires <= this.hasta));
  });

  // ── formulario ─────────────────────────────────────────────────────────────
  readonly formOpen = signal(false);
  editingCode: string | null = null;
  fCode = ''; fTo = ''; fValue: number | null = null; fBalance: number | null = null; fExpires = '';

  openNew() {
    this.editingCode = null;
    this.fCode = ''; this.fTo = ''; this.fValue = null; this.fBalance = null; this.fExpires = '';
    this.formOpen.set(true);
  }

  openEdit(c: GiftCard) {
    this.editingCode = c.code;
    this.fCode = c.code; this.fTo = c.to; this.fValue = c.value; this.fBalance = c.balance;
    this.fExpires = c.expires;
    this.formOpen.set(true);
  }

  async save() {
    const code = this.fCode.trim();
    if (!code || this.fValue == null || !this.fExpires) return;
    await this.s.saveCard({
      code, to: this.fTo.trim(), value: this.fValue,
      balance: this.fBalance ?? this.fValue,  // saldo en blanco = carta entera
      expires: this.fExpires,
    });
    this.formOpen.set(false);
  }

  async del(c: GiftCard) {
    if (confirm(`¿Borrar la gift card ${c.code} de ${c.to}?`)) await this.s.removeCard(c.code);
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
            } @else { <span>sube tu<br>logo</span> }
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
  readonly swatches = ['#18181b', '#0f766e', '#b91c1c', '#1d4ed8', '#a16207', '#7e22ce'];

  onLogo(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    // ponytail: objectURL, no Storage: se ve al instante y no sobrevive al reload.
    // Cuando entre Firebase Storage se sube aquí y se guarda la URL real.
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

