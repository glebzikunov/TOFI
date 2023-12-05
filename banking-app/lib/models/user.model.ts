import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  id: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: String,
  bio: String,
  transactions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
  ],
  onboarded: { type: Boolean, default: false },
  bankAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Iban",
  },

  sharedAccounts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SharedAccount",
    },
  ],
  creditAccount: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreditAccount",
    },
  ],
})

const User = mongoose.models.User || mongoose.model("User", userSchema)

export default User
