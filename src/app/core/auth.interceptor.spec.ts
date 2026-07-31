import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import Keycloak from 'keycloak-js';

import { authInterceptor, paraAppError } from './auth.interceptor';

function aguardarMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;

  function configurar(keycloak: Partial<Keycloak>): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Keycloak, useValue: keycloak }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpTesting.verify();
  });

  it('anexa o header Authorization quando autenticado', async () => {
    configurar({ authenticated: true, token: 'token-123', updateToken: vi.fn().mockResolvedValue(true) });

    httpClient.get('/api/v1/tenant/parametros').subscribe();
    await aguardarMicrotasks();

    const requisicao = httpTesting.expectOne('/api/v1/tenant/parametros');
    expect(requisicao.request.headers.get('Authorization')).toBe('Bearer token-123');
    requisicao.flush({});
  });

  it('não anexa o header quando não autenticado', async () => {
    configurar({ authenticated: false });

    httpClient.get('/api/v1/tenant/parametros').subscribe();
    await aguardarMicrotasks();

    const requisicao = httpTesting.expectOne('/api/v1/tenant/parametros');
    expect(requisicao.request.headers.has('Authorization')).toBe(false);
    requisicao.flush({});
  });
});

describe('paraAppError', () => {
  it('extrai title/detail/codigo de um ProblemDetail', () => {
    const erro = new HttpErrorResponse({
      status: 422,
      error: {
        status: 422,
        title: 'Parâmetro inválido',
        detail: 'comissaoPercentualTeto deve ser maior que zero',
        codigo: 'TENANT_PARAMETRO_INVALIDO'
      }
    });

    expect(paraAppError(erro)).toEqual({
      status: 422,
      title: 'Parâmetro inválido',
      detail: 'comissaoPercentualTeto deve ser maior que zero',
      codigo: 'TENANT_PARAMETRO_INVALIDO'
    });
  });

  it('usa mensagem padrão quando o corpo não é um ProblemDetail', () => {
    const erro = new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') });

    const appError = paraAppError(erro);

    expect(appError.status).toBe(0);
    expect(appError.title).toBe('Erro de comunicação');
  });

  it('trata erro que não é HttpErrorResponse', () => {
    const appError = paraAppError('falha inesperada');

    expect(appError.title).toBe('Erro inesperado');
  });
});
