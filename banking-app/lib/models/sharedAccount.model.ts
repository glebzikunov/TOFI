import mongoose from "mongoose"

const sharedAccountSchema = new mongoose.Schema({
  id: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: String,
  bio: String,
  number: { type: String, required: true },
  balance: { type: Number, default: 0 },
  transactions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
  ],
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: { type: Date, default: Date.now },
})

const SharedAccount =
  mongoose.models.SharedAccount ||
  mongoose.model("SharedAccount", sharedAccountSchema)

export default SharedAccount
