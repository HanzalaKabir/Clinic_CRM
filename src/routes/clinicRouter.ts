import { Router, RequestHandler } from "express";
import multer from "multer";
import { registerClinic } from "../controllers/ClinicController/registerClinic.js";
import { protect } from "../middleware/authMiddleware.js";
import { getClinicById } from "../controllers/ClinicController/getClinic.js";
import { deleteClinicByClinicId } from "../services/clinicServices.js";
import { updateClinic } from "../services/clinicServices.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed."));
    }
  },
});

const ClinicRouter = Router();

ClinicRouter.post(
  "/addClinic",
  protect,
  upload.single("Logo"),
  registerClinic as RequestHandler
);
ClinicRouter.route("/getClinic").get(protect, getClinicById);
ClinicRouter.route("/deleteClinic").post(protect, deleteClinicByClinicId);
ClinicRouter.route("/updateClinic").post(protect, updateClinic);

export default ClinicRouter;
