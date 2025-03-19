import { Router } from "express";
import {
  createInvoice,
  getInvoicePdfByInvoiceId,
  getAllInvoice,
  editInvoice,
  deleteInvoice,
  PaymentDetails,
} from "../controllers/InvoiceController/invoiceController.js";
import { generateInvoicePdf } from "../services/invoiceServices.js";
import { protect } from "../middleware/authMiddleware.js";

const invoiceRouter = Router();

invoiceRouter.post("/create", protect, createInvoice);
invoiceRouter.get("/getInvoice", protect, getAllInvoice);
invoiceRouter.put("/editInvoice", protect, editInvoice);
invoiceRouter.post("/generate", protect, generateInvoicePdf);
invoiceRouter.get("/:invoiceId/pdf", protect, getInvoicePdfByInvoiceId);
invoiceRouter.delete("/delete/:invoiceId", protect, deleteInvoice);
invoiceRouter.get("/paymentDetails", protect, PaymentDetails);

export default invoiceRouter;
