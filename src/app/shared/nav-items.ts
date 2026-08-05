export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Propriedades', icon: 'bi-house-door', route: '/propriedades' },
  { label: 'Mapa', icon: 'bi-map', route: '/mapa' },
  { label: 'Orçamentos', icon: 'bi-file-earmark-text', route: '/orcamentos' },
  { label: 'Contratos', icon: 'bi-file-earmark-check', route: '/contratos' },
  { label: 'Pessoas', icon: 'bi-people', route: '/pessoas' },
  { label: 'Parâmetros', icon: 'bi-sliders', route: '/parametros' }
];
