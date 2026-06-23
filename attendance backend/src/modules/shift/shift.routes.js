import express from "express";
import { createShift, getAllShifts, deleteShift } from "./shift.controller.js";
import verifyJWT, { allowedRoles } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getallshifts", verifyJWT, getAllShifts);
router.post("/createShift", verifyJWT, allowedRoles(["admin"]), createShift);
router.delete("/deleteShift/:id", verifyJWT, allowedRoles(["admin"]), deleteShift);

export default router;
