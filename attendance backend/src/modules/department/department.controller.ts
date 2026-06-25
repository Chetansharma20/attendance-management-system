import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  createDepartment as createDepartmentInRepo,
  findAllDepartments,
  findDepartmentById,
  findDepartmentByName,
  updateDepartmentById,
  deleteDepartmentById,
} from "./department.repository.js";

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, managerId } = req.body;

  if (!name) {
    throw new ApiError(400, "Department name is required");
  }

  const existing = await findDepartmentByName(name);
  if (existing) {
    throw new ApiError(400, "A department with this name already exists");
  }

  const department = await createDepartmentInRepo({
    name,
    description: description || "",
    managerId: managerId || null,
  });

  res.status(201).json(new ApiResponse(201, department, "Department created successfully"));
});

export const getAllDepartments = asyncHandler(async (_req: Request, res: Response) => {
  const departments = await findAllDepartments();
  res.status(200).json(new ApiResponse(200, departments, "Departments fetched successfully"));
});

export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, managerId } = req.body;

  const department = await findDepartmentById(id);
  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  // Check uniqueness if name is being changed
  if (name && name !== department.name) {
    const nameConflict = await findDepartmentByName(name);
    if (nameConflict) {
      throw new ApiError(400, "A department with this name already exists");
    }
  }

  const updated = await updateDepartmentById(id, {
    ...(name && { name }),
    ...(description !== undefined && { description }),
    ...(managerId !== undefined && { managerId: managerId || null }),
  });

  res.status(200).json(new ApiResponse(200, updated, "Department updated successfully"));
});

export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const department = await deleteDepartmentById(id);
  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  res.status(200).json(new ApiResponse(200, null, "Department deleted successfully"));
});
