import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { CampoPendente } from '../../validators/campos-pendentes';

@Component({
  selector: 'app-resumo-validacao',
  template: `
    @if (campos().length > 0) {
      <div class="alert alert-danger d-flex gap-2" role="alert">
        <i class="bi bi-exclamation-triangle-fill flex-shrink-0 mt-1"></i>
        <div>
          <p class="fw-semibold mb-1">{{ titulo() }}</p>
          <ul class="mb-0 ps-3">
            @for (campo of campos(); track campo.rotulo) {
              <li>
                <strong>{{ campo.rotulo }}</strong> — {{ campo.mensagem }}
              </li>
            }
          </ul>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResumoValidacao {
  readonly campos = input.required<CampoPendente[]>();

  protected readonly titulo = computed(() =>
    this.campos().every((campo) => campo.obrigatorio)
      ? 'Preencha os campos obrigatórios'
      : 'Corrija os campos abaixo para continuar'
  );
}
