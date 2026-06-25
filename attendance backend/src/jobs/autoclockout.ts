import { findAttendanceByQuery } from "../modules/attendance/attendance.repository.js";

const calculateWorkingHours = (punches: any[]) => {
  let totalMs = 0;
  for (let i = 0; i < punches.length - 1; i += 2) {
    const punchIn = punches[i];
    const punchOut = punches[i + 1];
    if (punchIn.type === "in" && punchOut && punchOut.type === "out") {
      totalMs += new Date(punchOut.time).getTime() - new Date(punchIn.time).getTime();
    }
  }
  return Number((totalMs / (1000 * 60 * 60)).toFixed(2));
};

export const autoClockOutJob = async () => {
  console.log("[CRON] Running daily auto-clock-out check...");
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Find all records older than today where punches list exists
    const incompleteRecords = await findAttendanceByQuery({
      date: { $lt: todayStart },
      "punches.0": { $exists: true },
    });

    let updatedCount = 0;

    for (const record of incompleteRecords) {
      if (record.punches.length === 0) continue;

      const lastPunch = record.punches[record.punches.length - 1];
      if (lastPunch.type === "in") {
        // Calculate auto-punch-out time: 8 hours after the last punch-in
        const punchInTime = new Date(lastPunch.time);
        const autoOutTime = new Date(punchInTime.getTime() + 8 * 60 * 60 * 1000);

        const location = lastPunch.location
          ? {
              latitude: lastPunch.location.latitude,
              longitude: lastPunch.location.longitude,
            }
          : undefined;

        // Append system out punch
        record.punches.push({
          type: "out",
          time: autoOutTime,
          selfieUrl: "SYSTEM_AUTO_OUT",
          location,
        });

        // Recalculate working hours
        const workingHours = calculateWorkingHours(record.punches);
        record.workingHours = workingHours;
        record.completionStatus = "incomplete"; // Mark as incomplete since they forgot to punch out
        
        if (!record.validation) {
          record.validation = {} as any;
        }
        record.validation.remarks = "System Auto Clock-Out: Forgot to clock out";
        record.validation.status = "pending";

        await record.save();
        updatedCount++;
      }
    }

    console.log(`[CRON] Auto-clocked out ${updatedCount} employees who forgot to clock out yesterday.`);
  } catch (error) {
    console.error("[CRON] Error running auto-clock-out:", error);
  }
};
