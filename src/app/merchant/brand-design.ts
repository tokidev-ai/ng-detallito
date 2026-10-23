import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Business, GiftCard } from '../data';
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
        <button type="button" (click)="change.emit({ color: c })" [style.background-color]="c"
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
                (ngModelChange)="change.emit({ color: $event })">
      </label>
    </div>
  </fieldset>

  <fieldset class="mt-6">
    <legend class="mb-2 text-xs font-medium uppercase tracking-wider text-base-content/50">Diseño de la gift card</legend>
    <div class="storefront grid grid-cols-2 gap-2 sm:grid-cols-5" [style.--c1]="b().color">
      @for (st of cardStyles; track st.id) {
        <button type="button" (click)="change.emit({ cardStyle: st.id })" [attr.aria-pressed]="style() === st.id"
                class="rounded-box p-1 text-left ring-offset-2 transition hover:scale-[1.02]"
                [class.ring-2]="style() === st.id" [class.ring-base-content]="style() === st.id">
          <span class="relative flex h-16 items-end overflow-hidden rounded-lg p-2 text-xs font-bold shadow"
                [style.background]="surfaceOf(st.id).bg" [style.color]="surfaceOf(st.id).ink">
            @if (st.id === 'logo') {
              <span class="absolute -right-2 -top-2 grid size-14 rotate-[-12deg] place-items-center overflow-hidden rounded-xl opacity-25">
                @if (b().logoUrl) { <img [src]="b().logoUrl" alt="" class="size-full object-cover"> }
                @else { <span class="text-3xl">{{ (b().name || '?')[0] }}</span> }
              </span>
            }
            Bs 100
          </span>
          <span class="mt-1 block px-1 text-sm">{{ st.label }}</span>
        </button>
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
  readonly change = output<Partial<Business>>();

  readonly swatches = ['#18181b', '#0f766e', '#b91c1c', '#1d4ed8', '#a16207', '#7e22ce'];
  readonly cardStyles = CARD_STYLES;
  style() { return this.b().cardStyle ?? 'degradado'; }
  surfaceOf(id: Business['cardStyle']) { return cardSurface(id, this.b().color, this.b().logoUrl); }
  /** Una carta de ejemplo para la vista previa del diseño. */
  readonly sampleCard: GiftCard = { code: 'K7QM-3XPA', to: 'Lucía', from: 'Diego', value: 100, balance: 100, expires: '2027-12-31' };
}
