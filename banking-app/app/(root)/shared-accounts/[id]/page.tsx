import Image from "next/image"
import { currentUser } from "@clerk/nextjs"
import { sharedAccountTabs } from "@/constants"
import ProfileHeader from "@/components/shared/ProfileHeader"
import TransactionsTab from "@/components/shared/TransactionsTab"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { fetchSharedAccountDetails } from "@/lib/actions/sharedAccount.actions"
import UserCard from "@/components/cards/UserCard"
import { fetchUser } from "@/lib/actions/user.actions"

async function Page({ params }: { params: { id: string } }) {
  const user = await currentUser()

  if (!user) return null

  const userInfo = await fetchUser(user.id)
  const sharedAccountDetails = await fetchSharedAccountDetails(params.id)
  const containsMember = sharedAccountDetails.members.some(
    (member: any) => member._id.toString() === userInfo._id.toString()
  )

  return (
    <section>
      <ProfileHeader
        accountId={sharedAccountDetails.id}
        authUserId={user.id}
        name={sharedAccountDetails.name}
        username={sharedAccountDetails.username}
        imgUrl={sharedAccountDetails.image}
        bio={sharedAccountDetails.bio}
        type="SharedAccount"
      />
      {containsMember && (
        <div className="mt-9">
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="tab">
              {sharedAccountTabs.map((tab) => (
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
                      {sharedAccountDetails?.transactions?.length}
                    </p>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="transactions" className="w-full text-light-1">
              <TransactionsTab
                currentUserId={user.id}
                accountId={sharedAccountDetails._id}
                accountType="SharedAccount"
              />
            </TabsContent>
            <TabsContent value="members" className="w-full text-light-1">
              <section className="mt-9 flex flex-col gap-10">
                {sharedAccountDetails?.members.map((member: any) => (
                  <>
                    <UserCard
                      key={member.id}
                      id={member.id}
                      name={member.name}
                      username={member.username}
                      imgUrl={member.image}
                      personType="User"
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
