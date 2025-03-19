import { Router } from "express";
import { getAllAppointments } from "../controllers/AppointmentController/getAllAppointments.js";
import { getAppointment } from "../controllers/AppointmentController/getAppointment.js";

import { registerAppointment } from "../controllers/AppointmentController/registerAppointment.js";
import { protect } from "../middleware/authMiddleware.js";
import { getClinicAvailibility } from "../services/clinicServices.js";

const AppointmentRouter = Router();

AppointmentRouter.route("/create-appointment").post(
  protect,
  registerAppointment
);
AppointmentRouter.route("/get-appointment").post(protect, getAppointment);
AppointmentRouter.route("/get-all-appointments").post(
  protect,
  getAllAppointments
);
AppointmentRouter.route("/clinic-availibility").get(
  protect,
  getClinicAvailibility
);

export default AppointmentRouter;
