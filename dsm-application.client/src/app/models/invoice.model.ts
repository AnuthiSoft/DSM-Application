export interface InvoiceItem {
  productId?: string;
  productName: string;
  hsnCode?: string;
  quantity: number;
  price: number;
  taxableValue: number;
  gstRate: number;
  gstAmount: number;
}

export interface Invoice {
  id?: string;
  distributorId?: string;
  invoiceNo: string;
  invoiceDate: string; // ISO string
  customerId: string;
  items: InvoiceItem[];
  totalAmount: number;
  ewayBillNo?: string | null;
}
