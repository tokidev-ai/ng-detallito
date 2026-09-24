import { Component, computed, inject, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Firestore, collection, collectionGroup, doc, getDocs, query, updateDoc } from '@angular/fire/firestore';
import { GiftCard, Tenant } from '../data';
import { AuthService } from '../auth';
import { Wordmark } from '../brand';
import { BsPipe, FechaPipe } from '../ui';
import { Cobro, DEFAULT_RATE, lastMonths, rateOf, toCobro, toCsv, totals } from './ledger';

type Section = 'resumen' | 'comercios' | 'cobros' | 'liquidaciones';
const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'resumen',       label: 'Resumen',        icon: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 4v4h6V4z' },
  { id: 'comercios',     label: 'Comercios',      icon: 'M3 9l1.5-5h15L21 9M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 13v7h14v-7' },
  { id: 'cobros',        label: 'Cobros',         icon: 'M3 7h18v10H3zM3 11h18M8 15h3' },
  { id: 'liquidaciones', label: 'Liquidaciones',  icon: 'M12 3v18M17 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H6' },
];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const PAD = 6;

/** Panel de la startup. Distinto del panel del comercio: aquí vemos TODOS los
 *  comercios, cada venta (cobro) y lo que nos toca de comisión, negociada por
 *  comercio. Los números salen de las gift cards (la fuente de verdad), no de
 *  los contadores del tenant. */
