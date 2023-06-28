import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { useCallback, useState } from 'react'
import { Info, Minus, Plus, RefreshCw, Share2 } from 'react-feather'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import bgimg from 'assets/images/card-background-2.png'
import { ReactComponent as DownSvg } from 'assets/svg/down.svg'
import { ButtonLight, ButtonOutlined } from 'components/Button'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverInlineText from 'components/HoverInlineText'
import Harvest from 'components/Icons/Harvest'
import { RowBetween, RowFit } from 'components/Row'
import Tabs from 'components/Tabs'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { APRTooltipContent } from 'components/YieldPools/FarmingPoolAPRCell'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useShareFarmAddress } from 'state/farms/classic/hooks'
import { useFarmV2Action, useUserFarmV2Info } from 'state/farms/elasticv2/hooks'
import { ElasticFarmV2 } from 'state/farms/elasticv2/types'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { formatDollarAmount } from 'utils/numbers'

import { convertTickToPrice } from '../utils'

const StyledTabs = styled(Tabs)`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
`

const Wrapper = styled.div<{ hasRewards: boolean }>`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  background-color: ${({ theme }) => theme.buttonBlack};

  border-radius: 24px;
  font-weight: 500;

  ${({ hasRewards }) =>
    hasRewards &&
    css`
      background-image: ${({ theme }) =>
        `url(${bgimg}),
        linear-gradient(to right, ${rgba(theme.apr, 0.12)}, ${rgba(theme.apr, 0.12)}),
        linear-gradient(to right, ${theme.buttonBlack}, ${theme.buttonBlack})`};
      background-size: cover;
      background-repeat: no-repeat;
    `}
`

const UnstakeButton = styled(ButtonLight)`
  padding: 10px 12px;
  width: fit-content;
  :hover {
    opacity: 0.9;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
  `}
`

const IconButton = styled.div`
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
  :hover {
    opacity: 0.8;
  }
