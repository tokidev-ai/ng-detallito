import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Business, CardState, GiftCard, Perm, Store, cardState } from '../data';
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
        <button type="button" role="tab" class="tab" [class.tab-active]="section() === t.id"
                (click)="section.set(t.id)">{{ t.label }} ({{ count(t.id) }})</button>
      }
      <button type="button" role="tab" class="tab" [class.tab-active]="section() === 'montos'"
              (click)="section.set('montos')">Montos sugeridos</button>
    </div>
    @if (section() !== 'montos') {
      <div class="flex items-center gap-2">
        <app-redeem />
        <button type="button" class="btn btn-primary btn-sm" (click)="openNew()">+ Nueva gift card</button>
      </div>
    }
  </div>

  <!-- ── Montos sugeridos ── -->
  @if (section() === 'montos') {
    <div class="mt-5 max-w-xl rounded-box border border-base-300 bg-base-100 p-5 sm:p-6">
      <h2 class="text-lg font-medium">Montos sugeridos</h2>
      <p class="mt-1 text-sm text-base-content/55">
        Aparecen como botones en tu página. El cliente igual puede escribir un monto libre,
        así que puedes dejarlo vacío.
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        @for (a of s.business().suggestedAmounts; track a) {
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

      <label class="mt-5 flex cursor-pointer items-start gap-3 border-t border-base-200 pt-4">
        <input type="checkbox" class="toggle toggle-primary toggle-sm mt-0.5"
               [checked]="s.business().allowCustomAmount !== false" (change)="toggleCustom($event)">
        <span>
          <span class="block text-sm font-medium">Permitir monto libre</span>
          <span class="block text-xs text-base-content/55">
            Si lo apagas, el cliente solo elige uno de los montos de arriba (necesitas al menos uno).
          </span>
        </span>
      </label>
    </div>
  } @else {

  <!-- buscador: aplica a las tres pestañas de estado -->
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
  @if (section() === 'canjeada') {
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
  }
  `,
})
export class Emitidas {
  readonly s = inject(Store);
  readonly tabs = TABS;
  /** Las 3 pestañas de estado + una de configuración (montos sugeridos). */
  readonly section = signal<CardState | 'montos'>('activa');
  readonly state = (c: GiftCard) => cardState(c);
  count(t: CardState) { return this.s.cards().filter(c => cardState(c) === t).length; }

  // filtro de fecha (solo canjeadas), ISO yyyy-mm-dd para comparar como texto
  desde = '';
  hasta = '';
  search = '';

  /** Método, no computed: depende de campos de texto planos (search/desde/hasta),
   *  así reevalúa en cada detección de cambios en vez de quedar cacheado. */
  visible(): GiftCard[] {
    let list = this.s.cards().filter(c => cardState(c) === this.section());
    if (this.section() === 'canjeada') {
      list = list.filter(c =>
        (!this.desde || c.expires >= this.desde) && (!this.hasta || c.expires <= this.hasta));
    }
    const q = this.search.trim().toLowerCase();
    if (q) list = list.filter(c => c.code.toLowerCase().includes(q) || c.to.toLowerCase().includes(q));
    return list;
  }

  // ── montos sugeridos (se reflejan en la página del cliente) ──────────────────
  newAmount: number | null = null;
  addAmount() {
    const a = this.newAmount;
    if (!a || a <= 0) return;
    const list = this.s.business().suggestedAmounts;
    if (!list.includes(a)) this.s.saveBusiness({ suggestedAmounts: [...list, a].sort((x, y) => x - y) });
    this.newAmount = null;
  }
  removeAmount(a: number) {
    this.s.saveBusiness({ suggestedAmounts: this.s.business().suggestedAmounts.filter(x => x !== a) });
  }
  toggleCustom(e: Event) {
    this.s.saveBusiness({ allowCustomAmount: (e.target as HTMLInputElement).checked });
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

  /** El atajo "Nueva gift card" del dashboard llega con ?nueva=1: abrimos el formulario. */
  constructor() {
    if (inject(ActivatedRoute).snapshot.queryParamMap.has('nueva')) this.openNew();
  }

  async save() {
    const code = this.fCode.trim();
    if (!code || this.fValue == null || !this.fExpires) return;
    // setDoc reemplaza la carta entera: al editar conservamos cuándo y por dónde se vendió
    const prev = this.editingCode ? this.s.cards().find(c => c.code === this.editingCode) : undefined;
    await this.s.saveCard({
      code, to: this.fTo.trim(), value: this.fValue,
      balance: this.fBalance ?? this.fValue,  // saldo en blanco = carta entera
      expires: this.fExpires,
      ...(this.fFrom.trim() ? { from: this.fFrom.trim() } : {}),
      ...(prev ? { ...(prev.soldAt ? { soldAt: prev.soldAt } : {}), ...(prev.channel ? { channel: prev.channel } : {}) }
               : { soldAt: new Date().toISOString(), channel: 'panel' as const }),
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
  imports: [FormsModule, Storefront],
  // cerrar/recargar la pestaña con cambios sin guardar: el navegador pregunta.
  // Ojo: un handler que devuelve `false` hace que Angular llame preventDefault()
  // solo; por eso es un método sin retorno y no `dirty() && …`.
  host: { '(window:beforeunload)': 'warnUnsaved($event)' },
  template: `
  <div class="grid gap-6 lg:grid-cols-[1fr_320px]">

    <div class="space-y-6">
      <section class="rounded-box border border-base-300 bg-base-100 p-5 sm:p-6">
        <h2 class="text-lg font-medium">Tu marca</h2>

        <div class="mt-5 flex flex-col gap-5 sm:flex-row">
          <label class="grid h-28 w-28 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-box border-2 border-dashed border-base-300 text-center text-sm text-base-content/50 transition hover:border-primary/50 hover:bg-base-200">
            @if (v().logoUrl) {
              <img [src]="v().logoUrl" alt="logo" class="size-full object-cover">
            } @else { <span>sube tu<br>logo</span> }
            <input type="file" accept="image/*" class="hidden" (change)="onLogo($event)">
          </label>

          <div class="flex-1 space-y-4">
            <label class="form-control block">
              <span class="mb-1 block text-xs font-medium uppercase tracking-wider text-base-content/50">Nombre</span>
              <input class="input input-bordered w-full" [ngModel]="v().name" name="name"
                     (ngModelChange)="edit({ name: $event })">
            </label>

            <label class="form-control block">
              <span class="mb-1 block text-xs font-medium uppercase tracking-wider text-base-content/50">Descripción corta</span>
              <textarea class="textarea textarea-bordered h-20 w-full" [ngModel]="v().description" name="desc"
                        (ngModelChange)="edit({ description: $event })"></textarea>
            </label>
          </div>
        </div>

        <fieldset class="mt-5">
          <legend class="mb-2 text-xs font-medium uppercase tracking-wider text-base-content/50">Color de marca</legend>
          <div class="flex flex-wrap items-center gap-2">
            @for (c of swatches; track c) {
              <button type="button" (click)="edit({ color: c })" [style.background-color]="c"
                      [attr.aria-label]="'Color ' + c" [attr.aria-pressed]="v().color === c"
                      class="grid size-10 place-items-center rounded-xl text-white ring-offset-2 transition hover:scale-105"
                      [class.ring-2]="v().color === c" [class.ring-base-content]="v().color === c">
                @if (v().color === c) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="size-4"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                }
              </button>
            }
            <label class="grid size-10 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-base-300 text-lg leading-none transition hover:border-base-content/30"
                   title="Otro color">
              +<input type="color" class="sr-only" [ngModel]="v().color" name="color"
                      (ngModelChange)="edit({ color: $event })">
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

      @if (s.isOwner()) {
        <section class="rounded-box border border-error/30 bg-error/5 p-5 sm:p-6">
          <h2 class="text-lg font-medium text-error">Zona de peligro</h2>
          <p class="mt-1 text-sm text-base-content/60">
            Borrar el negocio elimina su página y su panel para siempre. No se puede deshacer.
          </p>
          <button type="button" class="btn btn-outline btn-error btn-sm mt-4" (click)="confirmingDelete.set(true)">
            Borrar negocio
          </button>
        </section>
      }
    </div>

    <!-- lo que se está editando, en vivo -->
    <aside class="lg:sticky lg:top-6 lg:self-start">
      <p class="mb-3 text-xs uppercase tracking-wider text-base-content/50">Así se ve tu página</p>
      <div class="phone-preview mx-auto w-[328px] max-w-full rounded-[2rem] border-4 border-base-content/80 bg-base-100 shadow-xl">
        <app-storefront [business]="v()" />
      </div>
      @if (dirty()) {
        <p class="mt-3 text-center text-xs text-base-content/50">Vista previa con cambios sin guardar</p>
      }
    </aside>
  </div>

  <!-- barra de guardado: solo aparece con cambios pendientes -->
  @if (dirty() || justSaved()) {
    <div class="pop fixed bottom-24 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 md:bottom-8 md:left-[calc(50%+8rem)]">
      <div class="flex items-center gap-3 rounded-2xl bg-neutral p-3 pl-4 text-neutral-content shadow-2xl">
        @if (dirty()) {
          <span class="relative flex size-2.5">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-75"></span>
            <span class="relative inline-flex size-2.5 rounded-full bg-warning"></span>
          </span>
          <p class="min-w-0 flex-1 truncate text-sm font-medium">Cambios sin guardar</p>
          <button type="button" class="btn btn-ghost btn-sm text-neutral-content" (click)="discard()" [disabled]="saving()">Descartar</button>
          <button type="button" class="btn btn-primary btn-sm" (click)="save()" [disabled]="saving()">
            @if (saving()) { <span class="loading loading-spinner loading-xs"></span> } Guardar cambios
          </button>
        } @else {
          <span class="grid size-6 place-items-center rounded-full bg-success text-success-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="size-3.5"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <p class="flex-1 text-sm font-medium">Cambios guardados</p>
        }
      </div>
    </div>
  }

  <!-- borrar negocio: modal con confirmación tipeando el nombre -->
  @if (confirmingDelete()) {
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" (click)="cancelDelete()">
      <div class="w-full max-w-sm rounded-box bg-base-100 p-5 shadow-xl" (click)="$event.stopPropagation()">
        <h3 class="text-lg font-medium text-error">Borrar “{{ b().name }}”</h3>
        <p class="mt-2 text-sm text-base-content/70">
          Esto elimina el negocio, su página pública y su panel. No se puede deshacer.
        </p>
        <label class="mt-4 block">
          <span class="mb-1 block text-sm text-base-content/60">Escribe <b>{{ b().name }}</b> para confirmar</span>
          <input class="input input-bordered w-full" [(ngModel)]="deleteText" name="delText" [placeholder]="b().name">
        </label>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="btn btn-ghost btn-sm" (click)="cancelDelete()" [disabled]="deleting()">Cancelar</button>
          <button type="button" class="btn btn-error btn-sm" (click)="deleteBusiness()"
                  [disabled]="deleting() || deleteText.trim() !== b().name">
            {{ deleting() ? 'Borrando…' : 'Borrar para siempre' }}
          </button>
        </div>
      </div>
    </div>
  }
  `,
})
export class Marca {
  readonly s = inject(Store);
  private readonly router = inject(Router);
  readonly b = this.s.business;
  readonly swatches = ['#18181b', '#0f766e', '#b91c1c', '#1d4ed8', '#a16207', '#7e22ce'];

  // ── borrador: nada se guarda hasta "Guardar cambios" ─────────────────────────
  /** Cambios pendientes sobre lo guardado. La vista previa y los campos muestran `v()`. */
  readonly draft = signal<Partial<Business>>({});
  readonly v = computed<Business>(() => ({ ...this.b(), ...this.draft() }));
  /** Solo lo que de verdad difiere de lo guardado (volver al valor original no cuenta). */
  private readonly changes = computed(() => Object.fromEntries(
    Object.entries(this.draft()).filter(([k, val]) => this.b()[k as keyof Business] !== val)) as Partial<Business>);
  readonly dirty = computed(() => Object.keys(this.changes()).length > 0);
  readonly saving = signal(false);
  readonly justSaved = signal(false);

  edit(patch: Partial<Business>) { this.draft.update(d => ({ ...d, ...patch })); }
  discard() { this.draft.set({}); }
  warnUnsaved(e: BeforeUnloadEvent) { if (this.dirty()) e.preventDefault(); }

  async save() {
    if (!this.dirty() || this.saving()) return;
    this.saving.set(true);
    try {
      await this.s.saveBusiness(this.changes());
      this.draft.set({});
      this.justSaved.set(true);
      setTimeout(() => this.justSaved.set(false), 2200);
    } finally {
      this.saving.set(false);
    }
  }

  readonly confirmingDelete = signal(false);
  readonly deleting = signal(false);
  deleteText = '';

  cancelDelete() { this.confirmingDelete.set(false); this.deleteText = ''; }

  async deleteBusiness() {
    if (this.deleteText.trim() !== this.b().name || this.deleting()) return;
    this.deleting.set(true);
    try {
      await this.s.deleteTenant();
      this.s.setCurrent(null);
      await this.router.navigate(['/app']);
    } finally {
      this.deleting.set(false);
    }
  }

  onLogo(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    // ponytail: objectURL, no Storage: se ve al instante y no sobrevive al reload.
    // Cuando entre Firebase Storage se sube aquí y se guarda la URL real.
    if (file) this.edit({ logoUrl: URL.createObjectURL(file) });
  }
}

/** Los permisos, agrupados por el tab que habilitan: así el dueño reparte
 *  "acceso a cada tab" en vez de flags sueltos. */
const PERM_GROUPS: { tab: string; items: [Perm, string][] }[] = [
  { tab: 'Dashboard', items: [['viewSales', 'Ver ventas y deuda']] },
  { tab: 'Gift cards', items: [['viewCards', 'Ver listado y saldos'], ['redeem', 'Canjear gift cards']] },
  { tab: 'Editar página', items: [['manageBranding', 'Editar marca y página'], ['manageProducts', 'Editar montos sugeridos']] },
  { tab: 'Equipo', items: [['manageStaff', 'Agregar y quitar empleados']] },
];

/** Empleado nuevo arranca como cajero: canjea y ve cartas, nada más. */
const CASHIER: Record<Perm, boolean> = {
  redeem: true, viewCards: true, viewSales: false,
  manageProducts: false, manageBranding: false, manageStaff: false,
};

@Component({
  selector: 'app-equipo',
  imports: [FormsModule],
  template: `
  <!-- invitar -->
  <div class="rounded-box border border-base-300 bg-base-100 p-4 sm:p-5">
    <p class="text-xs uppercase tracking-wider text-base-content/50">Agregar al equipo</p>
    <div class="mt-3 flex flex-wrap gap-2">
      <input type="email" class="input input-bordered input-sm w-full sm:w-80" [(ngModel)]="email" name="newEmail"
             placeholder="correo@empleado.com" (keyup.enter)="add()">
      <button type="button" class="btn btn-primary btn-sm" (click)="add()">+ Agregar</button>
    </div>
    @if (error()) { <p class="mt-2 text-sm text-error">{{ error() }}</p> }
    <p class="mt-2 text-sm text-base-content/55">
      Entra con ese correo (Google) y ve solo los tabs que le habilites. Arranca como cajero.
    </p>
  </div>

  <ul class="mt-4 space-y-4">
    @for (m of s.staff(); track m.email) {
      <li class="rounded-box border border-base-300 bg-base-100">
        <div class="flex flex-wrap items-center gap-2 border-b border-base-300 p-4">
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium">{{ m.email }}</p>
            <p class="text-sm text-base-content/50">
              @if (m.role === 'owner') { dueño · acceso total } @else { empleado · último acceso {{ m.lastSeen }} }
            </p>
          </div>
          @if (m.role !== 'owner') {
            <button type="button" class="btn btn-ghost btn-xs text-error" (click)="removing.set(m.email)">quitar</button>
          }
        </div>

        @if (m.role === 'owner') {
          <p class="p-4 text-sm text-base-content/55">El dueño ve y gestiona todos los tabs.</p>
        } @else {
          <div class="grid gap-x-6 gap-y-4 p-4 sm:grid-cols-2">
            @for (g of groups; track g.tab) {
              <div>
                <p class="mb-1 text-xs font-medium uppercase tracking-wider text-base-content/50">{{ g.tab }}</p>
                @for (it of g.items; track it[0]) {
                  <label class="flex cursor-pointer items-center gap-3 rounded-field p-1.5 hover:bg-base-200">
                    <input type="checkbox" class="toggle toggle-sm" [checked]="m.perms[it[0]]"
                           (change)="s.togglePerm(m.email, it[0])">
                    <span class="text-sm">{{ it[1] }}</span>
                  </label>
                }
              </div>
            }
          </div>
        }
      </li>
    }
  </ul>

  <!-- quitar empleado: modal, no alert -->
  @if (removing(); as email) {
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" (click)="removing.set(null)">
      <div class="w-full max-w-sm rounded-box bg-base-100 p-5 shadow-xl" (click)="$event.stopPropagation()">
        <h3 class="text-lg font-medium">Quitar del equipo</h3>
        <p class="mt-2 text-sm text-base-content/70">
          <span class="font-medium text-base-content">{{ email }}</span> dejará de tener acceso al negocio.
          Puedes volver a agregarlo cuando quieras.
        </p>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="btn btn-ghost btn-sm" (click)="removing.set(null)">Cancelar</button>
          <button type="button" class="btn btn-error btn-sm" (click)="confirmRemove(email)">Quitar</button>
        </div>
      </div>
    </div>
  }
  `,
})
export class Equipo {
  readonly s = inject(Store);
  readonly groups = PERM_GROUPS;
  email = '';
  readonly error = signal('');
  readonly removing = signal<string | null>(null);

  add() {
    const email = this.email.trim().toLowerCase();
    if (!email || !email.includes('@')) { this.error.set('Ingresa un correo válido.'); return; }
    if (this.s.staff().some(m => m.email === email)) { this.error.set('Ese correo ya está en el equipo.'); return; }
    this.error.set('');
    this.s.addStaff(email, { ...CASHIER });
    this.email = '';
  }

  confirmRemove(email: string) {
    this.s.removeStaff(email);
    this.removing.set(null);
  }
}

