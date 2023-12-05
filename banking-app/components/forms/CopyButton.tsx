"use client"

import { Button } from "@/components/ui/button"

interface Params {
  data: string
  text: string
}

function MakeTransaction({ data, text }: Params) {
  return (
    <Button
      onClick={() => navigator.clipboard.writeText(data)}
      className="rounded-3xl bg-primary-500 px-8 py-2 !text-small-regular text-light-1 !important;"
    >
      {text}
    </Button>
  )
}

export default MakeTransaction
