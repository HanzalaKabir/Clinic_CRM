import mongoose, { Schema } from "mongoose";
import { IAppointment } from "../types/appointmentInterface.js";

const appointmentModel = new Schema<IAppointment>(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    email: { type: String },
    mobileNumber: { type: Number, required: true },
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true },
    clinic_id: { type: String, required: true },
    appointmentNumber: { type: Number, required: true, unique: true },

    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

appointmentModel.index(
  { mobileNumber: 1, appointmentDate: 1 },
  { unique: true }
);

export default mongoose.model<IAppointment>("Appointment", appointmentModel);
