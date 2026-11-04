import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Branch, Business, LIMITS, MAX_BRANCHES, branchesOf } from '../data';
import { LocationPicker } from './location-picker';

const EMPTY: Branch = { name: '', address: '', location: null };

/** Las sucursales del comercio: lista con agregar, editar y quitar. Se edita una a
 *  la vez (un solo mapa abierto). Sin ninguna, muestra directo el formulario de la
 *  primera. Lo usan el alta y "Editar página". */
@Component({
  selector: 'app-branches-editor',
  imports: [FormsModule, LocationPicker],
  template: `
  <ul class="space-y-2">
    @for (x of list(); track $index; let i = $index) {
      <li class="rounded-box border border-base-300 bg-base-100">
        @if (editing() === i) {
          <div class="p-4">
            <div class="mb-3 flex items-center gap-2">
              <span class="text-sm font-medium">{{ list().length > 1 ? 'Sucursal ' + (i + 1) : 'Tu local' }}</span>
              @if (saved().length > 1 || x.address || x.location) {
                <button type="button" class="btn btn-ghost btn-xs ms-auto text-error" (click)="remove(i)">Eliminar</button>
              }
            </div>
            <label class="form-control mb-3 block">
              <span class="mb-1 block text-xs font-medium uppercase tracking-wider text-base-content/50">Nombre (opcional)</span>
              <input class="input input-bordered w-full" [ngModel]="x.name" [name]="'branch-name-' + i" [maxlength]="limits.branchName"
                     placeholder="Ej: Sucursal Centro" (ngModelChange)="update(i, { name: $event })">
            </label>
            <app-location-picker [branch]="x" (change)="update(i, $event)" />
            @if (list().length > 1) {
              <button type="button" class="btn btn-sm mt-3 rounded-full" (click)="editing.set(-1)">Listo</button>
            }
          </div>
        } @else {
          <div class="flex items-center gap-3 p-3">
            <span class="grid size-9 shrink-0 place-items-center rounded-full bg-base-200" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4.5"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.5"/></svg>
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ x.name || 'Sucursal ' + (i + 1) }}</p>
              <p class="truncate text-xs text-base-content/55">
                {{ x.address || 'Sin dirección' }}{{ x.location ? '' : ' · sin punto en el mapa' }}
              </p>
            </div>
            <button type="button" class="btn btn-ghost btn-sm rounded-full" (click)="editing.set(i)">Editar</button>
            <button type="button" class="btn btn-ghost btn-sm rounded-full text-error" (click)="remove(i)"
                    [attr.aria-label]="'Eliminar ' + (x.name || 'sucursal ' + (i + 1))">Eliminar</button>
          </div>
        }
      </li>
    }
  </ul>
  @if (list().length < max) {
    <button type="button" class="btn btn-outline btn-sm mt-3 rounded-full" (click)="add()">+ Agregar sucursal</button>
  } @else {
    <p class="mt-3 text-xs text-base-content/50">Hasta {{ max }} sucursales.</p>
  }
  `,
})
export class BranchesEditor {
  readonly b = input.required<Business>({ alias: 'business' });
  readonly change = output<Partial<Business>>();
  readonly limits = LIMITS;
  readonly max = MAX_BRANCHES;

  readonly saved = computed(() => branchesOf(this.b()));
  /** Sin sucursales se muestra una vacía para llenar; se guarda recién al escribir. */
  readonly list = computed(() => this.saved().length ? this.saved() : [EMPTY]);
  readonly editing = signal(0);

  update(i: number, patch: Partial<Branch>) {
    const l = [...this.list()];
    l[i] = { ...l[i], ...patch };
    this.emit(l);
  }
  // el input recién se actualiza en el próximo ciclo: los índices salen de antes de emitir
  add() {
    const l = this.saved();
    this.emit([...l, { ...EMPTY }]);
    this.editing.set(l.length);
  }
  remove(i: number) {
    const l = this.saved().filter((_, j) => j !== i);
    this.emit(l);
    this.editing.set(l.length <= 1 ? 0 : -1);
  }
  // `address`/`location` viejos se quitan al pasar a sucursales: una sola fuente
  private emit(branches: Branch[]) { this.change.emit({ branches, address: '', location: null }); }
}
