import { Request, Response } from "express";
import Patient from "../../models/patientModel.js"; // Import the Patient model

export const getRecentPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clinic_id } = req.query; // Extract clinic_id from query parameters
    const limit = parseInt(req.query.limit as string) || 5; // Default limit is 5

   
    if (!clinic_id || typeof clinic_id !== "string") {
      res.status(400).json({ message: "Invalid or missing clinic_id parameter" });
      return;
    }

    // Fetch the most recent patients of the specified clinic sorted by 'createdAt' in descending order
    const recentPatients = await Patient.find({ clinic_id }) // Filter by clinic_id
      .sort({ createdAt: -1 }) // Sort by most recent 'createdAt'
      .limit(limit); // Limit to the specified number of recent patients

    // If no patients are found
    if (recentPatients.length === 0) {
      res.status(404).json({ message: "No recent patients found for the specified clinic" });
      return;
    }

    console.log("Recent Patients:", recentPatients);

    // Return the recent patients
    res.status(200).json({ recentPatients });
  } catch (error) {
    console.error("Error fetching recent patients:", error);
    res.status(500).json({ message: "Error fetching recent patients", error });
  }
};
