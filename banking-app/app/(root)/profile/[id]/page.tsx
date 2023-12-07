import ProfileHeader from "@/components/shared/ProfileHeader"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { profileTabs } from "@/constants"
import { fetchUser } from "@/lib/actions/user.actions"
import { currentUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import Image from "next/image"
import { fetchTransactions } from "@/lib/actions/transaction.actions"
import TransactionsTab from "@/components/shared/TransactionsTab"
import { fetchUserCredits } from "@/lib/actions/creditAccount.actions"
import CreditCard from "@/components/cards/CreditCard"

async function Page({ params }: { params: { id: string } }) {
  const user = await currentUser()

  if (!user) return null

  const result = await fetchTransactions(user.id)

  const userInfo = await fetchUser(params.id)

  if (!userInfo?.onboarded) redirect("/onboarding")

  const userCredits = await fetchUserCredits(userInfo._id)

  return (
    <section>
      <ProfileHeader
        accountId={userInfo.id}
        authUserId={user.id}
        name={userInfo.name}
        username={userInfo.username}
        imgUrl={userInfo.image}
        bio={userInfo.bio}
        type="User"
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
                      {result?.length}
                    </p>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="transactions" className="w-full text-light-1">
              <TransactionsTab
                currentUserId={user.id}
                accountId={user.id}
                accountType="User"
              />
            </TabsContent>
            <TabsContent value="credits" className="w-full text-light-1">
              <section className="mt-9 flex flex-col gap-10">
                {userCredits.map((credit: any) => (
                  <>
                    <CreditCard
                      key={credit.id}
                      id={credit._id}
                      author={credit.createdBy}
                      createdAt={credit.createdAt}
                      isClosed={credit.isClosed}
                      description={credit.description}
                      padding="p-7"
                    />
                  </>
                ))}
              </section>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </section>
  )
}

export default Page
