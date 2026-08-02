import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';

import { CampoErro } from './campo-erro';

@Component({
  imports: [CampoErro],
  template: `<app-campo-erro [control]="control" />`
})
class Hospedeiro {
  readonly control = new FormControl('', [Validators.required]);
}

function montar() {
  const fixture = TestBed.createComponent(Hospedeiro);
  fixture.detectChanges();
  return { fixture, control: fixture.componentInstance.control, texto: () => fixture.nativeElement.textContent.trim() };
}

describe('CampoErro', () => {
  it('não acusa nada antes de o campo ser tocado', () => {
    const { texto } = montar();

    expect(texto()).toBe('');
  });

  it('mostra a mensagem quando o campo é tocado, ainda que a referência do control não mude', () => {
    const { fixture, control, texto } = montar();

    control.markAsTouched();
    fixture.detectChanges();

    expect(texto()).toBe('Campo obrigatório');
  });

  it('mostra a mensagem que veio do backend', () => {
    const { fixture, control, texto } = montar();
    control.markAsTouched();

    control.setErrors({ servidor: 'CPF já cadastrado neste tenant' });
    fixture.detectChanges();

    expect(texto()).toBe('CPF já cadastrado neste tenant');
  });

  it('some quando o campo é corrigido', () => {
    const { fixture, control, texto } = montar();
    control.markAsTouched();
    fixture.detectChanges();

    control.setValue('Fulano de Tal');
    fixture.detectChanges();

    expect(texto()).toBe('');
  });
});
