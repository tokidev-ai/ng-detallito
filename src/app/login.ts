import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './auth';

@Component({
  selector: 'app-login',
  template: `
  <div class="grid min-h-dvh place-items-center bg-base-200 p-6">
    <div class="w-full max-w-sm rounded-box border border-base-300 bg-base-100 p-8 text-center">
      <h1 class="text-2xl font-semibold">Detallito</h1>
      <p class="mt-2 text-base-content/60">Gift cards para tu negocio.</p>

      <button type="button" class="btn btn-primary mt-8 w-full" [disabled]="busy()" (click)="enter()">
        @if (busy()) { <span class="loading loading-spinner loading-sm"></span> }
        Entrar con Google
      </button>

      @if (error()) { <p class="mt-4 text-sm text-error">{{ error() }}</p> }
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
        : code === 'auth/operation-not-allowed' ? 'Falta habilitar Google como proveedor en la consola de Firebase.'
        : 'No pudimos entrar. Probá de nuevo.');
    } finally {
      this.busy.set(false);
    }
  }
}
