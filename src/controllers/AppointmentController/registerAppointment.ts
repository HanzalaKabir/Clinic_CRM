import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { customAlphabet } from "nanoid";
import Appointment from "../../models/appointmentModel.js";
import Clinic from "../../models/clinicModel.js";
import Patient from "../../models/patientModel.js";
import { IAppointment } from "../../types/appointmentInterface.js";
import { IPatient } from "../../types/patientInterface.js";

const convertTo24Hour = (time: string): string => {
  const [rawTime, period] = time.split(" ");
  if (!period) return time; // Already in 24hr format

  let [hours, minutes] = rawTime.split(":").map(Number);

  if (period.toLowerCase() === "pm" && hours !== 12) {
    hours += 12;
  } else if (period.toLowerCase() === "am" && hours === 12) {
    hours = 0;
  }
  console.log(
    `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`
  );
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

export const registerAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const numericId = customAlphabet("0123456789", 12);
  const appointmentNumber = Number(numericId());
  let isNewPatient = false;

  try {
    const { name, age, email, mobileNumber, appointmentDate, status } =
      req.body;
    let { appointmentTime } = req.body;

    appointmentTime = convertTo24Hour(appointmentTime);

    const authHeader = req.headers["authorization"] as string;
    const jwtToken = authHeader.split("Bearer ")[1];
    const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
    const clinic_id = decodedHeader.clinic_id;

    const clinic = await Clinic.findById(clinic_id);
    if (!clinic) {
      res.status(401).json({ message: "Invalid Clinic Id" });
      return;
    }

    let patient = await Patient.findOne({ mobileNumber, clinic_id });

    if (!patient) {
      const requiredPatientFields = [name, age, email, mobileNumber];
      if (requiredPatientFields.some((field) => !field)) {
        res.status(400).json({
          message:
            "Patient not found. Please provide all required patient information.",
        });
        return;
      }

      const patientId = Number(numericId());
      const newPatient = new Patient({
        PatientName: name.toLowerCase(),
        PatientAge: age,
        mobileNumber,
        email: email.toLowerCase(),
        address: "NULL",
        patientId,
        clinic_id,
        prescription: [],
        diagnoses: [],
        invoices: [],
      });
      patient = await newPatient.save();
      isNewPatient = true;
    }

    const existingAppointment = await Appointment.findOne({
      mobileNumber,
      appointmentDate,
      clinic_id,
    });

    if (existingAppointment) {
      res.status(409).json({
        message: "You already have an appointment scheduled for this date",
        existingAppointment: {
          date: existingAppointment.appointmentDate,
          time: existingAppointment.appointmentTime,
        },
      });
      return;
    }

    const { openingTime, closingTime } = clinic.Availibility.timing || {};
    const slotBreak = clinic.Availibility.slotBreak || undefined;
    if (!openingTime || !closingTime || !slotBreak) {
      res.status(400).json({
        message:
          "Invalid clinic configuration - missing timing or slot break information",
      });
      return;
    }

    const requiredFields = [
      name,
      age,
      email,
      mobileNumber,
      appointmentDate,
      appointmentTime,
      clinic_id,
      slotBreak,
      openingTime,
      closingTime,
    ];
    if (requiredFields.includes(null) || requiredFields.includes(undefined)) {
      res.status(400).json({ message: "Data missing in request" });
      return;
    }

    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };
    const openingMinutes = toMinutes(openingTime);
    const closingMinutes = toMinutes(closingTime);
    const appointmentMinutes = toMinutes(appointmentTime);

    if (
      appointmentMinutes < openingMinutes ||
      appointmentMinutes > closingMinutes
    ) {
      res.status(400).json({
        message: "Appointment time is outside clinic operating hours",
      });
      return;
    }

    if ((appointmentMinutes - openingMinutes) % slotBreak !== 0) {
      res.status(400).json({
        message: `Appointments must be scheduled in ${slotBreak}-minute intervals from ${openingTime}`,
      });
      return;
    }

    const allAppointments = await Appointment.find({ clinic_id });
    let slotBusy = false;

    allAppointments.forEach((appointment) => {
      if (
        appointment.appointmentDate === appointmentDate &&
        appointment.appointmentTime === appointmentTime
      ) {
        slotBusy = true;
      }
    });

    if (slotBusy) {
      res.status(409).json({
        message:
          "This time slot is booked, please select a different time or different date for your appointment",
      });
      return;
    }

    const appointmentObject: IAppointment = {
      name,
      age,
      email,
      mobileNumber,
      appointmentDate,
      appointmentTime,
      clinic_id,
      appointmentNumber,
      status: status || "pending",
    };

    const newAppointment = new Appointment(appointmentObject);
    await newAppointment.save();

    res.status(201).json({
      message: isNewPatient
        ? "Patient registered and appointment booked successfully"
        : "Appointment created successfully",
      appointmentDetails: newAppointment,
      ...(isNewPatient && { patientDetails: patient }),
    });
    return;
  } catch (error) {
    console.error("Error occurred during appointment registration:", error);
    res.status(500).json({
      message: "Some error occurred",
      error: error instanceof Error ? error.message : error,
    });
    return;
  }
};
