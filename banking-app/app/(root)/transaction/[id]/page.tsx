import TransactionCard from "@/components/cards/TransactionCard"
import CopyButton from "@/components/forms/CopyButton"
import { fetchTransactionById } from "@/lib/actions/transaction.actions"
import { fetchUser } from "@/lib/actions/user.actions"
import { hideBankAccount } from "@/lib/utils"
import { currentUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"

const Page = async ({ params }: { params: { id: string } }) => {
  if (!params.id) return null

  const user = await currentUser()
  if (!user) return null

  const userInfo = await fetchUser(user.id)
  if (!userInfo?.onboarded) redirect("/onboarding")

  const transaction = await fetchTransactionById(params.id)

  return (
    <section className="relative">
      <div>
        <TransactionCard
          key={transaction._id}
          id={transaction._id}
          currentUserId={user?.id || ""}
          content={transaction.description}
          author={transaction.author}
          sharedAccount={transaction.sharedAccount}
          transactionAmount={transaction.transactionAmount}
          type={transaction.type}
          createdAt={transaction.timestamp}
          paddding="p-7"
        />
      </div>
      <div className="flex w-full flex-col rounded-xl bg-dark-2 p-7 mt-5 text-light-2">
        <div>
          <p className="pb-2">
            Sender: {hideBankAccount(transaction.senderAccount)}
          </p>
          <p className="pb-2">
            Receiver: {hideBankAccount(transaction.receiverAccount)}
          </p>
          <p className="pb-2">Description: {transaction.description}</p>
        </div>
        <div className="self-end mt-8 max-w-[150px]">
          <CopyButton data={transaction.senderAccount} text={"Copy Sender"} />
        </div>
      </div>
    </section>
  )
}

export default Page
