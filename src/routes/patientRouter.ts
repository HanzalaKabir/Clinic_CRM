import { RequestHandler, Router } from "express";
import { registerPatient } from "../controllers/PatientController/registerPatient.js";
import {
  getPatientBypatientId,
  getAllPatientsByClinic,
} from "../controllers/PatientController/getPatient.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  AddDiagnosis,
  getAllDiagnosis,
  getDiagnosisByPatientId,
  updateDiagnosisDetails,
  updatePatientDetails,
  uploadPrescription,
} from "../services/patientServices.js";
import multer from "multer";

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

const PatientRouter = Router();

PatientRouter.route("/getPatient").get(protect, getPatientBypatientId);
PatientRouter.route("/getAllPatientByClinic").get(
  protect,
  getAllPatientsByClinic
);
PatientRouter.route("/addPatient").post(protect, registerPatient);
PatientRouter.route("/addDiagnosis").post(protect, AddDiagnosis);
PatientRouter.route("/getDiagnosis").get(protect, getDiagnosisByPatientId);
PatientRouter.route("/getAllDiagnosis").get(protect, getAllDiagnosis);
PatientRouter.route("/updatePatient").post(protect, updatePatientDetails);
PatientRouter.route("/updateDiagnosis").post(protect, updateDiagnosisDetails);
PatientRouter.route("/uploadPrescription").post(
  protect,
  upload.single("prescription"),
  uploadPrescription as RequestHandler
);

export default PatientRouter;
