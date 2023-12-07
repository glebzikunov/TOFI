import * as z from "zod"

export const CreditValidation = z.object({
  paymentType: z.string(),
  creditPeriod: z.string(),
  requestedAmount: z.coerce.number().int().gte(100),
  description: z.string().min(0).max(1000),
  accountId: z.string(),
})
