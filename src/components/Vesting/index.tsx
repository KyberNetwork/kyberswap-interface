import React from 'react'
import { Flex } from 'rebass'
import { BigNumber } from '@ethersproject/bignumber'
import { t, Trans } from '@lingui/macro'

import { Token, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { AutoRow } from 'components/Row'
import InfoHelper from 'components/InfoHelper'
import { VestPeriods, NoVestingSchedule } from 'components/Vesting/styleds'
import RewardLockerSchedules from 'components/Vesting/RewardLockerSchedules'
import useTheme from 'hooks/useTheme'
import { useBlockNumber } from 'state/application/hooks'
import { Reward, RewardLockerVersion } from 'state/farms/types'
import { useRewardLockerAddressesWithVersion, useSchedules } from 'state/vesting/hooks'
import { TYPE } from 'theme'
import { useFarmRewardsUSD } from 'utils/dmm'
import ConfirmVestingModal from './ConfirmVestingModal'
import LocalLoader from 'components/LocalLoader'
import VestingSummary from './VestingSummary'

const Vesting = ({ loading }: { loading: boolean }) => {
  const { schedulesByRewardLocker } = useSchedules()
  const rewardLockerAddressesWithVersion = useRewardLockerAddressesWithVersion()
  const theme = useTheme()
  const currentBlockNumber = useBlockNumber()
  const currentTimestamp = Math.round(Date.now() / 1000)

  const schedules = Object.values(schedulesByRewardLocker).flat()

  const info = schedules.reduce<{
    [key: string]: {
      vestableIndexes: number[]
      vestableAmount: BigNumber
      fullyIndexes: number[]
      fullyAmount: BigNumber
      totalAmount: BigNumber
      unlockedAmount: BigNumber
      token: Token
    }
  }>((result, schedule) => {
    if (!currentBlockNumber) return result
    const address = (schedule[4] as Token).symbol as string
    if (!result[address]) {
      result[address] = {
        vestableIndexes: [],
        vestableAmount: BigNumber.from(0),
        fullyIndexes: [],
        fullyAmount: BigNumber.from(0),
        totalAmount: BigNumber.from(0),
        unlockedAmount: BigNumber.from(0),
        token: schedule[4] as Token,
      }
    }

    result[address].totalAmount = result[address].totalAmount.add(BigNumber.from(schedule[2]))
    /**
     * fullyVestedAlready = schedule.quantity - schedule.vestedQuantity
     */
    const fullyVestedAlready = BigNumber.from(schedule[2])
      .sub(BigNumber.from(schedule[3]))
      .isZero()
    const rewardLockerVersion = schedule[6]
    /**
     * v1: isEnd = schedule.endBlock < currentBlock
     * v2: isEnd = schedule.endTime < now
     */
    const isEnd =
      rewardLockerVersion === RewardLockerVersion.V1
        ? schedule[1].lt(currentBlockNumber)
        : schedule[1].lt(currentTimestamp)
    // const vestedAndVestablePercent = BigNumber.from(currentBlockNumber)
    //   .sub(BigNumber.from(s[1]))
    //   .isNegative()
    //   ? BigNumber.from(currentBlockNumber)
    //       .sub(BigNumber.from(s[0]))
    //       .mul(100)
    //       .div(BigNumber.from(s[1]).sub(BigNumber.from(s[0])))
    //   : 100
    // const unlockedAmount = BigNumber.from(s[2])
    //   .mul(vestedAndVestablePercent)
    //   .div(100)
    const unlockedAmount = isEnd
      ? schedule[2]
      : rewardLockerVersion === RewardLockerVersion.V1
      ? schedule[2].mul(BigNumber.from(currentBlockNumber).sub(schedule[0])).div(schedule[1].sub(schedule[0]))
      : schedule[2].mul(BigNumber.from(currentTimestamp).sub(schedule[0])).div(schedule[1].sub(schedule[0]))
    const vestableAmount = unlockedAmount.sub(BigNumber.from(schedule[3])) // vestableAmount = unlock - vestedQuanitty
    if (!fullyVestedAlready) {
      result[address].vestableIndexes.push(schedule[5])
    }
    result[address].vestableAmount = result[address].vestableAmount.add(
      vestableAmount.isNegative() ? BigNumber.from(0) : vestableAmount,
    )

    if (!fullyVestedAlready && !!currentBlockNumber && BigNumber.from(currentBlockNumber).gt(schedule[1])) {
      result[address].fullyIndexes.push(schedule[5])
      result[address].fullyAmount = result[address].fullyAmount.add(BigNumber.from(schedule[2]))
    }

    result[address].unlockedAmount = result[address].unlockedAmount.add(unlockedAmount)
    return result
  }, {})

  const totalUSD = useFarmRewardsUSD(
    Object.keys(info).map(k => {
      return { token: info[k].token, amount: info[k].totalAmount } as Reward
    }),
  )

  const totalHarvested = {
    value: totalUSD,
    amountByAddress: Object.values(info).reduce((acc, item) => {
      const address = (item.token.isNative ? item.token.symbol : item.token.address) as string
      return {
        ...acc,
        [address]: CurrencyAmount.fromRawAmount(item.token, item.totalAmount.toString()),
      }
    }, {}),
  }

  const lockedUSD = useFarmRewardsUSD(
    Object.keys(info).map(k => {
      return { token: info[k].token, amount: info[k].totalAmount.sub(info[k].unlockedAmount) } as Reward
    }),
  )

  const locked = {
    value: lockedUSD,
    amountByAddress: Object.values(info).reduce((acc, item) => {
      const address = (item.token.isNative ? item.token.symbol : item.token.address) as string
      return {
        ...acc,
        [address]: CurrencyAmount.fromRawAmount(item.token, item.totalAmount.sub(item.unlockedAmount).toString()),
      }
    }, {}),
  }

  const claimedUSD = useFarmRewardsUSD(
    Object.keys(info).map(k => {
      return { token: info[k].token, amount: info[k].unlockedAmount.sub(info[k].vestableAmount) } as Reward
    }),
  )

  const claimed = {
    value: claimedUSD,
    amountByAddress: Object.values(info).reduce((acc, item) => {
      const address = (item.token.isNative ? item.token.symbol : item.token.address) as string
      return {
        ...acc,
        [address]: CurrencyAmount.fromRawAmount(item.token, item.unlockedAmount.sub(item.vestableAmount).toString()),
      }
    }, {}),
  }
  const unlockedUSD = useFarmRewardsUSD(
    Object.keys(info).map(k => {
      return { token: info[k].token, amount: info[k].vestableAmount } as Reward
    }),
  )

  const unlocked = {
    value: unlockedUSD,
    amountByAddress: Object.values(info).reduce((acc, item) => {
      const address = (item.token.isNative ? item.token.symbol : item.token.address) as string
      return {
        ...acc,
        [address]: CurrencyAmount.fromRawAmount(item.token, item.vestableAmount.toString()),
      }
    }, {}),
  }

  const noVesting = Object.keys(rewardLockerAddressesWithVersion).every(
    rewardLockerAddress => !schedulesByRewardLocker[rewardLockerAddress]?.length,
  )

  return (
    <>
      <ConfirmVestingModal />
      <VestingSummary
        loading={loading}
        totalHarvested={totalHarvested}
        locked={locked}
        unlocked={unlocked}
        claimed={claimed}
      />

      <VestPeriods>
        <AutoRow>
          <TYPE.body color={theme.text11} fontWeight={600} fontSize={16} marginRight="6px">
            <Trans>VESTING PERIODS</Trans>
          </TYPE.body>
          <InfoHelper
            text={t`Each time you harvest new rewards, a new vesting schedule (duration depends on the pool) is created. Multiple vesting schedules can run concurrently. Unlocked rewards can be claimed at any time with no deadline.`}
          />
        </AutoRow>
      </VestPeriods>

      {noVesting ? (
        loading ? (
          <Flex backgroundColor={theme.background}>
            <LocalLoader />
          </Flex>
        ) : (
          <NoVestingSchedule>
            <Trans>No vesting schedule!</Trans>
          </NoVestingSchedule>
        )
      ) : (
        <div
          style={{
            backgroundColor: theme.background,
            borderRadius: '8px',
            boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          {Object.keys(rewardLockerAddressesWithVersion)
            .filter(rewardLockerAddress => !!schedulesByRewardLocker[rewardLockerAddress]?.length)
            .map((rewardLockerAddress, index) => (
              <RewardLockerSchedules
                idx={index + 1}
                key={rewardLockerAddress}
                rewardLockerAddress={rewardLockerAddress}
                schedules={schedulesByRewardLocker[rewardLockerAddress]}
                rewardLockerVersion={rewardLockerAddressesWithVersion[rewardLockerAddress]}
              />
            ))}
        </div>
      )}
    </>
  )
}

export default Vesting
