import { ChangeDetectionStrategy, Component, WritableSignal, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Keycloak from 'keycloak-js';

import { AppError } from '../../core/app-error.model';
import { CampoErro } from '../../shared/components/campo-erro/campo-erro';
import { ResumoValidacao } from '../../shared/components/resumo-validacao/resumo-validacao';
import { CampoPendente, camposPendentes } from '../../shared/validators/campos-pendentes';
import { CustomValidators } from '../../shared/validators/custom-validators';
import {
  aplicarErrosDoServidor,
  campoInvalido,
  limparErrosDoServidor
} from '../../shared/validators/erros-do-servidor';
import { AtualizarPessoaComando, CriarPessoaComando, Papel, Pessoa, TipoDocumento } from '../pessoa.model';
import { PessoaService } from '../pessoa.service';

const ROTULOS_PAPEL: Record<string, string> = { papel: 'Papel', email: 'E-mail' };

@Component({
  selector: 'app-pessoa-form',
  imports: [ReactiveFormsModule, RouterLink, CampoErro, ResumoValidacao],
  templateUrl: './pessoa-form.html',
  styleUrl: './pessoa-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PessoaForm {
  private readonly service = inject(PessoaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly keycloak = inject(Keycloak);

  protected readonly pessoaId = signal<string | null>(null);
  protected readonly pessoa = signal<Pessoa | null>(null);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<AppError | null>(null);
  protected readonly pendencias = signal<CampoPendente[]>([]);
  protected readonly pendenciasPapel = signal<CampoPendente[]>([]);

  protected readonly form = new FormGroup({
    tipoDocumento: new FormControl<TipoDocumento>('CPF', { nonNullable: true }),
    documento: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, CustomValidators.documento('tipoDocumento')]
    }),
    nome: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] })
  });

  protected readonly papelForm = new FormGroup({
    papel: new FormControl<Papel>('PROPRIETARIO', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] })
  });

  protected get modoEdicao(): boolean {
    return this.pessoaId() !== null;
  }

  protected get podeGerenciar(): boolean {
    return this.keycloak.hasRealmRole('ADMINISTRADOR');
  }

  protected invalido(campo: string): boolean {
    return campoInvalido(this.form, campo);
  }

  protected invalidoNoPapel(campo: string): boolean {
    return campoInvalido(this.papelForm, campo);
  }

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.pessoaId.set(id);
      this.carregarPessoa(id);
    }
  }

  protected salvar(): void {
    limparErrosDoServidor(this.form);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.pendencias.set(camposPendentes(this.form, this.rotulos()));
      return;
    }

    this.pendencias.set([]);
    this.salvando.set(true);
    this.erro.set(null);

    if (this.modoEdicao) {
      this.service.atualizar(this.pessoaId()!, this.paraAtualizarComando()).subscribe({
        next: (pessoa) => {
          this.pessoa.set(pessoa);
          this.salvando.set(false);
        },
        error: (erro: AppError) => this.tratarErro(erro, this.form, this.rotulos(), this.pendencias)
      });
      return;
    }

    this.service.criar(this.paraCriarComando()).subscribe({
      next: (id) => this.router.navigate(['/pessoas', id]),
      error: (erro: AppError) => this.tratarErro(erro, this.form, this.rotulos(), this.pendencias)
    });
  }

  protected atribuirPapel(): void {
    const id = this.pessoaId();
    limparErrosDoServidor(this.papelForm);
    if (!id || this.papelForm.invalid) {
      this.papelForm.markAllAsTouched();
      this.pendenciasPapel.set(camposPendentes(this.papelForm, ROTULOS_PAPEL));
      return;
    }

    this.pendenciasPapel.set([]);
    this.salvando.set(true);
    this.erro.set(null);
    const valores = this.papelForm.getRawValue();

    this.service.atribuirPapel(id, { papel: valores.papel, email: valores.email || undefined }).subscribe({
      next: (pessoa) => {
        this.pessoa.set(pessoa);
        this.salvando.set(false);
        this.papelForm.reset({ papel: 'PROPRIETARIO', email: '' });
      },
      error: (erro: AppError) => this.tratarErro(erro, this.papelForm, ROTULOS_PAPEL, this.pendenciasPapel)
    });
  }

  protected removerPapel(papel: Papel): void {
    const id = this.pessoaId();
    if (!id || !confirm(`Remover o papel ${papel} desta pessoa?`)) {
      return;
    }

    this.service.removerPapel(id, papel).subscribe({
      next: () =>
        this.pessoa.update((atual) => (atual ? { ...atual, papeis: atual.papeis.filter((p) => p !== papel) } : atual)),
      error: (erro: AppError) => this.erro.set(erro)
    });
  }

  protected inativar(): void {
    const id = this.pessoaId();
    if (
      !id ||
      !confirm(
        'Inativar esta pessoa? Ela deixa de poder ser proprietária de novos imóveis ou receber novos orçamentos.'
      )
    ) {
      return;
    }

    this.service.inativar(id).subscribe({
      next: () => this.pessoa.update((atual) => (atual ? { ...atual, ativo: false } : atual)),
      error: (erro: AppError) => this.erro.set(erro)
    });
  }

  private carregarPessoa(id: string): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.service.buscarPorId(id).subscribe({
      next: (pessoa) => {
        this.pessoa.set(pessoa);
        this.form.patchValue({
          tipoDocumento: pessoa.tipoDocumento,
          documento: pessoa.documento,
          nome: pessoa.nome,
          email: pessoa.email ?? ''
        });
        this.form.controls.tipoDocumento.disable();
        this.form.controls.documento.disable();
        this.carregando.set(false);
      },
      error: (erro: AppError) => {
        this.erro.set(erro);
        this.carregando.set(false);
      }
    });
  }

  private rotulos(): Record<string, string> {
    return { documento: this.form.getRawValue().tipoDocumento, nome: 'Nome', email: 'E-mail' };
  }

  private tratarErro(
    erro: AppError,
    form: FormGroup,
    rotulos: Record<string, string>,
    pendencias: WritableSignal<CampoPendente[]>
  ): void {
    const naoMapeados = aplicarErrosDoServidor(form, erro);
    pendencias.set(erro.campos ? [...camposPendentes(form, rotulos), ...naoMapeados] : []);
    this.erro.set(erro.campos ? null : erro);
    this.salvando.set(false);
  }

  private paraCriarComando(): CriarPessoaComando {
    const valores = this.form.getRawValue();
    return {
      tipoDocumento: valores.tipoDocumento,
      documento: valores.documento,
      nome: valores.nome,
      email: valores.email || undefined
    };
  }

  private paraAtualizarComando(): AtualizarPessoaComando {
    const valores = this.form.getRawValue();
    return { nome: valores.nome, email: valores.email || undefined };
  }
}
