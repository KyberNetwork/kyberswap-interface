import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import mixpanel from 'mixpanel-browser'
import { rgba } from 'polished'
import { useCallback, useState } from 'react'
import { Info, Minus, Plus, RefreshCw, Share2 } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DownSvg } from 'assets/svg/down.svg'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HorizontalScroll from 'components/HorizontalScroll'
import HoverInlineText from 'components/HoverInlineText'
import { TwoWayArrow } from 'components/Icons'
import Harvest from 'components/Icons/Harvest'
import { MouseoverTooltip, MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { ButtonColorScheme, MinimalActionButton } from 'components/YieldPools/ElasticFarmGroup/buttons'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { ElasticFarmV2TableRow } from 'components/YieldPools/styleds'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useShareFarmAddress } from 'state/farms/classic/hooks'
import { useFarmV2Action, useUserFarmV2Info } from 'state/farms/elasticv2/hooks'
import { ElasticFarmV2 } from 'state/farms/elasticv2/types'
import { MEDIA_WIDTHS } from 'theme'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { formatDollarAmount } from 'utils/numbers'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'

import { convertTickToPrice } from '../utils'

const Wrapper = styled.div<{ isDeposited: boolean }>(({ theme, isDeposited }) => ({
  padding: '16px',
  backgroundColor: isDeposited ? rgba(theme.apr, 0.12) : theme.buttonBlack,
  ':not:last-child': {
    borderBottom: `1px solid ${theme.border}`,
  },
}))

