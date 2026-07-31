export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

export const NAV_ITEMS: NavItem[] = [{ label: 'Parâmetros', icon: 'bi-sliders', route: '/parametros' }];
