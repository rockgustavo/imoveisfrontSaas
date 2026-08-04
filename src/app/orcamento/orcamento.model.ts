export type StatusOrcamento = 'RASCUNHO' | 'ENVIADO' | 'ACEITO' | 'RECUSADO' | 'EXPIRADO';

export interface OrcamentoItem {
  propriedadeId: string;
  comissaoPercentual: string;
  valorPedido: string;
}

export interface Orcamento {
  id: string;
  pessoaId: string;
  status: StatusOrcamento;
  validade: string;
  origemId: string | null;
  versao: number;
  itens: OrcamentoItem[];
  criadoEm: string;
  alteradoEm: string;
}

export interface OrcamentoResumo {
  id: string;
  pessoaId: string;
  status: StatusOrcamento;
  validade: string;
  versao: number;
  quantidadeItens: number;
  valorTotal: string;
  criadoEm: string;
}

export interface ItemOrcamentoComando {
  propriedadeId: string;
  comissaoPercentual: number;
  valorPedido: number;
}

export interface CriarOrcamentoComando {
  pessoaId: string;
  itens: ItemOrcamentoComando[];
}

export interface AtualizarOrcamentoComando {
  itens: ItemOrcamentoComando[];
}

export interface OrcamentoFiltro {
  pessoaId?: string;
  status?: StatusOrcamento;
}
