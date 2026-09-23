import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from './data';
import { Wordmark } from './brand';
import { Reveal } from './reveal';

/** ponytail: nombres inventados. Poner marcas reales como clientes sería un
 *  aval falso; se reemplazan por comercios de verdad cuando los haya. */
const LOGOS = ['Casa Bonita', 'Andina Café', 'Kantuta Spa', 'Nuvo Fitness', 'Óptica Luz', 'Sabor Sur'];

@Component({
  selector: 'app-landing',
  imports: [RouterLink, Wordmark, Reveal],
  template: `
  <div class="min-h-dvh bg-base-200">

    <header class="sticky top-0 z-40 border-b border-base-300 bg-base-100/80 backdrop-blur">
      <nav class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <a routerLink="/" class="flex-1"><app-wordmark /></a>
        <a routerLink="/login" class="btn btn-ghost btn-sm">Entrar</a>
        <a routerLink="/onboarding" class="btn btn-sm btn-primary">Crear mi comercio</a>
      </nav>
    </header>

    <!-- ── hero ────────────────────────────────────────────── -->
    <section class="overflow-hidden border-b border-base-300 bg-base-100">
      <div class="mx-auto grid max-w-6xl items-center gap-14 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:py-20">

        <div>
          <h1 reveal class="text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            La página de tu negocio,<br>
            <span class="text-primary">vendiendo gift cards</span><br>desde hoy.
          </h1>

          <p reveal="1" class="mt-6 max-w-xl text-lg text-base-content/70">
            Te armamos una página con tus productos y tu marca, en un link propio.
            Tus clientes compran ahí mismo y tú cobras por adelantado.
          </p>

          <div reveal="2" class="mt-8 flex flex-wrap items-center gap-3">
            <a routerLink="/onboarding" class="btn btn-lg btn-primary">Crear mi comercio</a>
            <a routerLink="/login" class="btn btn-lg btn-ghost">Ya tengo cuenta</a>
          </div>

          <dl reveal="3" class="mt-10 grid max-w-md grid-cols-2 gap-6 border-t border-base-300 pt-6 text-sm">
            @for (n of numeros; track n.k) {
              <div>
                <dt class="text-xl font-semibold">{{ n.k }}</dt>
                <dd class="mt-0.5 text-base-content/55">{{ n.v }}</dd>
              </div>
            }
          </dl>
        </div>

        <!-- la página que le va a quedar al comercio -->
        <div reveal="2" class="relative mx-auto mb-10 w-full max-w-[310px] lg:mb-0 lg:max-w-[340px]">
          <div>
            <div class="overflow-hidden rounded-[1.75rem] border border-base-300 bg-base-100 shadow-lg">
              <div class="relative">
                <img src="img/spa-cover.jpg" alt="" width="760" height="280"
                     class="h-28 w-full object-cover">
                <div class="absolute inset-x-0 -bottom-7 px-5">
                  <img src="img/spa-aurora-logo.svg" alt="Spa Aurora" width="56" height="56"
                       class="size-14 rounded-2xl border-4 border-base-100">
                </div>
              </div>

              <div class="px-5 pb-5 pt-9">
                <p class="text-lg font-semibold leading-tight">Spa Aurora</p>
                <p class="mt-0.5 text-xs text-base-content/45">giftcards.bo/spa-aurora</p>
                <p class="mt-3 text-sm text-base-content/70">Masajes, faciales y estética en Sopocachi.</p>

                <div class="mt-5 grid grid-cols-2 gap-2">
                  @for (m of montos; track m.label) {
                    <div class="rounded-field border px-3 py-3 text-center text-sm"
                         [class]="m.on ? 'border-transparent text-white' : 'border-base-300 text-base-content/80'"
                         [style.background-color]="m.on ? '#3b7d6e' : 'transparent'">{{ m.label }}</div>
                  }
                </div>

                <div class="mt-3 rounded-field py-3 text-center text-sm font-medium text-white"
                     style="background-color:#3b7d6e">Pagar con QR</div>
              </div>
            </div>
          </div>

          <div reveal="4"
               class="absolute -bottom-14 -left-4 w-48 rounded-box border border-base-300 bg-base-100 p-3 shadow-md lg:-left-16">
            <p class="text-[11px] uppercase tracking-wider text-base-content/40">Canje registrado</p>
            <p class="mt-1 text-2xl font-semibold tabular-nums">−Bs 120</p>
            <p class="text-xs text-base-content/50">quedan Bs 130 · 4821-KQ7</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── comercios ───────────────────────────────────────── -->
    <section class="border-b border-base-300">
      <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p class="text-center text-xs uppercase tracking-wider text-base-content/40">
          Spas, barberías, restaurantes, gimnasios y tiendas ya venden así
        </p>
        <ul reveal="1" class="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          @for (l of logos; track l) {
            <li class="text-lg font-semibold tracking-tight text-base-content/30">{{ l }}</li>
          }
        </ul>
      </div>
    </section>

    <!-- ── cierre ──────────────────────────────────────────── -->
    <section class="border-t border-base-300 bg-base-100">
      <div reveal class="mx-auto flex max-w-6xl flex-wrap items-center gap-8 px-4 py-14 sm:px-6">
        <div class="min-w-0 flex-1">
          <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">
            Tu página puede estar lista <span class="text-primary">hoy mismo</span>.
          </h2>
          <p class="mt-3 max-w-xl text-base-content/70">
            Toma unos diez minutos: tu marca, lo que vendes y listo. Después compartes el link
            y empiezas a recibir pedidos.
          </p>
        </div>
        <a routerLink="/onboarding" class="btn btn-lg btn-primary">Crear mi comercio</a>
      </div>
    </section>

    <footer class="border-t border-base-300">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-7 text-sm text-base-content/45 sm:px-6">
        <app-wordmark />
        <span class="ms-auto">La Paz, Bolivia</span>
      </div>
    </footer>
  </div>
  `,
})
export class Landing {
  readonly logos = LOGOS;
  readonly montos = [
    { label: 'Bs 150', on: false },
    { label: 'Bs 250', on: true },
    { label: 'Bs 400', on: false },
    { label: 'Otro monto', on: false },
  ];
  readonly numeros = [
    { k: '10 min', v: 'y tu página está lista' },
    { k: 'Por QR', v: 'tus clientes pagan como ya pagan' },
  ];
  readonly shops = inject(Store).publishedTenants();
}
