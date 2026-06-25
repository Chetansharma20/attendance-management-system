import cron from "node-cron";
import { autoClockOutJob } from "../jobs/autoclockout.js";

export const initCronJobs = () => {
  // Run every day at 12:05 AM (0 5 0 * * *)
  cron.schedule("0 5 0 * * *", async () => {
    await autoClockOutJob();
  });
};
