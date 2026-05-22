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
    <Stack gap={12} className="rounded-xl bg-buttonGray px-4 py-3">
      <HStack align="center" justify="space-between">
        <span className="text-subText">Zap-in Amount</span>
        <span className="font-medium text-text">
          {formatDisplayNumber(totalInputUsd, { style: 'currency', significantDigits: 6 })}
        </span>
      </HStack>

      <Stack gap={8}>
        {items.map(item => (
          <HStack key={item.token.address} align="center" gap={12} wrap="wrap">
            <HStack align="center" gap={8} minWidth={0} wrap="wrap">
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
