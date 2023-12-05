import { getTransactionActivity } from "@/lib/actions/transaction.actions"
import { fetchUser } from "@/lib/actions/user.actions"
import { currentUser } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"

const Page = async () => {
  const user = await currentUser()

  if (!user) return null

  const userIban = user?.id.split("_")[1]
  const userInfo = await fetchUser(user.id)
  if (!userInfo?.onboarded) redirect("/onboarding")

  const activity = await getTransactionActivity(userIban)
  console.log(activity)

  return (
    <>
      <h1 className="head-text mb-10">Activity</h1>
      <section className="mt-10 flex flex-col gap-5">
        {activity.length > 0 ? (
          <>
            {activity.map((activity) => (
              <Link key={activity._id} href={`/transaction/${activity._id}`}>
                <article className="activity-card">
                  <Image
                    src={activity.author.image}
                    alt="Profile picture"
                    width={20}
                    height={20}
                    className="rounded-full object-cover"
                  />
                  <p className="!text-small-regular text-light-1">
                    <span className="mr-1 text-primary-500">
                      {activity.author.name}
                    </span>
                    send you a new transaction
                  </p>
                </article>
              </Link>
            ))}
          </>
        ) : (
          <p className="!text-base-regular text-light-3">No activity yet.</p>
        )}
      </section>
    </>
  )
}

export default Page
