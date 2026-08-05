import { TestBed } from '@angular/core/testing';

import { MapaPropriedade } from '../mapa.model';
import { MapaService } from '../mapa.service';
import { MapaPage } from './mapa-page';

function configurar() {
  const service = { buscar: vi.fn() };

  TestBed.configureTestingModule({
    imports: [MapaPage],
    providers: [{ provide: MapaService, useValue: service }]
  });

  const fixture = TestBed.createComponent(MapaPage);
  return { fixture, component: fixture.componentInstance, service };
}

const propriedadeExemplo: MapaPropriedade = {
  id: '019fc00d-c808-7759-ba91-903f935ae2c4',
  proprietarioId: '019fc00d-c808-7759-ba91-903f935ae2c5',
  situacao: 'AGENCIADA',
  valorReferencia: '450000.00',
  logradouro: 'Av. Paulista',
  localidade: 'São Paulo',
  uf: 'SP',
  latitude: -23.55,
  longitude: -46.65,
  statusContrato: 'ATIVO'
};

describe('MapaPage', () => {
  it('converte o formulário vazio em filtro sem nenhum campo definido', () => {
    const { component } = configurar();

    const filtro = component['paraFiltro']();

    expect(filtro).toEqual({
      situacao: undefined,
      statusContrato: undefined,
      localidade: undefined,
      uf: undefined,
      valorMin: undefined,
      valorMax: undefined,
      proprietarioId: undefined
    });
  });

  it('converte apenas os campos preenchidos do formulário', () => {
    const { component } = configurar();

    component['filtro'].patchValue({ situacao: 'RESERVADA', statusContrato: 'CANCELADO', uf: 'RJ', valorMin: 100000 });

    expect(component['paraFiltro']()).toEqual(
      expect.objectContaining({ situacao: 'RESERVADA', statusContrato: 'CANCELADO', uf: 'RJ', valorMin: 100000 })
    );
  });

  it('RN-07-05: expõe uma cor de legenda para cada situação de propriedade', () => {
    const { component } = configurar();

    const situacoes = component['legenda'].map(([situacao]) => situacao);
    expect(situacoes).toEqual(['DISPONIVEL', 'AGENCIADA', 'RESERVADA', 'VENDIDA', 'RETIRADA']);
    expect(new Set(component['legenda'].map(([, cor]) => cor)).size).toBe(5);
  });

  it('gera um ícone colorido de acordo com a situação da propriedade', () => {
    const { component } = configurar();

    const icone = component['iconePorSituacao']('AGENCIADA') as { options: { html: string } };

    expect(icone.options.html).toContain('#0d6efd');
  });

  it('inclui o status do contrato no popup quando presente', () => {
    const { component } = configurar();

    const html = component['popupHtml'](propriedadeExemplo);

    expect(html).toContain('Av. Paulista');
    expect(html).toContain('São Paulo/SP');
    expect(html).toContain('Contrato: ATIVO');
  });

  it('omite a linha de contrato no popup quando a propriedade nunca foi agenciada', () => {
    const { component } = configurar();

    const html = component['popupHtml']({ ...propriedadeExemplo, statusContrato: null });

    expect(html).not.toContain('Contrato:');
  });
});
