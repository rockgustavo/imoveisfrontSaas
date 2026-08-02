import { FormGroup } from '@angular/forms';

import { AppError } from '../../core/app-error.model';
import { CampoPendente } from './campos-pendentes';

export function campoInvalido(form: FormGroup, campo: string): boolean {
  const control = form.get(campo);
  return !!control && control.invalid && (control.touched || control.dirty);
}

export function aplicarErrosDoServidor(form: FormGroup, erro: AppError): CampoPendente[] {
  if (!erro.campos) {
    return [];
  }

  const naoMapeados: CampoPendente[] = [];
  for (const [campo, mensagem] of Object.entries(erro.campos)) {
    const control = form.get(campo);
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), servidor: mensagem });
      control.markAsTouched();
    } else {
      naoMapeados.push({ rotulo: campo, mensagem, obrigatorio: false });
    }
  }
  return naoMapeados;
}

export function limparErrosDoServidor(form: FormGroup): void {
  for (const control of Object.values(form.controls)) {
    if (!control.errors?.['servidor']) {
      continue;
    }
    const { servidor, ...demais } = control.errors;
    control.setErrors(Object.keys(demais).length > 0 ? demais : null);
  }
}
