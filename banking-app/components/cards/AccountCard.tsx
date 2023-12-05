import { hideBankAccount } from "@/lib/utils"
import Image from "next/image"

interface Props {
  account: {
    number: string
    balance: number
    owner: object
    createdAt: Date
  }
  headingText: string
  cardType: string
  expenses?: number
  incomes?: number
}

const AccountCard = ({
  account,
  headingText,
  cardType,
  expenses = 0,
  incomes = 0,
}: Props) => {
  return (
    <div className="account-card mt-10 w-full flex flex-col rounded-xl bg-dark-2 p-7">
      <div className="card-heading flex gap-4 mb-7 items-center">
        <div className="heading-left">
          <Image
            src={`/assets/${cardType}.svg`}
            alt="profile photo"
            width={60}
            height={60}
            priority
            className="rounded-full object-contain p-1 bg-zinc-700"
          />
        </div>
        <div className="heading-rigth flex flex-col gap-2">
          <h1 className="head-text max-sm:text-heading4-bold">{headingText}</h1>
          {cardType === "wallet" ? (
            <p className="text-body-medium max-sm:text-base-semibold">
              {hideBankAccount(account.number)}
            </p>
          ) : (
            <p className="text-body-medium max-sm:text-base-semibold">
              Month based
            </p>
          )}
        </div>
      </div>
      <hr className="border-2 border-zinc-700" />
      {cardType === "wallet" ? (
        <p className="account-card-balance mt-7 text-heading2-bold max-sm:text-heading3-bold">
          $ {account.balance}
        </p>
      ) : cardType === "expense" ? (
        <p className="account-card-balance mt-7 text-heading2-bold max-sm:text-heading3-bold">
          $ {expenses}
        </p>
      ) : (
        <p className="account-card-balance mt-7 text-heading2-bold max-sm:text-heading3-bold">
          $ {incomes}
        </p>
      )}
    </div>
  )
}

export default AccountCard
