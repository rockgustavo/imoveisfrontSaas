export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Propriedades', icon: 'bi-house-door', route: '/propriedades' },
  { label: 'Pessoas', icon: 'bi-people', route: '/pessoas' },
  { label: 'Parâmetros', icon: 'bi-sliders', route: '/parametros' }
];
