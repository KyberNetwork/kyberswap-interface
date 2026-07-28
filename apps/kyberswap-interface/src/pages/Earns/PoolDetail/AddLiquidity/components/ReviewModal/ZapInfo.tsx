import { NATIVE_TOKEN_ADDRESS, Token, ZapRouteDetail } from '@kyber/schema'
import { useMemo } from 'react'

import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import type { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { getInputTokenItems, getNetworkInfo } from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import { formatDisplayNumber } from 'utils/numbers'

type ZapInfoProps = {
  chainId: number
  route: ZapRouteDetail
  tokenInput: ZapState['tokenInput']
}

const getTokenPrice = ({
  token,
  prices,
  wrappedNativeAddress,
}: {
  token: Token
  prices: Record<string, number>
  wrappedNativeAddress?: string
}) => {
  const tokenAddress = token.address.toLowerCase()
  const directPrice = prices[tokenAddress]
  if (directPrice) return directPrice

  if (tokenAddress === NATIVE_TOKEN_ADDRESS.toLowerCase() && wrappedNativeAddress) {
    return prices[wrappedNativeAddress] || 0
  }

  return 0
}

const buildItems = ({
  tokens,
  amounts,
  prices,
  wrappedNativeAddress,
}: {
  tokens: Token[]
  amounts: string
  prices: Record<string, number>
  wrappedNativeAddress?: string
}) =>
  getInputTokenItems(tokens, amounts).map(item => ({
    ...item,
    usdValue: (item.amount || 0) * getTokenPrice({ token: item.token, prices, wrappedNativeAddress }),
  }))

const ZapInfo = ({ chainId, route, tokenInput }: ZapInfoProps) => {
  const wrappedNativeAddress = getNetworkInfo(chainId)?.wrappedToken.address?.toLowerCase()
  const tokens = tokenInput.tokens
  const amounts = tokenInput.amounts
  const prices = tokenInput.prices

  const items = useMemo(
    () => buildItems({ tokens, amounts, prices, wrappedNativeAddress }),
    [amounts, prices, tokens, wrappedNativeAddress],
  )

  const totalInputUsd = useMemo(
    () => Number(route.zapDetails.initialAmountUsd || items.reduce((total, item) => total + item.usdValue, 0)),
    [items, route.zapDetails.initialAmountUsd],
  )

  return (
    <Stack className="gap-3 rounded-xl bg-buttonGray px-4 py-3">
      <HStack className="items-center justify-between">
        <span className="text-subText">Zap-in Amount</span>
        <span className="font-medium text-text">
          {formatDisplayNumber(totalInputUsd, { style: 'currency', significantDigits: 6 })}
        </span>
      </HStack>

      <Stack className="gap-2">
        {items.map(item => (
          <HStack key={item.token.address} className="flex-wrap items-center gap-3">
            <HStack className="min-w-0 flex-wrap items-center gap-2">
              <TokenLogo src={item.token.logo} size={18} />
              <span className="text-text">
                {formatDisplayNumber(item.amount, { significantDigits: 6 })} {item.token.symbol}
              </span>
            </HStack>

            <span className="text-subText">
              ~{formatDisplayNumber(item.usdValue, { style: 'currency', significantDigits: 6 })}
            </span>
          </HStack>
        ))}
      </Stack>
    </Stack>
  )
}

export default ZapInfo
