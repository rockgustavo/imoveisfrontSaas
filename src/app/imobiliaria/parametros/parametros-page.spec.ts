import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AppError } from '../../core/app-error.model';
import { ImobiliariaService } from '../imobiliaria.service';
import { ParametrosTenant } from '../parametros-tenant.model';
import { ParametrosPage } from './parametros-page';

const parametrosIniciais: ParametrosTenant = {
  comissaoPercentualTeto: '6.00',
  orcamentoValidadeDiasPadrao: 15,
  geocodificacaoTentativasMax: 5,
  cepCacheJanelaDias: 30,
  fusoHorario: 'America/Sao_Paulo'
};

describe('ParametrosPage', () => {
  let fixture: ComponentFixture<ParametrosPage>;
  let component: ParametrosPage;
  let service: {
    buscarParametros: ReturnType<typeof vi.fn>;
    atualizarParametros: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      buscarParametros: vi.fn().mockReturnValue(of(parametrosIniciais)),
      atualizarParametros: vi.fn().mockReturnValue(of(parametrosIniciais))
    };

    await TestBed.configureTestingModule({
      imports: [ParametrosPage],
      providers: [{ provide: ImobiliariaService, useValue: service }]
    }).compileComponents();

    fixture = TestBed.createComponent(ParametrosPage);
    component = fixture.componentInstance;
  });

  it('carrega os parâmetros do tenant ao criar o componente', () => {
    expect(service.buscarParametros).toHaveBeenCalledTimes(1);
    expect(component['form'].getRawValue()).toEqual({
      comissaoPercentualTeto: 6,
      orcamentoValidadeDiasPadrao: 15,
      geocodificacaoTentativasMax: 5,
      cepCacheJanelaDias: 30,
      fusoHorario: 'America/Sao_Paulo'
    });
  });

  it('não chama atualizarParametros quando o formulário é inválido', () => {
    component['form'].patchValue({ comissaoPercentualTeto: 0 });

    component['salvar']();

    expect(service.atualizarParametros).not.toHaveBeenCalled();
    expect(component['form'].touched).toBe(true);
  });

  it('chama atualizarParametros com o payload convertido quando o formulário é válido', () => {
    component['form'].patchValue({ comissaoPercentualTeto: 7.5 });

    component['salvar']();

    expect(service.atualizarParametros).toHaveBeenCalledWith({
      comissaoPercentualTeto: '7.50',
      orcamentoValidadeDiasPadrao: 15,
      geocodificacaoTentativasMax: 5,
      cepCacheJanelaDias: 30,
      fusoHorario: 'America/Sao_Paulo'
    });
  });

  it('expõe o erro normalizado quando atualizarParametros falha', () => {
    const erro: AppError = { status: 422, title: 'Parâmetro inválido', detail: 'teto deve ser maior que zero' };
    service.atualizarParametros.mockReturnValue(throwError(() => erro));

    component['salvar']();

    expect(component['erro']()).toEqual(erro);
    expect(component['salvando']()).toBe(false);
  });
});
