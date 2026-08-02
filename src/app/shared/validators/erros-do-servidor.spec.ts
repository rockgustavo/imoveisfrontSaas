import { FormControl, FormGroup, Validators } from '@angular/forms';

import { AppError } from '../../core/app-error.model';
import { aplicarErrosDoServidor, campoInvalido, limparErrosDoServidor } from './erros-do-servidor';

function formDeTeste(): FormGroup {
  return new FormGroup({
    nome: new FormControl('', [Validators.required]),
    email: new FormControl('')
  });
}

function erroDeValidacao(campos: Record<string, string>): AppError {
  return { status: 400, title: 'Bad Request', detail: 'Payload inválido', codigo: 'PAYLOAD_INVALIDO', campos };
}

describe('aplicarErrosDoServidor', () => {
  it('marca o control correspondente com a mensagem vinda do backend', () => {
    const form = formDeTeste();

    const naoMapeados = aplicarErrosDoServidor(form, erroDeValidacao({ nome: 'não deve estar em branco' }));

    expect(form.controls['nome'].errors?.['servidor']).toBe('não deve estar em branco');
    expect(form.controls['nome'].touched).toBe(true);
    expect(naoMapeados).toEqual([]);
  });

  it('devolve os campos que não existem no formulário em vez de descartá-los', () => {
    const form = formDeTeste();

    const naoMapeados = aplicarErrosDoServidor(form, erroDeValidacao({ campoInexistente: 'valor inválido' }));

    expect(naoMapeados).toEqual([{ rotulo: 'campoInexistente', mensagem: 'valor inválido', obrigatorio: false }]);
  });

  it('preserva os erros de validação já existentes no control', () => {
    const form = formDeTeste();
    form.controls['nome'].markAsTouched();

    aplicarErrosDoServidor(form, erroDeValidacao({ nome: 'já cadastrado' }));

    expect(form.controls['nome'].errors).toEqual({ required: true, servidor: 'já cadastrado' });
  });

  it('ignora erro sem campos, como erro de regra de negócio', () => {
    const form = formDeTeste();

    const naoMapeados = aplicarErrosDoServidor(form, {
      status: 422,
      title: 'Erro',
      detail: 'último administrador',
      codigo: 'PESSOA_ULTIMO_ADMINISTRADOR'
    });

    expect(naoMapeados).toEqual([]);
    expect(form.controls['nome'].errors).toEqual({ required: true });
  });
});

describe('limparErrosDoServidor', () => {
  it('remove só o erro do servidor, mantendo os validadores locais', () => {
    const form = formDeTeste();
    aplicarErrosDoServidor(form, erroDeValidacao({ nome: 'já cadastrado' }));

    limparErrosDoServidor(form);

    expect(form.controls['nome'].errors).toEqual({ required: true });
  });

  it('zera os erros do control quando o do servidor era o único', () => {
    const form = formDeTeste();
    aplicarErrosDoServidor(form, erroDeValidacao({ email: 'já cadastrado' }));

    limparErrosDoServidor(form);

    expect(form.controls['email'].errors).toBeNull();
  });
});

describe('campoInvalido', () => {
  it('só acusa inválido depois que o campo foi tocado', () => {
    const form = formDeTeste();

    expect(campoInvalido(form, 'nome')).toBe(false);

    form.controls['nome'].markAsTouched();
    expect(campoInvalido(form, 'nome')).toBe(true);
  });

  it('é falso para campo válido ou inexistente', () => {
    const form = formDeTeste();
    form.controls['email'].markAsTouched();

    expect(campoInvalido(form, 'email')).toBe(false);
    expect(campoInvalido(form, 'inexistente')).toBe(false);
  });
});
