import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PainelIndicadores } from './painel.model';
import { PainelService } from './painel.service';

describe('PainelService', () => {
  let service: PainelService;
  let httpTesting: HttpTestingController;

  const indicadoresUrl = 'http://localhost:8080/api/v1/painel/indicadores';
  const respostaExemplo: PainelIndicadores = {
    contratosAtivos: 3,
    contratosVencendoEm30Dias: 1,
    imoveisPorSituacao: { DISPONIVEL: 2, AGENCIADA: 3, RESERVADA: 0, VENDIDA: 0, RETIRADA: 1 },
    orcamentosAguardandoResposta: 2,
    funil: { lead: 1, prospect: 2, cliente: 3, clienteInativo: 0 },
    comissaoProjetada: '27000.00'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(PainelService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('busca os indicadores em GET /painel/indicadores', () => {
    let resultado: PainelIndicadores | undefined;

    service.buscar().subscribe((resp) => (resultado = resp));

    httpTesting.expectOne(indicadoresUrl).flush(respostaExemplo);

    expect(resultado).toEqual(respostaExemplo);
  });
});
