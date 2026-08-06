import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { AppError } from '../../core/app-error.model';
import { MapaPage } from '../../mapa/mapa-page/mapa-page';
import { PainelIndicadores } from '../painel.model';
import { PainelService } from '../painel.service';

@Component({
  selector: 'app-painel-page',
  imports: [CurrencyPipe, MapaPage],
  templateUrl: './painel-page.html',
  styleUrl: './painel-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PainelPage {
  private readonly service = inject(PainelService);

  protected readonly indicadores = signal<PainelIndicadores | null>(null);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<AppError | null>(null);

  constructor() {
    this.carregar();
  }

  private carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.service.buscar().subscribe({
      next: (indicadores) => {
        this.indicadores.set(indicadores);
        this.carregando.set(false);
      },
      error: (erro: AppError) => {
        this.erro.set(erro);
        this.carregando.set(false);
      }
    });
  }
}
