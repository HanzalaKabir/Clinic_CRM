import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export const protect = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ message: "Not authorized, token must be Bearer type" });
    return;
  }
  const token = authorizationHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Not authorized, token missing" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
      id: string;
      clinic_id?: string;
      isProfileCompleted?: boolean;
    };
    req.user = {
      id: decoded.id,
      clinic_id: decoded.clinic_id || "",
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error);

    res.status(401).json({ message: "Not authorized, token failed" });
    return;
  }
};
