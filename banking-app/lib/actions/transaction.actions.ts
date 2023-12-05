"use server"

import { revalidatePath } from "next/cache"
import Transaction from "../models/transaction.model"
import User from "../models/user.model"
import { connectToDb } from "../mongoose"
import Iban from "../models/iban.model"
import { fetchUserById } from "./user.actions"
import { fetchBankAccount } from "./iban.actions"

interface Params {
  senderAccount: string
  receiverAccount: string
  transactionAmount: number
  description: string
  author: string
  sharedAccountId: string | null
  path: string
}

export async function makeTransaction({
  senderAccount,
  receiverAccount,
  transactionAmount,
  description,
  author,
  sharedAccountId,
  path,
}: Params) {
  try {
    connectToDb()

    const user = await fetchUserById(author)
    const receiver = await fetchBankAccount(receiverAccount)

    if (user.bankAccount.number !== senderAccount) {
      throw new Error(`You don't own that ${senderAccount} account!`)
    } else if (user.bankAccount.balance < transactionAmount) {
      throw new Error(`You don't have enough money!`)
    } else if (!receiver) {
      throw new Error(`This ${receiverAccount} account doesn't exists!`)
    }

    const senderTransaction = await Transaction.create({
      senderAccount,
      receiverAccount,
      transactionAmount,
      description,
      author,
      sharedAccount: null,
      type: "expense",
    })

    await User.findByIdAndUpdate(author, {
      $push: { transactions: senderTransaction._id },
    })

    await Iban.findOneAndUpdate(
      { number: senderAccount },
      {
        $inc: { balance: -transactionAmount },
      }
    )

    const receiverTransaction = await Transaction.create({
      senderAccount,
      receiverAccount,
      transactionAmount,
      description,
      author,
      sharedAccount: null,
      type: "income",
    })

    const receiverIban = await Iban.findOne({ number: receiverAccount })

    await User.findOneAndUpdate(
      { bankAccount: receiverIban._id },
      { $push: { transactions: receiverTransaction._id } }
    )

    await Iban.findOneAndUpdate(
      { number: receiverAccount },
      {
        $inc: { balance: transactionAmount },
      }
    )

    revalidatePath(path)
  } catch (error: any) {
    return {
      error: error.message,
    }
  }
}

export async function fetchTransactions(
  iban: string,
  pageNumber = 1,
  pageSize = 20
) {
  try {
    connectToDb()

    const skipAmount = (pageNumber - 1) * pageSize

    const transactionsQuery = Transaction.find({
      $or: [
        { senderAccount: iban, type: "expense" },
        { receiverAccount: iban, type: "income" },
      ],
    })
      .sort({ timestamp: "desc" })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({ path: "author", model: User })

    const totalTransactionsCount = await Transaction.countDocuments({
      $or: [
        { senderAccount: iban, type: "expense" },
        { receiverAccount: iban, type: "income" },
      ],
    })

    const transactions = await transactionsQuery.exec()
    const isNext = totalTransactionsCount > skipAmount + transactions.length

    return { transactions, isNext }
  } catch (error: any) {
    throw new Error(`Failed to fetch user transactions: ${error.message}`)
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
