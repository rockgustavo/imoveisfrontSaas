import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import Keycloak from 'keycloak-js';
import { Subject, of, throwError } from 'rxjs';

import { AppError } from '../../core/app-error.model';
import { Pessoa } from '../../pessoa/pessoa.model';
import { PessoaService } from '../../pessoa/pessoa.service';
import { OrcamentoResumo } from '../../orcamento/orcamento.model';
import { OrcamentoService } from '../../orcamento/orcamento.service';
import { Propriedade } from '../../propriedade/propriedade.model';
import { PropriedadeService } from '../../propriedade/propriedade.service';
import { Contrato, ContratoHistorico } from '../contrato.model';
import { ContratoService } from '../contrato.service';
import { ContratoForm } from './contrato-form';

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
  id: '019fc00d-c808-7759-ba91-903f935ae2c6',
  proprietarioId: proprietarioExemplo.id,
  tipo: 'APARTAMENTO',
  areaPrivativa: null,
  quartos: null,
  vagas: null,
  valorReferencia: '450000.00',
  situacao: 'AGENCIADA',
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

const orcamentoAceitoExemplo: OrcamentoResumo = {
  id: '019fc00d-c808-7759-ba91-903f935ae2c7',
  pessoaId: proprietarioExemplo.id,
  status: 'ACEITO',
  validade: '2026-08-20',
  versao: 1,
  quantidadeItens: 1,
  valorTotal: '450000.00',
  criadoEm: '2026-08-01T00:00:00Z'
};

const contratoExemplo: Contrato = {
  id: '019fc00d-c808-7759-ba91-903f935ae2c4',
  pessoaId: proprietarioExemplo.id,
  orcamentoOrigemId: orcamentoAceitoExemplo.id,
  status: 'RASCUNHO',
  vigenciaInicio: '2026-08-20',
  vigenciaFim: '2027-08-20',
  regrasContratuais: 'Regras de teste',
  justificativaEncerramento: null,
  agenciamentos: [
    { id: 'agenciamento-1', propriedadeId: propriedadeExemplo.id, comissaoPercentual: '5.00', valorPedido: '450000.00', contratoAtivo: false }
  ],
  aditivos: [],
  criadoEm: '2026-08-01T00:00:00Z',
  alteradoEm: '2026-08-01T00:00:00Z'
};

const propriedadeExcluidaPorAditivo: Propriedade = {
  ...propriedadeExemplo,
  id: '019fc00d-c808-7759-ba91-903f935ae2d0',
  logradouro: 'Rua Excluída Por Aditivo'
};

const historicoExemplo: ContratoHistorico = {
  versao: 1,
  ocorridoEm: '2026-08-02T12:00:00Z',
  contrato: {
    ...contratoExemplo,
    status: 'ATIVO',
    agenciamentos: [
      {
        id: 'agenciamento-0',
        propriedadeId: propriedadeExcluidaPorAditivo.id,
        comissaoPercentual: '4.00',
        valorPedido: '400000.00',
        contratoAtivo: true
      }
    ]
  }
};

function configurar(id: string | null, orcamentoIdQuery: string | null, contratoParaCarregar: Contrato = contratoExemplo) {
  const service = {
    buscarPorId: vi.fn().mockReturnValue(of(contratoParaCarregar)),
    criar: vi.fn().mockReturnValue(of(contratoExemplo.id)),
    ativar: vi.fn().mockReturnValue(of({ ...contratoExemplo, status: 'ATIVO' })),
    encerrar: vi.fn().mockReturnValue(of({ ...contratoExemplo, status: 'ENCERRADO' })),
    cancelar: vi.fn().mockReturnValue(of({ ...contratoExemplo, status: 'CANCELADO' })),
    registrarAditivo: vi.fn().mockReturnValue(of(contratoExemplo)),
    historicoEm: vi.fn().mockReturnValue(of(historicoExemplo))
  };
  const orcamentoService = {
    listar: vi
      .fn()
      .mockReturnValue(of({ content: [orcamentoAceitoExemplo], page: 0, size: 100, totalElements: 1, totalPages: 1 }))
  };
  const pessoaService = { buscarPorId: vi.fn().mockReturnValue(of(proprietarioExemplo)) };
  const propriedadeService = {
    buscarPorId: vi
      .fn()
      .mockImplementation((propriedadeId: string) =>
        of(propriedadeId === propriedadeExcluidaPorAditivo.id ? propriedadeExcluidaPorAditivo : propriedadeExemplo)
      )
  };
  const router = { navigate: vi.fn() };
  const keycloak = { hasRealmRole: (_papel: string) => true } as Keycloak;

  TestBed.configureTestingModule({
    imports: [ContratoForm],
    providers: [
      { provide: ContratoService, useValue: service },
      { provide: OrcamentoService, useValue: orcamentoService },
      { provide: PessoaService, useValue: pessoaService },
      { provide: PropriedadeService, useValue: propriedadeService },
      { provide: Router, useValue: router },
      { provide: Keycloak, useValue: keycloak },
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(convertToParamMap(id ? { id } : {})),
          queryParamMap: of(convertToParamMap(orcamentoIdQuery ? { orcamentoId: orcamentoIdQuery } : {}))
        }
      }
    ]
  });

  const fixture = TestBed.createComponent(ContratoForm);
  return { fixture, component: fixture.componentInstance, service, orcamentoService, pessoaService, propriedadeService, router };
}

