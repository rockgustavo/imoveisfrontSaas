export type TipoPropriedade = 'APARTAMENTO' | 'CASA' | 'TERRENO' | 'COMERCIAL';
export type SituacaoPropriedade = 'DISPONIVEL' | 'AGENCIADA' | 'RESERVADA' | 'VENDIDA' | 'RETIRADA';
export type GeoSituacao = 'PENDENTE' | 'CONCLUIDA' | 'MANUAL';

export interface Propriedade {
  id: string;
  proprietarioId: string;
  tipo: TipoPropriedade;
  areaPrivativa: number | null;
  quartos: number | null;
  vagas: number | null;
  valorReferencia: string;
  situacao: SituacaoPropriedade;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  localidade: string;
  uf: string;
  enderecoValidado: boolean;
  latitude: number | null;
  longitude: number | null;
  geoSituacao: GeoSituacao;
  criadoEm: string;
  alteradoEm: string;
}

export interface PropriedadeResumo {
  id: string;
  proprietarioId: string;
  tipo: TipoPropriedade;
  valorReferencia: string;
  situacao: SituacaoPropriedade;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  latitude: number | null;
  longitude: number | null;
  geoSituacao: GeoSituacao;
  criadoEm: string;
}

export interface SalvarPropriedadeComando {
  proprietarioId: string;
  tipo: TipoPropriedade;
  areaPrivativa?: number;
  quartos?: number;
  vagas?: number;
  valorReferencia: number;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  localidade: string;
  uf: string;
  enderecoValidado: boolean;
  latitude?: number;
  longitude?: number;
}

export interface EnderecoParaGeolocalizacao {
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  localidade: string;
  uf: string;
}

export interface ResultadoPesquisaGeolocalizacao {
  encontrada: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface PropriedadeFiltro {
  situacao?: SituacaoPropriedade;
  proprietarioId?: string;
  localidade?: string;
  uf?: string;
  valorMin?: number;
  valorMax?: number;
}
