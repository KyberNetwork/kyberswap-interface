import { t } from '@lingui/macro'
import { useEffect, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useUserPositionsQuery } from 'services/zapEarn'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/ic_earn_not_found.svg'
import LocalLoader from 'components/LocalLoader'
import { useActiveWeb3React } from 'hooks'

import { EmptyPositionText, PositionPageWrapper } from '../UserPositions/styles'
import useLiquidityWidget from '../useLiquidityWidget'
import PositionDetailHeader from './Header'
import LeftSection from './LeftSection'
import RightSection from './RightSection'
import { MainSection, PositionAction, PositionActionWrapper, PositionDetailWrapper } from './styles'

export interface ParsedPosition {
  id: string
  dex: string
  dexImage: string
  chainId: number
  chainName: string
  chainLogo: string
  poolAddress: string
  tokenAddress: string
  token0Logo: string
  token1Logo: string
  token0Symbol: string
  token1Symbol: string
  poolFee: number
  status: string
  totalValue: number
  apr: number
  token0TotalAmount: number
  token1TotalAmount: number
  minPrice: number
  maxPrice: number
  pairRate: number
  totalUnclaimedFee: number
  token0UnclaimedAmount: number
  token1UnclaimedAmount: number
  token0UnclaimedValue: number
  token1UnclaimedValue: number
  totalEarnedFee: number
}

const PositionDetail = () => {
  const firstLoading = useRef(false)

  const { account } = useActiveWeb3React()
  const { id } = useParams()
  const { liquidityWidget, handleOpenZapInWidget } = useLiquidityWidget()
  const { data: userPosition, isLoading } = useUserPositionsQuery(
    { addresses: account || '', positionId: id },
    { skip: !account, pollingInterval: 15_000 },
  )

  const position: ParsedPosition | undefined = useMemo(() => {
    if (!userPosition?.[0]) return
    const position = userPosition?.[0]

    return {
      id: position.tokenId,
      dex: position.pool.project || '',
      dexImage: position.pool.projectLogo || '',
      chainId: position.chainId,
      chainName: position.chainName,
      chainLogo: position.chainLogo || '',
      poolAddress: position.pool.poolAddress || '',
      tokenAddress: position.tokenAddress,
      token0Logo: position.pool.tokenAmounts[0]?.token.logo || '',
      token1Logo: position.pool.tokenAmounts[1]?.token.logo || '',
      token0Symbol: position.pool.tokenAmounts[0]?.token.symbol || '',
      token1Symbol: position.pool.tokenAmounts[1]?.token.symbol || '',
      poolFee: position.pool.fees?.[0],
      status: position.status,
      totalValue: position.currentPositionValue,
      apr: position.apr || 0,
      token0TotalAmount: position
        ? position.currentAmounts[0]?.quotes.usd.value / position.currentAmounts[0]?.quotes.usd.price
        : 0,
      token1TotalAmount: position
        ? position.currentAmounts[1]?.quotes.usd.value / position.currentAmounts[1]?.quotes.usd.price
        : 0,
      minPrice: position.minPrice || 0,
      maxPrice: position.maxPrice || 0,
      pairRate: position.pool.price || 0,
      totalUnclaimedFee:
        (position.feePending?.[0].quotes.usd.value || 0) + (position.feePending?.[1].quotes.usd.value || 0),
      token0UnclaimedAmount: position.feePending[0]?.quotes.usd.value / position.feePending[0]?.quotes.usd.price,
      token1UnclaimedAmount: position.feePending[1]?.quotes.usd.value / position.feePending[1]?.quotes.usd.price,
      token0UnclaimedValue: position.feePending[0]?.quotes.usd.value,
      token1UnclaimedValue: position.feePending[1]?.quotes.usd.value,
      totalEarnedFee:
        position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0) +
        position.feesClaimed.reduce((a, b) => a + b.quotes.usd.value, 0),
    }
  }, [userPosition])

  const onOpenIncreaseLiquidityWidget = () => {
    if (!position) return
    handleOpenZapInWidget(
      {
        exchange: position.dex,
        chainId: position.chainId,
        address: position.poolAddress,
      },
      position.id,
    )
  }

  useEffect(() => {
    if (!firstLoading.current && !isLoading) {
      firstLoading.current = true
    }
  }, [isLoading])

  return (
    <>
      {liquidityWidget}
      <PositionPageWrapper>
        {isLoading && !firstLoading.current ? (
          <LocalLoader />
        ) : !!position ? (
          <>
            <PositionDetailHeader position={position} />
            <PositionDetailWrapper>
              <MainSection>
                <LeftSection position={position} />
                <RightSection position={position} />
              </MainSection>
              <PositionActionWrapper>
                <PositionAction outline>{t`Remove Liquidity`}</PositionAction>
                <PositionAction onClick={onOpenIncreaseLiquidityWidget}>{t`Add Liquidity`}</PositionAction>
              </PositionActionWrapper>
            </PositionDetailWrapper>
          </>
        ) : (
          <EmptyPositionText>
            <IconEarnNotFound />
            {t`No position found!`}
          </EmptyPositionText>
        )}
      </PositionPageWrapper>
    </>
  )
}

export default PositionDetail
