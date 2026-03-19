import mongoose, { Types } from "mongoose";

const tokenSchema = new mongoose.Schema({
  jti: { type: String, required: true },
  userId: { type: Types.ObjectId, ref: "User", required: true },
  expiredAt: { type: Date, required: true },
});
tokenSchema.index("expiredAt", { expireAfterSeconds: 0 });

export const TokenModel = mongoose.model("Token", tokenSchema);
