import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const PESOS_CPF_DV1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_CPF_DV2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_CNPJ_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_CNPJ_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function cpfValido(documento: string): boolean {
  const digitos = somenteDigitos(documento);
  if (digitos.length !== 11 || todosDigitosIguais(digitos)) {
    return false;
  }
  return digitosVerificadoresConferem(digitos, 9, PESOS_CPF_DV1, PESOS_CPF_DV2);
}

export function cnpjValido(documento: string): boolean {
  const digitos = somenteDigitos(documento);
  if (digitos.length !== 14 || todosDigitosIguais(digitos)) {
    return false;
  }
  return digitosVerificadoresConferem(digitos, 12, PESOS_CNPJ_DV1, PESOS_CNPJ_DV2);
}

export function documentoValidator(tipoControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }
    const tipo = control.parent?.get(tipoControlName)?.value;
    const valido = tipo === 'CNPJ' ? cnpjValido(valor) : cpfValido(valor);
    return valido ? null : { documento: true };
  };
}

export function somenteDigitos(valor: string): string {
  return (valor ?? '').replace(/\D/g, '');
}

function todosDigitosIguais(digitos: string): boolean {
  return new Set(digitos).size === 1;
}

function digitosVerificadoresConferem(
  digitos: string,
  tamanhoBase: number,
  pesosDv1: number[],
  pesosDv2: number[]
): boolean {
  const base = digitos.substring(0, tamanhoBase);
  const dv1 = digitoVerificador(base, pesosDv1);
  const dv2 = digitoVerificador(base + dv1, pesosDv2);
  return dv1 === Number(digitos[tamanhoBase]) && dv2 === Number(digitos[tamanhoBase + 1]);
}

function digitoVerificador(numero: string, pesos: number[]): number {
  const soma = pesos.reduce((acumulado, peso, indice) => acumulado + Number(numero[indice]) * peso, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}
