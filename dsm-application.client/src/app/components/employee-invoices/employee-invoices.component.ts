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
  viewInvoice(inv: any) {
  const url = `${environment.apiUrl}/invoice-upload/download/${inv.pdfUrl}`;
  window.open(url, '_blank');
}

  // ✅ ADD THIS
  exportAll() {
    console.log("Exporting all invoices");

    // Example logic
    alert('Export all invoices feature coming soon');
  }
downloadInvoice(inv: any) {
  const url = `${environment.apiUrl}/invoice-upload/download/${inv.pdfUrl}`;
  window.open(url, '_blank');
}
deleteInvoice(inv: any) {

  if (!confirm('Are you sure you want to delete this invoice?'))
    return;

  this.http.delete(`${this.apiUrl}/invoice-upload/${inv.id}`)
    .subscribe({
      next: () => {
        this.invoices = this.invoices.filter(i => i.id !== inv.id);
      },
      error: err => console.error(err)
    });
}


}
