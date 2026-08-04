import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Keycloak from 'keycloak-js';

import { AppError } from '../../core/app-error.model';
import { Pessoa } from '../../pessoa/pessoa.model';
import { PessoaService } from '../../pessoa/pessoa.service';
import { PropriedadeResumo } from '../../propriedade/propriedade.model';
import { PropriedadeService } from '../../propriedade/propriedade.service';
import { CampoErro } from '../../shared/components/campo-erro/campo-erro';
import { ResumoValidacao } from '../../shared/components/resumo-validacao/resumo-validacao';
import { CampoPendente, camposPendentes } from '../../shared/validators/campos-pendentes';
import {
  aplicarErrosDoServidor,
  campoInvalido,
  limparErrosDoServidor
} from '../../shared/validators/erros-do-servidor';
import { maiorQueZero } from '../../shared/validators/maior-que-zero.validator';
import { Orcamento } from '../orcamento.model';
import { OrcamentoService } from '../orcamento.service';

const ROTULOS: Record<string, string> = {
  pessoaId: 'Proprietário',
  itens: 'Itens'
};

type ItemForm = FormGroup<{
  propriedadeId: FormControl<string>;
  comissaoPercentual: FormControl<number | null>;
  valorPedido: FormControl<number | null>;
}>;

@Component({
  selector: 'app-orcamento-form',
  imports: [ReactiveFormsModule, RouterLink, CampoErro, ResumoValidacao],
  templateUrl: './orcamento-form.html',
  styleUrl: './orcamento-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrcamentoForm {
  private readonly service = inject(OrcamentoService);
  private readonly pessoaService = inject(PessoaService);
  private readonly propriedadeService = inject(PropriedadeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly keycloak = inject(Keycloak);

  protected readonly orcamentoId = signal<string | null>(null);
  protected readonly orcamento = signal<Orcamento | null>(null);
  protected readonly proprietarios = signal<Pessoa[]>([]);
  protected readonly propriedadesDisponiveis = signal<PropriedadeResumo[]>([]);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<AppError | null>(null);
  protected readonly pendencias = signal<CampoPendente[]>([]);

  protected readonly form = new FormGroup({
    pessoaId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    itens: new FormArray<ItemForm>([])
  });

  protected get modoEdicao(): boolean {
    return this.orcamentoId() !== null;
  }

  protected get itensArray(): FormArray<ItemForm> {
    return this.form.controls.itens;
  }

  protected get podeEditarItens(): boolean {
    return !this.modoEdicao || this.orcamento()?.status === 'RASCUNHO';
  }

  protected get podeEnviar(): boolean {
    return this.orcamento()?.status === 'RASCUNHO';
  }

  protected get podeAceitar(): boolean {
    return this.orcamento()?.status === 'ENVIADO';
  }

  protected get podeRecusar(): boolean {
    return this.orcamento()?.status === 'ENVIADO';
  }

  protected invalido(campo: string): boolean {
    return campoInvalido(this.form, campo);
  }

  protected itemInvalido(index: number, campo: string): boolean {
    const control = this.itensArray.at(index).get(campo);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  constructor() {
    this.pessoaService
      .listar({ papel: 'PROPRIETARIO', ativo: true }, 0, 100)
      .subscribe({ next: (resultado) => this.proprietarios.set(resultado.content) });

    this.form.controls.pessoaId.valueChanges.subscribe((pessoaId) => this.carregarPropriedadesDoProprietario(pessoaId));

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.orcamentoId.set(id);
      if (id) {
        this.carregarOrcamento(id);
      } else {
        this.iniciarNovoOrcamento();
      }
    });
  }

  private iniciarNovoOrcamento(): void {
    this.orcamento.set(null);
    this.erro.set(null);
    this.pendencias.set([]);
    this.form.reset({ pessoaId: '' });
    this.form.controls.pessoaId.enable();
    this.itensArray.clear();
    this.adicionarItem();
  }

  protected adicionarItem(): void {
    this.itensArray.push(this.novoItemGroup());
  }

  protected removerItem(index: number): void {
    this.itensArray.removeAt(index);
  }

  protected salvar(): void {
    limparErrosDoServidor(this.form);
    if (this.form.invalid || this.itensArray.length === 0) {
      this.form.markAllAsTouched();
      this.pendencias.set(camposPendentes(this.form, ROTULOS));
      return;
    }

    this.pendencias.set([]);
    this.salvando.set(true);
    this.erro.set(null);
    const itens = this.itensArray.getRawValue().map((item) => ({
      propriedadeId: item.propriedadeId,
      comissaoPercentual: item.comissaoPercentual!,
      valorPedido: item.valorPedido!
    }));

    if (this.modoEdicao) {
      this.service.atualizar(this.orcamentoId()!, { itens }).subscribe({
        next: (orcamento) => {
          this.orcamento.set(orcamento);
          this.salvando.set(false);
        },
        error: (erro: AppError) => this.tratarErro(erro)
      });
      return;
    }

    this.service.criar({ pessoaId: this.form.controls.pessoaId.value, itens }).subscribe({
      next: (id) => this.router.navigate(['/orcamentos', id]),
      error: (erro: AppError) => this.tratarErro(erro)
    });
  }

  protected enviar(): void {
    const id = this.orcamentoId();
    if (!id) {
      return;
    }
    this.service.enviar(id).subscribe({
      next: (orcamento) => this.orcamento.set(orcamento),
      error: (erro: AppError) => this.erro.set(erro)
    });
  }

  protected aceitar(): void {
    const id = this.orcamentoId();
    if (!id) {
      return;
    }
    this.service.aceitar(id).subscribe({
      next: (orcamento) => this.orcamento.set(orcamento),
      error: (erro: AppError) => this.erro.set(erro)
    });
  }

  protected recusar(): void {
    const id = this.orcamentoId();
    if (!id) {
      return;
    }
    this.service.recusar(id).subscribe({
      next: (orcamento) => this.orcamento.set(orcamento),
      error: (erro: AppError) => this.erro.set(erro)
    });
  }

  protected duplicar(): void {
    const id = this.orcamentoId();
    if (!id || !confirm('Duplicar este orçamento em uma nova versão RASCUNHO?')) {
      return;
    }
    this.service.duplicar(id).subscribe({
      next: (novoId) => this.router.navigate(['/orcamentos', novoId]),
      error: (erro: AppError) => this.erro.set(erro)
    });
  }

  private carregarOrcamento(id: string): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.service.buscarPorId(id).subscribe({
      next: (orcamento) => {
        this.orcamento.set(orcamento);
        this.form.patchValue({ pessoaId: orcamento.pessoaId });
        this.form.controls.pessoaId.disable();
        this.itensArray.clear();
        orcamento.itens.forEach(() => this.itensArray.push(this.novoItemGroup()));
        this.itensArray.patchValue(
          orcamento.itens.map((item) => ({
            propriedadeId: item.propriedadeId,
            comissaoPercentual: Number(item.comissaoPercentual),
            valorPedido: Number(item.valorPedido)
          }))
        );
        if (orcamento.status === 'RASCUNHO') {
          this.itensArray.enable();
        } else {
          this.itensArray.disable();
        }
        this.carregando.set(false);
      },
      error: (erro: AppError) => {
        this.erro.set(erro);
        this.carregando.set(false);
      }
    });
  }

  private carregarPropriedadesDoProprietario(pessoaId: string): void {
    if (!pessoaId) {
      this.propriedadesDisponiveis.set([]);
      return;
    }
    this.propriedadeService
      .listar({ proprietarioId: pessoaId, situacao: 'DISPONIVEL' }, 0, 100)
      .subscribe({ next: (resultado) => this.propriedadesDisponiveis.set(resultado.content) });
  }

  private novoItemGroup(): ItemForm {
    return new FormGroup({
      propriedadeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      comissaoPercentual: new FormControl<number | null>(null, [Validators.required, maiorQueZero]),
      valorPedido: new FormControl<number | null>(null, [Validators.required, maiorQueZero])
    });
  }

  private tratarErro(erro: AppError): void {
    const naoMapeados = aplicarErrosDoServidor(this.form, erro);
    this.pendencias.set(erro.campos ? [...camposPendentes(this.form, ROTULOS), ...naoMapeados] : []);
    this.erro.set(erro.campos ? null : erro);
    this.salvando.set(false);
  }
}
