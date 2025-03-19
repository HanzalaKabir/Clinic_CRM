export interface IInvoice {
  invoiceId: number;
  patientId: number;
  clinic_id: string;
  totalAmount: string;
  amountPaid: string;
  paymentStatus: "paid" | "pending" | "partial";
  dateOfPayment: Date;
  filePath?: string | null;
  invoiceUrl?: string | null;
}
