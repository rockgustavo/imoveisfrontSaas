import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BottomNav } from './shared/components/bottom-nav/bottom-nav';
import { Sidebar } from './shared/components/sidebar/sidebar';
import { Topbar } from './shared/components/topbar/topbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, Topbar, BottomNav],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly collapsed = signal(localStorage.getItem('sidebar') === 'collapsed');

  protected toggleSidebar(): void {
    this.collapsed.update((value) => {
      const next = !value;
      localStorage.setItem('sidebar', next ? 'collapsed' : 'expanded');
      return next;
    });
  }
}
