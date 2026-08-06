import { SituacaoPropriedade } from '../propriedade/propriedade.model';

export type StatusContrato = 'RASCUNHO' | 'ATIVO' | 'ENCERRADO' | 'CANCELADO' | 'EXPIRADO';

export interface BoundingBox {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

export interface MapaPropriedade {
  id: string;
  proprietarioId: string;
  situacao: SituacaoPropriedade;
  valorReferencia: string;
  logradouro: string;
  localidade: string;
  uf: string;
  latitude: number;
  longitude: number;
  statusContrato: StatusContrato | null;
}

export interface MapaResposta {
  propriedades: MapaPropriedade[];
  limitado: boolean;
}

export interface MapaFiltro {
  situacao?: SituacaoPropriedade[];
  statusContrato?: StatusContrato;
  valorMin?: number;
  valorMax?: number;
  localidade?: string;
  uf?: string;
  proprietarioId?: string;
}
