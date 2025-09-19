import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private darkClass = 'dark-theme';
  private storageKey = 'app-theme';

  constructor() {
    this.loadTheme(); // apply saved theme at startup
  }

  toggleTheme(): void {
    const isDark = document.documentElement.classList.toggle(this.darkClass);
    localStorage.setItem(this.storageKey, isDark ? 'dark' : 'light');
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem(this.storageKey);

    if (savedTheme === 'dark') {
      document.documentElement.classList.add(this.darkClass);
    } else if (!savedTheme) {
      // no preference saved → follow system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add(this.darkClass);
      }
    }
  }
}
