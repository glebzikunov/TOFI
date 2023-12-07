"use client"

import { Button } from "@/components/ui/button"
import { makeCreditTransaction } from "@/lib/actions/transaction.actions"
import { usePathname, useRouter } from "next/navigation"

interface Params {
  creditId: string
  creditNumber: string
  monthPayment: number
  author: string
  text: string
}

function PayForCredit({
  creditId,
  creditNumber,
  monthPayment,
  author,
  text,
}: Params) {
  const router = useRouter()
  const pathname = usePathname()

  const handleClick = async () => {
    const creditTransactionComfirmed = confirm(
      "Are you sure to make a credit payment?"
    )

    if (creditTransactionComfirmed) {
      const result = await makeCreditTransaction(
        creditId,
        creditNumber,
        monthPayment,
        "Credit payment",
        author,
        pathname
      )

      if (result?.error) {
        alert(result.error)
      } else {
        router.push("/")
      }
    }
  }
  return (
    <Button
      onClick={() => handleClick()}
      className="rounded-3xl bg-primary-500 px-8 py-2 !text-small-regular text-light-1 !important;"
    >
      {text}
    </Button>
  )
}

export default PayForCredit
