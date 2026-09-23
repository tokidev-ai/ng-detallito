import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '../data';
import { AuthService } from '../auth';

interface Tab { path: string; label: string; short: string; icon: string }

/** Los 4 primeros van a la barra inferior en móvil; el resto cae en "Más". */
const TABS: Tab[] = [
  { path: 'resumen',    label: 'Resumen',    short: 'Resumen',  icon: 'M3 12h4l3 8 4-16 3 8h4' },
  { path: 'gift-cards', label: 'Gift cards', short: 'Cards',    icon: 'M3 7h18v10H3zM3 11h18' },
  { path: 'canjes',     label: 'Canjes',     short: 'Canjes',   icon: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4' },
  { path: 'marca',      label: 'Marca',      short: 'Marca',    icon: 'M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.9-5.3-2.8-5.3 2.8 1-5.9L3.5 9.2l5.9-.9z' },
  { path: 'equipo',     label: 'Equipo',     short: 'Equipo',   icon: 'M16 20v-2a4 4 0 0 0-8 0v2M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6' },
  { path: 'cobros',     label: 'Cobros',     short: 'Cobros',   icon: 'M3 6h18v12H3zM3 10h18' },
];

@Component({
  selector: 'app-merchant-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <div class="min-h-dvh bg-base-200">
    <div class="mx-auto max-w-7xl p-3 sm:p-6">
      <div class="overflow-hidden rounded-box border border-base-300 bg-base-100">

        <header class="flex flex-wrap items-center gap-3 p-4 sm:p-6">
          <div class="dropdown">
            <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-square" aria-label="Cambiar de comercio">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5">
                <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round"/>
              </svg>
            </div>
            <ul tabindex="0" class="menu dropdown-content z-50 mt-2 w-64 rounded-box border border-base-300 bg-base-100 p-2 shadow-xl">
              <li class="menu-title">Tus comercios</li>
              @for (t of store.tenants(); track t.id) {
                <li>
                  <a [routerLink]="['/app', t.id, 'resumen']" [class.menu-active]="t.id === tenant()">
                    <span class="size-3 rounded-full" [style.background-color]="t.business.color"></span>
                    <span class="truncate">{{ t.business.name }}</span>
                  </a>
                </li>
              }
              <li class="mt-1 border-t border-base-300 pt-1">
                <a routerLink="/onboarding">+ Crear otro comercio</a>
              </li>
              <li><button type="button" (click)="salir()">Salir</button></li>
            </ul>
          </div>
          <div class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-base-300 bg-base-200 text-[10px] text-base-content/40">
            @if (b().logoUrl) { <img [src]="b().logoUrl" alt="" class="size-full object-cover"> } @else { logo }
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-lg font-semibold">{{ b().name }}</p>
            <p class="truncate text-xs text-base-content/50">
              /{{ b().slug }} · {{ b().published ? 'publicada' : 'borrador' }}
            </p>
          </div>
          <a class="btn btn-outline btn-sm" [routerLink]="['/', b().slug]">
            <span class="hidden sm:inline">Compartir link</span><span class="sm:hidden">Link</span>
          </a>
          <button type="button" class="btn btn-outline btn-sm">
            {{ ownerName() }} <span class="hidden sm:inline">(owner)</span>
          </button>
        </header>

        <!-- tabs: escritorio -->
        <nav class="hidden border-b border-base-300 px-4 sm:px-6 md:block">
          <div role="tablist" class="tabs tabs-lift -mb-px">
            @for (t of tabs; track t.path) {
              <a role="tab" class="tab" [routerLink]="t.path" routerLinkActive="tab-active">{{ t.label }}</a>
            }
          </div>
        </nav>

        <main class="p-4 pb-safe sm:p-6 md:pb-6">
          <router-outlet />
        </main>
      </div>
    </div>

    <!-- bottom nav: móvil -->
    <nav class="btm-nav fixed inset-x-0 bottom-0 z-40 flex h-[4.5rem] items-stretch border-t border-base-300 bg-base-100 pb-[env(safe-area-inset-bottom)] md:hidden">
      @for (t of tabs.slice(0, 3); track t.path) {
        <a class="flex flex-1 flex-col items-center justify-center gap-1 text-xs text-base-content/60"
           [routerLink]="t.path" routerLinkActive="!text-primary font-medium">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="size-6">
            <path [attr.d]="t.icon" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ t.short }}
        </a>
      }
      <button type="button" (click)="moreOpen.set(true)"
              class="flex flex-1 flex-col items-center justify-center gap-1 text-xs text-base-content/60">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6">
          <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
        </svg>
        Más
      </button>
    </nav>

    @if (moreOpen()) {
      <div class="fixed inset-0 z-50 md:hidden">
        <button type="button" aria-label="Cerrar" class="absolute inset-0 bg-black/40" (click)="moreOpen.set(false)"></button>
        <div class="absolute inset-x-0 bottom-0 rounded-t-box bg-base-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div class="mx-auto mb-3 h-1 w-10 rounded-full bg-base-300"></div>
          <ul class="menu w-full">
            @for (t of tabs.slice(3); track t.path) {
              <li><a [routerLink]="t.path" routerLinkActive="active" (click)="moreOpen.set(false)">{{ t.label }}</a></li>
            }
          </ul>
        </div>
      </div>
    }
  </div>
  `,
})
export class MerchantShell {
  readonly store = inject(Store);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** withComponentInputBinding() ata el :tenant de la ruta a este input. */
  readonly tenant = input<string>();

  readonly tabs = TABS;
  readonly moreOpen = signal(false);
  readonly b = this.store.business;
  readonly ownerName = computed(() =>
    (this.store.staff().find(m => m.role === 'owner')?.email ?? '').split('@')[0] || '—');

  async salir() {
    await this.auth.signOut();
    this.router.navigateByUrl('/');
  }

  constructor() {
    effect(() => this.store.setCurrent(this.tenant() ?? null));
  }
}
