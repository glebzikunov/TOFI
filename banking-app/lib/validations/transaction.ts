import * as z from "zod"

export const TransactionValidation = z.object({
  receiverAccount: z.string().min(1),
  transactionAmount: z.coerce
    .number()
    .positive()
    .refine((data) => data % 1 === 0 || data % 1 !== 0, {
      message: "Enter integer or float value",
    }),
  description: z.string().min(0).max(1000),
  accountId: z.string(),
})
