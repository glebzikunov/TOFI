"use server"

import { revalidatePath } from "next/cache"
import Transaction from "../models/transaction.model"
import User from "../models/user.model"
import { connectToDb } from "../mongoose"
import Iban from "../models/iban.model"
import { fetchUserById } from "./user.actions"
import { fetchBankAccount } from "./iban.actions"
import SharedAccount from "../models/sharedAccount.model"
import { fetchCreditById } from "./creditAccount.actions"
import CreditAccount from "../models/creditAccount.model"
import { calcDiffPayment } from "../utils"

interface Params {
  receiverAccount: string
  transactionAmount: number
  description: string
  author: string
  sharedAccountId: string | null
  path: string
}

export async function makeTransaction({
  receiverAccount,
  transactionAmount,
  description,
  author,
  sharedAccountId,
  path,
}: Params) {
  try {
    connectToDb()

    const sharedAccountIdObject = await SharedAccount.findOne({
      id: sharedAccountId,
    })

    const user = await fetchUserById(author)
    const receiver = await fetchBankAccount(receiverAccount)
    const receiverIsSharedAccount = await SharedAccount.findOne({
      number: receiverAccount,
    })

    if (!receiver && !receiverIsSharedAccount) {
      throw new Error(`This ${receiverAccount} account doesn't exists!`)
    } else if (
      sharedAccountIdObject &&
      sharedAccountIdObject.balance < transactionAmount
    ) {
      throw new Error(`You don't have enough money on this shared account!`)
    } else if (user.bankAccount.balance < transactionAmount) {
      throw new Error(`You don't have enough money!`)
    }

    if (sharedAccountIdObject) {
      const senderTransaction = await Transaction.create({
        senderAccount: sharedAccountIdObject.number,
        receiverAccount,
        transactionAmount,
        description,
        author,
        sharedAccount: sharedAccountIdObject,
        type: "expense",
      })

      await User.findByIdAndUpdate(author, {
        $push: { transactions: senderTransaction._id },
      })

      const senderSharedAccount = await SharedAccount.findOne({
        number: sharedAccountIdObject.number,
      })
      const newSenderBalance = parseFloat(
        (senderSharedAccount.balance - transactionAmount).toFixed(2)
      )

      await SharedAccount.findByIdAndUpdate(sharedAccountIdObject._id, {
        $push: { transactions: senderTransaction._id },
        $set: { balance: newSenderBalance },
      })

      const receiverTransaction = await Transaction.create({
        senderAccount: sharedAccountIdObject.number,
        receiverAccount,
        transactionAmount,
        description,
        author,
        sharedAccount: sharedAccountIdObject,
        type: "income",
      })

      if (receiverIsSharedAccount) {
        const receiverSharedAccount = await SharedAccount.findOne({
          number: receiverAccount,
        })
        const newReceiverBalance = parseFloat(
          (receiverSharedAccount.balance + transactionAmount).toFixed(2)
        )

        await SharedAccount.findOneAndUpdate(
          { number: receiverAccount },
          {
            $push: { transactions: receiverTransaction._id },
            $set: { balance: newReceiverBalance },
          }
        )
      } else {
        const receiverIban = await Iban.findOne({
          number: receiverAccount,
        })
        const newReceiverIbanBalance = parseFloat(
          (receiverIban.balance + transactionAmount).toFixed(2)
        )

        await User.findOneAndUpdate(
          { bankAccount: receiver._id },
          { $push: { transactions: receiverTransaction._id } }
        )

        await Iban.findOneAndUpdate(
          { number: receiverAccount },
          {
            $set: { balance: newReceiverIbanBalance },
          }
        )
      }
    } else {
      const senderTransaction = await Transaction.create({
        senderAccount: user.bankAccount.number,
        receiverAccount,
        transactionAmount,
        description,
        author,
        sharedAccount: sharedAccountIdObject,
        type: "expense",
      })

      await User.findByIdAndUpdate(author, {
        $push: { transactions: senderTransaction._id },
      })

      const senderIban = await Iban.findOne({ number: user.bankAccount.number })
      const newSenderIbanBalance = parseFloat(
        (senderIban.balance - transactionAmount).toFixed(2)
      )

      await Iban.findOneAndUpdate(
        { number: user.bankAccount.number },
        {
          $set: { balance: newSenderIbanBalance },
        }
      )

      const receiverTransaction = await Transaction.create({
        senderAccount: user.bankAccount.number,
        receiverAccount,
        transactionAmount,
        description,
        author,
        sharedAccount: sharedAccountIdObject,
        type: "income",
      })

      if (receiverIsSharedAccount) {
        await SharedAccount.findOneAndUpdate(
          { number: receiverAccount },
          {
            $push: { transactions: receiverTransaction._id },
            $inc: { balance: transactionAmount },
          }
        )
      } else {
        await User.findOneAndUpdate(
          { bankAccount: receiver._id },
          { $push: { transactions: receiverTransaction._id } }
        )

        const receiverIban = await Iban.findOne({
          number: receiverAccount,
        })
        const newReceiverIbanBalance = parseFloat(
          (receiverIban.balance + transactionAmount).toFixed(2)
        )

        await Iban.findOneAndUpdate(
          { number: receiverAccount },
          {
            $set: { balance: newReceiverIbanBalance },
          }
        )
      }
    }

    revalidatePath(path)
  } catch (error: any) {
    return {
      error: error.message,
    }
  }
}

