import express from "express";
import verifyJWT, { allowedRoles } from "../../middleware/authMiddleware.js";
import {
  applyLeave,
  getMyLeaves,
  getMyLeaveBalance,
  getTeamLeaves,
  getAllLeaves,
  getAllLeaveBalances,
  getLeaveBalanceById,
  updateLeaveBalance,
  getLeavePolicy,
  updateLeavePolicy,
  updateLeaveStatus,
} from "./leave.controller.js";

const router = express.Router();

// ─── Policy (readable by all roles) ─────────────────────────────────────────
router.get("/policy", verifyJWT, getLeavePolicy);
router.patch("/policy", verifyJWT, allowedRoles(["admin"]), updateLeavePolicy);

// ─── Employee ────────────────────────────────────────────────────────────────
router.post("/apply", verifyJWT, allowedRoles(["employee"]), applyLeave);
router.get("/my-leaves", verifyJWT, allowedRoles(["employee"]), getMyLeaves);
router.get("/my-balance", verifyJWT, allowedRoles(["employee"]), getMyLeaveBalance);

// ─── Manager + Admin ─────────────────────────────────────────────────────────
router.get("/team-leaves", verifyJWT, allowedRoles(["admin", "manager"]), getTeamLeaves);
router.patch("/status/:leaveId", verifyJWT, allowedRoles(["admin", "manager"]), updateLeaveStatus);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.get("/all-leaves", verifyJWT, allowedRoles(["admin"]), getAllLeaves);
router.get("/all-balances", verifyJWT, allowedRoles(["admin"]), getAllLeaveBalances);
router.get("/balance/:employeeId", verifyJWT, allowedRoles(["admin"]), getLeaveBalanceById);
router.patch("/balance/:employeeId", verifyJWT, allowedRoles(["admin"]), updateLeaveBalance);

export default router;
