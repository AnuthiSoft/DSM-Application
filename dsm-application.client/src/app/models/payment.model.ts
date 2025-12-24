export interface Payment {
  paymentId: string;
  customerName: string;
  amountPaidToday: number;
  paymentMode: 'cash' | 'upi' | 'online' | 'scanner';
  paymentDate: string;

  isHandedOver: boolean;
  isSubmittedForHandover: boolean;

  handoverStatus?: 'Pending' | 'Accepted' | 'Rejected';
  rejectReason?: string;
}
export 


interface CustomerLedgerDay {
  date: string;
  totalPaid: number;
  payments: {
    orderId: string;
    amountPaidToday: number;
    paymentMode: string;
    paymentDate: string;
  }[];
}