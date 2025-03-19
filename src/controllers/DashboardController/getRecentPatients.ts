import { Request, Response } from "express";
import Patient from "../../models/patientModel.js";

export const getRecentPatients = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { clinic_id } = req.query;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!clinic_id || typeof clinic_id !== "string") {
      res
        .status(400)
        .json({ message: "Invalid or missing clinic_id parameter" });
      return;
    }

    const recentPatients = await Patient.find({ clinic_id })
      .sort({ createdAt: -1 })
      .limit(limit);

    if (recentPatients.length === 0) {
      res
        .status(404)
        .json({ message: "No recent patients found for the specified clinic" });
      return;
    }

    console.log("Recent Patients:", recentPatients);

    res.status(200).json({ recentPatients });
  } catch (error) {
    console.error("Error fetching recent patients:", error);
    res.status(500).json({ message: "Error fetching recent patients", error });
  }
};
