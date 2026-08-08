import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../core/api.config';
import { PageResponse } from '../shared/page-response.model';
import {
  AditivoComando,
  Contrato,
  ContratoFiltro,
  ContratoHistorico,
  ContratoResumo,
  CriarContratoComando,
  EncerrarContratoComando
} from './contrato.model';

@Injectable({ providedIn: 'root' })
export class ContratoService {
  private readonly http = inject(HttpClient);
  private readonly contratosUrl = `${API_BASE_URL}/contratos`;

  listar(filtro: ContratoFiltro, page: number, size: number): Observable<PageResponse<ContratoResumo>> {
    return this.http.get<PageResponse<ContratoResumo>>(this.contratosUrl, {
      params: this.paraParams(filtro, page, size)
    });
  }

  buscarPorId(id: string): Observable<Contrato> {
    return this.http.get<Contrato>(`${this.contratosUrl}/${id}`);
  }

  criar(comando: CriarContratoComando): Observable<string> {
    return this.http
      .post(this.contratosUrl, comando, { observe: 'response' })
      .pipe(map((resposta) => this.extrairId(resposta.headers.get('Location'))));
  }

  ativar(id: string): Observable<Contrato> {
    return this.http.post<Contrato>(`${this.contratosUrl}/${id}/ativacao`, {});
  }

  encerrar(id: string, comando: EncerrarContratoComando): Observable<Contrato> {
    return this.http.post<Contrato>(`${this.contratosUrl}/${id}/encerramento`, comando);
  }

  cancelar(id: string): Observable<Contrato> {
    return this.http.post<Contrato>(`${this.contratosUrl}/${id}/cancelamento`, {});
  }

  registrarAditivo(id: string, comando: AditivoComando): Observable<Contrato> {
    return this.http.post<Contrato>(`${this.contratosUrl}/${id}/aditivos`, comando);
  }

  historicoEm(id: string, data: string): Observable<ContratoHistorico> {
    return this.http.get<ContratoHistorico>(`${this.contratosUrl}/${id}/historico`, { params: { data } });
  }

  visualizarDocumento(id: string, data?: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.contratosUrl}/${id}/documento`, {
      params: data ? { data } : {},
      responseType: 'blob',
      observe: 'response'
    });
  }

  private paraParams(filtro: ContratoFiltro, page: number, size: number): HttpParams {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filtro.pessoaId) {
      params = params.set('pessoaId', filtro.pessoaId);
    }
    if (filtro.status) {
      params = params.set('status', filtro.status);
    }
    if (filtro.vencendoEmDias !== undefined) {
      params = params.set('vencendoEmDias', filtro.vencendoEmDias);
    }
    return params;
  }

  private extrairId(location: string | null): string {
    if (!location) {
      throw new Error('Location ausente na resposta de criação de contrato');
    }
    return location.substring(location.lastIndexOf('/') + 1);
  }
}
