import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import Keycloak from 'keycloak-js';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { AppError } from './app-error.model';

interface ProblemDetailBody {
  status?: number;
  title?: string;
  detail?: string;
  codigo?: string;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloak = inject(Keycloak);

  return from(anexarToken(req, keycloak)).pipe(
    switchMap((requisicaoAutorizada) => next(requisicaoAutorizada)),
    catchError((erro: unknown) => throwError(() => paraAppError(erro)))
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
        codigo: erro.error.codigo
      };
    }
    return { status: erro.status, title: 'Erro de comunicação', detail: erro.message };
  }
  return { status: 0, title: 'Erro inesperado', detail: String(erro) };
}

function isProblemDetail(corpo: unknown): corpo is ProblemDetailBody {
  return typeof corpo === 'object' && corpo !== null && ('title' in corpo || 'detail' in corpo);
}
