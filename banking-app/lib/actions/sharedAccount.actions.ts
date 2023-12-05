"use server"

import { FilterQuery, SortOrder } from "mongoose"

import SharedAccount from "../models/sharedAccount.model"
import Transaction from "../models/transaction.model"
import User from "../models/user.model"

import { connectToDb } from "../mongoose"
import Iban from "../models/iban.model"

export async function createSharedAccount(
  id: string,
  name: string,
  username: string,
  image: string,
  bio: string,
  createdById: string // Change the parameter name to reflect it's an id
) {
  try {
    connectToDb()

    // Find the user with the provided unique id
    const user = await User.findOne({ id: createdById })

    if (!user) {
      throw new Error("User not found") // Handle the case if the user with the id is not found
    }

    const newSharedAccount = new SharedAccount({
      id,
      name,
      username,
      image,
      bio,
      createdBy: user._id, // Use the mongoose ID of the user
    })

    const createdSharedAccount = await newSharedAccount.save()

    // Update User model
    user.sharedAccounts.push(createdSharedAccount._id)
    await user.save()

    return createdSharedAccount
  } catch (error) {
    // Handle any errors
    console.error("Error creating shared account:", error)
    throw error
  }
}

export async function fetchSharedAccountDetails(id: string) {
  try {
    connectToDb()

    const sharedAccountDetails = await SharedAccount.findOne({ id }).populate([
      "createdBy",
      {
        path: "members",
        model: User,
        select: "name username image _id id",
      },
    ])

    return sharedAccountDetails
  } catch (error) {
    // Handle any errors
    console.error("Error fetching shared account details:", error)
    throw error
  }
}

export async function fetchSharedAccountTransactions(id: string) {
  try {
    connectToDb()

    const sharedAccount = await SharedAccount.findById(id).populate({
      path: "iban",
      model: Iban,
      select: "number",
    })

    const sharedAccountIban = sharedAccount.bankAccount.number
    const transactionsQuery = Transaction.find({
      $or: [
        { senderAccount: sharedAccountIban, type: "expense" },
        { receiverAccount: sharedAccountIban, type: "income" },
      ],
    })
      .sort({ timestamp: "desc" })
      .populate({ path: "author", model: User, select: "name image id" }) // or "_id"

    const sharedAccountTransactions = await transactionsQuery.exec()

    return sharedAccountTransactions
  } catch (error) {
    // Handle any errors
    console.error("Error fetching shared account transactions:", error)
    throw error
  }
}

export async function fetchSharedAccounts({
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  searchString?: string
  pageNumber?: number
  pageSize?: number
  sortBy?: SortOrder
}) {
  try {
    connectToDb()

    // Calculate the number of shared accounts to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize

    // Create a case-insensitive regular expression for the provided search string.
    const regex = new RegExp(searchString, "i")

    // Create an initial query object to filter shared accounts.
    const query: FilterQuery<typeof SharedAccount> = {}

    // If the search string is not empty, add the $or operator to match either username or name fields.
    if (searchString.trim() !== "") {
      query.$or = [{ username: { $regex: regex } }, { name: { $regex: regex } }]
    }

    // Define the sort options for the fetched shared accounts based on createdAt field and provided sort order.
    const sortOptions = { createdAt: sortBy }

    // Create a query to fetch the shared accounts based on the search and sort criteria.
    const sharedAccountQuery = SharedAccount.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize)
      .populate("members")

    // Count the total number of shared accounts that match the search criteria (without pagination).
    const totalSharedAccountsCount = await SharedAccount.countDocuments(query)

    const sharedAccounts = await sharedAccountQuery.exec()

    // Check if there are more shared accounts beyond the current page.
    const isNext = totalSharedAccountsCount > skipAmount + sharedAccounts.length

    return { sharedAccounts, isNext }
  } catch (error) {
    console.error("Error fetching shared accounts:", error)
    throw error
  }
}

export async function addMemberToSharedAccount(
  sharedAccountId: string,
  memberId: string
) {
  try {
    connectToDb()

    // Find the shared account by its unique id
    const sharedAccount = await SharedAccount.findOne({ id: sharedAccountId })

    if (!sharedAccount) {
      throw new Error("Shared account not found")
    }

    // Find the user by their unique id
    const user = await User.findOne({ id: memberId })

    if (!user) {
      throw new Error("User not found")
    }

    // Check if the user is already a member of the shared account
    if (sharedAccount.members.includes(user._id)) {
      throw new Error("User is already a member of the shared account")
    }

    // Add the user's _id to the members array in the shared account
    sharedAccount.members.push(user._id)
    await sharedAccount.save()

    // Add the sharedAccount's _id to the shared account array in the user
    user.sharedAccounts.push(sharedAccount._id)
    await user.save()

    return sharedAccount
  } catch (error) {
    // Handle any errors
    console.error("Error adding member to shared account:", error)
    throw error
  }
}

export async function removeUserFromSharedAccount(
  userId: string,
  sharedAccountId: string
) {
  try {
    connectToDb()

    const userIdObject = await User.findOne({ id: userId }, { _id: 1 })
    const sharedAccountIdObject = await SharedAccount.findOne(
      { id: sharedAccountId },
      { _id: 1 }
    )

    if (!userIdObject) {
      throw new Error("User not found")
    }

    if (!sharedAccountIdObject) {
      throw new Error("Shared account not found")
    }

    // Remove the user's _id from the members array in the shared account
    await SharedAccount.updateOne(
      { _id: sharedAccountIdObject._id },
      { $pull: { members: userIdObject._id } }
    )

    // Remove the community's _id from the sharedAccounts array in the user
    await User.updateOne(
      { _id: userIdObject._id },
      { $pull: { communities: sharedAccountIdObject._id } }
    )

    return { success: true }
  } catch (error) {
    // Handle any errors
    console.error("Error removing user from shared account:", error)
    throw error
  }
}

export async function updateSharedAccountInfo(
  sharedAccountId: string,
  name: string,
  username: string,
  image: string
) {
  try {
    connectToDb()

    // Find the shared account by its _id and update the information
    const updatedSharedAccount = await SharedAccount.findOneAndUpdate(
      { id: sharedAccountId },
      { name, username, image }
    )

    if (!updatedSharedAccount) {
      throw new Error("Shared account not found")
    }

    return updatedSharedAccount
  } catch (error) {
    // Handle any errors
    console.error("Error updating shared account information:", error)
    throw error
  }
}

export async function deleteSharedAccount(sharedAccountId: string) {
  try {
    connectToDb()

    // Find the shared account by its ID and delete it
    const deletedSharedAccount = await SharedAccount.findOneAndDelete({
      id: sharedAccountId,
    })

    if (!deletedSharedAccount) {
      throw new Error("Shared account not found")
    }

    // Delete all transactions associated with the shared account
    await Transaction.deleteMany({ sharedAccount: sharedAccountId })

    // Find all users who are part of the shared account
    const sharedAccountUsers = await User.find({
      sharedAccounts: sharedAccountId,
    })

    // Remove the shared account from the 'sharedAccounts' array for each user
    const updateUserPromises = sharedAccountUsers.map((user) => {
      user.sharedAccounts.pull(sharedAccountId)
      return user.save()
    })

    await Promise.all(updateUserPromises)

    return deletedSharedAccount
  } catch (error) {
    console.error("Error deleting shared account: ", error)
    throw error
  }
}
