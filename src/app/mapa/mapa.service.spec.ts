import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BoundingBox, MapaResposta } from './mapa.model';
import { MapaService } from './mapa.service';

describe('MapaService', () => {
  let service: MapaService;
  let httpTesting: HttpTestingController;

  const mapaUrl = 'http://localhost:8080/api/v1/mapa/propriedades';
  const bbox: BoundingBox = { minLat: -23.6, minLon: -46.7, maxLat: -23.5, maxLon: -46.6 };
  const respostaVazia: MapaResposta = { propriedades: [], limitado: false };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(MapaService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('envia o bbox como minLat,minLon,maxLat,maxLon', () => {
    service.buscar(bbox, {}).subscribe();

    const requisicao = httpTesting.expectOne((req) => req.url === mapaUrl);
    expect(requisicao.request.params.get('bbox')).toBe('-23.6,-46.7,-23.5,-46.6');
    requisicao.flush(respostaVazia);
  });

  it('envia apenas os filtros preenchidos', () => {
    service.buscar(bbox, { situacao: 'AGENCIADA', uf: 'SP' }).subscribe();

    const requisicao = httpTesting.expectOne((req) => req.url === mapaUrl);
    expect(requisicao.request.params.get('situacao')).toBe('AGENCIADA');
    expect(requisicao.request.params.get('uf')).toBe('SP');
    expect(requisicao.request.params.has('statusContrato')).toBe(false);
    expect(requisicao.request.params.has('localidade')).toBe(false);
    expect(requisicao.request.params.has('proprietarioId')).toBe(false);
    requisicao.flush(respostaVazia);
  });

  it('devolve a resposta com propriedades e o sinalizador de limite', () => {
    let resultado: MapaResposta | undefined;
    const resposta: MapaResposta = {
      propriedades: [
        {
          id: '019fc00d-c808-7759-ba91-903f935ae2c4',
          proprietarioId: '019fc00d-c808-7759-ba91-903f935ae2c5',
          situacao: 'AGENCIADA',
          valorReferencia: '450000.00',
          logradouro: 'Av. Paulista',
          localidade: 'São Paulo',
          uf: 'SP',
          latitude: -23.55,
          longitude: -46.65,
          statusContrato: 'ATIVO'
        }
      ],
      limitado: true
    };

    service.buscar(bbox, {}).subscribe((resp) => (resultado = resp));

    httpTesting.expectOne((req) => req.url === mapaUrl).flush(resposta);

    expect(resultado).toEqual(resposta);
  });
});
