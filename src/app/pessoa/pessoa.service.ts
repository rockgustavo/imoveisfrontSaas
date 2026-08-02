import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../core/api.config';
import { PageResponse } from '../shared/page-response.model';
import {
  AtribuirPapelComando,
  AtualizarPessoaComando,
  CriarPessoaComando,
  Papel,
  Pessoa,
  PessoaFiltro
} from './pessoa.model';

@Injectable({ providedIn: 'root' })
export class PessoaService {
  private readonly http = inject(HttpClient);
  private readonly pessoasUrl = `${API_BASE_URL}/pessoas`;

  listar(filtro: PessoaFiltro, page: number, size: number): Observable<PageResponse<Pessoa>> {
    return this.http.get<PageResponse<Pessoa>>(this.pessoasUrl, { params: this.paraParams(filtro, page, size) });
  }

  buscarPorId(id: string): Observable<Pessoa> {
    return this.http.get<Pessoa>(`${this.pessoasUrl}/${id}`);
  }

  criar(comando: CriarPessoaComando): Observable<string> {
    return this.http
      .post(this.pessoasUrl, comando, { observe: 'response' })
      .pipe(map((resposta) => this.extrairId(resposta.headers.get('Location'))));
  }

  atualizar(id: string, comando: AtualizarPessoaComando): Observable<Pessoa> {
    return this.http.put<Pessoa>(`${this.pessoasUrl}/${id}`, comando);
  }

  atribuirPapel(id: string, comando: AtribuirPapelComando): Observable<Pessoa> {
    return this.http.post<Pessoa>(`${this.pessoasUrl}/${id}/papeis`, comando);
  }

  removerPapel(id: string, papel: Papel): Observable<void> {
    return this.http.delete<void>(`${this.pessoasUrl}/${id}/papeis/${papel}`);
  }

  inativar(id: string): Observable<void> {
    return this.http.post<void>(`${this.pessoasUrl}/${id}/inativacao`, {});
  }

  private paraParams(filtro: PessoaFiltro, page: number, size: number): HttpParams {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filtro.documento) {
      params = params.set('documento', filtro.documento);
    }
    if (filtro.papel) {
      params = params.set('papel', filtro.papel);
    }
    if (filtro.classificacao) {
      params = params.set('classificacao', filtro.classificacao);
    }
    if (filtro.ativo !== undefined) {
      params = params.set('ativo', filtro.ativo);
    }
    return params;
  }

  private extrairId(location: string | null): string {
    if (!location) {
      throw new Error('Location ausente na resposta de criação de pessoa');
    }
    return location.substring(location.lastIndexOf('/') + 1);
  }
}
