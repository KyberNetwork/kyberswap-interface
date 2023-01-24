import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { Fraction, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ethers } from 'ethers'
import JSBI from 'jsbi'
import React, { useMemo, useState } from 'react'
import { Minus, Plus, Share2, X } from 'react-feather'
import { Link, createSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ReactComponent as DropSVG } from 'assets/svg/drop.svg'
import { ButtonEmpty, ButtonLight, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { MoneyBag } from 'components/Icons'
import Harvest from 'components/Icons/Harvest'
import ReverseArrows from 'components/Icons/ReverseArrows'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { Dots } from 'components/swap/styleds'
import { DMM_ANALYTICS_URL, MAX_ALLOW_APY, OUTSIDE_FAIRLAUNCH_ADDRESSES } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useFairLaunch from 'hooks/useFairLaunch'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useStakedBalance from 'hooks/useStakedBalance'
import useTheme from 'hooks/useTheme'
import useTokenBalance from 'hooks/useTokenBalance'
import { useWalletModalToggle } from 'state/application/hooks'
import { setAttemptingTxn, setShowConfirm, setTxHash, setYieldPoolsError } from 'state/farms/actions'
import { Farm, Reward } from 'state/farms/types'
import { useAppDispatch } from 'state/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useViewMode } from 'state/user/hooks'
import { VIEW_MODE } from 'state/user/reducer'
import { ExternalLink } from 'theme'
import { formattedNum, isAddressString, shortenAddress } from 'utils'
import { currencyIdFromAddress } from 'utils/currencyId'
import { getTradingFeeAPR, useFarmApr, useFarmRewards, useFarmRewardsUSD } from 'utils/dmm'
import { formatTokenBalance, getFullDisplayBalance } from 'utils/formatBalance'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { formatDollarAmount } from 'utils/numbers'

import { ModalContentWrapper } from './ElasticFarmModals/styled'
import { APRTooltipContent } from './FarmingPoolAPRCell'
import { ActionButton, CardButton, FarmCard, GetLP, RewardBalanceWrapper, TableRow } from './styleds'

const fixedFormatting = (value: BigNumber, decimals: number) => {
  const fraction = new Fraction(value.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals)))

  if (fraction.equalTo(JSBI.BigInt(0))) {
    return '0'
  }

  return fraction.toFixed(18).replace(/\.?0+$/, '')
}

const RatioPrice = ({ currency0, currency1 }: { currency0: Token; currency1: Token }) => {
  const [reversed, setReversed] = useState(false)
  const usdPrices = useTokenPrices([currency0.address, currency1.address])
  const tokensPriceRatio =
    usdPrices?.[currency1.address] && usdPrices?.[currency0.address]
      ? reversed
        ? usdPrices?.[currency1.address] / usdPrices?.[currency0.address]
        : usdPrices?.[currency0.address] / usdPrices?.[currency1.address]
      : undefined
  return (
    <>
      {!!tokensPriceRatio && !!currency0 && !!currency1 ? (
        <Row gap="4px">
          {tokensPriceRatio.toPrecision(10)}{' '}
          {reversed ? `${currency0.symbol} per ${currency1.symbol}` : `${currency1.symbol} per ${currency0.symbol}`}{' '}
          <RowFit style={{ cursor: 'pointer' }} onClick={() => setReversed(prev => !prev)}>
            <ReverseArrows />
          </RowFit>
        </Row>
      ) : (
        '--'
      )}
    </>
  )
}

interface ListItemProps {
  farm: Farm
  oddRow?: boolean
  setSharedPoolAddress: (addr: string) => void
}

