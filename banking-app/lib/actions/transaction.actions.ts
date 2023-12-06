"use server"

import { revalidatePath } from "next/cache"
import Transaction from "../models/transaction.model"
import User from "../models/user.model"
import { connectToDb } from "../mongoose"
import Iban from "../models/iban.model"
import { fetchUserById } from "./user.actions"
import { fetchBankAccount } from "./iban.actions"
import SharedAccount from "../models/sharedAccount.model"

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
    console.log(sharedAccountIdObject)

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

      await SharedAccount.findByIdAndUpdate(sharedAccountIdObject._id, {
        $push: { transactions: senderTransaction._id },
        $inc: { balance: -transactionAmount },
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

        await Iban.findOneAndUpdate(
          { number: receiverAccount },
          {
            $inc: { balance: transactionAmount },
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

      await Iban.findOneAndUpdate(
        { number: user.bankAccount.number },
        {
          $inc: { balance: -transactionAmount },
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

        await Iban.findOneAndUpdate(
          { number: receiverAccount },
          {
            $inc: { balance: transactionAmount },
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

export async function fetchTransactions(iban: string) {
  try {
    connectToDb()

    const transactionsQuery = Transaction.find({
      $or: [
        { senderAccount: iban, type: "expense" },
        { receiverAccount: iban, type: "income" },
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

    return totalExpenses
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

    return totalIncomes
  } catch (error: any) {
    throw new Error(`Failed to calc user incomes: ${error.message}`)
  }
}

export async function fetchTransactionById(id: string) {
  connectToDb()

  try {
    // TODO Populate shared account

    const transaction = await Transaction.findById(id)
      .populate({
        path: "author",
        model: "User",
        select: "_id id name image",
      })
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
