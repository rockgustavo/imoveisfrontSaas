import { ValidationErrors } from '@angular/forms';

const MENSAGENS: Record<string, string> = {
  required: 'Campo obrigatório',
  email: 'E-mail inválido',
  documento: 'Documento inválido — confira os dígitos verificadores',
  maiorQueZero: 'Informe um valor maior que zero',
  minlength: 'Valor muito curto',
  maxlength: 'Valor muito longo',
  servidor: ''
};

export function primeiraMensagem(erros: ValidationErrors | null | undefined): string | null {
  if (!erros) {
    return null;
  }
  if (typeof erros['servidor'] === 'string') {
    return erros['servidor'];
  }
  const chave = Object.keys(erros).find((erro) => erro in MENSAGENS);
  return chave ? MENSAGENS[chave] : 'Valor inválido';
}
