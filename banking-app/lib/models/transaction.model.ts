import mongoose from "mongoose"

const transactionSchema = new mongoose.Schema({
  senderAccount: { type: String, required: true },
  receiverAccount: { type: String, required: true },
  transactionAmount: { type: Number, required: true },
  description: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sharedAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SharedAccount",
  },
  timestamp: { type: Date, default: Date.now },
  type: { type: String, required: true },
})

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema)

export default Transaction
