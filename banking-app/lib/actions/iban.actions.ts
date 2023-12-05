"use server"

import { revalidatePath } from "next/cache"
import User from "../models/user.model"
import { connectToDb } from "../mongoose"
import Iban from "../models/iban.model"

interface Params {
  number: string
  owner: string
  path: string
}

export async function createIban({ number, owner, path }: Params) {
  try {
    connectToDb()

    const createdIban = await Iban.create({
      number,
      owner,
    })

    await User.findByIdAndUpdate(owner, {
      $set: { bankAccount: createdIban._id },
    })

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
