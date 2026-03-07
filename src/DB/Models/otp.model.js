import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["confirmEmail"],
    default: "confirmEmail",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // 300 seconds = 5 minutes
  },
});

const OtpModel = mongoose.model("Otp", otpSchema);

export default OtpModel;
