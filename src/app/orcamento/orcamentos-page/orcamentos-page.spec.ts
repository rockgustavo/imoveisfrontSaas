import { TestBed } from '@angular/core/testing';
import Keycloak from 'keycloak-js';
import { of, throwError } from 'rxjs';

import { AppError } from '../../core/app-error.model';
import { PageResponse } from '../../shared/page-response.model';
import { OrcamentoResumo } from '../orcamento.model';
import { OrcamentoService } from '../orcamento.service';
import { OrcamentosPage } from './orcamentos-page';

const orcamentoExemplo: OrcamentoResumo = {
  id: '019fc00d-c808-7759-ba91-903f935ae2c4',
  pessoaId: '019fc00d-c808-7759-ba91-903f935ae2c5',
  status: 'RASCUNHO',
  validade: '2026-08-20',
  versao: 1,
  quantidadeItens: 1,
  valorTotal: '450000.00',
  criadoEm: '2026-08-01T00:00:00Z'
};

function paginaCom(orcamentos: OrcamentoResumo[], totalPages = 1): PageResponse<OrcamentoResumo> {
  return { content: orcamentos, page: 0, size: 20, totalElements: orcamentos.length, totalPages };
}

function configurar(papeisConcedidos: string[] = ['ADMINISTRADOR']) {
  const service = { listar: vi.fn().mockReturnValue(of(paginaCom([orcamentoExemplo]))) };
  const keycloak = { hasRealmRole: (papel: string) => papeisConcedidos.includes(papel) } as Keycloak;

  TestBed.configureTestingModule({
    imports: [OrcamentosPage],
    providers: [
      { provide: OrcamentoService, useValue: service },
      { provide: Keycloak, useValue: keycloak }
    ]
  });

  const fixture = TestBed.createComponent(OrcamentosPage);
  return { fixture, component: fixture.componentInstance, service };
}

describe('OrcamentosPage', () => {
  it('carrega a primeira página de orçamentos ao criar o componente', () => {
    const { component, service } = configurar();

    expect(service.listar).toHaveBeenCalledWith({ status: undefined }, 0, 20);
    expect(component['orcamentos']()).toEqual([orcamentoExemplo]);
  });

  it('volta para a página 0 ao buscar com novo filtro', () => {
    const { component, service } = configurar();
    component['pagina'].set(2);

    component['filtro'].patchValue({ status: 'ENVIADO' });
    component['buscar']();

    expect(component['pagina']()).toBe(0);
    expect(service.listar).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'ENVIADO' }), 0, 20);
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
    expect(component['classeBadgeStatus']('ACEITO')).toBe('bg-success');
    expect(component['classeBadgeStatus']('EXPIRADO')).toBe('bg-dark');
  });
});
