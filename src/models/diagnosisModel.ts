import mongoose, { Schema } from "mongoose";
import { IDiagnosis } from "../types/diagnosisInterface.js";

const diagnosisModel = new Schema<IDiagnosis>(
  {
    symptoms: { type: String, required: true },
    observations: { type: String, required: true },
    treatmentPlan: { type: String, required: true },
    followUpDate: { type: String, required: true },
    diagnosis: { type: String, required: true },
    clinic_id: { type: String, required: true },
    patientId: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDiagnosis>("Diagnosis", diagnosisModel);
