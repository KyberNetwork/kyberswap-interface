import { NATIVE_TOKEN_ADDRESS, Token, ZapRouteDetail } from '@kyber/schema'
import { useMemo } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import type { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { getInputTokenItems, getNetworkInfo } from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import { formatDisplayNumber } from 'utils/numbers'

const Card = styled(Stack)`
  padding: 20px;
  border-radius: 20px;
  background: ${({ theme }) => theme.buttonGray};
`

const SectionLabel = styled(Text)`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
`

const TotalText = styled(Text)`
  font-weight: 500;
`

type ZapInfoProps = {
  chainId: number
  route: ZapRouteDetail
  tokenInput: ZapState['tokenInput']
}

const getPoolTokenPrice = (token?: Token) => {
  const poolToken = token as (Token & { price?: number }) | undefined
  return poolToken?.price || 0
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

  return getPoolTokenPrice(token)
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
  const theme = useTheme()
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
    <Card gap={16}>
      <HStack align="center" justify="space-between">
        <SectionLabel>Zap-in Amount</SectionLabel>
        <TotalText color={theme.text}>
          {formatDisplayNumber(totalInputUsd, { style: 'currency', significantDigits: 6 })}
        </TotalText>
      </HStack>

      <Stack gap={12}>
        {items.map(item => (
          <HStack key={item.token.address} align="center" gap={12} wrap="wrap">
            <HStack minWidth={0} align="center" gap={8} wrap="wrap">
              <TokenLogo src={item.token.logo} size={18} />
              <Text color={theme.text}>
                {formatDisplayNumber(item.amount, { significantDigits: 6 })} {item.token.symbol}
              </Text>
            </HStack>

            <SectionLabel>
              ~{formatDisplayNumber(item.usdValue, { style: 'currency', significantDigits: 6 })}
            </SectionLabel>
          </HStack>
        ))}
      </Stack>
    </Card>
  )
}

export default ZapInfo
