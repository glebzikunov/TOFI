import { fetchTransactions } from "@/lib/actions/transaction.actions"
import TransactionCard from "@/components/cards/TransactionCard"

interface Props {
  currentUserId: string
  iban: string
}

const TransactionsTab = async ({ currentUserId, iban }: Props) => {
  let result = await fetchTransactions(iban)

  return (
    <section className="mt-9 flex flex-col gap-5">
      {result.length === 0 ? (
        <p className="no-result">No results.</p>
      ) : (
        <>
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