describe('ContratoForm — modo criação', () => {
  it('sem orçamento pré-selecionado, carrega orçamentos ACEITO e habilita o seletor', () => {
    const { component, orcamentoService } = configurar(null, null);

    expect(orcamentoService.listar).toHaveBeenCalledWith({ status: 'ACEITO' }, 0, 100);
    expect(component['form'].controls.orcamentoId.disabled).toBe(false);
    expect(component['modoDetalhe']).toBe(false);
  });

  it('com orçamento pré-selecionado via query param, trava o campo e não lista orçamentos', () => {
    const { component, orcamentoService } = configurar(null, orcamentoAceitoExemplo.id);

    expect(component['form'].controls.orcamentoId.value).toBe(orcamentoAceitoExemplo.id);
    expect(component['form'].controls.orcamentoId.disabled).toBe(true);
    expect(orcamentoService.listar).not.toHaveBeenCalled();
  });

  it('não salva quando o formulário é inválido', () => {
    const { component, service } = configurar(null, null);
    component['salvar']();
    expect(service.criar).not.toHaveBeenCalled();
    expect(component['form'].touched).toBe(true);
  });

  it('cria o contrato e navega para o detalhe ao salvar com sucesso', () => {
    const { component, service, router } = configurar(null, orcamentoAceitoExemplo.id);
    component['form'].patchValue({
      vigenciaInicio: '2026-08-20',
      vigenciaFim: '2027-08-20',
      regrasContratuais: 'Regras de teste'
    });

    component['salvar']();

    expect(service.criar).toHaveBeenCalledWith({
      orcamentoId: orcamentoAceitoExemplo.id,
      vigenciaInicio: '2026-08-20',
      vigenciaFim: '2027-08-20',
      regrasContratuais: 'Regras de teste'
    });
    expect(router.navigate).toHaveBeenCalledWith(['/contratos', contratoExemplo.id]);
  });

  it('expõe o erro normalizado quando a criação falha', () => {
    const { component, service } = configurar(null, orcamentoAceitoExemplo.id);
    const erro: AppError = { status: 409, title: 'Conflito', detail: 'orçamento já originou contrato' };
    service.criar.mockReturnValue(throwError(() => erro));
    component['form'].patchValue({
      vigenciaInicio: '2026-08-20',
      vigenciaFim: '2027-08-20',
      regrasContratuais: 'Regras de teste'
    });

    component['salvar']();

    expect(component['erro']()).toEqual(erro);
    expect(component['salvando']()).toBe(false);
  });
});

