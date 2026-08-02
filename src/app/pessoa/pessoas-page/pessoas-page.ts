import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Keycloak from 'keycloak-js';

import { AppError } from '../../core/app-error.model';
import { ClassificacaoComercial, Papel, Pessoa, PessoaFiltro } from '../pessoa.model';
import { PessoaService } from '../pessoa.service';

type FiltroAtivo = 'ativos' | 'inativos' | 'todos';

@Component({
  selector: 'app-pessoas-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './pessoas-page.html',
  styleUrl: './pessoas-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PessoasPage {
  private readonly service = inject(PessoaService);
  private readonly keycloak = inject(Keycloak);

  protected readonly pessoas = signal<Pessoa[]>([]);
  protected readonly pagina = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<AppError | null>(null);

  protected readonly filtro = new FormGroup({
    documento: new FormControl('', { nonNullable: true }),
    papel: new FormControl<Papel | ''>('', { nonNullable: true }),
    classificacao: new FormControl<ClassificacaoComercial | ''>('', { nonNullable: true }),
    ativo: new FormControl<FiltroAtivo>('ativos', { nonNullable: true })
  });

  protected get podeCriar(): boolean {
    return this.keycloak.hasRealmRole('ADMINISTRADOR');
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
        this.pessoas.set(resultado.content);
        this.totalPaginas.set(resultado.totalPages);
        this.carregando.set(false);
      },
      error: (erro: AppError) => {
        this.erro.set(erro);
        this.carregando.set(false);
      }
    });
  }

  private paraFiltro(): PessoaFiltro {
    const valores = this.filtro.getRawValue();
    return {
      documento: valores.documento || undefined,
      papel: valores.papel || undefined,
      classificacao: valores.classificacao || undefined,
      ativo: valores.ativo === 'todos' ? undefined : valores.ativo === 'ativos'
    };
  }
}
