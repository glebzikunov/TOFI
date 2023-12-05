import mongoose from "mongoose"

const ibanSchema = new mongoose.Schema({
  number: { type: String, required: true },
  balance: { type: Number, default: 0 },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
})

const Iban = mongoose.models.Iban || mongoose.model("Iban", ibanSchema)

export default Iban
