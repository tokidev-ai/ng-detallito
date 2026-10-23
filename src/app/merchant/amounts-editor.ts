import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LIMITS } from '../data';
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
                (click)="change.emit(without(a))">✕</button>
      </span>
    } @empty {
      <span class="text-sm text-base-content/45">Sin montos todavía.</span>
    }
  </div>
  <div class="mt-3 flex gap-2">
    <input type="number" min="1" [max]="limits.amountMax" class="input input-bordered input-sm w-40" [(ngModel)]="newAmount"
           name="newAmount" placeholder="Ej: 150" (keyup.enter)="add()">
    <button type="button" class="btn btn-outline btn-sm" (click)="add()">+ Agregar</button>
  </div>
  <p class="mt-1 text-xs text-base-content/50">Entre Bs 1 y Bs {{ limits.amountMax.toLocaleString('es-BO') }}.</p>
  `,
})
export class AmountsEditor {
  readonly amounts = input.required<number[]>();
  readonly change = output<number[]>();
  readonly limits = LIMITS;
  newAmount: number | null = null;

  add() {
    const a = this.newAmount;
    if (!a || a <= 0 || a > LIMITS.amountMax) return;
    if (!this.amounts().includes(a)) this.change.emit([...this.amounts(), a].sort((x, y) => x - y));
    this.newAmount = null;
  }
  without(a: number) { return this.amounts().filter(x => x !== a); }
}
