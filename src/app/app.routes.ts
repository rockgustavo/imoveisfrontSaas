import { Routes } from '@angular/router';

import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  {
    path: 'parametros',
    loadComponent: () => import('./imobiliaria/parametros/parametros-page').then((m) => m.ParametrosPage),
    canActivate: [roleGuard],
    data: { papel: 'ADMINISTRADOR' }
  },
  { path: '', redirectTo: 'parametros', pathMatch: 'full' }
];
