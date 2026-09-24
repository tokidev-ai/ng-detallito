import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Wordmark } from './brand';
import { Reveal } from './reveal';

/** Tarjetas del abanico del hero: comercios de ejemplo (inventados), cada uno con
 *  su color. Se ven como las gift cards reales porque usan la misma paleta derivada. */
const FAN = [
  { name: 'Andina Café', color: '#4338ca', amount: 'Bs 100', to: 'Lucía', rot: -13, top: 0, left: -70, logo: '' },
  { name: 'Barbería Nor', color: '#be123c', amount: 'Bs 150', to: 'Diego', rot: 6, top: 34, left: 60, logo: '' },
  { name: 'Spa Aurora', color: '#0f766e', amount: 'Bs 250', to: 'Ana', rot: -4, top: 92, left: -10, logo: 'img/spa-aurora-logo.svg' },
];

/** Tipos de negocio, no nombres: no presentamos comercios inventados como clientes. */
const RUBROS = ['💈 Barberías', '💆 Spas', '☕ Cafés', '🏋️ Gimnasios', '🍽️ Restaurantes', '🛍️ Tiendas', '💅 Salones', '📚 Librerías', '🌸 Florerías', '🎨 Talleres'];

@Component({
  selector: 'app-landing',
  imports: [RouterLink, Wordmark, Reveal],
  template: `
  <div class="min-h-dvh overflow-x-clip bg-base-100">

    <header class="sticky top-0 z-40 border-b border-base-300/70 bg-base-100/75 backdrop-blur-xl">
      <nav class="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
        <a routerLink="/" class="flex-1"><app-wordmark /></a>
        <a href="#como-funciona" class="btn btn-ghost btn-sm hidden md:inline-flex">Cómo funciona</a>
        <a href="#beneficios" class="btn btn-ghost btn-sm hidden md:inline-flex">Beneficios</a>
        <a routerLink="/login" class="btn btn-ghost btn-sm">Entrar</a>
        <!-- En móvil el hero no lleva botones: el CTA vive acá, en la barra fija. -->
        <a routerLink="/onboarding" class="btn btn-sm btn-primary rounded-full px-4 shadow-md shadow-primary/30">Crear mi comercio</a>
      </nav>
    </header>

    <!-- ── hero ────────────────────────────────────────────── -->
    <section class="relative overflow-hidden">
      <!-- aurora cálida y tenue: naranja, ámbar, rosa -->
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <span class="blob blob-1" style="background:#fb923c;opacity:.28"></span>
        <span class="blob blob-2" style="background:#fbbf24;opacity:.22"></span>
        <span class="blob blob-3" style="background:#fb7185;opacity:.18"></span>
        <div class="dotgrid absolute inset-0"></div>
      </div>

      <div class="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-6 sm:pt-14
                  lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:pb-24 lg:pt-20">

        <div class="text-center lg:text-left">
          <h1 class="reveal text-[2.75rem] font-extrabold leading-[0.98] tracking-[-0.045em] text-balance sm:text-6xl lg:text-[4.9rem] lg:leading-[0.94]">
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

          <p class="reveal reveal-2 mx-auto mt-6 max-w-xl text-base text-base-content/70 sm:text-lg lg:mx-0">
            Te armamos una página con tu marca y un link propio. Tus clientes compran y regalan;
            tú cobras por adelantado.
            <strong class="font-bold text-[#c2410c]">Tu página puede estar lista hoy mismo.</strong>
          </p>

          <!-- botones solo en escritorio: en móvil el CTA vive en la barra fija -->
          <div class="reveal reveal-3 mt-9 hidden items-center gap-3 lg:flex">
            <a routerLink="/onboarding"
               class="btn btn-lg btn-primary group rounded-full px-7 shadow-xl shadow-primary/30">
              Crear mi comercio
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="size-5 transition-transform group-hover:translate-x-1">
                <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
            <a routerLink="/login" class="btn btn-lg btn-ghost rounded-full">Ya tengo cuenta</a>
          </div>

          <ul class="reveal reveal-4 mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-base-content/60 lg:justify-start">
            @for (v of verificados; track v) {
              <li class="inline-flex items-center gap-1.5">
                <span class="grid size-4 place-items-center rounded-full bg-primary text-primary-content">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" class="size-2.5"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
                {{ v }}
              </li>
            }
          </ul>
        </div>

        <!-- el producto: un abanico de gift cards de verdad, flotando -->
        <!-- --k escala los desplazamientos del abanico al ancho de pantalla -->
        <div class="pop relative mx-auto h-[290px] w-full max-w-[420px] [--k:.55] sm:h-[340px] sm:[--k:.8] lg:h-[420px] lg:max-w-none lg:[--k:1]" style="animation-delay:.15s">
          @for (c of fan; track c.name; let i = $index) {
            <div class="absolute w-[220px] -translate-x-1/2 sm:w-[270px] lg:w-[320px]"
                 [style.left]="'calc(50% + ' + c.left + 'px * var(--k))'"
                 [style.top]="'calc(' + c.top + 'px * var(--k))'" [style.z-index]="i">
              <div class="fan" [style.--rot]="c.rot + 'deg'" [style.animation-delay]="(-i * 1.7) + 's'">
                <div class="storefront shine relative flex aspect-[1.586] flex-col justify-between overflow-hidden rounded-2xl p-4 text-white shadow-2xl shadow-black/25 ring-1 ring-white/20 lg:p-5"
                     [style.--c1]="c.color" style="background:linear-gradient(135deg,var(--c1),var(--c2))">
                  <span class="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-white/15" aria-hidden="true"></span>
                  <div class="relative flex items-center gap-2">
                    <span class="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-white/25 text-[10px] font-bold">
                      @if (c.logo) { <img [src]="c.logo" alt="" class="size-full object-cover"> } @else { {{ c.name[0] }} }
                    </span>
                    <span class="min-w-0 flex-1 truncate text-sm font-semibold">{{ c.name }}</span>
                    <span class="text-[9px] uppercase tracking-[0.2em] opacity-80">Gift card</span>
                  </div>
                  <p class="relative text-4xl font-extrabold tracking-[-0.03em] lg:text-5xl">{{ c.amount }}</p>
                  <p class="relative text-xs opacity-80">Para · <span class="font-semibold opacity-100">{{ c.to }}</span></p>
                </div>
              </div>
            </div>
          }

          <!-- lo que pasa del otro lado: una venta que entra -->
          <div class="toast-loop absolute -top-3 right-0 z-10 flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100/95 p-3 pr-4 shadow-xl backdrop-blur sm:right-4 lg:-right-4 lg:top-2">
            <span class="grid size-9 place-items-center rounded-xl bg-success/15 text-lg">💸</span>
            <div>
              <p class="text-sm font-bold">Nueva venta · Bs 250</p>
              <p class="text-xs text-base-content/55">Spa Aurora · hace un momento</p>
            </div>
          </div>

          <div class="chip-float absolute -bottom-2 left-0 z-10 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-xl sm:left-4 lg:-left-2">
            <p class="text-[10px] uppercase tracking-wider text-base-content/45">Canje registrado</p>
            <p class="text-lg font-extrabold tabular-nums">−Bs 120</p>
            <p class="text-[11px] text-base-content/55">quedan Bs 130</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── rubros en marquesina ────────────────────────────── -->
    <section class="border-y border-base-300 bg-base-200/60 py-6">
      <p class="text-center text-xs uppercase tracking-wider text-base-content/45">Pensado para negocios de todo tipo</p>
      <div class="marquee-mask mt-4 overflow-hidden">
        <ul class="marquee">
          @for (r of rubrosX2; track $index) {
            <li class="flex items-center gap-8 pr-8 text-lg font-semibold tracking-tight text-base-content/55">
              {{ r }} <span class="text-primary/60">✦</span>
            </li>
          }
        </ul>
      </div>
    </section>

    <!-- ── cómo funciona ───────────────────────────────────── -->
    <section id="como-funciona" class="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
      <div reveal class="mx-auto max-w-2xl text-center">
        <p class="text-sm font-semibold text-[#c2410c]">Cómo funciona</p>
        <h2 class="mt-2 text-4xl font-extrabold tracking-[-0.04em] text-balance sm:text-5xl">De cero a vender en tres pasos</h2>
      </div>

      <ol class="relative mt-14 grid gap-5 md:grid-cols-3">
        <!-- la línea que une los pasos, solo en escritorio -->
        <span class="absolute left-[16%] right-[16%] top-9 hidden border-t-2 border-dashed border-primary/30 md:block" aria-hidden="true"></span>
        @for (p of pasos; track p.t; let i = $index) {
          <li [reveal]="i + 1" class="relative rounded-3xl border border-base-300 bg-base-100 p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <span class="grid size-12 place-items-center rounded-2xl bg-primary text-xl font-extrabold text-primary-content shadow-lg shadow-primary/30">{{ i + 1 }}</span>
            <h3 class="mt-5 text-xl font-bold tracking-tight">{{ p.t }}</h3>
            <p class="mt-2 text-base-content/65">{{ p.d }}</p>
          </li>
        }
      </ol>
    </section>

    <!-- ── beneficios: bento oscuro ────────────────────────── -->
    <section id="beneficios" class="scroll-mt-16 bg-neutral py-20 text-neutral-content lg:py-28">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div reveal class="max-w-2xl">
          <p class="text-sm font-semibold text-primary">Todo incluido</p>
          <h2 class="mt-2 text-4xl font-extrabold tracking-[-0.04em] text-balance sm:text-5xl">
            Vendes antes, cobras antes, <span class="text-primary">controlas todo</span>.
          </h2>
        </div>

        <div class="mt-12 grid gap-4 md:grid-cols-6">
          <!-- tu marca -->
          <article reveal="1" class="rounded-3xl bg-white/[0.06] p-7 ring-1 ring-white/10 md:col-span-4">
            <div class="flex flex-wrap items-center gap-8">
              <div class="min-w-0 flex-1">
                <h3 class="text-2xl font-bold tracking-tight">Tu marca, tus colores</h3>
                <p class="mt-2 max-w-sm text-neutral-content/65">Tu logo y tu color en la página y en cada gift card. Nada de plantillas genéricas.</p>
              </div>
              <div class="swatch-cycle relative aspect-[1.586] w-56 overflow-hidden rounded-2xl p-4 shadow-2xl transition-colors">
                <span class="absolute -right-8 -top-8 size-28 rounded-full bg-white/15"></span>
                <p class="relative text-[10px] uppercase tracking-[0.2em] text-white/80">Gift card</p>
                <p class="relative mt-6 text-3xl font-extrabold text-white">Bs 200</p>
              </div>
            </div>
          </article>

          <!-- cobro por QR -->
          <article reveal="2" class="rounded-3xl bg-white/[0.06] p-7 ring-1 ring-white/10 md:col-span-2">
            <div class="relative mx-auto size-24 rounded-2xl bg-white p-2.5">
              <div class="grid size-full grid-cols-5 grid-rows-5 gap-0.5">
                @for (q of qr; track $index) { <span [class.bg-neutral]="q" class="rounded-[2px]"></span> }
              </div>
              <span class="scanline absolute inset-x-1 h-0.5 rounded-full bg-primary shadow-[0_0_12px_2px] shadow-primary"></span>
            </div>
            <h3 class="mt-6 text-xl font-bold tracking-tight">Canje en segundos</h3>
            <p class="mt-2 text-neutral-content/65">Escaneas el QR desde el celular y listo. También con el código.</p>
          </article>

          <!-- deuda / control -->
          <article reveal="3" class="rounded-3xl bg-white/[0.06] p-7 ring-1 ring-white/10 md:col-span-3">
            <p class="text-sm text-neutral-content/55">Gift cards vivas</p>
            <p class="text-4xl font-extrabold tracking-[-0.03em] text-primary">Bs 1.650</p>
            <svg viewBox="0 0 300 80" class="mt-4 h-20 w-full" fill="none" aria-hidden="true">
              <path class="draw-loop text-primary" d="M4 70 L50 58 L96 62 L142 36 L188 44 L234 18 L296 10"
                    stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h3 class="mt-3 text-xl font-bold tracking-tight">Sabes cuánto debes</h3>
            <p class="mt-2 text-neutral-content/65">Lo vendido, lo canjeado y lo que falta entregar, siempre a la vista.</p>
          </article>

          <!-- entrega -->
          <article reveal="4" class="rounded-3xl bg-white/[0.06] p-7 ring-1 ring-white/10 md:col-span-3">
            <div class="flex min-h-24 flex-col items-end justify-center gap-2">
              <div class="bubble-loop max-w-[85%] rounded-2xl rounded-br-md bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white shadow-lg">
                ¡Te regalé una gift card de Spa Aurora! 🎁
              </div>
              <p class="text-[11px] text-neutral-content/40">entregado ✓✓</p>
            </div>
            <h3 class="mt-3 text-xl font-bold tracking-tight">El regalo llega al instante</h3>
            <p class="mt-2 text-neutral-content/65">Por WhatsApp o correo, con su diseño y su QR. Sin imprimir nada.</p>
          </article>
        </div>

        <dl reveal class="mt-14 grid grid-cols-3 gap-4 border-t border-white/10 pt-10 text-center">
          @for (n of numeros; track n.k) {
            <div>
              <dt class="text-3xl font-extrabold tracking-[-0.03em] text-primary sm:text-4xl">{{ n.k }}</dt>
              <dd class="mt-1.5 text-sm text-neutral-content/60">{{ n.v }}</dd>
            </div>
          }
        </dl>
      </div>
    </section>

    <!-- ── cierre ──────────────────────────────────────────── -->
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" aria-hidden="true"></div>
      <div reveal class="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h2 class="text-4xl font-extrabold tracking-[-0.04em] text-balance sm:text-6xl">
          ¿Arrancamos? <span class="text-primary">Son diez minutos.</span>
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-lg text-base-content/65">
          Tu marca, tus montos y listo. Después compartes el link y empiezas a vender.
        </p>
        <a routerLink="/onboarding" class="btn btn-lg btn-primary group mt-9 rounded-full px-8 shadow-xl shadow-primary/30">
          Crear mi comercio
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="size-5 transition-transform group-hover:translate-x-1">
            <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
    </section>

    <footer class="border-t border-base-300">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-7 text-sm text-base-content/45 sm:px-6">
        <app-wordmark />
        <p>Gift cards para negocios en Bolivia.</p>
      </div>
    </footer>
  </div>
  `,
})
export class Landing {
  readonly fan = FAN;
  /** Duplicada: la marquesina se desplaza la mitad y vuelve a empezar sin salto. */
  readonly rubrosX2 = [...RUBROS, ...RUBROS];
  readonly verificados = ['Sin instalar nada', 'Tu propio link', 'Cobras por QR'];
  readonly pasos = [
    { t: 'Crea tu página', d: 'Tu logo, tu color y los montos que quieres vender. En unos diez minutos.' },
    { t: 'Comparte tu link', d: 'Por WhatsApp, Instagram o un QR en el mostrador. Tus clientes compran solos.' },
    { t: 'Cobra y canjea', d: 'Te pagan por adelantado. Canjeas desde el celular escaneando el QR.' },
  ];
  readonly numeros = [
    { k: '10 min', v: 'y tu página está lista' },
    { k: '0 apps', v: 'que instalar' },
    { k: '24/7', v: 'tu página vendiendo' },
  ];
  /** Un QR de juguete para el bento (5×5), no codifica nada. */
  readonly qr = [1,1,1,0,1, 1,0,1,1,0, 1,1,1,0,1, 0,1,0,1,1, 1,0,1,1,1].map(Boolean);
}
