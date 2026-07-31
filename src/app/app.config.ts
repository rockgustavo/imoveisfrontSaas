import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideKeycloak } from 'keycloak-angular';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { keycloakConfig, keycloakInitOptions } from './core/keycloak.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideKeycloak({
      config: keycloakConfig,
      initOptions: keycloakInitOptions
    })
  ]
};
