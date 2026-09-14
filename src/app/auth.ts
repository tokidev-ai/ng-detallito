import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, CanActivateFn } from '@angular/router';
import {
  Auth, GoogleAuthProvider, authState, signInWithPopup, signOut as fbSignOut,
} from '@angular/fire/auth';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);

  /** undefined = Firebase todavía no contestó; null = anónimo. */
  readonly user = toSignal(authState(this.auth), { initialValue: undefined });
  readonly ready = () => this.user() !== undefined;
  readonly uid = () => this.user()?.uid ?? null;

  signInWithGoogle() { return signInWithPopup(this.auth, new GoogleAuthProvider()); }
  signOut() { return fbSignOut(this.auth); }
}

/** ponytail: un solo guard. Los permisos finos los hacen cumplir las Firestore Rules;
 *  la UI solo acompaña, así que acá alcanza con "¿hay sesión?". */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const ready$ = inject(Auth);

  return authState(ready$).pipe(
    map(user => user ? true : router.createUrlTree(['/login'], { queryParams: { next: state.url } })),
  );
};
