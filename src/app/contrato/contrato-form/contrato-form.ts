import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Keycloak from 'keycloak-js';
import { combineLatest, forkJoin } from 'rxjs';

import { AppError } from '../../core/app-error.model';
import { Pessoa } from '../../pessoa/pessoa.model';
import { PessoaService } from '../../pessoa/pessoa.service';
import { OrcamentoResumo } from '../../orcamento/orcamento.model';
import { OrcamentoService } from '../../orcamento/orcamento.service';
import { Propriedade } from '../../propriedade/propriedade.model';
import { PropriedadeService } from '../../propriedade/propriedade.service';
import { CampoErro } from '../../shared/components/campo-erro/campo-erro';
import { ResumoValidacao } from '../../shared/components/resumo-validacao/resumo-validacao';
import { CampoPendente, camposPendentes } from '../../shared/validators/campos-pendentes';
import {
  aplicarErrosDoServidor,
  campoInvalido,
  limparErrosDoServidor
} from '../../shared/validators/erros-do-servidor';
import { Agenciamento, Contrato, ContratoHistorico, TipoAditivo } from '../contrato.model';
import { ContratoService } from '../contrato.service';

const ROTULOS: Record<string, string> = {
  orcamentoId: 'Orçamento',
  vigenciaInicio: 'Início da vigência',
  vigenciaFim: 'Fim da vigência',
  regrasContratuais: 'Regras contratuais'
};

