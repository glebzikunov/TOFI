import mongoose from "mongoose"

const creditAccountSchema = new mongoose.Schema({
  number: String,
  requestedAmount: { type: Number, required: true },
  totalAmount: Number,
  remainingAmount: Number,
  paymentType: { type: String, required: true },
  monthPayment: Number,
  interestRate: { type: Number, default: 14 },
  creditPeriod: { type: Number, required: true },
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  isClosed: { type: Boolean, default: false },
})

const CreditAccount =
  mongoose.models.CreditAccount ||
  mongoose.model("CreditAccount", creditAccountSchema)

export default CreditAccount
