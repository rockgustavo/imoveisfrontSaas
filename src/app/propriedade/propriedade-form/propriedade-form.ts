import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Keycloak from 'keycloak-js';
import { merge } from 'rxjs';

import { AppError } from '../../core/app-error.model';
import { Pessoa } from '../../pessoa/pessoa.model';
import { PessoaService } from '../../pessoa/pessoa.service';
import { CampoErro } from '../../shared/components/campo-erro/campo-erro';
import { ResumoValidacao } from '../../shared/components/resumo-validacao/resumo-validacao';
import { CampoPendente, camposPendentes } from '../../shared/validators/campos-pendentes';
import {
  aplicarErrosDoServidor,
  campoInvalido,
  limparErrosDoServidor
} from '../../shared/validators/erros-do-servidor';
import { maiorQueZero } from '../../shared/validators/maior-que-zero.validator';
import { CepService } from '../cep.service';
import {
  Propriedade,
  ResultadoPesquisaGeolocalizacao,
  SalvarPropriedadeComando,
  TipoPropriedade
} from '../propriedade.model';
import { PropriedadeService } from '../propriedade.service';

const ROTULOS: Record<string, string> = {
  proprietarioId: 'Proprietário',
  tipo: 'Tipo',
  areaPrivativa: 'Área privativa',
  quartos: 'Quartos',
  vagas: 'Vagas',
  valorReferencia: 'Valor de referência',
  cep: 'CEP',
  logradouro: 'Logradouro',
  numero: 'Número',
  bairro: 'Bairro',
  localidade: 'Cidade',
  uf: 'UF'
};

