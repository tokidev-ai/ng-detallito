import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '../data';
import { AuthService } from '../auth';
import { Wordmark } from '../brand';

const PITCH = [
  {
    title: 'Tu página de productos',
    body: 'Armamos la página de tu negocio con tu logo, tu color y lo que vendés. Te queda un link propio — giftcards.bo/tu-negocio — listo para compartir.',
  },
  {
    title: 'Gift cards que se venden solas',
    body: 'Tus clientes eligen un monto o un servicio, pagan por QR y reciben la gift card por email. Vos cobrás por adelantado.',
  },
  {
    title: 'Canje y control desde el celular',
    body: 'Tu equipo canjea con el código, incluso por partes. Y vos ves en todo momento cuánto vendiste y cuánto todavía debés entregar.',
  },
];

/** Panel del comercio. Con comercios, entra directo al primero; sin ninguno,
 *  explica qué hacemos y empuja a crear el primero. */
@Component({
  selector: 'app-tenants',
  imports: [RouterLink, Wordmark],
  template: `
  <div class="min-h-dvh bg-base-200">
    <header class="border-b border-base-300/60">
      <nav class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <a routerLink="/"><app-wordmark /></a>
        <span class="ms-auto hidden text-sm text-base-content/50 sm:inline">{{ email() }}</span>
        <button type="button" class="btn btn-ghost btn-sm" (click)="salir()">Salir</button>
      </nav>
    </header>

    <!-- Solo se ve cuando todavía no hay ningún comercio: con uno, redirige. -->
    <div class="brand-glow">
      <div class="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        @if (loading()) {
          <div class="grid place-items-center py-24"><span class="loading loading-spinner loading-lg"></span></div>
        } @else {
          <p class="text-sm text-base-content/50">Hola{{ firstName() ? ', ' + firstName() : '' }}</p>

          <h1 class="mt-2 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Todavía no tenés un comercio.<br>
            <span class="brand-text">Creemos el primero.</span>
          </h1>

          <p class="mt-5 max-w-2xl text-lg text-base-content/70">
            GiftKBol le arma a tu negocio una página propia donde mostrás tus productos
            y vendés gift cards. Nosotros ponemos el cobro, la entrega y el canje.
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-4">
            <a routerLink="/onboarding" class="btn btn-lg border-0 brand-fill">Crear mi comercio</a>
            <span class="text-sm text-base-content/50">Toma unos diez minutos · sin mensualidad</span>
          </div>

          <div class="mt-12 grid gap-4 md:grid-cols-3">
            @for (p of pitch; track p.title; let i = $index) {
              <div class="min-w-0 rounded-box border border-base-300 bg-base-100 p-6">
                <span class="grid size-9 place-items-center rounded-full text-sm font-semibold brand-fill">
                  {{ i + 1 }}
                </span>
                <h2 class="mt-4 text-lg font-medium">{{ p.title }}</h2>
                <p class="mt-2 text-base-content/65">{{ p.body }}</p>
              </div>
            }
          </div>

          <div class="mt-10 rounded-box border border-base-300 bg-base-100 p-6 sm:p-8">
            <div class="flex flex-wrap items-center gap-6">
              <div class="min-w-0 flex-1">
                <h2 class="text-xl font-medium">Lo que vas a configurar</h2>
                <p class="mt-1 text-base-content/60">
                  Cinco pasos, con la vista previa de tu página al lado mientras la armás.
                </p>
              </div>
              <a routerLink="/onboarding" class="btn border-0 brand-fill">Empezar</a>
            </div>
            <ol class="mt-6 grid gap-2 sm:grid-cols-5">
              @for (s of steps; track s; let i = $index) {
                <li class="flex items-center gap-2 rounded-field border border-base-300 px-3 py-2.5">
                  <span class="text-xs font-semibold text-base-content/40">{{ i + 1 }}</span>
                  <span class="truncate text-sm">{{ s }}</span>
                </li>
              }
            </ol>
          </div>
        }
      </div>
    </div>
  </div>
  `,
})
export class Tenants {
  private readonly router = inject(Router);
  readonly s = inject(Store);
  readonly auth = inject(AuthService);

  readonly pitch = PITCH;
  readonly steps = ['Marca', 'Productos', 'Vigencia', 'Datos bancarios', 'Publicar'];

  readonly email = computed(() => this.auth.user()?.email ?? '');
  readonly firstName = computed(() => {
    const u = this.auth.user();
    return u?.displayName?.split(' ')[0] ?? (u?.email ?? '').split('@')[0] ?? '';
  });

  /** No mostrar el estado vacío mientras Firestore todavía no contestó. */
  readonly loading = computed(() => this.auth.user() === undefined);

  constructor() {
    // Con comercios, el admin es el panel del comercio: entramos directo.
    effect(() => {
      const list = this.s.tenants();
      if (list.length) this.router.navigate(['/app', list[0].id, 'resumen'], { replaceUrl: true });
    });
  }

  async salir() {
    await this.auth.signOut();
    this.router.navigateByUrl('/');
  }
}
