import { ActivatedRouteSnapshot } from '@angular/router';
import { AuthGuardData } from 'keycloak-angular';

import { acessoPermitido } from './role.guard';

function rota(papel?: string | string[]): ActivatedRouteSnapshot {
  return { data: papel ? { papel } : {} } as unknown as ActivatedRouteSnapshot;
}

function authData(autenticado: boolean, realmRoles: string[] = []): AuthGuardData {
  return {
    authenticated: autenticado,
    grantedRoles: { realmRoles, resourceRoles: {} },
    keycloak: {} as AuthGuardData['keycloak']
  };
}

describe('acessoPermitido', () => {
  it('nega acesso quando não autenticado, mesmo sem papel exigido', () => {
    expect(acessoPermitido(rota(), authData(false))).toBe(false);
  });

  it('permite acesso quando autenticado e a rota não exige papel', () => {
    expect(acessoPermitido(rota(), authData(true))).toBe(true);
  });

  it('permite acesso quando autenticado e o usuário tem o papel exigido', () => {
    expect(acessoPermitido(rota('ADMINISTRADOR'), authData(true, ['ADMINISTRADOR']))).toBe(true);
  });

  it('nega acesso quando autenticado mas sem o papel exigido', () => {
    expect(acessoPermitido(rota('ADMINISTRADOR'), authData(true, ['USUARIO']))).toBe(false);
  });

  it('permite acesso quando o papel exigido é uma lista e o usuário tem um deles', () => {
    expect(acessoPermitido(rota(['USUARIO', 'ADMINISTRADOR']), authData(true, ['USUARIO']))).toBe(true);
  });

  it('nega acesso quando o papel exigido é uma lista e o usuário não tem nenhum deles', () => {
    expect(acessoPermitido(rota(['USUARIO', 'ADMINISTRADOR']), authData(true, ['PROPRIETARIO']))).toBe(false);
  });
});
