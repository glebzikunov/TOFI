"use server"

import { FilterQuery, SortOrder } from "mongoose"

import SharedAccount from "../models/sharedAccount.model"
import Transaction from "../models/transaction.model"
import User from "../models/user.model"

import { connectToDb } from "../mongoose"

export async function createSharedAccount(
  id: string,
  name: string,
  username: string,
  image: string,
  bio: string,
  number: string,
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
      number,
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

export async function fetchSharedAccount(sharedAccountId: string) {
  try {
    connectToDb()

    return await SharedAccount.findOne({ id: sharedAccountId }).populate([
      "createdBy",
      {
        path: "members",
        model: User,
        select: "name username image _id id",
      },
    ])
  } catch (error: any) {
    throw new Error(`Failed to fetch shared account: ${error.message}`)
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

    const sharedAccount = await SharedAccount.findById(id)

    const transactionsQuery = Transaction.find({
      $or: [
        { senderAccount: sharedAccount.number, type: "expense" },
        { receiverAccount: sharedAccount.number, type: "income" },
      ],
    })
      .sort({ timestamp: "desc" })
      .populate({ path: "author", model: User, select: "name image id" }) // or "_id"
      .populate({ path: "sharedAccount", model: SharedAccount })

    const sharedAccountTransactions = await transactionsQuery.exec()

    return sharedAccountTransactions
  } catch (error) {
    // Handle any errors
    console.error("Error fetching shared account transactions:", error)
    throw error
  }
}

export async function fetchSharedAccounts(userId: string, limit = 0) {
  try {
    connectToDb()

    //Find current user by clerk id
    const user = await User.findOne({ id: userId })

    //Find all shared accounts related to user
    const sharedAccounts = await SharedAccount.find({ members: user._id })
      .sort({ createdAt: "desc" })
      .limit(limit)
      .populate("createdBy")
      .populate("members")

    return sharedAccounts
  } catch (error) {
    console.error("Error fetching user shared accounts:", error)
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

    // Remove the shared account _id from the sharedAccounts array in the user
    await User.updateOne(
      { _id: userIdObject._id },
      { $pull: { sharedAccounts: sharedAccountIdObject._id } }
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
    await Transaction.deleteMany({ sharedAccount: deletedSharedAccount._id })

    //Find all users who are part of the shared account
    const sharedAccountUsers = await User.find({
      sharedAccounts: deletedSharedAccount._id,
    })

    // Remove the shared account from the 'sharedAccounts' array for each user
    const updateUserPromises = sharedAccountUsers.map((user) => {
      user.sharedAccounts.pull(deletedSharedAccount._id)
      return user.save()
    })

    await Promise.all(updateUserPromises)

    return deletedSharedAccount
  } catch (error) {
    console.error("Error deleting shared account: ", error)
    throw error
  }
}
