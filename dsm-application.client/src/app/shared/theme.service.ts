import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {

  private themes = [
    'theme-lavender',
    'theme-ocean',
    'theme-emerald',
    'theme-dark-purple'
  ];

  private storageKey = 'selected-theme';

  constructor() {
    this.loadSavedTheme();
  }

  setTheme(themeName: string) {
    const html = document.documentElement;

    this.themes.forEach(theme => html.classList.remove(theme));
    html.classList.add(themeName);

    localStorage.setItem(this.storageKey, themeName);
  }

  private loadSavedTheme() {
    const savedTheme = localStorage.getItem(this.storageKey);

    if (savedTheme && this.themes.includes(savedTheme)) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('theme-lavender'); // default
    }
  }
}
