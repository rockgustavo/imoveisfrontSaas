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

  it('desloga automaticamente quando o backend responde ACESSO_REVOGADO', async () => {
    const logout = vi.fn();
    configurar({ authenticated: true, token: 'token-123', updateToken: vi.fn().mockResolvedValue(true), logout });

    httpClient.get('/api/v1/pessoas').subscribe({ error: () => {} });
    await aguardarMicrotasks();

    httpTesting
      .expectOne('/api/v1/pessoas')
      .flush(
        { status: 403, title: 'Forbidden', detail: 'Esta conta foi inativada', codigo: 'ACESSO_REVOGADO' },
        { status: 403, statusText: 'Forbidden' }
      );

    expect(logout).toHaveBeenCalledWith({ redirectUri: window.location.origin });
  });

  it('não desloga para outros códigos de erro', async () => {
    const logout = vi.fn();
    configurar({ authenticated: true, token: 'token-123', updateToken: vi.fn().mockResolvedValue(true), logout });

    httpClient.get('/api/v1/pessoas').subscribe({ error: () => {} });
    await aguardarMicrotasks();

    httpTesting
      .expectOne('/api/v1/pessoas')
      .flush(
        { status: 403, title: 'Forbidden', detail: 'Sem papel suficiente', codigo: 'OUTRO_CODIGO' },
        { status: 403, statusText: 'Forbidden' }
      );

    expect(logout).not.toHaveBeenCalled();
  });

  it('lê o ProblemDetail quando o corpo do erro chega como Blob (download com responseType blob)', async () => {
    configurar({ authenticated: true, token: 'token-123', updateToken: vi.fn().mockResolvedValue(true) });
    let erroCapturado: unknown;

    httpClient
      .get('/api/v1/contratos/1/documento', { responseType: 'blob' })
      .subscribe({ error: (erro: unknown) => (erroCapturado = erro) });
    await aguardarMicrotasks();

    const corpo = JSON.stringify({
      status: 404,
      title: 'Não encontrado',
      detail: 'sem histórico até a data',
      codigo: 'CONTRATO_HISTORICO_NAO_ENCONTRADO'
    });
    httpTesting
      .expectOne('/api/v1/contratos/1/documento')
      .flush(new Blob([corpo], { type: 'application/problem+json' }), { status: 404, statusText: 'Not Found' });
    await aguardarMicrotasks();

    expect(erroCapturado).toEqual({
      status: 404,
      title: 'Não encontrado',
      detail: 'sem histórico até a data',
      codigo: 'CONTRATO_HISTORICO_NAO_ENCONTRADO'
    });
  });

  it('não quebra quando o corpo do erro em Blob não é JSON válido', async () => {
    configurar({ authenticated: true, token: 'token-123', updateToken: vi.fn().mockResolvedValue(true) });
    let erroCapturado: unknown;

    httpClient
      .get('/api/v1/contratos/1/documento', { responseType: 'blob' })
      .subscribe({ error: (erro: unknown) => (erroCapturado = erro) });
    await aguardarMicrotasks();

    httpTesting
      .expectOne('/api/v1/contratos/1/documento')
      .flush(new Blob(['<html>erro do servidor</html>'], { type: 'text/html' }), {
        status: 500,
        statusText: 'Internal Server Error'
      });
    await aguardarMicrotasks();

    expect((erroCapturado as { status: number }).status).toBe(500);
    expect((erroCapturado as { title: string }).title).toBe('Erro de comunicação');
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
