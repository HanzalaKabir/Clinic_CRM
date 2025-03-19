import { Request, Response } from "express";
import Appointment from "../../models/appointmentModel.js";

export const get12MonthData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startMonth } = req.query;

    if (!startMonth) {
      res.status(400).json({ error: "startMonth query parameter is required" });
      return;
    }

    const [startYear, startMonthIndex] = (startMonth as string)
      .split("-")
      .map(Number);
    if (
      !startYear ||
      !startMonthIndex ||
      startMonthIndex < 1 ||
      startMonthIndex > 12
    ) {
      res
        .status(400)
        .json({ error: "Invalid startMonth format. Use YYYY-MM." });
      return;
    }

    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(startYear, startMonthIndex - 1 - i);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      months.push({ year, month });
    }

    const results: { month: string; appointments: number }[] = [];

    await Promise.all(
      months.map(async ({ year, month }): Promise<void> => {
        const regex = new RegExp(`^\\d{2}-${month}-${year}$`);

        const appointmentsCount = await Appointment.countDocuments({
          appointmentDate: {
            $regex: regex,
          },
        });

        results.push({
          month: `${year}-${month}`,
          appointments: appointmentsCount,
        });
      })
    );

    results.sort(
      (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
    );

    res.status(200).json({
      startMonth,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
