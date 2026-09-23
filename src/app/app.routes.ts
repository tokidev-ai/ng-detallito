import { Routes } from '@angular/router';
import { authGuard, superadminGuard } from './auth';

export const routes: Routes = [
  // la landing: la primera pantalla de un comercio que todavía no es cliente
  { path: '', pathMatch: 'full', loadComponent: () => import('./landing').then(m => m.Landing) },

  { path: 'login', loadComponent: () => import('./login').then(m => m.Login) },

  // lista de comercios: el punto de entrada multitenant
  {
    path: 'app', pathMatch: 'full', canActivate: [authGuard],
    loadComponent: () => import('./merchant/tenants').then(m => m.Tenants),
  },

  {
    path: 'onboarding', canActivate: [authGuard],
    loadComponent: () => import('./onboarding/wizard').then(m => m.Onboarding),
  },

  // panel de UN comercio
  {
    path: 'app/:tenant', canActivate: [authGuard],
    loadComponent: () => import('./merchant/shell').then(m => m.MerchantShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'resumen' },
      { path: 'resumen', loadComponent: () => import('./merchant/resumen').then(m => m.Resumen) },
      { path: 'gift-cards', loadComponent: () => import('./merchant/sections').then(m => m.Emitidas) },
      { path: 'marca', loadComponent: () => import('./merchant/sections').then(m => m.Marca) },
      { path: 'equipo', loadComponent: () => import('./merchant/sections').then(m => m.Equipo) },
    ],
  },

  // Panel de la STARTUP. Ruta no enlazada desde ningún lado: se llega solo
  // escribiendo la URL, y aun así el guard exige el doc en /superadmins.
  // ponytail: la URL es comodidad, no seguridad. Lo que protege es la regla.
  {
    path: 'gkb-interno-4f7a2', canActivate: [superadminGuard],
    loadComponent: () => import('./admin/panel').then(m => m.AdminPanel),
  },

  // catch-all: la página pública del comercio, sin sesión. Va última a propósito.
  { path: ':slug', loadComponent: () => import('./storefront').then(m => m.StorefrontPage) },
];
