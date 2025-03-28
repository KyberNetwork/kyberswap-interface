import { ChainId, CurrencyAmount, Token, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { Minus, Plus } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { PositionStatus, EarnPosition } from 'pages/Earns/types'

import { ReactComponent as IconClaim } from 'assets/svg/ic_claim.svg'
import { ReactComponent as IconEarnNotFound } from 'assets/svg/ic_earn_not_found.svg'
import CopyHelper from 'components/Copy'
import Loader from 'components/Loader'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'
import { useAllTransactions } from 'state/transactions/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { getReadingContract } from 'utils/getContract'
import { formatDisplayNumber } from 'utils/numbers'

import { CurrencyRoundedImage, CurrencySecondImage } from 'pages/Earns/PoolExplorer/styles'
import { FeeInfo } from 'pages/Earns/PositionDetail/LeftSection'
import { PositionAction as PositionActionBtn } from 'pages/Earns/PositionDetail/styles'
import ClaimFeeModal, { PositionToClaim, isNativeToken } from 'pages/Earns/ClaimFeeModal'
import {
  DEXES_SUPPORT_COLLECT_FEE,
  DEXES_HIDE_TOKEN_ID,
  NFT_MANAGER_ABI,
  NFT_MANAGER_CONTRACT,
  EarnDex,
} from 'pages/Earns/constants'
import { formatAprNumber } from 'pages/Earns/utils'
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
  const { library } = useWeb3React()
  const navigate = useNavigate()
  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const allTransactions = useAllTransactions(true)

  const [claiming, setClaiming] = useState(false)
  const [claimTx, setClaimTx] = useState<string | null>(null)
  const [positionToClaim, setPositionToClaim] = useState<PositionToClaim | null>(null)
  const [feeInfoToClaim, setFeeInfoToClaim] = useState<FeeInfo | null>(null)

  const handleOpenIncreaseLiquidityWidget = (e: React.MouseEvent, position: EarnPosition) => {
    e.stopPropagation()
    onOpenZapInWidget(
      {
        exchange: position.pool.project || '',
        chainId: position.chainId,
        address: position.pool.poolAddress,
      },
      position.pool.project === EarnDex.DEX_UNISWAPV2 ? account || '' : position.tokenId,
    )
  }

  const handleOpenZapOut = (e: React.MouseEvent, position: EarnPosition) => {
    e.stopPropagation()
    onOpenZapOut({
      dex: position.pool.project || '',
      chainId: position.chainId,
      id: position.pool.project === EarnDex.DEX_UNISWAPV2 ? account || '' : position.tokenId,
      poolAddress: position.pool.poolAddress,
    })
  }

  const handleClaimFee = (e: React.MouseEvent, position: EarnPosition) => {
    e.stopPropagation()
    const totalUnclaimedFees = position.feeInfo
      ? position.feeInfo.totalValue
      : position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0)
    const isUniv2 = position.pool.project === EarnDex.DEX_UNISWAPV2
    if (isUniv2 || claiming || totalUnclaimedFees === 0) return
    setPositionToClaim({
      id: position.tokenId,
      dex: position.pool.project || '',
      chainId: position.chainId,
      token0Address: position.pool.tokenAmounts[0]?.token.address || '',
      token1Address: position.pool.tokenAmounts[1]?.token.address || '',
      token0Symbol: position.pool.tokenAmounts[0]?.token.symbol || '',
      token1Symbol: position.pool.tokenAmounts[1]?.token.symbol || '',
      token0Logo: position.pool.tokenAmounts[0]?.token.logo || '',
      token1Logo: position.pool.tokenAmounts[1]?.token.logo || '',
      chainLogo: position.chainLogo || '',
    })
    setFeeInfoToClaim({
      balance0: position.feeInfo ? position.feeInfo.balance0 : position.feePending[0].balance,
      balance1: position.feeInfo ? position.feeInfo.balance1 : position.feePending[1].balance,
      amount0: position.feeInfo
        ? position.feeInfo.amount0
        : (position.feePending[0]?.quotes.usd.value / position.feePending[0]?.quotes.usd.price).toString(),
      amount1: position.feeInfo
        ? position.feeInfo.amount1
        : (position.feePending[1]?.quotes.usd.value / position.feePending[1]?.quotes.usd.price).toString(),
      value0: position.feeInfo ? position.feeInfo.value0 : position.feePending[0]?.quotes.usd.value,
      value1: position.feeInfo ? position.feeInfo.value1 : position.feePending[1]?.quotes.usd.value,
      totalValue: totalUnclaimedFees,
    })
  }

  const handleFetchUnclaimedFee = useCallback(
    async (id: string | undefined) => {
      if (!id || !library) return
      const position = positions?.find(position => position.tokenId === id)

      if (!position) return
      const nftManagerContractOfDex = NFT_MANAGER_CONTRACT[position.pool.project as keyof typeof NFT_MANAGER_CONTRACT]
      const nftManagerContract =
        typeof nftManagerContractOfDex === 'string'
          ? nftManagerContractOfDex
          : nftManagerContractOfDex[position.chainId as keyof typeof nftManagerContractOfDex]
      const nftManagerAbi = NFT_MANAGER_ABI[position.dex as keyof typeof NFT_MANAGER_ABI]

      if (!nftManagerAbi) return
      const contract = getReadingContract(nftManagerContract, nftManagerAbi, library)

      if (!contract) return
      const maxUnit = '0x' + (2n ** 128n - 1n).toString(16)
      const token0Decimals = position.pool.tokenAmounts[0]?.token.decimals
      const token1Decimals = position.pool.tokenAmounts[1]?.token.decimals
      const token0Address = position.pool.tokenAmounts[0]?.token.address
      const token1Address = position.pool.tokenAmounts[1]?.token.address

      const owner = await contract.ownerOf(id)

      const results = await contract.callStatic.collect(
        {
          tokenId: id,
          recipient: owner,
          amount0Max: maxUnit,
          amount1Max: maxUnit,
        },
        { from: owner },
      )
      const balance0 = results.amount0.toString()
      const balance1 = results.amount1.toString()
      const amount0 = CurrencyAmount.fromRawAmount(
        new Token(position.chainId, token0Address, token0Decimals),
        balance0,
      ).toExact()
      const amount1 = CurrencyAmount.fromRawAmount(
        new Token(position.chainId, token1Address, token1Decimals),
        balance1,
      ).toExact()

      const token0Price = position.currentAmounts[0]?.token.price
      const token1Price = position.currentAmounts[1]?.token.price

      const feeInfoToAdd = {
        id,
        balance0,
        balance1,
        amount0,
        amount1,
        value0: parseFloat(amount0) * token0Price,
        value1: parseFloat(amount1) * token1Price,
        totalValue: parseFloat(amount0) * token0Price + parseFloat(amount1) * token1Price,
        timeRemaining: 30,
      }

      const feeInfoFromRpcClone = [...feeInfoFromRpc]
      const index = feeInfoFromRpcClone.findIndex(feeInfo => feeInfo.id === id)
      if (index !== -1) feeInfoFromRpcClone[index] = feeInfoToAdd
      else feeInfoFromRpcClone.push(feeInfoToAdd)

      setFeeInfoFromRpc(feeInfoFromRpcClone)
    },
    [feeInfoFromRpc, library, positions, setFeeInfoFromRpc],
  )

  useEffect(() => {
    if (claimTx && allTransactions && allTransactions[claimTx]) {
      const tx = allTransactions[claimTx]
      if (tx?.[0].receipt && tx?.[0].receipt.status === 1) {
        setClaiming(false)
        setClaimTx(null)
        handleFetchUnclaimedFee(positionToClaim?.id)
        setPositionToClaim(null)
        setFeeInfoToClaim(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTransactions])

  return (
    <>
      {positionToClaim && feeInfoToClaim && (
        <ClaimFeeModal
          claiming={claiming}
          setClaiming={setClaiming}
          setClaimTx={setClaimTx}
          position={positionToClaim}
          feeInfo={feeInfoToClaim}
          onClose={() => {
            setPositionToClaim(null)
            setFeeInfoToClaim(null)
          }}
        />
      )}
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

            const currentPrice = position.pool.price
            const tickSpacing = position.pool.tickSpacing
            const dex = position.pool.project
            const dexImage = position.pool.projectLogo
            const dexVersion = position.pool.project?.split(' ')?.[1] || ''
            const token0Logo = position.pool.tokenAmounts[0]?.token.logo
            const token1Logo = position.pool.tokenAmounts[1]?.token.logo
            const token0Symbol = position.pool.tokenAmounts[0]?.token.symbol
            const token1Symbol = position.pool.tokenAmounts[1]?.token.symbol
            const token0Decimals = position.pool.tokenAmounts[0]?.token.decimals
            const token1Decimals = position.pool.tokenAmounts[1]?.token.decimals
            const poolFee = position.pool.fees?.[0]
            const poolAddress = position.pool.poolAddress
            const totalValue = position.currentPositionValue
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
            const totalUnclaimedFee = position.feeInfo
              ? position.feeInfo.totalValue
              : position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0)
            const token0UnclaimedAmount = position.feeInfo
              ? position.feeInfo.amount0
              : position.feePending[0]?.quotes.usd.value / position.feePending[0]?.quotes.usd.price
            const token1UnclaimedAmount = position.feeInfo
              ? position.feeInfo.amount1
              : position.feePending[1]?.quotes.usd.value / position.feePending[1]?.quotes.usd.price

            const isUniv2 = dex === EarnDex.DEX_UNISWAPV2
            const posStatus = isUniv2 ? PositionStatus.IN_RANGE : status
            const claimDisabled = !DEXES_SUPPORT_COLLECT_FEE[dex as EarnDex] || totalUnclaimedFee === 0 || claiming

            const token0Address = position.pool.tokenAmounts[0]?.token.address || ''
            const token1Address = position.pool.tokenAmounts[1]?.token.address || ''

            const isToken0Native = isNativeToken(token0Address, position.chainId as keyof typeof WETH)
            const isToken1Native = isNativeToken(token1Address, position.chainId as keyof typeof WETH)
            const nativeToken = NETWORKS_INFO[position.chainId as keyof typeof NETWORKS_INFO].nativeToken

            return (
              <PositionRow
                key={`${positionId}-${poolAddress}-${index}`}
                onClick={() =>
                  navigate({
                    pathname: APP_PATHS.EARN_POSITION_DETAIL.replace(
                      ':positionId',
                      dex !== EarnDex.DEX_UNISWAPV2 ? id : poolAddress,
                    )
                      .replace(':chainId', poolChainId.toString())
                      .replace(':protocol', dex),
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
                      <Text fontSize={14}>{shortenAddress(poolChainId, poolAddress, 4)}</Text>
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
                    <PositionAction disabled={claimDisabled} onClick={e => handleClaimFee(e, position)}>
                      {claiming && positionToClaim && positionToClaim.id === position.tokenId ? (
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
                  <Text>{formatAprNumber(apr7d * 100)}%</Text>
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
                      <PositionAction disabled={claimDisabled} onClick={e => handleClaimFee(e, position)}>
                        {claiming && positionToClaim && positionToClaim.id === position.tokenId ? (
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
