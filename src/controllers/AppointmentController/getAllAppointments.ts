import { Request, Response } from "express";
import Appointment from "../../models/appointmentModel.js";
import Clinic from "../../models/clinicModel.js";
import jwt, { JwtPayload } from "jsonwebtoken";

export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers["authorization"] as string;

    const jwtToken = authHeader.split("Bearer ")[1];

    const decodedHeader = jwt.decode(jwtToken) as JwtPayload;

    const clinic_id = decodedHeader.clinic_id;

    const requiredFields = [clinic_id];
    if (requiredFields.includes(null) || requiredFields.includes(undefined)) {
      res.status(400).json({ message: "Data missing in request" });
    } else {
      const isClinic = await Clinic.findById(clinic_id);
      if (isClinic) {
        const getAppointment = await Appointment.find({
          clinic_id,
        });
        if (getAppointment) {
          res.status(200).send({ allAppointments: getAppointment });
        } else {
          res.status(200).send("No appointments for now");
        }
      } else {
        res.status(401).json({ message: "Invalid Clinic Id" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Some error occured" });
  }
};
