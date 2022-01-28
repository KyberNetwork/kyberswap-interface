import React, { useMemo, useState } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { useActiveWeb3React } from 'hooks'
import useTheme from '../../hooks/useTheme'
import { Link, RouteComponentProps } from 'react-router-dom'
import { useProAmmPositionsFromTokenId } from 'hooks/useProAmmPositions'
import { useToken } from 'hooks/Tokens'
import { useProAmmPositionTokenURI } from 'hooks/useProAmmPositionTokenURI'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { usePool } from 'hooks/usePools'
import { Position } from '@vutien/dmm-v3-sdk'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { getPriceOrderingFromPositionForUI } from './PositionListItem'
import { Currency, Price, Token } from '@vutien/sdk-core'
import { useProAmmPositionFees } from 'hooks/useProAmmPositionFees'
import { useProAmmClientSideTrade } from 'hooks/useProAmmClientSideTrade'
import { CurrencyAmount, TokenAmount } from '@vutien/sdk-core'

const useInverter = ({
  priceLower,
  priceUpper,
  quote,
  base,
  invert
}: {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
  invert?: boolean
}): {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} => {
  return {
    priceUpper: invert ? priceLower?.invert() : priceUpper,
    priceLower: invert ? priceUpper?.invert() : priceLower,
    quote: invert ? base : quote,
    base: invert ? quote : base
  }
}

function getRatio(
  lower: Price<Currency, Currency>,
  current: Price<Currency, Currency>,
  upper: Price<Currency, Currency>
) {
  try {
    if (!current.greaterThan(lower)) {
      return 100
    } else if (!current.lessThan(upper)) {
      return 0
    }

    const a = Number.parseFloat(lower.toSignificant(15))
    const b = Number.parseFloat(upper.toSignificant(15))
    const c = Number.parseFloat(current.toSignificant(15))

    const ratio = Math.floor((1 / ((Math.sqrt(a * b) - Math.sqrt(b * c)) / (c - Math.sqrt(b * c)) + 1)) * 100)

    if (ratio < 0 || ratio > 100) {
      throw Error('Out of range')
    }

    return ratio
  } catch {
    return undefined
  }
}

export default function PositionPage({
  match: {
    params: { tokenId: tokenIdFromUrl }
  }
}: RouteComponentProps<{ tokenId?: string }>) {
  const { chainId, account, library } = useActiveWeb3React()
  const theme = useTheme()

  const parsedTokenId = tokenIdFromUrl ? BigNumber.from(tokenIdFromUrl) : undefined
  const { loading, position: positionDetails } = useProAmmPositionsFromTokenId(parsedTokenId)

  const { token0: token0Address, token1: token1Address, fee: feeAmount, liquidity, tickLower, tickUpper, tokenId } =
    positionDetails || {}

  const removed = liquidity?.eq(0)

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)
  const metadata = useProAmmPositionTokenURI(parsedTokenId)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  // flag for receiving WETH
  const [receiveWETH, setReceiveWETH] = useState(false)

  // construct Position from details returned
  const [poolState, pool] = usePool(token0 ?? undefined, token1 ?? undefined, feeAmount)
  const position = useMemo(() => {
    if (pool && liquidity && typeof tickLower === 'number' && typeof tickUpper === 'number') {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)

  const pricesFromPosition = getPriceOrderingFromPositionForUI(position)
  const [manuallyInverted, setManuallyInverted] = useState(false)
  // handle manual inversion
  const { priceLower, priceUpper, base } = useInverter({
    priceLower: pricesFromPosition.priceLower,
    priceUpper: pricesFromPosition.priceUpper,
    quote: pricesFromPosition.quote,
    base: pricesFromPosition.base,
    invert: manuallyInverted
  })

  const inverted = token1 ? base?.equals(token1) : undefined
  const currencyQuote = inverted ? currency0 : currency1
  const currencyBase = inverted ? currency1 : currency0

  const ratio = useMemo(() => {
    return priceLower && pool && priceUpper
      ? getRatio(
          inverted ? priceUpper.invert() : priceLower,
          pool.token0Price,
          inverted ? priceLower.invert() : priceUpper
        )
      : undefined
  }, [inverted, pool, priceLower, priceUpper])

  const t = useProAmmPositionFees(
    pool ?? undefined,
    positionDetails?.tokenId,
    positionDetails?.liquidity,
    pool && positionDetails
      ? new Position({
          pool: pool,
          liquidity: positionDetails.liquidity.toString(),
          tickLower: positionDetails.tickLower,
          tickUpper: positionDetails.tickUpper
        })
      : undefined,
    receiveWETH
  )
  console.log('======useProAmmPositionFees', t)

  return <>PositionPage</>
}
