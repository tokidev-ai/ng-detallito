import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, CanActivateFn } from '@angular/router';
import {
  Auth, GoogleAuthProvider, authState, signInWithPopup, signOut as fbSignOut,
} from '@angular/fire/auth';
import { map, of, switchMap } from 'rxjs';
import { Firestore, doc, docData } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);

  /** undefined = Firebase todavía no contestó; null = anónimo. */
  readonly user = toSignal(authState(this.auth), { initialValue: undefined });
  readonly ready = () => this.user() !== undefined;
  readonly uid = () => this.user()?.uid ?? null;

  /** Superadmin = nosotros, la startup. Un doc en /superadmins que solo se
   *  otorga con `npm run superadmin`; desde la app nadie puede escribirlo. */
  private readonly db = inject(Firestore);
  readonly isSuperadmin = toSignal(
    authState(this.auth).pipe(
      switchMap(u => u ? docData(doc(this.db, 'superadmins', u.uid)) : of(undefined)),
      map(d => !!d)),
    { initialValue: false });

  signInWithGoogle() { return signInWithPopup(this.auth, new GoogleAuthProvider()); }
  signOut() { return fbSignOut(this.auth); }
}

/** ponytail: un solo guard. Los permisos finos los hacen cumplir las Firestore Rules;
 *  la UI solo acompaña, así que acá alcanza con "¿hay sesión?". */
export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return authState(inject(Auth)).pipe(
    map(user => user ? true : router.createUrlTree(['/login'], { queryParams: { next: state.url } })),
  );
};

/** El panel de la startup. Si no sos superadmin te manda al panel de comercios. */
export const superadminGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const db = inject(Firestore);
  return authState(inject(Auth)).pipe(
    switchMap(user => {
      if (!user) return of(router.createUrlTree(['/login'], { queryParams: { next: state.url } }));
      return docData(doc(db, 'superadmins', user.uid)).pipe(
        map(d => (d ? true : router.createUrlTree(['/app']))));
    }),
  );
};
