import Link from "next/link"
import Image from "next/image"
import { formatDateString, formatAmount } from "@/lib/utils"

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
  padding: string
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
  padding,
}: Props) => {
  return (
    <article className={`flex w-full flex-col rounded-xl bg-dark-2 ${padding}`}>
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
            </div>
            <div className="flex items-center justify-center">
              {type === "income" ? (
                <>
                  <p className="text-base-semibold text-green-600">
                    {formatAmount(transactionAmount)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base-semibold text-red-600">
                    {formatAmount(transactionAmount)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {sharedAccount ? (
        <Link
          href={`/shared-accounts/${sharedAccount.id}`}
          className="mt-5 flex items-center"
        >
          <p className="text-subtle-medium text-gray-1">
            {formatDateString(createdAt)}
            {` - ${sharedAccount.name} Account`}
          </p>
          <Image
            src={sharedAccount.image}
            alt={sharedAccount.name}
            width={20}
            height={20}
            className="ml-1 rounded-full object-cover"
          />
        </Link>
      ) : (
        <p className="mt-5 text-subtle-medium text-gray-1">
          {formatDateString(createdAt)}
        </p>
      )}
    </article>
  )
}

export default TransactionCard
