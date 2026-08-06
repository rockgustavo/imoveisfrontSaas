import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../core/api.config';
import { PainelIndicadores } from './painel.model';

@Injectable({ providedIn: 'root' })
export class PainelService {
  private readonly http = inject(HttpClient);
  private readonly indicadoresUrl = `${API_BASE_URL}/painel/indicadores`;

  buscar(): Observable<PainelIndicadores> {
    return this.http.get<PainelIndicadores>(this.indicadoresUrl);
  }
}
