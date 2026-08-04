import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import Keycloak from 'keycloak-js';
import { Subject, of, throwError } from 'rxjs';

import { AppError } from '../../core/app-error.model';
import { Pessoa } from '../../pessoa/pessoa.model';
import { PessoaService } from '../../pessoa/pessoa.service';
import { PropriedadeResumo } from '../../propriedade/propriedade.model';
import { PropriedadeService } from '../../propriedade/propriedade.service';
import { Orcamento } from '../orcamento.model';
import { OrcamentoService } from '../orcamento.service';
import { OrcamentoForm } from './orcamento-form';

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

const propriedadeExemplo: PropriedadeResumo = {
  id: '019fc00d-c808-7759-ba91-903f935ae2c6',
  proprietarioId: proprietarioExemplo.id,
  tipo: 'APARTAMENTO',
  valorReferencia: '450000.00',
  situacao: 'DISPONIVEL',
  logradouro: 'Av. Paulista',
  bairro: 'Bela Vista',
  localidade: 'São Paulo',
  uf: 'SP',
  latitude: null,
  longitude: null,
  geoSituacao: 'PENDENTE',
  criadoEm: '2026-08-01T00:00:00Z'
};

const orcamentoExemplo: Orcamento = {
  id: '019fc00d-c808-7759-ba91-903f935ae2c4',
  pessoaId: proprietarioExemplo.id,
  status: 'RASCUNHO',
  validade: '2026-08-20',
  origemId: null,
  versao: 1,
  itens: [{ propriedadeId: propriedadeExemplo.id, comissaoPercentual: '5.00', valorPedido: '450000.00' }],
  criadoEm: '2026-08-01T00:00:00Z',
  alteradoEm: '2026-08-01T00:00:00Z'
};

function configurar(id: string | null, orcamentoParaCarregar: Orcamento = orcamentoExemplo) {
  const service = {
    buscarPorId: vi.fn().mockReturnValue(of(orcamentoParaCarregar)),
    criar: vi.fn().mockReturnValue(of(orcamentoExemplo.id)),
    atualizar: vi.fn().mockReturnValue(of(orcamentoExemplo)),
    enviar: vi.fn().mockReturnValue(of({ ...orcamentoExemplo, status: 'ENVIADO' })),
    aceitar: vi.fn().mockReturnValue(of({ ...orcamentoExemplo, status: 'ACEITO' })),
    recusar: vi.fn().mockReturnValue(of({ ...orcamentoExemplo, status: 'RECUSADO' })),
    duplicar: vi.fn().mockReturnValue(of('019fc00d-c808-7759-ba91-903f935ae2c7'))
  };
  const pessoaService = {
    listar: vi
      .fn()
      .mockReturnValue(of({ content: [proprietarioExemplo], page: 0, size: 100, totalElements: 1, totalPages: 1 }))
  };
  const propriedadeService = {
    listar: vi
      .fn()
      .mockReturnValue(of({ content: [propriedadeExemplo], page: 0, size: 100, totalElements: 1, totalPages: 1 }))
  };
  const router = { navigate: vi.fn() };
  const keycloak = { hasRealmRole: (_papel: string) => true } as Keycloak;

  TestBed.configureTestingModule({
    imports: [OrcamentoForm],
    providers: [
      { provide: OrcamentoService, useValue: service },
      { provide: PessoaService, useValue: pessoaService },
      { provide: PropriedadeService, useValue: propriedadeService },
      { provide: Router, useValue: router },
      { provide: Keycloak, useValue: keycloak },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: convertToParamMap(id ? { id } : {}) },
          paramMap: of(convertToParamMap(id ? { id } : {}))
        }
      }
    ]
  });

  const fixture = TestBed.createComponent(OrcamentoForm);
  return { fixture, component: fixture.componentInstance, service, pessoaService, propriedadeService, router };
}

