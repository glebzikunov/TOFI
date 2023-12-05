import mongoose from "mongoose"

const sharedAccountSchema = new mongoose.Schema({
  id: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: String,
  bio: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  transactions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
  ],
  bankAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Iban",
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Iban",
    },
  ],
})

const SharedAccount =
  mongoose.models.SharedAccount ||
  mongoose.model("SharedAccount", sharedAccountSchema)

export default SharedAccount
