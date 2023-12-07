import { formatDateString } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

interface Props {
  id: string
  author: {
    name: string
    image: string
    id: string
  }
  createdAt: string
  isClosed: boolean
  description: string
  padding: string
}

function CreditCard({
  id,
  author,
  createdAt,
  isClosed,
  description,
  padding,
}: Props) {
  return (
    <article className={`flex w-full flex-col rounded-xl bg-dark-2 ${padding}`}>
      <div className="flex items-start justify-between">
        <div className="flex w-full flex-1 flex-row gap-4">
          <div className="flex flex-col items-center ">
            <Link href={`/profile/${author.id}`} className="relative h-11 w-11">
              <Image
                src={author.image}
                alt="Profile image"
                fill
                className="cursor-pointer rounded-full"
              />
            </Link>
          </div>
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col">
              <Link href={`/credit/${id}`} className="w-fit">
                <h4 className="cursor-pointer text-base-semibold text-light-1">
                  {author.name} Credit
                </h4>
              </Link>
            </div>
            <div className="flex items-center justify-center">
              {isClosed ? (
                <>
                  <p className="text-base-semibold text-green-600">Closed</p>
                </>
              ) : (
                <>
                  <p className="text-base-semibold text-red-600">Open</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-5 text-subtle-medium text-gray-1">
        {formatDateString(createdAt)}
      </p>
    </article>
  )
}

export default CreditCard
