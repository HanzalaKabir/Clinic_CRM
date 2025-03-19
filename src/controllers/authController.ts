import { Request, Response } from "express";
import {
  forgotUserPassword,
  generateToken,
  loginUser,
  registerUser,
  resetUserPassword,
} from "../services/authService.js";
import { AuthInput } from "../types/authTypes.js";

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
