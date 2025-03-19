import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { customAlphabet } from "nanoid";
import { getStorageBucket } from "../../config/firebase.config.js";
import { IInvoice } from "../../types/invoiceInterface.js";
import Invoice from "../../models/invoiceModel.js";
import Patient from "../../models/patientModel.js";
import Clinic from "../../models/clinicModel.js";

export const createInvoice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"] as string;
    const jwtToken = authHeader.split("Bearer ")[1];
    const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
    const clinic_id = decodedHeader.clinic_id;
    const {
      patientId,
      totalAmount,
      amountPaid,
      paymentStatus,
      dateOfPayment,
      // services,
    } = req.body;

    const requiredFields = [
      { field: "patientId", value: patientId },
      { field: "totalAmount", value: totalAmount },
      { field: "amountPaid", value: amountPaid },
      { field: "paymentStatus", value: paymentStatus },
      { field: "dateOfPayment", value: dateOfPayment },
      { field: "clinic_id", value: clinic_id },
      // { field: "services", value: services },
    ];

    const missingField = requiredFields.find(
      (field) =>
        field.value === null || field.value === undefined || field.value === ""
    );

    if (missingField) {
      res.status(400).json({
        message: `Missing or invalid data: ${missingField.field} is required`,
        error: `Missing ${missingField.field}`,
      });
      return;
    }

    const patient_ID = Number(patientId);

    const patient = await Patient.findOne({ patientId: patient_ID });
    if (!patient) {
      res.status(404).json({ message: "Patient not found" });
      return;
    }

    const clinic = await Clinic.findById(clinic_id);
    if (!clinic) {
      res.status(404).json({ message: "Clinic not found" });
      return;
    }

    const numericId = customAlphabet("0123456789", 12);
    const invoiceId = Number(numericId());

    const invoiceObject: IInvoice = {
      invoiceId,
      patientId,
      clinic_id,
      totalAmount,
      amountPaid,
      paymentStatus,
      dateOfPayment,
    };

    const newInvoice = new Invoice(invoiceObject);
    try {
      const invoiceResponse = await newInvoice.save();
      patient.invoices.push(invoiceResponse._id);
      const patientResponse = await patient.save();

      res.status(200).json({
        message: "Invoice created successfully",
        invoiceResponse: {
          ...invoiceResponse.toJSON(),
          pdfUrl: `/${invoiceResponse._id}/pdf`,
        },
        patientResponse,
      });
      return;
    } catch (error) {
      const dbError = error as Error;
      console.error("Error saving invoice to database:", dbError.message);
      res.status(500).json({
        message: "Failed to save invoice to database",
        error: dbError.message,
      });
      return;
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
    return;
  }
};

export const editInvoice = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authHeader = req.headers["authorization"] as string;
  const jwtToken = authHeader.split("Bearer ")[1];
  const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
  const clinic_id = decodedHeader.clinic_id;

  try {
    const clinic = await Clinic.findById(clinic_id);
    if (!clinic) {
      res.status(401).json({ message: "Could not find clinic" });
      return;
    }

    const { invoiceId, amountPaid, totalAmount } = req.body;

    const invoiceResponse = await Invoice.findOne({ invoiceId });
    if (!invoiceResponse) {
      res
        .status(401)
        .json({ message: `Could not find invoice with id:${invoiceId}` });
      return;
    }

    const paymentDate = new Date(); 

    if (totalAmount) {
      invoiceResponse.totalAmount = totalAmount;
    }

    const currentPaid = parseFloat(invoiceResponse.amountPaid) || 0;
    const newPayment = parseFloat(amountPaid) || 0;
    const totalPaid = currentPaid + newPayment;
    const invoiceTotal = parseFloat(invoiceResponse.totalAmount);

    if (totalPaid > invoiceTotal) {
      res
        .status(400)
        .json({ message: "Total paid amount cannot exceed invoice amount" });
      return;
    }

    if (totalPaid === 0) {
      invoiceResponse.paymentStatus = "pending";
    } else if (totalPaid === invoiceTotal) {
      invoiceResponse.paymentStatus = "paid";
    } else {
      invoiceResponse.paymentStatus = "partial";
    }

    invoiceResponse.dateOfPayment = paymentDate;
    invoiceResponse.amountPaid = totalPaid.toString();

    await invoiceResponse.save();
    res.status(200).json(invoiceResponse);
  } catch (error) {
    res.status(500).json({ message: "Some error occurred" });
    return;
  }
};