describe('ContratoForm — modo detalhe', () => {
  it('carrega o contrato, o proprietário e as propriedades dos agenciamentos', () => {
    const { component, service, pessoaService, propriedadeService } = configurar(contratoExemplo.id, null);

    expect(service.buscarPorId).toHaveBeenCalledWith(contratoExemplo.id);
    expect(pessoaService.buscarPorId).toHaveBeenCalledWith(contratoExemplo.pessoaId);
    expect(propriedadeService.buscarPorId).toHaveBeenCalledWith(propriedadeExemplo.id);
    expect(component['proprietario']()).toEqual(proprietarioExemplo);
    expect(component['propriedadesPorId']()[propriedadeExemplo.id]).toEqual(propriedadeExemplo);
  });

  it('permite ativar apenas quando RASCUNHO', () => {
    const { component } = configurar(contratoExemplo.id, null);
    expect(component['podeAtivar']).toBe(true);
    expect(component['podeEncerrar']).toBe(false);
    expect(component['podeRegistrarAditivo']).toBe(false);
  });

  it('ativa o contrato, atualizando o estado local', () => {
    const { component, service } = configurar(contratoExemplo.id, null);

    component['ativar']();

    expect(service.ativar).toHaveBeenCalledWith(contratoExemplo.id);
    expect(component['contrato']()?.status).toBe('ATIVO');
  });

  it('encerra o contrato com a justificativa do prompt', () => {
    const contratoAtivo = { ...contratoExemplo, status: 'ATIVO' as const };
    const { component, service } = configurar(contratoExemplo.id, null, contratoAtivo);
    vi.stubGlobal('prompt', vi.fn().mockReturnValue('distrato antecipado'));

    component['encerrar']();

    expect(service.encerrar).toHaveBeenCalledWith(contratoExemplo.id, { justificativa: 'distrato antecipado' });
    expect(component['contrato']()?.status).toBe('ENCERRADO');
    vi.unstubAllGlobals();
  });

  it('não encerra quando o prompt é cancelado', () => {
    const contratoAtivo = { ...contratoExemplo, status: 'ATIVO' as const };
    const { component, service } = configurar(contratoExemplo.id, null, contratoAtivo);
    vi.stubGlobal('prompt', vi.fn().mockReturnValue(null));

    component['encerrar']();

    expect(service.encerrar).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('cancela o contrato após confirmação', () => {
    const { component, service } = configurar(contratoExemplo.id, null);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));

    component['cancelar']();

    expect(service.cancelar).toHaveBeenCalledWith(contratoExemplo.id);
    expect(component['contrato']()?.status).toBe('CANCELADO');
    vi.unstubAllGlobals();
  });

  it('registra aditivo e limpa o formulário ao ter sucesso', () => {
    const contratoAtivo = { ...contratoExemplo, status: 'ATIVO' as const };
    const { component, service } = configurar(contratoExemplo.id, null, contratoAtivo);
    component['aditivoForm'].patchValue({
      tipo: 'EXCLUSAO',
      propriedadeId: propriedadeExemplo.id,
      justificativa: 'exclusão a pedido'
    });

    component['registrarAditivo']();

    expect(service.registrarAditivo).toHaveBeenCalledWith(contratoExemplo.id, {
      tipo: 'EXCLUSAO',
      propriedadeId: propriedadeExemplo.id,
      justificativa: 'exclusão a pedido',
      comissaoPercentual: undefined,
      valorPedido: undefined
    });
    expect(component['aditivoForm'].controls.propriedadeId.value).toBe('');
  });
});

describe('ContratoForm — consulta de estado em uma data', () => {
  it('não consulta enquanto a data não for informada', () => {
    const { component, service } = configurar(contratoExemplo.id, null);

    component['consultarHistorico']();

    expect(service.historicoEm).not.toHaveBeenCalled();
    expect(component['historicoForm'].touched).toBe(true);
  });

  it('consulta a data informada e expõe o snapshot retornado', () => {
    const { component, service } = configurar(contratoExemplo.id, null);
    component['historicoForm'].setValue({ data: '2026-08-02' });

    component['consultarHistorico']();

    expect(service.historicoEm).toHaveBeenCalledWith(contratoExemplo.id, '2026-08-02');
    expect(component['historico']()).toEqual(historicoExemplo);
    expect(component['consultandoHistorico']()).toBe(false);
  });

  it('resolve o endereço de propriedade que o snapshot tem mas o contrato atual já não tem', () => {
    const { component, propriedadeService } = configurar(contratoExemplo.id, null);
    component['historicoForm'].setValue({ data: '2026-08-02' });

    component['consultarHistorico']();

    expect(propriedadeService.buscarPorId).toHaveBeenCalledWith(propriedadeExcluidaPorAditivo.id);
    expect(component['propriedadesPorId']()[propriedadeExcluidaPorAditivo.id]).toEqual(propriedadeExcluidaPorAditivo);
    expect(component['propriedadesPorId']()[propriedadeExemplo.id]).toEqual(propriedadeExemplo);
  });

  it('expõe o erro normalizado quando não há snapshot até a data pedida', () => {
    const { component, service } = configurar(contratoExemplo.id, null);
    const erro: AppError = { status: 404, title: 'Não encontrado', detail: 'sem histórico até a data' };
    service.historicoEm.mockReturnValue(throwError(() => erro));
    component['historicoForm'].setValue({ data: '2020-01-01' });

    component['consultarHistorico']();

    expect(component['erroHistorico']()).toEqual(erro);
    expect(component['historico']()).toBeNull();
    expect(component['consultandoHistorico']()).toBe(false);
  });
});

