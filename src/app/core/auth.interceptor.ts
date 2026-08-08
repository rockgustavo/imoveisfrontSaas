import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import Keycloak from 'keycloak-js';
import { Observable, catchError, from, map, of, switchMap, throwError } from 'rxjs';

import { AppError } from './app-error.model';

interface ProblemDetailBody {
  status?: number;
  title?: string;
  detail?: string;
  codigo?: string;
  campos?: Record<string, string>;
}

const CODIGO_ACESSO_REVOGADO = 'ACESSO_REVOGADO';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloak = inject(Keycloak);

  return from(anexarToken(req, keycloak)).pipe(
    switchMap((requisicaoAutorizada) => next(requisicaoAutorizada)),
    catchError((erro: unknown) =>
      resolverAppError(erro).pipe(
        switchMap((appError) => {
          if (appError.codigo === CODIGO_ACESSO_REVOGADO) {
            keycloak.logout({ redirectUri: window.location.origin });
          }
          return throwError(() => appError);
        })
      )
    )
  );
};

async function anexarToken(req: HttpRequest<unknown>, keycloak: Keycloak): Promise<HttpRequest<unknown>> {
  if (!keycloak.authenticated) {
    return req;
  }
  await keycloak.updateToken(30);
  return req.clone({ setHeaders: { Authorization: `Bearer ${keycloak.token}` } });
}

export function paraAppError(erro: unknown): AppError {
  if (erro instanceof HttpErrorResponse) {
    if (isProblemDetail(erro.error)) {
      return {
        status: erro.error.status ?? erro.status,
        title: erro.error.title ?? 'Erro',
        detail: erro.error.detail ?? erro.message,
        codigo: erro.error.codigo,
        campos: erro.error.campos
      };
    }
    return { status: erro.status, title: 'Erro de comunicação', detail: erro.message };
  }
  return { status: 0, title: 'Erro inesperado', detail: String(erro) };
}

function isProblemDetail(corpo: unknown): corpo is ProblemDetailBody {
  return typeof corpo === 'object' && corpo !== null && ('title' in corpo || 'detail' in corpo);
}

function resolverAppError(erro: unknown): Observable<AppError> {
  if (erro instanceof HttpErrorResponse && erro.error instanceof Blob) {
    return from(erro.error.text()).pipe(
      map((texto) =>
        paraAppError(
          new HttpErrorResponse({
            error: interpretarComoJson(texto),
            status: erro.status,
            statusText: erro.statusText,
            url: erro.url ?? undefined
          })
        )
      )
    );
  }
  return of(paraAppError(erro));
}

function interpretarComoJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}
