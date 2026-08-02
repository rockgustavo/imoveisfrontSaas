import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../core/api.config';
import { ParametrosTenant } from './parametros-tenant.model';
import { Tenant } from './tenant.model';

@Injectable({ providedIn: 'root' })
export class ImobiliariaService {
  private readonly http = inject(HttpClient);
  private readonly tenantUrl = `${API_BASE_URL}/tenant`;
  private readonly parametrosUrl = `${API_BASE_URL}/tenant/parametros`;

  buscarTenant(): Observable<Tenant> {
    return this.http.get<Tenant>(this.tenantUrl);
  }

  buscarParametros(): Observable<ParametrosTenant> {
    return this.http.get<ParametrosTenant>(this.parametrosUrl);
  }

  atualizarParametros(parametros: ParametrosTenant): Observable<ParametrosTenant> {
    return this.http.put<ParametrosTenant>(this.parametrosUrl, parametros);
  }
}
