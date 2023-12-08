import { fetchTransactions } from "@/lib/actions/transaction.actions"
import { fetchSharedAccounts } from "@/lib/actions/sharedAccount.actions"
import { currentUser } from "@clerk/nextjs"
import TransactionCard from "../cards/TransactionCard"
import UserCard from "../cards/UserCard"

async function RightSidebar() {
  const user = await currentUser()

  if (!user) return null

  const result = await fetchTransactions(user.id, 3)
  const sharedAccounts = await fetchSharedAccounts(user.id, 3)

  return (
    <section className="custom-scrollbar rightsidebar">
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
                  padding=""
                />
              ))}
            </>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-start">
        <h3 className="text-heading4-medium text-light-1 mb-5">
          Recent Shared Accounts
        </h3>
        <div className="flex flex-col gap-10">
          {sharedAccounts.length === 0 ? (
            <p className="no-result">No results.</p>
          ) : (
            <>
              {sharedAccounts.map((sharedAccount) => (
                <UserCard
                  key={sharedAccount.id}
                  id={sharedAccount.id}
                  name={sharedAccount.name}
                  username={sharedAccount.username}
                  imgUrl={sharedAccount.image}
                  personType="SharedAccount"
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
