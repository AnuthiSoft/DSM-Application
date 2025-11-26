import { Component, OnInit } from '@angular/core';
import { FraudReport } from '../../models/fraud.model';
import { FraudService } from '../../services/fraud.service';

@Component({
  selector: 'app-fraud-history',
  templateUrl: './fraud-history.component.html',
  styleUrl: './fraud-history.component.css'
})
export class FraudHistoryComponent implements OnInit {

  historyFrauds: FraudReport[] = [];
  loading = true;

  constructor(private fraudService: FraudService) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.fraudService.getAll().subscribe({
      next: res => {
        this.historyFrauds = res;
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'pending': return 'status-pending';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return 'fa-check-circle text-success';
      case 'rejected': return 'fa-times-circle text-danger';
      case 'pending': return 'fa-clock text-warning';
      default: return 'fa-question-circle';
    }
  }
}