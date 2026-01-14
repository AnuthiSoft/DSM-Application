import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-employee-invoices',
  templateUrl: './employee-invoices.component.html',
  styleUrl: './employee-invoices.component.css'
})
export class EmployeeInvoicesComponent implements OnInit {

  invoices: any[] = [];
  employeeId = "";
apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.employeeId = localStorage.getItem("employeeId") || "";
    this.loadInvoices();
  }

  loadInvoices() {
  this.http.get(`${this.apiUrl}/invoice-upload/employee/${this.employeeId}`)
    .subscribe((res: any) => {
      console.log("INVOICES RECEIVED:", res);
      this.invoices = res;
    });
}
  // ✅ ADD THIS
  shareInvoice(inv: any) {
    console.log("Sharing invoice:", inv);

    // Example: open invoice file
    if (inv?.fileUrl) {
      window.open(this.apiUrl + inv.fileUrl, '_blank');
    }
  }

  // ✅ ADD THIS
  exportAll() {
    console.log("Exporting all invoices");

    // Example logic
    alert('Export all invoices feature coming soon');
  }

}
