import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import Keycloak from 'keycloak-js';

import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Topbar {
  @Output() toggleSidebar = new EventEmitter<void>();

  protected readonly keycloak = inject(Keycloak);
  protected readonly theme = inject(ThemeService);

  protected get username(): string {
    return (this.keycloak.tokenParsed?.['preferred_username'] as string | undefined) ?? '';
  }

  protected get isAdministrador(): boolean {
    return this.keycloak.hasRealmRole('ADMINISTRADOR');
  }

  protected logout(): void {
    this.keycloak.logout({ redirectUri: window.location.origin });
  }
}
