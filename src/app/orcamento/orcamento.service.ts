import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../core/api.config';
import { PageResponse } from '../shared/page-response.model';
import {
  AtualizarOrcamentoComando,
  CriarOrcamentoComando,
  Orcamento,
  OrcamentoFiltro,
  OrcamentoResumo
} from './orcamento.model';

@Injectable({ providedIn: 'root' })
export class OrcamentoService {
  private readonly http = inject(HttpClient);
  private readonly orcamentosUrl = `${API_BASE_URL}/orcamentos`;

  listar(filtro: OrcamentoFiltro, page: number, size: number): Observable<PageResponse<OrcamentoResumo>> {
    return this.http.get<PageResponse<OrcamentoResumo>>(this.orcamentosUrl, {
      params: this.paraParams(filtro, page, size)
    });
  }

  buscarPorId(id: string): Observable<Orcamento> {
    return this.http.get<Orcamento>(`${this.orcamentosUrl}/${id}`);
  }

  criar(comando: CriarOrcamentoComando): Observable<string> {
    return this.http
      .post(this.orcamentosUrl, comando, { observe: 'response' })
      .pipe(map((resposta) => this.extrairId(resposta.headers.get('Location'))));
  }

  atualizar(id: string, comando: AtualizarOrcamentoComando): Observable<Orcamento> {
    return this.http.put<Orcamento>(`${this.orcamentosUrl}/${id}`, comando);
  }

  enviar(id: string): Observable<Orcamento> {
    return this.http.post<Orcamento>(`${this.orcamentosUrl}/${id}/envio`, {});
  }

  aceitar(id: string): Observable<Orcamento> {
    return this.http.post<Orcamento>(`${this.orcamentosUrl}/${id}/aceite`, {});
  }

  recusar(id: string): Observable<Orcamento> {
    return this.http.post<Orcamento>(`${this.orcamentosUrl}/${id}/recusa`, {});
  }

  duplicar(id: string): Observable<string> {
    return this.http
      .post(`${this.orcamentosUrl}/${id}/duplicacao`, {}, { observe: 'response' })
      .pipe(map((resposta) => this.extrairId(resposta.headers.get('Location'))));
  }

  private paraParams(filtro: OrcamentoFiltro, page: number, size: number): HttpParams {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filtro.pessoaId) {
      params = params.set('pessoaId', filtro.pessoaId);
    }
    if (filtro.status) {
      params = params.set('status', filtro.status);
    }
    return params;
  }

  private extrairId(location: string | null): string {
    if (!location) {
      throw new Error('Location ausente na resposta de criação de orçamento');
    }
    return location.substring(location.lastIndexOf('/') + 1);
  }
}
