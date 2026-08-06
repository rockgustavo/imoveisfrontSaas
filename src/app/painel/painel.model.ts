export interface FunilIndicadores {
  lead: number;
  prospect: number;
  cliente: number;
  clienteInativo: number;
}

export interface PainelIndicadores {
  contratosAtivos: number;
  contratosVencendoEm30Dias: number;
  imoveisPorSituacao: Record<string, number>;
  orcamentosAguardandoResposta: number;
  funil: FunilIndicadores;
  comissaoProjetada: string;
}
