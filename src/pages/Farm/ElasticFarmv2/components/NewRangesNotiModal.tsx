import { FeeAmount, TICK_SPACINGS, TickMath, nearestUsableTick } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { X } from 'react-feather'
import { Link } from 'react-router-dom'
import { useLocalStorage } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Modal from 'components/Modal'
import PriceVisualize from 'components/ProAmm/PriceVisualize'
import { MouseoverTooltip } from 'components/Tooltip'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { ElasticFarmV2 } from 'state/farms/elasticv2/types'
import { Bound } from 'state/mint/proamm/type'
import { formatTickPrice } from 'utils/formatTickPrice'
import { getTickToPrice } from 'utils/getTickToPrice'

const Content = styled.div`
  border-radius: 1rem;
  background: ${({ theme }) => theme.buttonBlack};
  padding: 1rem;
  display: grid;
  overflow-y: auto;
  flex: 1;
  gap: 1rem;

  grid-template-columns: 1fr 1fr 1fr;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr 1fr;
  `}
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 1fr;
  `}
`

const RangeItem = styled.div`
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.border};
  padding: 12px;
`

export default function NewRangesNotiModal({ updatedFarms }: { updatedFarms: ElasticFarmV2[] }) {
  const [open, setIsOpen] = useState(true)
  const [, setLastUpdatedTimestamp] = useLocalStorage<number | null>('elasticFarmV2LastUpdatedTimeStamp', null)
  const theme = useTheme()
  const { networkInfo } = useActiveWeb3React()

  const hasIdleRange = updatedFarms.some(farm => farm.ranges.some(item => item.isRemoved))
  const hasNewRange = updatedFarms.some(farm => farm.ranges.some(item => !item.isRemoved))

  const handleDismiss = () => {
    setLastUpdatedTimestamp(Math.floor(Date.now() / 1000))
    setIsOpen(false)
  }

  const ranges = updatedFarms
    .map(farm => farm.ranges.map(range => ({ ...range, farm })))
    .flat()
    .sort(a => (a.isRemoved ? -1 : 1))

  return (
    <Modal isOpen={open} onDismiss={handleDismiss} maxWidth="100vw" width="900px" maxHeight={80}>
      <Flex width="100%" padding="20px" flexDirection="column" sx={{ gap: '1rem' }}>
        <Flex justifyContent="space-between" alignItems="center">
          <Text fontSize={20} fontWeight="500">
            Update
          </Text>
          <div style={{ cursor: 'pointer' }} role="button" onClick={handleDismiss}>
            <X />
          </div>
        </Flex>

        <Text color={theme.subText} fontSize="14px" textAlign="justify" lineHeight={1.5}>
          {hasIdleRange && hasNewRange ? (
            <Trans>
              One or more of the Elastic static farm ranges you were participating in have become idle and have new
              farming ranges. You are still earning farming rewards from this idle farm range. However, to continue
              earning more rewards, please stake your liquidity into the other ranges instead
            </Trans>
          ) : hasNewRange ? (
            <Trans>
              Some of your current farms have new farming ranges. Check them out below to see if you&apos;d like to
              participate in them. You are still earning farming rewards from your current farming range.
            </Trans>
          ) : (
            <Trans>
              One or more of the Elastic static farm ranges you were participating in have become idle. You are still
              earning farming rewards from this idle farm range. However, to continue earning more rewards, please stake
              your liquidity into the other active ranges instead
            </Trans>
          )}
        </Text>

        <Content>
          {ranges.map(range => {
            const addliquidityElasticPool = `/${networkInfo.route}${APP_PATHS.ELASTIC_CREATE_POOL}/${
              range.farm.token0.isNative ? range.farm.token0.symbol : range.farm.token0.address
            }/${range.farm.token1.isNative ? range.farm.token1.symbol : range.farm.token1.address}/${
              range.farm.pool.fee
            }`

            const { tickUpper, tickLower } = range
            const priceLower = getTickToPrice(range.farm.token0.wrapped, range.farm.token1.wrapped, tickLower)
            const priceUpper = getTickToPrice(range.farm.token0.wrapped, range.farm.token1.wrapped, tickUpper)
            const feeAmount = range.farm.pool.fee

            const ticksAtLimit = {
              [Bound.LOWER]:
                feeAmount && tickLower
                  ? tickLower === nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount as FeeAmount])
                  : undefined,
              [Bound.UPPER]:
                feeAmount && tickUpper
                  ? tickUpper === nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount as FeeAmount])
                  : undefined,
            }

            return (
              <RangeItem key={range.id}>
                <Flex alignItems="center">
                  <DoubleCurrencyLogo currency0={range.farm.token0} currency1={range.farm.token1} />
                  <Text color={theme.primary} fontSize="14px" fontWeight="500">
                    {range.farm.token0.symbol} - {range.farm.token1.symbol}
                  </Text>
                  <FeeTag>
                    FEE {range.farm?.pool?.fee ? (range.farm?.pool?.fee * 100) / ELASTIC_BASE_FEE_UNIT : 0.03}%
                  </FeeTag>
                </Flex>

                <MouseoverTooltip
                  text={
                    range.isRemoved ? (
                      <Trans>
                        This indicates that range is idle. Staked positions in this range is still earning small amount
                        of rewards.
                      </Trans>
                    ) : (
                      ''
                    )
                  }
                >
                  <Text
                    fontSize="12px"
                    fontWeight="500"
                    marginTop="12px"
                    marginBottom="8px"
                    width="fit-content"
                    color={range.isRemoved ? theme.warning : theme.primary}
                    sx={{
                      borderBottom: range.isRemoved ? `1px dotted ${theme.warning}` : undefined,
                    }}
                  >
                    {range.isRemoved ? (
                      <Trans>Idle Range</Trans>
                    ) : (
                      <Link to={`${addliquidityElasticPool}?farmRange=${range.index}`}>
                        <Trans>Add Liquidity ↗</Trans>
                      </Link>
                    )}
                  </Text>
                </MouseoverTooltip>

                {priceLower && priceUpper && (
                  <PriceVisualize
                    showTooltip
                    priceLower={priceLower}
                    priceUpper={priceUpper}
                    price={range.farm.pool?.token0Price}
                    ticksAtLimit={ticksAtLimit}
                    warning={range.isRemoved}
                  />
                )}

                <Flex justifyContent="space-between" fontSize="12px" fontWeight="500" marginTop="16px">
                  <Flex sx={{ gap: '4px' }}>
                    <Text as="span" color={theme.subText}>
                      <Trans>Min Price</Trans>:
                    </Text>
                    <Text fontWeight="500" color={range.isRemoved ? theme.warning : theme.text}>
                      {formatTickPrice(priceLower, ticksAtLimit, Bound.LOWER)}
                    </Text>
                  </Flex>
                  <Flex sx={{ gap: '4px' }}>
                    <Text as="span" color={theme.subText}>
                      <Trans>Max Price</Trans>:
                    </Text>
                    <Text fontWeight="500" color={range.isRemoved ? theme.warning : theme.text}>
                      {formatTickPrice(priceUpper, ticksAtLimit, Bound.UPPER)}
                    </Text>
                  </Flex>
                </Flex>
              </RangeItem>
            )
          })}
        </Content>
        <Flex justifyContent="flex-end">
          <ButtonPrimary width="160px" onClick={handleDismiss}>
            Okay
          </ButtonPrimary>
        </Flex>
      </Flex>
    </Modal>
  )
}
