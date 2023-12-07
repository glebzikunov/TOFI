import { fetchCreditById } from "@/lib/actions/creditAccount.actions"
import { fetchUser } from "@/lib/actions/user.actions"
import { formatTransactionAmount, hideBankAccount } from "@/lib/utils"
import { currentUser } from "@clerk/nextjs"
import CreditCard from "@/components/cards/CreditCard"
import { redirect } from "next/navigation"
import PayForCredit from "@/components/forms/PayForCredit"

const Page = async ({ params }: { params: { id: string } }) => {
  if (!params.id) return null

  const user = await currentUser()
  if (!user) return null

  const userInfo = await fetchUser(user.id)
  if (!userInfo?.onboarded) redirect("/onboarding")

  const credit = await fetchCreditById(params.id)

  return (
    <section className="relative">
      <div>
        <CreditCard
          key={credit._id}
          id={credit._id}
          author={credit.createdBy}
          createdAt={credit.createdAt}
          isClosed={credit.isClosed}
          description={credit.description}
          padding="p-7"
        />
      </div>
      <div className="flex w-full flex-col rounded-xl bg-dark-2 p-7 mt-5 text-light-2">
        <div>
          <p className="pb-2">
            Credit number: {hideBankAccount(credit.number)}
          </p>
          <p className="pb-2">
            Requested Amount: {formatTransactionAmount(credit.requestedAmount)}
          </p>
          {!credit.isClosed ? (
            <>
              <p className="pb-2">
                Need to cover: {formatTransactionAmount(credit.remainingAmount)}
              </p>
              <p className="pb-2">
                Month payment: {formatTransactionAmount(credit.monthPayment)}
              </p>
              <p className="pb-2">
                Credit period: {credit.creditPeriod} months
              </p>
            </>
          ) : null}
          <p className="pb-2">Interest rate: %{credit.interestRate}</p>
          <p className="pb-2">Description: {credit.description}</p>
        </div>
        {!credit.isClosed ? (
          <div className="self-end mt-8 max-w-[150px]">
            <PayForCredit
              creditId={credit._id}
              creditNumber={credit.number}
              monthPayment={credit.monthPayment}
              author={credit.createdBy._id}
              text={"Pay for credit"}
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default Page
