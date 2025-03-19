import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
//Ensure correct import for UUID
import User, { IUser } from "../models/User.js"; // Ensure correct import path
import { sendMail } from "../services/emailService.js"; // Ensure correct import for sending emails
import Clinic from "../models/clinicModel.js";

const SALT_ROUNDS = 10;

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  phoneNumber: string
) => {
  const userExists = await User.findOne({ email });

  if (userExists) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const clinic_id = new mongoose.Types.ObjectId();

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phoneNumber,
    clinic_id,
    role: "Admin", // Default role
    isProfileCompleted: false,
  });

  console.log(`User created successfully: ${user}`);

  // Send signup confirmation email
  try {
    await sendMail(
      email,
      "Welcome to Our Platform",
      "You have successfully signed up!"
    );
  } catch (error) {
    console.error(
      "Error sending email:",
      error instanceof Error ? error.message : error
    );
  }

  const token = jwt.sign(
    {
      userId: user._id,
      clinic_id: user.clinic_id,
      isProfileCompleted: user.isProfileCompleted,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return { token, user };
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid credentials");
  }
  const clinic = await Clinic.findById(user.clinic_id);

  const token = jwt.sign(
    {
      userId: user._id,
      clinic_id: user.clinic_id,
      isProfileCompleted: user.isProfileCompleted,
      slotBreak: clinic?.Availibility.slotBreak,
      timing: {
        openingTime: clinic?.Availibility.timing.openingTime,
        closingTime: clinic?.Availibility.timing.closingTime,
      },
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
  //console.log(jwt.decode(token));
  return { token, user };
};

export const generateToken = async (token: string) => {
  try {
    if (!token) {
      return "No token provided";
    }

    let decodedToken: JwtPayload;
    try {
      decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        try {
          decodedToken = jwt.decode(token) as JwtPayload;
        } catch (decodeError) {
          return "Invalid token";
        }
      } else {
        return "Invalid token";
      }
    }

    const user = await User.findById(decodedToken.userId);

    if (!user) {
      return "User not found";
    }

    const clinic = await Clinic.findById(user.clinic_id);

    if (!clinic) {
      return "Clinic not found";
    }

    const newToken = jwt.sign(
      {
        userId: user.id,
        clinic_id: user.clinic_id,
        isProfileCompleted: user.isProfileCompleted,
        slotBreak: clinic?.Availibility.slotBreak,
        timing: {
          openingTime: clinic?.Availibility.timing.openingTime,
          closingTime: clinic?.Availibility.timing.closingTime,
        },
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    //console.log(jwt.decode(token));
    return newToken;
  } catch (error) {
    console.error("Token generation error:", error);
    return "Failed to generate new token";
  }
};

export const resetUserPassword = async (email: string, newPassword: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  // Hash the new password
  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  // Send confirmation email after password reset
  await sendMail(
    email,
    "Password Reset Successful",
    "Your password has been successfully reset."
  );

  return { message: "Password has been successfully reset." };
};

export const forgotUserPassword = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  // Construct reset password link
  const resetLink = `http://localhost:3000/reset-password?email=${user.email}`;
  const emailMessage = `
    Hello ${user.name},

    You requested to reset your password. Please use the link below to reset it:
    ${resetLink}

    If you didn’t request this, you can ignore this email.

    Best regards,
    Your Platform Team
  `;

  // Send the email with reset link
  await sendMail(user.email, "Password Reset Request", emailMessage);

  return { message: "Reset link sent to your email." };
};
