import { fetchTransactions } from "@/lib/actions/transaction.actions"
import TransactionCard from "@/components/cards/TransactionCard"
import { fetchSharedAccountTransactions } from "@/lib/actions/sharedAccount.actions"

interface Props {
  currentUserId: string
  accountId: string
  accountType: string
}

const TransactionsTab = async ({
  currentUserId,
  accountId,
  accountType,
}: Props) => {
  let result: any
  if (accountType === "SharedAccount") {
    result = await fetchSharedAccountTransactions(accountId)
  } else {
    result = await fetchTransactions(accountId)
  }

  return (
    <section className="mt-9 flex flex-col gap-5">
      {result.length === 0 ? (
        <p className="no-result">No results.</p>
      ) : (
        <>
          {/* @ts-ignore */}
          {result.map((transaction) => (
            <TransactionCard
              key={transaction._id}
              id={transaction._id}
              currentUserId={currentUserId}
              content={transaction.description}
              author={transaction.author}
              sharedAccount={transaction.sharedAccount}
              transactionAmount={transaction.transactionAmount}
              type={transaction.type}
              createdAt={transaction.timestamp}
              paddding="p-7"
            />
          ))}
        </>
      )}
    </section>
  )
}

export default TransactionsTab
