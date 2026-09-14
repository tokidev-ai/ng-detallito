import { Routes } from '@angular/router';
import { authGuard } from './auth';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app' },

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
      { path: 'gift-cards', loadComponent: () => import('./merchant/sections').then(m => m.GiftCards) },
      { path: 'canjes', loadComponent: () => import('./merchant/sections').then(m => m.Canjes) },
      { path: 'productos', loadComponent: () => import('./merchant/sections').then(m => m.Productos) },
      { path: 'marca', loadComponent: () => import('./merchant/sections').then(m => m.Marca) },
      { path: 'equipo', loadComponent: () => import('./merchant/sections').then(m => m.Equipo) },
      { path: 'cobros', loadComponent: () => import('./merchant/sections').then(m => m.Cobros) },
    ],
  },

  // catch-all: la página pública del comercio, sin sesión. Va última a propósito.
  { path: ':slug', loadComponent: () => import('./storefront').then(m => m.StorefrontPage) },
];
