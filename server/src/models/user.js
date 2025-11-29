import mongoose from "mongoose"
import { ALL_ROLES } from "../utils/roles.js"

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ALL_ROLES, default: "EMPLOYEE" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resetOtpHash: { type: String, default: null },
    resetOtpExpires: { type: Date, default: null },
  },
  { timestamps: true },
)

export const User = mongoose.model("User", userSchema)
