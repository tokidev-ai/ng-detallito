import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LIMITS, MAX_AMOUNTS } from '../data';
import { BsPipe } from '../ui';

/** Los montos que el cliente puede comprar en la página. Lo usan el alta y
 *  "Editar página"; quien lo usa decide cuándo se guarda. */
@Component({
  selector: 'app-amounts-editor',
  imports: [FormsModule, BsPipe],
  template: `
  <div class="flex flex-wrap gap-2">
    @for (a of amounts(); track a) {
      <span class="badge badge-lg gap-2 py-3">
        {{ a | bs }}
        <button type="button" class="text-base-content/50 hover:text-error" aria-label="Quitar"
                (click)="edited.emit(without(a))">✕</button>
      </span>
    } @empty {
      <span class="text-sm text-base-content/45">Sin montos todavía.</span>
    }
  </div>
  @if (amounts().length < max) {
    <div class="mt-3 flex gap-2">
      <input type="number" min="1" step="1" inputmode="numeric" [max]="limits.amountMax" class="input input-bordered input-sm w-40"
             [class.input-error]="error()" [(ngModel)]="newAmount" (ngModelChange)="error.set('')"
             name="newAmount" placeholder="Ej: 150" (keyup.enter)="add()" [attr.aria-invalid]="!!error()">
      <button type="button" class="btn btn-outline btn-sm" (click)="add()">+ Agregar</button>
    </div>
    <!-- antes rechazaba en silencio (repetido, fuera de rango, "1.000"): parecía que el botón no andaba -->
    @if (error()) {
      <p class="mt-1 text-xs text-error" role="alert">{{ error() }}</p>
    } @else {
      <p class="mt-1 text-xs text-base-content/50">Entre Bs 1 y Bs {{ limits.amountMax.toLocaleString('es-BO') }}, sin decimales. Hasta {{ max }} montos.</p>
    }
  } @else {
    <p class="mt-3 text-xs text-base-content/50">Llegaste al máximo de {{ max }} montos. Quita uno para agregar otro.</p>
  }
  `,
})
export class AmountsEditor {
  readonly amounts = input.required<number[]>();
  readonly edited = output<number[]>();
  readonly limits = LIMITS;
  readonly max = MAX_AMOUNTS;
  newAmount: number | null = null;
  readonly error = signal('');

  add() {
    const a = this.newAmount;
    const err =
      a == null ? 'Escribe el monto solo con números, sin puntos ni comas (ej: 1500).'
      : !Number.isInteger(a) ? 'Usa un monto entero, sin decimales.'
      : a < 1 ? 'El monto mínimo es Bs 1.'
      : a > LIMITS.amountMax ? `El máximo es Bs ${LIMITS.amountMax.toLocaleString('es-BO')}.`
      : this.amounts().includes(a) ? `Bs ${a} ya está en la lista.`
      : this.amounts().length >= this.max ? `Puedes tener hasta ${this.max} montos. Quita uno para agregar otro.`
      : '';
    this.error.set(err);
    if (err) return;
    this.edited.emit([...this.amounts(), a!].sort((x, y) => x - y));
    this.newAmount = null;
  }
  without(a: number) { return this.amounts().filter(x => x !== a); }
}
