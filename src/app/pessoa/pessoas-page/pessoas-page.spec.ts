import { TestBed } from '@angular/core/testing';
import Keycloak from 'keycloak-js';
import { of, throwError } from 'rxjs';

import { AppError } from '../../core/app-error.model';
import { PageResponse } from '../../shared/page-response.model';
import { Pessoa } from '../pessoa.model';
import { PessoaService } from '../pessoa.service';
import { PessoasPage } from './pessoas-page';

const pessoaExemplo: Pessoa = {
  id: '019fc00d-c808-7759-ba91-903f935ae2c4',
  tipoDocumento: 'CPF',
  documento: '52998224725',
  nome: 'Fulano de Tal',
  email: null,
  ativo: true,
  papeis: [],
  classificacao: 'LEAD',
  criadoEm: '2026-08-01T00:00:00Z',
  alteradoEm: '2026-08-01T00:00:00Z'
};

function paginaCom(pessoas: Pessoa[], totalPages = 1): PageResponse<Pessoa> {
  return { content: pessoas, page: 0, size: 20, totalElements: pessoas.length, totalPages };
}

function configurar(papeisConcedidos: string[] = ['ADMINISTRADOR']) {
  const service = { listar: vi.fn().mockReturnValue(of(paginaCom([pessoaExemplo]))) };
  const keycloak = { hasRealmRole: (papel: string) => papeisConcedidos.includes(papel) } as Keycloak;

  TestBed.configureTestingModule({
    imports: [PessoasPage],
    providers: [
      { provide: PessoaService, useValue: service },
      { provide: Keycloak, useValue: keycloak }
    ]
  });

  const fixture = TestBed.createComponent(PessoasPage);
  return { fixture, component: fixture.componentInstance, service };
}

describe('PessoasPage', () => {
  it('carrega a primeira página de pessoas ativas ao criar o componente', () => {
    const { component, service } = configurar();

    expect(service.listar).toHaveBeenCalledWith(
      { documento: undefined, papel: undefined, classificacao: undefined, ativo: true },
      0,
      20
    );
    expect(component['pessoas']()).toEqual([pessoaExemplo]);
  });

  it('volta para a página 0 ao buscar com novo filtro', () => {
    const { component, service } = configurar();
    component['pagina'].set(2);

    component['filtro'].patchValue({ documento: '52998224725' });
    component['buscar']();

    expect(component['pagina']()).toBe(0);
    expect(service.listar).toHaveBeenLastCalledWith(
      { documento: '52998224725', papel: undefined, classificacao: undefined, ativo: true },
      0,
      20
    );
  });

  it('traduz o filtro de situação para booleano', () => {
    const { component, service } = configurar();

    component['filtro'].patchValue({ ativo: 'todos' });
    component['buscar']();
    expect(service.listar).toHaveBeenLastCalledWith(expect.objectContaining({ ativo: undefined }), 0, 20);

    component['filtro'].patchValue({ ativo: 'inativos' });
    component['buscar']();
    expect(service.listar).toHaveBeenLastCalledWith(expect.objectContaining({ ativo: false }), 0, 20);
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

  it('podeCriar é falso sem o papel ADMINISTRADOR', () => {
    const { component } = configurar(['USUARIO']);
    expect(component['podeCriar']).toBe(false);
  });

  it('podeCriar é verdadeiro com o papel ADMINISTRADOR', () => {
    const { component } = configurar(['ADMINISTRADOR']);
    expect(component['podeCriar']).toBe(true);
  });
});
