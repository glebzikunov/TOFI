"use client"

import { Button } from "@/components/ui/button"

interface Params {
  data: string
  text: string
}

function CopyButton({ data, text }: Params) {
  const handleCopy = () => {
    navigator.clipboard.writeText(data)
  }
  return (
    <Button
      onClick={handleCopy}
      onTouchStart={handleCopy}
      className="rounded-3xl bg-primary-500 px-8 py-2 !text-small-regular text-light-1 !important;"
    >
      {text}
    </Button>
  )
}

export default CopyButton
