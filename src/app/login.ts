import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from './auth';
import { Mark } from './brand';

@Component({
  selector: 'app-login',
  imports: [RouterLink, Mark],
  template: `
  <div class="grid min-h-dvh place-items-center p-4 brand-glow">
    <div class="w-full max-w-md">
      <div class="overflow-hidden rounded-box border border-base-300 bg-base-100">
        <div class="h-1.5" style="background-color:#e8694b"></div>

        <div class="p-8 sm:p-10">
          <div class="flex items-center gap-3">
            <app-mark [size]="34" />
            <div>
              <h1 class="text-2xl font-semibold tracking-tight">GiftKBol</h1>
              <p class="text-sm text-base-content/55">Gift cards para tu negocio</p>
            </div>
          </div>

          <p class="mt-7 text-base-content/70">
            Entrá para administrar tu comercio: tu página, tus productos, tus ventas y los canjes.
          </p>

          <button type="button"
                  class="btn mt-7 h-12 w-full justify-center gap-3 border-base-300 bg-base-100 text-base-content hover:bg-base-200"
                  [disabled]="busy()" (click)="enter()">
            @if (busy()) {
              <span class="loading loading-spinner loading-sm"></span>
            } @else {
              <svg viewBox="0 0 48 48" class="size-5" aria-hidden="true">
                <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 2-1.6 5-4.5 7l-.1.3 6.5 5 .5.1c4.1-3.8 6.6-9.4 6.6-15.7"/>
                <path fill="#34A853" d="M24 46c5.9 0 10.9-1.9 14.5-5.3l-6.9-5.4c-1.8 1.3-4.3 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-.3 0-6.7 5.2-.1.3C14.2 41.1 18.7 46 24 46"/>
                <path fill="#FBBC05" d="M11.5 28.4c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4v-.3l-6.8-5.3-.2.1C3 16.9 2.3 20.4 2.3 24s.7 7.1 2.2 10l7-5.6"/>
                <path fill="#EA4335" d="M24 10.5c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 4.3 29.9 2 24 2 18.7 2 14.2 6.9 11.5 14l7 5.6c1.8-5.3 6.7-9.1 12.5-9.1"/>
              </svg>
              Entrar con Google
            }
          </button>

          @if (error()) {
            <p class="mt-4 rounded-field border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
              {{ error() }}
            </p>
          }

          <p class="mt-7 border-t border-base-300 pt-5 text-sm text-base-content/50">
            ¿Todavía no tenés comercio?
            <a routerLink="/onboarding" class="link link-hover font-medium" style="color:#e8694b">Creá el tuyo</a>
            — toma diez minutos.
          </p>
        </div>
      </div>

      <p class="mt-5 text-center text-xs text-base-content/35">
        Al entrar aceptás que usemos tu correo para identificarte. Nada más.
      </p>
    </div>
  </div>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly busy = signal(false);
  readonly error = signal('');

  async enter() {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.signInWithGoogle();
      this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('next') ?? '/app');
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      this.error.set(
        code === 'auth/popup-closed-by-user' ? 'Cerraste la ventana antes de terminar.'
        : code === 'auth/popup-blocked' ? 'El navegador bloqueó la ventana. Permitila y probá de nuevo.'
        : code === 'auth/operation-not-allowed' ? 'Falta habilitar Google como proveedor en la consola de Firebase.'
        : 'No pudimos entrar. Probá de nuevo.');
    } finally {
      this.busy.set(false);
    }
  }
}
