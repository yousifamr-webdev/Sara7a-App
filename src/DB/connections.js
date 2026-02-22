import mongoose from "mongoose";
import { DB_URI } from "../../config/config.service.js";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully.");
    });

    await mongoose.connect(DB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    console.log("Error Connecting Database", error);
  }
};

export default connectDB;
