import { FormGroup } from '@angular/forms';

import { primeiraMensagem } from './mensagens-validacao';

export interface CampoPendente {
  rotulo: string;
  mensagem: string;
  obrigatorio: boolean;
}

export function camposPendentes(form: FormGroup, rotulos: Record<string, string>): CampoPendente[] {
  return Object.entries(form.controls)
    .filter(([, control]) => control.invalid)
    .map(([nome, control]) => ({
      rotulo: rotulos[nome] ?? nome,
      mensagem: primeiraMensagem(control.errors) ?? 'Valor inválido',
      obrigatorio: !!control.errors?.['required']
    }));
}
