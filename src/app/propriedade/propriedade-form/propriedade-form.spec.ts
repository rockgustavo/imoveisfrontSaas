import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import Keycloak from 'keycloak-js';
import { of, throwError } from 'rxjs';

import { AppError } from '../../core/app-error.model';
import { Pessoa } from '../../pessoa/pessoa.model';
import { PessoaService } from '../../pessoa/pessoa.service';
import { CepService } from '../cep.service';
import { Propriedade } from '../propriedade.model';
import { PropriedadeService } from '../propriedade.service';
import { PropriedadeForm } from './propriedade-form';

const proprietarioExemplo: Pessoa = {
  id: '019fc00d-c808-7759-ba91-903f935ae2c5',
  tipoDocumento: 'CPF',
  documento: '52998224725',
  nome: 'Proprietário Teste',
  email: null,
  ativo: true,
  papeis: ['PROPRIETARIO'],
  classificacao: 'CLIENTE',
  criadoEm: '2026-08-01T00:00:00Z',
  alteradoEm: '2026-08-01T00:00:00Z'
};

const propriedadeExemplo: Propriedade = {
  id: '019fc00d-c808-7759-ba91-903f935ae2c4',
  proprietarioId: proprietarioExemplo.id,
  tipo: 'APARTAMENTO',
  areaPrivativa: 85.5,
  quartos: 3,
  vagas: 1,
  valorReferencia: '450000.00',
  situacao: 'DISPONIVEL',
  cep: '01310100',
  logradouro: 'Av. Paulista',
  numero: '1000',
  complemento: null,
  bairro: 'Bela Vista',
  localidade: 'São Paulo',
  uf: 'SP',
  enderecoValidado: true,
  latitude: null,
  longitude: null,
  geoSituacao: 'PENDENTE',
  criadoEm: '2026-08-01T00:00:00Z',
  alteradoEm: '2026-08-01T00:00:00Z'
};

function configurar(id: string | null) {
  const service = {
    buscarPorId: vi.fn().mockReturnValue(of(propriedadeExemplo)),
    criar: vi.fn().mockReturnValue(of(propriedadeExemplo.id)),
    atualizar: vi.fn().mockReturnValue(of(propriedadeExemplo)),
    retirar: vi.fn().mockReturnValue(of({ ...propriedadeExemplo, situacao: 'RETIRADA' })),
    reservar: vi.fn().mockReturnValue(of({ ...propriedadeExemplo, situacao: 'RESERVADA' })),
    desfazerReserva: vi.fn().mockReturnValue(of({ ...propriedadeExemplo, situacao: 'AGENCIADA' })),
    vender: vi.fn().mockReturnValue(of({ ...propriedadeExemplo, situacao: 'VENDIDA' }))
  };
  const cepService = { consultar: vi.fn() };
  const pessoaService = {
    listar: vi
      .fn()
      .mockReturnValue(of({ content: [proprietarioExemplo], page: 0, size: 100, totalElements: 1, totalPages: 1 }))
  };
  const router = { navigate: vi.fn() };
  const keycloak = { hasRealmRole: (_papel: string) => true } as Keycloak;

  TestBed.configureTestingModule({
    imports: [PropriedadeForm],
    providers: [
      { provide: PropriedadeService, useValue: service },
      { provide: CepService, useValue: cepService },
      { provide: PessoaService, useValue: pessoaService },
      { provide: Router, useValue: router },
      { provide: Keycloak, useValue: keycloak },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } }
    ]
  });

  const fixture = TestBed.createComponent(PropriedadeForm);
  return { fixture, component: fixture.componentInstance, service, cepService, pessoaService, router };
}

function preencherFormularioValido(component: PropriedadeForm): void {
  component['form'].patchValue({
    proprietarioId: proprietarioExemplo.id,
    tipo: 'APARTAMENTO',
    valorReferencia: 450000,
    cep: '01310100',
    logradouro: 'Av. Paulista',
    numero: '1000',
    bairro: 'Bela Vista',
    localidade: 'São Paulo',
    uf: 'SP'
  });
}

