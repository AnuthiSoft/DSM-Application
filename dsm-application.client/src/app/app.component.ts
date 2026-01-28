import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ThemeService } from './shared/theme.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(private themeService: ThemeService, private router: Router) { }
  activeTab = '';
  toggleTheme() {
    this.themeService.toggleTheme();
  }
  title = 'distributormanagementsystem.client';

  setActiveTab(tab: string) {
    this.activeTab = tab;

    if (tab === 'tasks') {
      this.router.navigate(['/tasks/my']);
    }
  }

  isActive(tab: string) {
    return this.activeTab === tab;
  }
}
