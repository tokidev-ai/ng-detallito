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
    <!-- En móvil es una columna y el orden lo da el DOM: titular, producto,
         texto, cifras. En lg pasa a dos columnas con posiciones explícitas,
         así el mockup se va a la derecha y el texto se reordena solo. -->
    <section class="relative overflow-hidden border-b border-base-300 bg-base-100">
      <div class="dotgrid pointer-events-none absolute inset-0" aria-hidden="true"></div>

      <div class="relative mx-auto flex max-w-6xl flex-col gap-7 px-4 py-10 sm:px-6 sm:py-14
                  lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-x-12 lg:gap-y-0 lg:py-20">

        <!-- 1 · el titular -->
        <h1 reveal
            class="text-center text-[2.75rem] font-extrabold leading-[0.98] tracking-[-0.045em] text-balance
                   sm:text-6xl lg:col-start-1 lg:row-start-1 lg:text-left lg:text-[4.75rem] lg:leading-[0.95]">
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

        <!-- 2 · la página que le va a quedar al comercio -->
        <div reveal="1"
             class="relative mx-auto mb-8 w-full max-w-[240px] sm:max-w-[265px]
                    lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:mb-0 lg:max-w-[320px]">
          <div class="pointer-events-none absolute -inset-8 rounded-full bg-primary/10 blur-3xl" aria-hidden="true"></div>

          <div class="relative overflow-hidden rounded-[1.5rem] border border-base-300 bg-base-100 shadow-lg">
            <div class="relative">
              <img src="img/spa-cover.jpg" alt="" width="760" height="280"
                   class="h-20 w-full object-cover sm:h-24">
              <div class="absolute inset-x-0 -bottom-6 px-4">
                <img src="img/spa-aurora-logo.svg" alt="Spa Aurora" width="48" height="48"
                     class="size-12 rounded-xl border-4 border-base-100">
              </div>
            </div>

            <div class="px-4 pb-4 pt-8">
              <p class="font-semibold leading-tight">Spa Aurora</p>
              <p class="mt-0.5 text-[11px] text-base-content/45">giftcards.bo/spa-aurora</p>
              <p class="mt-2 text-xs text-base-content/70">Masajes, faciales y estética en Sopocachi.</p>

              <div class="mt-4 grid grid-cols-2 gap-2">
                @for (m of montos; track m.label) {
                  <div class="rounded-field border px-2 py-2.5 text-center text-xs"
                       [class]="m.on ? 'border-transparent text-white' : 'border-base-300 text-base-content/80'"
                       [style.background-color]="m.on ? '#3b7d6e' : 'transparent'">{{ m.label }}</div>
                }
              </div>

              <div class="mt-2 rounded-field py-2.5 text-center text-xs font-medium text-white"
                   style="background-color:#3b7d6e">Pagar con QR</div>
            </div>
          </div>

          <!-- lo que pasa después, del otro lado del mostrador -->
          <div reveal="4"
               class="absolute -bottom-12 -left-8 w-[7.5rem] rounded-xl border border-base-300 bg-base-100
                      p-2.5 shadow-md sm:-left-10 sm:w-32 lg:-bottom-8 lg:-left-12 lg:w-40 lg:p-3">
            <p class="text-[9px] uppercase tracking-wider text-base-content/40 lg:text-[10px]">
              Canje<span class="hidden lg:inline"> registrado</span>
            </p>
            <p class="mt-0.5 text-lg font-semibold tabular-nums lg:text-xl">−Bs 120</p>
            <p class="text-[10px] text-base-content/50">quedan Bs 130</p>
          </div>
        </div>

        <!-- 3 · qué hacemos -->
        <div reveal="2" class="text-center lg:col-start-1 lg:row-start-2 lg:text-left">
          <p class="mx-auto max-w-xl text-base text-base-content/70 sm:text-lg lg:mx-0 lg:mt-6">
            Te armamos una página con tus productos y tu marca, en un link propio.
            <strong class="font-bold text-primary underline decoration-2 underline-offset-4">
              Tu página puede estar lista hoy mismo
            </strong>
          </p>

          <p class="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm
                    text-base-content/55 lg:mt-4 lg:justify-start">
            @for (v of verificados; track v) {
              <span class="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" class="size-4 text-primary">
                  <path d="M4 12.5l5 5 11-11" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ v }}
              </span>
            }
          </p>
        </div>

        <!-- 4 · botones, solo en escritorio: en móvil el CTA vive en la barra fija -->
        <div reveal="3" class="hidden gap-3 lg:col-start-1 lg:row-start-3 lg:mt-8 lg:flex lg:flex-wrap lg:items-center">
          <a routerLink="/onboarding" class="btn btn-lg btn-primary">Crear mi comercio</a>
          <a routerLink="/login" class="btn btn-lg btn-ghost">Ya tengo cuenta</a>
        </div>

        <!-- 5 · las cifras -->
        <dl reveal="3" class="mx-auto grid w-full max-w-[19rem] grid-cols-2 gap-6 border-t border-base-300
                              pt-6 text-center text-sm
                              lg:col-start-1 lg:row-start-4 lg:mx-0 lg:mt-10 lg:max-w-md lg:text-left">
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
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4 py-7 text-sm text-base-content/45 sm:px-6">
        <app-wordmark />
      </div>
    </footer>
  </div>
  `,
})
export class Landing {
  readonly logos = LOGOS;
  readonly verificados = ['Sin instalar nada', 'Tu propio link'];
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
