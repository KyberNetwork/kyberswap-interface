import { shortenAddress } from '@kyber/utils/dist/crypto'
import { Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { keyframes } from 'styled-components'

import CopyHelper from 'components/Copy'
import Tooltip from 'components/Tooltip'
import { TOKEN_API_URL } from 'constants/env'
import { PAIR_CATEGORY } from 'constants/index'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { usePairCategory } from 'state/swap/hooks'
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

const SPREAD_THRESHOLD = {
  [PAIR_CATEGORY.STABLE]: 0.1,
  ['commonPair']: 0.5,
  [PAIR_CATEGORY.HIGH_VOLATILITY]: 5,
  [PAIR_CATEGORY.EXOTIC]: 2,
}

export default function TokenInfo({
  nativeCurrency,
  isNativeToken = false,
}: {
  nativeCurrency: Token
  isNativeToken?: boolean
}) {
  const theme = useTheme()
  const cat = usePairCategory()

  const [priceInfo, setPriceInfo] = useState<{ buyPrice: number; sellPrice: number; spread: number } | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(infoRef, () => setShowTooltip(false))

  const spreadThreshold = useMemo(
    () => SPREAD_THRESHOLD[cat as keyof typeof SPREAD_THRESHOLD] || SPREAD_THRESHOLD[PAIR_CATEGORY.EXOTIC],
    [cat],
  )

  const spreadWarning = useMemo(
    () => priceInfo?.spread && priceInfo.spread > spreadThreshold,
    [priceInfo?.spread, spreadThreshold],
  )

  useEffect(() => {
    const getOnChainPrice = async () => {
      const r: PriceResponse = await fetch(`${TOKEN_API_URL}/v1/public/tokens/prices`, {
        method: 'POST',
        body: JSON.stringify({
          [nativeCurrency.chainId]: [nativeCurrency.address],
        }),
      }).then(res => res.json())

      const buyPrice = r.data[nativeCurrency.chainId][nativeCurrency.address].PriceBuy
      const sellPrice = r.data[nativeCurrency.chainId][nativeCurrency.address].PriceSell
      const spread = (Math.abs(buyPrice - sellPrice) / ((buyPrice + sellPrice) / 2)) * 100

      setPriceInfo({ buyPrice, sellPrice, spread })
    }

    getOnChainPrice()
    const fetchPriceInterval = setInterval(getOnChainPrice, 15_000)

    return () => clearInterval(fetchPriceInterval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tooltipContent = (
    <Flex flexDirection="column" fontSize="14px" sx={{ gap: '2px' }}>
      <Flex alignItems="center" sx={{ gap: '2px' }}>
        <Text>{isNativeToken ? 'Native token' : shortenAddress(nativeCurrency?.wrapped.address || '', 6)}</Text>
        {!isNativeToken ? <CopyHelper size={14} toCopy={nativeCurrency?.wrapped.address} /> : null}
      </Flex>
      <Flex alignItems="center" sx={{ gap: '4px' }}>
        <Text>{t`Buy`}:</Text>
        <Text color={theme.primary}>
          {priceInfo?.buyPrice
            ? formatDisplayNumber(priceInfo?.buyPrice, { significantDigits: 8, style: 'currency' })
            : '--'}
        </Text>
      </Flex>
      <Flex alignItems="center" sx={{ gap: '4px' }}>
        <Text>{t`Sell`}:</Text>
        <Text color={theme.blue}>
          {priceInfo?.sellPrice
            ? formatDisplayNumber(priceInfo?.sellPrice, { significantDigits: 8, style: 'currency' })
            : '--'}
        </Text>
      </Flex>
      <Flex alignItems="center" sx={{ gap: '4px' }}>
        <Text>{t`Spread`}:</Text>
        <Text color={spreadWarning ? theme.red : theme.text}>
          {priceInfo?.spread ? formatDisplayNumber(priceInfo?.spread, { significantDigits: 2 }) + '%' : '--'}
        </Text>
      </Flex>
      {spreadWarning ? (
        <Text color={theme.warning}>
          {`The current difference between buy and sell is ${formatDisplayNumber(priceInfo?.spread, {
            significantDigits: 2,
          })}%, which might be higher than usual for similar tokens.`}
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
        maxWidth="400px"
      >
        <StyledInfo color={spreadWarning ? theme.warning : theme.subText} size={18} $warning={!!spreadWarning} />
      </Tooltip>
    </Flex>
  )
}
