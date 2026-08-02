import { FormControl, FormGroup, Validators } from '@angular/forms';

import { camposPendentes } from './campos-pendentes';
import { aplicarErrosDoServidor } from './erros-do-servidor';

const ROTULOS = { documento: 'CNPJ', nome: 'Nome', email: 'E-mail' };

function formDeTeste(): FormGroup {
  return new FormGroup({
    documento: new FormControl('', [Validators.required]),
    nome: new FormControl('', [Validators.required]),
    email: new FormControl('nao-e-email', [Validators.email])
  });
}

describe('camposPendentes', () => {
  it('nomeia cada campo inválido com o rótulo da tela', () => {
    expect(camposPendentes(formDeTeste(), ROTULOS)).toEqual([
      { rotulo: 'CNPJ', mensagem: 'Campo obrigatório', obrigatorio: true },
      { rotulo: 'Nome', mensagem: 'Campo obrigatório', obrigatorio: true },
      { rotulo: 'E-mail', mensagem: 'E-mail inválido', obrigatorio: false }
    ]);
  });

  it('deixa de fora os campos já preenchidos', () => {
    const form = formDeTeste();
    form.patchValue({ documento: '11222333000181', email: 'fulano@exemplo.com' });

    expect(camposPendentes(form, ROTULOS)).toEqual([
      { rotulo: 'Nome', mensagem: 'Campo obrigatório', obrigatorio: true }
    ]);
  });

  it('não lista nada quando o formulário está completo', () => {
    const form = formDeTeste();
    form.patchValue({ documento: '11222333000181', nome: 'Fulano de Tal', email: 'fulano@exemplo.com' });

    expect(camposPendentes(form, ROTULOS)).toEqual([]);
  });

  it('usa o nome do control quando a tela não declarou rótulo', () => {
    expect(camposPendentes(formDeTeste(), {})[0].rotulo).toBe('documento');
  });

  it('mostra a mensagem do backend quando o erro veio de lá', () => {
    const form = formDeTeste();
    form.patchValue({ documento: '11222333000181', nome: 'Fulano de Tal', email: 'fulano@exemplo.com' });
    aplicarErrosDoServidor(form, {
      status: 400,
      title: 'Bad Request',
      detail: 'Payload inválido',
      codigo: 'PAYLOAD_INVALIDO',
      campos: { documento: 'CNPJ já cadastrado neste tenant' }
    });

    expect(camposPendentes(form, ROTULOS)).toEqual([
      { rotulo: 'CNPJ', mensagem: 'CNPJ já cadastrado neste tenant', obrigatorio: false }
    ]);
  });
});
