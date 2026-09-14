import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '../data';
import { BsPipe } from '../ui';

/** Punto de entrada multitenant: los comercios a los que entra esta persona. */
@Component({
  selector: 'app-tenants',
  imports: [RouterLink, BsPipe],
  template: `
  <div class="min-h-dvh bg-base-200 p-4 sm:p-6">
    <div class="mx-auto max-w-3xl">
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="flex-1 text-2xl font-semibold">Tus comercios</h1>
        <a class="btn btn-primary btn-sm" routerLink="/onboarding">+ Crear comercio</a>
      </div>

      <ul class="mt-5 space-y-3">
        @for (t of s.tenants(); track t.id) {
          <li>
            <a [routerLink]="['/app', t.id, 'resumen']"
               class="flex items-center gap-4 rounded-box border border-base-300 bg-base-100 p-4 transition hover:border-primary/40">
              <span class="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border border-base-300 text-[10px] text-base-content/40"
                    [style.background-color]="t.business.color">
                @if (t.business.logoUrl) { <img [src]="t.business.logoUrl" alt="" class="size-full object-cover"> }
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate font-medium">{{ t.business.name }}</span>
                <span class="block truncate text-sm text-base-content/50">
                  /{{ t.business.slug }} · {{ t.business.published ? 'publicada' : 'borrador' }}
                </span>
              </span>
              <span class="hidden text-right sm:block">
                <span class="block text-xs uppercase tracking-wider text-base-content/50">Vendido del mes</span>
                <span class="block tabular-nums font-semibold">{{ t.soldThisMonth | bs }}</span>
              </span>
            </a>
          </li>
        } @empty {
          <li class="rounded-box border border-dashed border-base-300 p-10 text-center">
            <p class="text-base-content/60">Todavía no creaste ninguno.</p>
            <a class="btn btn-primary btn-sm mt-4" routerLink="/onboarding">Crear el primero</a>
          </li>
        }
      </ul>
    </div>
  </div>
  `,
})
export class Tenants {
  readonly s = inject(Store);
}