describe('PropriedadeForm — modo criação', () => {
  it('carrega proprietários com papel PROPRIETARIO e situação ativa', () => {
    const { pessoaService } = configurar(null);
    expect(pessoaService.listar).toHaveBeenCalledWith({ papel: 'PROPRIETARIO', ativo: true }, 0, 100);
  });

  it('não carrega propriedade nem chama buscarPorId', () => {
    const { component, service } = configurar(null);
    expect(component['modoEdicao']).toBe(false);
    expect(service.buscarPorId).not.toHaveBeenCalled();
  });

  it('não envia quando o formulário é inválido', () => {
    const { component, service } = configurar(null);
    component['salvar']();
    expect(service.criar).not.toHaveBeenCalled();
    expect(component['form'].touched).toBe(true);
  });

  it('cria a propriedade e navega para o detalhe ao salvar com sucesso, com enderecoValidado=false por padrão', () => {
    const { component, service, router } = configurar(null);
    preencherFormularioValido(component);

    component['salvar']();

    expect(service.criar).toHaveBeenCalledWith(
      expect.objectContaining({ proprietarioId: proprietarioExemplo.id, enderecoValidado: false })
    );
    expect(router.navigate).toHaveBeenCalledWith(['/propriedades', propriedadeExemplo.id]);
  });

  it('preenche o endereço e marca enderecoValidado=true quando o CEP é encontrado', () => {
    const { component, cepService } = configurar(null);
    cepService.consultar.mockReturnValue(
      of({
        cep: '01310100',
        encontrado: true,
        logradouro: 'Av. Paulista',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
        latitude: null,
        longitude: null
      })
    );
    component['form'].patchValue({ cep: '01310100' });

    component['buscarCep']();

    expect(component['enderecoValidado']()).toBe(true);
    expect(component['form'].getRawValue().logradouro).toBe('Av. Paulista');
    expect(component['cepNaoEncontrado']()).toBe(false);
  });

  it('marca cepNaoEncontrado e enderecoValidado=false quando o CEP não é encontrado', () => {
    const { component, cepService } = configurar(null);
    cepService.consultar.mockReturnValue(
      of({
        cep: '99999999',
        encontrado: false,
        logradouro: null,
        bairro: null,
        localidade: null,
        uf: null,
        latitude: null,
        longitude: null
      })
    );
    component['form'].patchValue({ cep: '99999999' });

    component['buscarCep']();

    expect(component['cepNaoEncontrado']()).toBe(true);
    expect(component['enderecoValidado']()).toBe(false);
  });

  it('transforma o erro de campo vindo do backend em pendência, sem alerta genérico', () => {
    const { component, service } = configurar(null);
    service.criar.mockReturnValue(
      throwError(() => ({
        status: 400,
        title: 'Bad Request',
        detail: 'Payload inválido',
        codigo: 'PAYLOAD_INVALIDO',
        campos: { numero: 'Campo obrigatório' }
      }))
    );
    preencherFormularioValido(component);

    component['salvar']();

    expect(component['pendencias']()).toContainEqual({
      rotulo: 'Número',
      mensagem: 'Campo obrigatório',
      obrigatorio: false
    });
    expect(component['erro']()).toBeNull();
  });

  it('expõe o erro normalizado quando a criação falha com erro de negócio', () => {
    const { component, service } = configurar(null);
    const erro: AppError = {
      status: 422,
      title: 'Proprietário inválido',
      detail: 'proprietário precisa ter papel PROPRIETARIO'
    };
    service.criar.mockReturnValue(throwError(() => erro));
    preencherFormularioValido(component);

    component['salvar']();

    expect(component['erro']()).toEqual(erro);
    expect(component['salvando']()).toBe(false);
  });
});

describe('PropriedadeForm — modo edição', () => {
  it('carrega a propriedade e preenche o formulário', () => {
    const { component, service } = configurar(propriedadeExemplo.id);

    expect(service.buscarPorId).toHaveBeenCalledWith(propriedadeExemplo.id);
    expect(component['form'].getRawValue().proprietarioId).toBe(proprietarioExemplo.id);
    expect(component['form'].getRawValue().valorReferencia).toBe(450000);
    expect(component['enderecoValidado']()).toBe(true);
  });

  it('atualiza a propriedade ao salvar', () => {
    const { component, service } = configurar(propriedadeExemplo.id);

    component['salvar']();

    expect(service.atualizar).toHaveBeenCalledWith(
      propriedadeExemplo.id,
      expect.objectContaining({ tipo: 'APARTAMENTO' })
    );
  });

  it('permite retirar quando a situação é DISPONIVEL', () => {
    const { component } = configurar(propriedadeExemplo.id);
    expect(component['podeRetirar']).toBe(true);
    expect(component['podeReservar']).toBe(false);
    expect(component['podeDesfazerReserva']).toBe(false);
    expect(component['podeVender']).toBe(false);
  });

  it('retira a propriedade após confirmação, atualizando o estado local', () => {
    const { component, service } = configurar(propriedadeExemplo.id);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));

    component['retirar']();

    expect(service.retirar).toHaveBeenCalledWith(propriedadeExemplo.id);
    expect(component['propriedade']()?.situacao).toBe('RETIRADA');

    vi.unstubAllGlobals();
  });

  it('não retira quando a confirmação é negada', () => {
    const { component, service } = configurar(propriedadeExemplo.id);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));

    component['retirar']();

    expect(service.retirar).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('vende a propriedade após confirmação', () => {
    const { component, service } = configurar(propriedadeExemplo.id);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));

    component['vender']();

    expect(service.vender).toHaveBeenCalledWith(propriedadeExemplo.id);
    expect(component['propriedade']()?.situacao).toBe('VENDIDA');

    vi.unstubAllGlobals();
  });
});
