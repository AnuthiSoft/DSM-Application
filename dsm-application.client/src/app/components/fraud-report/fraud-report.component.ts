import { Component } from '@angular/core';
import { AddFraudReportDto } from '../../models/fraud.model';
import { ActivatedRoute } from '@angular/router';
import { FraudService } from '../../services/fraud.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';


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
    private auth: AuthService,
    private router: Router   // 👈 ADD THIS
  ) {}

//   ngOnInit() {

//   // 1️⃣ Who is reporting (logged-in user)
//   const distributorId = this.auth.getDistributorId();
//   const customer = this.auth.getCurrentCustomer();

//   if (distributorId) {
//     this.model.reportedById = distributorId;
//   } else if (customer) {
//     this.model.reportedById = customer.customerId;
//   } else {
//     this.error = 'Unable to identify reporter';
//     return;
//   }

//   // 2️⃣ Who is being reported (from route)
//   const routeTargetId = this.route.snapshot.paramMap.get('targetId');
//   const routeTargetType = this.route.snapshot.paramMap.get('targetType');

//   if (!routeTargetId || !routeTargetType) {
//     this.error = 'Invalid fraud target';
//     return;
//   }

//   // 3️⃣ APPLY CORRECT LOGIC (THIS IS WHAT YOU ASKED FOR)

//   // 🔵 Distributor reports Customer
//   if (distributorId && routeTargetType.toUpperCase() === 'CUSTOMER') {
//     this.model.targetType = 'CUSTOMER';
//     this.model.targetId = routeTargetId;
//   }

//   // 🔴 Customer reports Distributor
//   else if (customer && routeTargetType.toUpperCase() === 'DISTRIBUTOR') {
//     this.model.targetType = 'DISTRIBUTOR';
//     this.model.targetId = routeTargetId;
//   }

//   else {
//     this.error = 'Invalid fraud reporting scenario';
//     return;
//   }

//   // 4️⃣ SAFETY CHECK (IMPORTANT)
//   if (this.model.reportedById === this.model.targetId) {
//     this.error = 'You cannot report yourself';
//   }
// }


  // ⭐ Needed by HTML to color badges
 
// ngOnInit() {

//   const distributorId = this.auth.getDistributorId(); // logged-in distributor
//   const customer = this.auth.getCurrentCustomer();    // logged-in customer

//   // 1️⃣ Who is reporting
//   if (distributorId) {
//     this.model.reportedById = distributorId;
//   } else if (customer) {
//     this.model.reportedById = customer.customerId!;
//   }

//   // 2️⃣ Read route params
//   const routeTargetType = this.route.snapshot.paramMap.get('targetType');
//   const routeTargetId = this.route.snapshot.paramMap.get('targetId');

//   // 3️⃣ NORMALIZE
//   const targetType = routeTargetType?.toUpperCase();

//   // 🔵 Distributor → Customer
//   if (distributorId && targetType === 'CUSTOMER') {
//     this.model.targetType = 'CUSTOMER';
//     this.model.targetId = routeTargetId!;
//   }

//   // 🔴 Customer → Distributor (🔥 THIS WAS MISSING / WRONG)
//   else if (customer && targetType === 'DISTRIBUTOR') {
//     this.model.targetType = 'DISTRIBUTOR';
//     this.model.targetId = routeTargetId!;
//   }

//   // ❌ DO NOT BLOCK SUBMISSION
// }

// ngOnInit() {
//   const distributorId = this.auth.getDistributorId();
//   const customer = this.auth.getCurrentCustomer();

//   // Reporter
//   if (distributorId) {
//     this.model.reportedById = distributorId;
//   } else if (customer) {
//     this.model.reportedById = customer.customerId!;
//   }

//   // Route params
//   const rawType = this.route.snapshot.paramMap.get('targetType');
//   const rawId = this.route.snapshot.paramMap.get('targetId');

//   if (!rawType || !rawId) {
//     return; // allow submit (old behavior)
//   }

//   const targetType = rawType.toUpperCase();

//   // Distributor → Customer
//   if (distributorId && targetType === 'CUSTOMER') {
//     this.model.targetType = 'CUSTOMER';
//     this.model.targetId = rawId;
//   }

//   // Customer → Distributor ✅
//   if (customer && targetType === 'DISTRIBUTOR') {
//     this.model.targetType = 'DISTRIBUTOR';
//     this.model.targetId = rawId;
//   }
// }

ngOnInit() {

  // 1️⃣ reporter (who is logged in)
  this.model.reportedById =
    this.auth.getDistributorId() ||
    this.auth.getCurrentCustomer()?.customerId ||
    '';

  if (!this.model.reportedById) {
    this.error = 'Unable to identify reporter';
    return;
  }

  // 2️⃣ target (STRICTLY from route)
  const targetId = this.route.snapshot.paramMap.get('targetId');
  const targetType = this.route.snapshot.paramMap.get('targetType');

  if (!targetId || !targetType) {
    this.error = 'Invalid fraud target';
    return;
  }

  // ✅ TRUST ROUTE — DO NOT MODIFY
  this.model.targetId = targetId;
  this.model.targetType = targetType.toUpperCase();
}



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

// submit() {
//   console.log('FINAL FRAUD PAYLOAD =>', this.model);

//   this.submitted = true;
//   this.success = '';
//   this.error = '';

//   // Required validation
//   if (!this.model.reason) {
//     return;
//   }

//   // URL validation
//   if (this.model.evidenceUrl && !this.isValidUrl(this.model.evidenceUrl)) {
//     return;
//   }

//   this.loading = true;

//   this.fraudService.reportFraud(this.model).subscribe({
//     next: (res) => {
//       this.loading = false;
//       this.success = res.message;   // ✅ SUCCESS BANNER BACK
//       this.resetForm();
//     },
//     error: () => {
//       this.loading = false;
//       this.error = 'Failed to submit report.';
//     }
//   });
// }

submit() {
  console.log('FINAL FRAUD PAYLOAD =>', this.model);

  this.submitted = true;
  this.success = '';
  this.error = '';

  // 🚨 HARD VALIDATION (FIX)
  if (!this.model.targetId || !this.model.targetType) {
    this.error = 'Invalid fraud target. Cannot submit report.';
    return;
  }

  if (!this.model.reason) {
    return;
  }

  this.loading = true;

  this.fraudService.reportFraud(this.model).subscribe({
    next: (res) => {
      this.loading = false;
      this.success = res.message;
      this.resetForm();
    },
    error: (err) => {
      this.loading = false;
      console.error('Fraud submit error:', err);
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
