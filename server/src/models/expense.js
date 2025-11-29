import mongoose from "mongoose";

const approvalRecordSchema = new mongoose.Schema({
  approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  step: { type: Number, required: true },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
  comment: { type: String, default: "" },
  decidedAt: { type: Date, default: null },
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amountOriginal: { type: Number, required: true },
  currencyOriginal: { type: String, required: true },
  amountCompany: { type: Number, required: true },
  currencyCompany: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, default: "" },
  date: { type: Date, required: true },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
  currentStep: { type: Number, default: 0 },
  approvals: { type: [approvalRecordSchema], default: [] },
}, { timestamps: true });

export const Expense = mongoose.model("Expense", expenseSchema);
