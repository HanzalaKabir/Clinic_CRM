import { Request, Response } from "express";
import { customAlphabet } from "nanoid";
import { IPatient } from "../../types/patientInterface.js";
import Patient from "../../models/patientModel.js";
import Clinic from "../../models/clinicModel.js";
import jwt, { JwtPayload } from "jsonwebtoken";

export const registerPatient = async (req: Request, res: Response) => {
  try {
    const numericId = customAlphabet("0123456789", 12);
    const patientId = Number(numericId());

    const authHeader = req.headers["authorization"] as string;

    const jwtToken = authHeader.split("Bearer ")[1];

    const decodedHeader = jwt.decode(jwtToken) as JwtPayload;

    const clinic_id = decodedHeader.clinic_id;

    const { PatientName, PatientAge, mobileNumber, email, address } = req.body;
    //console.log(clinic_id);

    const isClinic = await Clinic.findById(clinic_id);
    if (isClinic) {
      const requiredFields = [
        PatientName,
        PatientAge,
        mobileNumber,
        email,
        address,
        clinic_id,
      ];
      if (requiredFields.includes(null) || requiredFields.includes(undefined)) {
        res.status(400).json({ message: "Data missing in request" });
      } else {
        const PatientObject: IPatient = {
          PatientName: PatientName.toLowerCase(),
          PatientAge,
          mobileNumber,
          email: email.toLowerCase(),
          address,
          patientId,
          clinic_id,
          prescription: [],
          diagnoses: [],
          invoices: [],
        };

        const newPatient = new Patient(PatientObject);
        const response = await newPatient.save();
        res.status(200).json({
          message: "New patient is registered successfully",
          response,
          patientId: response.patientId,
        });
      }
    } else {
      res.status(401).json({ message: "Invalid Clinic Id" });
    }
  } catch (error) {
    res.status(400).json({ message: "Some error occured", error });
  }
};
