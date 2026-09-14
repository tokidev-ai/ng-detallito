import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '../data';
import { AuthService } from '../auth';
import { Wordmark } from '../brand';
import { BsPipe } from '../ui';

/** Punto de entrada multitenant: los comercios a los que entra esta persona. */
@Component({
  selector: 'app-tenants',
  imports: [RouterLink, Wordmark, BsPipe],
  template: `
  <div class="min-h-dvh bg-base-200">
    <header class="border-b border-base-300/60">
      <nav class="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <a routerLink="/"><app-wordmark /></a>
        <span class="ms-auto hidden text-sm text-base-content/50 sm:inline">{{ email() }}</span>
        <button type="button" class="btn btn-ghost btn-sm" (click)="auth.signOut()">Salir</button>
      </nav>
    </header>

    <div class="brand-glow">
      <div class="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <p class="text-sm text-base-content/50">Hola, {{ firstName() }}</p>
        <div class="mt-1 flex flex-wrap items-end gap-4">
          <h1 class="flex-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            @if (s.tenants().length) { Tus comercios } @else { Empecemos }
          </h1>
          @if (s.tenants().length) {
            <a class="btn btn-sm border-0 text-white brand-fill" routerLink="/onboarding">+ Crear comercio</a>
          }
        </div>

        @if (s.tenants().length) {
          <ul class="mt-8 grid gap-4 sm:grid-cols-2">
            @for (t of s.tenants(); track t.id) {
              <li class="min-w-0">
                <a [routerLink]="['/app', t.id, 'resumen']"
                   class="group flex h-full flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 transition hover:border-primary/50">
                  <span class="h-1.5 w-full" [style.background-color]="t.business.color"></span>

                  <span class="flex flex-1 flex-col p-5">
                    <span class="flex items-start gap-3">
                      <span class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-base-300 text-[10px] text-base-content/40"
                            [style.background-color]="t.business.color">
                        @if (t.business.logoUrl) { <img [src]="t.business.logoUrl" alt="" class="size-full object-cover"> }
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate font-medium">{{ t.business.name }}</span>
                        <span class="block truncate text-sm text-base-content/50">/{{ t.business.slug }}</span>
                      </span>
                      <span class="badge badge-sm"
                            [class.badge-success]="t.business.published"
                            [class.badge-ghost]="!t.business.published">
                        {{ t.business.published ? 'publicada' : 'borrador' }}
                      </span>
                    </span>

                    <span class="mt-5 flex items-end gap-6 border-t border-base-300 pt-4">
                      <span>
                        <span class="block text-xs uppercase tracking-wider text-base-content/45">Vendido del mes</span>
                        <span class="block text-xl font-semibold tabular-nums">{{ t.soldThisMonth | bs }}</span>
                      </span>
                      <span class="ms-auto text-sm text-base-content/40 transition group-hover:text-primary">Abrir →</span>
                    </span>
                  </span>
                </a>
              </li>
            }
          </ul>
        } @else {
          <!-- primera vez: la pantalla tiene que empujar a crear, no mostrar un vacío -->
          <div class="mt-8 overflow-hidden rounded-box border border-base-300 bg-base-100">
            <div class="grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <h2 class="text-2xl font-semibold tracking-tight">
                  Creá tu primer comercio y <span class="brand-text">empezá a vender hoy</span>
                </h2>
                <p class="mt-4 text-base-content/70">
                  Cinco pasos con vista previa en vivo: tu marca, tus montos, la vigencia,
                  a qué cuenta te depositamos y publicar. Toma unos diez minutos.
                </p>
                <a class="btn mt-7 border-0 text-white brand-fill" routerLink="/onboarding">Crear mi comercio</a>
              </div>

              <ol class="space-y-3">
                @for (s of steps; track s) {
                  <li class="flex items-center gap-3 rounded-field border border-base-300 px-4 py-3">
                    <span class="grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold text-white brand-fill">
                      {{ $index + 1 }}
                    </span>
                    <span class="text-sm">{{ s }}</span>
                  </li>
                }
              </ol>
            </div>
          </div>
        }
      </div>
    </div>
  </div>
  `,
})
export class Tenants {
  readonly s = inject(Store);
  readonly auth = inject(AuthService);

  readonly steps = ['Marca', 'Productos', 'Vigencia y términos', 'Datos bancarios', 'Publicar'];
  readonly email = computed(() => this.auth.user()?.email ?? '');
  readonly firstName = computed(() =>
    this.auth.user()?.displayName?.split(' ')[0] ?? this.email().split('@')[0] ?? '');
}