@Component({
  selector: 'app-contrato-form',
  imports: [ReactiveFormsModule, RouterLink, CampoErro, ResumoValidacao, DatePipe],
  templateUrl: './contrato-form.html',
  styleUrl: './contrato-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContratoForm {
  private readonly service = inject(ContratoService);
  private readonly orcamentoService = inject(OrcamentoService);
  private readonly pessoaService = inject(PessoaService);
  private readonly propriedadeService = inject(PropriedadeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly keycloak = inject(Keycloak);

  protected readonly contratoId = signal<string | null>(null);
  protected readonly contrato = signal<Contrato | null>(null);
  protected readonly proprietario = signal<Pessoa | null>(null);
  protected readonly propriedadesPorId = signal<Record<string, Propriedade | undefined>>({});
  protected readonly orcamentosAceitos = signal<OrcamentoResumo[]>([]);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<AppError | null>(null);
  protected readonly erroAditivo = signal<AppError | null>(null);
  protected readonly pendencias = signal<CampoPendente[]>([]);
  protected readonly historico = signal<ContratoHistorico | null>(null);
  protected readonly consultandoHistorico = signal(false);
  protected readonly erroHistorico = signal<AppError | null>(null);

  protected readonly form = new FormGroup({
    orcamentoId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    vigenciaInicio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    vigenciaFim: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    regrasContratuais: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  protected readonly aditivoForm = new FormGroup({
    tipo: new FormControl<TipoAditivo>('INCLUSAO', { nonNullable: true, validators: [Validators.required] }),
    propriedadeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    justificativa: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    comissaoPercentual: new FormControl<number | null>(null),
    valorPedido: new FormControl<number | null>(null)
  });

  protected readonly historicoForm = new FormGroup({
    data: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  protected get modoDetalhe(): boolean {
    return this.contratoId() !== null;
  }

  protected get orcamentoPreSelecionado(): boolean {
    return this.form.controls.orcamentoId.disabled;
  }

  protected get precisaDeComissaoEValor(): boolean {
    return this.aditivoForm.controls.tipo.value === 'INCLUSAO';
  }

  protected get podeAtivar(): boolean {
    return this.contrato()?.status === 'RASCUNHO';
  }

  protected get podeEncerrar(): boolean {
    return this.contrato()?.status === 'ATIVO';
  }

  protected get podeCancelar(): boolean {
    const status = this.contrato()?.status;
    return status === 'RASCUNHO' || status === 'ATIVO';
  }

  protected get podeRegistrarAditivo(): boolean {
    return this.contrato()?.status === 'ATIVO';
  }

  protected get dataDoHistoricoInvalida(): boolean {
    return campoInvalido(this.historicoForm, 'data');
  }

  protected invalido(campo: string): boolean {
    return campoInvalido(this.form, campo);
  }

  constructor() {
    combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, queryParams]) => {
      const id = params.get('id');
      this.contratoId.set(id);
      if (id) {
        this.carregarContrato(id);
      } else {
        this.iniciarNovoContrato(queryParams.get('orcamentoId'));
      }
    });
  }

  private iniciarNovoContrato(orcamentoIdPreSelecionado: string | null): void {
    this.contrato.set(null);
    this.proprietario.set(null);
    this.erro.set(null);
    this.pendencias.set([]);
    this.propriedadesPorId.set({});
    this.limparHistorico();
    this.form.reset({
      orcamentoId: orcamentoIdPreSelecionado ?? '',
      vigenciaInicio: '',
      vigenciaFim: '',
      regrasContratuais: ''
    });
    if (orcamentoIdPreSelecionado) {
      this.form.controls.orcamentoId.disable();
      this.orcamentosAceitos.set([]);
    } else {
      this.form.controls.orcamentoId.enable();
      this.orcamentoService
        .listar({ status: 'ACEITO' }, 0, 100)
        .subscribe({ next: (resultado) => this.orcamentosAceitos.set(resultado.content) });
    }
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
    const valores = this.form.getRawValue();

    this.service
      .criar({
        orcamentoId: valores.orcamentoId,
        vigenciaInicio: valores.vigenciaInicio,
        vigenciaFim: valores.vigenciaFim,
        regrasContratuais: valores.regrasContratuais
      })
      .subscribe({
        next: (id) => this.router.navigate(['/contratos', id]),
        error: (erro: AppError) => this.tratarErro(erro)
      });
  }

  protected ativar(): void {
    const id = this.contratoId();
    if (!id) {
      return;
    }
    this.erro.set(null);
    this.service.ativar(id).subscribe({
      next: (contrato) => this.atualizarContrato(contrato),
      error: (erro: AppError) => this.erro.set(erro)
    });
  }

  protected encerrar(): void {
    const id = this.contratoId();
    if (!id) {
      return;
    }
    const justificativa = prompt('Justificativa do encerramento:');
    if (!justificativa) {
      return;
    }
    this.erro.set(null);
    this.service.encerrar(id, { justificativa }).subscribe({
      next: (contrato) => this.atualizarContrato(contrato),
      error: (erro: AppError) => this.erro.set(erro)
    });
  }

  protected cancelar(): void {
    const id = this.contratoId();
    if (!id || !confirm('Cancelar este contrato?')) {
      return;
    }
    this.erro.set(null);
    this.service.cancelar(id).subscribe({
      next: (contrato) => this.atualizarContrato(contrato),
      error: (erro: AppError) => this.erro.set(erro)
    });
  }

  protected registrarAditivo(): void {
    const id = this.contratoId();
    if (!id) {
      return;
    }
    if (this.aditivoForm.invalid) {
      this.aditivoForm.markAllAsTouched();
      return;
    }
    this.erroAditivo.set(null);
    const valores = this.aditivoForm.getRawValue();
    this.service
      .registrarAditivo(id, {
        tipo: valores.tipo,
        propriedadeId: valores.propriedadeId,
        justificativa: valores.justificativa,
        comissaoPercentual: valores.comissaoPercentual ?? undefined,
        valorPedido: valores.valorPedido ?? undefined
      })
      .subscribe({
        next: (contrato) => {
          this.atualizarContrato(contrato);
          this.aditivoForm.reset({
            tipo: 'INCLUSAO',
            propriedadeId: '',
            justificativa: '',
            comissaoPercentual: null,
            valorPedido: null
          });
        },
        error: (erro: AppError) => this.erroAditivo.set(erro)
      });
  }

  protected consultarHistorico(): void {
    const id = this.contratoId();
    if (!id || this.historicoForm.invalid) {
      this.historicoForm.markAllAsTouched();
      return;
    }
    this.consultandoHistorico.set(true);
    this.erroHistorico.set(null);
    this.historico.set(null);
    this.service.historicoEm(id, this.historicoForm.getRawValue().data).subscribe({
      next: (historico) => {
        this.historico.set(historico);
        this.carregarPropriedadesDosAgenciamentos(historico.contrato.agenciamentos);
        this.consultandoHistorico.set(false);
      },
      error: (erro: AppError) => {
        this.erroHistorico.set(erro);
        this.consultandoHistorico.set(false);
      }
    });
  }

  private carregarContrato(id: string): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.propriedadesPorId.set({});
    this.limparHistorico();

    this.service.buscarPorId(id).subscribe({
      next: (contrato) => {
        this.atualizarContrato(contrato);
        this.pessoaService.buscarPorId(contrato.pessoaId).subscribe({ next: (pessoa) => this.proprietario.set(pessoa) });
        this.carregando.set(false);
      },
      error: (erro: AppError) => {
        this.erro.set(erro);
        this.carregando.set(false);
      }
    });
  }

  private atualizarContrato(contrato: Contrato): void {
    this.contrato.set(contrato);
    this.carregarPropriedadesDosAgenciamentos(contrato.agenciamentos);
  }

  private carregarPropriedadesDosAgenciamentos(agenciamentos: Agenciamento[]): void {
    const jaCarregadas = this.propriedadesPorId();
    const idsFaltantes = [...new Set(agenciamentos.map((item) => item.propriedadeId))].filter(
      (id) => !jaCarregadas[id]
    );
    if (idsFaltantes.length === 0) {
      return;
    }
    forkJoin(idsFaltantes.map((id) => this.propriedadeService.buscarPorId(id))).subscribe({
      next: (propriedades) => {
        const mapa: Record<string, Propriedade | undefined> = { ...this.propriedadesPorId() };
        propriedades.forEach((propriedade, indice) => (mapa[idsFaltantes[indice]] = propriedade));
        this.propriedadesPorId.set(mapa);
      },
      error: () => undefined
    });
  }

  private limparHistorico(): void {
    this.historico.set(null);
    this.erroHistorico.set(null);
    this.consultandoHistorico.set(false);
    this.historicoForm.reset({ data: '' });
  }

  private tratarErro(erro: AppError): void {
    const naoMapeados = aplicarErrosDoServidor(this.form, erro);
    this.pendencias.set(erro.campos ? [...camposPendentes(this.form, ROTULOS), ...naoMapeados] : []);
    this.erro.set(erro.campos ? null : erro);
    this.salvando.set(false);
  }
}
