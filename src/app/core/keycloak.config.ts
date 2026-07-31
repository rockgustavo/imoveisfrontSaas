import { KeycloakConfig, KeycloakInitOptions } from 'keycloak-js';

export const keycloakConfig: KeycloakConfig = {
  url: 'http://localhost:8081',
  realm: 'imobiliaria',
  clientId: 'imobiliaria-frontend'
};

export const keycloakInitOptions: KeycloakInitOptions = {
  onLoad: 'login-required',
  checkLoginIframe: false,
  pkceMethod: 'S256'
};
