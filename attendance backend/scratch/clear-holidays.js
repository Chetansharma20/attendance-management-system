import dotenv from "dotenv";
import mongoose from "mongoose";
import Holiday from "../src/modules/holiday/holiday.js";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/attendance";

async function clearHolidays() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB!");
    
    const result = await Holiday.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} holidays from the database.`);
    
  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    await mongoose.disconnect();
  }
}

clearHolidays();
