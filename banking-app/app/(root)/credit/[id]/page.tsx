import { fetchCreditById } from "@/lib/actions/creditAccount.actions"
import { fetchUser } from "@/lib/actions/user.actions"
import { formatAmount, hideBankAccount } from "@/lib/utils"
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
          <p className="pb-2">Credit type: {credit.paymentType}</p>
          <p className="pb-2">
            Requested Amount: {formatAmount(credit.requestedAmount)}
          </p>
          {!credit.isClosed && credit.paymentType === "annuity" ? (
            <p className="pb-2">
              Need to cover: {formatAmount(credit.remainingAmount)}
            </p>
          ) : !credit.isClosed && credit.paymentType === "differential" ? (
            <p className="pb-2">
              Need to cover: {formatAmount(credit.remainingAmount)} +
              transactions %
            </p>
          ) : null}
          {credit.paymentType === "annuity" ? (
            <p className="pb-2">
              Month payment: {formatAmount(credit.monthPayment)}
            </p>
          ) : null}
          <p className="pb-2">Credit period: {credit.creditPeriod} months</p>
          <p className="pb-2">Interest rate: %{credit.interestRate}</p>
          <p className="pb-2">Description: {credit.description}</p>
        </div>
        {!credit.isClosed ? (
          <div className="self-end mt-8 max-w-[150px]">
            <PayForCredit
              creditId={credit._id}
              creditNumber={credit.number}
              creditType={credit.paymentType}
              requestedAmmount={credit.requestedAmount}
              remainingAmount={credit.remainingAmount}
              period={credit.creditPeriod}
              interestRate={credit.interestRate}
              monthPayment={credit.monthPayment ? credit.monthPayment : null}
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
