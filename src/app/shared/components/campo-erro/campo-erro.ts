import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { EMPTY, switchMap } from 'rxjs';

import { primeiraMensagem } from '../../validators/mensagens-validacao';

@Component({
  selector: 'app-campo-erro',
  template: `
    @if (mensagem()) {
      <div class="invalid-feedback d-block">{{ mensagem() }}</div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampoErro {
  readonly control = input.required<AbstractControl | null>();

  private readonly ultimaMudanca = toSignal(
    toObservable(this.control).pipe(switchMap((control) => control?.events ?? EMPTY))
  );

  protected readonly mensagem = computed(() => {
    const control = this.ultimaMudanca()?.source ?? this.control();
    if (!control || !control.invalid || !(control.touched || control.dirty)) {
      return null;
    }
    return primeiraMensagem(control.errors);
  });
}