describe('ContratoForm — reaproveitamento de rota', () => {
  it('recarrega ao navegar de um contrato para outro sem recriar o componente', () => {
    const paramMap$ = new Subject<ReturnType<typeof convertToParamMap>>();
    const outroContrato: Contrato = { ...contratoExemplo, id: 'outro-id', status: 'ATIVO' };
    const service = {
      buscarPorId: vi.fn().mockReturnValueOnce(of(contratoExemplo)).mockReturnValueOnce(of(outroContrato)),
      criar: vi.fn(),
      ativar: vi.fn(),
      encerrar: vi.fn(),
      cancelar: vi.fn(),
      registrarAditivo: vi.fn(),
      historicoEm: vi.fn().mockReturnValue(of(historicoExemplo))
    };
    const pessoaService = { buscarPorId: vi.fn().mockReturnValue(of(proprietarioExemplo)) };
    const propriedadeService = { buscarPorId: vi.fn().mockReturnValue(of(propriedadeExemplo)) };

    TestBed.configureTestingModule({
      imports: [ContratoForm],
      providers: [
        { provide: ContratoService, useValue: service },
        { provide: OrcamentoService, useValue: { listar: vi.fn().mockReturnValue(of({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 })) } },
        { provide: PessoaService, useValue: pessoaService },
        { provide: PropriedadeService, useValue: propriedadeService },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: Keycloak, useValue: { hasRealmRole: (_papel: string) => true } as Keycloak },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMap$, queryParamMap: of(convertToParamMap({})) }
        }
      ]
    });
    const component = TestBed.createComponent(ContratoForm).componentInstance;

    paramMap$.next(convertToParamMap({ id: contratoExemplo.id }));
    expect(component['contrato']()?.status).toBe('RASCUNHO');

    paramMap$.next(convertToParamMap({ id: 'outro-id' }));

    expect(service.buscarPorId).toHaveBeenLastCalledWith('outro-id');
    expect(component['contrato']()?.status).toBe('ATIVO');
  });

  it('não carrega o histórico do contrato anterior para o contrato seguinte', () => {
    const paramMap$ = new Subject<ReturnType<typeof convertToParamMap>>();
    const service = {
      buscarPorId: vi.fn().mockReturnValue(of(contratoExemplo)),
      criar: vi.fn(),
      ativar: vi.fn(),
      encerrar: vi.fn(),
      cancelar: vi.fn(),
      registrarAditivo: vi.fn(),
      historicoEm: vi.fn().mockReturnValue(of(historicoExemplo))
    };

    TestBed.configureTestingModule({
      imports: [ContratoForm],
      providers: [
        { provide: ContratoService, useValue: service },
        { provide: OrcamentoService, useValue: { listar: vi.fn().mockReturnValue(of({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 })) } },
        { provide: PessoaService, useValue: { buscarPorId: vi.fn().mockReturnValue(of(proprietarioExemplo)) } },
        { provide: PropriedadeService, useValue: { buscarPorId: vi.fn().mockReturnValue(of(propriedadeExemplo)) } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: Keycloak, useValue: { hasRealmRole: (_papel: string) => true } as Keycloak },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMap$, queryParamMap: of(convertToParamMap({})) }
        }
      ]
    });
    const component = TestBed.createComponent(ContratoForm).componentInstance;

    paramMap$.next(convertToParamMap({ id: contratoExemplo.id }));
    component['historicoForm'].setValue({ data: '2026-08-02' });
    component['consultarHistorico']();
    expect(component['historico']()).toEqual(historicoExemplo);

    paramMap$.next(convertToParamMap({ id: 'outro-id' }));

    expect(component['historico']()).toBeNull();
    expect(component['historicoForm'].controls.data.value).toBe('');
  });
});
