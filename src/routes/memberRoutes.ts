import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  addMember,
  deleteMember,
  getAllMembers,
  getMemberById,
  updateMember,
} from "../services/memberService.js";

const router = Router();

router.post("/", protect, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const memberData = req.body;
    const newMember = await addMember(memberData, req.user.clinic_id || "");
    res.status(201).json(newMember);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "An unexpected error occurred" });
      res.status(400).json({ message: "An unexpected error occurred" });
    }
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const updatedMember = await updateMember(req.params.id, req.body);
    res.json(updatedMember);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(404).json({ message: "An unexpected error occurred" });
    }
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const deletedMember = await deleteMember(req.params.id);
    res.json(deletedMember);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(404).json({ message: "An unexpected error occurred" });
    }
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const members = await getAllMembers();
    res.json(members);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const member = await getMemberById(req.params.id);
    res.json(member);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(404).json({ message: "An unexpected error occurred" });
    }
  }
});

export default router;
