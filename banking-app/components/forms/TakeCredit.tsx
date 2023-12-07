"use client"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { usePathname, useRouter } from "next/navigation"
import { CreditValidation } from "@/lib/validations/credit"
import { useOrganization } from "@clerk/nextjs"
import { takeCredit } from "@/lib/actions/creditAccount.actions"

interface Params {
  userId: string
}

function MakeTransaction({ userId }: Params) {
  const router = useRouter()
  const pathname = usePathname()
  const { organization } = useOrganization()

  const form = useForm({
    resolver: zodResolver(CreditValidation),
    defaultValues: {
      paymentType: "annuity",
      creditPeriod: "three",
      requestedAmount: 100,
      description: "",
      accountId: userId,
    },
  })

  const onSubmit = async (values: z.infer<typeof CreditValidation>) => {
    const creditComfirmed = confirm("Are you sure to take credit?")

    if (creditComfirmed) {
      const result = await takeCredit({
        paymentType: values.paymentType,
        creditPeriod: values.creditPeriod,
        requestedAmount: values.requestedAmount,
        description: values.description,
        createdBy: userId,
        path: pathname,
      })

      if (result?.error) {
        alert(result.error)
      } else {
        router.push("/")
      }
    }
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-10 flex flex-col justify-start gap-10"
        >
          <FormField
            control={form.control}
            name="paymentType"
            render={({ field }) => (
              <FormItem className="flex flex-col max-w-fit gap-3">
                <FormLabel className="text-base-semibold text-light-2">
                  Choose credit type:
                </FormLabel>
                <FormControl className="no-focus rounded-md border border-dark-4 bg-dark-3 px-3 h-10 text-light-1">
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-5"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="annuity" className="" />
                      </FormControl>
                      <FormLabel className="text-base-semibold text-light-2">
                        Annuity
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="differential" />
                      </FormControl>
                      <FormLabel className="text-base-semibold text-light-2">
                        Differential
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="creditPeriod"
            render={({ field }) => (
              <FormItem className="flex flex-col max-w-fit gap-3">
                <FormLabel className="text-base-semibold text-light-2">
                  Choose credit period (in months):
                </FormLabel>
                <FormControl className="no-focus rounded-md border border-dark-4 bg-dark-3 px-3 h-10 text-light-1">
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex justify-between"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="three" className="" />
                      </FormControl>
                      <FormLabel className="text-base-semibold text-light-2">
                        3
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="six" />
                      </FormControl>
                      <FormLabel className="text-base-semibold text-light-2">
                        6
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="twelve" />
                      </FormControl>
                      <FormLabel className="text-base-semibold text-light-2">
                        12
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="requestedAmount"
            render={({ field }) => (
              <FormItem className="flex flex-col w-full gap-3">
                <FormLabel className="text-base-semibold text-light-2">
                  Credit Amount
                </FormLabel>
                <FormControl className="no-focus border border-dark-4 bg-dark-3 text-light-1">
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="flex flex-col w-full gap-3">
                <FormLabel className="text-base-semibold text-light-2">
                  Description (Optional)
                </FormLabel>
                <FormControl className="no-focus border border-dark-4 bg-dark-3 text-light-1">
                  <Textarea rows={5} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="bg-primary-500">
            Take
          </Button>
        </form>
      </Form>
    </>
  )
}

export default MakeTransaction
