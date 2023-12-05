import Link from "next/link"
import Image from "next/image"
import { formatDateString, formatTransactionAmount } from "@/lib/utils"

interface Props {
  id: string
  currentUserId: string
  content: string | ""
  author: {
    name: string
    image: string
    id: string
  }
  sharedAccount: {
    id: string
    name: string
    image: string
  } | null
  transactionAmount: number
  type: "income" | "expense"
  createdAt: string
  paddding: string
}

const TransactionCard = ({
  id,
  currentUserId,
  content,
  author,
  sharedAccount,
  transactionAmount,
  type,
  createdAt,
  paddding,
}: Props) => {
  return (
    <article
      className={`flex w-full flex-col rounded-xl bg-dark-2 ${paddding}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex w-full flex-1 flex-row gap-4">
          <div className="flex flex-col items-center ">
            <Link href={`/profile/${author.id}`} className="relative h-11 w-11">
              <Image
                src={author.image}
                alt="Profile image"
                fill
                className="cursor-pointer rounded-full"
              />
            </Link>
          </div>
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col">
              <Link href={`/transaction/${id}`} className="w-fit">
                <h4 className="cursor-pointer text-base-semibold text-light-1">
                  {author.name}
                </h4>
              </Link>
              <p className="mt-2 text-subtle-medium text-gray-1 max-sm:hidden">
                {formatDateString(createdAt)}
                {sharedAccount && ` - ${sharedAccount.name} Account`}
              </p>
            </div>
            <div className="flex items-center justify-center">
              {type === "income" ? (
                <>
                  <p className="text-base-semibold text-green-600">
                    {formatTransactionAmount(transactionAmount)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base-semibold text-red-600">
                    {formatTransactionAmount(transactionAmount)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-subtle-medium text-gray-1 sm:hidden">
        {formatDateString(createdAt)}
        {sharedAccount && ` - ${sharedAccount.name} Account`}
      </p>
    </article>
  )
}

export default TransactionCard
