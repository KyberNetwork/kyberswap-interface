import { ShareOption } from '@kyber/ui'
import { formatAprNumber as formatAprNum } from '@kyber/utils/dist/number'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Info, PlusCircle } from 'react-feather'
import { useNavigate, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { usePoolDetailQuery } from 'services/zapEarn'

import { ReactComponent as IconReposition } from 'assets/svg/earn/ic_reposition.svg'
import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as FarmingLmIcon } from 'assets/svg/kyber/kemLm.svg'
import { ReactComponent as UniBonusIcon } from 'assets/svg/kyber/uni_bonus.svg'
import { Loader2 } from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useStableCoins } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { timings } from 'pages/Earns/PoolExplorer/Filter'
import LiquidityChart, { LiquidityChartSkeleton } from 'pages/Earns/PositionDetail/LiquidityChart'
import { usePositionDetailContext } from 'pages/Earns/PositionDetail/PositionDetailContext'
import {
  AprSection,
  ChartFadeIn,
  CompactPriceBox,
  CompactPriceLabel,
  CompactPriceValue,
  DropdownButton,
  DropdownMenu,
  DropdownMenuItem,
  PositionAction,
  PositionActionWrapper,
  PricePercentage,
  PriceSection,
  RemoveLiquidityDropdownWrapper,
  RevertIconWrapper,
  TabContentArea,
  TotalLiquiditySection,
  VerticalDivider,
} from 'pages/Earns/PositionDetail/styles'
import AnimatedNumber from 'pages/Earns/components/AnimatedNumber'
import AprDetailTooltip from 'pages/Earns/components/AprDetailTooltip'
import DropdownMenuComponent from 'pages/Earns/components/DropdownMenu'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import RewardSyncing from 'pages/Earns/components/RewardSyncing'
import { SmartExit } from 'pages/Earns/components/SmartExit'
import { EARN_CHAINS, EARN_DEXES, EarnChain, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { CheckClosedPositionParams } from 'pages/Earns/hooks/useClosedPositions'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'
import useZapOutWidget from 'pages/Earns/hooks/useZapOutWidget'
import { ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { getNftManagerContractAddress } from 'pages/Earns/utils'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const InformationTab = () => {
  const {
    position,
    initialLoading,
    isNotAccountOwner,
    positionOwnerAddress,
    triggerClose,
    hasActiveSmartExitOrder,
    onOpenZapMigration,
    onRefreshPosition,
    setTriggerClose,
    setReduceFetchInterval,
    onReposition,
    aprInterval,
    setAprInterval,
    isUnfinalized,
    isWaitingForRewards,
    shareBtn,
  } = usePositionDetailContext()

  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const theme = useTheme()
  const navigate = useNavigate()
  const { exchange, chainId, positionId } = useParams()

  const { account } = useActiveWeb3React()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { stableCoins } = useStableCoins(Number(chainId) as ChainId)
  const { data: pool } = usePoolDetailQuery(
    { chainId: Number(chainId) as ChainId, address: position?.pool.address || '' },
    { skip: !position, pollingInterval: 15_000 },
  )
  const [revert, setRevert] = useState(false)
  const [defaultRevertChecked, setDefaultRevertChecked] = useState(false)
  const [openSmartExit, setOpenSmartExit] = useState<boolean>(false)
  const [isChartReady, setIsChartReady] = useState(false)
  const onChartReady = useCallback(() => setIsChartReady(true), [])

  const { widget: zapInWidget, handleOpenZapIn } = useZapInWidget({
    onOpenZapMigration,
    triggerClose,
    setTriggerClose,
  })
  const { widget: zapOutWidget, handleOpenZapOut } = useZapOutWidget((props: CheckClosedPositionParams) => {
    onRefreshPosition(props)
    setReduceFetchInterval(true)
  }, true)

  const price = useMemo(
    () => (!position?.priceRange ? 0 : !revert ? position.priceRange.current : 1 / position.priceRange.current),
    [position?.priceRange, revert],
  )
  const isUniv2 = EARN_DEXES[exchange as Exchange]?.isForkFrom === CoreProtocol.UniswapV2

  const explorerUrl = useMemo(() => {
    if (!position || !chainId) return null
    const baseUrl = NETWORKS_INFO[+chainId as ChainId]?.etherscanUrl
    if (!baseUrl) return null
    if (isUniv2) {
      return `${baseUrl}/token/${position.pool.address}?a=${positionOwnerAddress || account}`
    }
    const [nftManagerAddressFromRoute] = (positionId || '').split('-')
    const nftManagerAddress = nftManagerAddressFromRoute?.startsWith('0x')
      ? nftManagerAddressFromRoute
      : getNftManagerContractAddress(position.dex.id, position.chain.id)
    return `${baseUrl}/nft/${nftManagerAddress}/${position.tokenId}`
  }, [account, chainId, isUniv2, position, positionId, positionOwnerAddress])

  const onOpenIncreaseLiquidityWidget = useCallback(() => {
    if (!position) return
    handleOpenZapIn({
      pool: {
        dex: position.dex.id,
        chainId: position.chain.id,
        address: position.pool.address,
      },
      positionId: isUniv2 ? account || '' : position.tokenId,
    })
  }, [position, handleOpenZapIn, isUniv2, account])

  useEffect(() => {
    if (!pool || !chainId || !pool.tokens?.[0] || defaultRevertChecked || !stableCoins.length) return
    setDefaultRevertChecked(true)
    const isToken0Native =
      pool.tokens[0].address.toLowerCase() ===
      NativeCurrencies[Number(chainId) as ChainId].wrapped.address.toLowerCase()
    const isToken0Stable = stableCoins.some(coin => coin.address === pool.tokens[0].address)
    const isToken1Stable = stableCoins.some(coin => coin.address === pool.tokens[1].address)
    if (isToken0Stable || (isToken0Native && !isToken1Stable)) setRevert(true)
  }, [defaultRevertChecked, pool, chainId, stableCoins])

  const isUniV4 = position?.pool.isUniv4
  const isClosed = position?.status === PositionStatus.CLOSED
  const isOutRange = position?.status === PositionStatus.OUT_RANGE

  const repositionDisabled = initialLoading || !position || isClosed
  const increaseDisabled = initialLoading || (isUniV4 && isClosed)
  const removeDisabled = initialLoading || isNotAccountOwner || isClosed || !position
  const subActionDisabled = isClosed || (!isOutRange ? repositionDisabled : increaseDisabled)

  const isSmartExitSupported =
    position &&
    !!EARN_DEXES[position.dex.id].smartExitDexType &&
    !!EARN_CHAINS[position.chain.id as unknown as EarnChain].smartExitSupported

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen])

  return (
    <>
      {zapInWidget}
      {zapOutWidget}
      {openSmartExit && !!position ? <SmartExit position={position} onDismiss={() => setOpenSmartExit(false)} /> : null}

      <TabContentArea>
        {/* Total Liquidity + APR row */}
        <Flex flexWrap="wrap" alignItems="stretch" sx={{ gap: '12px' }}>
          <TotalLiquiditySection>
            <Flex flexDirection="column" alignContent="flex-start" sx={{ gap: '6px' }}>
              <Flex alignItems="center" sx={{ gap: '6px' }}>
                <Text fontSize={14} color={theme.subText}>
                  {t`Total Liquidity`}
                </Text>
                {position?.isValueUpdating && (
                  <MouseoverTooltipDesktopOnly text={t`Value is updating`} placement="top" width="fit-content">
                    <Loader2 size={12} />
                  </MouseoverTooltipDesktopOnly>
                )}
              </Flex>
              {initialLoading ? (
                <PositionSkeleton width={95} height={24} />
              ) : (
                <Text fontSize={20}>
                  <AnimatedNumber
                    value={formatDisplayNumber(position?.totalProvidedValue, {
                      style: 'currency',
                      significantDigits: 4,
                    })}
                  />
                </Text>
              )}
            </Flex>
            <VerticalDivider />
            <Flex flexDirection="column" alignContent="flex-end" sx={{ gap: 2 }}>
              {initialLoading ? (
                <PositionSkeleton width={120} height={19} />
              ) : (
                <Flex alignItems="center" sx={{ gap: '6px' }} fontSize={16}>
                  <TokenLogo src={position?.token0.logo} size={16} />
                  <Text>{formatDisplayNumber(position?.token0.currentAmount, { significantDigits: 4 })}</Text>
                  <Text>{position?.token0.symbol}</Text>
                </Flex>
              )}
              {initialLoading ? (
                <PositionSkeleton width={120} height={19} />
              ) : (
                <Flex alignItems="center" sx={{ gap: '6px' }} fontSize={16}>
                  <TokenLogo src={position?.token1.logo} size={16} />
                  <Text>{formatDisplayNumber(position?.token1.currentAmount, { significantDigits: 4 })}</Text>
                  <Text>{position?.token1.symbol}</Text>
                </Flex>
              )}
            </Flex>
          </TotalLiquiditySection>

          <AprSection>
            <Flex alignItems="center" flexWrap="wrap" sx={{ gap: '12px' }}>
              {/* Left: header + APR value */}
              <Flex flexDirection="column" sx={{ gap: '4px' }}>
                <Flex alignItems="center" sx={{ gap: '2px' }}>
                  <Text fontSize={14} color={theme.subText} marginRight={0.5}>
                    {t`Total APR`}
                  </Text>
                  {position?.pool.isFarming && !isUnfinalized && (
                    <AprDetailTooltip
                      feeApr={position.feeApr[aprInterval] || 0}
                      egApr={position.kemEGApr[aprInterval] || 0}
                      lmApr={position.kemLMApr[aprInterval] || 0}
                      uniApr={position.bonusApr}
                    >
                      <Info color={theme.subText} size={16} />
                    </AprDetailTooltip>
                  )}
                  <DropdownMenuComponent
                    width={30}
                    flatten
                    tooltip={t`APR calculated based on last ${aprInterval} fees.`}
                    options={timings.slice(0, 2)}
                    value={aprInterval}
                    onChange={value => setAprInterval(value as '24h' | '7d')}
                  />
                </Flex>
                {initialLoading ? (
                  <PositionSkeleton width={70} height={24} />
                ) : isUnfinalized ? (
                  <PositionSkeleton width={70} height={24} text={t`Finalizing...`} />
                ) : isWaitingForRewards ? (
                  <RewardSyncing width={70} height={24} />
                ) : (
                  <Flex alignItems="center" sx={{ gap: 1 }}>
                    {position?.pool.isFarmingLm ? (
                      <FarmingLmIcon width={20} height={20} />
                    ) : position?.pool.isFarming ? (
                      <FarmingIcon width={20} height={20} />
                    ) : null}
                    {position?.bonusApr ? <UniBonusIcon width={20} height={20} /> : null}
                    <Text
                      fontSize={20}
                      color={position?.apr && position.apr[aprInterval] > 0 ? theme.primary : theme.text}
                      mr="8px"
                    >
                      <AnimatedNumber
                        value={`${formatAprNum((position?.apr[aprInterval] || 0) + (position?.bonusApr || 0))}%`}
                      />
                    </Text>
                    {position?.status !== PositionStatus.CLOSED && shareBtn(12, [ShareOption.TOTAL_APR])}
                  </Flex>
                )}
              </Flex>

              {/* Vertical divider */}
              {position?.pool.isFarming && !isUnfinalized && <VerticalDivider height="40px" />}

              {/* Right: Fee + Rewards breakdown */}
              {position?.pool.isFarming && !isUnfinalized && (
                <Flex flexDirection="column" sx={{ gap: '4px' }}>
                  <Flex alignItems="center" sx={{ gap: '16px' }}>
                    <Text fontSize={14} color={theme.subText}>
                      {t`Fee`}
                    </Text>
                    <Text fontSize={14} color={theme.text}>
                      {formatAprNum(position.feeApr[aprInterval] || 0)}%
                    </Text>
                  </Flex>
                  <Flex alignItems="center" sx={{ gap: '16px' }}>
                    <Text fontSize={14} color={theme.subText}>
                      {t`Rewards`}
                    </Text>
                    <Text fontSize={14} color={theme.text}>
                      {formatAprNum(
                        (position.kemEGApr[aprInterval] || 0) +
                          (position.kemLMApr[aprInterval] || 0) +
                          (position.bonusApr || 0),
                      )}
                      %
                    </Text>
                  </Flex>
                </Flex>
              )}
            </Flex>
          </AprSection>
        </Flex>

        {/* Price Range */}
        {!isUniv2 && (
          <Text fontSize={16} fontWeight={500} color={theme.text}>
            {t`Price Range`}
          </Text>
        )}

        {!isUniv2 && (
          <>
            {!isChartReady && <LiquidityChartSkeleton />}
            {!initialLoading && position && !isUnfinalized && (
              <ChartFadeIn $visible={isChartReady}>
                <LiquidityChart
                  chainId={Number(chainId)}
                  poolAddress={position.pool.address}
                  price={price}
                  minPrice={position.priceRange.min}
                  maxPrice={position.priceRange.max}
                  revertPrice={revert}
                  onReady={onChartReady}
                />
              </ChartFadeIn>
            )}
          </>
        )}

        {/* Current Price + MIN/MAX in one row */}
        {(price || initialLoading) && (
          <Flex alignItems="stretch" flexDirection={upToLarge ? 'column' : 'row'} sx={{ gap: '8px' }}>
            <PriceSection style={{ flex: '1 1 0%', minWidth: 0 }}>
              <Flex alignItems="center" sx={{ gap: 1 }} flexWrap="wrap" style={{ flex: 1 }}>
                <Text fontSize={14} color={theme.subText}>
                  {t`Current Price`}
                </Text>
                {initialLoading ? (
                  <PositionSkeleton width={160} height={16} />
                ) : isUnfinalized ? (
                  <PositionSkeleton width={160} height={16} text={t`Finalizing...`} />
                ) : (
                  position && (
                    <Text fontSize={14}>
                      1 {!revert ? position.token0.symbol : position.token1.symbol} ={' '}
                      {formatDisplayNumber(price, { significantDigits: 8 })}{' '}
                      {!revert ? position.token1.symbol : position.token0.symbol}
                    </Text>
                  )
                )}
              </Flex>
              <RevertIconWrapper onClick={() => setRevert(!revert)}>
                <RevertPriceIcon width={12} height={12} />
              </RevertIconWrapper>
            </PriceSection>

            {!isUniv2 && (
              <Flex sx={{ gap: '8px', flex: '1 1 0%' }}>
                <CompactPriceBox>
                  <CompactPriceLabel>MIN</CompactPriceLabel>
                  <CompactPriceValue>
                    {initialLoading ? (
                      <PositionSkeleton width={60} height={18} />
                    ) : (
                      <>
                        <Text fontSize={16} fontWeight={500}>
                          {(!revert && position?.priceRange.isMinPrice) || (revert && position?.priceRange.isMaxPrice)
                            ? '0'
                            : position?.priceRange?.min && position?.priceRange?.max
                            ? formatDisplayNumber(!revert ? position.priceRange.min : 1 / position.priceRange.max, {
                                significantDigits: 8,
                              })
                            : ''}
                        </Text>
                        {(() => {
                          const minVal =
                            (!revert && position?.priceRange.isMinPrice) || (revert && position?.priceRange.isMaxPrice)
                              ? 0
                              : !revert
                              ? position?.priceRange?.min
                              : position?.priceRange?.max
                              ? 1 / position.priceRange.max
                              : undefined
                          if (minVal !== undefined && price) {
                            const pct = ((minVal - price) / price) * 100
                            return (
                              <PricePercentage>
                                {pct >= 0 ? '+' : ''}
                                {pct.toFixed(4)}%
                              </PricePercentage>
                            )
                          }
                          return null
                        })()}
                      </>
                    )}
                  </CompactPriceValue>
                </CompactPriceBox>
                <CompactPriceBox>
                  <CompactPriceLabel>MAX</CompactPriceLabel>
                  <CompactPriceValue>
                    {initialLoading ? (
                      <PositionSkeleton width={60} height={18} />
                    ) : (
                      <>
                        <Text fontSize={16} fontWeight={500}>
                          {(!revert && position?.priceRange.isMaxPrice) || (revert && position?.priceRange.isMinPrice)
                            ? '∞'
                            : position?.priceRange?.min && position?.priceRange?.max
                            ? formatDisplayNumber(!revert ? position.priceRange.max : 1 / position.priceRange.min, {
                                significantDigits: 8,
                              })
                            : ''}
                        </Text>
                        {(() => {
                          const isInfinity =
                            (!revert && position?.priceRange.isMaxPrice) || (revert && position?.priceRange.isMinPrice)
                          const maxVal = isInfinity
                            ? undefined
                            : !revert
                            ? position?.priceRange?.max
                            : position?.priceRange?.min
                            ? 1 / position.priceRange.min
                            : undefined
                          if (maxVal !== undefined && price) {
                            const pct = ((maxVal - price) / price) * 100
                            return (
                              <PricePercentage>
                                {pct >= 0 ? '+' : ''}
                                {pct.toFixed(4)}%
                              </PricePercentage>
                            )
                          }
                          return null
                        })()}
                      </>
                    )}
                  </CompactPriceValue>
                </CompactPriceBox>
              </Flex>
            )}
          </Flex>
        )}

        {/* Sub-action: Reposition / Increase Liquidity link */}
        {!isUniv2 && (
          <PositionActionWrapper>
            <Flex
              color={!subActionDisabled ? theme.primary : theme.subText}
              alignItems="center"
              marginBottom={-3}
              sx={{ gap: 1, cursor: !subActionDisabled ? 'pointer' : 'not-allowed' }}
              onClick={e => {
                if (!isOutRange ? repositionDisabled : increaseDisabled) return
                if (!isOutRange) {
                  onReposition(e, position as ParsedPosition)
                } else {
                  onOpenIncreaseLiquidityWidget()
                }
              }}
            >
              {!isOutRange ? <IconReposition width={16} /> : <PlusCircle width={16} />}
              <Text fontSize={14}>{!isOutRange ? t`Reposition to new range` : t`Increase Liquidity`}</Text>
            </Flex>
          </PositionActionWrapper>
        )}

        {/* Actions */}
        <PositionActionWrapper>
          <RemoveLiquidityDropdownWrapper ref={dropdownRef}>
            <DropdownButton
              outlineDefault
              disabled={removeDisabled}
              onClick={() => {
                if (removeDisabled) return
                setIsDropdownOpen(!isDropdownOpen)
              }}
              isOpen={isDropdownOpen}
            >
              {isSmartExitSupported
                ? hasActiveSmartExitOrder
                  ? t`View Smart Exit Orders`
                  : t`Remove Liquidity`
                : t`Remove Liquidity`}
              <ChevronDown
                size={16}
                style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              />
            </DropdownButton>
            <DropdownMenu isOpen={isDropdownOpen}>
              {isSmartExitSupported && (
                <DropdownMenuItem
                  onClick={() => {
                    if (removeDisabled) return
                    if (hasActiveSmartExitOrder) {
                      navigate(APP_PATHS.EARN_SMART_EXIT)
                      return
                    }
                    setIsDropdownOpen(false)
                    setOpenSmartExit(true)
                  }}
                >
                  {hasActiveSmartExitOrder ? t`View Smart Exit Orders` : t`Smart Exit`}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                disabled={removeDisabled}
                onClick={() => {
                  if (removeDisabled) return
                  setIsDropdownOpen(false)
                  handleOpenZapOut({
                    position: {
                      dex: position.dex.id,
                      chainId: position.chain.id,
                      poolAddress: position.pool.address,
                      id: isUniv2 ? account || '' : position.tokenId,
                    },
                  })
                }}
              >
                {t`Zap Out to Any Token`}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={removeDisabled}
                onClick={() => {
                  if (removeDisabled) return
                  setIsDropdownOpen(false)
                  handleOpenZapOut({
                    position: {
                      dex: position.dex.id,
                      chainId: position.chain.id,
                      poolAddress: position.pool.address,
                      id: isUniv2 ? account || '' : position.tokenId,
                    },
                    mode: 'withdrawOnly',
                  })
                }}
              >
                {t`Remove Manually`}
              </DropdownMenuItem>
            </DropdownMenu>
          </RemoveLiquidityDropdownWrapper>

          {isNotAccountOwner ? (
            <PositionAction
              disabled={!explorerUrl}
              onClick={() => {
                if (!explorerUrl) return
                window.open(explorerUrl, '_blank', 'noopener,noreferrer')
              }}
            >
              {t`View on Explorer`}
            </PositionAction>
          ) : (
            <PositionAction
              disabled={!isOutRange ? increaseDisabled : repositionDisabled}
              onClick={e => {
                if (!isOutRange ? increaseDisabled : repositionDisabled) return
                if (isOutRange) {
                  onReposition(e, position as ParsedPosition)
                } else {
                  onOpenIncreaseLiquidityWidget()
                }
              }}
            >
              {!isOutRange ? t`Add Liquidity` : t`Reposition to new range`}
            </PositionAction>
          )}
        </PositionActionWrapper>
      </TabContentArea>
    </>
  )
}

export default InformationTab
