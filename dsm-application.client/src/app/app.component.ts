import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ThemeService } from './shared/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent  {
   title = 'distributormanagementsystem.client';
  constructor(private themeService: ThemeService) {}

  toggleTheme() {
    this.themeService.toggleTheme();
  } 
}
