import { Component, computed, inject, resource } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Firestore, collection, getDocs, query } from '@angular/fire/firestore';
import { Tenant } from '../data';
import { AuthService } from '../auth';
import { Wordmark } from '../brand';
import { BsPipe } from '../ui';

/** Panel de la startup. Distinto del panel del comercio: aquí vemos TODOS los
 *  comercios y el dinero que pasa por nuestra cuenta. */
@Component({
  selector: 'app-admin-panel',
  imports: [RouterLink, Wordmark, BsPipe],
  template: `
  <div class="min-h-dvh bg-base-200">
    <header class="border-b border-base-300/60">
      <nav class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <a routerLink="/" class="flex items-center gap-2">
          <app-wordmark />
        </a>
        <span class="badge badge-sm badge-primary">interno</span>
        <a routerLink="/app" class="btn btn-ghost btn-sm ms-auto">Mi panel de comercio</a>
        <button type="button" class="btn btn-ghost btn-sm" (click)="salir()">Salir</button>
      </nav>
    </header>

    <div class="bg-base-200">
      <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Panel de la startup</h1>
        <p class="mt-2 text-base-content/60">Todos los comercios y el dinero que pasa por nuestra cuenta.</p>

        <div class="mt-8 grid gap-4 sm:grid-cols-3">
          <div class="rounded-box border border-base-300 bg-base-100 p-5">
            <p class="text-xs uppercase tracking-wider text-base-content/50">Comercios</p>
            <p class="mt-1 text-3xl font-semibold tabular-nums">{{ shops().length }}</p>
            <p class="mt-1 text-sm text-base-content/50">{{ publicados() }} publicados</p>
          </div>
          <div class="rounded-box border border-base-300 bg-base-100 p-5">
            <p class="text-xs uppercase tracking-wider text-base-content/50">Vendido del mes</p>
            <p class="mt-1 text-3xl font-semibold tabular-nums">{{ bruto() | bs }}</p>
            <p class="mt-1 text-sm text-base-content/50">bruto, todos los comercios</p>
          </div>
          <div class="rounded-box border border-base-300 bg-base-100 p-5">
            <p class="text-xs uppercase tracking-wider text-base-content/50">Nuestra comisión (5%)</p>
            <p class="mt-1 text-3xl font-semibold tabular-nums">{{ comision() | bs }}</p>
            <p class="mt-1 text-sm text-base-content/50">a deducir del corte</p>
          </div>
        </div>

        <section class="mt-8 overflow-hidden rounded-box border border-base-300 bg-base-100">
          <h2 class="border-b border-base-300 px-5 py-4 text-sm uppercase tracking-wider text-base-content/50">
            Comercios
          </h2>

          @if (tenants.isLoading()) {
            <div class="grid place-items-center py-16"><span class="loading loading-spinner"></span></div>
          } @else if (tenants.error()) {
            <div class="p-10 text-center">
              <p class="text-error">No pudimos leer los comercios.</p>
              <p class="mt-1 text-sm text-base-content/50">
                Las reglas solo dejan listarlos todos a un superadmin. Otorgalo con
                <code class="font-mono">npm run superadmin -- tu&#64;mail.com</code>.
              </p>
              <button type="button" class="btn btn-outline btn-sm mt-4" (click)="tenants.reload()">Reintentar</button>
            </div>
          } @else {
            <div class="hidden overflow-x-auto sm:block">
              <table class="table">
                <thead>
                  <tr class="text-xs uppercase tracking-wider">
                    <th>Comercio</th><th>Link</th><th>Estado</th><th>Vendido</th><th>Neto</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of shops(); track t.id) {
                    <tr>
                      <td class="font-medium">{{ t.business.name }}</td>
                      <td class="font-mono text-sm text-base-content/60">/{{ t.business.slug }}</td>
                      <td>
                        <span class="badge badge-sm"
                              [class.badge-success]="t.business.published"
                              [class.badge-ghost]="!t.business.published">
                          {{ t.business.published ? 'publicada' : 'borrador' }}
                        </span>
                      </td>
                      <td class="tabular-nums">{{ t.soldThisMonth | bs }}</td>
                      <td class="tabular-nums">{{ neto(t) | bs }}</td>
                      <td class="text-right">
                        <a class="btn btn-ghost btn-xs" [routerLink]="['/', t.business.slug]">ver página</a>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="6" class="py-10 text-center text-base-content/50">Todavía no hay comercios.</td></tr>
                  }
                </tbody>
              </table>
            </div>

            <ul class="divide-y divide-base-300 sm:hidden">
              @for (t of shops(); track t.id) {
                <li class="p-4">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate font-medium">{{ t.business.name }}</p>
                      <p class="truncate font-mono text-sm text-base-content/50">/{{ t.business.slug }}</p>
                    </div>
                    <span class="badge badge-sm"
                          [class.badge-success]="t.business.published"
                          [class.badge-ghost]="!t.business.published">
                      {{ t.business.published ? 'publicada' : 'borrador' }}
                    </span>
                  </div>
                  <p class="mt-3 text-2xl font-semibold tabular-nums">{{ t.soldThisMonth | bs }}</p>
                  <p class="text-sm text-base-content/50">neto {{ neto(t) | bs }}</p>
                </li>
              }
            </ul>
          }
        </section>

        <!-- Lo que falta, dicho en la cara y no escondido -->
        <section class="mt-8 grid gap-4 sm:grid-cols-2">
          @for (p of pendientes; track p.title) {
            <div class="rounded-box border border-dashed border-base-300 p-6">
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-medium">{{ p.title }}</h3>
                <span class="badge badge-sm badge-ghost">falta</span>
              </div>
              <p class="mt-2 text-base-content/60">{{ p.body }}</p>
            </div>
          }
        </section>
      </div>
    </div>
  </div>
  `,
})
export class AdminPanel {
  private readonly db = inject(Firestore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly pendientes = [
    { title: 'Bandeja de pagos', body: 'Confirmar a mano cada pago que entra por QR hasta que el banco nos dé API. Dispara la emisión de la gift card.' },
    { title: 'Liquidación mensual', body: 'Corte por comercio: bruto − comisión = neto, y la planilla de transferencias para la banca en línea.' },
  ];

  readonly tenants = resource({
    loader: async () => {
      const snap = await getDocs(query(collection(this.db, 'tenants')));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Tenant);
    },
  });

  // value() lanza si el resource está en error: hasValue() primero o se cae
  // la detección de cambios antes de poder mostrar el mensaje.
  readonly shops = computed(() => (this.tenants.hasValue() ? this.tenants.value() : []));
  readonly publicados = computed(() => this.shops().filter(t => t.business.published).length);
  readonly bruto = computed(() => this.shops().reduce((s, t) => s + (t.soldThisMonth ?? 0), 0));
  readonly comision = computed(() => Math.round(this.bruto() * 0.05));
  neto(t: Tenant) { return Math.round((t.soldThisMonth ?? 0) * 0.95); }

  async salir() {
    await this.auth.signOut();
    this.router.navigateByUrl('/');
  }
}
