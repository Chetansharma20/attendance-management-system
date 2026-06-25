export interface ILeave {
  _id: string;
  employeeId: string | any;
  leaveType: "sick" | "casual" | "earned" | "unpaid";
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approvedBy: string | any | null;
  approvedAt: string | null;
  rejectionReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILeaveBalance {
  _id: string;
  employeeId: string;
  year: number;
  sick: number;
  casual: number;
  earned: number;
  sickTotal: number;
  casualTotal: number;
  earnedTotal: number;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}
