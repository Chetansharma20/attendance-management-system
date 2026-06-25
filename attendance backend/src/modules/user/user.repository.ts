import User, { IUser } from "./users.js";

export const findUserByEmail = async (email: string): Promise<IUser | null> => {
  return await User.findOne({ email });
};

export const createUser = async (userData: any): Promise<IUser> => {
  return await User.create(userData);
};

export const findUsersExceptAdmin = async (query: any, skip: number, limit: number): Promise<IUser[]> => {
  return await User.find(query)
    .select("-password")
    .populate("shiftId")
    .skip(skip)
    .limit(limit);
};

export const countUsers = async (query: any): Promise<number> => {
  return await User.countDocuments(query);
};

export const findTeamEmployees = async (managerId: string): Promise<IUser[]> => {
  return await User.find({ managerId, role: "employee" }).select("-password");
};

export const findUserById = async (id: string): Promise<IUser | null> => {
  return await User.findById(id);
};

export const findUserByIdWithShift = async (id: string): Promise<IUser | null> => {
  return await User.findById(id).populate("shiftId");
};

export const findAdmins = async (): Promise<IUser[]> => {
  return await User.find({ role: "admin" }).select("_id");
};

export const findTeamEmployeeIds = async (managerId: string): Promise<IUser[]> => {
  return await User.find({ managerId }).select("_id");
};

export const findAllUsersForReport = async (): Promise<IUser[]> => {
  return await User.find({}).select("name email role managerId");
};

export const findTeamForReport = async (managerId: string): Promise<IUser[]> => {
  return await User.find({ managerId }).select("name email role managerId");
};

export const findUserByIdForReport = async (id: string): Promise<IUser | null> => {
  return await User.findById(id).select("name email role managerId");
};

export const findNonAdminUsers = async (): Promise<IUser[]> => {
  return await User.find({ role: { $ne: "admin" } }).select("_id name email role");
};

export const findTeamForTodayStats = async (managerId: string): Promise<IUser[]> => {
  return await User.find({ managerId }).select("_id name email role");
};

export const findUserByIdForTodayStats = async (id: string): Promise<IUser | null> => {
  return await User.findById(id).select("_id name email role");
};

export const findUsersInDepartmentForReport = async (departmentId: string): Promise<IUser[]> => {
  return await User.find({ departmentId, role: { $ne: "admin" } }).select("name email role departmentId");
};

export const findUserWithFullDetails = async (id: string): Promise<IUser | null> => {
  return await User.findById(id)
    .select("-password")
    .populate("shiftId", "name startTime endTime gracePeriod")
    .populate("departmentId", "name description")
    .populate("managerId", "name email");
};

