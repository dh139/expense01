import mongoose from "mongoose"

const sequenceItemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["ROLE", "USER"], required: true },
    value: { type: String, required: true }, // role name or userId
  },
  { _id: false },
)

const approvalRuleSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    sequence: { type: [sequenceItemSchema], default: [] }, // e.g. [{type:'ROLE', value:'MANAGER'}, {type:'ROLE', value:'FINANCE'}]
    percentThreshold: { type: Number, min: 0, max: 100, default: null }, // e.g. 60
    specificApprovers: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] }, // e.g. CFO userId(s)
    hybridOr: { type: Boolean, default: true }, // if true: (percent OK) OR (specific approved); else AND
  },
  { timestamps: true },
)

export const ApprovalRule = mongoose.model("ApprovalRule", approvalRuleSchema)
