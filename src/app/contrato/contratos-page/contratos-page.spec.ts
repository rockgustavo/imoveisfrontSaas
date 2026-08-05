import { TestBed } from '@angular/core/testing';
import Keycloak from 'keycloak-js';
import { of, throwError } from 'rxjs';

import { AppError } from '../../core/app-error.model';
import { PageResponse } from '../../shared/page-response.model';
import { ContratoResumo } from '../contrato.model';
import { ContratoService } from '../contrato.service';
import { ContratosPage } from './contratos-page';

const contratoExemplo: ContratoResumo = {
  id: '019fc00d-c808-7759-ba91-903f935ae2c4',
  pessoaId: '019fc00d-c808-7759-ba91-903f935ae2c5',
  status: 'RASCUNHO',
  vigenciaInicio: '2026-08-20',
  vigenciaFim: '2027-08-20',
  quantidadeAgenciamentos: 1,
  valorTotal: '450000.00',
  criadoEm: '2026-08-01T00:00:00Z'
};

function paginaCom(contratos: ContratoResumo[], totalPages = 1): PageResponse<ContratoResumo> {
  return { content: contratos, page: 0, size: 20, totalElements: contratos.length, totalPages };
}

function configurar(papeisConcedidos: string[] = ['ADMINISTRADOR']) {
  const service = { listar: vi.fn().mockReturnValue(of(paginaCom([contratoExemplo]))) };
  const keycloak = { hasRealmRole: (papel: string) => papeisConcedidos.includes(papel) } as Keycloak;

  TestBed.configureTestingModule({
    imports: [ContratosPage],
    providers: [
      { provide: ContratoService, useValue: service },
      { provide: Keycloak, useValue: keycloak }
    ]
  });

  const fixture = TestBed.createComponent(ContratosPage);
  return { fixture, component: fixture.componentInstance, service };
}

describe('ContratosPage', () => {
  it('carrega a primeira página de contratos ao criar o componente', () => {
    const { component, service } = configurar();

    expect(service.listar).toHaveBeenCalledWith({ status: undefined }, 0, 20);
    expect(component['contratos']()).toEqual([contratoExemplo]);
  });

  it('volta para a página 0 ao buscar com novo filtro', () => {
    const { component, service } = configurar();
    component['pagina'].set(2);

    component['filtro'].patchValue({ status: 'ATIVO' });
    component['buscar']();

    expect(component['pagina']()).toBe(0);
    expect(service.listar).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'ATIVO' }), 0, 20);
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

  it('mapeia status para a classe de badge correspondente', () => {
    const { component } = configurar();

    expect(component['classeBadgeStatus']('RASCUNHO')).toBe('bg-secondary');
    expect(component['classeBadgeStatus']('ATIVO')).toBe('bg-success');
    expect(component['classeBadgeStatus']('CANCELADO')).toBe('bg-danger');
  });
});
