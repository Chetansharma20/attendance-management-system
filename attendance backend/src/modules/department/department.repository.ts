import Department, { IDepartment } from "./department.js";

export const createDepartment = async (data: Partial<IDepartment>): Promise<IDepartment> => {
  return await Department.create(data);
};

export const findAllDepartments = async (): Promise<IDepartment[]> => {
  return await Department.find()
    .populate("managerId", "name email")
    .sort({ name: 1 });
};

export const findDepartmentById = async (id: string): Promise<IDepartment | null> => {
  return await Department.findById(id).populate("managerId", "name email");
};

export const findDepartmentByName = async (name: string): Promise<IDepartment | null> => {
  return await Department.findOne({ name });
};

export const updateDepartmentById = async (
  id: string,
  data: Partial<IDepartment>
): Promise<IDepartment | null> => {
  return await Department.findByIdAndUpdate(id, data, { new: true }).populate(
    "managerId",
    "name email"
  );
};

export const deleteDepartmentById = async (id: string): Promise<IDepartment | null> => {
  return await Department.findByIdAndDelete(id);
};
