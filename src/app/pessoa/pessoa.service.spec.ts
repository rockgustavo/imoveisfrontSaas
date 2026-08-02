import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Pessoa } from './pessoa.model';
import { PessoaService } from './pessoa.service';

describe('PessoaService', () => {
  let service: PessoaService;
  let httpTesting: HttpTestingController;

  const pessoasUrl = 'http://localhost:8080/api/v1/pessoas';

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(PessoaService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('lista pessoas com os filtros e a paginação informados', () => {
    service.listar({ papel: 'ADMINISTRADOR', ativo: true }, 1, 10).subscribe();

    const requisicao = httpTesting.expectOne(
      (req) => req.url === pessoasUrl && req.params.get('page') === '1' && req.params.get('size') === '10'
    );
    expect(requisicao.request.params.get('papel')).toBe('ADMINISTRADOR');
    expect(requisicao.request.params.get('ativo')).toBe('true');
    expect(requisicao.request.params.has('documento')).toBe(false);
    requisicao.flush({ content: [pessoaExemplo], page: 1, size: 10, totalElements: 1, totalPages: 1 });
  });

  it('busca uma pessoa por id', () => {
    let resultado: Pessoa | undefined;
    service.buscarPorId(pessoaExemplo.id).subscribe((pessoa) => (resultado = pessoa));

    const requisicao = httpTesting.expectOne(`${pessoasUrl}/${pessoaExemplo.id}`);
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush(pessoaExemplo);

    expect(resultado).toEqual(pessoaExemplo);
  });

  it('extrai o id do header Location ao criar pessoa', () => {
    let idCriado: string | undefined;
    service
      .criar({ tipoDocumento: 'CPF', documento: '52998224725', nome: 'Fulano de Tal' })
      .subscribe((id) => (idCriado = id));

    const requisicao = httpTesting.expectOne(pessoasUrl);
    expect(requisicao.request.method).toBe('POST');
    requisicao.flush(null, { headers: { Location: `${pessoasUrl}/${pessoaExemplo.id}` } });

    expect(idCriado).toBe(pessoaExemplo.id);
  });

  it('envia PUT ao atualizar pessoa', () => {
    service.atualizar(pessoaExemplo.id, { nome: 'Novo Nome' }).subscribe();

    const requisicao = httpTesting.expectOne(`${pessoasUrl}/${pessoaExemplo.id}`);
    expect(requisicao.request.method).toBe('PUT');
    expect(requisicao.request.body).toEqual({ nome: 'Novo Nome' });
    requisicao.flush(pessoaExemplo);
  });

  it('envia POST ao atribuir papel', () => {
    service.atribuirPapel(pessoaExemplo.id, { papel: 'USUARIO', email: 'fulano@exemplo.com' }).subscribe();

    const requisicao = httpTesting.expectOne(`${pessoasUrl}/${pessoaExemplo.id}/papeis`);
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({ papel: 'USUARIO', email: 'fulano@exemplo.com' });
    requisicao.flush(pessoaExemplo);
  });

  it('envia DELETE ao remover papel', () => {
    service.removerPapel(pessoaExemplo.id, 'ADMINISTRADOR').subscribe();

    const requisicao = httpTesting.expectOne(`${pessoasUrl}/${pessoaExemplo.id}/papeis/ADMINISTRADOR`);
    expect(requisicao.request.method).toBe('DELETE');
    requisicao.flush(null);
  });

  it('envia POST ao inativar pessoa', () => {
    service.inativar(pessoaExemplo.id).subscribe();

    const requisicao = httpTesting.expectOne(`${pessoasUrl}/${pessoaExemplo.id}/inativacao`);
    expect(requisicao.request.method).toBe('POST');
    requisicao.flush(null);
  });
});
