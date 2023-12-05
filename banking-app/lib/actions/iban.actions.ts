"use server"

import { revalidatePath } from "next/cache"
import User from "../models/user.model"
import { connectToDb } from "../mongoose"
import Iban from "../models/iban.model"
import SharedAccount from "../models/sharedAccount.model"

interface Params {
  number: string
  owner: string
  ownerType: string
  path: string
}

export async function createIban({
  number,
  owner,
  ownerType = "User",
  path,
}: Params) {
  try {
    connectToDb()

    const createdIban = await Iban.create({
      number,
      owner,
    })

    if (ownerType === "User") {
      await User.findByIdAndUpdate(owner, {
        $set: { bankAccount: createdIban._id },
      })
    } else {
      await SharedAccount.findByIdAndUpdate(owner, {
        $set: { bankAccount: createdIban._id },
      })
    }

    revalidatePath(path)
  } catch (error: any) {
    throw new Error(`Error creating iban: ${error.message}`)
  }
}

export async function fetchBankAccount(number: string) {
  try {
    connectToDb()

    return await Iban.findOne({ number: number })
  } catch (error: any) {
    throw new Error(`Failed to fetch iban: ${error.message}`)
  }
}
