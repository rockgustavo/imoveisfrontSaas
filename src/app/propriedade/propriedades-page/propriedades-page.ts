import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Keycloak from 'keycloak-js';

import { AppError } from '../../core/app-error.model';
import { GeoSituacao, PropriedadeFiltro, PropriedadeResumo, SituacaoPropriedade } from '../propriedade.model';
import { PropriedadeService } from '../propriedade.service';

const CLASSE_BADGE_SITUACAO: Record<SituacaoPropriedade, string> = {
  DISPONIVEL: 'bg-success',
  AGENCIADA: 'bg-primary',
  RESERVADA: 'bg-warning text-dark',
  VENDIDA: 'bg-dark',
  RETIRADA: 'bg-secondary'
};

const CLASSE_BADGE_GEO: Record<GeoSituacao, string> = {
  PENDENTE: 'bg-warning text-dark',
  CONCLUIDA: 'bg-success',
  MANUAL: 'bg-secondary'
};

@Component({
  selector: 'app-propriedades-page',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './propriedades-page.html',
  styleUrl: './propriedades-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropriedadesPage {
  private readonly service = inject(PropriedadeService);
  private readonly keycloak = inject(Keycloak);

  protected readonly propriedades = signal<PropriedadeResumo[]>([]);
  protected readonly pagina = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<AppError | null>(null);

  protected readonly filtro = new FormGroup({
    situacao: new FormControl<SituacaoPropriedade | ''>('', { nonNullable: true }),
    localidade: new FormControl('', { nonNullable: true }),
    uf: new FormControl('', { nonNullable: true }),
    valorMin: new FormControl<number | null>(null),
    valorMax: new FormControl<number | null>(null)
  });

  protected get podeCriar(): boolean {
    return this.keycloak.hasRealmRole('USUARIO') || this.keycloak.hasRealmRole('ADMINISTRADOR');
  }

  protected classeBadgeSituacao(situacao: SituacaoPropriedade): string {
    return CLASSE_BADGE_SITUACAO[situacao];
  }

  protected classeBadgeGeo(geoSituacao: GeoSituacao): string {
    return CLASSE_BADGE_GEO[geoSituacao];
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
        this.propriedades.set(resultado.content);
        this.totalPaginas.set(resultado.totalPages);
        this.carregando.set(false);
      },
      error: (erro: AppError) => {
        this.erro.set(erro);
        this.carregando.set(false);
      }
    });
  }

  private paraFiltro(): PropriedadeFiltro {
    const valores = this.filtro.getRawValue();
    return {
      situacao: valores.situacao || undefined,
      localidade: valores.localidade || undefined,
      uf: valores.uf || undefined,
      valorMin: valores.valorMin ?? undefined,
      valorMax: valores.valorMax ?? undefined
    };
  }
}
