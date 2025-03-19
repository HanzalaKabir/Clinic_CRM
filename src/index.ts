import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import memberRoutes from "./routes/memberRoutes.js";
import connectDB from "./config/connectDB.js";
import authRoutes from "./routes/authRoutes.js";
import router from "./routes/index.js";
import appointmentRoutes from './routes/appointmentRouter.js';
import dashboardRoutes from './routes/DashboardRoutes.js';

const app = express();
dotenv.config();
app.use(cors());

connectDB();

app.use(express.json());
app.use("/api", authRoutes);
app.use("/api/members", memberRoutes);
app.use('/api', appointmentRoutes); 
app.use("/api", dashboardRoutes);
app.get("/", (req: Request, res: Response) => {
  res.send("This is crm-clinic");
});


app.use("/", router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
