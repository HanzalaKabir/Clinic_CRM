import { Router } from "express";
import { get12MonthData } from "../controllers/DashboardController/get12MonthData.js"; // Import the controller
import { getRecentPatients } from "../controllers/DashboardController/getRecentPatients.js"; // Import the controller
import { getStats } from "../controllers/DashboardController/getStats.js"; // Import the controller
import { protect } from "../middleware/authMiddleware.js";

const DashboardRouter = Router();

// Dashboard routes
DashboardRouter.route("/dashboard/stats").get(protect, getStats); // Stats route
DashboardRouter.route("/dashboard/recent-patients").get(protect, getRecentPatients); // Recent patients route
DashboardRouter.route("/dashboard/12-month-data").get(protect, get12MonthData); // 12-Month data route

export default DashboardRouter;
