import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import * as L from 'leaflet';
import 'leaflet.markercluster';

import { AppError } from '../../core/app-error.model';
import { SituacaoPropriedade } from '../../propriedade/propriedade.model';
import { BoundingBox, MapaFiltro, MapaPropriedade, StatusContrato } from '../mapa.model';
import { MapaService } from '../mapa.service';

const CENTRO_BRASIL: L.LatLngExpression = [-14.235, -51.9253];
const ZOOM_INICIAL = 4;

const COR_POR_SITUACAO: Record<SituacaoPropriedade, string> = {
  DISPONIVEL: '#198754',
  AGENCIADA: '#0d6efd',
  RESERVADA: '#ffc107',
  VENDIDA: '#212529',
  RETIRADA: '#6c757d'
};

const FORMATADOR_MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

@Component({
  selector: 'app-mapa-page',
  imports: [ReactiveFormsModule],
  templateUrl: './mapa-page.html',
  styleUrl: './mapa-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapaPage implements AfterViewInit, OnDestroy {
  private readonly service = inject(MapaService);
  private readonly ngZone = inject(NgZone);
  private readonly containerRef = viewChild.required<ElementRef<HTMLElement>>('mapaContainer');

  protected readonly carregando = signal(false);
  protected readonly erro = signal<AppError | null>(null);
  protected readonly limitado = signal(false);
  protected readonly totalNaArea = signal(0);
  protected readonly legenda = Object.entries(COR_POR_SITUACAO) as [SituacaoPropriedade, string][];

  protected readonly filtro = new FormGroup({
    situacao: new FormControl<SituacaoPropriedade | ''>('', { nonNullable: true }),
    statusContrato: new FormControl<StatusContrato | ''>('', { nonNullable: true }),
    localidade: new FormControl('', { nonNullable: true }),
    uf: new FormControl('', { nonNullable: true }),
    valorMin: new FormControl<number | null>(null),
    valorMax: new FormControl<number | null>(null),
    proprietarioId: new FormControl('', { nonNullable: true })
  });

  private mapa!: L.Map;
  private marcadores!: L.MarkerClusterGroup;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => this.inicializarMapa());
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.mapa?.remove();
  }

  protected buscar(): void {
    this.consultarAreaVisivel();
  }

  private inicializarMapa(): void {
    const mapa = L.map(this.containerRef().nativeElement);
    this.mapa = mapa;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(mapa);

    this.marcadores = L.markerClusterGroup();
    mapa.addLayer(this.marcadores);

    mapa.on('moveend', () => this.ngZone.run(() => this.consultarAreaVisivel()));

    mapa.setView(CENTRO_BRASIL, ZOOM_INICIAL);

    this.resizeObserver = new ResizeObserver(() => mapa.invalidateSize());
    this.resizeObserver.observe(this.containerRef().nativeElement);
  }

  private consultarAreaVisivel(): void {
    const bbox = this.paraBoundingBox();
    this.carregando.set(true);
    this.erro.set(null);

    this.service.buscar(bbox, this.paraFiltro()).subscribe({
      next: (resposta) => {
        this.desenharMarcadores(resposta.propriedades);
        this.limitado.set(resposta.limitado);
        this.totalNaArea.set(resposta.propriedades.length);
        this.carregando.set(false);
      },
      error: (erro: AppError) => {
        this.erro.set(erro);
        this.carregando.set(false);
      }
    });
  }

  private desenharMarcadores(propriedades: MapaPropriedade[]): void {
    this.marcadores.clearLayers();
    for (const propriedade of propriedades) {
      const marcador = L.marker([propriedade.latitude, propriedade.longitude], {
        icon: this.iconePorSituacao(propriedade.situacao)
      });
      marcador.bindPopup(this.popupHtml(propriedade));
      this.marcadores.addLayer(marcador);
    }
  }

  private iconePorSituacao(situacao: SituacaoPropriedade): L.DivIcon {
    return L.divIcon({
      className: 'mapa-marcador',
      html: `<span style="background:${COR_POR_SITUACAO[situacao]}"></span>`,
      iconSize: [16, 16]
    });
  }

  private popupHtml(propriedade: MapaPropriedade): string {
    const valor = FORMATADOR_MOEDA.format(Number(propriedade.valorReferencia));
    const contrato = propriedade.statusContrato ? `<div>Contrato: ${propriedade.statusContrato}</div>` : '';
    return `
      <div class="mapa-popup">
        <strong>${propriedade.logradouro}</strong>
        <div>${propriedade.localidade}/${propriedade.uf}</div>
        <div>${valor}</div>
        <div>Situação: ${propriedade.situacao}</div>
        ${contrato}
      </div>
    `;
  }

  private paraBoundingBox(): BoundingBox {
    const limites = this.mapa.getBounds();
    return {
      minLat: limites.getSouth(),
      minLon: limites.getWest(),
      maxLat: limites.getNorth(),
      maxLon: limites.getEast()
    };
  }

  private paraFiltro(): MapaFiltro {
    const valores = this.filtro.getRawValue();
    return {
      situacao: valores.situacao || undefined,
      statusContrato: valores.statusContrato || undefined,
      localidade: valores.localidade || undefined,
      uf: valores.uf || undefined,
      valorMin: valores.valorMin ?? undefined,
      valorMax: valores.valorMax ?? undefined,
      proprietarioId: valores.proprietarioId || undefined
    };
  }
}
