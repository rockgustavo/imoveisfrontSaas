import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Propriedade } from './propriedade.model';
import { PropriedadeService } from './propriedade.service';

describe('PropriedadeService', () => {
  let service: PropriedadeService;
  let httpTesting: HttpTestingController;

  const propriedadesUrl = 'http://localhost:8080/api/v1/propriedades';

  const propriedadeExemplo: Propriedade = {
    id: '019fc00d-c808-7759-ba91-903f935ae2c4',
    proprietarioId: '019fc00d-c808-7759-ba91-903f935ae2c5',
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(PropriedadeService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('lista propriedades com os filtros e a paginação informados', () => {
    service.listar({ situacao: 'DISPONIVEL', uf: 'SP' }, 0, 20).subscribe();

    const requisicao = httpTesting.expectOne(
      (req) => req.url === propriedadesUrl && req.params.get('page') === '0' && req.params.get('size') === '20'
    );
    expect(requisicao.request.params.get('situacao')).toBe('DISPONIVEL');
    expect(requisicao.request.params.get('uf')).toBe('SP');
    expect(requisicao.request.params.has('localidade')).toBe(false);
    requisicao.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('busca uma propriedade por id', () => {
    let resultado: Propriedade | undefined;
    service.buscarPorId(propriedadeExemplo.id).subscribe((propriedade) => (resultado = propriedade));

    const requisicao = httpTesting.expectOne(`${propriedadesUrl}/${propriedadeExemplo.id}`);
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush(propriedadeExemplo);

    expect(resultado).toEqual(propriedadeExemplo);
  });

  it('extrai o id do header Location ao criar propriedade', () => {
    let idCriado: string | undefined;
    service
      .criar({
        proprietarioId: propriedadeExemplo.proprietarioId,
        tipo: 'APARTAMENTO',
        valorReferencia: 450000,
        cep: '01310100',
        logradouro: 'Av. Paulista',
        numero: '1000',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
        enderecoValidado: true
      })
      .subscribe((id) => (idCriado = id));

    const requisicao = httpTesting.expectOne(propriedadesUrl);
    expect(requisicao.request.method).toBe('POST');
    requisicao.flush(null, { headers: { Location: `${propriedadesUrl}/${propriedadeExemplo.id}` } });

    expect(idCriado).toBe(propriedadeExemplo.id);
  });

  it('envia POST ao retirar propriedade', () => {
    service.retirar(propriedadeExemplo.id).subscribe();

    const requisicao = httpTesting.expectOne(`${propriedadesUrl}/${propriedadeExemplo.id}/retirada`);
    expect(requisicao.request.method).toBe('POST');
    requisicao.flush(propriedadeExemplo);
  });

  it('envia POST ao reservar propriedade', () => {
    service.reservar(propriedadeExemplo.id).subscribe();

    const requisicao = httpTesting.expectOne(`${propriedadesUrl}/${propriedadeExemplo.id}/reserva`);
    expect(requisicao.request.method).toBe('POST');
    requisicao.flush(propriedadeExemplo);
  });

  it('envia DELETE ao desfazer reserva', () => {
    service.desfazerReserva(propriedadeExemplo.id).subscribe();

    const requisicao = httpTesting.expectOne(`${propriedadesUrl}/${propriedadeExemplo.id}/reserva`);
    expect(requisicao.request.method).toBe('DELETE');
    requisicao.flush(propriedadeExemplo);
  });

  it('envia POST ao vender propriedade', () => {
    service.vender(propriedadeExemplo.id).subscribe();

    const requisicao = httpTesting.expectOne(`${propriedadesUrl}/${propriedadeExemplo.id}/venda`);
    expect(requisicao.request.method).toBe('POST');
    requisicao.flush(propriedadeExemplo);
  });
});