function preencherFormularioValido(component: OrcamentoForm): void {
  component['form'].patchValue({ pessoaId: proprietarioExemplo.id });
  component['itensArray'].at(0).patchValue({
    propriedadeId: propriedadeExemplo.id,
    comissaoPercentual: 5,
    valorPedido: 450000
  });
}

describe('OrcamentoForm — modo criação', () => {
  it('carrega proprietários com papel PROPRIETARIO e situação ativa', () => {
    const { pessoaService } = configurar(null);
    expect(pessoaService.listar).toHaveBeenCalledWith({ papel: 'PROPRIETARIO', ativo: true }, 0, 100);
  });

  it('começa com um item vazio e não busca orçamento', () => {
    const { component, service } = configurar(null);
    expect(component['modoEdicao']).toBe(false);
    expect(component['itensArray'].length).toBe(1);
    expect(service.buscarPorId).not.toHaveBeenCalled();
  });

  it('carrega propriedades disponíveis do proprietário selecionado', () => {
    const { component, propriedadeService } = configurar(null);

    component['form'].controls.pessoaId.setValue(proprietarioExemplo.id);

    expect(propriedadeService.listar).toHaveBeenCalledWith(
      { proprietarioId: proprietarioExemplo.id, situacao: 'DISPONIVEL' },
      0,
      100
    );
  });

  it('adiciona e remove itens', () => {
    const { component } = configurar(null);

    component['adicionarItem']();
    expect(component['itensArray'].length).toBe(2);

    component['removerItem'](0);
    expect(component['itensArray'].length).toBe(1);
  });

  it('não salva quando o formulário é inválido', () => {
    const { component, service } = configurar(null);
    component['salvar']();
    expect(service.criar).not.toHaveBeenCalled();
    expect(component['form'].touched).toBe(true);
  });

  it('cria o orçamento e navega para o detalhe ao salvar com sucesso', () => {
    const { component, service, router } = configurar(null);
    preencherFormularioValido(component);

    component['salvar']();

    expect(service.criar).toHaveBeenCalledWith({
      pessoaId: proprietarioExemplo.id,
      itens: [{ propriedadeId: propriedadeExemplo.id, comissaoPercentual: 5, valorPedido: 450000 }]
    });
    expect(router.navigate).toHaveBeenCalledWith(['/orcamentos', orcamentoExemplo.id]);
  });

  it('expõe o erro normalizado quando a criação falha com erro de negócio', () => {
    const { component, service } = configurar(null);
    const erro: AppError = { status: 422, title: 'Pessoa inativa', detail: 'pessoa precisa estar ativa' };
    service.criar.mockReturnValue(throwError(() => erro));
    preencherFormularioValido(component);

    component['salvar']();

    expect(component['erro']()).toEqual(erro);
    expect(component['salvando']()).toBe(false);
  });
});

