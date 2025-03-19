import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/User.js"; // Importing User model
import { sendMail } from "../services/emailService.js"; // Importing the email service
import { MemberInput } from "../types/memberTypes.js"; // Importing MemberInput type
const SALT_ROUNDS = 10;

/**
 * Function to generate a random password.
 * @returns A randomly generated password.
 */
const generateRandomPassword = (): string => {
  return crypto.randomBytes(8).toString("hex"); // Generates a random 16-character password
};

/**
 * Function to add a new member.
 * @param memberData - The data for the new member.
 * @returns The added member.
 */
export const addMember = async (memberData: MemberInput, clinicId: string) => {
  // Generate a random password and hash it
  const randomPassword = generateRandomPassword();
  const hashedPassword = await bcrypt.hash(randomPassword, SALT_ROUNDS);

  // Create a new user with the given data
  const newMemberData = {
    ...memberData,
    password: hashedPassword,
    role: "Member",
    clinic_id: clinicId,
    status: "Active",
  };
  const newMember = await User.create(newMemberData);

  // Send welcome email to the new member
  const loginLink = `http://localhost:3000/login`; // Replace with actual login URL
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
/**
 * Function to update a member's details.
 * @param id - The ID of the member to update.
 * @param memberData - The updated member data.
 * @returns The updated member.
 */
export const updateMember = async (
  id: string,
  memberData: Partial<MemberInput>
) => {
  const updatedMember = await User.findByIdAndUpdate(
    id, // Query by MongoDB _id
    {
      $set: {
        ...memberData,
        role: "Member", // Explicitly set role to 'Member'
      },
    },
    { new: true }
  );

  if (!updatedMember) {
    throw new Error("Member not found with the specified ID");
  }

  return {
    ...updatedMember.toObject(),
    id: updatedMember._id, // Map _id to id for consistent responses
  };
};

/**
 * Function to delete a member.
 * @param id - The ID of the member to delete.
 * @returns The deleted member.
 */
export const deleteMember = async (id: string) => {
  const deletedMember = await User.findByIdAndDelete(id); // Query by MongoDB _id

  if (!deletedMember) {
    throw new Error("Member not found");
  }

  // Optionally, send a notification that the member has been removed
  await sendMail(
    deletedMember.email,
    "Membership Termination",
    `Hello ${deletedMember.name},\n\nWe regret to inform you that your membership has been terminated.`
  );

  return {
    ...deletedMember.toObject(),
    id: deletedMember._id, // Map _id to id for consistent responses
  };
};
/**
 * Function to get all members.
 * @returns An array of all members.
 */
export const getAllMembers = async (clinicId?: string) => {
  const query = clinicId ? { clinic_id: clinicId } : {};
  const members = await User.find(query);

  return members.map((member) => ({
    ...member.toObject(),
    id: member._id, // Map _id to id for consistent responses
  }));
};

/**
 * Function to get a member by ID.
 * @param id - The ID of the member to retrieve.
 * @returns The member with the specified ID.
 */
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
