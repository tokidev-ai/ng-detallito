import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardState, GiftCard, Perm, Store, cardState } from '../data';
import { giftMessage, giftPath, mailtoLink, waLink } from '../card';
import { Storefront } from '../storefront';
import { GiftcardArt } from '../giftcard';
import { RedeemDialog } from './redeem';
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
  imports: [FormsModule, BsPipe, FechaPipe, Status, RedeemDialog, GiftcardArt],
  template: `
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div role="tablist" class="tabs tabs-box w-fit">
      @for (t of tabs; track t.id) {
        <button type="button" role="tab" class="tab" [class.tab-active]="tab() === t.id"
                (click)="tab.set(t.id)">{{ t.label }} ({{ count(t.id) }})</button>
      }
    </div>
    <div class="flex items-center gap-2">
      <app-redeem />
      <button type="button" class="btn btn-primary btn-sm" (click)="openNew()">+ Nueva gift card</button>
    </div>
  </div>

  <!-- buscador: aplica a las tres pestañas -->
  <label class="relative mt-4 block">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40">
      <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" stroke-linecap="round"/>
    </svg>
    <input class="input input-bordered input-sm w-full ps-9 sm:w-80" [(ngModel)]="search" name="q"
           placeholder="Buscar por código o destinatario">
    @if (search) {
      <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
              aria-label="Limpiar" (click)="search = ''">✕</button>
    }
  </label>

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
        <label class="form-control sm:col-span-2">
          <span class="mb-1 block text-sm text-base-content/60">De parte de <span class="text-base-content/40">(opcional)</span></span>
          <input class="input input-bordered w-full" [(ngModel)]="fFrom" name="from" placeholder="Quién regala — vacío = anónimo">
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
              <button type="button" class="btn btn-ghost btn-xs" (click)="sending.set(c)">enviar</button>
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
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" class="btn btn-outline btn-xs" (click)="sending.set(c)">enviar</button>
          <button type="button" class="btn btn-ghost btn-xs" (click)="openEdit(c)">editar</button>
          <button type="button" class="btn btn-ghost btn-xs text-error" (click)="del(c)">borrar</button>
        </div>
      </li>
    } @empty {
      <li class="py-8 text-center text-base-content/50">Nada aquí.</li>
    }
  </ul>

  <!-- enviar: overlay fijo (no lo recorta el scroll de la tabla) con el diseño -->
  @if (sending(); as c) {
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" (click)="sending.set(null)">
      <div class="w-full max-w-sm rounded-box bg-base-100 p-5 shadow-xl" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium">Enviar gift card</h3>
          <button type="button" class="btn btn-ghost btn-sm btn-square" (click)="sending.set(null)">✕</button>
        </div>
        <div class="mt-4"><app-giftcard-art [card]="c" [business]="s.business()" /></div>
        <div class="mt-4 grid grid-cols-2 gap-2">
          <a class="btn gap-2 text-white" style="background-color:#25D366;border-color:#25D366"
             [href]="waHref(c)" target="_blank" rel="noopener">WhatsApp</a>
          <a class="btn btn-outline" [href]="mailHref(c)">Correo</a>
        </div>
        <button type="button" class="btn btn-ghost btn-sm mt-2 w-full" (click)="copy(c)">
          {{ copiedCode() === c.code ? '¡Link copiado!' : 'Copiar link' }}
        </button>
      </div>
    </div>
  }
  `,
})
export class Emitidas {
  readonly s = inject(Store);
  readonly tabs = TABS;
  readonly tab = signal<CardState>('activa');
  readonly state = (c: GiftCard) => cardState(c);
  count(t: CardState) { return this.s.cards().filter(c => cardState(c) === t).length; }

  // filtro de fecha (solo canjeadas), ISO yyyy-mm-dd para comparar como texto
  desde = '';
  hasta = '';
  search = '';

  /** Método, no computed: depende de campos de texto planos (search/desde/hasta),
   *  así reevalúa en cada detección de cambios en vez de quedar cacheado. */
  visible(): GiftCard[] {
    let list = this.s.cards().filter(c => cardState(c) === this.tab());
    if (this.tab() === 'canjeada') {
      list = list.filter(c =>
        (!this.desde || c.expires >= this.desde) && (!this.hasta || c.expires <= this.hasta));
    }
    const q = this.search.trim().toLowerCase();
    if (q) list = list.filter(c => c.code.toLowerCase().includes(q) || c.to.toLowerCase().includes(q));
    return list;
  }