describe('OrcamentoForm — modo edição', () => {
  it('carrega o orçamento e preenche o formulário', () => {
    const { component, service } = configurar(orcamentoExemplo.id);

    expect(service.buscarPorId).toHaveBeenCalledWith(orcamentoExemplo.id);
    expect(component['form'].getRawValue().pessoaId).toBe(proprietarioExemplo.id);
    expect(component['form'].controls.pessoaId.disabled).toBe(true);
    expect(component['itensArray'].length).toBe(1);
    expect(component['itensArray'].at(0).getRawValue().comissaoPercentual).toBe(5);
  });

  it('atualiza o orçamento ao salvar em RASCUNHO', () => {
    const { component, service } = configurar(orcamentoExemplo.id);

    component['salvar']();

    expect(service.atualizar).toHaveBeenCalledWith(
      orcamentoExemplo.id,
      expect.objectContaining({ itens: [{ propriedadeId: propriedadeExemplo.id, comissaoPercentual: 5, valorPedido: 450000 }] })
    );
  });

  it('desabilita os itens quando o orçamento não está mais em RASCUNHO', () => {
    const { component } = configurar(orcamentoExemplo.id, { ...orcamentoExemplo, status: 'ENVIADO' });

    expect(component['podeEditarItens']).toBe(false);
    expect(component['itensArray'].disabled).toBe(true);
  });

  it('permite enviar apenas quando RASCUNHO', () => {
    const { component } = configurar(orcamentoExemplo.id);
    expect(component['podeEnviar']).toBe(true);
    expect(component['podeAceitar']).toBe(false);
    expect(component['podeRecusar']).toBe(false);
  });

  it('envia o orçamento, atualizando o estado local', () => {
    const { component, service } = configurar(orcamentoExemplo.id);

    component['enviar']();

    expect(service.enviar).toHaveBeenCalledWith(orcamentoExemplo.id);
    expect(component['orcamento']()?.status).toBe('ENVIADO');
  });

  it('aceita o orçamento, atualizando o estado local', () => {
    const { component, service } = configurar(orcamentoExemplo.id);

    component['aceitar']();

    expect(service.aceitar).toHaveBeenCalledWith(orcamentoExemplo.id);
    expect(component['orcamento']()?.status).toBe('ACEITO');
  });

  it('duplica o orçamento após confirmação e navega para a nova versão', () => {
    const { component, service, router } = configurar(orcamentoExemplo.id);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));

    component['duplicar']();

    expect(service.duplicar).toHaveBeenCalledWith(orcamentoExemplo.id);
    expect(router.navigate).toHaveBeenCalledWith(['/orcamentos', '019fc00d-c808-7759-ba91-903f935ae2c7']);

    vi.unstubAllGlobals();
  });

  it('não duplica quando a confirmação é negada', () => {
    const { component, service } = configurar(orcamentoExemplo.id);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));

    component['duplicar']();

    expect(service.duplicar).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});

describe('OrcamentoForm — reaproveitamento de rota (Angular reusa a instância entre /orcamentos/:id)', () => {
  it('recarrega ao navegar de um orçamento para outro sem recriar o componente', () => {
    const paramMap$ = new Subject<ReturnType<typeof convertToParamMap>>();
    const outroOrcamento: Orcamento = { ...orcamentoExemplo, id: 'outro-id', status: 'ACEITO', versao: 2 };
    const service = {
      buscarPorId: vi.fn().mockReturnValueOnce(of(orcamentoExemplo)).mockReturnValueOnce(of(outroOrcamento)),
      criar: vi.fn(),
      atualizar: vi.fn(),
      enviar: vi.fn(),
      aceitar: vi.fn(),
      recusar: vi.fn(),
      duplicar: vi.fn()
    };
    const pessoaService = {
      listar: vi
        .fn()
        .mockReturnValue(of({ content: [proprietarioExemplo], page: 0, size: 100, totalElements: 1, totalPages: 1 }))
    };
    const propriedadeService = {
      listar: vi
        .fn()
        .mockReturnValue(of({ content: [propriedadeExemplo], page: 0, size: 100, totalElements: 1, totalPages: 1 }))
    };

    TestBed.configureTestingModule({
      imports: [OrcamentoForm],
      providers: [
        { provide: OrcamentoService, useValue: service },
        { provide: PessoaService, useValue: pessoaService },
        { provide: PropriedadeService, useValue: propriedadeService },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: Keycloak, useValue: { hasRealmRole: (_papel: string) => true } as Keycloak },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: orcamentoExemplo.id }) }, paramMap: paramMap$ }
        }
      ]
    });
    const component = TestBed.createComponent(OrcamentoForm).componentInstance;

    paramMap$.next(convertToParamMap({ id: orcamentoExemplo.id }));
    expect(component['orcamento']()?.status).toBe('RASCUNHO');
    expect(component['itensArray'].disabled).toBe(false);

    paramMap$.next(convertToParamMap({ id: 'outro-id' }));

    expect(service.buscarPorId).toHaveBeenLastCalledWith('outro-id');
    expect(component['orcamento']()?.status).toBe('ACEITO');
    expect(component['itensArray'].disabled).toBe(true);
  });
});
