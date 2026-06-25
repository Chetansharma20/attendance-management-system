export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "employee";
  managerId: string | null;
  shiftId: string | null;
  createdAt: string;
  updatedAt: string;
}
