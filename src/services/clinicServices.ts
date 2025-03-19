import { Request, Response } from "express";
import User from "../models/User.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import Clinic from "../models/clinicModel.js";
import { IClinic } from "../types/clinicInterface.js";
import Diagnosis from "../models/diagnosisModel.js";
import Appointment from "../models/appointmentModel.js";
import Patient from "../models/patientModel.js";
import { getStorageBucket } from "../config/firebase.config.js";
import { generateToken } from "./authService.js";
import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

export const getAllUsersByClinic = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"] as string;
    const jwtToken = authHeader.split("Bearer ")[1];
    const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
    const clinic_id = decodedHeader.clinic_id;

    if (!clinic_id) {
      res.status(400).json({
        message: "Invalid request",
        error: "No clinic_id found in token",
      });
      return;
    }

    const users = await User.find({ clinic_id })
      .select("-password")
      .sort({ createdAt: -1 });

    if (!users || users.length === 0) {
      res.status(404).json({
        message: "No users found",
        error: "No users found for this clinic",
      });
      return;
    }

    res.status(200).json({
      message: "Users retrieved successfully",
      count: users.length,
      users: users,
    });
    return;
  } catch (error) {
    console.error("Error fetching clinic users:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    res.status(500).json({
      message: "Failed to fetch clinic users",
      error: errorMessage,
    });
    return;
  }
};

export const deleteClinicByClinicId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"] as string;
    const jwtToken = authHeader.split("Bearer ")[1];
    const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
    let checkState = false;
    const clinic_id = decodedHeader.clinic_id;

    const clinic = await Clinic.findById(clinic_id);
    if (clinic) {
      try {
        let firebaseLogoDownloadUrl = clinic.LogoUrl;
        const filePath = firebaseLogoDownloadUrl.split("?")[0];

        const bucketName =
          "https://storage.googleapis.com/clinic-backend-522ca.firebasestorage.app/";
        const relativeFilePath = filePath.replace(bucketName, "");

        const bucket = getStorageBucket();
        await bucket
          .file(relativeFilePath)
          .delete()
          .then(() => {
            console.log(
              `Logo deleted successfully from firebase for clinic id: ${clinic_id}`
            );
          });

        await Appointment.deleteMany({ clinic_id }).then(() => {
          console.log(`All appointments for ${clinic_id} deleted successfully`);
        });
        await Patient.deleteMany({ clinic_id }).then(() => {
          console.log(`All patients for ${clinic_id} deleted successfully`);
        });
        await Diagnosis.deleteMany({ clinic_id }).then(() => {
          console.log(`All diagnosis for ${clinic_id} deleted successfully`);
        });
        await User.deleteOne({ clinic_id }).then(() => {
          console.log(`All users for ${clinic_id} deleted successfully`);
        });
        checkState = true;
      } catch (error) {
        console.error(error);
        res.status(401).json({ message: "Could not delete clinic", error });
        return;
      }
    } else {
      res.status(404).json({ message: "Could not find clinic" });
      return;
    }
    let deletedClinic;
    if (checkState) {
      deletedClinic = await Clinic.findByIdAndDelete(clinic_id);
      res.status(200).json({
        message: "Clinic deleted successfully",
        deletedClinic,
      });
      console.log(`Clinic with id ${clinic_id} has been deleted successfully`);
      return;
    }

    res.status(401).json({ message: "Could not delete clinic" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateClinic = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"] as string;
    const jwtToken = authHeader.split("Bearer ")[1];
    const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
    const clinic_id = decodedHeader.clinic_id;

    const clinic = await Clinic.findById(clinic_id);
    if (!clinic) {
      res.status(404).json({ message: "Clinic not found" });
      return;
    }

    // Dynamically build the updateData object with only provided fields
    const updateData: Partial<IClinic> = {};
    if ("ClinicName" in req.body) updateData.ClinicName = req.body.ClinicName;
    if ("address" in req.body) updateData.address = req.body.address;
    if ("website" in req.body) updateData.website = req.body.website;
    if ("Availibility" in req.body)
      updateData.Availibility = req.body.Availibility;
    if ("subscriptionPlan" in req.body)
      updateData.subscriptionPlan = req.body.subscriptionPlan;
    if ("Licenses" in req.body) updateData.Licenses = req.body.Licenses;
    if ("LogoUrl" in req.body) updateData.LogoUrl = req.body.LogoUrl;
    if ("Patients" in req.body) updateData.Patients = req.body.Patients;

    //console.log(updateData);

    const updatedClinic = await Clinic.findByIdAndUpdate(
      clinic_id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedClinic) {
      res.status(500).json({ message: "Failed to update clinic details" });
      return;
    }
    const newAcessToken = await generateToken(jwtToken);

    res.status(200).json({
      message: "Clinic details updated successfully",
      clinic: updatedClinic,
      accessToken: newAcessToken,
    });
  } catch (error) {
    console.error("Update clinic error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const getClinicAvailibility = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"] as string;
    const jwtToken = authHeader.split("Bearer ")[1];
    const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
    const clinic_id = decodedHeader.clinic_id;

    const clinic = await Clinic.findById(clinic_id);
    if (!clinic) {
      res.status(404).json({ message: "Clinic not found" });
      return;
    }
    const operatingDays = clinic.Availibility.days || [];
    const { openingTime, closingTime } = clinic.Availibility.timing || {};
    const slotBreak = clinic.Availibility.slotBreak || undefined;
    if (!openingTime || !closingTime || !slotBreak) {
      res.status(400).json({
        message:
          "Invalid clinic configuration - missing timing or slot break information",
      });
      return;
    }

    const availableSlots = getSlots(openingTime, closingTime, slotBreak);

    res.status(200).json({ availableSlots, operatingDays });
    return;

    // const clinicOperatingDetails = await Clinic.aggregate([
    //   {
    //     $match: { _id: new ObjectId(clinic._id) },
    //   },
    //   {
    //     $project: {
    //       operatingDays: "$Availibility.days",
    //       openingTime: "$Availibility.timing.openingTime",
    //       closingTime: "$Availibility.timing.closingTime",
    //       _id: 0,
    //     },
    //   },
    // ]);

    //console.log(clinicOperatingDetails);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getSlots = (
  openingTime: string,
  closingTime: string,
  slotBreak: number
): string[] => {
  const slots: string[] = [];
  let [currentHour, currentMinute] = openingTime.split(":").map(Number);
  const [closingHour, closingMinute] = closingTime.split(":").map(Number);

  while (
    currentHour < closingHour ||
    (currentHour === closingHour && currentMinute < closingMinute)
  ) {
    slots.push(`${padTime(currentHour)}:${padTime(currentMinute)}`);
    currentMinute += slotBreak;

    if (currentMinute >= 60) {
      currentMinute -= 60;
      currentHour += 1;
    }
  }

  return slots;
};

const padTime = (value: number): string =>
  value < 10 ? `0${value}` : `${value}`;
