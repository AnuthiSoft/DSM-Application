import { Component, OnInit } from '@angular/core'; 
import { FraudReport } from '../../models/fraud.model'; 
import { FraudService } from '../../services/fraud.service';
import { DistributorService } from '../../services/distributor.service';
import { CustomerService } from '../../services/customer.service'
import { firstValueFrom } from 'rxjs';

 @Component({ selector: 'app-admin-fraud-list', 
  templateUrl: './admin-fraud-list.component.html', 
  styleUrl: './admin-fraud-list.component.css' }) 

  export class AdminFraudListComponent implements 

  OnInit { 
    pendingFrauds: FraudReport[] = []; 
    loading = true; 
    historyFrauds: FraudReport[] = []; // <-- ADD THI 
    
  
  constructor(
      private fraudService: FraudService,
      private distributorService: DistributorService,
      private customerService: CustomerService
    ) {}


    ngOnInit() { 
     this.loadPendingReports(); 
    } 

    // loadPendingReports() { 
    // this.fraudService.getPending().subscribe({ 
    // next: (res) => { 
    // this.pendingFrauds = res; 
    // this.loading = false; 
    // } 
    // }); 

    // this.fraudService.getAll().subscribe(res => { 
    // this.historyFrauds = res; 
    // this.loading = false; 
    // }); 
    // } 

// loadPendingReports() {
//   this.loading = true;

//   this.fraudService.getAll().subscribe({
//     next: async (res) => {
//       this.pendingFrauds = res.slice(0, 5);

//       // ✅ resolve names
//       await Promise.all(
//         this.pendingFrauds.map(r => this.resolveTargetName(r))
//       );

//       this.loading = false;
//     },
//     error: () => {
//       this.loading = false;
//     }
//   });
// }

loadPendingReports() {
  this.loading = true;

  this.fraudService.getAll().subscribe({
    next: async (res) => {

      // ✅ FILTER ONLY PENDING REPORTS
      this.pendingFrauds = res
        .filter(r => r.status?.toLowerCase() === 'pending')
        .slice(0, 5); // optional limit

      // ✅ Resolve names
      await Promise.all(
        this.pendingFrauds.map(r => this.resolveTargetName(r))
      );

      this.loading = false;
    },
    error: () => {
      this.loading = false;
    }
  });
}



// async resolveTargetName(report: FraudReport) {
//   try {
//     const type = report.targetType?.toLowerCase(); // ✅ IMPORTANT

//     if (type === 'distributor') {

//       // your existing API
//       const distributors: any[] = await firstValueFrom(
//         this.distributorService.getDistributorName(report.targetId)
//       );

//       report.targetName = distributors?.[0]?.name || 'Distributor';

//     } 
//     else if (type === 'customer') {

//       const customer: any = await firstValueFrom(
//         this.customerService.getCustomerById(report.targetId)
//       );

//       report.targetName =
//         customer?.fullName || customer?.name || 'Customer';
//     }

//   } catch {
//     report.targetName = 'Unknown';
//   }
// }

async resolveTargetName(report: FraudReport) {
  try {
    if (!report.targetType || !report.targetId) {
      report.targetName = 'Invalid Target';
      return;
    }

    const type = report.targetType.toLowerCase();

    if (type === 'distributor') {
      const distributors: any[] = await firstValueFrom(
        this.distributorService.getDistributorName(report.targetId)
      );

      report.targetName =
        distributors?.[0]?.companyName ||
        distributors?.[0]?.distributorName ||
        distributors?.[0]?.businessName ||
        'Distributor';

      // 🚨 HARD SAFETY
     if (report.targetName?.toLowerCase().includes('customer')) {
        report.targetName = 'Distributor';
      }


      return;
    }

    if (type === 'customer') {
      const customer: any = await firstValueFrom(
        this.customerService.getCustomerById(report.targetId)
      );

      report.targetName =
        customer?.fullName ||
        customer?.name ||
        'Customer';

      return;
    }

    report.targetName = 'Unknown';

  } catch {
    report.targetName =
      report.targetType === 'DISTRIBUTOR'
        ? 'Distributor'
        : 'Customer';
  }

}

    approve(id: string) {
     this.fraudService.takeAction(id, 'approve').subscribe({ 
    next: () => this.loadPendingReports() 
    }); 
    } 
    
    reject(id: string) { 
    this.fraudService.takeAction(id, 'reject').subscribe({ next: () => 
    this.loadPendingReports() 
    }); 
    }

    getTargetTypeClass(type: string): string { 
    switch (type?.toLowerCase()) { 
    case 'customer': return 'badge-customer'; 
    case 'distributor': return 'badge-distributor'; 
    default: return 'badge-default'; 
    }
    } 

    getStatusClass(status: string): string { 
    switch (status?.toLowerCase()) { 
    case 'approved': return 'status-approved'; 
    case 'rejected': return 'status-rejected'; 
    case 'pending': return 'status-pending'; 
    default: return 'status-default'; 
    } 
    } 

    getStatusIcon(status: string): string { 
    switch (status?.toLowerCase()) { 
    case 'approved': return 'fa-check-circle text-success'; 
    case 'rejected': return 'fa-times-circle text-danger'; 
    case 'pending': return 'fa-clock text-warning'; 
    default: return 'fa-question-circle text-muted'; 
    }
    }
    }