import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from './data';
import { Wordmark } from './brand';

const STEPS = [
  { n: '1', title: 'Armá tu página', body: 'Tu logo, tu color, tu descripción y los productos que querés vender: montos fijos, monto abierto o un servicio con precio. Con vista previa en vivo mientras la armás.' },
  { n: '2', title: 'Compartí tu link', body: 'Te queda giftcards.bo/tu-negocio. Va al estado de WhatsApp, a la bio de Instagram, a donde quieras.' },
  { n: '3', title: 'Cobrá y canjeá', body: 'Tu cliente paga por QR y le llega la gift card por email. Tu equipo la canjea desde el celular, con saldo parcial si hace falta.' },
];

const FEATURES = [
  { title: 'Canje con saldo parcial', body: 'Si la gift card es de Bs 250 y consumieron Bs 120, quedan Bs 130 para la próxima visita. Se descuenta, no se pierde.' },
  { title: 'Tu equipo, con permisos', body: 'El cajero canjea pero no ve tus ventas. Vos elegís qué habilita cada empleado. Tus datos bancarios no se delegan nunca.' },
  { title: 'Sin app que instalar', body: 'Todo en el navegador, en el celular que ya tienen. Vos y tus clientes.' },
];

@Component({
  selector: 'app-landing',
  imports: [RouterLink, Wordmark],
  template: `
  <div class="min-h-dvh bg-base-200">

    <!-- ── nav ─────────────────────────────────────────────── -->
    <header class="sticky top-0 z-40 border-b border-base-300/60 bg-base-200/80 backdrop-blur">
      <nav class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <a routerLink="/" class="flex-1"><app-wordmark /></a>
        <a routerLink="/login" class="btn btn-ghost btn-sm">Entrar</a>
        <a routerLink="/onboarding" class="btn btn-sm border-0 text-white brand-fill">Crear mi comercio</a>
      </nav>
    </header>

    <!-- ── hero ────────────────────────────────────────────── -->
    <section class="overflow-hidden brand-glow">
      <div class="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p class="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100/60 px-3 py-1 text-sm text-base-content/70">
            <span class="size-1.5 rounded-full bg-success"></span> Hecho en Bolivia · pagos en Bs
          </p>

          <h1 class="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            La página de tu negocio,<br>
            <span class="brand-text">vendiendo gift cards</span><br>desde hoy.
          </h1>

          <p class="mt-6 max-w-lg text-lg text-base-content/70">
            Te armamos una página con tus productos y tu marca, en un link propio.
            Tus clientes compran gift cards ahí mismo y vos cobrás por adelantado.
            Nosotros ponemos la plataforma, el cobro, la entrega y el canje.
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <a routerLink="/onboarding" class="btn border-0 text-white brand-fill">Crear mi comercio</a>
            <a href="#como" class="btn btn-outline">Ver cómo funciona</a>
          </div>

          <p class="mt-5 text-sm text-base-content/50">
            Sin mensualidad. Cobramos 5% solo cuando vendés.
          </p>
        </div>

        <!-- la página que le va a quedar al comercio -->
        <div class="relative mx-auto w-full max-w-[300px]">
          <div class="absolute -inset-6 rounded-[3rem] opacity-25 blur-3xl brand-fill"></div>
          <div class="relative overflow-hidden rounded-[2.2rem] border-4 border-base-300 bg-base-100 shadow-2xl">
            <div class="h-28 brand-fill opacity-90"></div>
            <div class="p-5">
              <div class="flex items-center gap-3">
                <div class="size-11 rounded-full border border-base-300 bg-base-200"></div>
                <div>
                  <p class="font-semibold">Spa Aurora</p>
                  <p class="text-xs text-base-content/50">giftcards.bo/spa-aurora</p>
                </div>
              </div>
              <p class="mt-3 text-sm text-base-content/70">Masajes, faciales y estética en Sopocachi.</p>
              <div class="mt-5 grid grid-cols-2 gap-2">
                @for (m of ['Bs 150', 'Bs 250', 'Bs 400', 'Otro monto']; track m) {
                  <div class="rounded-field border border-base-300 px-3 py-3 text-center text-sm">{{ m }}</div>
                }
              </div>
              <div class="mt-3 rounded-field py-3 text-center text-sm font-medium text-white brand-fill">Comprar</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── cómo funciona ───────────────────────────────────── -->
    <section id="como" class="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Tres pasos y estás vendiendo</h2>
      <p class="mt-3 max-w-2xl text-lg text-base-content/60">
        No hace falta que tengas página web, ni pasarela de pagos, ni a nadie que programe.
      </p>
      <div class="mt-10 grid gap-5 md:grid-cols-3">
        @for (s of steps; track s.n) {
          <div class="rounded-box border border-base-300 bg-base-100 p-6">
            <span class="grid size-9 place-items-center rounded-full text-sm font-semibold text-white brand-fill">{{ s.n }}</span>
            <h3 class="mt-4 text-lg font-medium">{{ s.title }}</h3>
            <p class="mt-2 text-base-content/65">{{ s.body }}</p>
          </div>
        }
      </div>
    </section>

    <!-- ── para quién ──────────────────────────────────────── -->
    <section class="border-t border-base-300 bg-base-100/40">
      <div class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 class="text-sm uppercase tracking-wider text-base-content/50">Para negocios como</h2>
        <ul class="mt-5 flex flex-wrap gap-2">
          @for (r of rubros; track r) {
            <li class="rounded-full border border-base-300 px-4 py-2 text-sm text-base-content/75">{{ r }}</li>
          }
        </ul>
        <p class="mt-6 max-w-2xl text-base-content/60">
          Si cobrás por un servicio o un producto que se entrega después, una gift card
          es plata que entra hoy por trabajo que hacés mañana.
        </p>
      </div>
    </section>

    <!-- ── el argumento que nadie más te dice ──────────────── -->
    <section class="border-y border-base-300 bg-base-100">
      <div class="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">
            Te mostramos lo que <span class="brand-text">todavía debés</span>, no solo lo que cobraste.
          </h2>
          <p class="mt-5 text-lg text-base-content/70">
            Una gift card vendida no es plata tuya: es un servicio que prometiste.
            Tu panel separa las dos cosas, así no gastás hoy lo que vas a tener que entregar en marzo.
          </p>
          <p class="mt-4 text-base-content/55">
            Es la diferencia entre un negocio que crece y uno que se queda sin caja el día que todos vienen a canjear.
          </p>
        </div>

        <div class="rounded-box border border-base-300 bg-base-200 p-6 sm:p-8">
          <p class="text-xs uppercase tracking-wider text-base-content/50">Saldo pendiente de canje (deuda)</p>
          <p class="mt-1 text-5xl font-semibold tabular-nums sm:text-6xl">Bs 3.480</p>
          <p class="mt-2 text-sm text-base-content/60">de 19 gift cards vivas · vence la más próxima el 14/11</p>
          <div class="mt-4 flex h-3 overflow-hidden rounded-full bg-base-300">
            <div class="w-[58%] bg-brand-violet"></div>
            <div class="w-[27%] bg-brand-pink"></div>
            <div class="w-[15%] bg-brand-orange"></div>
          </div>
          <div class="mt-6 grid grid-cols-2 gap-4 border-t border-base-300 pt-5">
            <div>
              <p class="text-xs uppercase tracking-wider text-base-content/50">Vendido del mes</p>
              <p class="mt-1 text-2xl font-semibold tabular-nums">Bs 2.000</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wider text-base-content/50">Neto a cobrar</p>
              <p class="mt-1 text-2xl font-semibold tabular-nums">Bs 1.900</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── features ────────────────────────────────────────── -->
    <section class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div class="grid gap-5 md:grid-cols-3">
        @for (f of features; track f.title) {
          <div class="rounded-box border border-base-300 bg-base-100 p-6">
            <h3 class="text-lg font-medium">{{ f.title }}</h3>
            <p class="mt-2 text-base-content/65">{{ f.body }}</p>
          </div>
        }
      </div>
    </section>

    <!-- ── comercios reales del sistema ────────────────────── -->
    @if (shops.hasValue() && shops.value().length) {
      <section class="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
        <h2 class="text-sm uppercase tracking-wider text-base-content/50">Ya venden con Detallito</h2>
        <ul class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (t of shops.value(); track t.id) {
            <li class="min-w-0">
              <a [routerLink]="['/', t.business.slug]"
                 class="flex min-w-0 items-center gap-4 rounded-box border border-base-300 bg-base-100 p-4 transition hover:border-primary/50">
                <span class="size-11 shrink-0 rounded-full border border-base-300"
                      [style.background-color]="t.business.color"></span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate font-medium">{{ t.business.name }}</span>
                  <span class="block truncate text-sm text-base-content/50">{{ t.business.description }}</span>
                </span>
              </a>
            </li>
          }
        </ul>
      </section>
    }

    <!-- ── precio + cierre ─────────────────────────────────── -->
    <section class="border-t border-base-300 brand-glow">
      <div class="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p class="text-6xl font-semibold tracking-tight sm:text-7xl"><span class="brand-text">5%</span></p>
        <p class="mt-3 text-lg text-base-content/70">
          por venta. Sin mensualidad, sin costo de alta, sin permanencia.<br>
          Si no vendés, no pagás.
        </p>
        <a routerLink="/onboarding" class="btn mt-8 border-0 text-white brand-fill">Crear mi comercio</a>
      </div>
    </section>

    <footer class="border-t border-base-300">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-8 text-sm text-base-content/50 sm:px-6">
        <app-wordmark [size]="20" />
        <span class="ms-auto">La Paz, Bolivia</span>
      </div>
    </footer>
  </div>
  `,
})
export class Landing {
  readonly rubros = [
    'Spas y estética', 'Barberías y peluquerías', 'Restaurantes y cafés', 'Gimnasios',
    'Tiendas de ropa', 'Ópticas', 'Fotografía', 'Veterinarias', 'Academias y cursos',
  ];
  readonly steps = STEPS;
  readonly features = FEATURES;
  readonly shops = inject(Store).publishedTenants();
}
