import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly darkClass = 'dark-theme';
  private readonly storageKey = 'app-theme';

  constructor() {
    this.loadTheme();
  }

  toggleTheme(): boolean {
    const html = document.documentElement;
    const isDark = html.classList.toggle(this.darkClass);

    localStorage.setItem(this.storageKey, isDark ? 'dark' : 'light');
    return isDark;
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem(this.storageKey);

    if (savedTheme === 'dark') {
      document.documentElement.classList.add(this.darkClass);
    }
  }

  isDarkMode(): boolean {
    return document.documentElement.classList.contains(this.darkClass);
  }
}