@Component({
  selector: 'app-admin-panel',
  imports: [RouterLink, FormsModule, Wordmark, BsPipe, FechaPipe],
  template: `
  <div class="min-h-dvh bg-base-200 md:flex">

    <!-- ── sidebar ── -->
    <aside class="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-base-300 bg-base-100 md:flex">
      <div class="flex items-center gap-2 px-6 pb-6 pt-6">
        <a routerLink="/"><app-wordmark /></a>
        <span class="rounded-full bg-neutral px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-content">Interno</span>
      </div>
      <nav class="flex-1 space-y-1 px-4">
        <p class="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-base-content/40">Plataforma</p>
        @for (s of sections; track s.id) {
          <button type="button" class="nav-item w-full" [class.nav-active]="section() === s.id" (click)="section.set(s.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5"><path [attr.d]="s.icon" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ s.label }}
            @if (s.id === 'comercios' && alertCount()) {
              <span class="ms-auto rounded-full bg-warning/15 px-2 text-xs font-bold text-warning">{{ alertCount() }}</span>
            }
          </button>
        }
        <a routerLink="/app" class="nav-item mt-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5"><path d="M15 12H4M8 8l-4 4 4 4M13 4h6a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Mi panel de comercio
        </a>
      </nav>
      <div class="m-4 flex items-center gap-3 rounded-2xl bg-base-200 p-3">
        <span class="grid size-9 shrink-0 place-items-center rounded-full bg-neutral text-sm font-bold uppercase text-neutral-content">{{ me()[0] }}</span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold">{{ me() }}</p>
          <p class="text-xs text-base-content/50">Superadmin</p>
        </div>
        <button type="button" class="btn btn-ghost btn-sm btn-square" aria-label="Salir" title="Salir" (click)="salir()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5"><path d="M15 12H4M8 8l-4 4 4 4M13 4h6a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </aside>

    <div class="min-w-0 flex-1">
      <!-- ── barra superior ── -->
      <header class="sticky top-0 z-30 border-b border-base-300 bg-base-100/80 backdrop-blur-xl">
        <div class="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-8 md:py-4">
          <div class="flex items-center gap-2 md:hidden">
            <app-wordmark />
            <span class="rounded-full bg-neutral px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-content">Interno</span>
          </div>
          <h1 class="hidden flex-1 text-xl font-bold tracking-tight md:block">{{ current().label }}</h1>
          <span class="flex-1 md:hidden"></span>
          <button type="button" class="btn btn-sm rounded-full border-base-300 bg-base-100" (click)="reload()" [disabled]="loading()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4" [class.animate-spin]="loading()"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span class="hidden sm:inline">Actualizar</span>
          </button>
        </div>
        <!-- móvil: secciones como pestañas deslizables -->
        <div class="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden">
          @for (s of sections; track s.id) {
            <button type="button" class="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition"
                    [class]="section() === s.id ? 'bg-neutral text-neutral-content' : 'bg-base-200 text-base-content/65'"
                    (click)="section.set(s.id)">{{ s.label }}</button>
          }
        </div>
      </header>

      <main class="mx-auto max-w-7xl p-4 md:p-8">
        @if (loading() && !tenantsList().length) {
          <div class="grid place-items-center py-32"><span class="loading loading-spinner loading-lg text-primary"></span></div>
        } @else if (failed()) {
          <div class="rounded-box border border-base-300 bg-base-100 p-10 text-center">
            <p class="font-semibold text-error">No pudimos leer los datos de la plataforma.</p>
            <p class="mt-1 text-sm text-base-content/55">
              Las reglas solo dejan leer todo a un superadmin. Otórgalo con
              <code class="font-mono">npm run superadmin -- tu&#64;mail.com</code>.
            </p>
            <button type="button" class="btn btn-outline btn-sm mt-4" (click)="reload()">Reintentar</button>
          </div>
        } @else {
          @switch (section()) {

            <!-- ════════════════ RESUMEN ════════════════ -->
            @case ('resumen') {
              <div class="space-y-6">
                <div class="reveal">
                  <p class="text-sm text-base-content/50 first-letter:uppercase">{{ monthLabel(thisMonth) }}</p>
                  <h2 class="mt-0.5 text-2xl font-extrabold tracking-tight sm:text-3xl">Así va la plataforma 🚀</h2>
                </div>

                <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <article class="reveal reveal-1 col-span-2 rounded-box bg-neutral p-5 text-neutral-content lg:col-span-1">
                    <div class="flex items-center justify-between">
                      <p class="text-sm text-neutral-content/65">Nuestros ingresos del mes</p>
                      <span class="grid size-8 place-items-center rounded-xl bg-primary/20 text-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M12 3v18M17 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H6" stroke-linecap="round"/></svg>
                      </span>
                    </div>
                    <p class="mt-3 text-3xl font-extrabold tracking-[-0.03em] tabular-nums">{{ month().fee | bs:2 }}</p>
                    <p class="mt-1 text-xs text-neutral-content/55">comisión sobre {{ month().gross | bs }} vendidos</p>
                  </article>

                  <article class="reveal reveal-2 rounded-box border border-base-300 bg-base-100 p-5">
                    <p class="text-sm text-base-content/55">Vendido del mes</p>
                    <p class="mt-3 text-2xl font-extrabold tracking-[-0.03em] tabular-nums">{{ month().gross | bs }}</p>
                    @if (gmvDelta() !== null) {
                      <p class="mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                         [class]="gmvDelta()! >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'">
                        {{ gmvDelta()! >= 0 ? '↑' : '↓' }} {{ abs(gmvDelta()!) }}% vs mes anterior
                      </p>
                    } @else { <p class="mt-1 text-xs text-base-content/45">sin mes anterior para comparar</p> }
                  </article>

                  <article class="reveal reveal-3 rounded-box border border-base-300 bg-base-100 p-5">
                    <p class="text-sm text-base-content/55">Gift cards vendidas</p>
                    <p class="mt-3 text-2xl font-extrabold tracking-[-0.03em] tabular-nums">{{ month().count }}</p>
                    <p class="mt-1 text-xs text-base-content/45">ticket promedio {{ avgTicket() | bs }}</p>
                  </article>

                  <article class="reveal reveal-4 col-span-2 rounded-box border border-base-300 bg-base-100 p-5 lg:col-span-1">
                    <p class="text-sm text-base-content/55">Comercios</p>
                    <p class="mt-3 text-2xl font-extrabold tracking-[-0.03em] tabular-nums">{{ published() }} <span class="text-base font-semibold text-base-content/40">/ {{ tenantsList().length }}</span></p>
                    <p class="mt-1 text-xs text-base-content/45">publicados · {{ sellingThisMonth() }} vendieron este mes</p>
                  </article>
                </div>

                <div class="grid gap-4 lg:grid-cols-3">
                  <!-- evolución -->
                  <section class="reveal reveal-2 rounded-box border border-base-300 bg-base-100 p-5 sm:p-6 lg:col-span-2">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 class="font-bold">Ventas de la plataforma</h3>
                        <p class="text-sm text-base-content/50">Últimos 6 meses · nuestra comisión {{ fee6() | bs }}</p>
                      </div>
                    </div>
                    <div class="relative mt-6 h-52" (mouseleave)="hovered.set(-1)">
                      <div class="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">
                        @for (g of [0, 1, 2, 3]; track g) { <span class="border-t border-dashed border-base-300"></span> }
                      </div>
                      <svg class="chart-reveal absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path [attr.d]="area()" class="fill-primary" opacity="0.08" />
                        <path [attr.d]="line()" fill="none" class="stroke-primary" stroke-width="2.5"
                              stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
                      </svg>
                      @if (hovered() >= 0) {
                        <span class="pointer-events-none absolute inset-y-0 border-l border-base-content/20" [style.left.%]="pts()[hovered()].x"></span>
                      }
                      @for (p of pts(); track $index) {
                        <span class="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-base-100 bg-primary transition-transform"
                              [class.scale-150]="hovered() === $index" [style.left.%]="p.x" [style.top.%]="p.y"></span>
                        <div class="absolute inset-y-0 -translate-x-1/2" [style.left.%]="p.x" [style.width.%]="colW()" (mouseenter)="hovered.set($index)"></div>
                      }
                      @if (hovered() >= 0) {
                        <div class="pointer-events-none absolute top-0 z-10 w-40 -translate-x-1/2 -translate-y-2 rounded-xl border border-base-300 bg-base-100 p-2.5 text-xs shadow-xl"
                             [style.left.%]="pts()[hovered()].x">
                          <p class="font-semibold first-letter:uppercase">{{ monthLabel(months6[hovered()]) }}</p>
                          <p class="mt-1 flex justify-between"><span class="text-base-content/55">Vendido</span><span class="font-semibold tabular-nums">{{ pts()[hovered()].t.gross | bs }}</span></p>
                          <p class="flex justify-between"><span class="text-base-content/55">Comisión</span><span class="font-semibold tabular-nums text-[#c2410c]">{{ pts()[hovered()].t.fee | bs:2 }}</span></p>
                          <p class="flex justify-between"><span class="text-base-content/55">Cobros</span><span class="font-semibold tabular-nums">{{ pts()[hovered()].t.count }}</span></p>
                        </div>
                      }
                    </div>
                    <div class="relative mt-2 h-4">
                      @for (p of pts(); track $index) {
                        <span class="absolute -translate-x-1/2 text-xs text-base-content/50" [style.left.%]="p.x"
                              [class.font-semibold]="hovered() === $index">{{ monthLabel(months6[$index]).slice(0, 3) }}</span>
                      }
                    </div>
                  </section>

                  <!-- salud -->
                  <section class="reveal reveal-3 rounded-box border border-base-300 bg-base-100 p-5 sm:p-6">
                    <h3 class="font-bold">Salud de la plataforma</h3>
                    <dl class="mt-4 space-y-4">
                      <div>
                        <dt class="text-sm text-base-content/55">Saldo vivo sin canjear</dt>
                        <dd class="text-xl font-extrabold tabular-nums">{{ liveDebt() | bs }}</dd>
                        <p class="text-xs text-base-content/45">lo que los comercios todavía deben entregar</p>
                      </div>
                      <div>
                        <div class="flex items-baseline justify-between">
                          <dt class="text-sm text-base-content/55">Tasa de canje</dt>
                          <dd class="font-bold tabular-nums">{{ redeemRate() }}%</dd>
                        </div>
                        <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-base-200">
                          <div class="h-full rounded-full bg-success transition-all duration-700" [style.width.%]="redeemRate()"></div>
                        </div>
                      </div>
                      <div>
                        <div class="flex items-baseline justify-between">
                          <dt class="text-sm text-base-content/55">Ventas por la página (QR)</dt>
                          <dd class="font-bold tabular-nums">{{ qrShare() }}%</dd>
                        </div>
                        <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-base-200">
                          <div class="h-full rounded-full bg-primary transition-all duration-700" [style.width.%]="qrShare()"></div>
                        </div>
                        <p class="mt-1 text-xs text-base-content/45">el resto las carga el comercio desde su panel</p>
                      </div>
                    </dl>
                  </section>
                </div>

                <div class="grid gap-4 lg:grid-cols-2">
                  <!-- ranking -->
                  <section class="reveal reveal-3 rounded-box border border-base-300 bg-base-100 p-5 sm:p-6">
                    <h3 class="font-bold">Top comercios del mes</h3>
                    <p class="text-sm text-base-content/50">Por monto vendido</p>
                    <ol class="mt-4 space-y-3">
                      @for (r of ranking(); track r.t.id; let i = $index) {
                        <li>
                          <button type="button" class="w-full text-left" (click)="openTenant(r.t.id)">
                            <div class="flex items-center gap-3 text-sm">
                              <span class="w-4 text-xs font-bold text-base-content/40">{{ i + 1 }}</span>
                              <span class="size-2.5 rounded-full" [style.background-color]="r.t.business.color"></span>
                              <span class="min-w-0 flex-1 truncate font-semibold">{{ r.t.business.name }}</span>
                              <span class="font-bold tabular-nums">{{ r.gross | bs }}</span>
                            </div>
                            <div class="ml-7 mt-1.5 h-1.5 overflow-hidden rounded-full bg-base-200">
                              <div class="h-full rounded-full transition-all duration-700" [style.width.%]="r.pct" [style.background-color]="r.t.business.color"></div>
                            </div>
                          </button>
                        </li>
                      } @empty {
                        <li class="py-6 text-center text-sm text-base-content/45">Ninguna venta este mes todavía.</li>
                      }
                    </ol>
                  </section>

                  <!-- alertas -->
                  <section class="reveal reveal-4 rounded-box border border-base-300 bg-base-100 p-5 sm:p-6">
                    <h3 class="font-bold">Para hacer seguimiento</h3>
                    <p class="text-sm text-base-content/50">Comercios que necesitan una mano</p>
                    <ul class="mt-4 divide-y divide-base-200">
                      @for (a of alerts(); track a.t.id + a.kind) {
                        <li>
                          <button type="button" class="flex w-full items-center gap-3 py-3 text-left" (click)="openTenant(a.t.id)">
                            <span class="grid size-9 shrink-0 place-items-center rounded-xl text-base" [class]="a.bg">{{ a.icon }}</span>
                            <div class="min-w-0 flex-1">
                              <p class="truncate text-sm font-semibold">{{ a.t.business.name }}</p>
                              <p class="text-xs text-base-content/55">{{ a.text }}</p>
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4 text-base-content/30"><path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                          </button>
                        </li>
                      } @empty {
                        <li class="py-6 text-center text-sm text-base-content/45">Todo en orden 👌</li>
                      }
                    </ul>
                  </section>
                </div>
              </div>
            }

            <!-- ════════════════ COMERCIOS ════════════════ -->
            @case ('comercios') {
              <div class="reveal flex flex-wrap items-center gap-2">
                <label class="relative min-w-0 flex-1 sm:max-w-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" stroke-linecap="round"/></svg>
                  <input class="input input-bordered w-full rounded-full ps-9" [(ngModel)]="tq" name="tq" placeholder="Buscar por nombre, link o correo">
                </label>
                <div class="join">
                  @for (f of tenantFilters; track f.id) {
                    <button type="button" class="btn join-item btn-sm" [class.btn-neutral]="tFilter() === f.id" (click)="tFilter.set(f.id)">{{ f.label }}</button>
                  }
                </div>
                <select class="select select-bordered select-sm rounded-full" [(ngModel)]="tSort" name="tSort">
                  <option value="ventas">Más ventas del mes</option>
                  <option value="nombre">Nombre</option>
                  <option value="comision">Mayor comisión</option>
                  <option value="deuda">Más saldo vivo</option>
                </select>
              </div>

              <p class="mt-4 text-sm text-base-content/50">{{ tenantRows().length }} comercios</p>

              <div class="reveal reveal-1 mt-2 hidden overflow-x-auto rounded-box border border-base-300 bg-base-100 lg:block">
                <table class="table">
                  <thead>
                    <tr class="text-xs uppercase tracking-wider">
                      <th>Comercio</th><th>Dueño</th><th>Estado</th><th class="text-right">Vendido mes</th>
                      <th class="text-right">Comisión</th><th class="text-right">Nos toca</th><th class="text-right">Saldo vivo</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of tenantRows(); track r.t.id) {
                      <tr class="cursor-pointer transition hover:bg-base-200/60" (click)="openTenant(r.t.id)">
                        <td>
                          <div class="flex items-center gap-3">
                            <span class="grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold" [style.background-color]="r.t.business.color" style="color:#fff">{{ r.t.business.name[0] }}</span>
                            <div class="min-w-0">
                              <p class="truncate font-semibold">{{ r.t.business.name }}</p>
                              <p class="font-mono text-xs text-base-content/45">/{{ r.t.business.slug }}</p>
                            </div>
                          </div>
                        </td>
                        <td class="max-w-48 truncate text-sm text-base-content/65">{{ owner(r.t) }}</td>
                        <td>
                          <span class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                                [class]="r.t.business.published ? 'bg-success/10 text-success' : 'bg-base-200 text-base-content/60'">
                            <span class="size-1.5 rounded-full" [class]="r.t.business.published ? 'bg-success' : 'bg-base-content/40'"></span>
                            {{ r.t.business.published ? 'Publicada' : 'Borrador' }}
                          </span>
                        </td>
                        <td class="text-right font-semibold tabular-nums">{{ r.month.gross | bs }}</td>
                        <td class="text-right tabular-nums">
                          {{ pct(r.rate) }}
                          @if (r.t.commissionRate === undefined) { <span class="text-xs text-base-content/40">(def.)</span> }
                        </td>
                        <td class="text-right font-semibold tabular-nums text-[#c2410c]">{{ r.month.fee | bs:2 }}</td>
                        <td class="text-right tabular-nums text-base-content/65">{{ r.debt | bs }}</td>
                        <td class="text-right">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline size-4 text-base-content/30"><path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </td>
                      </tr>
                    } @empty {
                      <tr><td colspan="8" class="py-12 text-center text-base-content/45">Ningún comercio coincide.</td></tr>
                    }
                  </tbody>
                </table>
              </div>

              <ul class="mt-2 space-y-2 lg:hidden">
                @for (r of tenantRows(); track r.t.id) {
                  <li>
                    <button type="button" class="w-full rounded-box border border-base-300 bg-base-100 p-4 text-left" (click)="openTenant(r.t.id)">
                      <div class="flex items-center gap-3">
                        <span class="grid size-10 shrink-0 place-items-center rounded-xl font-bold text-white" [style.background-color]="r.t.business.color">{{ r.t.business.name[0] }}</span>
                        <div class="min-w-0 flex-1">
                          <p class="truncate font-semibold">{{ r.t.business.name }}</p>
                          <p class="text-xs text-base-content/50">{{ r.t.business.published ? 'Publicada' : 'Borrador' }} · comisión {{ pct(r.rate) }}</p>
                        </div>
                      </div>
                      <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div class="rounded-xl bg-base-200 p-2.5"><p class="text-xs text-base-content/50">Vendido mes</p><p class="font-bold tabular-nums">{{ r.month.gross | bs }}</p></div>
                        <div class="rounded-xl bg-base-200 p-2.5"><p class="text-xs text-base-content/50">Nos toca</p><p class="font-bold tabular-nums text-[#c2410c]">{{ r.month.fee | bs:2 }}</p></div>
                      </div>
                    </button>
                  </li>
                }
              </ul>
            }

            <!-- ════════════════ COBROS ════════════════ -->
            @case ('cobros') {
              <div class="reveal space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <label class="relative min-w-0 flex-1 sm:max-w-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" stroke-linecap="round"/></svg>
                    <input class="input input-bordered w-full rounded-full ps-9" [(ngModel)]="cq" name="cq" placeholder="Código, destinatario o comercio">
                  </label>
                  <select class="select select-bordered select-sm rounded-full" [(ngModel)]="cTenant" name="cTenant">
                    <option value="">Todos los comercios</option>
                    @for (t of tenantsByName(); track t.id) { <option [value]="t.id">{{ t.business.name }}</option> }
                  </select>
                  <select class="select select-bordered select-sm rounded-full" [(ngModel)]="cState" name="cState">
                    <option value="">Cualquier estado</option>
                    <option value="activa">Activas</option>
                    <option value="canjeada">Canjeadas</option>
                    <option value="vencida">Vencidas</option>
                  </select>
                  <select class="select select-bordered select-sm rounded-full" [(ngModel)]="cChannel" name="cChannel">
                    <option value="">Cualquier canal</option>
                    <option value="qr">Página (QR)</option>
                    <option value="panel">Panel del comercio</option>
                  </select>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  @for (r of ranges; track r.id) {
                    <button type="button" class="rounded-full px-3 py-1.5 text-sm font-medium transition"
                            [class]="cRange() === r.id ? 'bg-neutral text-neutral-content' : 'bg-base-100 text-base-content/65 ring-1 ring-base-300'"
                            (click)="setRange(r.id)">{{ r.label }}</button>
                  }
                  <span class="mx-1 hidden h-5 border-l border-base-300 sm:block"></span>
                  <input type="date" class="input input-bordered input-sm rounded-full" [ngModel]="cFrom()" (ngModelChange)="cFrom.set($event); cRange.set('custom')" name="cFrom" aria-label="Desde">
                  <span class="text-sm text-base-content/40">a</span>
                  <input type="date" class="input input-bordered input-sm rounded-full" [ngModel]="cTo()" (ngModelChange)="cTo.set($event); cRange.set('custom')" name="cTo" aria-label="Hasta">
                  <button type="button" class="btn btn-sm ms-auto rounded-full border-base-300 bg-base-100" (click)="exportCobros()" [disabled]="!cobrosFiltered().length">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    Exportar CSV
                  </button>
                </div>
              </div>

              <!-- totales del filtro -->
              <div class="reveal reveal-1 mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div class="rounded-box border border-base-300 bg-base-100 p-4"><p class="text-xs text-base-content/50">Cobros</p><p class="text-xl font-extrabold tabular-nums">{{ cobrosTotals().count }}</p></div>
                <div class="rounded-box border border-base-300 bg-base-100 p-4"><p class="text-xs text-base-content/50">Bruto</p><p class="text-xl font-extrabold tabular-nums">{{ cobrosTotals().gross | bs }}</p></div>
                <div class="rounded-box bg-neutral p-4 text-neutral-content"><p class="text-xs text-neutral-content/60">Nuestra comisión</p><p class="text-xl font-extrabold tabular-nums">{{ cobrosTotals().fee | bs:2 }}</p></div>
                <div class="rounded-box border border-base-300 bg-base-100 p-4"><p class="text-xs text-base-content/50">Neto a comercios</p><p class="text-xl font-extrabold tabular-nums">{{ cobrosTotals().net | bs:2 }}</p></div>
              </div>

              <div class="reveal reveal-2 mt-4 overflow-x-auto rounded-box border border-base-300 bg-base-100">
                <table class="table">
                  <thead>
                    <tr class="text-xs uppercase tracking-wider">
                      <th>Fecha</th><th>Comercio</th><th>Código</th><th>Para</th><th>Canal</th><th>Estado</th>
                      <th class="text-right">Monto</th><th class="text-right">Comisión</th><th class="text-right">Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (c of cobrosPage(); track c.tenantId + c.code) {
                      <tr class="hover:bg-base-200/60">
                        <td class="whitespace-nowrap tabular-nums text-base-content/70">
                          {{ c.date | fecha }}
                          @if (c.estimated) { <span class="text-base-content/35" title="Fecha deducida del vencimiento (carta anterior al registro de fecha)">~</span> }
                        </td>
                        <td>
                          <button type="button" class="flex items-center gap-2 font-medium hover:underline" (click)="openTenant(c.tenantId)">
                            <span class="size-2.5 shrink-0 rounded-full" [style.background-color]="c.color"></span>{{ c.tenant }}
                          </button>
                        </td>
                        <td class="font-mono text-sm">{{ c.code }}</td>
                        <td class="max-w-36 truncate">{{ c.to }}</td>
                        <td class="text-sm text-base-content/60">{{ c.channel === 'qr' ? 'Página' : c.channel === 'panel' ? 'Panel' : '—' }}</td>
                        <td>
                          <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                                [class]="c.state === 'activa' ? 'bg-success/10 text-success' : c.state === 'vencida' ? 'bg-error/10 text-error' : 'bg-base-200 text-base-content/60'">{{ c.state }}</span>
                        </td>
                        <td class="text-right font-semibold tabular-nums">{{ c.value | bs }}</td>
                        <td class="whitespace-nowrap text-right tabular-nums text-[#c2410c]">{{ c.fee | bs:2 }} <span class="text-xs text-base-content/40">{{ pct(c.rate) }}</span></td>
                        <td class="text-right tabular-nums">{{ c.net | bs:2 }}</td>
                      </tr>
                    } @empty {
                      <tr><td colspan="9" class="py-12 text-center text-base-content/45">Ningún cobro con estos filtros.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
              @if (cobrosFiltered().length > cobrosPage().length) {
                <div class="mt-4 text-center">
                  <button type="button" class="btn btn-sm rounded-full border-base-300 bg-base-100" (click)="cLimit.update(n => n + 50)">
                    Mostrar más ({{ cobrosFiltered().length - cobrosPage().length }} restantes)
                  </button>
                </div>
              }
            }

            <!-- ════════════════ LIQUIDACIONES ════════════════ -->
            @case ('liquidaciones') {
              <div class="reveal flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p class="max-w-xl text-sm text-base-content/60">
                    Lo que hay que transferirle a cada comercio por el mes: lo vendido menos nuestra comisión.
                    Es la planilla para la banca en línea.
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <select class="select select-bordered select-sm rounded-full" [(ngModel)]="lMonth" name="lMonth">
                    @for (m of months6Desc; track m) { <option [value]="m">{{ monthLabel(m) }}</option> }
                  </select>
                  <button type="button" class="btn btn-primary btn-sm rounded-full" (click)="exportLiquidacion()" [disabled]="!liquidacion().length">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    Planilla CSV
                  </button>
                </div>
              </div>

              <div class="reveal reveal-1 mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div class="rounded-box border border-base-300 bg-base-100 p-4"><p class="text-xs text-base-content/50">Comercios a pagar</p><p class="text-xl font-extrabold tabular-nums">{{ liquidacion().length }}</p></div>
                <div class="rounded-box border border-base-300 bg-base-100 p-4"><p class="text-xs text-base-content/50">Bruto del mes</p><p class="text-xl font-extrabold tabular-nums">{{ liqTotals().gross | bs }}</p></div>
                <div class="rounded-box bg-neutral p-4 text-neutral-content"><p class="text-xs text-neutral-content/60">Nos quedamos</p><p class="text-xl font-extrabold tabular-nums">{{ liqTotals().fee | bs:2 }}</p></div>
                <div class="rounded-box border border-base-300 bg-base-100 p-4"><p class="text-xs text-base-content/50">A transferir</p><p class="text-xl font-extrabold tabular-nums">{{ liqTotals().net | bs:2 }}</p></div>
              </div>

              <div class="reveal reveal-2 mt-4 overflow-x-auto rounded-box border border-base-300 bg-base-100">
                <table class="table">
                  <thead>
                    <tr class="text-xs uppercase tracking-wider">
                      <th>Comercio</th><th class="text-right">Cobros</th><th class="text-right">Bruto</th><th class="text-right">Comisión</th>
                      <th class="text-right">A transferir</th><th>Cuenta destino</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (l of liquidacion(); track l.t.id) {
                      <tr>
                        <td>
                          <button type="button" class="flex items-center gap-2 font-semibold hover:underline" (click)="openTenant(l.t.id)">
                            <span class="size-2.5 rounded-full" [style.background-color]="l.t.business.color"></span>{{ l.t.business.name }}
                          </button>
                        </td>
                        <td class="text-right tabular-nums">{{ l.tot.count }}</td>
                        <td class="text-right tabular-nums">{{ l.tot.gross | bs }}</td>
                        <td class="whitespace-nowrap text-right tabular-nums text-[#c2410c]">{{ l.tot.fee | bs:2 }} <span class="text-xs text-base-content/40">{{ pct(l.rate) }}</span></td>
                        <td class="text-right text-base font-extrabold tabular-nums">{{ l.tot.net | bs:2 }}</td>
                        <td class="text-sm">
                          @if (hasBank(l.t)) {
                            <p class="font-medium">{{ l.t.business.bank!.holder }}</p>
                            <p class="text-xs text-base-content/55">{{ l.t.business.bank!.bank }} · <span class="font-mono">{{ l.t.business.bank!.account }}</span></p>
                          } @else {
                            <span class="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">⚠ Sin datos bancarios</span>
                          }
                        </td>
                      </tr>
                    } @empty {
                      <tr><td colspan="6" class="py-12 text-center text-base-content/45">Ninguna venta en {{ monthLabel(lMonth()) }}.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
              <p class="mt-3 text-xs text-base-content/45">
                Todavía no registramos qué liquidaciones ya se pagaron: eso llega con la conexión al banco.
              </p>
            }
          }
        }
      </main>
    </div>
  </div>

  <!-- ── ficha de un comercio (panel lateral) ── -->
  @if (detail(); as d) {
    <div class="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Cerrar" class="absolute inset-0 bg-black/40" (click)="closeTenant()"></button>
      <aside class="drawer-in relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-base-100 shadow-2xl">
        <div class="storefront relative overflow-hidden p-6 text-white" [style.--c1]="d.t.business.color" style="background:linear-gradient(135deg,var(--c1),var(--c2))">
          <span class="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/15"></span>
          <button type="button" class="btn btn-ghost btn-sm btn-square absolute right-3 top-3 text-white" (click)="closeTenant()">✕</button>
          <p class="text-xs font-semibold uppercase tracking-wider text-white/70">{{ d.t.business.published ? 'Publicada' : 'Borrador' }}</p>
          <h3 class="mt-1 text-2xl font-extrabold tracking-tight">{{ d.t.business.name }}</h3>
          <p class="font-mono text-sm text-white/75">giftcards.bo/{{ d.t.business.slug }}</p>
          <div class="mt-4 flex gap-2">
            <a class="btn btn-sm rounded-full border-0 bg-white/20 text-white hover:bg-white/30" [href]="'/' + d.t.business.slug" target="_blank" rel="noopener">Ver página ↗</a>
          </div>
        </div>

        <div class="space-y-6 p-6">
          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-xl bg-base-200 p-3"><p class="text-xs text-base-content/50">Vendido este mes</p><p class="text-lg font-extrabold tabular-nums">{{ d.month.gross | bs }}</p></div>
            <div class="rounded-xl bg-base-200 p-3"><p class="text-xs text-base-content/50">Nos toca este mes</p><p class="text-lg font-extrabold tabular-nums text-[#c2410c]">{{ d.month.fee | bs:2 }}</p></div>
            <div class="rounded-xl bg-base-200 p-3"><p class="text-xs text-base-content/50">Vendido histórico</p><p class="text-lg font-extrabold tabular-nums">{{ d.all.gross | bs }}</p></div>
            <div class="rounded-xl bg-base-200 p-3"><p class="text-xs text-base-content/50">Saldo vivo</p><p class="text-lg font-extrabold tabular-nums">{{ d.debt | bs }}</p></div>
          </div>

          <!-- comisión negociada -->
          <section class="rounded-2xl border border-base-300 p-4">
            <div class="flex items-center justify-between">
              <h4 class="font-bold">Comisión negociada</h4>
              @if (d.t.commissionRate === undefined) { <span class="text-xs text-base-content/45">usa la de defecto ({{ pct(defaultRate) }})</span> }
            </div>
            <div class="mt-3 flex items-center gap-2">
              <label class="input input-bordered flex w-32 items-center gap-1 rounded-xl">
                <input type="number" min="0" max="50" step="0.1" class="w-full tabular-nums" [(ngModel)]="rateInput" name="rate">
                <span class="text-base-content/50">%</span>
              </label>
              <button type="button" class="btn btn-primary rounded-xl" (click)="saveRate(d.t)"
                      [disabled]="savingRate() || !rateValid() || rateUnchanged(d.t)">
                @if (savingRate()) { <span class="loading loading-spinner loading-xs"></span> } Guardar
              </button>
            </div>
            @if (!rateValid()) { <p class="mt-2 text-xs text-error">Entre 0% y 50%.</p> }
            @else {
              <p class="mt-2 text-xs text-base-content/55">
                Con {{ rateInput }}%, de lo vendido este mes nos quedaríamos {{ preview(d) | bs:2 }}.
              </p>
            }
            @if (rateSaved()) { <p class="mt-2 text-xs font-semibold text-success">✓ Comisión actualizada</p> }
            @if (rateError()) { <p class="mt-2 text-xs text-error">{{ rateError() }}</p> }
          </section>

          <!-- datos -->
          <section>
            <h4 class="font-bold">Datos</h4>
            <dl class="mt-2 divide-y divide-base-200 text-sm">
              <div class="flex justify-between gap-4 py-2"><dt class="text-base-content/55">Dueño</dt><dd class="truncate font-medium">{{ owner(d.t) }}</dd></div>
              <div class="flex justify-between gap-4 py-2"><dt class="text-base-content/55">Equipo</dt><dd>{{ d.t.memberEmails.length }} persona(s)</dd></div>
              <div class="flex justify-between gap-4 py-2"><dt class="text-base-content/55">Vigencia de cards</dt><dd>{{ d.t.business.validityMonths }} meses</dd></div>
              <div class="flex justify-between gap-4 py-2"><dt class="text-base-content/55">Monto libre</dt><dd>{{ d.t.business.allowCustomAmount === false ? 'No' : 'Sí' }}</dd></div>
              <div class="flex justify-between gap-4 py-2">
                <dt class="text-base-content/55">Cuenta</dt>
                <dd class="text-right">
                  @if (hasBank(d.t)) {
                    {{ d.t.business.bank!.bank }} · <span class="font-mono">{{ d.t.business.bank!.account }}</span><br>
                    <span class="text-xs text-base-content/55">{{ d.t.business.bank!.holder }} · NIT {{ d.t.business.bank!.nit || '—' }}</span>
                  } @else { <span class="font-semibold text-warning">⚠ Sin datos bancarios</span> }
                </dd>
              </div>
            </dl>
          </section>

          <!-- últimos cobros -->
          <section>
            <div class="flex items-center justify-between">
              <h4 class="font-bold">Últimos cobros</h4>
              <button type="button" class="text-sm font-semibold text-[#c2410c] hover:underline" (click)="seeCobros(d.t.id)">Ver todos →</button>
            </div>
            <ul class="mt-2 divide-y divide-base-200">
              @for (c of d.recent; track c.code) {
                <li class="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div class="min-w-0">
                    <p class="truncate font-medium">{{ c.to }}</p>
                    <p class="text-xs text-base-content/50">{{ c.date | fecha }} · <span class="font-mono">{{ c.code }}</span></p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold tabular-nums">{{ c.value | bs }}</p>
                    <p class="text-xs tabular-nums text-[#c2410c]">+{{ c.fee | bs:2 }}</p>
                  </div>
                </li>
              } @empty {
                <li class="py-6 text-center text-sm text-base-content/45">Todavía no vendió.</li>
              }
            </ul>
          </section>
        </div>
      </aside>
    </div>
  }
  `,
})
export class AdminPanel {
  private readonly db = inject(Firestore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly sections = SECTIONS;
  readonly section = signal<Section>('resumen');
  readonly current = computed(() => SECTIONS.find(s => s.id === this.section())!);
  readonly me = computed(() => (this.auth.user()?.email ?? '').split('@')[0] || '—');
  readonly abs = Math.abs;
  readonly defaultRate = DEFAULT_RATE;

  // ── datos: todos los comercios + todas las cards (collectionGroup) ──────────
  readonly tenants = resource({
    loader: async () => {
      const snap = await getDocs(query(collection(this.db, 'tenants')));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Tenant);
    },
  });
  /** ponytail: lee TODAS las cards al abrir el panel. Con unos miles va bien; si
   *  crece, esto pasa a agregados mensuales que mantenga una Cloud Function. */
  readonly cards = resource({
    loader: async () => {
      const snap = await getDocs(collectionGroup(this.db, 'cards'));
      return snap.docs.map(d => ({ tenantId: d.ref.parent.parent!.id, card: d.data() as GiftCard }));
    },
  });

