import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  clinic_id: mongoose.Types.ObjectId;
  role: string;
  isProfileCompleted: boolean;
  status: "Active" | "Deactivated" | "Paused";
}

const userSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    clinic_id: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
    role: { type: String, enum: ["Admin", "Member"], default: "Admin" },
    isProfileCompleted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Active", "Deactivated", "Paused"],
      default: "Active",
    }, // Default is 'Active'
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
