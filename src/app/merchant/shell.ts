import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Perm, Store } from '../data';
import { AuthService } from '../auth';
import { Wordmark } from '../brand';
import { onBrand } from '../ui';

interface Tab { path: string; label: string; short: string; icon: string; perm: Perm }

/** Cada tab necesita un permiso; el owner los tiene todos. Los 3 primeros
 *  visibles van a la barra inferior en móvil; el resto cae en "Más". */
const TABS: Tab[] = [
  { path: 'resumen',    label: 'Dashboard',      short: 'Dashboard', perm: 'viewSales',      icon: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 4v4h6V4z' },
  { path: 'gift-cards', label: 'Gift cards',     short: 'Cards',     perm: 'viewCards',      icon: 'M3 7h18v10H3zM3 11h18M8 15h3' },
  { path: 'marca',      label: 'Editar página',  short: 'Página',    perm: 'manageBranding', icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z' },
  { path: 'equipo',     label: 'Equipo',         short: 'Equipo',    perm: 'manageStaff',    icon: 'M16 20v-2a4 4 0 0 0-8 0v2M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.3M4 20v-1.5a3.5 3.5 0 0 1 2.5-3.3' },
];

@Component({
  selector: 'app-merchant-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgTemplateOutlet, Wordmark],
  template: `
  <!-- avatar del comercio: su logo o su inicial sobre su color -->
  <ng-template #avatar let-size="size">
    <span class="grid shrink-0 place-items-center overflow-hidden rounded-xl text-sm font-bold"
          [class]="size" [style.background-color]="b().color" [style.color]="ink()">
      @if (b().logoUrl) { <img [src]="b().logoUrl" alt="" class="size-full object-cover"> } @else { {{ (b().name || '?')[0] }} }
    </span>
  </ng-template>

  <!-- selector de comercio (sidebar y barra móvil) -->
  <ng-template #switcher>
    <div class="dropdown w-full">
      <div tabindex="0" role="button" aria-label="Cambiar de comercio"
           class="flex w-full items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-2 pr-3 transition hover:border-base-content/20 hover:shadow-sm">
        <ng-container *ngTemplateOutlet="avatar; context: { size: 'size-9' }" />
        <div class="min-w-0 flex-1 text-left">
          <p class="truncate text-sm font-semibold leading-tight">{{ b().name }}</p>
          <p class="flex items-center gap-1.5 text-xs text-base-content/50">
            <span class="size-1.5 rounded-full" [class.bg-success]="b().published" [class.bg-warning]="!b().published"></span>
            {{ b().published ? 'publicada' : 'borrador' }}
          </p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4 text-base-content/40"><path d="M8 9l4-4 4 4M8 15l4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <ul tabindex="0" class="menu dropdown-content z-50 mt-2 w-64 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl">
        <li class="menu-title">Tus comercios</li>
        @for (t of store.tenants(); track t.id) {
          <li>
            <a [routerLink]="['/app', t.id, 'resumen']" [class.menu-active]="t.id === tenant()">
              <span class="size-3 rounded-full" [style.background-color]="t.business.color"></span>
              <span class="truncate">{{ t.business.name }}</span>
            </a>
          </li>
        }
        <li class="mt-1 border-t border-base-300 pt-1"><a routerLink="/onboarding">+ Crear otro comercio</a></li>
      </ul>
    </div>
  </ng-template>

  <div class="min-h-dvh bg-base-200 md:flex">

    <!-- ── sidebar (escritorio) ── -->
    <aside class="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-base-300 bg-base-100 md:flex">
      <a routerLink="/" class="px-6 pb-4 pt-6"><app-wordmark /></a>
      <div class="px-4"><ng-container *ngTemplateOutlet="switcher" /></div>

      <nav class="mt-6 flex-1 space-y-1 px-4">
        <p class="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-base-content/40">Menú</p>
        @for (t of tabs(); track t.path) {
          <a [routerLink]="t.path" routerLinkActive="nav-active" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5"><path [attr.d]="t.icon" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ t.label }}
          </a>
        }
        <a [href]="'/' + b().slug" target="_blank" rel="noopener" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Ver mi página
        </a>
      </nav>

      <div class="m-4 flex items-center gap-3 rounded-2xl bg-base-200 p-3">
        <span class="grid size-9 shrink-0 place-items-center rounded-full bg-neutral text-sm font-bold uppercase text-neutral-content">{{ me()[0] }}</span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold">{{ me() }}</p>
          <p class="text-xs text-base-content/50">{{ store.isOwner() ? 'Dueño' : 'Equipo' }}</p>
        </div>
        <button type="button" class="btn btn-ghost btn-sm btn-square" aria-label="Salir" title="Salir" (click)="salir()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5"><path d="M15 12H4M8 8l-4 4 4 4M13 4h6a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </aside>

    <!-- ── contenido ── -->
    <div class="min-w-0 flex-1">
      <header class="sticky top-0 z-30 border-b border-base-300 bg-base-100/80 backdrop-blur-xl">
        <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-8 md:py-4">
          <!-- móvil: el selector va arriba; escritorio: el título de la sección -->
          <div class="min-w-0 flex-1 md:hidden"><ng-container *ngTemplateOutlet="switcher" /></div>
          <h1 class="hidden flex-1 text-xl font-bold tracking-tight md:block">{{ current()?.label }}</h1>
          <button type="button" class="btn btn-sm rounded-full border-base-300 bg-base-100" (click)="shareOpen.set(true)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4M21 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/></svg>
            <span class="hidden sm:inline">Compartir link</span>
          </button>
        </div>
      </header>

      <!-- El router-outlet vive SIEMPRE en el DOM: si lo escondiéramos tras un @if,
           la ruta hija podría activarse sin outlet montado y quedar sin renderizar. -->
      <main class="mx-auto max-w-6xl p-4 pb-safe md:p-8">
        <router-outlet />
      </main>
    </div>
  </div>

  @if (!store.current()) {
    <!-- entrando al negocio: tapa todo mientras Firestore trae el comercio -->
    <div class="fixed inset-0 z-[60] grid place-items-center bg-base-200">
      <div class="flex flex-col items-center gap-3 text-base-content/50">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-sm">Entrando a tu negocio…</p>
      </div>
    </div>
  }

  <!-- bottom nav: móvil -->
  @if (store.current()) {
    <nav class="fixed inset-x-0 bottom-0 z-40 flex h-[4.5rem] items-stretch border-t border-base-300 bg-base-100/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      @for (t of tabs().slice(0, 3); track t.path) {
        <a class="flex flex-1 flex-col items-center justify-center gap-1 text-xs text-base-content/55"
           [routerLink]="t.path" routerLinkActive="!text-[#c2410c] font-semibold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-6">
            <path [attr.d]="t.icon" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ t.short }}
        </a>
      }
      <button type="button" (click)="moreOpen.set(true)"
              class="flex flex-1 flex-col items-center justify-center gap-1 text-xs text-base-content/55">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6">
          <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
        </svg>
        Más
      </button>
    </nav>
  }

  <!-- compartir la página pública: copiar el link o abrirla en otra pestaña -->
  @if (shareOpen()) {
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" (click)="shareOpen.set(false)">
      <div class="pop w-full max-w-sm rounded-2xl bg-base-100 p-5 shadow-xl" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Compartir tu página</h3>
          <button type="button" class="btn btn-ghost btn-sm btn-square" (click)="shareOpen.set(false)">✕</button>
        </div>
        <p class="mt-3 break-all rounded-xl border border-base-300 bg-base-200 px-3 py-2 text-sm text-base-content/70">{{ shareUrl() }}</p>
        <div class="mt-4 grid grid-cols-2 gap-2">
          <button type="button" class="btn btn-primary" (click)="copyShare()">
            {{ copied() ? '¡Copiado!' : 'Copiar' }}
          </button>
          <a class="btn btn-outline" [href]="shareUrl()" target="_blank" rel="noopener" (click)="shareOpen.set(false)">Ir</a>
        </div>
      </div>
    </div>
  }

  @if (moreOpen()) {
    <div class="fixed inset-0 z-50 md:hidden">
      <button type="button" aria-label="Cerrar" class="absolute inset-0 bg-black/40" (click)="moreOpen.set(false)"></button>
      <div class="sheet-up absolute inset-x-0 bottom-0 rounded-t-3xl bg-base-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div class="mx-auto mb-3 h-1 w-10 rounded-full bg-base-300"></div>
        <ul class="menu w-full">
          @for (t of tabs().slice(3); track t.path) {
            <li><a [routerLink]="t.path" routerLinkActive="menu-active" (click)="moreOpen.set(false)">{{ t.label }}</a></li>
          }
          <li><a [href]="'/' + b().slug" target="_blank" rel="noopener">Ver mi página</a></li>
          <li><button type="button" (click)="salir()">Salir</button></li>
        </ul>
      </div>
    </div>
  }
  `,
})
export class MerchantShell {
  readonly store = inject(Store);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** withComponentInputBinding() ata el :tenant de la ruta a este input. */
  readonly tenant = input<string>();

  /** Solo los tabs que el usuario puede ver, según su rol/permisos. */
  readonly tabs = computed(() => TABS.filter(t => this.store.can(t.perm)));
  readonly moreOpen = signal(false);
  readonly b = this.store.business;
  readonly ink = computed(() => onBrand(this.b().color));
  /** Quién está usando el panel, por la parte local del correo. */
  readonly me = computed(() => (this.auth.user()?.email ?? '').split('@')[0] || '—');

  /** La sección actual, para el título de la barra superior. */
  private readonly url = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(() => this.router.url)),
    { initialValue: this.router.url });
  readonly current = computed(() => TABS.find(t => t.path === this.url().split('?')[0].split('/').pop()));

  // compartir link de la página pública
  readonly shareOpen = signal(false);
  readonly copied = signal(false);
  shareUrl() { return `${location.origin}/${this.b().slug}`; }
  async copyShare() {
    try {
      await navigator.clipboard.writeText(this.shareUrl());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch { /* sin clipboard: queda el link a la vista para copiar a mano */ }
  }

  async salir() {
    await this.auth.signOut();
    this.router.navigateByUrl('/');
  }

  constructor() {
    effect(() => this.store.setCurrent(this.tenant() ?? null));

    // si el usuario cae en un tab que no puede ver (link directo, permiso
    // recién cargado), lo mandamos al primero permitido.
    effect(() => {
      const allowed = this.tabs();
      if (!allowed.length) return;
      const seg = this.url().split('?')[0].split('/').pop();
      const known = TABS.some(t => t.path === seg);
      if (seg && known && !allowed.some(t => t.path === seg)) {
        this.router.navigate(['/app', this.tenant(), allowed[0].path], { replaceUrl: true });
      }
    });
  }
}