@Component({
  selector: 'app-propriedade-form',
  imports: [ReactiveFormsModule, RouterLink, CampoErro, ResumoValidacao],
  templateUrl: './propriedade-form.html',
  styleUrl: './propriedade-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropriedadeForm {
  private readonly service = inject(PropriedadeService);
  private readonly cepService = inject(CepService);
  private readonly pessoaService = inject(PessoaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly keycloak = inject(Keycloak);

  protected readonly propriedadeId = signal<string | null>(null);
  protected readonly propriedade = signal<Propriedade | null>(null);
  protected readonly proprietarios = signal<Pessoa[]>([]);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<AppError | null>(null);
  protected readonly pendencias = signal<CampoPendente[]>([]);
  protected readonly enderecoValidado = signal(false);
  protected readonly consultandoCep = signal(false);
  protected readonly cepNaoEncontrado = signal(false);
  protected readonly pesquisandoGeolocalizacao = signal(false);
  protected readonly resultadoGeolocalizacao = signal<ResultadoPesquisaGeolocalizacao | null>(null);

  protected readonly form = new FormGroup({
    proprietarioId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipo: new FormControl<TipoPropriedade>('APARTAMENTO', { nonNullable: true }),
    areaPrivativa: new FormControl<number | null>(null, [maiorQueZero]),
    quartos: new FormControl<number | null>(null),
    vagas: new FormControl<number | null>(null),
    valorReferencia: new FormControl<number | null>(null, [Validators.required, maiorQueZero]),
    cep: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    logradouro: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    numero: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    complemento: new FormControl('', { nonNullable: true }),
    bairro: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    localidade: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    uf: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  protected get modoEdicao(): boolean {
    return this.propriedadeId() !== null;
  }

  protected get podeRetirar(): boolean {
    return this.propriedade()?.situacao === 'DISPONIVEL';
  }

  protected get podeReservar(): boolean {
    return this.propriedade()?.situacao === 'AGENCIADA';
  }

  protected get podeDesfazerReserva(): boolean {
    return this.propriedade()?.situacao === 'RESERVADA';
  }

  protected get podeVender(): boolean {
    return this.propriedade()?.situacao === 'RESERVADA';
  }

  protected invalido(campo: string): boolean {
    return campoInvalido(this.form, campo);
  }

  constructor() {
    this.pessoaService
      .listar({ papel: 'PROPRIETARIO', ativo: true }, 0, 100)
      .subscribe({ next: (resultado) => this.proprietarios.set(resultado.content) });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propriedadeId.set(id);
      this.carregarPropriedade(id);
    }

    merge(
      this.form.controls.cep.valueChanges,
      this.form.controls.logradouro.valueChanges,
      this.form.controls.numero.valueChanges,
      this.form.controls.bairro.valueChanges,
      this.form.controls.localidade.valueChanges,
      this.form.controls.uf.valueChanges
    ).subscribe(() => this.resultadoGeolocalizacao.set(null));
  }

  protected buscarCep(): void {
    const cep = this.form.controls.cep.value;
    if (!cep) {
      return;
    }

    this.consultandoCep.set(true);
    this.cepNaoEncontrado.set(false);

    this.cepService.consultar(cep).subscribe({
      next: (resultado) => {
        this.consultandoCep.set(false);
        if (!resultado.encontrado) {
          this.cepNaoEncontrado.set(true);
          this.enderecoValidado.set(false);
          return;
        }
        this.enderecoValidado.set(true);
        this.form.patchValue({
          logradouro: resultado.logradouro ?? '',
          bairro: resultado.bairro ?? '',
          localidade: resultado.localidade ?? '',
          uf: resultado.uf ?? ''
        });
      },
      error: (erro: AppError) => {
        this.consultandoCep.set(false);
        this.erro.set(erro);
      }
    });
  }

  protected buscarLocalizacao(): void {
    const valores = this.form.getRawValue();
    if (!valores.cep || !valores.logradouro || !valores.numero || !valores.localidade || !valores.uf) {
      return;
    }

    this.pesquisandoGeolocalizacao.set(true);
    this.resultadoGeolocalizacao.set(null);

    this.service
      .pesquisarGeolocalizacao({
        cep: valores.cep,
        logradouro: valores.logradouro,
        numero: valores.numero,
        bairro: valores.bairro,
        localidade: valores.localidade,
        uf: valores.uf
      })
      .subscribe({
        next: (resultado) => {
          this.resultadoGeolocalizacao.set(resultado);
          this.pesquisandoGeolocalizacao.set(false);
        },
        error: (erro: AppError) => {
          this.erro.set(erro);
          this.pesquisandoGeolocalizacao.set(false);
        }
      });
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
    const comando = this.paraComando();

    if (this.modoEdicao) {
      this.service.atualizar(this.propriedadeId()!, comando).subscribe({
        next: (propriedade) => {
          this.propriedade.set(propriedade);
          this.resultadoGeolocalizacao.set(null);
          this.salvando.set(false);
        },
        error: (erro: AppError) => this.tratarErro(erro)
      });
      return;
    }

    this.service.criar(comando).subscribe({
      next: (id) => this.router.navigate(['/propriedades', id]),
      error: (erro: AppError) => this.tratarErro(erro)
    });
  }

  protected retirar(): void {
    const id = this.propriedadeId();
    if (!id || !confirm('Retirar esta propriedade de disponibilidade?')) {
      return;
    }
    this.service.retirar(id).subscribe({
      next: (propriedade) => this.propriedade.set(propriedade),
      error: (erro: AppError) => this.erro.set(erro)
    });
  }

  protected reservar(): void {
    const id = this.propriedadeId();
    if (!id) {
      return;
    }
    this.service.reservar(id).subscribe({
      next: (propriedade) => this.propriedade.set(propriedade),
      error: (erro: AppError) => this.erro.set(erro)
    });
  }

  protected desfazerReserva(): void {
    const id = this.propriedadeId();
    if (!id) {
      return;
    }
    this.service.desfazerReserva(id).subscribe({
      next: (propriedade) => this.propriedade.set(propriedade),
      error: (erro: AppError) => this.erro.set(erro)
    });
  }

  protected vender(): void {
    const id = this.propriedadeId();
    if (!id || !confirm('Marcar esta propriedade como vendida? Não há como desfazer.')) {
      return;
    }
    this.service.vender(id).subscribe({
      next: (propriedade) => this.propriedade.set(propriedade),
      error: (erro: AppError) => this.erro.set(erro)
    });
  }

  private carregarPropriedade(id: string): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.service.buscarPorId(id).subscribe({
      next: (propriedade) => {
        this.propriedade.set(propriedade);
        this.enderecoValidado.set(propriedade.enderecoValidado);
        this.form.patchValue({
          proprietarioId: propriedade.proprietarioId,
          tipo: propriedade.tipo,
          areaPrivativa: propriedade.areaPrivativa,
          quartos: propriedade.quartos,
          vagas: propriedade.vagas,
          valorReferencia: Number(propriedade.valorReferencia),
          cep: propriedade.cep,
          logradouro: propriedade.logradouro,
          numero: propriedade.numero,
          complemento: propriedade.complemento ?? '',
          bairro: propriedade.bairro,
          localidade: propriedade.localidade,
          uf: propriedade.uf
        });
        this.carregando.set(false);
      },
      error: (erro: AppError) => {
        this.erro.set(erro);
        this.carregando.set(false);
      }
    });
  }

  private tratarErro(erro: AppError): void {
    const naoMapeados = aplicarErrosDoServidor(this.form, erro);
    this.pendencias.set(erro.campos ? [...camposPendentes(this.form, ROTULOS), ...naoMapeados] : []);
    this.erro.set(erro.campos ? null : erro);
    this.salvando.set(false);
  }

  private paraComando(): SalvarPropriedadeComando {
    const valores = this.form.getRawValue();
    const resultado = this.resultadoGeolocalizacao();
    return {
      proprietarioId: valores.proprietarioId,
      tipo: valores.tipo,
      areaPrivativa: valores.areaPrivativa ?? undefined,
      quartos: valores.quartos ?? undefined,
      vagas: valores.vagas ?? undefined,
      valorReferencia: valores.valorReferencia!,
      cep: valores.cep,
      logradouro: valores.logradouro,
      numero: valores.numero,
      complemento: valores.complemento || undefined,
      bairro: valores.bairro,
      localidade: valores.localidade,
      uf: valores.uf,
      enderecoValidado: this.enderecoValidado(),
      latitude: resultado?.encontrada ? (resultado.latitude ?? undefined) : undefined,
      longitude: resultado?.encontrada ? (resultado.longitude ?? undefined) : undefined
    };
  }
}