  // ── formulario ─────────────────────────────────────────────────────────────
  readonly formOpen = signal(false);
  editingCode: string | null = null;
  fCode = ''; fTo = ''; fFrom = ''; fValue: number | null = null; fBalance: number | null = null; fExpires = '';

  openNew() {
    this.editingCode = null;
    this.fCode = ''; this.fTo = ''; this.fFrom = ''; this.fValue = null; this.fBalance = null; this.fExpires = '';
    this.formOpen.set(true);
  }

  openEdit(c: GiftCard) {
    this.editingCode = c.code;
    this.fCode = c.code; this.fTo = c.to; this.fFrom = c.from ?? '';
    this.fValue = c.value; this.fBalance = c.balance; this.fExpires = c.expires;
    this.formOpen.set(true);
  }

  async save() {
    const code = this.fCode.trim();
    if (!code || this.fValue == null || !this.fExpires) return;
    await this.s.saveCard({
      code, to: this.fTo.trim(), value: this.fValue,
      balance: this.fBalance ?? this.fValue,  // saldo en blanco = carta entera
      expires: this.fExpires,
      ...(this.fFrom.trim() ? { from: this.fFrom.trim() } : {}),
    });
    this.formOpen.set(false);
  }

  async del(c: GiftCard) {
    if (confirm(`¿Borrar la gift card ${c.code} de ${c.to}?`)) await this.s.removeCard(c.code);
  }

  // ── enviar la gift card ─────────────────────────────────────────────────────
  readonly sending = signal<GiftCard | null>(null);
  readonly copiedCode = signal<string | null>(null);
  private shareUrl(c: GiftCard) { return `${location.origin}${giftPath(this.s.business().slug, c.code)}`; }
  waHref(c: GiftCard) { return waLink(giftMessage(this.s.business().name, this.shareUrl(c), c)); }
  mailHref(c: GiftCard) {
    return mailtoLink(`Tu gift card de ${this.s.business().name}`, giftMessage(this.s.business().name, this.shareUrl(c), c));
  }
  async copy(c: GiftCard) {
    try { await navigator.clipboard.writeText(this.shareUrl(c)); this.copiedCode.set(c.code); } catch { /* sin clipboard */ }
  }
}

@Component({
  selector: 'app-marca',
  imports: [FormsModule, Storefront, BsPipe],
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
        <h2 class="text-lg font-medium">Montos sugeridos</h2>
        <p class="mt-1 text-sm text-base-content/55">
          Aparecen como botones en tu página. El cliente igual puede escribir un monto libre,
          así que podés dejarlo vacío.
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          @for (a of b().suggestedAmounts; track a) {
            <span class="badge badge-lg gap-2 py-3">
              {{ a | bs }}
              <button type="button" class="text-base-content/50 hover:text-error" aria-label="Quitar"
                      (click)="removeAmount(a)">✕</button>
            </span>
          } @empty {
            <span class="text-sm text-base-content/45">Sin montos sugeridos todavía.</span>
          }
        </div>
        <div class="mt-3 flex gap-2">
          <input type="number" min="1" class="input input-bordered input-sm w-32" [(ngModel)]="newAmount"
                 name="newAmount" placeholder="Bs" (keyup.enter)="addAmount()">
          <button type="button" class="btn btn-outline btn-sm" (click)="addAmount()">+ Agregar</button>
        </div>
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
  newAmount: number | null = null;

  onLogo(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    // ponytail: objectURL, no Storage: se ve al instante y no sobrevive al reload.
    // Cuando entre Firebase Storage se sube aquí y se guarda la URL real.
    if (file) this.s.saveBusiness({ logoUrl: URL.createObjectURL(file) });
  }

  addAmount() {
    const a = this.newAmount;
    if (!a || a <= 0) return;
    const list = this.b().suggestedAmounts;
    if (!list.includes(a)) this.s.saveBusiness({ suggestedAmounts: [...list, a].sort((x, y) => x - y) });
    this.newAmount = null;
  }

  removeAmount(a: number) {
    this.s.saveBusiness({ suggestedAmounts: this.b().suggestedAmounts.filter(x => x !== a) });
  }
}

const PERMS = [
  ['redeem', 'Canjear gift cards'],
  ['viewCards', 'Ver listado y saldos'],
  ['viewSales', 'Ver ventas y dashboard'],
  ['manageProducts', 'Editar montos y página'],
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

