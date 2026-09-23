import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from './data';
import { Wordmark } from './brand';
import { Reveal } from './reveal';

/** ponytail: nombres inventados. Poner marcas reales como clientes sería un
 *  aval falso; se reemplazan por comercios de verdad cuando los haya. */
const LOGOS = ['Casa Bonita', 'Andina Café', 'Kantuta Spa', 'Nuvo Fitness', 'Óptica Luz', 'Sabor Sur'];

const VALUES = [
  {
    title: 'Tu página, tu link',
    body: 'Tu logo, tu color, tus productos. giftcards.bo/tu-negocio, listo para el estado de WhatsApp.',
    icon: 'M4 5h16v14H4zM4 9h16',
  },
  {
    title: 'Cobrás por adelantado',
    body: 'Tu cliente paga por QR y recibe la gift card por email. La plata entra hoy.',
    icon: 'M12 3v18M8 7h6a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h6',
  },
  {
    title: 'Sabés lo que debés',
    body: 'Separamos lo cobrado de lo que todavía tenés que entregar. Nadie más te lo dice.',
    icon: 'M3 12h4l3 8 4-16 3 8h4',
  },
];

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
            Tus clientes compran ahí mismo y vos cobrás por adelantado.
          </p>

          <div reveal="2" class="mt-8 flex flex-wrap items-center gap-3">
            <a routerLink="/onboarding" class="btn btn-lg btn-primary">Crear mi comercio</a>
            <a routerLink="/login" class="btn btn-lg btn-ghost">Ya tengo cuenta</a>
          </div>

          <dl reveal="3" class="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-base-300 pt-6">
            @for (n of numeros; track n.k) {
              <div>
                <dt class="text-2xl font-semibold tabular-nums">{{ n.k }}</dt>
                <dd class="mt-0.5 text-sm text-base-content/55">{{ n.v }}</dd>
              </div>
            }
          </dl>
        </div>

        <!-- la página que le va a quedar al comercio -->
        <div reveal="2" class="relative mx-auto mb-10 w-full max-w-[310px] lg:mb-0 lg:max-w-[340px]">
          <div>
            <div class="overflow-hidden rounded-[1.75rem] border border-base-300 bg-base-100 shadow-lg">
              <div class="relative h-24" style="background-color:#3b7d6e">
                <div class="absolute inset-x-0 -bottom-7 px-5">
                  <span class="grid size-14 place-items-center rounded-2xl border-4 border-base-100 text-lg font-semibold text-white"
                        style="background-color:#2f6457">SA</span>
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

    <!-- ── qué te damos ────────────────────────────────────── -->
    <section class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div class="grid gap-5 md:grid-cols-3">
        @for (v of values; track v.title; let i = $index) {
          <div [reveal]="i + 1" class="min-w-0 rounded-box border border-base-300 bg-base-100 p-6">
            <span class="grid size-11 place-items-center rounded-field bg-accent text-accent-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-6">
                <path [attr.d]="v.icon" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <h2 class="mt-4 text-lg font-medium">{{ v.title }}</h2>
            <p class="mt-2 text-base-content/65">{{ v.body }}</p>
          </div>
        }
      </div>
    </section>

    <!-- ── precio y cierre ─────────────────────────────────── -->
    <section class="border-t border-base-300 bg-base-100">
      <div reveal class="mx-auto flex max-w-6xl flex-wrap items-center gap-8 px-4 py-14 sm:px-6">
        <div class="min-w-0 flex-1">
          <p class="text-5xl font-semibold tracking-tight sm:text-6xl">
            <span class="text-primary">5%</span>
            <span class="ms-3 align-middle text-lg font-normal text-base-content/60">por venta</span>
          </p>
          <p class="mt-3 max-w-xl text-base-content/70">
            Sin mensualidad, sin costo de alta, sin permanencia. Si no vendés, no pagás.
            Toma unos diez minutos dejar tu página lista.
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
  readonly values = VALUES;
  readonly montos = [
    { label: 'Bs 150', on: false },
    { label: 'Bs 250', on: true },
    { label: 'Bs 400', on: false },
    { label: 'Otro monto', on: false },
  ];
  readonly numeros = [
    { k: '5%', v: 'por venta, nada más' },
    { k: '10 min', v: 'y tu página está lista' },
    { k: 'Bs 0', v: 'de mensualidad' },
  ];
  readonly shops = inject(Store).publishedTenants();
}
