import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Business, CardState, GiftCard, LIMITS, Perm, Store, cardState, logoDataUrl } from '../data';
import { expiryFrom, giftMessage, giftPath, mailtoLink, newCode, waLink } from '../card';
import { Storefront } from '../storefront';
import { GiftcardArt } from '../giftcard';
import { BrandDesign } from './brand-design';
import { LocationPicker } from './location-picker';
import { AmountsEditor } from './amounts-editor';
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
    </div>
    <div class="flex items-center gap-2">
      <app-redeem />
      <button type="button" class="btn btn-primary btn-sm" (click)="openNew()">+ Nueva gift card</button>
    </div>
  </div>


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
        <label class="form-control sm:col-span-2">
          <span class="mb-1 block text-sm text-base-content/60">Destinatario</span>
          <input class="input input-bordered w-full" [(ngModel)]="fTo" name="to" [maxlength]="limits.person" placeholder="Ej: Lucía Rojas">
          <span class="mt-1 block text-xs text-base-content/50">Hasta {{ limits.person }} caracteres.</span>
        </label>
        <label class="form-control sm:col-span-2">
          <span class="mb-1 block text-sm text-base-content/60">De parte de <span class="text-base-content/40">(opcional)</span></span>
          <input class="input input-bordered w-full" [(ngModel)]="fFrom" name="from" [maxlength]="limits.person" placeholder="Ej: Diego">
          <span class="mt-1 block text-xs text-base-content/50">Vacío = anónimo. Hasta {{ limits.person }} caracteres.</span>
        </label>
        <div class="sm:col-span-2">
          <span class="mb-1 block text-sm text-base-content/60">Valor</span>
          <div class="flex flex-wrap gap-2">
            @for (a of s.business().suggestedAmounts; track a) {
              <button type="button" class="btn btn-sm" [class.btn-neutral]="fValue === a" (click)="fValue = a">{{ a | bs }}</button>
            }
            <input type="number" min="1" [max]="limits.amountMax" class="input input-bordered input-sm w-32" [(ngModel)]="fValue" name="value"
                   [placeholder]="s.business().suggestedAmounts.length ? 'Otro monto' : 'Ej: 150'">
          </div>
          <span class="mt-1 block text-xs text-base-content/50">Entre Bs 1 y Bs {{ limits.amountMax.toLocaleString('es-BO') }}.</span>
        </div>
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
            <td class="max-w-56"><p class="truncate" [title]="c.to">{{ c.to }}</p></td>
            <td class="tabular-nums">{{ c.value | bs }}</td>
            <td class="tabular-nums font-medium">{{ c.balance | bs }}</td>
            <td class="text-base-content/60">{{ c.expires | fecha }}</td>
            <td><app-status [status]="state(c)" /></td>
            <td class="text-right whitespace-nowrap">
              <button type="button" class="btn btn-ghost btn-xs" (click)="viewing.set(c)">ver</button>
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
          <button type="button" class="btn btn-ghost btn-xs" (click)="viewing.set(c)">ver</button>
          <button type="button" class="btn btn-outline btn-xs" (click)="sending.set(c)">enviar</button>
          <button type="button" class="btn btn-ghost btn-xs" (click)="openEdit(c)">editar</button>
          <button type="button" class="btn btn-ghost btn-xs text-error" (click)="del(c)">borrar</button>
        </div>
      </li>
    } @empty {
      <li class="py-8 text-center text-base-content/50">Nada aquí.</li>
    }
  </ul>

  <!-- ver: todos los datos completos (en la lista se cortan los textos largos) -->
  @if (viewing(); as c) {
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" (click)="viewing.set(null)">
      <div class="w-full max-w-sm rounded-box bg-base-100 p-5 shadow-xl" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between gap-3">
          <h3 class="font-mono text-lg font-medium">{{ c.code }}</h3>
          <app-status [status]="state(c)" />
          <button type="button" class="btn btn-ghost btn-sm btn-square ms-auto" (click)="viewing.set(null)" aria-label="Cerrar">✕</button>
        </div>
        <dl class="mt-4 divide-y divide-base-200 text-sm">
          <div class="py-2"><dt class="text-base-content/55">Destinatario</dt><dd class="break-words font-medium">{{ c.to }}</dd></div>
          <div class="py-2"><dt class="text-base-content/55">De parte de</dt><dd class="break-words">{{ c.from || 'Anónimo' }}</dd></div>
          <div class="flex justify-between gap-4 py-2"><dt class="text-base-content/55">Valor</dt><dd class="tabular-nums">{{ c.value | bs }}</dd></div>
          <div class="flex justify-between gap-4 py-2"><dt class="text-base-content/55">Saldo</dt><dd class="font-medium tabular-nums">{{ c.balance | bs }}</dd></div>
          <div class="flex justify-between gap-4 py-2"><dt class="text-base-content/55">Vence</dt><dd>{{ c.expires | fecha }}</dd></div>
          @if (c.soldAt) {
            <div class="flex justify-between gap-4 py-2"><dt class="text-base-content/55">Vendida</dt><dd>{{ c.soldAt.slice(0, 10) | fecha }}</dd></div>
          }
        </dl>
        <div class="mt-4 flex gap-2">
          <button type="button" class="btn btn-outline btn-sm flex-1" (click)="viewing.set(null); sending.set(c)">Enviar</button>
          <button type="button" class="btn btn-ghost btn-sm flex-1" (click)="viewing.set(null); openEdit(c)">Editar</button>
        </div>
      </div>
    </div>
  }

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
  readonly limits = LIMITS;
  readonly s = inject(Store);
  readonly tabs = TABS;
  readonly section = signal<CardState>('activa');
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

  // ── formulario ─────────────────────────────────────────────────────────────
  readonly formOpen = signal(false);
  editingCode: string | null = null;
  fTo = ''; fFrom = ''; fValue: number | null = null; fExpires = '';

  openNew() {
    this.editingCode = null;
    this.fTo = ''; this.fFrom = ''; this.fValue = null;
    this.fExpires = expiryFrom(this.s.business().validityMonths || 12);
    this.formOpen.set(true);
  }

  openEdit(c: GiftCard) {
    this.editingCode = c.code;
    this.fTo = c.to; this.fFrom = c.from ?? '';
    this.fValue = c.value; this.fExpires = c.expires;
    this.formOpen.set(true);
  }

  /** El atajo "Nueva gift card" del dashboard llega con ?nueva=1: abrimos el formulario. */
  constructor() {
    if (inject(ActivatedRoute).snapshot.queryParamMap.has('nueva')) this.openNew();
  }

  async save() {
    if (!this.fValue || this.fValue < 1 || this.fValue > LIMITS.amountMax || !this.fExpires) return;
    // setDoc reemplaza la carta entera: al editar conservamos cuándo y por dónde se vendió
    const prev = this.editingCode ? this.s.cards().find(c => c.code === this.editingCode) : undefined;
    // el código lo generamos nosotros; repetimos si choca con una carta del comercio
    let code = this.editingCode ?? newCode();
    while (!prev && this.s.cards().some(c => c.code === code)) code = newCode();
    await this.s.saveCard({
      code, to: this.fTo.trim(), value: this.fValue,
      // el saldo sale del valor: nueva = entera; editar el valor corre el saldo lo mismo
      balance: prev ? Math.max(0, prev.balance + this.fValue - prev.value) : this.fValue,
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

  readonly viewing = signal<GiftCard | null>(null);

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
  imports: [FormsModule, Storefront, BrandDesign, LocationPicker, AmountsEditor],
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
          <div class="w-28 shrink-0">
            <label class="grid h-28 w-28 cursor-pointer place-items-center overflow-hidden rounded-box border-2 border-dashed border-base-300 text-center text-sm text-base-content/50 transition hover:border-primary/50 hover:bg-base-200">
              @if (logoBusy()) { <span class="loading loading-spinner"></span> }
              @else if (v().logoUrl) {
                <img [src]="v().logoUrl" alt="logo" class="size-full object-cover">
              } @else { <span>sube tu<br>logo</span> }
              <input type="file" accept="image/*" class="hidden" (change)="onLogo($event)">
            </label>
            @if (logoError()) { <p class="mt-1 text-xs text-error">{{ logoError() }}</p> }
          </div>

          <div class="flex-1 space-y-4">
            <label class="form-control block">
              <span class="mb-1 block text-xs font-medium uppercase tracking-wider text-base-content/50">Nombre</span>
              <input class="input input-bordered w-full" [ngModel]="v().name" name="name" [maxlength]="limits.name"
                     placeholder="Ej: Spa Aurora" (ngModelChange)="edit({ name: $event })">
              <span class="mt-1 block text-xs text-base-content/50">Hasta {{ limits.name }} caracteres.</span>
            </label>

            <label class="form-control block">
              <span class="mb-1 block text-xs font-medium uppercase tracking-wider text-base-content/50">Descripción corta</span>
              <textarea class="textarea textarea-bordered h-20 w-full" [ngModel]="v().description" name="desc"
                        [maxlength]="limits.description" placeholder="Ej: Masajes, faciales y estética en Sopocachi."
                        (ngModelChange)="edit({ description: $event })"></textarea>
              <span class="mt-1 block text-xs text-base-content/50">Hasta {{ limits.description }} caracteres.</span>
            </label>
          </div>
        </div>

        <app-brand-design [business]="v()" (change)="edit($event)" />
      </section>

      @if (s.can('manageProducts')) {
        <section class="rounded-box border border-base-300 bg-base-100 p-5 sm:p-6">
          <h2 class="text-lg font-medium">Montos sugeridos</h2>
          <p class="mt-1 text-sm text-base-content/55">
            Son los montos que tus clientes pueden comprar en tu página. Sin al menos uno, la
            página no vende. Un monto distinto lo cargas tú desde "Gift cards → Nueva gift card".
          </p>
          <div class="mt-4"><app-amounts-editor [amounts]="v().suggestedAmounts" (change)="edit({ suggestedAmounts: $event })" /></div>
        </section>
      }

      <section class="rounded-box border border-base-300 bg-base-100 p-5 sm:p-6">
        <h2 class="text-lg font-medium">Dónde canjear</h2>
        <p class="mt-1 text-sm text-base-content/55">Se muestra en la gift card de tus clientes, con el mapa y un botón para llegar.</p>
        <div class="mt-4"><app-location-picker [business]="v()" (change)="edit($event)" /></div>
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
  readonly limits = LIMITS;

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

  /** El logo se guarda al subirlo, sin esperar a "Guardar cambios": es lo que uno
   *  espera de una subida, y así un reload no lo pierde. */
  readonly logoBusy = signal(false);
  readonly logoError = signal('');
  async onLogo(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.logoBusy.set(true); this.logoError.set('');
    try {
      await this.s.saveBusiness({ logoUrl: await logoDataUrl(file) });
      this.draft.update(({ logoUrl: _, ...rest }) => rest);
    } catch (err) {
      this.logoError.set(err instanceof Error && !('code' in err) ? err.message : 'No se pudo guardar el logo. Prueba de nuevo.');
    } finally {
      this.logoBusy.set(false);
      input.value = '';  // permite volver a elegir el mismo archivo
    }
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
             [maxlength]="limits.email" placeholder="Ej: correo@empleado.com" (keyup.enter)="add()">
      <button type="button" class="btn btn-primary btn-sm" (click)="add()">+ Agregar</button>
    </div>
    @if (error()) { <p class="mt-2 text-sm text-error">{{ error() }}</p> }
    <p class="mt-2 text-sm text-base-content/55">
      Entra con ese correo (Google) y ve solo los tabs que le habilites. Arranca como cajero.
      Hasta {{ limits.email }} caracteres.
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
  readonly limits = LIMITS;
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

