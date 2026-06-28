import mongoose from "mongoose";

export interface IPunch {
  type: "in" | "out";
  time: Date;
  selfieUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface IBreak {
  type: "tea" | "lunch" | "dinner";
  startTime: Date;
  endTime?: Date;
}

export interface IAttendanceBase {
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  punches: IPunch[];
  breaks: IBreak[];
  workingHours: number;
  completionStatus: "completed" | "half-day" | "incomplete";
  validation: {
    status: "pending" | "valid" | "invalid";
    remarks: string;
    validatedBy?: mongoose.Types.ObjectId;
    validatedAt?: Date;
  };
  arrivalStatus: "on-time" | "late";
  departureStatus: "regular" | "early-departure";
  createdAt: Date;
  updatedAt: Date;
}
