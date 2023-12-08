import { currentUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { fetchUser } from "@/lib/actions/user.actions"
import { fetchSharedAccounts } from "@/lib/actions/sharedAccount.actions"
import SharedAccountCard from "@/components/cards/SharedAccountCard"

async function Page() {
  const user = await currentUser()
  if (!user) return null

  const userInfo = await fetchUser(user.id)
  if (!userInfo?.onboarded) redirect("/onboarding")

  const result = await fetchSharedAccounts(user.id)

  return (
    <>
      <h1 className="head-text">Your Shared Accounts</h1>

      <section className="mt-10 flex flex-wrap gap-4">
        {result.length === 0 ? (
          <p className="no-result">You don't have any Shared Accounts.</p>
        ) : (
          <>
            {result.map((sharedAccount) => (
              <SharedAccountCard
                key={sharedAccount.id}
                id={sharedAccount.id}
                name={sharedAccount.name}
                username={sharedAccount.username}
                imgUrl={sharedAccount.image}
                bio={sharedAccount.bio}
                members={sharedAccount.members}
              />
            ))}
          </>
        )}
      </section>
    </>
  )
}

export default Page
