import { ObjectId, Types } from "mongoose";

export interface IPatient {
  PatientName: string;
  PatientAge: number;
  mobileNumber: number;
  email: string;
  address: string;
  patientId: number;
  clinic_id: string;
  prescription: string[];
  diagnoses: Types.ObjectId[];
  invoices: Types.ObjectId[];
}
