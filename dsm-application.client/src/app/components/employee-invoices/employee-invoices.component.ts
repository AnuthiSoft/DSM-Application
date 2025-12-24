import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-employee-invoices',
  templateUrl: './employee-invoices.component.html'
})
export class EmployeeInvoicesComponent implements OnInit {

  invoices: any[] = [];
  employeeId = "";

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.employeeId = localStorage.getItem("employeeId") || "";
    this.loadInvoices();
  }

  loadInvoices() {
  this.http.get(`http://localhost:5164/api/invoice-upload/employee/${this.employeeId}`)
    .subscribe((res: any) => {
      console.log("INVOICES RECEIVED:", res);   // 👈 ADD THIS
      this.invoices = res;
    });
}

}
