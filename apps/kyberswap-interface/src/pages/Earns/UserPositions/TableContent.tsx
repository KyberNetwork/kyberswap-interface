import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { ArrowRightCircle } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/earn/ic_earn_not_found.svg'
import { ReactComponent as IconKem } from 'assets/svg/kyber/kem.svg'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { FeeInfo } from 'pages/Earns/PositionDetail/LeftSection'
import { PositionAction as PositionActionBtn } from 'pages/Earns/PositionDetail/styles'
import DropdownAction from 'pages/Earns/UserPositions/DropdownAction'
import PriceRange from 'pages/Earns/UserPositions/PriceRange'
import {
  Badge,
  BadgeType,
  ChainImage,
  DexImage,
  Divider,
  EmptyPositionText,
  ImageContainer,
  PositionActionWrapper,
  PositionOverview,
  PositionRow,
  PositionTableBody,
  PositionValueLabel,
  PositionValueWrapper,
} from 'pages/Earns/UserPositions/styles'
import { CoreProtocol, DEXES_SUPPORT_COLLECT_FEE, EarnDex } from 'pages/Earns/constants'
import useCollectFees from 'pages/Earns/hooks/useCollectFees'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import { ZapOutInfo } from 'pages/Earns/hooks/useZapOutWidget'
import { EarnPosition, ParsedPosition, PositionStatus } from 'pages/Earns/types'
import {
  formatAprNumber,
  getFullUnclaimedFeesInfo,
  getNftManagerContract,
  isForkFrom,
  parseRawPosition,
} from 'pages/Earns/utils'
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
  onOpenZapInWidget: ({ pool, positionId }: ZapInInfo) => void
  onOpenZapOut: ({ position }: ZapOutInfo) => void
}) {
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
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

  const { rewardInfo } = useKemRewards()

  const handleFetchUnclaimedFee = useCallback(
    async (position: ParsedPosition | null) => {
      if (!position || !library) return

      const { token0, token1, chain, dex, tokenId } = position
      const contract = getNftManagerContract(dex.id, chain.id, library)

      if (!contract) return
      const owner = await contract.ownerOf(position.tokenId)

      const feeFromRpc = await getFullUnclaimedFeesInfo({
        contract,
        positionOwner: owner,
        tokenId,
        chainId: chain.id,
        token0,
        token1,
      })
      const feeInfoToAdd = {
        ...feeFromRpc,
        id: tokenId,
        timeRemaining: 30,
      }

      const feeInfoFromRpcClone = [...feeInfoFromRpc]
      const index = feeInfoFromRpcClone.findIndex(feeInfo => feeInfo.id === tokenId)
      if (index !== -1) feeInfoFromRpcClone[index] = feeInfoToAdd
      else feeInfoFromRpcClone.push(feeInfoToAdd)

      setFeeInfoFromRpc(feeInfoFromRpcClone)
    },
    [feeInfoFromRpc, library, setFeeInfoFromRpc],
  )

  const handleOpenIncreaseLiquidityWidget = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()
    const isUniv2 = isForkFrom(position.dex.id, CoreProtocol.UniswapV2)
    onOpenZapInWidget({
      pool: {
        dex: position.dex.id,
        chainId: position.chain.id,
        address: position.pool.address,
      },
      positionId: isUniv2 ? account || '' : position.tokenId,
    })
  }

  const handleOpenZapOut = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()
    const isUniv2 = isForkFrom(position.dex.id, CoreProtocol.UniswapV2)
    onOpenZapOut({
      position: {
        dex: position.dex.id,
        chainId: position.chain.id,
        id: isUniv2 ? account || '' : position.tokenId,
        poolAddress: position.pool.address,
      },
    })
  }

  const handleClaimFees = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()
    if (position.pool.isUniv2 || feesClaiming || position.unclaimedFees === 0) return
    onOpenClaimFees(position)
  }

  const handleMigrateToKem = (e: React.MouseEvent, position: EarnPosition) => {
    e.stopPropagation()
    e.preventDefault()
    console.log('migrate to kem', position)
  }

  const emptyPosition = (
    <EmptyPositionText>
      <IconEarnNotFound />
      <Flex flexDirection={upToSmall ? 'column' : 'row'} sx={{ gap: 1 }} marginBottom={12}>
        <Text color={theme.subText}>{t`You don't have any liquidity positions yet`}.</Text>
        <Link to={APP_PATHS.EARN_POOLS}>{t`Explore Liquidity Pools to get started`}!</Link>
      </Flex>
      {!account && <PositionActionBtn onClick={toggleWalletModal}>Connect Wallet</PositionActionBtn>}
    </EmptyPositionText>
  )

  return (
    <>
      {claimFeesModal}

      <PositionTableBody>
        {account && positions && positions.length > 0
          ? positions.map((position, index) => {
              const parsedPosition = parseRawPosition(position)
              const {
                id,
                tokenId,
                token0,
                token1,
                pool,
                dex,
                chain,
                totalValue,
                priceRange,
                apr,
                unclaimedFees,
                isInKemLm,
                kemPoolToMigrate,
                status,
              } = parsedPosition
              const claimDisabled = !DEXES_SUPPORT_COLLECT_FEE[dex.id as EarnDex] || unclaimedFees === 0 || feesClaiming

              const actions = (
                <DropdownAction
                  position={parsedPosition}
                  onOpenIncreaseLiquidityWidget={handleOpenIncreaseLiquidityWidget}
                  onOpenZapOut={handleOpenZapOut}
                  onClaimFee={handleClaimFees}
                  claimDisabled={claimDisabled}
                  claiming={feesClaiming}
                  positionToClaim={positionToClaim}
                  placement={index < positions.length - 2 ? 'bottom' : 'top'}
                />
              )

              const rewardNftInfo = rewardInfo?.nfts.find(nft => nft.nftId === tokenId)

              return (
                <PositionRow
                  key={`${tokenId}-${pool.address}-${index}`}
                  to={APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', !pool.isUniv2 ? id : pool.address)
                    .replace(':chainId', chain.id.toString())
                    .replace(':protocol', dex.id)}
                >
                  {/* Overview info */}
                  <PositionOverview>
                    <Flex alignItems={'center'} sx={{ gap: 2 }} flexWrap={'wrap'}>
                      <ImageContainer>
                        <TokenLogo src={token0.logo} />
                        <TokenLogo src={token1.logo} />
                        <ChainImage src={NETWORKS_INFO[chain.id as ChainId]?.icon || chain.logo} alt="" />
                      </ImageContainer>
                      <Text marginLeft={-3} fontSize={upToSmall ? 15 : 16}>
                        {token0.symbol}/{token1.symbol}
                      </Text>
                      {pool.fee && <Badge>{pool.fee}%</Badge>}
                    </Flex>
                    <Flex flexWrap={'wrap'} alignItems={'center'} sx={{ gap: '10px' }}>
                      <Flex alignItems={'center'} sx={{ gap: 1 }}>
                        <DexImage src={dex.logo} alt="" />
                        <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
                          {dex.version}
                        </Text>
                      </Flex>
                      {pool.isUniv2 ? null : (
                        <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
                          #{tokenId}
                        </Text>
                      )}
                      <Badge type={status === PositionStatus.IN_RANGE ? BadgeType.PRIMARY : BadgeType.WARNING}>
                        ● {status === PositionStatus.IN_RANGE ? t`In range` : t`Out of range`}
                      </Badge>
                    </Flex>
                  </PositionOverview>

                  {/* Actions for Tablet */}
                  {upToLarge && <PositionActionWrapper>{actions}</PositionActionWrapper>}

                  {/* Value info */}
                  <PositionValueWrapper>
                    <PositionValueLabel>{t`Value`}</PositionValueLabel>
                    <MouseoverTooltipDesktopOnly
                      text={
                        <>
                          <Text>
                            {formatDisplayNumber(token0.totalAmount, { significantDigits: 6 })} {token0.symbol}
                          </Text>
                          <Text>
                            {formatDisplayNumber(token1.totalAmount, { significantDigits: 6 })} {token1.symbol}
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

                  {/* APR info */}
                  <PositionValueWrapper>
                    <PositionValueLabel>{t`APR`}</PositionValueLabel>
                    <Flex alignItems={'center'} sx={{ gap: 1 }}>
                      <Text color={isInKemLm ? theme.primary : theme.text}>{formatAprNumber(apr * 100)}%</Text>
                      {!!kemPoolToMigrate && (
                        <MouseoverTooltipDesktopOnly
                          text={
                            <>
                              <Text>
                                {t`Migrate to exact same pair and fee tier on Uniswap v4 hook to earn extra rewards from the
                              Kyberswap Liquidity Mining Program.`}
                              </Text>
                              <Text color={theme.primary} sx={{ cursor: 'pointer' }}>
                                Migrate →
                              </Text>
                            </>
                          }
                          width="290px"
                          placement="bottom"
                        >
                          <ArrowRightCircle
                            size={16}
                            color={theme.primary}
                            onClick={e => handleMigrateToKem(e, position)}
                          />
                        </MouseoverTooltipDesktopOnly>
                      )}
                    </Flex>
                  </PositionValueWrapper>

                  {/* Unclaimed fees info */}
                  <PositionValueWrapper align={upToLarge ? 'flex-end' : ''}>
                    <PositionValueLabel>{t`Unclaimed Fee`}</PositionValueLabel>
                    <MouseoverTooltipDesktopOnly
                      text={
                        <>
                          <Text>
                            {formatDisplayNumber(token0.unclaimedAmount, { significantDigits: 6 })}{' '}
                            {token0.isNative ? pool.nativeToken.symbol : token0.symbol}
                          </Text>
                          <Text>
                            {formatDisplayNumber(token1.unclaimedAmount, { significantDigits: 6 })}{' '}
                            {token1.isNative ? pool.nativeToken.symbol : token1.symbol}
                          </Text>
                        </>
                      }
                      width="fit-content"
                      placement="bottom"
                    >
                      <Text>{formatDisplayNumber(unclaimedFees, { style: 'currency', significantDigits: 4 })}</Text>
                    </MouseoverTooltipDesktopOnly>
                  </PositionValueWrapper>

                  {/* Unclaimed rewards info */}
                  <PositionValueWrapper align={!upToLarge ? 'center' : ''}>
                    <PositionValueLabel>{t`Unclaimed rewards`}</PositionValueLabel>
                    <Flex alignItems={'center'} sx={{ gap: 1 }}>
                      {upToSmall && <IconKem width={20} height={20} />}
                      <Flex flexDirection={'column'} sx={{ gap: 1 }}>
                        {rewardNftInfo
                          ? rewardNftInfo.tokens.map((token, index) => (
                              <Text key={index}>
                                {formatDisplayNumber(token.amount, { significantDigits: 4 })} {token.symbol}
                              </Text>
                            ))
                          : null}
                      </Flex>
                    </Flex>
                  </PositionValueWrapper>

                  {!upToLarge && <div />}

                  {/* Balance info */}
                  <PositionValueWrapper align={upToSmall ? 'flex-end' : ''}>
                    <PositionValueLabel>{t`Balance`}</PositionValueLabel>
                    <Flex flexDirection={upToSmall ? 'row' : 'column'} sx={{ gap: 1.8 }}>
                      <Text>
                        {formatDisplayNumber(token0.totalProvide, { significantDigits: 4 })} {token0.symbol}
                      </Text>
                      {upToSmall && <Divider />}
                      <Text>
                        {formatDisplayNumber(token1.totalProvide, { significantDigits: 4 })} {token1.symbol}
                      </Text>
                    </Flex>
                  </PositionValueWrapper>

                  {/* Price range info */}
                  <PositionValueWrapper align={upToLarge ? 'flex-end' : ''}>
                    <PriceRange
                      minPrice={priceRange.min}
                      maxPrice={priceRange.max}
                      currentPrice={priceRange.current}
                      tickSpacing={pool.tickSpacing}
                      token0Decimals={token0.decimals}
                      token1Decimals={token1.decimals}
                      dex={dex.id as EarnDex}
                    />
                  </PositionValueWrapper>

                  {/* Actions info */}
                  {!upToLarge && <PositionValueWrapper align="flex-end">{actions}</PositionValueWrapper>}
                </PositionRow>
              )
            })
          : emptyPosition}
      </PositionTableBody>
    </>
  )
}
