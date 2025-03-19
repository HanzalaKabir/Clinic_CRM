import mongoose, { Schema, Types } from "mongoose";
import { IPatient } from "../types/patientInterface.js";

const patientModel = new Schema<IPatient>(
  {
    PatientName: { type: String, required: true },
    PatientAge: { type: Number, required: true },
    mobileNumber: { type: Number, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    patientId: { type: Number, required: true, unique: true },
    clinic_id: { type: String, required: true },
    prescription: [{ type: String }],
    diagnoses: [{ type: Schema.Types.ObjectId, ref: "Diagnosis" }],
    invoices: [{ type: Schema.Types.ObjectId, ref: "Invoices" }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPatient>("Patient", patientModel);
