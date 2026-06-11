import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, Pool, Token } from '@kyber/schema'
import { Trans } from '@lingui/macro'
import { ChangeEvent, useMemo } from 'react'

import { ReactComponent as DropdownIcon } from 'assets/images/dropdown.svg'
import { ReactComponent as CloseIcon } from 'assets/images/x.svg'
import { ReactComponent as WalletIcon } from 'assets/svg/earn/ic_add_liquidity_wallet.svg'
import Skeleton from 'components/Skeleton'
import TokenLogo from 'components/TokenLogo'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

const INPUT_AMOUNT_REGEX = /^\d*(?:[.]\d*)?$/

const normalizeActionAmount = (nextAmount: string) => (parseFloat(nextAmount || '0') > 0 ? nextAmount : '')

interface TokenAmountInputProps {
  token: Token
  amount?: string
  tokenIndex: number
  tokensCount?: number
  chainId: number
  pool: Pool
  tokenBalances?: Record<string, bigint>
  tokenPrices?: Record<string, number>
  onTrackEvent?: (eventName: string, data?: Record<string, unknown>) => void
  onAmountChange?: (index: number, nextAmount: string) => void
  onTokenRemove?: (index: number) => void
  onTokenSelectOpen?: (address: string) => void
}

const cardBaseClass = 'relative flex flex-col gap-3 rounded-xl bg-buttonGray p-3'
const quickActionButtonClass =
  'cursor-pointer rounded-full border-none bg-background px-2 py-1 text-xs text-subText hover:brightness-110'

const TokenAmountInput = ({
  token,
  amount = '',
  tokenIndex,
  tokensCount = 0,
  chainId,
  pool,
  tokenBalances = {},
  tokenPrices = {},
  onTrackEvent,
  onAmountChange,
  onTokenRemove,
  onTokenSelectOpen,
}: TokenAmountInputProps) => {
  const balanceKey =
    token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
      ? NATIVE_TOKEN_ADDRESS.toLowerCase()
      : token.address.toLowerCase()
  const balanceInWei = tokenBalances[balanceKey]?.toString() || '0'
  const formattedBalance = formatUnits(BigInt(balanceInWei), token.decimals)

  const usdAmount = useMemo(
    () => (tokenPrices[token.address.toLowerCase()] || 0) * parseFloat(amount || '0'),
    [amount, token.address, tokenPrices],
  )

  const updateAmount = (nextAmount: string) => onAmountChange?.(tokenIndex, nextAmount)

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/,/g, '.')
    if (value === '.') return

    if (value === '' || INPUT_AMOUNT_REGEX.test(value)) updateAmount(value)
  }

  const applyPercentage = (percentage: number) => {
    if (!balanceInWei) return

    const rawBalance = BigInt(balanceInWei)
    const nextAmount =
      percentage === 100
        ? formatUnits(rawBalance, token.decimals)
        : formatUnits((rawBalance * BigInt(percentage)) / 100n, token.decimals)
    const normalizedAmount = normalizeActionAmount(nextAmount)

    updateAmount(normalizedAmount)

    const usdValue = (tokenPrices[token.address.toLowerCase()] || 0) * parseFloat(normalizedAmount || '0')

    if (percentage === 100 || percentage === 50) {
      onTrackEvent?.(percentage === 100 ? 'LIQ_MAX_CLICKED' : 'LIQ_HALF_CLICKED', {
        token_symbol: token.symbol,
        token_address: token.address,
        [percentage === 100 ? 'max_amount' : 'half_amount']: normalizedAmount,
        [percentage === 100 ? 'max_amount_usd' : 'half_amount_usd']: usdValue,
        pool_pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
        chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
      })
    }
  }

  const isRemovable = tokensCount > 1

  return (
    <div className={cn(cardBaseClass, isRemovable ? 'rounded-tr-[4px]' : '')}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={quickActionButtonClass} onClick={() => applyPercentage(25)}>
            <Trans>25%</Trans>
          </button>
          <button type="button" className={quickActionButtonClass} onClick={() => applyPercentage(50)}>
            <Trans>50%</Trans>
          </button>
          <button type="button" className={quickActionButtonClass} onClick={() => applyPercentage(75)}>
            <Trans>75%</Trans>
          </button>
          <button type="button" className={quickActionButtonClass} onClick={() => applyPercentage(100)}>
            <Trans>100%</Trans>
          </button>
        </div>

        <button
          type="button"
          className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-xs text-subText hover:brightness-110"
          onClick={() => updateAmount(normalizeActionAmount(formattedBalance))}
        >
          <WalletIcon width={14} height={14} />
          {formatDisplayNumber(formattedBalance, { significantDigits: 8 })}
        </button>
      </div>

      <div className="flex items-end gap-3">
        <input
          inputMode="decimal"
          onChange={handleAmountChange}
          placeholder="0.0"
          value={amount}
          className="min-w-0 flex-1 border-none bg-transparent p-0 text-[28px] text-text outline-none placeholder:text-subText"
        />
        {!!usdAmount && (
          <span className="px-0 py-1 text-xs text-subText">
            ~
            {formatDisplayNumber(usdAmount, {
              significantDigits: 6,
              style: 'currency',
            })}
          </span>
        )}
        <button
          type="button"
          onClick={() => onTokenSelectOpen?.(token.address)}
          className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border-none bg-tabActive px-3 py-2 text-text hover:brightness-110"
        >
          <TokenLogo src={token.logo} size={20} />
          <span className="text-sm font-medium">{token.symbol}</span>
          <DropdownIcon />
        </button>
      </div>

      {isRemovable && (
        <button
          type="button"
          onClick={() => onTokenRemove?.(tokenIndex)}
          className="absolute right-0 top-0 flex size-4 cursor-pointer items-center justify-center rounded-none border-none bg-transparent p-0 text-subText hover:text-text"
        >
          <CloseIcon width={14} height={14} />
        </button>
      )}
    </div>
  )
}

export default TokenAmountInput

/** Perfect pixel with TokenAmountInput */
export const TokenAmountInputSkeleton = () => (
  <div className={cardBaseClass}>
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {[0, 1, 2, 3].map(item => (
          <Skeleton key={item} width={40 + item} height={24} />
        ))}
      </div>
      <Skeleton width={80} height={14} />
    </div>

    <div className="flex items-end gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1.5">
        <Skeleton width="50%" height={36} />
      </div>
      <Skeleton width={96} height={36} />
    </div>
  </div>
)