export const getAllInvoice = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authHeader = req.headers["authorization"] as string;
  const jwtToken = authHeader.split("Bearer ")[1];
  const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
  const clinic_id = decodedHeader.clinic_id;

  try {
    const clinic = await Clinic.findById(clinic_id);
    if (!clinic) {
      res.status(401).json({ message: "Could not find clinic" });
      return;
    }

    const invoiceResponse = await Invoice.aggregate([
      {
        $match: { clinic_id },
      },
      {
        $lookup: {
          from: "patients",
          let: { patientId: "$patientId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$patientId", "$$patientId"] },
              },
            },
            {
              $project: {
                PatientName: 1,
                email: 1,
                PatientAge: 1,
                mobileNumber: 1,
                _id: 0,
              },
            },
          ],
          as: "patientDetails",
        },
      },
      {
        $addFields: {
          patientDetails: { $arrayElemAt: ["$patientDetails", 0] },
        },
      },
      {
        $addFields: {
          patientName: "$patientDetails.PatientName",
          patientEmail: "$patientDetails.email",
          patientAge: "$patientDetails.PatientAge",
          patientMobile: "$patientDetails.mobileNumber",
        },
      },
      {
        $project: {
          patientDetails: 0,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    res.status(200).json(invoiceResponse);
    return;
  } catch (error) {
    console.error("Error in getAllInvoice:", error);
    res.status(500).json({ message: "Some error occurred" });
    return;
  }
};

export const getInvoicePdfByInvoiceId = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { invoiceId } = req.params;
  const authHeader = req.headers["authorization"] as string;
  const jwtToken = authHeader.split("Bearer ")[1];
  const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
  const clinic_id = decodedHeader.clinic_id;

  try {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      res.status(404).json({ message: "Invoice not found" });
      return;
    }

    if (invoice.clinic_id !== clinic_id) {
      res.status(403).json({ message: "Unauthorized access" });
      return;
    }

    if (invoice.invoiceUrl === null) {
      res.status(404).json({
        message:
          "Invoice has not been generated yet, please generate invoice before accessing",
      });
    }

    const bucket = getStorageBucket();
    const file = bucket.file(invoice.filePath as string);

    const [exists] = await file.exists();
    if (!exists) {
      res.status(404).json({ message: "PDF file not found" });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="invoice-${invoiceId}.pdf"`
    );

    file
      .createReadStream()
      .on("error", (error) => {
        console.error("Error streaming file:", error);
        res
          .status(500)
          .json({ message: "Error streaming file", error: error.message });
      })
      .pipe(res);
  } catch (error) {
    console.error("Error serving PDF:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const deleteInvoice = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authHeader = req.headers["authorization"] as string;
  const jwtToken = authHeader.split("Bearer ")[1];
  const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
  const clinic_id = decodedHeader.clinic_id;

  try {
    const clinic = await Clinic.findById(clinic_id);
    if (!clinic) {
      res.status(401).json({ message: "Could not find clinic" });
      return;
    }

    const { invoiceId } = req.params;
    if (!invoiceId) {
      res.status(401).json({ message: "Invoice Id is required" });
      return;
    }
    const invoiceResponse = await Invoice.findOneAndDelete({ invoiceId });
    if (!invoiceResponse) {
      res.status(400).json({ message: "Invoice not found" });
      return;
    }

    res.status(200).json(invoiceResponse);
    return;
  } catch (error) {
    console.error("Error in deleteing invoice:", error);
    res.status(500).json({ message: "Some error occurred" });
    return;
  }
};

export const PaymentDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authHeader = req.headers["authorization"] as string;
  const jwtToken = authHeader.split("Bearer ")[1];
  const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
  const clinic_id = decodedHeader.clinic_id;

  try {
    const clinic = await Clinic.findById(clinic_id);
    if (!clinic) {
      res.status(401).json({ message: "Could not find clinic" });
      return;
    }

    const balanceInvoice = await Invoice.aggregate([
      {
        $match: {
          clinic_id,
        },
      },
      {
        $group: {
          _id: "$clinic_id",
          totalInvoiceAmount: {
            $sum: { $toDouble: "$totalAmount" },
          },
          paidInvoiceAmount: {
            $sum: { $toDouble: "$amountPaid" },
          },
        },
      },
      {
        $project: {
          totalInvoiceAmount: 1,
          paidInvoiceAmount: 1,
          unpaidInvoiceAmount: {
            $subtract: ["$totalInvoiceAmount", "$paidInvoiceAmount"],
          },
        },
      },
    ]);

    //console.log(balanceInvoice);

    res.status(200).json(balanceInvoice);
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unknown error occurred" });
    return;
  }
};