const ListItem = ({ farm, setSharedPoolAddress }: ListItemProps) => {
  console.log('🚀 ~ file: ListItem.tsx:103 ~ ListItem ~ farm', farm)
  const { account, chainId, isEVM } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const [viewMode] = useViewMode()
  const { mixpanelHandler } = useMixpanel()

  const { type = 'active' } = useParsedQueryString<{ type: string }>()
  const above1200 = useMedia('(min-width: 1200px)')
  const dispatch = useAppDispatch()

  const currency0 = useToken(farm.token0?.id) as Token
  const currency1 = useToken(farm.token1?.id) as Token

  const poolAddressChecksum = isAddressString(chainId, farm.id)
  const { value: userTokenBalance, decimals: lpTokenDecimals } = useTokenBalance(poolAddressChecksum)

  const outsideFarm = OUTSIDE_FAIRLAUNCH_ADDRESSES[farm.fairLaunchAddress]

  const userStakedBalance = farm.userData?.stakedBalance
    ? BigNumber.from(farm.userData?.stakedBalance)
    : BigNumber.from(0)

  const farmRewards = useFarmRewards([farm])

  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio = new Fraction(
    farm.totalStake.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
    ),
  )

  // Ratio in % of user's LP tokens balance, vs the total number in circulation
  const lpUserLPBalanceRatio = new Fraction(
    userTokenBalance.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
    ),
  )

  const userToken0Balance = parseFloat(lpUserLPBalanceRatio.toSignificant(6)) * parseFloat(farm.reserve0)
  const userToken1Balance = parseFloat(lpUserLPBalanceRatio.toSignificant(6)) * parseFloat(farm.reserve1)

  // Ratio in % of LP tokens that user staked, vs the total number in circulation
  const lpUserStakedTokenRatio = new Fraction(
    userStakedBalance.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
    ),
  )

  const userStakedToken0Balance = parseFloat(lpUserStakedTokenRatio.toSignificant(6)) * parseFloat(farm.reserve0)
  const userStakedToken1Balance = parseFloat(lpUserStakedTokenRatio.toSignificant(6)) * parseFloat(farm.reserve1)

  const userLPBalanceUSD = parseFloat(lpUserLPBalanceRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)
  const userStakedBalanceUSD = parseFloat(lpUserStakedTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)

  const liquidity = parseFloat(lpTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)

  const farmAPR = useFarmApr(farm, liquidity.toString())

  const tradingFee = farm?.oneDayFeeUSD ? farm?.oneDayFeeUSD : farm?.oneDayFeeUntracked

  const tradingFeeAPR = getTradingFeeAPR(farm?.reserveUSD, tradingFee)

  let apr = farmAPR
  if (tradingFeeAPR < MAX_ALLOW_APY) apr += tradingFeeAPR

  const amp = farm.amp / 10000

  const pairSymbol = `${farm.token0.symbol}-${farm.token1.symbol} LP`
  const [depositValue, setDepositValue] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')
  const [expanded, setExpanded] = useState(false)
  const pairAddressChecksum = isAddressString(chainId, farm.id)
  const balance = useTokenBalance(pairAddressChecksum)
  const staked = useStakedBalance(farm.fairLaunchAddress, farm.pid)
  const rewardUSD = useFarmRewardsUSD(farmRewards)

  const amountToApprove = useMemo(
    () =>
      TokenAmount.fromRawAmount(
        new Token(chainId, pairAddressChecksum, balance.decimals, pairSymbol, ''),
        MaxUint256.toString(),
      ),
    [balance.decimals, chainId, pairAddressChecksum, pairSymbol],
  )
  const [approvalState, approve] = useApproveCallback(amountToApprove, isEVM ? farm.fairLaunchAddress : undefined)

  let isStakeInvalidAmount

  try {
    isStakeInvalidAmount =
      depositValue === '' ||
      parseFloat(depositValue) === 0 ||
      ethers.utils.parseUnits(depositValue || '0', balance.decimals).gt(balance.value) // This causes error if number of decimals > 18
  } catch (err) {
    isStakeInvalidAmount = true
  }

  const isStakeDisabled = isStakeInvalidAmount

  let isUnstakeInvalidAmount

  try {
    isUnstakeInvalidAmount =
      withdrawValue === '' ||
      parseFloat(withdrawValue) === 0 ||
      ethers.utils.parseUnits(withdrawValue || '0', staked.decimals).gt(staked.value) // This causes error if number of decimals > 18
  } catch (err) {
    isUnstakeInvalidAmount = true
  }

  const isUnstakeDisabled = isUnstakeInvalidAmount

  const canHarvest = (rewards: Reward[]): boolean => {
    return rewards.some(reward => reward?.amount.gt(BigNumber.from('0')))
  }

  const isHarvestDisabled = !canHarvest(farmRewards)

  const { deposit, withdraw, harvest } = useFairLaunch(farm.fairLaunchAddress)

  const handleStake = async (pid: number) => {
    if (!chainId || !account) {
      return
    }

    dispatch(setShowConfirm(true))
    dispatch(setAttemptingTxn(true))
    dispatch(setTxHash(''))

    try {
      const txHash = await deposit(pid, ethers.utils.parseUnits(depositValue, balance.decimals), pairSymbol, false)
      dispatch(setTxHash(txHash))
    } catch (err) {
      console.error(err)
      dispatch(setYieldPoolsError(err as Error))
    }

    dispatch(setAttemptingTxn(false))
  }

  const handleUnstake = async (pid: number) => {
    if (!chainId || !account) {
      return
    }

    dispatch(setShowConfirm(true))
    dispatch(setAttemptingTxn(true))
    dispatch(setTxHash(''))

    try {
      const txHash = await withdraw(pid, ethers.utils.parseUnits(withdrawValue, staked.decimals), pairSymbol)
      dispatch(setTxHash(txHash))
    } catch (err) {
      console.error(err)
      dispatch(setYieldPoolsError(err as Error))
    }

    dispatch(setAttemptingTxn(false))
  }

  const handleHarvest = async (pid: number) => {
    if (!chainId || !account) {
      return
    }

    dispatch(setShowConfirm(true))
    dispatch(setAttemptingTxn(true))
    dispatch(setTxHash(''))

    try {
      const txHash = await harvest(pid, pairSymbol)
      if (txHash) {
        mixpanelHandler(MIXPANEL_TYPE.INDIVIDUAL_REWARD_HARVESTED, {
          reward_tokens_and_amounts: JSON.stringify(
            farmRewards &&
              Object.assign(
                {},
                ...farmRewards.map(
                  reward =>
                    reward?.token?.symbol && {
                      [reward.token.symbol]: getFullDisplayBalance(reward.amount, reward.token.decimals),
                    },
                ),
              ),
          ),
        })
      }
      dispatch(setTxHash(txHash))
    } catch (err) {
      console.error(err)
      dispatch(setYieldPoolsError(err as Error))
    }

    dispatch(setAttemptingTxn(false))
  }

  const theme = useTheme()

  const [modalType, setModalType] = useState<'stake' | 'unstake' | 'harvest' | null>(null)
  const modalTitle = () => {
    switch (modalType) {
      case 'stake':
        return <Trans>Stake</Trans>
      case 'unstake':
        return <Trans>Unstake</Trans>

      default:
        return <Trans>Harvest</Trans>
    }
  }

  const usd = () => {
    switch (modalType) {
      case 'stake':
        return formattedNum(userLPBalanceUSD.toString(), true)
      case 'unstake':
        return formattedNum(userStakedBalanceUSD.toString(), true)
      default:
        return formattedNum(rewardUSD.toString(), true)
    }
  }

  return (
    <>
      {viewMode === VIEW_MODE.LIST && above1200 && (
        <>
          <TableRow isExpanded={expanded} joined={!!userStakedBalanceUSD}>
            {/* POOLS | AMP */}
            <Column gap="12px">
              <Row>
                <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={16} />
                <Link
                  to={`/add/${currencyIdFromAddress(farm.token0?.id, chainId)}/${currencyIdFromAddress(
                    farm.token1?.id,
                    chainId,
                  )}/${farm.id}`}
                  style={{ textDecoration: 'none', marginRight: '6px' }}
                >
                  {farm.token0?.symbol} - {farm.token1?.symbol}
                </Link>
                {/* <MouseoverTooltip text={farm.time} width="fit-content" placement="top">
                        <Clock size={14} style={{ marginLeft: '6px' }} />
                      </MouseoverTooltip> */}
                <Text
                  color={theme.subText}
                  fontSize="12px"
                  lineHeight="16px"
                  style={{
                    backgroundColor: theme.blue + '20',
                    color: theme.blue,
                    borderRadius: '16px',
                    padding: '2px 4px',
                    whiteSpace: 'nowrap',
                    flex: '0 0 71px',
                  }}
                >
                  AMP = {amp}
                </Text>
              </Row>
              <Row>
                <RowFit gap="6px" marginRight="16px">
                  <CopyHelper toCopy={farm.id} />
                  <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                    <Trans>Address</Trans>
                  </Text>
                </RowFit>
                <RowFit
                  onClick={() => {
                    setSharedPoolAddress(farm.id)
                  }}
                  sx={{
                    cursor: 'pointer',
                  }}
                  role="button"
                  gap="6px"
                >
                  <Share2 size="14px" color={theme.subText} fill={theme.subText} />
                  <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                    <Trans>Share</Trans>
                  </Text>
                </RowFit>
              </Row>
            </Column>
            {/* STAKED TVL */}
            <Row>
              <Text fontSize="14px" fontWeight={400}>
                {formatDollarAmount(liquidity)}
              </Text>
            </Row>
            {/* AVG APR */}
            <Row color={theme.apr} gap="4px">
              {apr.toFixed(2)}%
              {apr !== 0 && (
                <MouseoverTooltip
                  width="fit-content"
                  placement="right"
                  text={
                    <APRTooltipContent farmAPR={farmAPR} poolAPR={tradingFeeAPR < MAX_ALLOW_APY ? tradingFeeAPR : 0} />
                  }
                >
                  <MoneyBag size={16} color={theme.apr} />
                </MouseoverTooltip>
              )}
            </Row>
            {/* ENDING IN */}
            <Column gap="6px">
              {farm.startTime > currentTimestamp ? (
                <>
                  <Text fontSize="12px" color={theme.warning}>
                    <Trans>New phase will start in</Trans>
                  </Text>
                  <Text color={theme.warning}>{getFormattedTimeFromSecond(farm.startTime - currentTimestamp)}</Text>
                </>
              ) : farm.endTime > currentTimestamp ? (
                <>
                  <Text color={theme.subText} fontSize="12px">
                    <Trans>Current phase will end in</Trans>
                  </Text>
                  {getFormattedTimeFromSecond(farm.endTime - currentTimestamp)}
                </>
              ) : (
                <>
                  <Text color={theme.subText} fontSize="12px">
                    <Trans>Ended at</Trans>
                  </Text>
                  {dayjs(farm.endTime * 1000).format('DD-MM-YYYY HH:mm')}
                </>
              )}
            </Column>
            {/* MY DEPOSIT | TARGET VOLUME */}
            <Row>{formattedNum(userStakedBalanceUSD.toString(), true)}</Row>
            {/* MY REWARDS */}
            <Column gap="8px" style={{ alignItems: 'end' }}>
              {farmRewards.map(reward => {
                return (
                  <div key={reward.token.wrapped.address} style={{ marginTop: '2px' }}>
                    <Row gap="4px">
                      {chainId && reward.token.wrapped.address && (
                        <CurrencyLogo currency={reward.token} size="16px" style={{ marginLeft: '3px' }} />
                      )}
                      {getFullDisplayBalance(reward.amount, reward.token.decimals)}
                    </Row>
                  </div>
                )
              })}
            </Column>
            {/* ACTIONS */}
            <Row gap="4px" justify="flex-end">
              <ActionButton
                backgroundColor={theme.subText + '33'}
                disabled={isHarvestDisabled}
                onClick={() => {
                  setModalType('harvest')
                }}
              >
                <MouseoverTooltip text={t`Harvest`} placement="top" width="fit-content">
                  <Harvest color={theme.subText} />
                </MouseoverTooltip>
              </ActionButton>
              <ActionButton
                backgroundColor={theme.subText + '33'}
                onClick={() => {
                  setModalType('unstake')
                }}
              >
                <MouseoverTooltip text={t`Unstake`} placement="top" width="fit-content">
                  <Minus color={theme.subText} size={16} />
                </MouseoverTooltip>
              </ActionButton>
              <ActionButton
                disabled={type === 'ended'}
                onClick={() => {
                  setModalType('stake')
                }}
              >
                <MouseoverTooltip text={t`Stake`} placement="top" width="fit-content">
                  <Plus color={type !== 'ended' ? theme.primary : theme.subText} size={16} />
                </MouseoverTooltip>
              </ActionButton>
              <ActionButton backgroundColor={theme.subText + '33'} onClick={() => setExpanded(prev => !prev)}>
                <MouseoverTooltip text={t`Expand`} placement="top" width="fit-content">
                  <DropdownSVG
                    color={theme.subText}
                    width="24px"
                    height="24px"
                    style={{ rotate: expanded ? '180deg' : 'unset', transition: 'rotate 0.2s ease' }}
                  />
                </MouseoverTooltip>
              </ActionButton>
            </Row>
            {expanded ? (
              <>
                <Column gap="4px" style={{ gridColumn: '1/3' }}>
                  <Text fontSize={12} color={theme.subText} lineHeight="16px">
                    <Trans>Current Price:</Trans>
                  </Text>
                  <Text>
                    <RatioPrice currency0={currency0} currency1={currency1} />
                  </Text>
                </Column>
                {!!userStakedBalanceUSD && (
                  <Column gap="4px" style={{ gridColumn: '3' }}>
                    <Text fontSize={12} color={theme.subText} lineHeight="16px">
                      <Trans>My APR</Trans>
                    </Text>
                    <Text fontSize={14} color={theme.apr} lineHeight="20px">
                      <Trans>{!!apr ? apr.toFixed(2) + '%' : '--'}</Trans>
                    </Text>
                  </Column>
                )}
                <Column gap="4px" style={{ gridColumn: '4' }}>
                  <Text fontSize={12} color={theme.subText} lineHeight="16px">
                    <Trans>Farming Time</Trans>
                  </Text>
                  <Text>
                    <Trans>--</Trans>
                  </Text>
                </Column>
                {!!userStakedBalanceUSD && (
                  <Row alignSelf="start" justify="flex-end" style={{ gridColumn: '5/-1' }} color={theme.subText}>
                    <Link to={'/myPools?' + createSearchParams({ tab: 'classic', search: farm.id })}>
                      <Row>
                        <DropSVG />
                        <Text fontSize={12} lineHeight="16px">
                          <Trans>My Pools</Trans> ↗
                        </Text>
                      </Row>
                    </Link>
                  </Row>
                )}
              </>
            ) : (
              <></>
            )}
          </TableRow>
        </>
      )}
      {(viewMode === VIEW_MODE.GRID || !above1200) && (
        <FarmCard key={`${farm.fairLaunchAddress}_${farm.stakeToken}`} joined={!!userStakedBalanceUSD}>
          <Row marginBottom="12px">
            <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={20} />
            <Text fontSize="16px" fontWeight="500" marginRight="4px" color={theme.green}>
              {currency0?.symbol} - {currency1?.symbol}
            </Text>
            <Text
              fontSize={12}
              lineHeight="16px"
              style={{
                backgroundColor: theme.blue + '20',
                color: theme.blue,
                borderRadius: '16px',
                padding: '2px 4px',
              }}
            >
              AMP {farm.amp / 10000}
            </Text>
          </Row>
          <RowBetween marginBottom="16px">
            <RowFit color={theme.subText} fontSize={12} gap="4px">
              <CopyHelper toCopy={farm.id} />
              {shortenAddress(chainId, farm.id, 3)}
            </RowFit>
            <RowFit>
              <Share2
                fill={theme.subText}
                size="14px"
                color={theme.subText}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSharedPoolAddress(farm.id)
                }}
              />
            </RowFit>
          </RowBetween>
          <RowBetween marginBottom="2px">
            <MouseoverTooltip
              text={<APRTooltipContent farmAPR={farmAPR} poolAPR={tradingFeeAPR < MAX_ALLOW_APY ? tradingFeeAPR : 0} />}
            >
              <Text
                width="fit-content"
                lineHeight="16px"
                fontSize="12px"
                fontWeight="500"
                color={theme.subText}
                sx={{ borderBottom: `1px dashed ${theme.border}` }}
              >
                <Trans>Avg APR</Trans>
              </Text>
            </MouseoverTooltip>
            <MouseoverTooltip text={<></>}>
              <Text
                width="fit-content"
                lineHeight="16px"
                fontSize="12px"
                fontWeight="500"
                color={theme.subText}
                sx={{ borderBottom: `1px dashed ${theme.border}` }}
              >
                <Trans>My APR</Trans>
              </Text>
            </MouseoverTooltip>
          </RowBetween>
          <RowBetween marginBottom="16px">
            <Text fontSize={28} lineHeight="32px" color={theme.apr} fontWeight={500}>
              {!!apr ? apr.toFixed(2) + '%' : '--'}
            </Text>
            <Text fontSize={28} lineHeight="32px" color={theme.apr} fontWeight={500}>
              {!!apr ? apr.toFixed(2) + '%' : '--'}
            </Text>
          </RowBetween>
          <RowBetween marginBottom="4px">
            <Text fontSize={12} color={theme.subText} lineHeight="16px">
              <Trans>Staked TVL</Trans>
            </Text>
            {farm.startTime > currentTimestamp ? (
              <Text fontSize={12} lineHeight="16px" color={theme.warning}>
                <Trans>New phase will start in</Trans>
              </Text>
            ) : farm.endTime > currentTimestamp ? (
              <Text fontSize={12} color={theme.subText} lineHeight="16px">
                <Trans>Current phase will end in</Trans>
              </Text>
            ) : (
              <Text fontSize={12} color={theme.subText} lineHeight="16px">
                <Trans>Ended at</Trans>
              </Text>
            )}
          </RowBetween>
          <RowBetween marginBottom="16px">
            <Text fontSize="16px" color={theme.text} lineHeight="20px">
              {formatDollarAmount(liquidity)}
            </Text>
            {farm.startTime !== undefined ? (
              farm.startTime > currentTimestamp ? (
                <Text color={theme.warning}>{getFormattedTimeFromSecond(farm.startTime - currentTimestamp)}</Text>
              ) : farm.endTime > currentTimestamp ? (
                <>{getFormattedTimeFromSecond(farm.endTime - currentTimestamp)}</>
              ) : (
                <>{dayjs(farm.endTime * 1000).format('DD-MM-YYYY HH:mm')}</>
              )
            ) : (
              '--'
            )}
          </RowBetween>
          <Divider marginBottom="16px" />
          <RowBetween marginBottom="4px">
            <Text fontSize={12} color={theme.subText} lineHeight="16px">
              <Trans>My Deposit</Trans>
            </Text>
            <Text fontSize={12} color={theme.subText} lineHeight="16px">
              <Trans>Farming Time</Trans>
            </Text>
          </RowBetween>
          <RowBetween marginBottom="16px">
            <Text fontSize="16px" color={theme.text} lineHeight="20px">
              {!!userStakedBalanceUSD ? formatDollarAmount(userStakedBalanceUSD) : '--'}
            </Text>
            <Text fontSize="16px" color={theme.text} lineHeight="20px">
              --
            </Text>
          </RowBetween>
          <RowBetween marginBottom="16px">
            <Column gap="4px">
              <Text fontSize={12} color={theme.subText} lineHeight="16px" marginBottom="4px">
                <Trans>My Rewards</Trans>
              </Text>
              <Row gap="8px">
                {farmRewards.map((reward, index, arr) => {
                  return (
                    <>
                      <RowFit key={reward.token.wrapped.address} gap="4px" fontSize="12px" lineHeight="16px">
                        {chainId && reward.token.wrapped.address && (
                          <CurrencyLogo currency={reward.token} size="16px" />
                        )}
                        {!!reward.amount && getFullDisplayBalance(reward.amount, reward.token.decimals)}
                      </RowFit>
                      {index !== arr.length - 1 && (
                        <div style={{ height: '10px', width: '1px', backgroundColor: theme.border }} />
                      )}
                    </>
                  )
                })}
              </Row>
            </Column>
            <CardButton
              color={theme.apr}
              flex="0 0 fit-content"
              disabled={isHarvestDisabled}
              onClick={() => {
                handleHarvest(farm.pid)
              }}
            >
              <Harvest />
              <Trans>Harvest</Trans>
            </CardButton>
          </RowBetween>
          <Row gap="16px">
            <CardButton flex={1} onClick={() => setModalType('unstake')} color={theme.red}>
              <Minus size={16} />
              <Trans>Unstake</Trans>
            </CardButton>
            <CardButton flex={1} onClick={() => setModalType('stake')} color={theme.primary}>
              <Plus size={16} />
              <Trans>Stake</Trans>
            </CardButton>
          </Row>
        </FarmCard>
      )}
      <Modal isOpen={!!modalType} onDismiss={() => setModalType(null)}>
        <ModalContentWrapper>
          <Flex alignItems="center" justifyContent="space-between" marginBottom="1rem">
            <Flex>
              <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={24} />
              <Text fontSize="20px" fontWeight="500">
                {modalTitle()}
              </Text>
            </Flex>
            <ButtonEmpty onClick={() => setModalType(null)} width="36px" height="36px" padding="0">
              <X color={theme.text} />
            </ButtonEmpty>
          </Flex>

          {modalType !== 'harvest' && <Divider />}

          <Flex justifyContent="space-between" alignItems="center" marginTop="1rem">
            <Text color={theme.subText} fontSize="0.75rem">
              {modalType === 'harvest' ? <Trans>My Rewards</Trans> : <Trans>Available Balance</Trans>}
            </Text>
            <Text fontSize="0.75rem" fontWeight="500">
              {usd()}
            </Text>
          </Flex>

          <RewardBalanceWrapper>
            {modalType === 'harvest' &&
              farmRewards.map((reward, index) => {
                return (
                  <React.Fragment key={reward.token.wrapped.address}>
                    <Flex alignItems="center" fontSize="12px" sx={{ gap: '4px' }}>
                      {chainId && reward.token.wrapped.address && <CurrencyLogo currency={reward.token} size="16px" />}
                      {getFullDisplayBalance(reward.amount, reward.token.decimals)}
                    </Flex>
                    {index !== farmRewards.length - 1 && <Text color={theme.subText}>|</Text>}
                  </React.Fragment>
                )
              })}

            {modalType && ['stake', 'unstake'].includes(modalType) && (
              <>
                <Flex alignItems="center" fontSize="12px" sx={{ gap: '4px' }}>
                  <CurrencyLogo currency={currency0} size="16px" />
                  <Text textAlign="right" fontSize="0.75rem" color={theme.subText}>
                    {formatTokenBalance(modalType === 'stake' ? userToken0Balance : userStakedToken0Balance)}
                  </Text>
                </Flex>
                <Text color={theme.subText}>|</Text>

                <Flex alignItems="center" fontSize="12px" sx={{ gap: '4px' }}>
                  <CurrencyLogo currency={currency1} size="16px" />
                  <Text textAlign="right" fontSize="0.75rem" color={theme.subText}>
                    {formatTokenBalance(modalType === 'stake' ? userToken1Balance : userStakedToken1Balance)}
                  </Text>
                </Flex>
              </>
            )}
          </RewardBalanceWrapper>

          {modalType !== 'harvest' && <Divider />}

          {modalType === 'harvest' ? (
            <ButtonPrimary
              margin="8px 0 0"
              onClick={() => {
                handleHarvest(farm.pid)
                setModalType(null)
              }}
            >
              Harvest
            </ButtonPrimary>
          ) : (
            <>
              <Flex marginTop="20px">
                {!account ? (
                  <ButtonLight onClick={toggleWalletModal}>
                    <Trans>Connect Wallet</Trans>
                  </ButtonLight>
                ) : (
                  approvalState === ApprovalState.UNKNOWN && <Dots></Dots>
                )}
                {(approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING) && (
                  <ButtonPrimary
                    color="blue"
                    disabled={approvalState === ApprovalState.PENDING}
                    onClick={approve}
                    padding="12px"
                  >
                    {approvalState === ApprovalState.PENDING ? (
                      <Dots>
                        <Trans>Approving </Trans>
                      </Dots>
                    ) : (
                      <Trans>Approve</Trans>
                    )}
                  </ButtonPrimary>
                )}
                {approvalState === ApprovalState.APPROVED && chainId && (
                  <>
                    {modalType === 'stake' ? (
                      <CurrencyInputPanel
                        value={depositValue}
                        onUserInput={value => {
                          setDepositValue(value)
                        }}
                        onMax={() => {
                          setDepositValue(fixedFormatting(balance.value, balance.decimals))
                        }}
                        onHalf={() => {
                          setDepositValue(fixedFormatting(balance.value.div(2), balance.decimals))
                        }}
                        currency={new Token(chainId, farm.id, balance.decimals, `${pairSymbol}`, `${pairSymbol}`)}
                        id="stake-lp-input"
                        disableCurrencySelect
                        positionMax="top"
                        hideLogo={true}
                        fontSize="14px"
                        customCurrencySelect={
                          <ButtonPrimary
                            disabled={isStakeDisabled}
                            padding="8px 12px"
                            width="max-content"
                            style={{ minWidth: '80px' }}
                            onClick={() => handleStake(farm.pid)}
                          >
                            {depositValue && isStakeInvalidAmount ? 'Invalid Amount' : 'Stake'}
                          </ButtonPrimary>
                        }
                      />
                    ) : (
                      <CurrencyInputPanel
                        value={withdrawValue}
                        onUserInput={value => {
                          setWithdrawValue(value)
                        }}
                        onMax={() => {
                          setWithdrawValue(fixedFormatting(staked.value, staked.decimals))
                        }}
                        onHalf={() => {
                          setWithdrawValue(fixedFormatting(staked.value.div(2), staked.decimals))
                        }}
                        currency={new Token(chainId, farm.id, balance.decimals, `${pairSymbol}`, `${pairSymbol}`)}
                        id="unstake-lp-input"
                        disableCurrencySelect
                        customBalanceText={`${fixedFormatting(staked.value, staked.decimals)}`}
                        positionMax="top"
                        hideLogo={true}
                        fontSize="14px"
                        customCurrencySelect={
                          <ButtonPrimary
                            disabled={isUnstakeDisabled}
                            padding="8px 12px"
                            width="max-content"
                            style={{ minWidth: '80px' }}
                            onClick={() => handleUnstake(farm.pid)}
                          >
                            {withdrawValue && isUnstakeInvalidAmount ? 'Invalid Amount' : 'Unstake'}
                          </ButtonPrimary>
                        }
                      />
                    )}
                  </>
                )}
              </Flex>
              <Flex justifyContent="space-between" sx={{ gap: '8px' }} alignItems="center" marginTop="20px">
                <ExternalLink
                  href={outsideFarm ? outsideFarm.poolInfoLink : `${DMM_ANALYTICS_URL[chainId]}/pool/${farm.id}`}
                >
                  <GetLP>
                    <Trans>Get pool {outsideFarm ? `(${outsideFarm.name})` : ''} info</Trans> ↗
                  </GetLP>
                </ExternalLink>
                {outsideFarm ? (
                  <ExternalLink href={outsideFarm.getLPTokenLink}>
                    <GetLP>
                      <Trans>
                        Get {farm.token0?.symbol}-{farm.token1?.symbol} {outsideFarm ? `(${outsideFarm.name})` : ''} LP
                        ↗
                      </Trans>
                    </GetLP>
                  </ExternalLink>
                ) : (
                  <Link
                    to={`/add/${currencyIdFromAddress(farm.token0?.id, chainId)}/${currencyIdFromAddress(
                      farm.token1?.id,
                      chainId,
                    )}/${farm.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <GetLP style={{ textAlign: 'right' }}>
                      <Trans>
                        Get {farm.token0?.symbol}-{farm.token1?.symbol} LP ↗
                      </Trans>
                    </GetLP>
                  </Link>
                )}
              </Flex>
            </>
          )}
        </ModalContentWrapper>
      </Modal>
    </>
  )
}

export default ListItem
