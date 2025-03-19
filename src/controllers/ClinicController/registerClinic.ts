import { Request, Response } from "express";
import Clinic from "../../models/clinicModel.js";
import { IClinic } from "../../types/clinicInterface.js";
import User from "../../models/User.js";
import { getStorageBucket } from "../../config/firebase.config.js";
import jwt, { JwtPayload } from "jsonwebtoken";

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export const registerClinic = async (
  req: Request,
  res: Response
): Promise<void> => {
  let fileUpload: any = null;
  let createdClinic: any = null;

  try {
    const {
      ClinicName,
      address,
      city,
      state,
      postalCode,
      website,
      Availibility,
    } = req.body;

    const authHeader = req.headers["authorization"] as string;
    const jwtToken = authHeader.split("Bearer ")[1];
    const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
    const clinic_id = decodedHeader.clinic_id;
    const user_id = decodedHeader.userId;

    // console.log(clinic_id, user_id);

    const requiredFields = [
      { field: "ClinicName", value: ClinicName },
      { field: "address", value: address },
      { field: "city", value: city },
      { field: "state", value: state },
      { field: "postalCode", value: postalCode },
      { field: "Availibility", value: Availibility },
      { field: "clinic_id", value: clinic_id },
    ];

    const missingField = requiredFields.find(
      (field) =>
        field.value === null || field.value === undefined || field.value === ""
    );

    if (missingField) {
      res.status(400).json({
        message: `Missing or invalid data: ${missingField.field} is required`,
        error: `Missing ${missingField.field}`,
      });
      return;
    }

    const Logo = req.file as MulterFile | undefined;
    if (!Logo) {
      res.status(400).json({
        message: "Missing Logo file",
        error: "Logo file is required",
      });
      return;
    }

    const existingUser = await User.findById(user_id);
    if (!existingUser) {
      res.status(404).json({
        message: "Registration failed",
        error: "User not found",
      });
      return;
    }

    // Start the upload process
    const bucket = getStorageBucket();
    const fileName = `clinic-logos/${clinic_id}_${Date.now()}_${
      Logo.originalname
    }`;
    fileUpload = bucket.file(fileName);

    try {
      // Upload to Firebase
      const uploadStream = fileUpload.createWriteStream({
        metadata: {
          contentType: Logo.mimetype,
          metadata: {
            clinic_id,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      await new Promise<void>((resolve, reject) => {
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
        uploadStream.end(Logo.buffer);
      });

      const [downloadUrl] = await fileUpload.getSignedUrl({
        action: "read",
        expires: Date.now() + 315569520000,
      });

      const availibilityData = JSON.parse(Availibility);
      const ClinicObject: IClinic = {
        _id: clinic_id,
        ClinicName,
        address: {
          address,
          city,
          state,
          postalCode,
        },
        website,
        Patients: [],
        subscriptionPlan: "free",
        Licenses: 0,
        LogoUrl: downloadUrl,
        Availibility: availibilityData,
      };

      // console.log(ClinicObject);

      const newClinic = new Clinic(ClinicObject);

      // console.log(newClinic);
      createdClinic = await newClinic.save();

      // console.log(createdClinic);

      const updatedUser = await User.findByIdAndUpdate(
        user_id,
        { $set: { isProfileCompleted: true } },
        { new: true }
      );

      if (!updatedUser) {
        if (createdClinic) {
          await Clinic.findByIdAndDelete(createdClinic._id);
          console.log("Clinic deleted");
        }
        if (fileUpload) {
          await fileUpload.delete();
        }

        throw new Error("Failed to update user profile status");
      }

      res.status(200).json({
        message: "Clinic registered successfully",
        clinic_id: createdClinic._id,
        clinic: createdClinic,
        user: updatedUser,
      });
    } catch (error) {
      if (createdClinic) {
        await Clinic.findByIdAndDelete(createdClinic._id);
      }
      if (fileUpload) {
        await fileUpload.delete();
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.log("169", error);
      res.status(500).json({
        message: "Failed to complete registration process",
        error: errorMessage,
      });
    }
  } catch (error) {
    if (createdClinic) {
      await Clinic.findByIdAndDelete(createdClinic._id);
    }
    if (fileUpload) {
      await fileUpload.delete();
    }

    console.error("183Clinic registration error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    res.status(500).json({
      message: "189Failed to register clinic",
      error: errorMessage,
    });
  }
};
