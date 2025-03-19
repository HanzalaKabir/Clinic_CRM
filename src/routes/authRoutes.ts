import express from "express";
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  getToken,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.put("/auth/password/forgotPassword", forgotPassword);
router.put("/auth/password/resetPassword", resetPassword);
router.get("/auth/getToken", getToken);

export default router;
