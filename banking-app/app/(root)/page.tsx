import AccountCard from "@/components/cards/AccountCard"
import { currentUser } from "@clerk/nextjs"
import { fetchBankAccount } from "@/lib/actions/iban.actions"
import {
  calculateExpenses,
  calculateIncomes,
} from "@/lib/actions/transaction.actions"
import { fetchUser } from "@/lib/actions/user.actions"
import { redirect } from "next/navigation"

export default async function Home() {
  const user = await currentUser()

  if (!user) return redirect("/sign-in")

  const userInfo = await fetchUser(user.id)

  if (!userInfo?.onboarded) redirect("/onboarding")

  const userIban = user?.id.split("_")[1]
  const bankAccount = await fetchBankAccount(userIban)

  const expenses = await calculateExpenses(userIban)
  const incomes = await calculateIncomes(userIban)

  return (
    <>
      <h1 className="head-text text-left max-sm:text-heading3-bold">
        Overview
      </h1>
      <section className="overview-account w-full flex flex-col text-light-1">
        <div className="first-row flex">
          <AccountCard
            account={bankAccount}
            headingText="Your Balance"
            cardType="wallet"
          />
        </div>
        <div className="second-row flex gap-10 max-md:flex-col">
          <AccountCard
            account={bankAccount}
            headingText="Expenses"
            cardType="expense"
            expenses={expenses}
          />
          <AccountCard
            account={bankAccount}
            headingText="Incomes"
            cardType="income"
            incomes={incomes}
          />
        </div>
      </section>
    </>
  )
}
