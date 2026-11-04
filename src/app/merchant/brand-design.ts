import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Business, GiftCard, cardPhotoDataUrl } from '../data';
import { CARD_STYLES, GiftcardArt, cardSurface } from '../giftcard';

/** Color de marca + diseño de la gift card. Lo usan el alta y "Editar página",
 *  así el comercio ve las mismas opciones al crear que al editar. */
@Component({
  selector: 'app-brand-design',
  imports: [FormsModule, GiftcardArt],
  template: `
  <fieldset class="mt-5">
    <legend class="mb-2 text-xs font-medium uppercase tracking-wider text-base-content/50">Color de marca</legend>
    <div class="flex flex-wrap items-center gap-2">
      @for (c of swatches; track c) {
        <button type="button" (click)="edited.emit({ color: c })" [style.background-color]="c"
                [attr.aria-label]="'Color ' + c" [attr.aria-pressed]="b().color === c"
                class="grid size-10 place-items-center rounded-xl text-white ring-offset-2 transition hover:scale-105"
                [class.ring-2]="b().color === c" [class.ring-base-content]="b().color === c">
          @if (b().color === c) {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="size-4"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          }
        </button>
      }
      <label class="grid size-10 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-base-300 text-lg leading-none transition hover:border-base-content/30"
             title="Otro color">
        +<input type="color" class="sr-only" [ngModel]="b().color" name="color"
                (ngModelChange)="edited.emit({ color: $event })">
      </label>
    </div>
  </fieldset>

  <fieldset class="mt-6">
    <legend class="mb-2 text-xs font-medium uppercase tracking-wider text-base-content/50">Diseño de la gift card</legend>
    <!-- por grupos en una grilla de 3 (también en móvil): cada grupo ocupa una columna por
         opción, así "Degradado" y "Claro u oscuro" comparten fila y no queda hueco -->
    <div class="storefront grid grid-cols-3 gap-x-2 gap-y-4 sm:gap-x-3" [style.--c1]="b().color">
      @for (g of cardStyles; track g.label) {
        <div class="min-w-0" [style.grid-column]="'span ' + g.styles.length">
          <p class="mb-1.5 truncate text-sm font-medium text-base-content/70">{{ g.label }}</p>
          <div class="grid gap-2 sm:gap-3" [style.grid-template-columns]="'repeat(' + g.styles.length + ', minmax(0, 1fr))'">
            @for (st of g.styles; track st.id) {
              <button type="button" (click)="edited.emit({ cardStyle: st.id })" [attr.aria-pressed]="style() === st.id"
                      class="min-w-0 rounded-box p-1 text-left ring-offset-2 transition hover:scale-[1.02]"
                      [class.ring-2]="style() === st.id" [class.ring-base-content]="style() === st.id">
                <span class="relative flex aspect-[8/5] items-end overflow-hidden rounded-lg p-2 text-xs font-bold shadow sm:p-3 sm:text-sm"
                      [style.background]="surfaceOf(st.id).bg" [style.color]="surfaceOf(st.id).ink">
                  @if (st.id === 'foto' && !b().cardPhoto) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute right-2 top-2 size-5 opacity-60 sm:size-6" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.5"/></svg>
                  }
                  @if (st.id === 'logo') {
                    <span class="absolute -right-2 -top-2 grid size-14 rotate-[-12deg] place-items-center overflow-hidden rounded-xl opacity-25">
                      @if (b().logoUrl) { <img [src]="b().logoUrl" alt="" class="size-full object-cover"> }
                      @else { <span class="text-3xl">{{ (b().name || '?')[0] }}</span> }
                    </span>
                  }
                  Bs 100
                </span>
                <span class="mt-1 block truncate px-1 text-xs sm:text-sm">{{ st.label }}</span>
              </button>
            }
          </div>
          @if (g.styles[0].id === 'foto' && style() === 'foto') {
            <div class="mt-3 flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4 sm:flex-row sm:items-center">
              <div class="min-w-0 flex-1 text-sm">
                <p class="font-medium">Foto de fondo de la tarjeta</p>
                <p class="mt-1 text-base-content/60">
                  Horizontal, de <b>1600 × 1000 px</b> (mínimo 800 × 500), proporción 8:5. JPG, PNG o WebP.
                  Se recorta al centro: deja lo importante en el medio y evita textos en los bordes.
                </p>
                @if (photoError()) { <p class="mt-1 text-error" role="alert">{{ photoError() }}</p> }
              </div>
              <div class="flex shrink-0 gap-2">
                <label class="btn btn-sm rounded-full" [class.btn-disabled]="photoBusy()">
                  @if (photoBusy()) { <span class="loading loading-spinner loading-xs"></span> }
                  {{ b().cardPhoto ? 'Cambiar foto' : 'Subir foto' }}
                  <input type="file" accept="image/*" class="sr-only" (change)="onPhoto($event)">
                </label>
                @if (b().cardPhoto) {
                  <button type="button" class="btn btn-ghost btn-sm rounded-full" (click)="edited.emit({ cardPhoto: null })">Quitar</button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
    <div class="mx-auto mt-4 max-w-sm">
      <app-giftcard-art [card]="sampleCard" [business]="b()" />
    </div>
  </fieldset>
  `,
})
export class BrandDesign {
  readonly b = input.required<Business>({ alias: 'business' });
  readonly edited = output<Partial<Business>>();

  readonly swatches = ['#18181b', '#0f766e', '#b91c1c', '#1d4ed8', '#a16207', '#7e22ce'];
  readonly cardStyles = CARD_STYLES;
  style() { return this.b().cardStyle ?? 'degradado'; }
  surfaceOf(id: Business['cardStyle']) { return cardSurface(id, this.b().color, this.b().logoUrl, this.b().cardPhoto); }

  readonly photoBusy = signal(false);
  readonly photoError = signal('');
  async onPhoto(e: Event) {
    const el = e.target as HTMLInputElement, file = el.files?.[0];
    el.value = '';  // que elegir la misma foto otra vez vuelva a disparar
    if (!file) return;
    this.photoBusy.set(true); this.photoError.set('');
    try { this.edited.emit({ cardPhoto: await cardPhotoDataUrl(file), cardStyle: 'foto' }); }
    catch (err) { this.photoError.set((err as Error).message); }
    finally { this.photoBusy.set(false); }
  }
  /** Una carta de ejemplo para la vista previa del diseño. */
  readonly sampleCard: GiftCard = { code: 'K7QM-3XPA', to: 'Lucía', from: 'Diego', value: 100, balance: 100, expires: '2027-12-31' };
}
