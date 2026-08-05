import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Keycloak from 'keycloak-js';

import { AppError } from '../../core/app-error.model';
import { ContratoFiltro, ContratoResumo, StatusContrato } from '../contrato.model';
import { ContratoService } from '../contrato.service';

const CLASSE_BADGE_STATUS: Record<StatusContrato, string> = {
  RASCUNHO: 'bg-secondary',
  ATIVO: 'bg-success',
  ENCERRADO: 'bg-dark',
  CANCELADO: 'bg-danger',
  EXPIRADO: 'bg-warning text-dark'
};

@Component({
  selector: 'app-contratos-page',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './contratos-page.html',
  styleUrl: './contratos-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContratosPage {
  private readonly service = inject(ContratoService);
  private readonly keycloak = inject(Keycloak);

  protected readonly contratos = signal<ContratoResumo[]>([]);
  protected readonly pagina = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<AppError | null>(null);

  protected readonly filtro = new FormGroup({
    status: new FormControl<StatusContrato | ''>('', { nonNullable: true })
  });

  protected get podeCriar(): boolean {
    return this.keycloak.hasRealmRole('USUARIO') || this.keycloak.hasRealmRole('ADMINISTRADOR');
  }

  protected classeBadgeStatus(status: StatusContrato): string {
    return CLASSE_BADGE_STATUS[status];
  }

  constructor() {
    this.carregar();
  }

  protected buscar(): void {
    this.pagina.set(0);
    this.carregar();
  }

  protected irParaPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas()) {
      return;
    }
    this.pagina.set(pagina);
    this.carregar();
  }

  private carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.service.listar(this.paraFiltro(), this.pagina(), 20).subscribe({
      next: (resultado) => {
        this.contratos.set(resultado.content);
        this.totalPaginas.set(resultado.totalPages);
        this.carregando.set(false);
      },
      error: (erro: AppError) => {
        this.erro.set(erro);
        this.carregando.set(false);
      }
    });
  }

  private paraFiltro(): ContratoFiltro {
    const valores = this.filtro.getRawValue();
    return {
      status: valores.status || undefined
    };
  }
}
