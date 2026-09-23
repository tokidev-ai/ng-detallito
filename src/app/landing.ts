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
        <!-- En móvil el hero no lleva botones: el CTA vive acá y la barra es fija,
             así que te acompaña todo el scroll. -->
        <a routerLink="/onboarding" class="btn btn-sm btn-primary">Crear mi comercio</a>
        <a routerLink="/login" class="btn btn-ghost btn-sm">Entrar</a>
      </nav>
    </header>

    <!-- ── hero ────────────────────────────────────────────── -->
    <!-- En móvil el orden es otro a propósito: titular, promesa, acción y
         recién ahí el producto asomando. La pantalla inicial de un celular
         entra ~640px útiles; si el botón no entra, la landing no vende. -->
    <section class="relative overflow-hidden border-b border-base-300 bg-base-100">
      <div class="dotgrid pointer-events-none absolute inset-0" aria-hidden="true"></div>

      <div class="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:py-20">

        <div class="text-center lg:text-left">
          <h1 reveal
              class="text-[2.75rem] font-extrabold leading-[0.98] tracking-[-0.045em] text-balance
                     sm:text-6xl lg:text-[4.75rem] lg:leading-[0.95]">
            Tu negocio vendiendo
            <span class="relative inline-block whitespace-nowrap text-primary">
              gift cards
              <svg class="subrayado absolute -bottom-2.5 left-0 w-full sm:-bottom-3" height="14"
                   viewBox="0 0 200 14" preserveAspectRatio="none" fill="none" aria-hidden="true">
                <path d="M3 9.5C42 4 86 2.6 130 4.2c25 .9 48 2.6 67 5.3"
                      stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
              </svg>
            </span>
            desde hoy.
          </h1>

          <p reveal="1" class="mx-auto mt-5 max-w-xl text-base text-base-content/70 sm:mt-6 sm:text-lg lg:mx-0">
            Te armamos una página con tus productos y tu marca, en un link propio.
            <strong class="font-bold text-primary underline decoration-2 underline-offset-4">
              Tu página puede estar lista hoy mismo
            </strong>
          </p>

          <div reveal="2" class="mt-8 hidden flex-wrap items-center gap-3 lg:flex">
            <a routerLink="/onboarding" class="btn btn-lg btn-primary">Crear mi comercio</a>
            <a routerLink="/login" class="btn btn-lg btn-ghost">Ya tengo cuenta</a>
          </div>

          <p reveal="3" class="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm
                    text-base-content/55 lg:mt-4 lg:justify-start">
            <span class="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" class="size-4 text-primary">
                <path d="M4 12.5l5 5 11-11" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Sin instalar nada
            </span>
            <span class="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" class="size-4 text-primary">
                <path d="M4 12.5l5 5 11-11" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Tu propio link
            </span>
          </p>

          <!-- en móvil las cifras van DESPUÉS del producto: son apoyo, no anzuelo -->
          <dl reveal="3"
              class="order-last mt-8 hidden max-w-md grid-cols-2 gap-6 border-t border-base-300 pt-6 text-sm lg:mt-10 lg:grid">
            @for (n of numeros; track n.k) {
              <div>
                <dt class="text-xl font-semibold">{{ n.k }}</dt>
                <dd class="mt-0.5 text-base-content/55">{{ n.v }}</dd>
              </div>
            }
          </dl>
        </div>

        <!-- la página que le va a quedar al comercio -->
        <div reveal="2" class="relative mx-auto w-full max-w-[280px] sm:max-w-[310px] lg:max-w-[340px]">
          <div class="pointer-events-none absolute -inset-8 rounded-full bg-primary/10 blur-3xl" aria-hidden="true"></div>

          <div class="relative overflow-hidden rounded-[1.75rem] border border-base-300 bg-base-100 shadow-lg">
            <div class="relative">
              <img src="img/spa-cover.jpg" alt="" width="760" height="280"
                   class="h-24 w-full object-cover sm:h-28">
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

          <!-- flotando solo desde sm: en móvil taparía el botón del mockup -->
          <div reveal="4"
               class="mt-3 w-full rounded-box border border-base-300 bg-base-100 p-3 shadow-md
                      sm:absolute sm:-bottom-14 sm:-left-4 sm:mt-0 sm:w-48 lg:-left-16">
            <p class="text-[11px] uppercase tracking-wider text-base-content/40">Canje registrado</p>
            <p class="mt-1 text-2xl font-semibold tabular-nums">−Bs 120</p>
            <p class="text-xs text-base-content/50">quedan Bs 130 · 4821-KQ7</p>
          </div>
        </div>

        <!-- las cifras, en móvil, cierran el bloque -->
        <dl reveal="3" class="grid grid-cols-2 gap-6 border-t border-base-300 pt-6 text-sm lg:hidden">
          @for (n of numeros; track n.k) {
            <div>
              <dt class="text-xl font-semibold">{{ n.k }}</dt>
              <dd class="mt-0.5 text-base-content/55">{{ n.v }}</dd>
            </div>
          }
        </dl>
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
    <section class="hidden border-t border-base-300 bg-base-100 lg:block">
      <div reveal class="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-12 sm:flex-row sm:flex-wrap sm:items-center sm:gap-8 sm:px-6 sm:py-14">
        <div class="min-w-0 sm:flex-1">
          <h2 class="text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
            ¿Arrancamos? <span class="text-primary">Son diez minutos</span>.
          </h2>
          <p class="mt-3 max-w-xl text-base-content/70">
            Tu marca, lo que vendes y listo. Después compartes el link y empiezas a recibir pedidos.
          </p>
        </div>
        <a routerLink="/onboarding" class="btn btn-lg btn-primary w-full sm:w-auto">Crear mi comercio</a>
      </div>
    </section>

    <footer class="border-t border-base-300">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-7 text-sm text-base-content/45 sm:px-6">
        <app-wordmark />
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
