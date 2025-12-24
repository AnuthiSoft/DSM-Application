import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { Invoice } from '../../models/invoice.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';


@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.css']
})
export class InvoiceDetailComponent implements OnInit {

  invoiceId!: string;
  invoice: Invoice | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit(): void {
    this.invoiceId = this.route.snapshot.paramMap.get('id')!;

    this.loadInvoice();
  }

  loadInvoice(): void {
    this.invoiceService.getById(this.invoiceId).subscribe({
      next: (res: Invoice) => {
        this.invoice = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  downloadSimplePdf() {
  window.print();
}

downloadA4Pdf() {
  const DATA: any = document.body;

  html2canvas(DATA).then(canvas => {
    const fileWidth = 208;
    const fileHeight = (canvas.height * fileWidth) / canvas.width;
    const FILEURI = canvas.toDataURL('image/png');

    let pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(FILEURI, 'PNG', 0, 0, fileWidth, fileHeight);
    pdf.save(`Invoice_${this.invoice?.invoiceNo}.pdf`);
  });
}

shareWhatsApp() {
  const msg = `Invoice ${this.invoice?.invoiceNo} 
E-Way Bill: ${this.invoice?.ewayBillNo}`;

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

sendEmailToDriver() {
  const driverEmail = prompt("Enter Driver Email Address:");

  if (!driverEmail) return;

  this.invoiceService.sendEmailCopy({
    email: driverEmail,
    invoice: this.invoice
  }).subscribe({
    next: () => alert("Invoice sent to driver successfully!"),
    error: () => alert("Failed to send email")
  });
}

generateProfessionalPdf() {
  if (!this.invoice) return;

  const pdf = new jsPDF('p', 'mm', 'a4');

  // ---------- HEADER ----------
  pdf.setFontSize(18);
  pdf.text("TAX INVOICE", 105, 15, { align: "center" });

  pdf.setFontSize(12);
  pdf.text(`Invoice No: ${this.invoice.invoiceNo}`, 14, 30);
  pdf.text(`Invoice Date: ${this.invoice.invoiceDate}`, 14, 37);
  pdf.text(`Customer: ${this.invoice.customerId}`, 14, 44);
  pdf.text(`E-Way Bill No: ${this.invoice.ewayBillNo || 'Not Provided'}`, 14, 51);

  // ---------- ITEM TABLE ----------
  const itemRows = this.invoice.items.map((item, index) => [
    index + 1,
    item.productName,
    item.hsnCode || '',
    item.quantity,
    item.price,
    item.taxableValue,
    item.gstRate + "%",
    item.gstAmount
  ]);

  autoTable(pdf, {
    startY: 60,
    head: [
      ["#", "Product", "HSN", "Qty", "Price", "Taxable", "GST %", "GST Amt"]
    ],
    body: itemRows,
    theme: 'grid',
    styles: { fontSize: 11 },
    headStyles: { fillColor: [41, 128, 185] }, // Blue header
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 40 },
      2: { cellWidth: 20 },
      3: { cellWidth: 15 },
      4: { cellWidth: 20 },
      5: { cellWidth: 25 },
      6: { cellWidth: 15 },
      7: { cellWidth: 20 },
    }
  });

  // ---------- TOTAL SECTION ----------
  const finalY = (pdf as any).lastAutoTable.finalY + 10;

  pdf.setFontSize(13);
  pdf.text(`Total Invoice Amount: ₹ ${this.invoice.totalAmount}`, 14, finalY);

  // ---------- FOOTER ----------
  pdf.setFontSize(10);
  pdf.text("This is a system generated invoice.", 105, 290, { align: "center" });

  // ---------- SAVE ----------
  pdf.save(`Invoice_${this.invoice.invoiceNo}.pdf`);
}

}
