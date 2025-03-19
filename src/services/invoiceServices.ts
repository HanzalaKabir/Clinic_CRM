import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import pdfMake from "pdfmake/build/pdfmake.js";
import vfs from "pdfmake/build/vfs_fonts.js";
import Clinic from "../models/clinicModel.js";
import Patient from "../models/patientModel.js";
import Invoice from "../models/invoiceModel.js";
import { getStorageBucket } from "../config/firebase.config.js";
import dotenv from "dotenv";

dotenv.config();

(pdfMake as any).vfs = vfs;

export const generateInvoicePdf = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"] as string;
    const jwtToken = authHeader.split("Bearer ")[1];
    const decodedHeader = jwt.decode(jwtToken) as JwtPayload;
    const clinic_id = decodedHeader.clinic_id;

    const { invoiceId } = req.query;

    if (!invoiceId) {
      res.status(404).json({ message: "invoiceId is required" });
      return;
    }

    const invoice = await Invoice.findOne({ invoiceId, clinic_id });
    //console.log(invoice);

    if (!invoice) {
      res.status(403).json({ message: "Could not find invoice" });
      return;
    }
    const patient = await Patient.findOne({
      patientId: invoice.patientId,
      clinic_id,
    });
    const clinic = await Clinic.findById(clinic_id);
    if (!patient || !clinic) {
      res.status(403).json({
        message: `Could not find ${
          patient === undefined ? "patient" : "clinic"
        }`,
      });
      return;
    }

    if (invoice.invoiceUrl) {
      res.redirect(`${process.env.host}${invoice.invoiceUrl}`);
      return;
    }

    //console.log(invoice.totalAmount, invoice.amountPaid);
    if (invoice.totalAmount !== invoice.amountPaid) {
      res.status(409).json({
        message: "Invoice cannot be generated before total amount is paid",
      });
      return;
    }

    // const services = [
    //   {
    //     item: "X-ray",
    //     description: "Right knee X-ray AP view",
    //     amount: 400,
    //   },
    //   {
    //     item: "Consultation",
    //     description: "Doctor consultation fee",
    //     amount: 200,
    //   },
    // ];

    const docDefinition = {
      content: [
        {
          text: "MEDICAL BILLING INVOICE",
          style: "header",
          alignment: "center",
        },
        { text: "\n" },
        {
          columns: [
            [
              { text: "PATIENT INFORMATION", style: "subheader" },
              {
                text: `${patient.PatientName}\n${patient.mobileNumber}\n${patient.address}`,
                style: "smallText",
              },
            ],
            [
              {
                text: "CLINIC INFORMATION",
                style: "subheader",
                alignment: "right",
              },
              {
                text: `${clinic.ClinicName}\n${clinic.website}\n${clinic.address.address} ${clinic.address.city} ${clinic.address.state}`,
                style: "smallText",
                alignment: "right",
              },
            ],
          ],
        },
        { text: "\n" },
        {
          columns: [
            {
              text: `INVOICE NUMBER: ${invoiceId.toString()}`,
              style: "smallText",
            },
            {
              text: `DATE: ${new Date().toLocaleDateString()}`,
              alignment: "center",
              style: "smallText",
            },
            {
              text: `DUE DATE: ${new Date(
                new Date().setDate(new Date().getDate() + 30)
              ).toLocaleDateString()}`,
              alignment: "right",
              style: "smallText",
            },
          ],
        },
        // { text: "\n", style: "divider" },
        // {
        //   table: {
        //     headerRows: 1,
        //     widths: ["*", "*", "auto"],
        //     body: [
        //       [
        //         { text: "ITEM", style: "tableHeader" },
        //         { text: "DESCRIPTION", style: "tableHeader" },
        //         { text: "AMOUNT", style: "tableHeader" },
        //       ],
        //       ...services.map((service: any) => [
        //         { text: service.item, style: "tableText" },
        //         { text: service.description, style: "tableText" },
        //         {
        //           text: `Rs.${service.amount}`,
        //           style: "tableText",
        //           alignment: "right",
        //         },
        //       ]),
        //     ],
        //   },
        // },
        { text: "\n", style: "divider" },
        {
          text: `TOTAL AMOUNT: Rs.${invoice.totalAmount}`,
          alignment: "right",
          style: "amountDue",
        },
        {
          text: `status: ${invoice.paymentStatus}`,
          style: "smallText",
          alignment: "right",
        },
        { text: "\nThank you for visiting!\n", style: "footer" },
        {
          text: `${clinic.ClinicName}\n For inquiries, visit: ${clinic.website}`,
          style: "footer",
        },
      ],
      styles: {
        header: { fontSize: 20, bold: true },
        subheader: { fontSize: 12, bold: true },
        smallText: { fontSize: 10 },
        tableHeader: {
          fontSize: 12,
          bold: true,
          color: "#ffffff",
          fillColor: "#4f81bd",
        },
        tableText: { fontSize: 10 },
        amountDue: { fontSize: 18, bold: true, color: "#333333" },
        footer: { fontSize: 10, alignment: "center", margin: [0, 20, 0, 0] },
        divider: { margin: [0, 10, 0, 10], decoration: "underline" },
      },
      defaultStyle: { font: "Roboto" },
    };

    const pdfDoc = pdfMake.createPdf(docDefinition as any);

    pdfDoc.getBuffer(async (buffer) => {
      const bucket = getStorageBucket();
      const fileName = `invoice-pdf/${clinic_id}_${
        patient.patientId
      }_${Date.now()}.pdf`;
      const fileUpload = bucket.file(fileName);
      const uploadStream = fileUpload.createWriteStream({
        metadata: {
          contentType: "application/pdf",
          metadata: {
            clinic_id,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      uploadStream.write(buffer);
      uploadStream.end();

      uploadStream.on("finish", async () => {
        try {
          const filePath = fileName;
          invoice.filePath = filePath;
          invoice.invoiceUrl = `/invoice/${invoice._id}/pdf`;
          await invoice.save();

          res.redirect(`${process.env.host}/invoice/${invoice._id}/pdf`);
          return;
        } catch (err) {
          console.error("Error in finish handler:", err);
          res.status(500).json({ message: "Internal server error" });
        }
      });

      uploadStream.on("error", (error) => {
        console.error("Stream error:", error.message);
        res.status(500).json({
          message: "Failed to upload PDF to Firebase",
          error: error.message,
        });
        return;
      });
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to upload PDF to Firebase",
    });
    return;
  }
};
