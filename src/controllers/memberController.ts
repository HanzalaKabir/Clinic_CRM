import { Request, Response } from "express";
import {
  addMember,
  getMemberById,
  updateMember,
  deleteMember,
  getAllMembers,
} from "../services/memberService.js";
import { MemberInput } from "../types/memberTypes.js";

// Assume `protect` middleware has populated `req.user`
export const addMemberController = async (
  req: Request<{}, {}, MemberInput>,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Extract clinic_id and check if it exists
    const clinicId = req.user.clinic_id;
    if (!clinicId) {
      return res.status(400).json({ message: "clinic_id is required" });
    }

    // Pass both member data and clinicId to addMember
    const member = await addMember(req.body, clinicId);
    res.status(201).json(member);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Controller for getting a member by ID
export const getMemberController = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const { id } = req.params;
  try {
    const member = await getMemberById(id);
    res.status(200).json(member);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Controller for updating a member
export const updateMemberController = async (
  req: Request<{ id: string }, {}, MemberInput>,
  res: Response
) => {
  const { id } = req.params;
  try {
    const updatedMember = await updateMember(id, req.body);
    res.status(200).json(updatedMember);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
// Controller for deleting a member
export const deleteMemberController = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const { id } = req.params;
  try {
    const deletedMember = await deleteMember(id);
    res.status(200).json(deletedMember);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
export const getAllMembersController = async (req: Request, res: Response) => {
  try {
    const members = await getAllMembers(req.user?.clinic_id);
    res.status(200).json(members);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
