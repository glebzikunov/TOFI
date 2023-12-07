import * as z from "zod"

export const CreditValidation = z.object({
  paymentType: z.string(),
  creditPeriod: z.string(),
  requestedAmount: z.coerce
    .number()
    .min(100)
    .positive()
    .refine((data) => data % 1 === 0 || data % 1 !== 0, {
      message: "Enter integer or float value",
    }),
  description: z.string().min(0).max(1000),
  accountId: z.string(),
})
