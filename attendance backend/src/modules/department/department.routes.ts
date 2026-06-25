import express from "express";
import {
  createDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
} from "./department.controller.js";
import verifyJWT, { allowedRoles } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/all", verifyJWT as any, getAllDepartments as any);
router.post("/create", verifyJWT as any, allowedRoles(["admin"]) as any, createDepartment as any);
router.put("/update/:id", verifyJWT as any, allowedRoles(["admin"]) as any, updateDepartment as any);
router.delete("/delete/:id", verifyJWT as any, allowedRoles(["admin"]) as any, deleteDepartment as any);

export default router;
