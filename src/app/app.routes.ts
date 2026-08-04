import { Routes } from '@angular/router';

import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  {
    path: 'propriedades',
    loadComponent: () => import('./propriedade/propriedades-page/propriedades-page').then((m) => m.PropriedadesPage),
    canActivate: [roleGuard],
    data: { papel: ['USUARIO', 'ADMINISTRADOR'] }
  },
  {
    path: 'propriedades/novo',
    loadComponent: () => import('./propriedade/propriedade-form/propriedade-form').then((m) => m.PropriedadeForm),
    canActivate: [roleGuard],
    data: { papel: ['USUARIO', 'ADMINISTRADOR'] }
  },
  {
    path: 'propriedades/:id',
    loadComponent: () => import('./propriedade/propriedade-form/propriedade-form').then((m) => m.PropriedadeForm),
    canActivate: [roleGuard],
    data: { papel: ['USUARIO', 'ADMINISTRADOR'] }
  },
  {
    path: 'orcamentos',
    loadComponent: () => import('./orcamento/orcamentos-page/orcamentos-page').then((m) => m.OrcamentosPage),
    canActivate: [roleGuard],
    data: { papel: ['USUARIO', 'ADMINISTRADOR'] }
  },
  {
    path: 'orcamentos/novo',
    loadComponent: () => import('./orcamento/orcamento-form/orcamento-form').then((m) => m.OrcamentoForm),
    canActivate: [roleGuard],
    data: { papel: ['USUARIO', 'ADMINISTRADOR'] }
  },
  {
    path: 'orcamentos/:id',
    loadComponent: () => import('./orcamento/orcamento-form/orcamento-form').then((m) => m.OrcamentoForm),
    canActivate: [roleGuard],
    data: { papel: ['USUARIO', 'ADMINISTRADOR'] }
  },
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
