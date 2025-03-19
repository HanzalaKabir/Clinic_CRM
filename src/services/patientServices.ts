import { Request, Response } from "express";
import { IDiagnosis } from "../types/diagnosisInterface.js";
import Diagnosis from "../models/diagnosisModel.js";
import Patient from "../models/patientModel.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { getStorageBucket } from "../config/firebase.config.js";
import { resolve } from "path";
import { rejects } from "assert";

export const AddDiagnosis = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    symptoms,
    diagnosis,
    observations,
    treatmentPlan,
    followUpDate,
    mobileNumber,
    email,
  } = req.body;
  //const patientId = req.query.patientId as string;

  const authHeader = req.headers["authorization"] as string;

  const jwtToken = authHeader.split("Bearer ")[1];

  const decodedHeader = jwt.decode(jwtToken) as JwtPayload;

  const clinic_id = decodedHeader.clinic_id;

  const requiredFields = [
    symptoms,
    observations,
    diagnosis,
    treatmentPlan,
    followUpDate,
    clinic_id,
  ];

  if (
    requiredFields.includes(null) ||
    requiredFields.includes(undefined) ||
    requiredFields.includes("")
  ) {
    res.status(400).json({ message: "Missing fields" });
    return;
  }

  try {
    const patientResponse = await Patient.findOne({
      mobileNumber,
      email,
      clinic_id,
    });
    if (patientResponse) {
      const DiagnosisObject: IDiagnosis = {
        symptoms,
        observations,
        treatmentPlan,
        followUpDate,
        diagnosis,
        patientId: patientResponse.patientId,
        clinic_id,
      };
      const newDiagnosis = new Diagnosis(DiagnosisObject);
      const diagnosisResponse = await newDiagnosis.save();
      if (diagnosisResponse) {
        patientResponse.diagnoses.push(diagnosisResponse._id as Types.ObjectId);
        await patientResponse.save();
      }
      //console.log(diagnosisResponse);
      if (diagnosisResponse) {
        res.status(200).json(diagnosisResponse);
        return;
      }
    } else {
      res.status(404).json({ message: "Patient not found" });
      return;
    }
  } catch (error) {
    res.status(401).json({ message: "Internal Server Error", error });
  }
};

export const getDiagnosisByPatientId = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { patientId } = req.body;
  const authHeader = req.headers["authorization"] as string;

  const jwtToken = authHeader.split("Bearer ")[1];

  const decodedHeader = jwt.decode(jwtToken) as JwtPayload;

  const clinic_id = decodedHeader.clinic_id;

  const requiredFields = [patientId, clinic_id];

  if (
    requiredFields.includes(null) ||
    requiredFields.includes(undefined) ||
    requiredFields.includes("")
  ) {
    res.status(400).json({ message: "Missing fields" });
    return;
  } else {
    try {
      const patientResponse = await Patient.findOne({ patientId, clinic_id });
      if (patientResponse) {
        const diagnosisResponse = await Diagnosis.find({
          patientId,
          clinic_id,
        });

        res.status(200).json({ diagnosisResponse });
        return;
      } else {
        res.status(400).json({ message: "Patient not found" });
        return;
      }
    } catch (error) {
      res.status(401).json({ message: "Internal error", error });
      return;
    }
  }
};

export const getAllDiagnosis = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"] as string;

  const jwtToken = authHeader.split("Bearer ")[1];

  const decodedHeader = jwt.decode(jwtToken) as JwtPayload;

  const clinic_id = decodedHeader.clinic_id;

  try {
    const diagnosisResponse = await Diagnosis.find({ clinic_id });
    if (diagnosisResponse) {
      res.status(200).json({ diagnosisResponse });
      return;
    } else {
      res.status(400).json({ message: "Patient not found" });
      return;
    }
  } catch (error) {
    res.status(401).json({ message: "Internal error", error });
    return;
  }
};