export async function makeCreditTransaction(
  creditId: string,
  creditAccount: string,
  creditType: string,
  requestedAmmount: number,
  remainingAmount: number,
  period: number,
  interestRate: number,
  monthPayment: number,
  description: string,
  author: string,
  path: string
) {
  try {
    connectToDb()

    const user = await fetchUserById(author)

    const credit = await fetchCreditById(creditId)

    if (user.bankAccount.balance < monthPayment) {
      throw new Error(`You don't have enough money!`)
    }

    if (creditType === "annuity") {
      if (
        parseFloat((credit.remainingAmount - monthPayment).toFixed(2)) ===
        parseFloat((0.0).toFixed(2))
      ) {
        await CreditAccount.findOneAndUpdate(
          { number: creditAccount },
          {
            $set: { isClosed: true },
          }
        )
      }

      const senderTransaction = await Transaction.create({
        senderAccount: user.bankAccount.number,
        receiverAccount: creditAccount,
        transactionAmount: monthPayment,
        description,
        author,
        sharedAccount: null,
        type: "expense",
      })

      await User.findByIdAndUpdate(author, {
        $push: { transactions: senderTransaction._id },
      })

      const newUserBalance = parseFloat(
        (user.bankAccount.balance - monthPayment).toFixed(2)
      )

      await Iban.findOneAndUpdate(
        { number: user.bankAccount.number },
        {
          $set: { balance: newUserBalance },
        }
      )

      const newCreditBalance = parseFloat(
        (credit.remainingAmount - monthPayment).toFixed(2)
      )

      await CreditAccount.findOneAndUpdate(
        { number: creditAccount },
        {
          $set: { remainingAmount: newCreditBalance },
        }
      )
    } else {
      const paymentAmount = calcDiffPayment(
        requestedAmmount,
        remainingAmount,
        period,
        interestRate
      )

      console.log(paymentAmount)

      if (user.bankAccount.balance < paymentAmount) {
        throw new Error(`You don't have enough money!`)
      }

      const paymentsSumQuery = Transaction.find({
        receiverAccount: creditAccount,
        type: "expense",
        author: author,
      })

      const paymentsSum = await paymentsSumQuery.exec()
      const totalPaymentsSum = paymentsSum.reduce(
        (total, expense) => total + expense.transactionAmount,
        0
      )

      if (
        parseFloat(
          (credit.totalAmount - (paymentAmount + totalPaymentsSum)).toFixed(2)
        ) === parseFloat((0.0).toFixed(2))
      ) {
        await CreditAccount.findOneAndUpdate(
          { number: creditAccount },
          {
            $set: { isClosed: true, remainingAmount: 0 },
          }
        )
      }

      const senderTransaction = await Transaction.create({
        senderAccount: user.bankAccount.number,
        receiverAccount: creditAccount,
        transactionAmount: paymentAmount,
        description,
        author,
        sharedAccount: null,
        type: "expense",
      })

      await User.findByIdAndUpdate(author, {
        $push: { transactions: senderTransaction._id },
      })

      const newUserBalance = parseFloat(
        (user.bankAccount.balance - paymentAmount).toFixed(2)
      )

      await Iban.findOneAndUpdate(
        { number: user.bankAccount.number },
        {
          $set: { balance: newUserBalance },
        }
      )

      const newCreditBalance = parseFloat(
        (credit.remainingAmount - paymentAmount).toFixed(2)
      )

      await CreditAccount.findOneAndUpdate(
        { number: creditAccount },
        {
          $set: {
            remainingAmount: newCreditBalance,
          },
        }
      )
    }

    revalidatePath(path)
  } catch (error: any) {
    return {
      error: error.message,
    }
  }
}

