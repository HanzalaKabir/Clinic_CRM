import { Request, Response } from "express";
import Patient from "../../models/patientModel.js";
import Clinic from "../../models/clinicModel.js";
import jwt, { JwtPayload } from "jsonwebtoken";

export const getPatientBypatientId = async (req: Request, res: Response) => {
  try {
    const patientId = req.query.patientId as string;
    if (!patientId) {
      res.status(400).json({ message: "patientId is required" });
    } else if (!/^[0-9]+$/.test(patientId)) {
      res.status(400).json({ message: "Invalid patientId format" });
    } else {
      const response = await Patient.findOne({ patientId });
      if (response) {
        res.status(200).json({ response });
      } else {
        res.status(404).json({ message: "Patient not found" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Some error occured", error });
  }
};

export const getAllPatientsByClinic = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers["authorization"] as string;

    const jwtToken = authHeader.split("Bearer ")[1];

    const decodedHeader = jwt.decode(jwtToken) as JwtPayload;

    const clinic_id = decodedHeader.clinic_id;
    if (!clinic_id) {
      res.status(400).json({ message: "clinicId is required" });
    } else {
      const isClinic = await Clinic.findById(clinic_id);
      if (isClinic) {
        const response = await Patient.find({ clinic_id });
        if (response) {
          res
            .status(200)
            .json({ PatientCount: response.length, Patients: response });
        } else {
          res
            .status(404)
            .json({ message: "No registered patients for this clinic" });
        }
      } else {
        res.status(404).json({ message: "clinicId is invalid" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Some error occured", error });
  }
};
