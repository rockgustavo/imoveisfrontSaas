import { FormControl } from '@angular/forms';

import { maiorQueZero } from './parametros-tenant.validators';

describe('maiorQueZero', () => {
  it('aceita valor maior que zero', () => {
    expect(maiorQueZero(new FormControl(0.01))).toBeNull();
    expect(maiorQueZero(new FormControl(15))).toBeNull();
  });

  it('rejeita zero', () => {
    expect(maiorQueZero(new FormControl(0))).toEqual({ maiorQueZero: true });
  });

  it('rejeita valor negativo', () => {
    expect(maiorQueZero(new FormControl(-1))).toEqual({ maiorQueZero: true });
  });

  it('não se aplica quando o campo está vazio, deixando o required cuidar disso', () => {
    expect(maiorQueZero(new FormControl(null))).toBeNull();
    expect(maiorQueZero(new FormControl(''))).toBeNull();
  });
});
