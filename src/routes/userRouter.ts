import { Router } from "express";
import { getAllUsersByClinic } from "../services/clinicServices.js";
import { protect } from "../middleware/authMiddleware.js";

const UserRouter = Router();

UserRouter.route("/getAllUsersByClinic").get(protect, getAllUsersByClinic);

export default UserRouter;