`

function FarmCard({
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
}) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const [activeRangeIndex, setActiveRangeIndex] = useState(0)

  const [, setSharePoolAddress] = useShareFarmAddress()

  const currentTimestamp = Math.floor(Date.now() / 1000)
  const stakedPos = useUserFarmV2Info(farm.fId)
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

  const { harvest } = useFarmV2Action()

  const handleHarvest = useCallback(() => {
    setShowConfirmModal(true)
    setAttemptingTxn(true)
    setTxHash('')
    harvest(farm.fId, stakedPos.map(sp => sp.nftId.toNumber()) || [])
      .then(txHash => {
        setAttemptingTxn(false)
        setTxHash(txHash)
      })
      .catch(e => {
        console.log(e)
        setAttemptingTxn(false)
        setErrorMessage(e?.message || JSON.stringify(e))
      })
  }, [farm, harvest, stakedPos])

  const { pool } = farm

  const addliquidityElasticPool = `${APP_PATHS.ELASTIC_CREATE_POOL}/${
    farm.token0.isNative ? farm.token0.symbol : farm.token0.address
  }/${farm.token1.isNative ? farm.token1.symbol : pool.token1.address}/${pool.fee}`

  return (
    <>
      <Wrapper hasRewards={canUnstake}>
        <RowBetween>
          <Flex sx={{ gap: '4px' }} flexDirection="column">
            <RowFit gap="4px" align="center">
              <Link
                to={addliquidityElasticPool}
                style={{
                  textDecoration: 'none',
                }}
              >
                <Text fontSize="16px" lineHeight="20px" color={theme.primary}>
                  {`${farm.token0.symbol} - ${farm.token1.symbol}`}
                </Text>
              </Link>
              <IconButton>
                <CopyHelper toCopy={farm?.poolAddress || ''} />
              </IconButton>
              <IconButton
                onClick={() => {
                  setSharePoolAddress(farm.poolAddress)
                }}
              >
                <Share2 size={14} fill="currentcolor" />
              </IconButton>
            </RowFit>

            <FeeTag style={{ marginLeft: 0 }}>
              FEE {farm?.pool?.fee ? (farm?.pool?.fee * 100) / ELASTIC_BASE_FEE_UNIT : 0.03}%
            </FeeTag>
          </Flex>

          <DoubleCurrencyLogo size={44} currency0={farm.token0} currency1={farm.token1} />
        </RowBetween>

        <Divider />

        <div>
          <RowBetween>
            <Text fontSize="12px" color={theme.subText}>
              <Trans>Staked TVL</Trans>
            </Text>

            <Text fontSize="12px" color={theme.subText}>
              {!isEnded && !farm.isSettled ? (
                farm.startTime > currentTimestamp ? (
                  <Text fontSize="12px" color={theme.warning}>
                    <Trans>New phase will start in</Trans>
                  </Text>
                ) : (
                  <Trans>Current phase will end in</Trans>
                )
              ) : !farm.isSettled ? (
                <Trans>Ended at</Trans>
              ) : null}
            </Text>
          </RowBetween>

          <RowBetween>
            <MouseoverTooltip
              placement="bottom"
              width="fit-content"
              text={
                farm.tvl ? (
                  <>
                    <Flex alignItems="center" sx={{ gap: '4px' }}>
                      <CurrencyLogo currency={farm.token0} size="16px" />
                      {farm.tvlToken0.toSignificant(6)} {farm.token0.symbol}
                    </Flex>

                    <Flex alignItems="center" sx={{ gap: '4px' }} marginTop="4px">
                      <CurrencyLogo currency={farm.token1} size="16px" />
                      {farm.tvlToken1.toSignificant(6)} {farm.token1.symbol}
                    </Flex>
                  </>
                ) : (
                  ''
                )
              }
            >
              <Text fontSize="16px" fontWeight="500" color={theme.text}>
                {farm.tvl ? formatDollarAmount(farm.tvl) : '--'}
              </Text>

              {!!farm.tvl && <DownSvg />}
            </MouseoverTooltip>

            <Text fontSize="14px" fontWeight="500" color={theme.text}>
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
          </RowBetween>
        </div>

        <StyledTabs
          activeKey={activeRangeIndex}
          onChange={key => {
            setActiveRangeIndex(+key)
          }}
          items={farm.ranges.map(item => {
            return {
              key: item.index,
              label: (
                <Flex alignItems="center" sx={{ gap: '2px' }} color={item.isRemoved ? theme.warning : theme.subText}>
                  {convertTickToPrice(farm.token0, farm.token1, item.tickLower, pool.fee)}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" display="block">
                    <path
                      d="M11.3405 8.66669L11.3405 9.86002C11.3405 10.16 11.7005 10.3067 11.9071 10.0934L13.7605 8.23335C13.8871 8.10002 13.8871 7.89335 13.7605 7.76002L11.9071 5.90669C11.7005 5.69335 11.3405 5.84002 11.3405 6.14002L11.3405 7.33335L4.66047 7.33335L4.66047 6.14002C4.66047 5.84002 4.30047 5.69335 4.0938 5.90669L2.24047 7.76669C2.1138 7.90002 2.1138 8.10669 2.24047 8.24002L4.0938 10.1C4.30047 10.3134 4.66047 10.16 4.66047 9.86669L4.66047 8.66669L11.3405 8.66669Z"
                      fill="currentcolor"
                    />
                  </svg>

                  {convertTickToPrice(farm.token0, farm.token1, item.tickUpper, pool.fee)}
                </Flex>
              ),
              children: (
                <Flex padding="12px" flexDirection="column">
                  <RowBetween>
                    <MouseoverTooltip
                      width="fit-content"
                      text={
                        <APRTooltipContent
                          farmV2APR={farm.ranges[activeRangeIndex].apr || 0}
                          farmAPR={0}
                          poolAPR={poolAPR}
                        />
                      }
                      placement="top"
                    >
                      <Text
                        fontSize="12px"
                        color={theme.subText}
                        style={{ borderBottom: `1px dotted ${theme.subText}` }}
                      >
                        APR
                      </Text>
                    </MouseoverTooltip>

                    <MouseoverTooltip
                      text={
                        farm.ranges[activeRangeIndex].isRemoved ? (
                          <Trans>
                            This indicates that range is idle. Staked positions in this range is still earning small
                            amount of rewards.
                          </Trans>
                        ) : (
                          ''
                        )
                      }
                    >
                      <Text
                        fontSize="12px"
                        color={farm.ranges[activeRangeIndex].isRemoved ? theme.warning : theme.primary}
                        alignSelf="flex-end"
                        sx={{
                          borderBottom: farm.ranges[activeRangeIndex].isRemoved
                            ? `1px dotted ${theme.warning}`
                            : undefined,
                        }}
                      >
                        {farm.ranges[activeRangeIndex].isRemoved ? (
                          <Trans>Idle Range</Trans>
                        ) : (
                          <Link to={`${addliquidityElasticPool}?farmRange=${activeRangeIndex}`}>
                            <Trans>Add Liquidity ↗</Trans>
                          </Link>
                        )}
                      </Text>
                    </MouseoverTooltip>
                  </RowBetween>

                  <Text
                    fontSize="28px"
                    marginTop="2px"
                    color={farm.ranges[activeRangeIndex].isRemoved ? theme.warning : theme.apr}
                  >
                    {(poolAPR + (farm.ranges[activeRangeIndex].apr || 0)).toFixed(2)}%
                  </Text>
                </Flex>
              ),
            }
          })}
        />

        <RowBetween>
          <Column style={{ width: 'fit-content' }} gap="4px">
            <Text fontSize="12px" color={theme.subText}>
              {hasRewards ? <Trans>My Rewards</Trans> : <Trans>Rewards</Trans>}
            </Text>
            <RowFit gap="8px">
              {farm.totalRewards.map((rw, index: number) => (
                <>
                  {index > 0 && (
                    <Text fontSize="16px" color={theme.border}>
                      |
                    </Text>
                  )}
                  <RowFit gap="4px">
                    <MouseoverTooltip text={rw.currency.symbol} placement="top" width="fit-content">
                      <CurrencyLogo currency={rw.currency} size="16px" />
                    </MouseoverTooltip>
                    {hasRewards && (
                      <Text fontSize="16px" color={theme.text}>
                        <HoverInlineText text={userTotalRewards[index].toSignificant(4)} maxCharacters={8} />
                      </Text>
                    )}
                  </RowFit>
                </>
              ))}
            </RowFit>
          </Column>
          <ButtonLight
            width="fit-content"
            disabled={!hasRewards}
            onClick={handleHarvest}
            color={theme.apr}
            padding="10px 12px"
          >
            <Harvest />
            <Text marginLeft="4px">Harvest</Text>
          </ButtonLight>
        </RowBetween>

        <RowBetween>
          {!!stakedPos.length && (
            <Column gap="4px">
              <Text fontSize="12px" fontWeight="500" color={theme.subText}>
                <Trans>My Deposit</Trans>
              </Text>
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
                          You still have {formatDollarAmount(notStakedUSD)} in liquidity to stake to earn even more
                          farming rewards
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
                <Text
                  fontSize="16px"
                  fontWeight="500"
                  alignItems="center"
                  display="flex"
                  color={canUpdateLiquidity ? theme.warning : theme.text}
                >
                  {formatDollarAmount(myTotalPosUSDValue)}
                  {canUpdateLiquidity && <Info size={14} style={{ marginLeft: '4px' }} />}
                  {!!stakedPos.length && <DownSvg />}
                </Text>
              </MouseoverTooltip>
            </Column>
          )}

          <RowFit flex={1} justify="flex-end" gap="12px">
            {canUnstake && (
              <MouseoverTooltip
                placement="top"
                width="270px"
                text={
                  canUpdateLiquidity ? (
                    <Flex
                      sx={{
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 400,
                      }}
                    >
                      <Text as="span" color={theme.subText}>
                        <Trans>
                          You still have {formatDollarAmount(notStakedUSD)} in liquidity to stake to earn even more
                          farming rewards
                        </Trans>
                      </Text>
                      <Text as="span" color={theme.text}>
                        Staked: {formatDollarAmount(myDepositUSD)}
                      </Text>
                      <Text as="span" color={theme.warning}>
                        Not staked: {formatDollarAmount(notStakedUSD)}
                      </Text>

                      <Flex sx={{ gap: '12px' }}>
                        <ButtonLight padding="8px 12px" onClick={onUpdateFarmClick}>
                          <RefreshCw size={14} />
                          <Text marginLeft="6px" fontSize={['12px', '14px']}>
                            <Trans>Update</Trans>
                          </Text>
                        </ButtonLight>
                        <ButtonOutlined color={theme.red} padding="8px 12px" onClick={onUnstake}>
                          <Minus size={14} />
                          <Text marginLeft="6px" fontSize={['12px', '14px']}>
                            <Trans>Unstake</Trans>
                          </Text>
                        </ButtonOutlined>
                      </Flex>
                    </Flex>
                  ) : (
                    ''
                  )
                }
              >
                <UnstakeButton
                  color={canUpdateLiquidity ? theme.warning : theme.red}
                  onClick={() => !canUpdateLiquidity && onUnstake()}
                >
                  {canUpdateLiquidity ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_1048_20034)">
                        <path
                          d="M2.66667 8.66667H6.66667C7.03333 8.66667 7.33333 8.36667 7.33333 8L7.33333 2.66667C7.33333 2.3 7.03333 2 6.66667 2L2.66667 2C2.3 2 2 2.3 2 2.66667L2 8C2 8.36667 2.3 8.66667 2.66667 8.66667ZM2.66667 14H6.66667C7.03333 14 7.33333 13.7 7.33333 13.3333V10.6667C7.33333 10.3 7.03333 10 6.66667 10H2.66667C2.3 10 2 10.3 2 10.6667L2 13.3333C2 13.7 2.3 14 2.66667 14ZM9.33333 14H13.3333C13.7 14 14 13.7 14 13.3333V8C14 7.63333 13.7 7.33333 13.3333 7.33333L9.33333 7.33333C8.96667 7.33333 8.66667 7.63333 8.66667 8L8.66667 13.3333C8.66667 13.7 8.96667 14 9.33333 14ZM8.66667 2.66667V5.33333C8.66667 5.7 8.96667 6 9.33333 6H13.3333C13.7 6 14 5.7 14 5.33333V2.66667C14 2.3 13.7 2 13.3333 2L9.33333 2C8.96667 2 8.66667 2.3 8.66667 2.66667Z"
                          fill="currentcolor"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_1048_20034">
                          <rect width="16" height="16" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  ) : (
                    <Minus size={14} />
                  )}
                  <Text marginLeft="6px" fontSize={['12px', '14px']}>
                    {canUpdateLiquidity ? <Trans>Manage</Trans> : <Trans>Unstake</Trans>}
                  </Text>
                </UnstakeButton>
              </MouseoverTooltip>
            )}

            <ButtonLight
              onClick={() => {
                onStake()
              }}
              disabled={!account || !isApproved || isEnded || farm.isSettled || isAllRangesInactive}
              padding="10px 12px"
              width={canUnstake ? 'fit-content' : undefined}
            >
              <Plus size={16} />
              <Text marginLeft="6px" fontSize={['12px', '14px']}>
                <Trans>Stake</Trans>
              </Text>
            </ButtonLight>
          </RowFit>
        </RowBetween>
      </Wrapper>

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
    </>
  )
}

export default FarmCard
