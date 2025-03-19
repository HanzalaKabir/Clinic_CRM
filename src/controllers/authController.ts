// import { Request, Response } from 'express';
// import {
//   forgotUserPassword,
//   loginUser,
//   registerUser,
//   resetUserPassword,
// } from '../services/authService';
// import { AuthInput, ForgotPasswordInput, ResetPasswordInput } from '../types/authTypes';
// import { sendMail } from '../services/emailService';

// // Helper function to generate random clinic ID
// const generateRandomClinicId = () => {
//   return Math.random().toString(36).substr(2, 9); // Example random ID generation
// };

// // Signup Controller
// export const signup = async (req: Request<{}, {}, AuthInput>, res: Response) => {
//   const { name, email, password, phoneNumber } = req.body;
//   const clinic_id = generateRandomClinicId(); // Generate random clinic ID

//   try {
//     const user = await registerUser(name, email, password, phoneNumber, clinic_id);

//     // Send signup confirmation email
//     await sendMail(email, 'Welcome to Our Platform', 'You have successfully signed up!');

//     res.status(201).json(user);
//   } catch (error) {
//     res.status(400).json({ message: (error as Error).message });
//   }
// };

// // Login Controller
// export const login = async (req: Request<{}, {}, { email: string; password: string }>, res: Response) => {
//   const { email, password } = req.body;
//   try {
//     const { token, user } = await loginUser(email, password);
//     res.status(200).json({ token, user });
//   } catch (error) {
//     res.status(400).json({ message: (error as Error).message });
//   }
// };

// // Forgot Password Controller
// export const forgotPassword = async (req: Request<{}, {}, ForgotPasswordInput>, res: Response) => {
//   const { username, newPassword } = req.body;
//   try {
//     const user = await forgotUserPassword(username, newPassword);
//     await sendMail(user.email, 'Password Reset', 'Your password has been successfully reset.');
//     res.status(200).json(user);
//   } catch (error) {
//     res.status(400).json({ message: (error as Error).message });
//   }
// };

// // Reset Password Controller
// export const resetPassword = async (req: Request<{}, {}, ResetPasswordInput>, res: Response) => {
//   const { email, newPassword } = req.body;
//   try {
//     const user = await resetUserPassword(email, newPassword);
//     res.status(200).json(user);
//   } catch (error) {
//     res.status(400).json({ message: (error as Error).message });
//   }
// };

// Update Password Controller (for logged-in users)
// export const updatePassword = async (req: Request<{}, {}, { newPassword: string }>, res: Response) => {
//   const { newPassword } = req.body;
//   const userId = req.user?.id; // Assuming the user ID is added in middleware

//   if (!userId) {
//     return res.status(401).json({ message: 'User not authenticated' });
//   }

//   try {
//     const user = await updateUserPassword(userId, newPassword);
//     res.status(200).json({ message: 'Password updated successfully', user });
//   } catch (error) {
//     res.status(400).json({ message: (error as Error).message });
//   }
// };

import { Request, Response } from "express";
import {
  forgotUserPassword,
  generateToken,
  loginUser,
  registerUser,
  resetUserPassword,
} from "../services/authService.js";
import { AuthInput } from "../types/authTypes.js";

// Signup Controller
export const signup = async (
  req: Request<{}, {}, AuthInput>,
  res: Response
) => {
  const { name, email, password, phoneNumber } = req.body;
  try {
    const { user, token } = await registerUser(
      name,
      email,
      password,
      phoneNumber
    );
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
// Login Controller (updated to use email instead of name)
export const login = async (
  req: Request<{}, {}, { email: string; password: string }>,
  res: Response
) => {
  const { email, password } = req.body;
  try {
    const { token, user } = await loginUser(email, password);
    res.status(200).json({ token, user });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Forgot Password Controller
export const forgotPassword = async (
  req: Request<{}, {}, { email: string }>,
  res: Response
) => {
  const { email } = req.body;
  try {
    const response = await forgotUserPassword(email);
    res.status(200).json(response); // Return success message with reset link
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Reset Password Controller
export const resetPassword = async (
  req: Request<{}, {}, { newPassword: string }, { email: string }>,
  res: Response
) => {
  const { email } = req.query;
  const { newPassword } = req.body;
  try {
    const user = await resetUserPassword(email, newPassword);
    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getToken = async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    const newToken = await generateToken(token);
    res.json({ token: newToken });
  } catch (error) {
    console.error("Route handler error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
