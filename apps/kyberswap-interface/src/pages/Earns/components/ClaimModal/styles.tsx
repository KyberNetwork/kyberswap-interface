import { X as Xsvg } from 'react-feather'

import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { LIMIT_TEXT_STYLES } from 'pages/Earns/constants'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

export const Wrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex min-h-fit w-full flex-col items-center justify-center gap-6 rounded-[20px] bg-background p-5 text-text',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const ModalHeader = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative flex w-full justify-center', className)} {...rest}>
    {children}
  </div>
)

export const X = ({ className, ...rest }: React.ComponentProps<typeof Xsvg>) => (
  <Xsvg {...rest} className={cn('absolute right-0 top-0 cursor-pointer text-subText hover:text-text', className)} />
)

export const ClaimInfoWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col gap-5', className)} {...rest}>
    {children}
  </div>
)

export const ClaimInfo = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col gap-2.5 rounded-xl bg-[#0f0f0f] px-4 py-3', className)} {...rest}>
    {children}
  </div>
)

export const ClaimInfoRow = ({
  tokenImage,
  dexImage,
  tokenAmount,
  tokenSymbol,
  tokenUsdValue,
}: {
  tokenImage: string
  dexImage: string
  tokenAmount: string | number
  tokenSymbol: string
  tokenUsdValue: number
}) => {
  const theme = useTheme()

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-end">
        <TokenLogo src={tokenImage} alt="tokenImage" />
        <TokenLogo src={dexImage} size={14} alt="dexImage" translateLeft />
      </div>
      <span className="max-w-[100px]" style={LIMIT_TEXT_STYLES}>
        {formatDisplayNumber(tokenAmount, {
          significantDigits: 4,
        })}
      </span>
      <span>{tokenSymbol}</span>
      <span className="max-w-[85px]" style={{ ...LIMIT_TEXT_STYLES, color: theme.subText }}>
        {formatDisplayNumber(tokenUsdValue, {
          style: 'currency',
          significantDigits: 4,
        })}
      </span>
    </div>
  )
}
