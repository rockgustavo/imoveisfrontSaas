import { FormControl, FormGroup } from '@angular/forms';

import { cnpjValido, cpfValido, documentoValidator } from './documento.validator';

describe('cpfValido', () => {
  it('aceita CPF com dígitos verificadores corretos', () => {
    expect(cpfValido('52998224725')).toBe(true);
  });

  it('aceita CPF formatado com máscara', () => {
    expect(cpfValido('529.982.247-25')).toBe(true);
  });

  it('rejeita CPF com todos os dígitos iguais', () => {
    expect(cpfValido('11111111111')).toBe(false);
  });

  it('rejeita CPF com dígito verificador errado', () => {
    expect(cpfValido('52998224726')).toBe(false);
  });

  it('rejeita CPF com tamanho errado', () => {
    expect(cpfValido('123')).toBe(false);
  });
});

describe('cnpjValido', () => {
  it('aceita CNPJ com dígitos verificadores corretos', () => {
    expect(cnpjValido('11222333000181')).toBe(true);
  });

  it('rejeita CNPJ com todos os dígitos iguais', () => {
    expect(cnpjValido('11111111111111')).toBe(false);
  });

  it('rejeita CNPJ com dígito verificador errado', () => {
    expect(cnpjValido('11222333000182')).toBe(false);
  });
});

describe('documentoValidator', () => {
  function formCom(tipoDocumento: string, documento: string): FormGroup {
    const form = new FormGroup({
      tipoDocumento: new FormControl(tipoDocumento),
      documento: new FormControl(documento, [documentoValidator('tipoDocumento')])
    });
    form.controls['documento'].updateValueAndValidity();
    return form;
  }

  it('valida como CPF quando o tipo é CPF', () => {
    expect(formCom('CPF', '52998224725').controls['documento'].errors).toBeNull();
    expect(formCom('CPF', '11222333000181').controls['documento'].errors).toEqual({ documento: true });
  });

  it('valida como CNPJ quando o tipo é CNPJ', () => {
    expect(formCom('CNPJ', '11222333000181').controls['documento'].errors).toBeNull();
    expect(formCom('CNPJ', '52998224725').controls['documento'].errors).toEqual({ documento: true });
  });

  it('não se aplica quando o campo está vazio, deixando o required cuidar disso', () => {
    expect(formCom('CPF', '').controls['documento'].errors).toBeNull();
  });
});