export const updatePatientDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { patientId, mobileNumber, email, address, PatientName, PatientAge } =
    req.body;
  const authHeader = req.headers["authorization"] as string;

  const jwtToken = authHeader.split("Bearer ")[1];
  const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
  const clinic_id = decodedHeader.clinic_id;

  const requiredFields = [patientId, clinic_id];
  if (
    requiredFields.includes(null) ||
    requiredFields.includes(undefined) ||
    requiredFields.includes("")
  ) {
    res.status(400).json({ message: "Missing fields" });
    return;
  }

  try {
    const patient = await Patient.findOne({ patientId, clinic_id });
    if (patient) {
      if (mobileNumber) patient.mobileNumber = mobileNumber;
      if (email) patient.email = email;
      if (address) patient.address = address;
      if (PatientName) patient.PatientName = PatientName;
      if (PatientAge) patient.PatientAge = PatientAge;

      const updatedPatient = await patient.save();
      res.status(200).json(updatedPatient);
    } else {
      res.status(404).json({ message: "Patient not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const updateDiagnosisDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { diagnosisId } = req.params;
  const { symptoms, diagnosis, observations, treatmentPlan, followUpDate } =
    req.body;

  const authHeader = req.headers["authorization"] as string;
  const jwtToken = authHeader.split("Bearer ")[1];
  const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
  const clinic_id = decodedHeader.clinic_id;

  const requiredFields = [diagnosisId, clinic_id];
  if (
    requiredFields.includes(null) ||
    requiredFields.includes(undefined) ||
    requiredFields.includes("")
  ) {
    res.status(400).json({ message: "Missing fields" });
    return;
  }

  try {
    const diagnosisToUpdate = await Diagnosis.findOne({
      _id: diagnosisId,
      clinic_id,
    });
    if (diagnosisToUpdate) {
      if (symptoms) diagnosisToUpdate.symptoms = symptoms;
      if (diagnosis) diagnosisToUpdate.diagnosis = diagnosis;
      if (observations) diagnosisToUpdate.observations = observations;
      if (treatmentPlan) diagnosisToUpdate.treatmentPlan = treatmentPlan;
      if (followUpDate) diagnosisToUpdate.followUpDate = followUpDate;

      const updatedDiagnosis = await diagnosisToUpdate.save();
      res.status(200).json(updatedDiagnosis);
    } else {
      res.status(404).json({ message: "Diagnosis not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const uploadPrescription = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log(req.body);
  let { patientId } = req.body;

  const authHeader = req.headers["authorization"] as string;

  const jwtToken = authHeader.split("Bearer ")[1];
  const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
  const clinic_id = decodedHeader.clinic_id;

  const requiredFields = [patientId, clinic_id];
  console.log(patientId, clinic_id);
  if (
    requiredFields.includes(null) ||
    requiredFields.includes(undefined) ||
    requiredFields.includes("")
  ) {
    res.status(400).json({ message: "Missing fields" });
    return;
  }

  try {
    const patient = await Patient.findOne({ patientId, clinic_id });
    if (!patient) {
      res.status(404).json({ message: "Patient not found" });
      return;
    }

    const prescription = req.file as Express.Multer.File | undefined;

    if (!prescription) {
      res.status(400).json({ message: "Missing prescription file" });
      return;
    }

    const bucket = getStorageBucket();
    const fileName = `prescription/${clinic_id}_${Date.now()}_${
      prescription.originalname
    }`;
    const fileUpload = bucket.file(fileName);

    // Upload the file to Firebase Storage
    await new Promise<void>((resolve, reject) => {
      const uploadStream = fileUpload.createWriteStream({
        metadata: {
          contentType: prescription.mimetype,
          metadata: {
            patientId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      uploadStream.on("finish", resolve);
      uploadStream.on("error", reject);
      uploadStream.end(prescription.buffer);
    });

    // Get the download URL for the uploaded file
    const [downloadUrl] = await fileUpload.getSignedUrl({
      action: "read",
      expires: Date.now() + 315569520000,
    });

    patient.prescription.push(downloadUrl);
    const updatedPatient = await patient.save();

    res
      .status(200)
      .json({ message: "Prescription uploaded successfully", updatedPatient });
  } catch (error) {
    console.error("Error uploading prescription:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
