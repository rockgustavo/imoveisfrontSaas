import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthGuardData, createAuthGuard } from 'keycloak-angular';

export function acessoPermitido(route: ActivatedRouteSnapshot, authData: AuthGuardData): boolean {
  const { authenticated, grantedRoles } = authData;
  const papelExigido = route.data['papel'] as string | undefined;

  if (!authenticated) {
    return false;
  }
  if (!papelExigido) {
    return true;
  }
  return grantedRoles.realmRoles.includes(papelExigido);
}

export const roleGuard = createAuthGuard<CanActivateFn>(async (route, _state, authData) => {
  if (acessoPermitido(route, authData)) {
    return true;
  }
  return inject(Router).parseUrl('/');
});