  readonly loading = computed(() => this.tenants.isLoading() || this.cards.isLoading());
  readonly failed = computed(() => !!this.tenants.error() || !!this.cards.error());
  // value() lanza si el resource está en error: hasValue() primero.
  readonly tenantsList = computed(() => (this.tenants.hasValue() ? this.tenants.value() : []));
  private readonly tenantMap = computed(() => new Map(this.tenantsList().map(t => [t.id, t])));
  readonly tenantsByName = computed(() => [...this.tenantsList()].sort((a, b) => a.business.name.localeCompare(b.business.name)));

  /** Todas las ventas de la plataforma, la más nueva primero. */
  readonly cobros = computed<Cobro[]>(() => {
    const rows = this.cards.hasValue() ? this.cards.value() : [];
    return rows
      .map(r => { const t = this.tenantMap().get(r.tenantId); return t ? toCobro(t, r.card) : null; })
      .filter((c): c is Cobro => !!c)
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  reload() { this.tenants.reload(); this.cards.reload(); }

  // ── meses ──────────────────────────────────────────────────────────────────
  readonly months6 = lastMonths(6);
  readonly months6Desc = [...this.months6].reverse();
  readonly thisMonth = this.months6[5];
  monthLabel(ym: string) { const [y, m] = ym.split('-'); return `${MESES[+m - 1]} ${y}`; }
  private inMonth = (ym: string) => this.cobros().filter(c => c.date.startsWith(ym));

  // ── resumen ────────────────────────────────────────────────────────────────
  readonly month = computed(() => totals(this.inMonth(this.thisMonth)));
  readonly gmvDelta = computed(() => {
    const prev = totals(this.inMonth(this.months6[4])).gross;
    return prev ? Math.round(((this.month().gross - prev) / prev) * 100) : null;
  });
  readonly avgTicket = computed(() => (this.month().count ? this.month().gross / this.month().count : 0));
  readonly published = computed(() => this.tenantsList().filter(t => t.business.published).length);
  readonly sellingThisMonth = computed(() => new Set(this.inMonth(this.thisMonth).map(c => c.tenantId)).size);
  readonly liveDebt = computed(() => this.cobros().filter(c => c.state === 'activa').reduce((s, c) => s + c.balance, 0));
  readonly redeemRate = computed(() => {
    const sold = this.cobros().reduce((s, c) => s + c.value, 0);
    const used = this.cobros().reduce((s, c) => s + (c.value - c.balance), 0);
    return sold ? Math.round((used / sold) * 100) : 0;
  });
  readonly qrShare = computed(() => {
    const known = this.cobros().filter(c => c.channel !== '—');
    return known.length ? Math.round((known.filter(c => c.channel === 'qr').length / known.length) * 100) : 0;
  });

  readonly hovered = signal(-1);
  private readonly series = computed(() => this.months6.map(m => totals(this.inMonth(m))));
  readonly fee6 = computed(() => this.series().reduce((s, t) => s + t.fee, 0));
  readonly pts = computed(() => {
    const s = this.series(), peak = Math.max(1, ...s.map(t => t.gross)), span = 100 - PAD * 2;
    return s.map((t, i) => ({ x: PAD + (i / (s.length - 1)) * span, y: PAD + (1 - t.gross / peak) * span, t }));
  });
  readonly colW = computed(() => (100 - PAD * 2) / (this.months6.length - 1));
  readonly line = computed(() => this.pts().map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '));
  readonly area = computed(() => {
    const p = this.pts();
    return `M${p[0].x.toFixed(1)} 100 ${this.line().slice(1)} L${p.at(-1)!.x.toFixed(1)} 100 Z`;
  });

  readonly ranking = computed(() => {
    const rows = this.tenantsList()
      .map(t => ({ t, gross: totals(this.inMonth(this.thisMonth).filter(c => c.tenantId === t.id)).gross }))
      .filter(r => r.gross > 0)
      .sort((a, b) => b.gross - a.gross)
      .slice(0, 6);
    const top = rows[0]?.gross || 1;
    return rows.map(r => ({ ...r, pct: (r.gross / top) * 100 }));
  });

  /** Lo que conviene mirar: sin publicar, sin cuenta para liquidarle, sin ventas. */
  readonly alerts = computed(() => {
    const out: { t: Tenant; kind: string; icon: string; bg: string; text: string }[] = [];
    const recent = new Set(this.cobros().filter(c => c.date >= this.daysAgo(30)).map(c => c.tenantId));
    for (const t of this.tenantsList()) {
      if (!this.hasBank(t)) out.push({ t, kind: 'bank', icon: '🏦', bg: 'bg-warning/15', text: 'Sin datos bancarios: no podemos liquidarle' });
      if (!t.business.published) out.push({ t, kind: 'draft', icon: '📝', bg: 'bg-base-200', text: 'Página en borrador: todavía no vende' });
      else if (!recent.has(t.id)) out.push({ t, kind: 'idle', icon: '💤', bg: 'bg-info/10', text: 'Sin ventas en los últimos 30 días' });
    }
    return out;
  });
  readonly alertCount = computed(() => new Set(this.alerts().map(a => a.t.id)).size);

  // ── comercios ──────────────────────────────────────────────────────────────
  readonly tenantFilters = [
    { id: 'todos', label: 'Todos' }, { id: 'pub', label: 'Publicados' }, { id: 'draft', label: 'Borrador' },
  ] as const;
  readonly tq = signal('');
  readonly tFilter = signal<'todos' | 'pub' | 'draft'>('todos');
  readonly tSort = signal<'ventas' | 'nombre' | 'comision' | 'deuda'>('ventas');

  readonly tenantRows = computed(() => {
    const q = this.tq().trim().toLowerCase();
    const rows = this.tenantsList()
      .filter(t => this.tFilter() === 'todos' || (this.tFilter() === 'pub') === t.business.published)
      .filter(t => !q || [t.business.name, t.business.slug, ...(t.memberEmails ?? [])].some(s => s.toLowerCase().includes(q)))
      .map(t => this.statsOf(t));
    const by = {
      ventas: (a: typeof rows[0], b: typeof rows[0]) => b.month.gross - a.month.gross,
      nombre: (a: typeof rows[0], b: typeof rows[0]) => a.t.business.name.localeCompare(b.t.business.name),
      comision: (a: typeof rows[0], b: typeof rows[0]) => b.rate - a.rate,
      deuda: (a: typeof rows[0], b: typeof rows[0]) => b.debt - a.debt,
    }[this.tSort()];
    return rows.sort(by);
  });

  private statsOf(t: Tenant) {
    const mine = this.cobros().filter(c => c.tenantId === t.id);
    return {
      t, rate: rateOf(t),
      month: totals(mine.filter(c => c.date.startsWith(this.thisMonth))),
      all: totals(mine),
      debt: mine.filter(c => c.state === 'activa').reduce((s, c) => s + c.balance, 0),
      recent: mine.slice(0, 6),
    };
  }

  owner(t: Tenant) { return t.memberEmails?.[0] ?? '—'; }
  hasBank(t: Tenant) { return !!(t.business.bank?.bank && t.business.bank?.account); }
  pct(rate: number) { return `${(rate * 100).toLocaleString('es-BO', { maximumFractionDigits: 2 })}%`; }
  private daysAgo(n: number) { return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10); }

  // ── ficha + comisión ───────────────────────────────────────────────────────
  readonly openId = signal<string | null>(null);
  readonly detail = computed(() => {
    const t = this.openId() ? this.tenantMap().get(this.openId()!) : undefined;
    return t ? this.statsOf(t) : null;
  });
  rateInput = 5;
  readonly savingRate = signal(false);
  readonly rateSaved = signal(false);
  readonly rateError = signal('');

  openTenant(id: string) {
    const t = this.tenantMap().get(id);
    this.rateInput = +((t ? rateOf(t) : DEFAULT_RATE) * 100).toFixed(2);
    this.rateSaved.set(false); this.rateError.set('');
    this.openId.set(id);
  }
  closeTenant() { this.openId.set(null); }
  rateValid() { return this.rateInput != null && this.rateInput >= 0 && this.rateInput <= 50; }
  rateUnchanged(t: Tenant) { return t.commissionRate !== undefined && Math.abs(t.commissionRate * 100 - this.rateInput) < 1e-9; }
  preview(d: { month: { gross: number } }) { return Math.round(d.month.gross * this.rateInput) / 100; }

  async saveRate(t: Tenant) {
    if (!this.rateValid() || this.savingRate()) return;
    this.savingRate.set(true); this.rateError.set(''); this.rateSaved.set(false);
    try {
      const rate = Math.round(this.rateInput * 100) / 10_000;  // 3,5 % → 0.035 sin ruido de coma flotante
      await updateDoc(doc(this.db, 'tenants', t.id), { commissionRate: rate });
      // actualizamos en memoria para no recargar todo el panel por un número
      this.tenants.update(list => list?.map(x => (x.id === t.id ? { ...x, commissionRate: rate } : x)));
      this.rateSaved.set(true);
    } catch {
      this.rateError.set('No se pudo guardar. ¿Las reglas nuevas ya están desplegadas?');
    } finally {
      this.savingRate.set(false);
    }
  }

  seeCobros(id: string) {
    this.cTenant.set(id); this.setRange('todo');
    this.section.set('cobros'); this.closeTenant();
  }

  // ── cobros ─────────────────────────────────────────────────────────────────
  readonly ranges = [
    { id: 'mes', label: 'Este mes' }, { id: 'anterior', label: 'Mes anterior' },
    { id: '30', label: 'Últimos 30 días' }, { id: 'todo', label: 'Todo' },
  ];
  readonly cq = signal('');
  readonly cTenant = signal('');
  readonly cState = signal('');
  readonly cChannel = signal('');
  readonly cRange = signal('mes');
  readonly cFrom = signal(`${this.thisMonth}-01`);
  readonly cTo = signal('');
  readonly cLimit = signal(50);

  setRange(id: string) {
    this.cRange.set(id); this.cLimit.set(50);
    const prev = this.months6[4];
    const [from, to] = {
      mes: [`${this.thisMonth}-01`, ''],
      anterior: [`${prev}-01`, `${prev}-31`],
      '30': [this.daysAgo(30), ''],
      todo: ['', ''],
    }[id] ?? ['', ''];
    this.cFrom.set(from); this.cTo.set(to);
  }

  readonly cobrosFiltered = computed(() => {
    const q = this.cq().trim().toLowerCase();
    return this.cobros().filter(c =>
      (!this.cTenant() || c.tenantId === this.cTenant()) &&
      (!this.cState() || c.state === this.cState()) &&
      (!this.cChannel() || c.channel === this.cChannel()) &&
      (!this.cFrom() || c.date >= this.cFrom()) &&
      (!this.cTo() || c.date <= this.cTo()) &&
      (!q || c.code.toLowerCase().includes(q) || c.to.toLowerCase().includes(q) || c.tenant.toLowerCase().includes(q)));
  });
  readonly cobrosTotals = computed(() => totals(this.cobrosFiltered()));
  readonly cobrosPage = computed(() => this.cobrosFiltered().slice(0, this.cLimit()));

  exportCobros() {
    this.download(`cobros-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([
      ['Fecha', 'Fecha estimada', 'Comercio', 'Código', 'Para', 'Canal', 'Estado', 'Monto', 'Comisión %', 'Comisión', 'Neto'],
      ...this.cobrosFiltered().map(c => [c.date, c.estimated ? 'sí' : 'no', c.tenant, c.code, c.to, c.channel, c.state,
        c.value, +(c.rate * 100).toFixed(2), c.fee, c.net]),
    ]));
  }

  // ── liquidaciones ──────────────────────────────────────────────────────────
  readonly lMonth = signal(this.thisMonth);
  readonly liquidacion = computed(() => this.tenantsByName()
    .map(t => ({ t, rate: rateOf(t), tot: totals(this.cobros().filter(c => c.tenantId === t.id && c.date.startsWith(this.lMonth()))) }))
    .filter(l => l.tot.count > 0)
    .sort((a, b) => b.tot.net - a.tot.net));
  readonly liqTotals = computed(() => {
    const l = this.liquidacion();
    const sum = (f: (x: typeof l[0]) => number) => Math.round(l.reduce((s, x) => s + f(x), 0) * 100) / 100;
    return { gross: sum(x => x.tot.gross), fee: sum(x => x.tot.fee), net: sum(x => x.tot.net) };
  });

  exportLiquidacion() {
    this.download(`liquidacion-${this.lMonth()}.csv`, toCsv([
      ['Comercio', 'Titular', 'Banco', 'Cuenta', 'NIT', 'Cobros', 'Bruto', 'Comisión %', 'Comisión', 'A transferir'],
      ...this.liquidacion().map(l => [l.t.business.name, l.t.business.bank?.holder ?? '', l.t.business.bank?.bank ?? '',
        l.t.business.bank?.account ?? '', l.t.business.bank?.nit ?? '', l.tot.count, l.tot.gross,
        +(l.rate * 100).toFixed(2), l.tot.fee, l.tot.net]),
    ]));
  }

  private download(name: string, csv: string) {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    a.click();
    URL.revokeObjectURL(url);
  }

  async salir() {
    await this.auth.signOut();
    this.router.navigateByUrl('/');
  }
}
