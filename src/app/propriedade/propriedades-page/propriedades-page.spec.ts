import { TestBed } from '@angular/core/testing';
import Keycloak from 'keycloak-js';
import { of, throwError } from 'rxjs';

import { AppError } from '../../core/app-error.model';
import { PageResponse } from '../../shared/page-response.model';
import { PropriedadeResumo } from '../propriedade.model';
import { PropriedadeService } from '../propriedade.service';
import { PropriedadesPage } from './propriedades-page';

const propriedadeExemplo: PropriedadeResumo = {
  id: '019fc00d-c808-7759-ba91-903f935ae2c4',
  proprietarioId: '019fc00d-c808-7759-ba91-903f935ae2c5',
  tipo: 'APARTAMENTO',
  valorReferencia: '450000.00',
  situacao: 'DISPONIVEL',
  logradouro: 'Av. Paulista',
  bairro: 'Bela Vista',
  localidade: 'São Paulo',
  uf: 'SP',
  latitude: null,
  longitude: null,
  geoSituacao: 'PENDENTE',
  criadoEm: '2026-08-01T00:00:00Z'
};

function paginaCom(propriedades: PropriedadeResumo[], totalPages = 1): PageResponse<PropriedadeResumo> {
  return { content: propriedades, page: 0, size: 20, totalElements: propriedades.length, totalPages };
}

function configurar(papeisConcedidos: string[] = ['ADMINISTRADOR']) {
  const service = { listar: vi.fn().mockReturnValue(of(paginaCom([propriedadeExemplo]))) };
  const keycloak = { hasRealmRole: (papel: string) => papeisConcedidos.includes(papel) } as Keycloak;

  TestBed.configureTestingModule({
    imports: [PropriedadesPage],
    providers: [
      { provide: PropriedadeService, useValue: service },
      { provide: Keycloak, useValue: keycloak }
    ]
  });

  const fixture = TestBed.createComponent(PropriedadesPage);
  return { fixture, component: fixture.componentInstance, service };
}

describe('PropriedadesPage', () => {
  it('carrega a primeira página de propriedades ao criar o componente', () => {
    const { component, service } = configurar();

    expect(service.listar).toHaveBeenCalledWith(
      { situacao: undefined, localidade: undefined, uf: undefined, valorMin: undefined, valorMax: undefined },
      0,
      20
    );
    expect(component['propriedades']()).toEqual([propriedadeExemplo]);
  });

  it('volta para a página 0 ao buscar com novo filtro', () => {
    const { component, service } = configurar();
    component['pagina'].set(2);

    component['filtro'].patchValue({ uf: 'SP' });
    component['buscar']();

    expect(component['pagina']()).toBe(0);
    expect(service.listar).toHaveBeenLastCalledWith(expect.objectContaining({ uf: 'SP' }), 0, 20);
  });

  it('não navega para página inválida', () => {
    const { component, service } = configurar();
    service.listar.mockClear();

    component['irParaPagina'](-1);
    component['irParaPagina'](5);

    expect(service.listar).not.toHaveBeenCalled();
  });

  it('expõe o erro normalizado quando a listagem falha', () => {
    const { component, service } = configurar();
    const erro: AppError = { status: 500, title: 'Erro', detail: 'falha ao listar' };
    service.listar.mockReturnValue(throwError(() => erro));

    component['buscar']();

    expect(component['erro']()).toEqual(erro);
    expect(component['carregando']()).toBe(false);
  });

  it('podeCriar é falso sem os papéis USUARIO/ADMINISTRADOR', () => {
    const { component } = configurar([]);
    expect(component['podeCriar']).toBe(false);
  });

  it('podeCriar é verdadeiro com o papel USUARIO', () => {
    const { component } = configurar(['USUARIO']);
    expect(component['podeCriar']).toBe(true);
  });

  it('mapeia situação e geolocalização para a classe de badge correspondente', () => {
    const { component } = configurar();

    expect(component['classeBadgeSituacao']('DISPONIVEL')).toBe('bg-success');
    expect(component['classeBadgeSituacao']('RETIRADA')).toBe('bg-secondary');
    expect(component['classeBadgeGeo']('CONCLUIDA')).toBe('bg-success');
    expect(component['classeBadgeGeo']('PENDENTE')).toBe('bg-warning text-dark');
  });
});
