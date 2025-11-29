import mongoose from "mongoose"

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    country: { type: String, required: true }, // e.g. "United States"
    currencyCode: { type: String, required: true }, // e.g. "USD"
    managerApproverEnabled: { type: Boolean, default: true },
    approvalRuleId: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalRule", default: null },
  },
  { timestamps: true },
)

export const Company = mongoose.model("Company", companySchema)