export async function fetchTransactions(accountId: string) {
  try {
    connectToDb()

    const user = await User.findOne({ id: accountId }).populate({
      path: "bankAccount",
      model: Iban,
    })
    const transactionsQuery = Transaction.find({
      $or: [
        { senderAccount: user.bankAccount.number, type: "expense" },
        { receiverAccount: user.bankAccount.number, type: "income" },
      ],
    })
      .sort({ timestamp: "desc" })
      .populate({ path: "author", model: User })
      .populate({ path: "sharedAccount", model: SharedAccount })

    const transactions = await transactionsQuery.exec()

    return transactions
  } catch (error: any) {
    throw new Error(`Failed to fetch transactions: ${error.message}`)
  }
}

export async function calculateExpenses(iban: string) {
  try {
    connectToDb()

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const expensesQuery = Transaction.find({
      senderAccount: iban,
      type: "expense",
      timestamp: { $gte: firstDayOfMonth },
    })

    const expenses = await expensesQuery.exec()
    const totalExpenses = expenses.reduce(
      (total, expense) => total + expense.transactionAmount,
      0
    )

    return parseFloat(totalExpenses.toFixed(2))
  } catch (error: any) {
    throw new Error(`Failed to calc user expenses: ${error.message}`)
  }
}

export async function calculateIncomes(iban: string) {
  try {
    connectToDb()

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const incomesQuery = Transaction.find({
      receiverAccount: iban,
      type: "income",
      timestamp: { $gte: firstDayOfMonth },
    })

    const incomes = await incomesQuery.exec()
    const totalIncomes = incomes.reduce(
      (total, income) => total + income.transactionAmount,
      0
    )

    return parseFloat(totalIncomes.toFixed(2))
  } catch (error: any) {
    throw new Error(`Failed to calc user incomes: ${error.message}`)
  }
}

export async function fetchTransactionById(id: string) {
  connectToDb()

  try {
    const transaction = await Transaction.findById(id)
      .populate({
        path: "author",
        model: "User",
        select: "_id id name image",
      })
      .populate({ path: "sharedAccount", model: SharedAccount })
      .exec()

    return transaction
  } catch (error: any) {
    throw new Error(`Failed to find transaction: ${error.message}`)
  }
}

export async function getTransactionActivity(iban: string) {
  try {
    connectToDb()
    const receivedTransactions = await Transaction.find({
      receiverAccount: iban,
      type: "income",
    })
      .sort({ timestamp: "desc" })
      .populate({ path: "author", model: User, select: "name image _id" })

    return receivedTransactions
  } catch (error: any) {
    throw new Error(`Failed to find new transactions: ${error.message}`)
  }
}
