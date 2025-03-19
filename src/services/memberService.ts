import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/User.js";
import { sendMail } from "../services/emailService.js";
import { MemberInput } from "../types/memberTypes.js";
const SALT_ROUNDS = 10;

const generateRandomPassword = (): string => {
  return crypto.randomBytes(8).toString("hex");
};

export const addMember = async (memberData: MemberInput, clinicId: string) => {
  const randomPassword = generateRandomPassword();
  const hashedPassword = await bcrypt.hash(randomPassword, SALT_ROUNDS);

  const newMemberData = {
    ...memberData,
    password: hashedPassword,
    role: "Member",
    clinic_id: clinicId,
    status: "Active",
  };
  const newMember = await User.create(newMemberData);

  const loginLink = `http://localhost:3000/login`;
  const emailMessage = `
    Hello ${newMember.name},

    You have been successfully added as a member!

    Here are your login credentials:
    Email: ${newMember.email}
    Password: ${randomPassword}

    You can log in at the following link:
    ${loginLink}

    Please change your password after logging in for the first time.

    Regards,
    Your Platform Team
  `;

  await sendMail(newMember.email, "Welcome to the Team", emailMessage);

  return newMember.toObject();
};

export const updateMember = async (
  id: string,
  memberData: Partial<MemberInput>
) => {
  const updatedMember = await User.findByIdAndUpdate(
    id,
    {
      $set: {
        ...memberData,
        role: "Member",
      },
    },
    { new: true }
  );

  if (!updatedMember) {
    throw new Error("Member not found with the specified ID");
  }

  return {
    ...updatedMember.toObject(),
    id: updatedMember._id,
  };
};

export const deleteMember = async (id: string) => {
  const deletedMember = await User.findByIdAndDelete(id);

  if (!deletedMember) {
    throw new Error("Member not found");
  }

  await sendMail(
    deletedMember.email,
    "Membership Termination",
    `Hello ${deletedMember.name},\n\nWe regret to inform you that your membership has been terminated.`
  );

  return {
    ...deletedMember.toObject(),
    id: deletedMember._id,
  };
};

export const getAllMembers = async (clinicId?: string) => {
  const query = clinicId ? { clinic_id: clinicId } : {};
  const members = await User.find(query);

  return members.map((member) => ({
    ...member.toObject(),
    id: member._id,
  }));
};

export const getMemberById = async (id: string) => {
  const member = await User.findById(id);

  if (!member) {
    throw new Error("Member not found");
  }

  member.role = "Member";

  member.role = "Member";
  return {
    ...member.toObject(),
    id: member._id,
    role: "Member",
  };
};
