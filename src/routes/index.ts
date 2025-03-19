import { Router } from "express";
import ClinicRouter from "./clinicRouter.js";
import PatientRouter from "./patientRouter.js";
import AppointmentRouter from "./appointmentRouter.js";
import UserRouter from "./userRouter.js";
import invoiceRouter from "./invoiceRouter.js";

const router = Router();
router.use("/clinic", ClinicRouter);
router.use("/patient", PatientRouter);
router.use("/appointment", AppointmentRouter);
router.use("/user", UserRouter);
router.use("/invoice", invoiceRouter);

export default router;
