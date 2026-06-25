import Divider from 'components/Divider'
import { cn } from 'utils/cn'

export const Loading = ({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'rounded-[20px] bg-[linear-gradient(90deg,var(--ks-buttonGray)_8%,rgb(var(--ks-buttonGray-rgb)/0.6)_18%,var(--ks-buttonGray)_33%)] bg-[length:200%_100%] [animation:ks-shine_1.5s_linear_infinite]',
      className,
    )}
    {...rest}
  />
)

function ContentLoader() {
  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-[20px] border-0 bg-background px-5 pb-4 pt-7">
      <Loading className="h-[41px]" />
      <Loading className="h-7 rounded-full" />
      <Loading className="h-[185px]" />
      <Loading className="h-40" />

      <div className="flex">
        <Loading className="h-9 flex-1 rounded-full" />
        <Loading className="ml-4 h-9 flex-1 rounded-full" />
      </div>

      <Divider />

      <Loading className="h-[15px] w-20 rounded-full" />
    </div>
  )
}

export default ContentLoader
