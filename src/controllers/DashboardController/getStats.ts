import { Request, Response } from "express";
import moment from "moment";
import Appointment from "../../models/appointmentModel.js";
import Invoice from "../../models/invoiceModel.js";
import Patient from "../../models/patientModel.js";

const calculatePercentageChange = (
  current: number,
  previous: number
): number => {
  if (previous === 0 && current > 0) return 100;
  if (previous === 0 && current === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, clinic_id } = req.query;

    const monthString = typeof month === "string" ? month : undefined;
    const clinicIdString =
      typeof clinic_id === "string" ? clinic_id : undefined;

    if (!monthString || !moment(monthString, "YYYY-MM", true).isValid()) {
      res.status(400).json({ message: "Invalid or missing 'month' parameter" });
    }

    if (!clinicIdString) {
      res
        .status(400)
        .json({ message: "Invalid or missing 'clinic_id' parameter" });
    }

    const currentMonthStart = moment
      .utc(monthString, "YYYY-MM")
      .startOf("month")
      .toDate();
    const currentMonthEnd = moment
      .utc(monthString, "YYYY-MM")
      .endOf("month")
      .toDate();
    const previousMonthStart = moment(currentMonthStart)
      .subtract(1, "month")
      .toDate();
    const previousMonthEnd = moment(currentMonthEnd)
      .subtract(1, "month")
      .toDate();

    const [
      totalPatients,
      previousMonthPatients,
      currentAppointments,
      previousAppointments,
      currentInvoices,
      previousInvoices,
    ] = await Promise.all([
      Patient.countDocuments({
        clinic_id: clinicIdString,
        createdAt: { $gte: currentMonthStart, $lt: currentMonthEnd },
      }),
      Patient.countDocuments({
        clinic_id: clinicIdString,
        createdAt: { $gte: previousMonthStart, $lt: previousMonthEnd },
      }),
      Appointment.find({
        clinic_id: clinicIdString,
        appointmentDate: { $gte: currentMonthStart, $lt: currentMonthEnd },
      }),
      Appointment.find({
        clinic_id: clinicIdString,
        appointmentDate: { $gte: previousMonthStart, $lt: previousMonthEnd },
      }),
      Invoice.find({
        clinic_id: clinicIdString,
        dateOfPayment: { $gte: currentMonthStart, $lt: currentMonthEnd },
      }),
      Invoice.find({
        clinic_id: clinicIdString,
        dateOfPayment: { $gte: previousMonthStart, $lt: previousMonthEnd },
      }),
    ]);

    const patientsChangePercentage = calculatePercentageChange(
      totalPatients,
      previousMonthPatients
    );
    const appointmentsChangePercentage = calculatePercentageChange(
      currentAppointments.length,
      previousAppointments.length
    );

    const totalPaidAmount = currentInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.amountPaid || "0"),
      0
    );
    const totalUnpaidAmount = currentInvoices.reduce((sum, inv) => {
      const unpaid =
        parseFloat(inv.totalAmount || "0") - parseFloat(inv.amountPaid || "0");
      return sum + Math.max(unpaid, 0);
    }, 0);

    const previousPaidAmount = previousInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.amountPaid || "0"),
      0
    );
    const previousUnpaidAmount = previousInvoices.reduce((sum, inv) => {
      const unpaid =
        parseFloat(inv.totalAmount || "0") - parseFloat(inv.amountPaid || "0");
      return sum + Math.max(unpaid, 0);
    }, 0);

    const paidChangePercentage = calculatePercentageChange(
      totalPaidAmount,
      previousPaidAmount
    );
    const unpaidChangePercentage = calculatePercentageChange(
      totalUnpaidAmount,
      previousUnpaidAmount
    );

    res.status(200).json({
      totalPatients,
      patientsChangePercentage: `${
        patientsChangePercentage > 0 ? "+" : ""
      }${patientsChangePercentage.toFixed(2)}%`,
      totalAppointments: currentAppointments.length,
      appointmentsChangePercentage: `${
        appointmentsChangePercentage > 0 ? "+" : ""
      }${appointmentsChangePercentage.toFixed(2)}%`,
      totalPaidAmount,
      totalUnpaidAmount,
      paidChangePercentage: `${
        paidChangePercentage > 0 ? "+" : ""
      }${paidChangePercentage.toFixed(2)}%`,
      unpaidChangePercentage: `${
        unpaidChangePercentage > 0 ? "+" : ""
      }${unpaidChangePercentage.toFixed(2)}%`,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
