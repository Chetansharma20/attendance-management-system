import User from "../user/users.js";
import Attendance from "../attendance/attendance.js";
import Leave from "../leave/leave.js";

export const createToolExecutors = (userId: string, userRole: string) => {
  return {
    get_my_profile: async () => {
      const user = await User.findById(userId)
        .populate("managerId", "name email")
        .populate("departmentId", "name")
        .populate("shiftId", "name startTime endTime");
      if (!user) return { error: "User profile not found." };
      return {
        name: user.name,
        email: user.email,
        role: user.role,
        department: (user.departmentId as any)?.name || "Unassigned",
        shift: (user.shiftId as any) ? `${(user.shiftId as any).name} (${(user.shiftId as any).startTime} - ${(user.shiftId as any).endTime})` : "Default Shift",
        manager: (user.managerId as any)?.name || "No direct manager",
      };
    },

    get_my_attendance: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const logs = await Attendance.find({
        employeeId: userId,
        date: { $gte: startOfMonth },
      }).sort({ date: 1 });

      return logs.map(l => ({
        date: l.date.toISOString().split("T")[0],
        arrivalStatus: l.arrivalStatus,
        departureStatus: l.departureStatus,
        workingHours: l.workingHours.toFixed(2),
        punches: l.punches.map(p => ({ type: p.type, time: p.time })),
      }));
    },

    get_my_leaves: async () => {
      const leaves = await Leave.find({ employeeId: userId }).sort({ startDate: -1 });
      return leaves.map(l => ({
        leaveType: l.leaveType,
        startDate: l.startDate.toISOString().split("T")[0],
        endDate: l.endDate.toISOString().split("T")[0],
        totalDays: l.totalDays,
        status: l.status,
        reason: l.reason,
      }));
    },

    get_late_arrivals_today: async () => {
      if (userRole !== "manager" && userRole !== "admin") {
        return { error: "Unauthorized. This tool is only available for managers and admins." };
      }
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const logs = await Attendance.find({
        date: { $gte: start, $lte: end },
        arrivalStatus: "late",
      }).populate("employeeId", "name email");

      return logs.map(l => ({
        employeeName: (l.employeeId as any)?.name || "Unknown",
        employeeEmail: (l.employeeId as any)?.email || "Unknown",
        punches: l.punches.map(p => ({ type: p.type, time: p.time })),
      }));
    },

    get_pending_leave_requests: async () => {
      if (userRole !== "manager" && userRole !== "admin") {
        return { error: "Unauthorized. This tool is only available for managers and admins." };
      }
      const leaves = await Leave.find({ status: "pending" }).populate("employeeId", "name email");
      return leaves.map(l => ({
        leaveId: l._id,
        employeeName: (l.employeeId as any)?.name || "Unknown",
        employeeEmail: (l.employeeId as any)?.email || "Unknown",
        leaveType: l.leaveType,
        startDate: l.startDate.toISOString().split("T")[0],
        endDate: l.endDate.toISOString().split("T")[0],
        totalDays: l.totalDays,
        reason: l.reason,
      }));
    },

    get_employee_attendance_summary: async (args: { employeeIdentifier: string }) => {
      if (userRole !== "manager" && userRole !== "admin") {
        return { error: "Unauthorized. This tool is only available for managers and admins." };
      }
      const targetUser = await User.findOne({
        $or: [
          { name: { $regex: args.employeeIdentifier, $options: "i" } },
          { email: { $regex: args.employeeIdentifier, $options: "i" } },
        ],
      });

      if (!targetUser) {
        return { error: `Employee matching "${args.employeeIdentifier}" was not found.` };
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const logs = await Attendance.find({
        employeeId: targetUser._id,
        date: { $gte: startOfMonth },
      });

      const daysPresent = logs.length;
      const lateArrivals = logs.filter(l => l.arrivalStatus === "late").length;
      const totalHours = logs.reduce((sum, l) => sum + (l.workingHours || 0), 0);

      return {
        employeeName: targetUser.name,
        employeeEmail: targetUser.email,
        role: targetUser.role,
        summaryThisMonth: {
          daysPresent,
          lateArrivals,
          totalHoursWorked: totalHours.toFixed(1),
        },
      };
    },
  };
};