export const ListView = ({
  onStake,
  onUnstake,
  onUpdateFarmClick,
  farm,
  poolAPR,
  isApproved,
}: {
  onStake: () => void
  onUnstake: () => void
  onUpdateFarmClick: () => void
  farm: ElasticFarmV2
  poolAPR: number
  isApproved: boolean
}) => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const theme = useTheme()
  const { account, chainId, networkInfo } = useActiveWeb3React()

  const [, setSharePoolAddress] = useShareFarmAddress()

  const currentTimestamp = Math.floor(Date.now() / 1000)
  const stakedPos = useUserFarmV2Info(farm.farmAddress, farm.fId)
  let amountToken0 = CurrencyAmount.fromRawAmount(farm.token0.wrapped, 0)
  let amountToken1 = CurrencyAmount.fromRawAmount(farm.token1.wrapped, 0)

  stakedPos.forEach(item => {
    amountToken0 = amountToken0.add(item.position.amount0)
    amountToken1 = amountToken1.add(item.position.amount1)
  })

  const canUnstake = stakedPos.length > 0

  const hasRewards = stakedPos.some(item => item.unclaimedRewards.some(rw => rw.greaterThan('0')))

  const userTotalRewards = farm.totalRewards.map((item, index) => {
    return stakedPos
      .map(item => item.unclaimedRewards[index])
      .reduce((total, cur) => total.add(cur), CurrencyAmount.fromRawAmount(item.currency, 0))
  })

  const myDepositUSD = stakedPos.reduce((total, item) => item.stakedUsdValue + total, 0)

  const isEnded = currentTimestamp > farm.endTime
  const isAllRangesInactive = !farm.ranges.some(item => !item.isRemoved)

  const canUpdateLiquidity =
    !isEnded &&
    !farm.isSettled &&
    stakedPos.some(item => {
      const range = farm.ranges.find(r => r.index === item.rangeId)
      if (range?.isRemoved) return false
      return item.liquidity.gt(item.stakedLiquidity)
    })

  const myTotalPosUSDValue = stakedPos.reduce((total, item) => item.positionUsdValue + total, 0)
  const notStakedUSD = myTotalPosUSDValue - myDepositUSD

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [attemptingTxn, setAttemptingTxn] = useState(false)

  const handleDismiss = () => {
    setTxHash('')
    setShowConfirmModal(false)
    setErrorMessage('')
    setAttemptingTxn(false)
  }

  const { harvest } = useFarmV2Action(farm.farmAddress)

  const handleHarvest = useCallback(() => {
    setShowConfirmModal(true)
    setAttemptingTxn(true)
    setTxHash('')
    harvest(farm.fId, stakedPos.map(sp => sp.nftId.toNumber()) || [])
      .then(txHash => {
        setAttemptingTxn(false)
        setTxHash(txHash)
        mixpanel.track('ElasticFarmV2 - Harvest Submitted', {
          farm_id: farm.id,
          farm_fid: farm.fId,
          tx_hash: txHash,
        })
      })
      .catch(e => {
        console.log(e)
        setAttemptingTxn(false)
        setErrorMessage(e?.message || JSON.stringify(e))
        mixpanel.track('ElasticFarmV2 - Harvest Failed', {
          farm_id: farm.id,
          farm_fid: farm.fId,
          error: JSON.stringify(e),
        })
      })
  }, [farm, harvest, stakedPos])

  const { pool } = farm

  const addliquidityElasticPool = `/${networkInfo.route}${APP_PATHS.ELASTIC_CREATE_POOL}/${
    pool.token0.isNative ? pool.token0.symbol : pool.token0.address
  }/${pool.token1.isNative ? pool.token1.symbol : pool.token1.address}/${pool.fee}`

  const minFarmAPR = Math.min(...farm.ranges.map(r => r.apr || 0))
  const maxFarmAPR = Math.max(...farm.ranges.map(r => r.apr || 0))

  const mixpanelPayload = { farm_pool_address: farm.poolAddress, farm_id: farm.id, farm_fid: farm.fId }
  const above1500 = useMedia('(min-width: 1500px)')

  return (
    <Wrapper isDeposited={!!stakedPos.length}>
      <Flex justifyContent="space-between" sx={{ gap: '1rem' }}>
        <Flex alignItems="center" justifyContent="space-between" width="max-content">
          <DoubleCurrencyLogo currency0={farm.token0} currency1={farm.token1} />
          <Link
            to={addliquidityElasticPool}
            style={{
              textDecoration: 'none',
            }}
          >
            <Text fontSize={14} fontWeight={500}>
              {getTokenSymbolWithHardcode(chainId, farm.token0.wrapped.address, farm.token0.symbol)} -{' '}
              {getTokenSymbolWithHardcode(chainId, farm.token1.wrapped.address, farm.token1.symbol)}
            </Text>
          </Link>

          <FeeTag>FEE {(farm.pool.fee * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>

          <Flex color={theme.subText} marginLeft="0.25rem">
            <CopyHelper toCopy={farm.poolAddress} />
          </Flex>
          <Flex
            marginLeft="0.5rem"
            onClick={() => {
              setSharePoolAddress(farm.poolAddress)
            }}
            sx={{
              cursor: 'pointer',
              gap: '4px',
            }}
            role="button"
            color={theme.subText}
          >
            <Share2 size="14px" color={theme.subText} />
          </Flex>
        </Flex>

        <Flex sx={{ gap: '8px' }} alignItems="center">
          <Text color={theme.subText} fontSize={12} fontWeight="500" marginRight="4px">
            <Trans>Available Farming Range</Trans>
          </Text>

          <div style={{ maxWidth: above1500 ? '900px' : 'calc(100vw - 500px)' }}>
            <HorizontalScroll
              style={{ gap: '8px' }}
              noShadow
              items={farm.ranges.map(item => item.index.toString())}
              renderItem={(item, index) => {
                const range = farm.ranges.find(r => r.index === +item)
                if (!range) return null
                return (
                  <Flex
                    alignItems="center"
                    minWidth="fit-content"
                    sx={{ gap: '2px' }}
                    color={range.isRemoved ? theme.warning : theme.subText}
                    fontSize={12}
                    fontWeight="500"
                  >
                    <Text minWidth="max-content">
                      {convertTickToPrice(farm.token0, farm.token1, range.tickLower, farm.pool.fee)}
                    </Text>
                    <TwoWayArrow />
                    <Text minWidth="max-content">
                      {convertTickToPrice(farm.token0, farm.token1, range.tickUpper, farm.pool.fee)}
                    </Text>

                    {index !== farm.ranges.length - 1 && (
                      <Text paddingLeft="6px" color={theme.subText}>
                        |
                      </Text>
                    )}
                  </Flex>
                )
              }}
            />
          </div>
        </Flex>
      </Flex>
      <ElasticFarmV2TableRow>
        <Text textAlign="left">{formatDollarAmount(farm.tvl)}</Text>
        <Text
          textAlign="left"
          color={!isEnded && !farm.isSettled && farm.startTime > currentTimestamp ? theme.warning : theme.text}
        >
          {!isEnded && !farm.isSettled ? (
            farm.startTime > currentTimestamp ? (
              <Text fontSize="12px" color={theme.warning}>
                <Trans>New phase will start in</Trans>
              </Text>
            ) : (
              ''
            )
          ) : !farm.isSettled ? (
            <Text color={theme.subText}>
              <Trans>Ended at</Trans>
            </Text>
          ) : null}

          <Text fontSize="14px" fontWeight="500" color={theme.text} marginTop="2px">
            {isEnded || farm.isSettled ? (
              isEnded ? (
                dayjs(farm.endTime * 1000).format('DD/MM/YYYY HH:mm')
              ) : (
                <Trans>ENDED</Trans>
              )
            ) : farm.startTime > currentTimestamp ? (
              <Text color={theme.warning}>{getFormattedTimeFromSecond(farm.startTime - currentTimestamp)}</Text>
            ) : (
              getFormattedTimeFromSecond(farm.endTime - currentTimestamp)
            )}
          </Text>
        </Text>

        <div>
          <MouseoverTooltip
            width="fit-content"
            text={
              <Flex flexDirection="column" fontSize="12px" sx={{ gap: '8px' }}>
                <Flex
                  sx={{
                    flexDirection: 'column',
                    fontSize: '12px',
                    lineHeight: '16px',
                  }}
                >
                  <Text as="span">
                    Pool APR:{' '}
                    <Text as="span" color={theme.text} fontWeight={500}>
                      {poolAPR.toFixed(2)}%
                    </Text>
                  </Text>
                  <Text
                    as="span"
                    fontStyle="italic"
                    sx={{
                      whiteSpace: upToSmall ? 'wrap' : 'nowrap',
                    }}
                  >
                    <Trans>Estimated return from trading fees if you participate in the pool</Trans>
                  </Text>
                </Flex>

                <Divider />

                <Text>
                  <Trans>APR for each Farming Range</Trans>
                </Text>

                {farm.ranges.map(item => (
                  <Flex key={item.index} justifyContent="space-between">
                    <Flex alignItems="center" sx={{ gap: '2px' }} fontWeight="500">
                      {convertTickToPrice(farm.token0, farm.token1, item.tickLower, farm.pool.fee)}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" display="block">
                        <path
                          d="M11.3405 8.66669L11.3405 9.86002C11.3405 10.16 11.7005 10.3067 11.9071 10.0934L13.7605 8.23335C13.8871 8.10002 13.8871 7.89335 13.7605 7.76002L11.9071 5.90669C11.7005 5.69335 11.3405 5.84002 11.3405 6.14002L11.3405 7.33335L4.66047 7.33335L4.66047 6.14002C4.66047 5.84002 4.30047 5.69335 4.0938 5.90669L2.24047 7.76669C2.1138 7.90002 2.1138 8.10669 2.24047 8.24002L4.0938 10.1C4.30047 10.3134 4.66047 10.16 4.66047 9.86669L4.66047 8.66669L11.3405 8.66669Z"
                          fill="currentcolor"
                        />
                      </svg>

                      {convertTickToPrice(farm.token0, farm.token1, item.tickUpper, farm.pool.fee)}
                    </Flex>

                    <Text fontWeight="500" color={theme.apr}>
                      {item.apr?.toFixed(2)}%
                    </Text>
                  </Flex>
                ))}
              </Flex>
            }
          >
            <Text
              sx={{ borderBottom: `1px dotted ${theme.apr}` }}
              color={theme.apr}
              fontSize="14px"
              fontWeight="500"
              lineHeight="20px"
            >
              {farm.ranges.length === 1 || minFarmAPR === maxFarmAPR
                ? (minFarmAPR + poolAPR).toFixed(2) + '%'
                : `${(minFarmAPR + poolAPR).toFixed(2)}% - ${(maxFarmAPR + poolAPR).toFixed(2)}%`}
            </Text>
          </MouseoverTooltip>
        </div>

        <Text
          fontSize="14px"
          fontWeight="500"
          alignItems="center"
          display="flex"
          justifyContent="flex-end"
          color={canUpdateLiquidity ? theme.warning : theme.text}
        >
          <MouseoverTooltip
            placement="bottom"
            width={canUpdateLiquidity ? '270px' : 'fit-content'}
            text={
              !stakedPos.length ? (
                ''
              ) : canUpdateLiquidity ? (
                <Flex
                  sx={{
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '12px',
                    lineHeight: '16px',
                    fontWeight: 400,
                  }}
                >
                  <Text as="span" color={theme.subText}>
                    <Trans>
                      You still have {formatDollarAmount(notStakedUSD)} in liquidity to stake to earn even more farming
                      rewards
                    </Trans>
                  </Text>
                  <Text as="span" color={theme.text}>
                    Staked: {formatDollarAmount(myDepositUSD)}
                  </Text>
                  <Text as="span" color={theme.warning}>
                    Not staked: {formatDollarAmount(notStakedUSD)}
                  </Text>
                </Flex>
              ) : (
                <>
                  <Flex alignItems="center" sx={{ gap: '4px' }}>
                    <CurrencyLogo currency={amountToken0.currency} size="16px" />
                    {amountToken0.toSignificant(6)} {amountToken0.currency.symbol}
                  </Flex>

                  <Flex alignItems="center" sx={{ gap: '4px' }}>
                    <CurrencyLogo currency={amountToken1.currency} size="16px" />
                    {amountToken1.toSignificant(6)} {amountToken1.currency.symbol}
                  </Flex>
                </>
              )
            }
          >
            {formatDollarAmount(myTotalPosUSDValue)}
            {canUpdateLiquidity && <Info size={14} style={{ marginLeft: '4px' }} />}
            {!!stakedPos.length && <DownSvg />}
          </MouseoverTooltip>
        </Text>
        <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '8px' }}>
          {userTotalRewards.map((amount, i) => (
            <Flex alignItems="center" sx={{ gap: '4px' }} key={amount.currency.symbol || i}>
              <HoverInlineText text={amount.toSignificant(6)} maxCharacters={10}></HoverInlineText>
              <MouseoverTooltip placement="top" text={amount.currency.symbol} width="fit-content">
                <CurrencyLogo currency={amount.currency} size="16px" />
              </MouseoverTooltip>
            </Flex>
          ))}
        </Flex>

        <Flex justifyContent="flex-end" sx={{ gap: '4px' }}>
          <MouseoverTooltipDesktopOnly text={t`Stake`} placement="top" width="fit-content">
            <MinimalActionButton
              disabled={!account || !isApproved || isEnded || farm.isSettled || isAllRangesInactive}
              onClick={() => {
                onStake()
                mixpanel.track('ElasticFarmV2 - Stake Clicked', mixpanelPayload)
              }}
            >
              <Plus size={16} />
            </MinimalActionButton>
          </MouseoverTooltipDesktopOnly>
          {canUpdateLiquidity && (
            <MouseoverTooltipDesktopOnly text={t`Update Liquidity`} placement="top" width="fit-content">
              <MinimalActionButton
                onClick={() => {
                  onUpdateFarmClick()
                  mixpanel.track('ElasticFarmV2 - Manage Clicked', mixpanelPayload)
                }}
                colorScheme={ButtonColorScheme.Gray}
              >
                <RefreshCw size={16} />
              </MinimalActionButton>
            </MouseoverTooltipDesktopOnly>
          )}

          <MouseoverTooltipDesktopOnly text={t`Unstake`} placement="top" width="fit-content">
            <MinimalActionButton
              colorScheme={ButtonColorScheme.Red}
              disabled={!canUnstake}
              onClick={() => {
                onUnstake()
                mixpanel.track('ElasticFarmV2 - Unstake Clicked', mixpanelPayload)
              }}
            >
              <Minus size={16} />
            </MinimalActionButton>
          </MouseoverTooltipDesktopOnly>

          <MouseoverTooltipDesktopOnly text={t`Harvest`} placement="top" width="fit-content">
            <MinimalActionButton
              colorScheme={ButtonColorScheme.APR}
              disabled={!hasRewards}
              onClick={() => {
                handleHarvest()
                mixpanel.track('ElasticFarmV2 - Harvest Clicked', mixpanelPayload)
              }}
            >
              <Harvest />
            </MinimalActionButton>
          </MouseoverTooltipDesktopOnly>
        </Flex>
      </ElasticFarmV2TableRow>

      <TransactionConfirmationModal
        isOpen={showConfirmModal}
        onDismiss={handleDismiss}
        hash={txHash}
        attemptingTxn={attemptingTxn}
        pendingText={t`Harvesting rewards`}
        content={() => (
          <Flex flexDirection={'column'} width="100%">
            {errorMessage ? <TransactionErrorContent onDismiss={handleDismiss} message={errorMessage} /> : null}
          </Flex>
        )}
      />
    </Wrapper>
  )
}
