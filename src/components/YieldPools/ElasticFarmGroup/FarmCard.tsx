import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode, useState } from 'react'
import { Share2 } from 'react-feather'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import bgimg from 'assets/images/farm-card-background.png'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverDropdown from 'components/HoverDropdown'
import { MoneyBag, Swap as SwapIcon } from 'components/Icons'
import InfoHelper from 'components/InfoHelper'
import { MouseoverTooltip } from 'components/Tooltip'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { TOBE_EXTENDED_FARMING_POOLS } from 'constants/v2'
import useTheme from 'hooks/useTheme'
import { FarmingPool, NFTPosition } from 'state/farms/elastic/types'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { formatDollarAmount } from 'utils/numbers'

import { APRTooltipContent } from '../FarmingPoolAPRCell'
import { useSharePoolContext } from '../SharePoolContext'
import PositionDetail from './PostionDetail'
import { ButtonColorScheme, MinimalActionButton } from './buttons'
import { FeeTag } from './styleds'

const FlipCard = styled.div<{ flip: boolean }>`
  border-radius: 20px;
  padding: 16px;
  background-image: url(${bgimg});
  background-size: cover;
  background-repeat: no-repeat;
  background-color: ${({ theme }) => theme.buttonBlack};
  position: relative;
  transition: transform 0.6s;
  transform-style: preserve-3d;

  transform: rotateY(${({ flip }) => (flip ? '-180deg' : '0')});
`

const FlipCardFront = styled.div`
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
`

const FlipCardBack = styled.div`
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: rotateY(-180deg);
  height: 100%;
  display: flex;
  flex-direction: column;
`

interface Pool extends FarmingPool {
  tvl: number
  poolAPR: number
  farmAPR: number
  depositedUsd: number
  stakedUsd: number
}

type Props = {
  pool: Pool
  rewardPendings: CurrencyAmount<Currency>[]
  depositedPositions: NFTPosition[]
  rewardValue: number
  renderHarvestButton: () => ReactNode
  renderStakeButton: () => ReactNode
  renderUnstakeButton: () => ReactNode
  farmAddress: string
  tokenPrices: { [key: string]: number }
  targetPercent: string
}

