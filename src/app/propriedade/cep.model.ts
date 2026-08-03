export interface Cep {
  cep: string;
  encontrado: boolean;
  logradouro: string | null;
  bairro: string | null;
  localidade: string | null;
  uf: string | null;
  latitude: number | null;
  longitude: number | null;
}
