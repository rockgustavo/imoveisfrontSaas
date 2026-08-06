import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AppError } from '../../core/app-error.model';
import { PainelIndicadores } from '../painel.model';
import { PainelService } from '../painel.service';
import { PainelPage } from './painel-page';

const indicadoresExemplo: PainelIndicadores = {
  contratosAtivos: 3,
  contratosVencendoEm30Dias: 1,
  imoveisPorSituacao: { DISPONIVEL: 2, AGENCIADA: 3, RESERVADA: 0, VENDIDA: 0, RETIRADA: 1 },
  orcamentosAguardandoResposta: 2,
  funil: { lead: 1, prospect: 2, cliente: 3, clienteInativo: 0 },
  comissaoProjetada: '27000.00'
};

function configurar() {
  const service = { buscar: vi.fn().mockReturnValue(of(indicadoresExemplo)) };

  TestBed.configureTestingModule({
    imports: [PainelPage],
    providers: [{ provide: PainelService, useValue: service }]
  });

  const fixture = TestBed.createComponent(PainelPage);
  return { fixture, component: fixture.componentInstance, service };
}

describe('PainelPage', () => {
  it('carrega os indicadores ao criar o componente', () => {
    const { component, service } = configurar();

    expect(service.buscar).toHaveBeenCalled();
    expect(component['indicadores']()).toEqual(indicadoresExemplo);
    expect(component['carregando']()).toBe(false);
  });

  it('expõe o erro normalizado quando a busca de indicadores falha', () => {
    const service = { buscar: vi.fn().mockReturnValue(throwError(() => ({ status: 500, title: 'Erro' } as AppError))) };

    TestBed.configureTestingModule({
      imports: [PainelPage],
      providers: [{ provide: PainelService, useValue: service }]
    });
    const fixture = TestBed.createComponent(PainelPage);

    expect(fixture.componentInstance['erro']()).toEqual({ status: 500, title: 'Erro' });
    expect(fixture.componentInstance['carregando']()).toBe(false);
  });
});
