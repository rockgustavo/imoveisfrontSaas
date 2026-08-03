import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../core/api.config';
import { PageResponse } from '../shared/page-response.model';
import { Propriedade, PropriedadeFiltro, PropriedadeResumo, SalvarPropriedadeComando } from './propriedade.model';

@Injectable({ providedIn: 'root' })
export class PropriedadeService {
  private readonly http = inject(HttpClient);
  private readonly propriedadesUrl = `${API_BASE_URL}/propriedades`;

  listar(filtro: PropriedadeFiltro, page: number, size: number): Observable<PageResponse<PropriedadeResumo>> {
    return this.http.get<PageResponse<PropriedadeResumo>>(this.propriedadesUrl, {
      params: this.paraParams(filtro, page, size)
    });
  }

  buscarPorId(id: string): Observable<Propriedade> {
    return this.http.get<Propriedade>(`${this.propriedadesUrl}/${id}`);
  }

  criar(comando: SalvarPropriedadeComando): Observable<string> {
    return this.http
      .post(this.propriedadesUrl, comando, { observe: 'response' })
      .pipe(map((resposta) => this.extrairId(resposta.headers.get('Location'))));
  }

  atualizar(id: string, comando: SalvarPropriedadeComando): Observable<Propriedade> {
    return this.http.put<Propriedade>(`${this.propriedadesUrl}/${id}`, comando);
  }

  retirar(id: string): Observable<Propriedade> {
    return this.http.post<Propriedade>(`${this.propriedadesUrl}/${id}/retirada`, {});
  }

  reservar(id: string): Observable<Propriedade> {
    return this.http.post<Propriedade>(`${this.propriedadesUrl}/${id}/reserva`, {});
  }

  desfazerReserva(id: string): Observable<Propriedade> {
    return this.http.delete<Propriedade>(`${this.propriedadesUrl}/${id}/reserva`);
  }

  vender(id: string): Observable<Propriedade> {
    return this.http.post<Propriedade>(`${this.propriedadesUrl}/${id}/venda`, {});
  }

  private paraParams(filtro: PropriedadeFiltro, page: number, size: number): HttpParams {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filtro.situacao) {
      params = params.set('situacao', filtro.situacao);
    }
    if (filtro.proprietarioId) {
      params = params.set('proprietarioId', filtro.proprietarioId);
    }
    if (filtro.localidade) {
      params = params.set('localidade', filtro.localidade);
    }
    if (filtro.uf) {
      params = params.set('uf', filtro.uf);
    }
    if (filtro.valorMin !== undefined) {
      params = params.set('valorMin', filtro.valorMin);
    }
    if (filtro.valorMax !== undefined) {
      params = params.set('valorMax', filtro.valorMax);
    }
    return params;
  }

  private extrairId(location: string | null): string {
    if (!location) {
      throw new Error('Location ausente na resposta de criação de propriedade');
    }
    return location.substring(location.lastIndexOf('/') + 1);
  }
}
