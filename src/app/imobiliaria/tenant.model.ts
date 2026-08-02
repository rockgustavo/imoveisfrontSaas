export interface Tenant {
  id: string;
  razaoSocial: string;
  slug: string;
  status: 'ATIVA' | 'SUSPENSA';
}
