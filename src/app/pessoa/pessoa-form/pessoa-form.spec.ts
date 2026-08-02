import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import Keycloak from 'keycloak-js';
import { of, throwError } from 'rxjs';

import { AppError } from '../../core/app-error.model';
import { Pessoa } from '../pessoa.model';
import { PessoaService } from '../pessoa.service';
import { PessoaForm } from './pessoa-form';

const pessoaExemplo: Pessoa = {
  id: '019fc00d-c808-7759-ba91-903f935ae2c4',
  tipoDocumento: 'CPF',
  documento: '52998224725',
  nome: 'Fulano de Tal',
  email: null,
  ativo: true,
  papeis: ['PROPRIETARIO'],
  classificacao: 'LEAD',
  criadoEm: '2026-08-01T00:00:00Z',
  alteradoEm: '2026-08-01T00:00:00Z'
};

function configurar(id: string | null, papeisConcedidos: string[] = ['ADMINISTRADOR']) {
  const service = {
    buscarPorId: vi.fn().mockReturnValue(of(pessoaExemplo)),
    criar: vi.fn().mockReturnValue(of(pessoaExemplo.id)),
    atualizar: vi.fn().mockReturnValue(of(pessoaExemplo)),
    atribuirPapel: vi.fn().mockReturnValue(of(pessoaExemplo)),
    removerPapel: vi.fn().mockReturnValue(of(undefined)),
    inativar: vi.fn().mockReturnValue(of(undefined))
  };
  const router = { navigate: vi.fn() };
  const keycloak = { hasRealmRole: (papel: string) => papeisConcedidos.includes(papel) } as Keycloak;

  TestBed.configureTestingModule({
    imports: [PessoaForm],
    providers: [
      { provide: PessoaService, useValue: service },
      { provide: Router, useValue: router },
      { provide: Keycloak, useValue: keycloak },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } }
    ]
  });

  const fixture = TestBed.createComponent(PessoaForm);
  return { fixture, component: fixture.componentInstance, service, router };
}

describe('PessoaForm — modo criação', () => {
  it('não carrega pessoa nem chama buscarPorId', () => {
    const { component, service } = configurar(null);

    expect(component['modoEdicao']).toBe(false);
    expect(service.buscarPorId).not.toHaveBeenCalled();
  });

  it('não envia quando o formulário é inválido', () => {
    const { component, service } = configurar(null);

    component['form'].patchValue({ documento: '', nome: '' });
    component['salvar']();

    expect(service.criar).not.toHaveBeenCalled();
    expect(component['form'].touched).toBe(true);
  });

  it('nomeia os campos que faltam, usando o tipo de documento escolhido como rótulo', () => {
    const { component } = configurar(null);

    component['form'].patchValue({ tipoDocumento: 'CNPJ', documento: '', nome: '' });
    component['salvar']();

    expect(component['pendencias']()).toEqual([
      { rotulo: 'CNPJ', mensagem: 'Campo obrigatório', obrigatorio: true },
      { rotulo: 'Nome', mensagem: 'Campo obrigatório', obrigatorio: true }
    ]);
  });

  it('limpa as pendências quando o formulário passa a estar completo', () => {
    const { component } = configurar(null);

    component['form'].patchValue({ documento: '', nome: '' });
    component['salvar']();
    component['form'].patchValue({ tipoDocumento: 'CPF', documento: '52998224725', nome: 'Fulano de Tal' });
    component['salvar']();

    expect(component['pendencias']()).toEqual([]);
  });

  it('transforma o erro de campo vindo do backend em pendência, sem alerta genérico', () => {
    const { component, service } = configurar(null);
    service.criar.mockReturnValue(
      throwError(() => ({
        status: 400,
        title: 'Bad Request',
        detail: 'Payload inválido',
        codigo: 'PAYLOAD_INVALIDO',
        campos: { nome: 'Campo obrigatório' }
      }))
    );

    component['form'].patchValue({ tipoDocumento: 'CPF', documento: '52998224725', nome: 'Fulano de Tal' });
    component['salvar']();

    expect(component['pendencias']()).toEqual([{ rotulo: 'Nome', mensagem: 'Campo obrigatório', obrigatorio: false }]);
    expect(component['erro']()).toBeNull();
  });

  it('cria a pessoa e navega para o detalhe ao salvar com sucesso', () => {
    const { component, service, router } = configurar(null);

    component['form'].patchValue({ tipoDocumento: 'CPF', documento: '52998224725', nome: 'Fulano de Tal' });
    component['salvar']();

    expect(service.criar).toHaveBeenCalledWith({
      tipoDocumento: 'CPF',
      documento: '52998224725',
      nome: 'Fulano de Tal',
      email: undefined
    });
    expect(router.navigate).toHaveBeenCalledWith(['/pessoas', pessoaExemplo.id]);
  });

  it('expõe o erro normalizado quando a criação falha', () => {
    const { component, service } = configurar(null);
    const erro: AppError = { status: 409, title: 'Duplicado', detail: 'documento já cadastrado' };
    service.criar.mockReturnValue(throwError(() => erro));

    component['form'].patchValue({ tipoDocumento: 'CPF', documento: '52998224725', nome: 'Fulano de Tal' });
    component['salvar']();

    expect(component['erro']()).toEqual(erro);
    expect(component['salvando']()).toBe(false);
  });
});

