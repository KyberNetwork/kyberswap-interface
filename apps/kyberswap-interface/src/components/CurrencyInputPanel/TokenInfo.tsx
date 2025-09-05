import { shortenAddress } from '@kyber/utils/dist/crypto'
import { Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Info } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { keyframes } from 'styled-components'

import CopyHelper from 'components/Copy'
import Tooltip from 'components/Tooltip'
import { TOKEN_API_URL } from 'constants/env'
import { PAIR_CATEGORY } from 'constants/index'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const glow = keyframes`
  0% {
    filter: drop-shadow(0 0 2px rgba(255, 178, 55, 0.2));
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(255, 178, 55, 0.8)) drop-shadow(0 0 12px rgba(255, 178, 55, 0.4));
  }
  100% {
    filter: drop-shadow(0 0 2px rgba(255, 178, 55, 0.2));
  }
`

const StyledInfo = styled(Info)<{ $warning: boolean }>`
  animation: ${props => (props.$warning ? glow : 'none')} 1.5s ease-in-out infinite;
`

interface PriceResponse {
  data: { [chainId: string]: { [address: string]: { PriceBuy: number; PriceSell: number } } }
}

enum TOKEN_CATEGORY {
  STABLE = 'stablePair',
  COMMON = 'commonPair',
  EXOTIC = 'exoticPair',
  HIGH_VOLATILITY = 'highVolatilityPair',
}

const SPREAD_THRESHOLD = {
  [TOKEN_CATEGORY.STABLE]: 0.1,
  [TOKEN_CATEGORY.COMMON]: 0.5,
  [TOKEN_CATEGORY.EXOTIC]: 2,
  [TOKEN_CATEGORY.HIGH_VOLATILITY]: 5,
}

export default function TokenInfo({ token, isNativeToken = false }: { token: Token; isNativeToken?: boolean }) {
  const theme = useTheme()

  const [tokenCategory, setTokenCategory] = useState<TOKEN_CATEGORY | null>(null)
  const [priceInfo, setPriceInfo] = useState<{ buyPrice?: number; sellPrice?: number; spread?: number } | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(infoRef, () => setShowTooltip(false))

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const spreadThreshold = useMemo(
    () => (!tokenCategory ? null : SPREAD_THRESHOLD[tokenCategory] || SPREAD_THRESHOLD[PAIR_CATEGORY.EXOTIC]),
    [tokenCategory],
  )

  const spreadCheck = useMemo(
    () => ({
      warning:
        spreadThreshold && priceInfo?.spread && priceInfo?.buyPrice && priceInfo?.sellPrice
          ? priceInfo.spread > spreadThreshold && priceInfo.buyPrice > priceInfo.sellPrice
          : false,
      display:
        priceInfo?.spread && priceInfo?.buyPrice && priceInfo?.sellPrice
          ? priceInfo.buyPrice > priceInfo.sellPrice
          : false,
    }),
    [priceInfo?.buyPrice, priceInfo?.sellPrice, priceInfo?.spread, spreadThreshold],
  )

  useEffect(() => {
    const getOnChainPrice = async () => {
      const r: PriceResponse = await fetch(`${TOKEN_API_URL}/v1/public/tokens/prices`, {
        method: 'POST',
        body: JSON.stringify({
          [token.chainId]: [token.address],
        }),
      }).then(res => res.json())

      const buyPrice = r.data[token.chainId][token.address]?.PriceBuy
      const sellPrice = r.data[token.chainId][token.address]?.PriceSell

      const spread =
        buyPrice === undefined || sellPrice === undefined
          ? undefined
          : (Math.abs(buyPrice - sellPrice) / ((buyPrice + sellPrice) / 2)) * 100

      setPriceInfo({ buyPrice, sellPrice, spread })
    }

    getOnChainPrice()
    const fetchPriceInterval = setInterval(getOnChainPrice, 15_000)

    return () => clearInterval(fetchPriceInterval)
  }, [token.address, token.chainId])

  useEffect(() => {
    if (!token) return

    const getTokenCategory = async () => {
      const r = await fetch(
        `${TOKEN_API_URL}/v1/public/category/token?tokens=${token.address}&chainId=${token.chainId}`,
      ).then(res => res.json())

      const cat = r.data.find((item: any) => item.token.toLowerCase() === token.address.toLowerCase())?.category

      if (cat) setTokenCategory(cat as TOKEN_CATEGORY)
    }

    getTokenCategory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token.address])

  const tooltipContent = (
    <Flex flexDirection="column" sx={{ gap: '2px' }}>
      <Flex alignItems="center" sx={{ gap: '2px' }}>
        <Text>{isNativeToken ? 'Native token' : shortenAddress(token?.wrapped.address || '', 6)}</Text>
        {!isNativeToken ? <CopyHelper size={14} toCopy={token?.wrapped.address} /> : null}
      </Flex>
      <Flex alignItems="center" sx={{ gap: '4px' }}>
        <Text>{t`Buy`}:</Text>
        <Text color={priceInfo?.buyPrice ? theme.primary : theme.text}>
          {priceInfo?.buyPrice
            ? formatDisplayNumber(priceInfo?.buyPrice, { significantDigits: 8, style: 'currency' })
            : 'N/A'}
        </Text>
      </Flex>
      <Flex alignItems="center" sx={{ gap: '4px' }}>
        <Text>{t`Sell`}:</Text>
        <Text color={priceInfo?.sellPrice ? theme.blue : theme.text}>
          {priceInfo?.sellPrice
            ? formatDisplayNumber(priceInfo?.sellPrice, { significantDigits: 8, style: 'currency' })
            : 'N/A'}
        </Text>
      </Flex>
      {spreadCheck.display ? (
        <Flex alignItems="center" sx={{ gap: '4px' }}>
          <Text>{t`Spread`}:</Text>
          <Text color={spreadCheck.warning ? theme.warning : theme.text}>
            {priceInfo?.spread ? formatDisplayNumber(priceInfo?.spread, { significantDigits: 2 }) + '%' : 'N/A'}
          </Text>
        </Flex>
      ) : null}
      {spreadCheck.warning ? (
        <Text color={theme.warning} fontStyle="italic">
          {`The current difference between buy and sell is ${formatDisplayNumber(priceInfo?.spread, {
            significantDigits: 2,
          })}% of the mid point, which might be higher than usual for similar tokens.`}
        </Text>
      ) : null}
    </Flex>
  )

  return (
    <Flex
      width="fit-content"
      height="fit-content"
      marginTop="6px"
      marginLeft="4px"
      role="button"
      ref={infoRef}
      onClick={e => {
        e.stopPropagation()
        setShowTooltip(prev => !prev)
      }}
    >
      <Tooltip
        show={showTooltip}
        text={tooltipContent}
        delay={200}
        placement="top"
        width="fit-content"
        maxWidth={upToSmall ? '280px' : '400px'}
      >
        <StyledInfo
          color={spreadCheck.warning ? theme.warning : theme.subText}
          size={18}
          $warning={!!spreadCheck.warning}
        />
      </Tooltip>
    </Flex>
  )
}
