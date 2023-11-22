import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import mixpanel from 'mixpanel-browser'
import { useState } from 'react'
import { Minus, Plus, RefreshCw } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import { NormalizedFarm } from 'services/knprotocol'
import styled from 'styled-components'

import { ReactComponent as AprIcon } from 'assets/svg/apr.svg'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Harvest from 'components/Icons/Harvest'
import InfoHelper from 'components/InfoHelper'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { ButtonColorScheme, MinimalActionButton } from 'components/YieldPools/ElasticFarmGroup/buttons'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ProtocolType } from 'hooks/farms/useFarmFilters'
import useTheme from 'hooks/useTheme'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { formatDisplayNumber } from 'utils/numbers'

import { ChainLogo, Tag } from '../styled'
import { HeaderWrapper } from './FarmTableHeader'
import StakeModal from './StakeModal'
import StakeStaticFarmModal from './StakeStaicFarmModal'
import UnstakeModal from './UnstakeModal'
import UnstakeStaticFarmModal from './UnstakeStaticFarmModal'

const Row = styled(HeaderWrapper)(({ theme }) => ({
  background: 'transparent',
  padding: '1rem 1.5rem',
  fontSize: '14px',
  fontWeight: '500',
  borderBottom: `1px solid ${theme.border}`,
}))

export const getFeeOrAMPTag = (pool: NormalizedFarm) => {
  if (pool.protocol === ProtocolType.Classic && 'amp' in pool.pool) {
    return `AMP ${pool.pool.amp}`
  }
  if ('feeTier' in pool.pool) return `Fee ${(+pool.pool.feeTier * 100) / ELASTIC_BASE_FEE_UNIT}%`

  return ''
}

