import { Component } from '@angular/core';
import { AddFraudReportDto } from '../../models/fraud.model';
import { ActivatedRoute } from '@angular/router';
import { FraudService } from '../../services/fraud.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-fraud-report',
  templateUrl: './fraud-report.component.html',
  styleUrls: ['./fraud-report.component.css']
})
export class FraudReportComponent {

  model: AddFraudReportDto = {
    reportedById: '',
    targetId: '',
    targetType: '',
    reason: '',
    evidenceUrl: ''
  };

  submitted = false;   // ✔ Required by HTML
  loading = false;     // ✔ Required by HTML
  success = '';
  error = '';

  constructor(
    private route: ActivatedRoute,
    private fraudService: FraudService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    // Auto-fill reporter ID
    this.model.reportedById =
      this.auth.getDistributorId() ||
      this.auth.getEmployeeId() ||
      this.auth.getCurrentCustomer()?.customerId ||
      '';

    // Auto-fill target data from route
    this.model.targetId = this.route.snapshot.paramMap.get('targetId') || '';
    this.model.targetType = this.route.snapshot.paramMap.get('targetType') || '';
    
  }

  // ⭐ Needed by HTML to color badges
  getTargetTypeClass(type: string) {
    switch (type) {
      case 'Distributor': return 'type-distributor';
      case 'Customer': return 'type-customer';
      case 'Employee': return 'type-employee';
      default: return 'type-other';
    }
  }

  // ⭐ Needed by HTML to validate Evidence URL
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // ⭐ Submit Form
  submit() {
    this.submitted = true;
    this.success = '';
    this.error = '';

    // Required validation
    if (!this.model.reason) return;

    // URL validation
    if (this.model.evidenceUrl && !this.isValidUrl(this.model.evidenceUrl)) {
      return;
    }

    this.loading = true;

    this.fraudService.reportFraud(this.model).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.message;
        this.resetForm();
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to submit report.';
      }
    });
  }

  resetForm() {
    this.model.reason = '';
    this.model.evidenceUrl = '';
    this.submitted = false;
  }
}