const FarmCard = ({
  renderUnstakeButton,
  renderStakeButton,
  renderHarvestButton,
  pool,
  rewardValue,
  rewardPendings,
  depositedPositions,
  farmAddress,
  tokenPrices,
  targetPercent,
}: Props) => {
  const theme = useTheme()
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const isFarmEnded = pool.endTime < currentTimestamp

  const amountCanStaked = isFarmEnded ? 0 : pool.depositedUsd - pool.stakedUsd
  const setSharePoolAddress = useSharePoolContext()
  const [showPosition, setShowPosition] = useState(false)

  return (
    <FlipCard flip={showPosition}>
      {!showPosition && (
        <FlipCardFront>
          <Flex alignItems="center" justifyContent="space-between">
            <Flex alignItems="center">
              <DoubleCurrencyLogo currency0={pool.token0} currency1={pool.token1} size={20} />
              <Link
                to={`/elastic/add/${pool.token0.isNative ? pool.token0.symbol : pool.token0.address}/${
                  pool.token1.isNative ? pool.token1.symbol : pool.token1.address
                }/${pool.pool.fee}`}
                style={{
                  textDecoration: 'none',
                }}
              >
                <Text fontSize={16} fontWeight={500}>
                  {pool.token0.symbol} - {pool.token1.symbol}
                </Text>
              </Link>

              <FeeTag>FEE {(pool.pool.fee * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>
            </Flex>

            <Flex sx={{ gap: '4px' }}>
              <MinimalActionButton colorScheme={ButtonColorScheme.Gray} cardMode>
                <CopyHelper toCopy={pool.poolAddress} style={{ marginLeft: 0, padding: '12px' }} />
              </MinimalActionButton>
              <MinimalActionButton
                colorScheme={ButtonColorScheme.Gray}
                cardMode
                onClick={() => {
                  setSharePoolAddress(pool.poolAddress)
                }}
              >
                <Share2 size="16px" color={theme.subText} />
              </MinimalActionButton>
            </Flex>
          </Flex>

          <MouseoverTooltip
            text={t`Average estimated return based on yearly fees of the pool and if it's still active, plus bonus rewards of the pool`}
          >
            <Text
              width="fit-content"
              lineHeight="16px"
              fontSize="12px"
              fontWeight="500"
              color={theme.subText}
              sx={{ borderBottom: `1px dashed ${theme.border}` }}
              marginTop="20px"
            >
              <Trans>Avg APR</Trans>
            </Text>
          </MouseoverTooltip>

          <Flex
            alignItems="center"
            justifyContent="flex-start"
            fontSize="36px"
            fontWeight="500"
            color={theme.apr}
            sx={{
              gap: '4px',
            }}
          >
            {(pool.farmAPR + pool.poolAPR).toFixed(2)}%
            <MouseoverTooltip
              width="fit-content"
              placement="right"
              text={<APRTooltipContent farmAPR={pool.farmAPR} poolAPR={pool.poolAPR} />}
            >
              <MoneyBag size={28} color={theme.apr} />
            </MouseoverTooltip>
          </Flex>

          <Flex justifyContent="space-between" marginTop="20px" fontSize="12px" fontWeight="500" color={theme.subText}>
            <Text>
              <Trans>Staked TVL</Trans>
            </Text>

            {pool.startTime > currentTimestamp ? (
              <Text color={theme.warning}>
                <Trans>New phase will start in</Trans>
              </Text>
            ) : pool.endTime > currentTimestamp ? (
              <Trans>Current phase will end in</Trans>
            ) : TOBE_EXTENDED_FARMING_POOLS.includes(pool.poolAddress.toLowerCase()) ? (
              <Trans>To be extended soon</Trans>
            ) : (
              <Trans>Ended at</Trans>
            )}
          </Flex>

          <Flex justifyContent="space-between" marginTop="4px" fontSize="16px" fontWeight="500" marginBottom="16px">
            <Text fontWeight="500">{formatDollarAmount(pool.tvl)}</Text>
            {pool.startTime > currentTimestamp ? (
              <Text color={theme.warning}>{getFormattedTimeFromSecond(pool.startTime - currentTimestamp)}</Text>
            ) : pool.endTime > currentTimestamp ? (
              <>{getFormattedTimeFromSecond(pool.endTime - currentTimestamp)}</>
            ) : TOBE_EXTENDED_FARMING_POOLS.includes(pool.poolAddress.toLowerCase()) ? (
              <Trans>To be extended soon</Trans>
            ) : (
              <>{dayjs(pool.endTime * 1000).format('DD-MM-YYYY HH:mm')}</>
            )}
          </Flex>

          <Divider />

          <Flex marginTop="16px" justifyContent="space-between" fontSize="12px" fontWeight="500" color={theme.subText}>
            <Text>
              <Trans>My Rewards</Trans>
            </Text>
            <Text>
              <Trans>My Deposit</Trans>
            </Text>
          </Flex>

          <Flex marginTop="4px" justifyContent="space-between">
            <HoverDropdown
              style={{ padding: '0' }}
              content={
                rewardValue ? (
                  <Text fontSize="16px" fontWeight="500" textAlign="right">
                    {formatDollarAmount(rewardValue)}
                  </Text>
                ) : (
                  '--'
                )
              }
              hideIcon={!rewardValue}
              dropdownContent={
                <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '8px' }}>
                  {rewardPendings.map((amount, i) => (
                    <Flex alignItems="center" sx={{ gap: '4px' }} key={amount.currency.symbol || i}>
                      <CurrencyLogo currency={amount.currency} size="16px" />
                      {amount.toSignificant(6)}
                      {amount.currency.symbol}
                    </Flex>
                  ))}
                </Flex>
              }
            />

            {amountCanStaked ? (
              <Flex justifyContent="flex-start" color={theme.warning} fontWeight="500" fontSize="16px">
                {formatDollarAmount(pool.depositedUsd)}
                <InfoHelper
                  placement="top"
                  color={theme.warning}
                  width={'270px'}
                  text={
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
                          You still have {formatDollarAmount(amountCanStaked)} in liquidity to stake to earn even more
                          farming rewards
                        </Trans>
                      </Text>
                      <Text as="span" color={theme.text}>
                        Staked: {formatDollarAmount(pool.stakedUsd)}
                      </Text>
                      <Text as="span" color={theme.warning}>
                        Not staked: {formatDollarAmount(amountCanStaked)}
                      </Text>
                    </Flex>
                  }
                />
              </Flex>
            ) : (
              <Flex justifyContent="flex-start" color={theme.text} fontWeight="500" fontSize="16px">
                {pool.depositedUsd ? formatDollarAmount(pool.depositedUsd) : '--'}
              </Flex>
            )}
          </Flex>

          <Flex marginTop="20px" justifyContent="space-between">
            {renderHarvestButton()}

            <Flex sx={{ gap: '12px' }}>
              {renderStakeButton()}
              {renderUnstakeButton()}
            </Flex>
          </Flex>

          <Flex
            justifyContent="center"
            alignItems="center"
            marginTop="20px"
            fontSize="12px"
            fontWeight="500"
            role="button"
            color={theme.subText}
            opacity={!depositedPositions.length ? 0.4 : 1}
            sx={{ cursor: !depositedPositions.length ? 'not-allowed' : 'pointer' }}
            onClick={() => depositedPositions.length && setShowPosition(prev => !prev)}
          >
            <Text as="span" style={{ transform: 'rotate(90deg)' }}>
              <SwapIcon />
            </Text>
            <Text marginLeft="4px">
              <Trans>View Positions</Trans>
            </Text>
          </Flex>
        </FlipCardFront>
      )}

      {showPosition && (
        <FlipCardBack>
          <Flex alignItems="center" height="36px">
            <DoubleCurrencyLogo currency0={pool.token0} currency1={pool.token1} size={20} />
            <Link
              to={`/elastic/add/${pool.token0.isNative ? pool.token0.symbol : pool.token0.address}/${
                pool.token1.isNative ? pool.token1.symbol : pool.token1.address
              }/${pool.pool.fee}`}
              style={{
                textDecoration: 'none',
              }}
            >
              <Text fontSize={16} fontWeight={500}>
                {pool.token0.symbol} - {pool.token1.symbol}
              </Text>
            </Link>

            <FeeTag>FEE {(pool.pool.fee * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>
          </Flex>

          <Flex
            maxHeight="244px"
            flex={1}
            marginTop="20px"
            sx={{ overflowY: 'scroll', gap: '12px' }}
            flexDirection="column"
          >
            {depositedPositions.map(item => {
              return (
                <PositionDetail
                  key={item.nftId.toString()}
                  farmAddress={farmAddress}
                  pool={pool}
                  nftInfo={item}
                  tokenPrices={tokenPrices}
                  targetPercent={targetPercent}
                />
              )
            })}
          </Flex>

          <Flex
            justifyContent="center"
            alignItems="center"
            marginTop="20px"
            fontSize="12px"
            fontWeight="500"
            role="button"
            color={theme.subText}
            sx={{ cursor: 'pointer' }}
            onClick={() => setShowPosition(prev => !prev)}
          >
            <Text as="span" style={{ transform: 'rotate(90deg)' }}>
              <SwapIcon />
            </Text>
            <Text marginLeft="4px">
              <Trans>View Farm</Trans>
            </Text>
          </Flex>
        </FlipCardBack>
      )}
    </FlipCard>
  )
}

export default FarmCard
