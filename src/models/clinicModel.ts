import mongoose, { Schema } from "mongoose";
import { IClinic } from "../types/clinicInterface.js";

const clinicModel = new Schema<IClinic>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },
    ClinicName: { type: String, required: true },
    address: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: Number, required: true },
    },
    website: { type: String },
    subscriptionPlan: { type: String, required: true },
    Licenses: { type: Number, required: true },
    LogoUrl: { type: String },
    Availibility: {
      days: [{ type: String, required: true }],
      timing: {
        openingTime: { type: String, required: true },
        closingTime: { type: String, required: true },
      },
      slotBreak: { type: Number, required: true },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IClinic>("Clinic", clinicModel);
