"use server"

import { revalidatePath } from "next/cache"
import User from "../models/user.model"
import { connectToDb } from "../mongoose"
import CreditAccount from "../models/creditAccount.model"
import Iban from "../models/iban.model"
import Transaction from "../models/transaction.model"
import { calcDiffPayment } from "../utils"

interface Params {
  paymentType: string
  creditPeriod: string
  requestedAmount: number
  description: string
  createdBy: string
  path: string
}

export async function takeCredit({
  paymentType,
  creditPeriod,
  requestedAmount,
  description,
  createdBy,
  path,
}: Params) {
  try {
    connectToDb()

    let period: number
    if (creditPeriod === "three") {
      period = 3
    } else if (creditPeriod === "six") {
      period = 6
    } else {
      period = 12
    }

    const user = await User.findById(createdBy).populate({
      path: "bankAccount",
      model: Iban,
    })

    const userBalance = user.bankAccount.balance
    const newUserBalance = parseFloat(
      (userBalance + requestedAmount).toFixed(2)
    )

    const createdCredit = await CreditAccount.create({
      requestedAmount: requestedAmount,
      paymentType: paymentType,
      creditPeriod: period,
      description: description,
      createdBy: createdBy,
    })

    await User.findByIdAndUpdate(createdBy, {
      $push: { creditAccounts: createdCredit._id },
    })

    await Iban.findOneAndUpdate(
      { number: user.bankAccount.number },
      {
        $set: { balance: newUserBalance },
      }
    )

    if (paymentType === "annuity") {
      const m = parseFloat((createdCredit.interestRate / 12 / 100).toFixed(4))
      const annuityCoef = parseFloat(
        ((m * Math.pow(1 + m, period)) / (Math.pow(1 + m, period) - 1)).toFixed(
          4
        )
      )
      const monthPayment = parseFloat(
        (requestedAmount * annuityCoef).toFixed(2)
      )
      const totalAmount = parseFloat((monthPayment * period).toFixed(2))

      await CreditAccount.findByIdAndUpdate(createdCredit._id, {
        $set: {
          number: createdCredit._id.toString(),
          totalAmount: totalAmount,
          remainingAmount: totalAmount,
          monthPayment: monthPayment,
        },
      })

      await Transaction.create({
        senderAccount: createdCredit._id.toString(),
        receiverAccount: user.bankAccount.number,
        transactionAmount: requestedAmount,
        description: "Annuity credit has been taken",
        author: createdBy,
        sharedAccount: null,
        type: "income",
      })
    } else {
      let totalAmount = 0
      let remainingAmount = requestedAmount

      for (let i = 0; i < period; i++) {
        const diffMonthPayment = calcDiffPayment(
          requestedAmount,
          remainingAmount,
          period,
          createdCredit.interestRate
        )

        remainingAmount = parseFloat(
          (remainingAmount - diffMonthPayment).toFixed(2)
        )

        totalAmount = parseFloat((totalAmount + diffMonthPayment).toFixed(2))
      }

      await CreditAccount.findByIdAndUpdate(createdCredit._id, {
        $set: {
          number: createdCredit._id.toString(),
          totalAmount: totalAmount,
          remainingAmount: requestedAmount,
        },
      })

      await Transaction.create({
        senderAccount: createdCredit._id.toString(),
        receiverAccount: user.bankAccount.number,
        transactionAmount: requestedAmount,
        description: "Differential credit has been taken",
        author: createdBy,
        sharedAccount: null,
        type: "income",
      })
    }

    revalidatePath(path)
  } catch (error: any) {
    return {
      error: `Error taking credit: ${error.message}`,
    }
  }
}

export async function fetchUserCredits(userId: string) {
  try {
    connectToDb()

    const userCredits = await CreditAccount.find({
      createdBy: userId,
    })
      .sort({ createdAt: "desc" })
      .populate("createdBy")

    return userCredits
  } catch (error: any) {
    return {
      error: `Error fetching user credits: ${error.message}`,
    }
  }
}

export async function fetchCreditById(id: string) {
  try {
    connectToDb()

    const credit = await CreditAccount.findById(id).populate({
      path: "createdBy",
      model: User,
      select: "_id id name image ",
    })

    return credit
  } catch (error: any) {
    return {
      error: `Error fetching credit info: ${error.message}`,
    }
  }
}
