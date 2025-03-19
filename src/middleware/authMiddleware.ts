// Before change
// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';

// const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// export const protect = (req: Request, res: Response, next: NextFunction) => {
//   const token = req.headers.authorization?.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ message: 'Not authorized, no token' });
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { id: string };
//     req.user = { id: decoded.id }; // Attach the user ID to the request object
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Not authorized, token failed' });
//   }
// };
// After change
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

  // Log the authorization header for debugging
  //console.log("Authorization Header:", authorizationHeader);

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
    // Decode and verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
      id: string;
      clinic_id?: string;
      isProfileCompleted?: boolean;
    };

    // Log the decoded token for debugging
    //console.log("Decoded Token:", decoded);

    // Attach user ID and clinic ID to the request object
    req.user = {
      id: decoded.id,
      clinic_id: decoded.clinic_id || "",
    };

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    // Log the error message for debugging
    console.error("Token verification error:", error);

    res.status(401).json({ message: "Not authorized, token failed" });
    return; // Ensure to exit the function after sending a response
  }
};
