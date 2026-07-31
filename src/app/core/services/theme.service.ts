import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private dark: boolean;

  constructor() {
    this.dark = localStorage.getItem('theme') === 'dark';
    this.apply();
  }

  get isDark(): boolean {
    return this.dark;
  }

  toggle(): void {
    this.dark = !this.dark;
    localStorage.setItem('theme', this.dark ? 'dark' : 'light');
    this.apply();
  }

  private apply(): void {
    document.documentElement.setAttribute('data-bs-theme', this.dark ? 'dark' : 'light');
  }
}
