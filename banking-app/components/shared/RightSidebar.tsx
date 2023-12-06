import { fetchTransactions } from "@/lib/actions/transaction.actions"
import { currentUser } from "@clerk/nextjs"
import TransactionCard from "../cards/TransactionCard"

async function RightSidebar() {
  const user = await currentUser()

  if (!user) return null

  const result = await fetchTransactions(user.id)

  return (
    <section className="custom-scrollbar rightsidebar">
      <div className="flex flex-1 flex-col justify-start">
        <h3 className="text-heading4-medium text-light-1 mb-5">
          Suggested Shared Accounts
        </h3>
      </div>
      <div className="flex flex-1 flex-col justify-start">
        <h3 className="text-heading4-medium text-light-1 mb-5">
          Recent Transcations
        </h3>
        <div className="flex flex-col gap-10">
          {result.length === 0 ? (
            <p className="no-result">No results.</p>
          ) : (
            <>
              {result.map((transaction) => (
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
                  paddding=""
                />
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default RightSidebar
