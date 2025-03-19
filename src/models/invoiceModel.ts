import mongoose, { Schema } from "mongoose";
import { IInvoice } from "../types/invoiceInterface.js";

const invoiceModel = new Schema<IInvoice>(
  {
    invoiceId: { type: Number, required: true },
    patientId: { type: Number, required: true },
    clinic_id: { type: String, required: true },
    totalAmount: { type: String, required: true },
    amountPaid: { type: String, required: true },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["paid", "pending", "partial"],
    },
    dateOfPayment: { type: Date, required: true },
    filePath: { type: String, default: null },
    invoiceUrl: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IInvoice>("Invoice", invoiceModel);
