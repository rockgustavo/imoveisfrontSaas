import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, signal } from '@angular/core';
import Keycloak from 'keycloak-js';

import { ImobiliariaService } from '../../../imobiliaria/imobiliaria.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Topbar {
  @Output() toggleSidebar = new EventEmitter<void>();

  private readonly imobiliariaService = inject(ImobiliariaService);

  protected readonly keycloak = inject(Keycloak);
  protected readonly theme = inject(ThemeService);
  protected readonly razaoSocial = signal('');

  constructor() {
    this.imobiliariaService.buscarTenant().subscribe({
      next: (tenant) => this.razaoSocial.set(tenant.razaoSocial),
      error: () => this.razaoSocial.set('')
    });
  }

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
