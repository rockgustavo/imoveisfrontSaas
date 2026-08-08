export type StatusContrato = 'RASCUNHO' | 'ATIVO' | 'ENCERRADO' | 'CANCELADO' | 'EXPIRADO';
export type TipoAditivo = 'INCLUSAO' | 'EXCLUSAO';

export interface Agenciamento {
  id: string;
  propriedadeId: string;
  comissaoPercentual: string;
  valorPedido: string;
  contratoAtivo: boolean;
}

export interface Aditivo {
  propriedadeId: string;
  tipo: TipoAditivo;
  justificativa: string;
  data: string;
}

export interface Contrato {
  id: string;
  pessoaId: string;
  orcamentoOrigemId: string;
  status: StatusContrato;
  vigenciaInicio: string;
  vigenciaFim: string;
  regrasContratuais: string;
  justificativaEncerramento: string | null;
  agenciamentos: Agenciamento[];
  aditivos: Aditivo[];
  criadoEm: string;
  alteradoEm: string;
}

export interface ContratoResumo {
  id: string;
  pessoaId: string;
  status: StatusContrato;
  vigenciaInicio: string;
  vigenciaFim: string;
  quantidadeAgenciamentos: number;
  valorTotal: string;
  criadoEm: string;
}

export interface CriarContratoComando {
  orcamentoId: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  regrasContratuais: string;
}

export interface EncerrarContratoComando {
  justificativa: string;
}

export interface AditivoComando {
  tipo: TipoAditivo;
  propriedadeId: string;
  justificativa: string;
  comissaoPercentual?: number;
  valorPedido?: number;
}

export interface ContratoFiltro {
  pessoaId?: string;
  status?: StatusContrato;
  vencendoEmDias?: number;
}

export interface ContratoHistorico {
  versao: number;
  ocorridoEm: string;
  contrato: Contrato;
}
