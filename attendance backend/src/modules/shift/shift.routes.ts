import express from "express";
import { createShift, getAllShifts, deleteShift } from "./shift.controller.js";
import verifyJWT, { allowedRoles } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getallshifts", verifyJWT as any, getAllShifts as any);
router.post("/createShift", verifyJWT as any, allowedRoles(["admin"]) as any, createShift as any);
router.delete("/deleteShift/:id", verifyJWT as any, allowedRoles(["admin"]) as any, deleteShift as any);

export default router;
