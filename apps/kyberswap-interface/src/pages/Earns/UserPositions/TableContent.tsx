import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { Minus, Plus } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as IconClaim } from 'assets/svg/earn/ic_claim.svg'
import { ReactComponent as IconEarnNotFound } from 'assets/svg/earn/ic_earn_not_found.svg'
import CopyHelper from 'components/Copy'
import Loader from 'components/Loader'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { CurrencyRoundedImage, CurrencySecondImage } from 'pages/Earns/PoolExplorer/styles'
import { FeeInfo } from 'pages/Earns/PositionDetail/LeftSection'
import { PositionAction as PositionActionBtn } from 'pages/Earns/PositionDetail/styles'
import PriceRange from 'pages/Earns/UserPositions/PriceRange'
import {
  Badge,
  BadgeType,
  ChainImage,
  DexImage,
  Divider,
  EmptyPositionText,
  ImageContainer,
  PositionAction,
  PositionOverview,
  PositionRow,
  PositionTableBody,
  PositionValueLabel,
  PositionValueWrapper,
} from 'pages/Earns/UserPositions/styles'
import {
  CoreProtocol,
  DEXES_HIDE_TOKEN_ID,
  DEXES_SUPPORT_COLLECT_FEE,
  EarnDex,
  protocolGroupNameToExchangeMapping,
} from 'pages/Earns/constants'
import useCollectFees from 'pages/Earns/hooks/useCollectFees'
import { EarnPosition, ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { formatAprNumber, isForkFrom, isNativeToken, shortenAddress } from 'pages/Earns/utils'
import { getUnclaimedFeesInfo } from 'pages/Earns/utils/fees'
import { parsePosition } from 'pages/Earns/utils/positions'
import { useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export interface FeeInfoFromRpc extends FeeInfo {
  id: string
  timeRemaining: number
}

export default function TableContent({
  positions,
  feeInfoFromRpc,
  setFeeInfoFromRpc,
  onOpenZapInWidget,
  onOpenZapOut,
}: {
  positions: Array<EarnPosition> | undefined
  feeInfoFromRpc: FeeInfoFromRpc[]
  setFeeInfoFromRpc: (feeInfo: FeeInfoFromRpc[]) => void
  onOpenZapInWidget: (pool: { exchange: string; chainId?: number; address: string }, positionId?: string) => void
  onOpenZapOut: (position: { dex: string; chainId: number; poolAddress: string; id: string }) => void
}) {
  const { account } = useActiveWeb3React()
  const navigate = useNavigate()
  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [positionToClaim, setPositionToClaim] = useState<ParsedPosition | null>(null)

  const {
    claimModal: claimFeesModal,
    onOpenClaim: onOpenClaimFees,
    claiming: feesClaiming,
  } = useCollectFees({
    refetchAfterCollect: () => {
      handleFetchUnclaimedFee(positionToClaim)
      setPositionToClaim(null)
    },
  })

  const handleOpenIncreaseLiquidityWidget = (e: React.MouseEvent, position: EarnPosition) => {
    e.stopPropagation()
    const isUniv2 = isForkFrom(position.pool.project as EarnDex, CoreProtocol.UniswapV2)
    onOpenZapInWidget(
      {
        exchange: position.pool.project || '',
        chainId: position.chainId,
        address: position.pool.poolAddress,
      },
      isUniv2 ? account || '' : position.tokenId,
    )
  }

  const handleOpenZapOut = (e: React.MouseEvent, position: EarnPosition) => {
    e.stopPropagation()
    const isUniv2 = isForkFrom(position.pool.project as EarnDex, CoreProtocol.UniswapV2)
    onOpenZapOut({
      dex: position.pool.project || '',
      chainId: position.chainId,
      id: isUniv2 ? account || '' : position.tokenId,
      poolAddress: position.pool.poolAddress,
    })
  }

  const handleClaimFees = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()
    if (position.isUniv2 || feesClaiming || position.unclaimedFees === 0) return
    setPositionToClaim(position)
    onOpenClaimFees(position)
  }

  const handleFetchUnclaimedFee = useCallback(
    async (position: ParsedPosition | null) => {
      if (!position) return

      const feeFromRpc = await getUnclaimedFeesInfo(position)

      const { id } = position
      const feeInfoToAdd = {
        ...feeFromRpc,
        id,
        timeRemaining: 60 * 2,
      }

      const feeInfoFromRpcClone = [...feeInfoFromRpc]
      const index = feeInfoFromRpcClone.findIndex(feeInfo => feeInfo.id === id)
      if (index !== -1) feeInfoFromRpcClone[index] = feeInfoToAdd
      else feeInfoFromRpcClone.push(feeInfoToAdd)

      setFeeInfoFromRpc(feeInfoFromRpcClone)
    },
    [feeInfoFromRpc, setFeeInfoFromRpc],
  )

  return (
    <>
      {claimFeesModal}

      <PositionTableBody>
        {account && positions && positions.length > 0 ? (
          positions.map((position, index) => {
            const {
              id,
              status,
              chainId: poolChainId,
              minPrice,
              maxPrice,
              tokenId: positionId,
              chainLogo: chainImage,
            } = position

            const parsedPosition = parsePosition(position)

            const {
              dex,
              dexImage,
              token0Logo,
              token1Logo,
              token0Symbol,
              token1Symbol,
              token0Decimals,
              token1Decimals,
              token0Address,
              token1Address,
              poolFee,
              poolAddress,
              totalValue,
              unclaimedFees,
              token0UnclaimedAmount: token0UnclaimedAmountParsed,
              token1UnclaimedAmount: token1UnclaimedAmountParsed,
              isUniv2,
              nativeToken,
            } = parsedPosition

            const currentPrice = position.pool.price
            const tickSpacing = position.pool.tickSpacing
            const dexVersion = position.pool.project?.split(' ')?.[1] || ''
            const token0TotalProvide =
              position.currentAmounts[0]?.quotes.usd.value / position.currentAmounts[0]?.quotes.usd.price
            const token1TotalProvide =
              position.currentAmounts[1]?.quotes.usd.value / position.currentAmounts[1]?.quotes.usd.price
            const token0EarnedAmount =
              position.feePending[0]?.quotes.usd.value / position.feePending[0]?.quotes.usd.price +
              position.feesClaimed[0]?.quotes.usd.value / position.feesClaimed[0]?.quotes.usd.price
            const token1EarnedAmount =
              position.feePending[1]?.quotes.usd.value / position.feePending[1]?.quotes.usd.price +
              position.feesClaimed[1]?.quotes.usd.value / position.feesClaimed[1]?.quotes.usd.price
            const token0TotalAmount = token0TotalProvide + token0EarnedAmount
            const token1TotalAmount = token1TotalProvide + token1EarnedAmount
            const apr7d = position.apr
            const totalUnclaimedFee = position.feeInfo ? position.feeInfo.totalValue : unclaimedFees
            const token0UnclaimedAmount = position.feeInfo ? position.feeInfo.amount0 : token0UnclaimedAmountParsed
            const token1UnclaimedAmount = position.feeInfo ? position.feeInfo.amount1 : token1UnclaimedAmountParsed

            const posStatus = isUniv2 ? PositionStatus.IN_RANGE : status
            const claimDisabled = !DEXES_SUPPORT_COLLECT_FEE[dex as EarnDex] || totalUnclaimedFee === 0 || feesClaiming

            const isToken0Native = isNativeToken(token0Address, position.chainId as keyof typeof WETH)
            const isToken1Native = isNativeToken(token1Address, position.chainId as keyof typeof WETH)

            return (
              <PositionRow
                key={`${positionId}-${poolAddress}-${index}`}
                onClick={() =>
                  navigate({
                    pathname: APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', !isUniv2 ? id : poolAddress)
                      .replace(':chainId', poolChainId.toString())
                      .replace(':protocol', protocolGroupNameToExchangeMapping[dex]),
                  })
                }
              >
                <PositionOverview>
                  <Flex alignItems={'center'} sx={{ gap: 2 }} flexWrap={'wrap'}>
                    <ImageContainer>
                      <CurrencyRoundedImage src={token0Logo} alt="" />
                      <CurrencySecondImage src={token1Logo} alt="" />
                      <ChainImage src={NETWORKS_INFO[poolChainId as ChainId]?.icon || chainImage} alt="" />
                    </ImageContainer>
                    <Text marginLeft={-3} fontSize={upToSmall ? 15 : 16}>
                      {token0Symbol}/{token1Symbol}
                    </Text>
                    {poolFee && <Badge>{poolFee}%</Badge>}
                    <Badge type={posStatus === PositionStatus.IN_RANGE ? BadgeType.PRIMARY : BadgeType.WARNING}>
                      ● {posStatus === PositionStatus.IN_RANGE ? t`In range` : t`Out of range`}
                    </Badge>
                  </Flex>
                  <Flex alignItems={'center'} sx={{ gap: '10px' }}>
                    <Flex alignItems={'center'} sx={{ gap: 1 }}>
                      <DexImage src={dexImage} alt="" />
                      <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
                        {dexVersion}
                      </Text>
                    </Flex>
                    {DEXES_HIDE_TOKEN_ID[dex as EarnDex] ? null : (
                      <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
                        #{positionId}
                      </Text>
                    )}
                    <Badge type={BadgeType.SECONDARY}>
                      <Text fontSize={14}>{shortenAddress(poolAddress)}</Text>
                      <CopyHelper size={16} toCopy={poolAddress} />
                    </Badge>
                  </Flex>
                </PositionOverview>
                {upToLarge && !upToSmall && (
                  <Flex alignItems={'center'} justifyContent={'flex-end'} sx={{ gap: '16px' }}>
                    <PositionAction primary onClick={e => handleOpenIncreaseLiquidityWidget(e, position)}>
                      <Plus size={16} />
                    </PositionAction>
                    <PositionAction onClick={e => handleOpenZapOut(e, position)}>
                      <Minus size={16} />
                    </PositionAction>
                    <PositionAction disabled={claimDisabled} onClick={e => handleClaimFees(e, parsedPosition)}>
                      {feesClaiming && positionToClaim && positionToClaim.id === position.tokenId ? (
                        <Loader size={'16px'} stroke={'#7a7a7a'} />
                      ) : (
                        <IconClaim width={16} style={{ margin: '0 7px' }} />
                      )}
                    </PositionAction>
                  </Flex>
                )}
                <PositionValueWrapper>
                  <PositionValueLabel>{t`Value`}</PositionValueLabel>
                  <MouseoverTooltipDesktopOnly
                    text={
                      <>
                        <Text>
                          {formatDisplayNumber(token0TotalAmount, { significantDigits: 6 })} {token0Symbol}
                        </Text>
                        <Text>
                          {formatDisplayNumber(token1TotalAmount, { significantDigits: 6 })} {token1Symbol}
                        </Text>
                      </>
                    }
                    width="fit-content"
                    placement="bottom"
                  >
                    <Text>
                      {formatDisplayNumber(totalValue, {
                        style: 'currency',
                        significantDigits: 4,
                      })}
                    </Text>
                  </MouseoverTooltipDesktopOnly>
                </PositionValueWrapper>
                <PositionValueWrapper>
                  <PositionValueLabel>{t`APR`}</PositionValueLabel>
                  <Text>{formatAprNumber(apr7d)}%</Text>
                </PositionValueWrapper>
                <PositionValueWrapper align={upToLarge ? 'center' : ''}>
                  {!isUniv2 ? (
                    <>
                      <PositionValueLabel>{t`Unclaimed Fee`}</PositionValueLabel>
                      <MouseoverTooltipDesktopOnly
                        text={
                          <>
                            <Text>
                              {formatDisplayNumber(token0UnclaimedAmount, { significantDigits: 6 })}{' '}
                              {isToken0Native ? nativeToken.symbol : token0Symbol}
                            </Text>
                            <Text>
                              {formatDisplayNumber(token1UnclaimedAmount, { significantDigits: 6 })}{' '}
                              {isToken1Native ? nativeToken.symbol : token1Symbol}
                            </Text>
                          </>
                        }
                        width="fit-content"
                        placement="bottom"
                      >
                        <Text>
                          {formatDisplayNumber(totalUnclaimedFee, { style: 'currency', significantDigits: 4 })}
                        </Text>
                      </MouseoverTooltipDesktopOnly>
                    </>
                  ) : null}
                </PositionValueWrapper>
                <PositionValueWrapper align={upToSmall ? 'flex-end' : ''}>
                  <PositionValueLabel>{t`Bal`}</PositionValueLabel>
                  <Flex flexDirection={upToSmall ? 'row' : 'column'} sx={{ gap: 1.8 }}>
                    <Text>
                      {formatDisplayNumber(token0TotalProvide, { significantDigits: 4 })} {token0Symbol}
                    </Text>
                    {upToSmall && <Divider />}
                    <Text>
                      {formatDisplayNumber(token1TotalProvide, { significantDigits: 4 })} {token1Symbol}
                    </Text>
                  </Flex>
                </PositionValueWrapper>
                <PositionValueWrapper>
                  <PriceRange
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    currentPrice={currentPrice}
                    tickSpacing={tickSpacing}
                    token0Decimals={token0Decimals}
                    token1Decimals={token1Decimals}
                    dex={dex as EarnDex}
                  />
                </PositionValueWrapper>
                {(upToSmall || !upToLarge) && (
                  <Flex
                    alignItems={'center'}
                    justifyContent={upToSmall ? 'flex-end' : 'flex-start'}
                    sx={{ gap: '12px', zIndex: 1 }}
                  >
                    <MouseoverTooltipDesktopOnly
                      text={t`Add more liquidity to this position using any token(s) or migrate liquidity from your existing positions.`}
                      placement="top"
                    >
                      <PositionAction primary onClick={e => handleOpenIncreaseLiquidityWidget(e, position)}>
                        <Plus size={16} />
                      </PositionAction>
                    </MouseoverTooltipDesktopOnly>
                    <MouseoverTooltipDesktopOnly
                      text={t`Remove liquidity from this position by zapping out to any token(s) or migrating to another position.`}
                      placement="top"
                    >
                      <PositionAction onClick={e => handleOpenZapOut(e, position)}>
                        <Minus size={16} />
                      </PositionAction>
                    </MouseoverTooltipDesktopOnly>
                    <MouseoverTooltipDesktopOnly
                      text={!claimDisabled && t`Claim your unclaimed fees from this position.`}
                      placement="top"
                    >
                      <PositionAction disabled={claimDisabled} onClick={e => handleClaimFees(e, parsedPosition)}>
                        {feesClaiming && positionToClaim && positionToClaim.id === position.tokenId ? (
                          <Loader size={'16px'} stroke={'#7a7a7a'} />
                        ) : (
                          <IconClaim width={16} style={{ margin: '0 7px' }} />
                        )}
                      </PositionAction>
                    </MouseoverTooltipDesktopOnly>
                  </Flex>
                )}
              </PositionRow>
            )
          })
        ) : (
          <EmptyPositionText>
            <IconEarnNotFound />
            <Flex flexDirection={upToSmall ? 'column' : 'row'} sx={{ gap: 1 }} marginBottom={12}>
              <Text color={theme.subText}>{t`You don’t have any liquidity positions yet`}.</Text>
              <Link to={APP_PATHS.EARN_POOLS}>{t`Explore Liquidity Pools to get started`}!</Link>
            </Flex>
            {!account && <PositionActionBtn onClick={toggleWalletModal}>Connect Wallet</PositionActionBtn>}
          </EmptyPositionText>
        )}
      </PositionTableBody>
    </>
  )
}
