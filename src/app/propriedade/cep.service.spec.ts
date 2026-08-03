import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Cep } from './cep.model';
import { CepService } from './cep.service';

describe('CepService', () => {
  let service: CepService;
  let httpTesting: HttpTestingController;

  const cepsUrl = 'http://localhost:8080/api/v1/ceps';

  const cepExemplo: Cep = {
    cep: '01310100',
    encontrado: true,
    logradouro: 'Av. Paulista',
    bairro: 'Bela Vista',
    localidade: 'São Paulo',
    uf: 'SP',
    latitude: null,
    longitude: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(CepService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('consulta um CEP', () => {
    let resultado: Cep | undefined;
    service.consultar('01310100').subscribe((cep) => (resultado = cep));

    const requisicao = httpTesting.expectOne(`${cepsUrl}/01310100`);
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush(cepExemplo);

    expect(resultado).toEqual(cepExemplo);
  });
});
