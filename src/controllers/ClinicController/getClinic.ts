import { Request, Response } from "express";
import Clinic from "../../models/clinicModel.js";
import jwt, { JwtPayload } from "jsonwebtoken";

export const getClinicById = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers["authorization"] as string;

    const jwtToken = authHeader.split("Bearer ")[1];

    const decodedHeader = jwt.decode(jwtToken) as JwtPayload;

    const clinic_id = decodedHeader.clinic_id;
    if (clinic_id) {
      const isClinic = await Clinic.findById(clinic_id);
      if (isClinic) {
        res.status(200).json(isClinic);
      } else {
        res.status(400).json({ message: "Clinic not found" });
      }
    } else {
      res.status(400).json({ message: "Clinic Id is required" });
    }
  } catch (error) {
    res.status(500).json({ message: "Some error occured", error });
  }
};
