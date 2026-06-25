export interface IPunch {
  type: "in" | "out";
  time: string;
  selfieUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface IBreak {
  type: "tea" | "lunch" | "dinner";
  startTime: string;
  endTime?: string;
}

export interface IAttendance {
  _id: string;
  employeeId: string | any;
  date: string;
  punches: IPunch[];
  breaks: IBreak[];
  workingHours: number;
  completionStatus: "completed" | "incomplete";
  validation: {
    status: "pending" | "valid" | "invalid";
    remarks: string;
    validatedBy?: string;
    validatedAt?: string;
  };
  arrivalStatus: "on-time" | "late";
  departureStatus: "regular" | "early-departure";
  createdAt: string;
  updatedAt: string;
  overtimeRequest?: any;
}