describe('PessoaForm — modo edição', () => {
  it('carrega a pessoa e preenche o formulário, travando tipo e documento', () => {
    const { component, service } = configurar(pessoaExemplo.id);

    expect(service.buscarPorId).toHaveBeenCalledWith(pessoaExemplo.id);
    expect(component['form'].getRawValue()).toEqual({
      tipoDocumento: 'CPF',
      documento: '52998224725',
      nome: 'Fulano de Tal',
      email: ''
    });
    expect(component['form'].controls.documento.disabled).toBe(true);
  });

  it('atualiza a pessoa ao salvar', () => {
    const { component, service } = configurar(pessoaExemplo.id);

    component['form'].patchValue({ nome: 'Novo Nome' });
    component['salvar']();

    expect(service.atualizar).toHaveBeenCalledWith(pessoaExemplo.id, { nome: 'Novo Nome', email: undefined });
  });

  it('atribui papel e reseta o formulário de papel', () => {
    const { component, service } = configurar(pessoaExemplo.id);

    component['papelForm'].patchValue({ papel: 'USUARIO', email: 'fulano@exemplo.com' });
    component['atribuirPapel']();

    expect(service.atribuirPapel).toHaveBeenCalledWith(pessoaExemplo.id, {
      papel: 'USUARIO',
      email: 'fulano@exemplo.com'
    });
    expect(component['papelForm'].getRawValue()).toEqual({ papel: 'PROPRIETARIO', email: '' });
  });

  it('remove papel após confirmação, atualizando o estado local sem refazer o GET', () => {
    const { component, service } = configurar(pessoaExemplo.id);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));

    component['removerPapel']('PROPRIETARIO');

    expect(service.removerPapel).toHaveBeenCalledWith(pessoaExemplo.id, 'PROPRIETARIO');
    expect(component['pessoa']()?.papeis).toEqual([]);
    expect(service.buscarPorId).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('não remove papel quando a confirmação é negada', () => {
    const { component, service } = configurar(pessoaExemplo.id);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));

    component['removerPapel']('PROPRIETARIO');

    expect(service.removerPapel).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('inativa a pessoa após confirmação, atualizando o estado local sem refazer o GET', () => {
    const { component, service } = configurar(pessoaExemplo.id);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));

    component['inativar']();

    expect(service.inativar).toHaveBeenCalledWith(pessoaExemplo.id);
    expect(component['pessoa']()?.ativo).toBe(false);
    expect(service.buscarPorId).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('esconde ações administrativas quando o usuário não é ADMINISTRADOR', () => {
    const { component } = configurar(pessoaExemplo.id, ['USUARIO']);

    expect(component['podeGerenciar']).toBe(false);
  });
});