export default function FarmTableRow({ farm, onHarvest }: { farm: NormalizedFarm; onHarvest: () => void }) {
  const { account } = useActiveWeb3React()
  const [showStake, setShowStake] = useState(false)
  const [showUnStake, setShowUnStake] = useState(false)
  const theme = useTheme()
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const isEnded = currentTimestamp > farm.endTime

  const tagColor =
    farm.protocol === ProtocolType.Static
      ? theme.warning
      : farm.protocol === ProtocolType.Dynamic
      ? theme.primary
      : theme.subText

  const mixpanelPayload = {
    farm_pool_address: farm.pool.id,
    farm_id: farm.id,
    // farm_fid: farm.fId
  }

  const myStakedLiq = farm.positions?.reduce((acc, item) => acc + (+item.stakedUSD || 0), 0) || 0

  const canStake = !!account && !isEnded && !farm.isSettled && !!farm.availablePositions?.length

  const availableTvl =
    farm.isSettled || isEnded
      ? 0
      : farm.positions.reduce((acc, cur) => acc + (+cur.amountUSD - (+cur.stakedUSD || 0)), 0)
  const totalLiq = myStakedLiq + availableTvl

  const canUnstake = farm.positions?.some(
    item =>
      item.joinedPositions?.length ||
      !!item.depositedPosition ||
      !!item.farmV2DepositedPositions?.some(dp => dp.pendingRewards?.some(rw => rw !== '0')),
  )

  const hasRewards = farm.rewardAmounts.some(rw => rw.toExact() !== '0')

  const canUpdateLiquidity = false

  return (
    <>
      <Row>
        <Flex alignItems="center" sx={{ gap: '12px' }}>
          <Box sx={{ position: 'relative' }}>
            <DoubleCurrencyLogo currency0={farm.token0} currency1={farm.token1} size={36} />
            <ChainLogo src={farm.chain.icon} />
          </Box>
          <Flex flexDirection="column" sx={{ gap: '4px' }}>
            <Text fontSize="14px" fontWeight="500">
              {farm.token0.symbol} - {farm.token1.symbol}
            </Text>
            <Flex sx={{ gap: '4px' }}>
              <Tag color={tagColor}>{farm.protocol[0].toUpperCase() + farm.protocol.slice(1)}</Tag>
              <Tag color={theme.subText}>{getFeeOrAMPTag(farm)}</Tag>
            </Flex>
          </Flex>
        </Flex>

        <Text textAlign="right">
          {formatDisplayNumber(farm.stakedTvl, { style: 'currency', significantDigits: 6 })}
        </Text>

        <Flex justifyContent="flex-end" sx={{ gap: '4px' }} alignItems="center">
          {farm.apr.toFixed(2)}%
          <AprIcon />
        </Flex>

        <Text textAlign="right">
          {farm.isSettled ? (
            <Trans>ENDED</Trans>
          ) : isEnded ? (
            <>
              <Text color={theme.subText} marginBottom="4px" fontSize={12}>
                <Trans>Ended At</Trans>
              </Text>
              <Text>{dayjs(farm.endTime * 1000).format('DD/MM/YYYY HH:mm')}</Text>{' '}
            </>
          ) : (
            getFormattedTimeFromSecond(farm.endTime - currentTimestamp)
          )}
        </Text>

        <Text
          justifyContent="flex-end"
          color={availableTvl ? theme.warning : theme.text}
          display="flex"
          alignItems="center"
        >
          {totalLiq ? formatDisplayNumber(totalLiq, { style: 'currency', significantDigits: 4 }) : '--'}
          {!!availableTvl && (
            <InfoHelper
              color={theme.warning}
              text={
                <Flex flexDirection="column" sx={{ gap: '6px', fontSize: '12px', fontWeight: '500' }}>
                  <Text as="span" color={theme.subText}>
                    <Trans>
                      You still have {formatDisplayNumber(availableTvl, { style: 'currency', significantDigits: 4 })} in
                      liquidity to stake to earn even more farming rewards
                    </Trans>
                  </Text>
                  <Text as="span" color={theme.text}>
                    Staked: {formatDisplayNumber(myStakedLiq, { style: 'currency', significantDigits: 4 })}
                  </Text>
                  <Text as="span" color={theme.warning}>
                    Not staked: {formatDisplayNumber(availableTvl, { style: 'currency', significantDigits: 4 })}
                  </Text>
                </Flex>
              }
            />
          )}
        </Text>
        <Flex flexDirection="column" alignItems="flex-end" width="100%" sx={{ gap: '4px' }}>
          {farm.rewardAmounts.map(item => (
            <Flex key={item.currency.wrapped.address} alignItems="center" sx={{ gap: '4px' }}>
              {formatDisplayNumber(item.toExact(), { style: 'decimal', significantDigits: 6 })}
              <CurrencyLogo currency={item.currency} size="16px" />
            </Flex>
          ))}
        </Flex>

        <Flex justifyContent="flex-end" sx={{ gap: '4px' }}>
          <MouseoverTooltipDesktopOnly text={t`Stake`} placement="top" width="fit-content">
            <MinimalActionButton
              disabled={!canStake}
              onClick={() => {
                setShowStake(true)
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
                  // onUpdateFarmClick()
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
                setShowUnStake(true)
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
                onHarvest()
                mixpanel.track('ElasticFarmV2 - Harvest Clicked', mixpanelPayload)
              }}
            >
              <Harvest />
            </MinimalActionButton>
          </MouseoverTooltipDesktopOnly>
        </Flex>
      </Row>
      {showStake &&
        (farm.protocol === ProtocolType.Dynamic ? (
          <StakeModal farm={farm} onDismiss={() => setShowStake(false)} />
        ) : (
          <StakeStaticFarmModal farm={farm} onDismiss={() => setShowStake(false)} />
        ))}
      {showUnStake &&
        (farm.protocol === ProtocolType.Dynamic ? (
          <UnstakeModal farm={farm} onDismiss={() => setShowUnStake(false)} />
        ) : (
          <UnstakeStaticFarmModal farm={farm} onDismiss={() => setShowUnStake(false)} />
        ))}
    </>
  )
}
