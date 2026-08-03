import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../core/api.config';
import { Cep } from './cep.model';

@Injectable({ providedIn: 'root' })
export class CepService {
  private readonly http = inject(HttpClient);
  private readonly cepsUrl = `${API_BASE_URL}/ceps`;

  consultar(cep: string): Observable<Cep> {
    return this.http.get<Cep>(`${this.cepsUrl}/${cep}`);
  }
}
