import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ImobiliariaService } from './imobiliaria.service';
import { ParametrosTenant } from './parametros-tenant.model';

describe('ImobiliariaService', () => {
  let service: ImobiliariaService;
  let httpTesting: HttpTestingController;

  const tenantUrl = 'http://localhost:8080/api/v1/tenant';
  const parametrosUrl = 'http://localhost:8080/api/v1/tenant/parametros';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(ImobiliariaService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('busca a identidade do tenant corrente', () => {
    let resultado: { razaoSocial: string } | undefined;
    service.buscarTenant().subscribe((tenant) => (resultado = tenant));

    const requisicao = httpTesting.expectOne(tenantUrl);
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush({
      id: '019fc00d-c6f7-72cb-a1d6-0366c9502bc2',
      razaoSocial: 'Corretora Exemplo Ltda',
      slug: 'corretora-exemplo',
      status: 'ATIVA'
    });

    expect(resultado?.razaoSocial).toBe('Corretora Exemplo Ltda');
  });

  it('busca os parâmetros do tenant e mantém o percentual como string', () => {
    let resultado: ParametrosTenant | undefined;
    service.buscarParametros().subscribe((parametros) => (resultado = parametros));

    const requisicao = httpTesting.expectOne(parametrosUrl);
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush({
      comissaoPercentualTeto: '6.00',
      orcamentoValidadeDiasPadrao: 15,
      geocodificacaoTentativasMax: 5,
      cepCacheJanelaDias: 30,
      fusoHorario: 'America/Sao_Paulo'
    });

    expect(resultado?.comissaoPercentualTeto).toBe('6.00');
    expect(typeof resultado?.comissaoPercentualTeto).toBe('string');
  });

  it('envia PUT com o payload informado ao atualizar parâmetros', () => {
    const payload: ParametrosTenant = {
      comissaoPercentualTeto: '8.50',
      orcamentoValidadeDiasPadrao: 20,
      geocodificacaoTentativasMax: 3,
      cepCacheJanelaDias: 10,
      fusoHorario: 'America/Sao_Paulo'
    };

    service.atualizarParametros(payload).subscribe();

    const requisicao = httpTesting.expectOne(parametrosUrl);
    expect(requisicao.request.method).toBe('PUT');
    expect(requisicao.request.body).toEqual(payload);
    requisicao.flush(payload);
  });
});
