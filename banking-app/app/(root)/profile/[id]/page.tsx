import ProfileHeader from "@/components/shared/ProfileHeader"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { profileTabs } from "@/constants"
import { fetchUser } from "@/lib/actions/user.actions"
import { currentUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import Image from "next/image"
import { fetchTransactions } from "@/lib/actions/transaction.actions"
import TransactionsTab from "@/components/shared/TransactionsTab"

async function Page({ params }: { params: { id: string } }) {
  const user = await currentUser()

  if (!user) return null

  const userIban = user?.id.split("_")[1]
  const result = await fetchTransactions(userIban, 1, 10)

  const userInfo = await fetchUser(params.id)

  if (!userInfo?.onboarded) redirect("/onboarding")

  return (
    <section>
      <ProfileHeader
        accountId={userInfo.id}
        authUserId={user.id}
        name={userInfo.name}
        username={userInfo.username}
        imgUrl={userInfo.image}
        bio={userInfo.bio}
      />
      {userInfo.id === user.id && (
        <div className="mt-9">
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="tab">
              {profileTabs.map((tab) => (
                <TabsTrigger key={tab.label} value={tab.value} className="tab">
                  <Image
                    src={tab.icon}
                    alt={tab.label}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <p className="max-sm:hidden">{tab.label}</p>
                  {tab.label === "Transactions" && (
                    <p className="ml-1 rounded-sm bg-light-4 px-2 py-1 !text-tiny-medium text-light-2">
                      {result?.transactions.length}
                    </p>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {profileTabs.map((tab) => (
              <TabsContent
                key={`content-${tab.label}`}
                value={tab.value}
                className="w-full text-light-1"
              >
                <TransactionsTab currentUserId={user.id} iban={userIban} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </section>
  )
}

export default Page
