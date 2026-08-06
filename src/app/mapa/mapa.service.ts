import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../core/api.config';
import { BoundingBox, MapaFiltro, MapaResposta } from './mapa.model';

@Injectable({ providedIn: 'root' })
export class MapaService {
  private readonly http = inject(HttpClient);
  private readonly mapaUrl = `${API_BASE_URL}/mapa/propriedades`;

  buscar(bbox: BoundingBox, filtro: MapaFiltro): Observable<MapaResposta> {
    return this.http.get<MapaResposta>(this.mapaUrl, { params: this.paraParams(bbox, filtro) });
  }

  private paraParams(bbox: BoundingBox, filtro: MapaFiltro): HttpParams {
    let params = new HttpParams().set('bbox', `${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon}`);
    for (const situacao of filtro.situacao ?? []) {
      params = params.append('situacao', situacao);
    }
    if (filtro.statusContrato) {
      params = params.set('statusContrato', filtro.statusContrato);
    }
    if (filtro.valorMin !== undefined) {
      params = params.set('valorMin', filtro.valorMin);
    }
    if (filtro.valorMax !== undefined) {
      params = params.set('valorMax', filtro.valorMax);
    }
    if (filtro.localidade) {
      params = params.set('localidade', filtro.localidade);
    }
    if (filtro.uf) {
      params = params.set('uf', filtro.uf);
    }
    if (filtro.proprietarioId) {
      params = params.set('proprietarioId', filtro.proprietarioId);
    }
    return params;
  }
}
