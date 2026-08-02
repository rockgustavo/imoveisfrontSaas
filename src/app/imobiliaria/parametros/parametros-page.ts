import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AppError } from '../../core/app-error.model';
import { CampoErro } from '../../shared/components/campo-erro/campo-erro';
import { ResumoValidacao } from '../../shared/components/resumo-validacao/resumo-validacao';
import { CampoPendente, camposPendentes } from '../../shared/validators/campos-pendentes';
import {
  aplicarErrosDoServidor,
  campoInvalido,
  limparErrosDoServidor
} from '../../shared/validators/erros-do-servidor';
import { maiorQueZero } from '../../shared/validators/maior-que-zero.validator';
import { ImobiliariaService } from '../imobiliaria.service';
import { ParametrosTenant } from '../parametros-tenant.model';

const ROTULOS: Record<string, string> = {
  comissaoPercentualTeto: 'Teto de comissão (%)',
  orcamentoValidadeDiasPadrao: 'Validade padrão do orçamento (dias)',
  geocodificacaoTentativasMax: 'Tentativas máximas de geocodificação',
  cepCacheJanelaDias: 'Janela do cache de CEP (dias)',
  fusoHorario: 'Fuso horário'
};

@Component({
  selector: 'app-parametros-page',
  imports: [ReactiveFormsModule, CampoErro, ResumoValidacao],
  templateUrl: './parametros-page.html',
  styleUrl: './parametros-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParametrosPage {
  private readonly service = inject(ImobiliariaService);

  protected readonly salvando = signal(false);
  protected readonly erro = signal<AppError | null>(null);
  protected readonly pendencias = signal<CampoPendente[]>([]);

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

  protected invalido(campo: string): boolean {
    return campoInvalido(this.form, campo);
  }

  protected salvar(): void {
    limparErrosDoServidor(this.form);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.pendencias.set(camposPendentes(this.form, ROTULOS));
      return;
    }

    this.pendencias.set([]);
    this.salvando.set(true);
    this.erro.set(null);

    this.service.atualizarParametros(this.paraPayload()).subscribe({
      next: (parametros) => {
        this.preencherFormulario(parametros);
        this.salvando.set(false);
      },
      error: (erro: AppError) => {
        const naoMapeados = aplicarErrosDoServidor(this.form, erro);
        this.pendencias.set(erro.campos ? [...camposPendentes(this.form, ROTULOS), ...naoMapeados] : []);
        this.erro.set(erro.campos ? null : erro);
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
