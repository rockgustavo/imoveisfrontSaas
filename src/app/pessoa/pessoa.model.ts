export type TipoDocumento = 'CPF' | 'CNPJ';
export type Papel = 'PROPRIETARIO' | 'USUARIO' | 'ADMINISTRADOR';
export type ClassificacaoComercial = 'LEAD' | 'PROSPECT' | 'CLIENTE' | 'CLIENTE_INATIVO';

export interface Pessoa {
  id: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  nome: string;
  email: string | null;
  ativo: boolean;
  papeis: Papel[];
  classificacao: ClassificacaoComercial;
  criadoEm: string;
  alteradoEm: string;
}

export interface CriarPessoaComando {
  tipoDocumento: TipoDocumento;
  documento: string;
  nome: string;
  email?: string;
}

export interface AtualizarPessoaComando {
  nome: string;
  email?: string;
}

export interface AtribuirPapelComando {
  papel: Papel;
  email?: string;
}

export interface PessoaFiltro {
  documento?: string;
  papel?: Papel;
  classificacao?: ClassificacaoComercial;
  ativo?: boolean;
}
