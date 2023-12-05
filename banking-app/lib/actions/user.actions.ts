"use server"

import { revalidatePath } from "next/cache"
import User from "../models/user.model"
import { connectToDb } from "../mongoose"
import Iban from "../models/iban.model"
import SharedAccount from "../models/sharedAccount.model"

interface Params {
  userId: string
  username: string
  name: string
  bio: string
  image: string
  path: string
}

export async function updateUser({
  userId,
  username,
  name,
  bio,
  image,
  path,
}: Params): Promise<void> {
  connectToDb()

  try {
    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true }
    )

    if (path === "/profile/edit") {
      revalidatePath(path)
    }
  } catch (error: any) {
    throw new Error(`Failed to create/update user: ${error.message}`)
  }
}

export async function fetchUser(userId: string) {
  try {
    connectToDb()

    return await User.findOne({ id: userId }).populate({
      path: "sharedAccounts",
      model: SharedAccount,
    })
  } catch (error: any) {
    throw new Error(`Failed to fetch user: ${error.message}`)
  }
}

export async function fetchUserById(userId: string) {
  try {
    connectToDb()

    const user = await User.findById(userId)
      .populate({
        path: "bankAccount",
        model: Iban,
        select: "number balance",
      })
      .populate({
        path: "sharedAccounts",
        model: SharedAccount,
        select: "number balance",
      })
      .exec()
    return user
  } catch (error: any) {
    throw new Error(`Failed to fetch user by id: ${error.message}`)
  }
}
