import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const maiorQueZero: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = control.value;
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }
  return Number(valor) > 0 ? null : { maiorQueZero: true };
};
