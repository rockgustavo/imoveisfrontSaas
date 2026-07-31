import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AppError } from '../../core/app-error.model';
import { ImobiliariaService } from '../imobiliaria.service';
import { ParametrosTenant } from '../parametros-tenant.model';
import { maiorQueZero } from './parametros-tenant.validators';

@Component({
  selector: 'app-parametros-page',
  imports: [ReactiveFormsModule],
  templateUrl: './parametros-page.html',
  styleUrl: './parametros-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParametrosPage {
  private readonly service = inject(ImobiliariaService);

  protected readonly salvando = signal(false);
  protected readonly erro = signal<AppError | null>(null);

  protected readonly form = new FormGroup({
    comissaoPercentualTeto: new FormControl<number | null>(null, [Validators.required, maiorQueZero]),
    orcamentoValidadeDiasPadrao: new FormControl<number | null>(null, [Validators.required, maiorQueZero]),
    geocodificacaoTentativasMax: new FormControl<number | null>(null, [Validators.required, maiorQueZero]),
    cepCacheJanelaDias: new FormControl<number | null>(null, [Validators.required, maiorQueZero]),
    fusoHorario: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor() {
    this.service.buscarParametros().subscribe({
      next: (parametros) => this.preencherFormulario(parametros),
      error: (erro: AppError) => this.erro.set(erro)
    });
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);

    this.service.atualizarParametros(this.paraPayload()).subscribe({
      next: (parametros) => {
        this.preencherFormulario(parametros);
        this.salvando.set(false);
      },
      error: (erro: AppError) => {
        this.erro.set(erro);
        this.salvando.set(false);
      }
    });
  }

  private paraPayload(): ParametrosTenant {
    const valores = this.form.getRawValue();
    return {
      comissaoPercentualTeto: Number(valores.comissaoPercentualTeto).toFixed(2),
      orcamentoValidadeDiasPadrao: Number(valores.orcamentoValidadeDiasPadrao),
      geocodificacaoTentativasMax: Number(valores.geocodificacaoTentativasMax),
      cepCacheJanelaDias: Number(valores.cepCacheJanelaDias),
      fusoHorario: valores.fusoHorario
    };
  }

  private preencherFormulario(parametros: ParametrosTenant): void {
    this.form.patchValue({
      comissaoPercentualTeto: Number(parametros.comissaoPercentualTeto),
      orcamentoValidadeDiasPadrao: parametros.orcamentoValidadeDiasPadrao,
      geocodificacaoTentativasMax: parametros.geocodificacaoTentativasMax,
      cepCacheJanelaDias: parametros.cepCacheJanelaDias,
      fusoHorario: parametros.fusoHorario
    });
  }
}
