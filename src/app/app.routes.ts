import { Routes } from '@angular/router';

import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  {
    path: 'parametros',
    loadComponent: () => import('./imobiliaria/parametros/parametros-page').then((m) => m.ParametrosPage),
    canActivate: [roleGuard],
    data: { papel: 'ADMINISTRADOR' }
  },
  {
    path: 'pessoas',
    loadComponent: () => import('./pessoa/pessoas-page/pessoas-page').then((m) => m.PessoasPage),
    canActivate: [roleGuard],
    data: { papel: ['USUARIO', 'ADMINISTRADOR'] }
  },
  {
    path: 'pessoas/novo',
    loadComponent: () => import('./pessoa/pessoa-form/pessoa-form').then((m) => m.PessoaForm),
    canActivate: [roleGuard],
    data: { papel: 'ADMINISTRADOR' }
  },
  {
    path: 'pessoas/:id',
    loadComponent: () => import('./pessoa/pessoa-form/pessoa-form').then((m) => m.PessoaForm),
    canActivate: [roleGuard],
    data: { papel: ['USUARIO', 'ADMINISTRADOR'] }
  },
  { path: '', redirectTo: 'pessoas', pathMatch: 'full' }
];
