import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Plus, Share2 } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import bgimg from 'assets/images/card-background-2.png'
import { ButtonLight, ButtonOutlined, TextButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import AspectRatio from 'components/Icons/AspectRatio'
import Harvest from 'components/Icons/Harvest'
import Row, { RowBetween, RowFit } from 'components/Row'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { useElasticFarmsV2, useFarmV2Action } from 'state/farms/elasticv2/hooks'
import { getFormattedTimeFromSecond } from 'utils/formatTime'

import { ElasticFarmV2WithRangePrices } from '..'
import PriceVisualize from './PriceVisualize'
import SimpleTooltip from './SimpleTooltip'
import StakeWithNFTsModal from './StakeWithNFTsModal'
import UnstakeWithNFTsModal from './UnstakeWithNFTsModal'

const WrapperInner = styled.div<{ rotate?: boolean; hasRewards?: boolean }>`
  transition: transform 0.3s ease;
  transform-style: preserve-3d;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  position: relative;
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 24px;
  font-weight: 500;
  height: 100%;
  &.rotate {
    transform: rotateY(180deg);
  }

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
const Wrapper = styled.div`
  height: 430px;
  perspective: 1200px;
`

const FrontFace = styled.div`
  padding: 16px;
  backface-visibility: hidden;

  display: flex;
  flex-direction: column;
  gap: 16px;
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: -1;
`
const BackFace = styled(FrontFace)`
  z-index: 1;
  transform: rotateY(180deg);
`
// const MenuItem = styled(RowFit)`
//   font-size: 12px;
//   line-height: 16px;
//   color: var(--subtext);
//   gap: 4px;
//   cursor: pointer;
//   :hover {
//     color: var(--primary);
//   }
// `

const Ranges = styled(Column)`
  overflow: hidden;
  z-index: 2;
  gap: 16px;
  overflow: hidden;
  transition: all 0.2s linear;
  flex: 1;
`

const RangeItemWrapper = styled(Column)<{ active?: boolean }>`
  gap: 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  padding: 12px;
  background-color: var(--button-black);
  cursor: pointer;
  transition: all 0.2s ease;

  :hover {
    background-color: var(--button-black-90);
  }

  ${({ active }) =>
    active &&
    css`
      background-color: rgba(49, 203, 158, 0.15);
      border-color: var(--primary);
      :hover {
        background-color: rgba(49, 203, 158, 0.3);
      }
    `}
`

const UnstakeButton = styled(ButtonOutlined)`
  color: var(--subtext);
  background-color: var(--subtext-alpha-50);
  :hover {
    background-color: var(--subtext-alpha-50);
    opacity: 0.9;
  }
  &:active {
    box-shadow: 0 0 0 1pt var(--subtext-alpha-50);
  }
`

const IconButton = styled.div`
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--subtext);
  :hover {
    color: var(--subtext-120);
  }
`

const FeeBadge = styled.div`
  font-size: 12px;
  line-height: 16px;
  color: var(--blue);
  background-color: rgba(8, 161, 231, 0.2);
  border-radius: 16px;
  padding: 2px 4px;
`

export const FarmContext = React.createContext<{ farm?: ElasticFarmV2WithRangePrices; activeRange?: number }>({
  farm: undefined,
  activeRange: 0,
})

const RangeItem = ({
  active,
  onRangeClick,
  tickLower,
  tickUpper,
  tickCurrent,
  token0,
  token1,
}: {
  active?: boolean
  onRangeClick?: () => void
  tickLower?: string
  tickUpper?: string
  tickCurrent?: string
  token0?: Token
  token1?: Token
}) => {
  const theme = useTheme()
  return (
    <RangeItemWrapper active={active} onClick={onRangeClick}>
      <RowBetween>
        <Column gap="4px">
          <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
            <Trans>Avg APR</Trans>
          </Text>
          <Text fontSize="28px" lineHeight="32px" color="var(--primary)">
            132.23%
          </Text>
        </Column>
        <Column gap="4px">
          <Text fontSize="12px" lineHeight="16px" color="var(--primary)" alignSelf="flex-end">
            <Trans>Active Range ↗</Trans>
          </Text>
          <PriceVisualize
            tickLower={tickLower}
            tickUpper={tickUpper}
            tickCurrent={tickCurrent}
            token0={token0}
            token1={token1}
          />
        </Column>
      </RowBetween>
      <RowBetween>
        <Column gap="4px">
          <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
            <Trans>Staked TVL</Trans>
          </Text>
          <Text fontSize="12px" lineHeight="16px" color={theme.text}>
            $12.54M
          </Text>
        </Column>
        <Column gap="4px" style={{ alignItems: 'flex-end' }}>
          <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
            <Trans>My Deposit</Trans>
          </Text>
          <Text fontSize="12px" lineHeight="16px" color={theme.text}>
            $230.23K
          </Text>
        </Column>
      </RowBetween>
    </RangeItemWrapper>
  )
}

function FarmCard({
  inputToken,
  outputToken,
  enableStake,
  hasPositions,
  hasRewards,
  hasUnstake,
  farm,
}: {
  inputToken?: Currency
  outputToken?: Currency
  enableStake?: boolean
  hasPositions?: boolean
  hasRewards?: boolean
  hasUnstake?: boolean
  farm?: ElasticFarmV2WithRangePrices
}) {
  const theme = useTheme()
  const [showStake, setShowStake] = useState(false)
  const [showUnstake, setShowUnstake] = useState(false)
  const [activeRange, setActiveRange] = useState(0)

  const wrapperInnerRef = useRef<HTMLDivElement>(null)

  const handleFlip = useCallback(() => {
    wrapperInnerRef.current?.classList.toggle('rotate')
  }, [])

  const currentTimestamp = Math.floor(Date.now() / 1000)
  const elasticFarm = useElasticFarmsV2()
  const depositedPos = farm?.userPositions
  const stakedPos = elasticFarm?.userInfo?.filter(u => u.fId === farm?.fId && u.rangeId === activeRange)
  const canStake = enableStake || (depositedPos && stakedPos && depositedPos.length > stakedPos.length)
  const canUnstake = hasUnstake || (stakedPos && stakedPos.length > 0)
  const { harvest } = useFarmV2Action()
  const handleHarvest = useCallback(() => {
    if (!farm) return
    harvest(farm?.fId, stakedPos?.filter(sp => sp.rangeId === activeRange).map(sp => sp.nftId.toNumber()) || [])
  }, [farm, harvest, stakedPos, activeRange])

  const farmValues = useMemo(() => {
    return {
      farm,
      activeRange,
    }
  }, [farm, activeRange])
  return (
    <FarmContext.Provider value={farmValues}>
      <Wrapper>
        <WrapperInner ref={wrapperInnerRef} hasRewards={hasRewards}>
          <FrontFace>
            <RowBetween>
              <RowFit gap="4px">
                <CurrencyLogo currency={inputToken} />
                <CurrencyLogo currency={outputToken} />
                <Text fontSize="16px" lineHeight="20px" color={theme.primary} marginLeft="4px">
                  {`${inputToken?.symbol} - ${outputToken?.symbol}`}
                </Text>
                <FeeBadge>FEE {farm?.pool?.fee ? (farm?.pool?.fee * 100) / ELASTIC_BASE_FEE_UNIT : 0.03}%</FeeBadge>
              </RowFit>
              <RowFit gap="8px">
                <IconButton>
                  <CopyHelper toCopy="test" />
                </IconButton>
                <IconButton>
                  <Share2 size={14} fill="currentcolor" />
                </IconButton>
              </RowFit>
            </RowBetween>
            <RowBetween>
              <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                <Trans>Current phase will end in</Trans>
              </Text>
              <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                {farm ? getFormattedTimeFromSecond(farm.endTime - currentTimestamp) : <Trans>17D 3H 40M</Trans>}
              </Text>
            </RowBetween>
            <RowBetween>
              <Column style={{ width: 'fit-content' }} gap="4px">
                <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                  {hasRewards ? <Trans>My Rewards</Trans> : <Trans>Rewards</Trans>}
                </Text>
                <RowFit gap="8px">
                  {farm ? (
                    <>
                      {farm.totalRewards.map((rw, index: number) => (
                        <>
                          {index > 0 && (
                            <Text fontSize="12px" lineHeight="16px" color={theme.border}>
                              |
                            </Text>
                          )}
                          <RowFit gap="4px">
                            <CurrencyLogo currency={rw.currency} size="16px" />
                            {hasRewards && (
                              <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                                0.123456789
                              </Text>
                            )}
                          </RowFit>
                        </>
                      ))}
                    </>
                  ) : (
                    <>
                      {/* TODO: Remove this later */}
                      <RowFit gap="4px">
                        <CurrencyLogo currency={inputToken} size="16px" />
                        {hasRewards && (
                          <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                            0.123456789
                          </Text>
                        )}
                      </RowFit>
                      <Text fontSize="12px" lineHeight="16px" color={theme.border}>
                        |
                      </Text>
                      <RowFit gap="4px">
                        <CurrencyLogo currency={outputToken} size="16px" />
                        {hasRewards && (
                          <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                            0.123456789
                          </Text>
                        )}
                      </RowFit>
                    </>
                  )}
                </RowFit>
              </Column>
              <ButtonLight width="fit-content" disabled={!hasRewards} onClick={handleHarvest}>
                <RowFit gap="4px">
                  <Harvest />
                  <Text>Harvest</Text>
                </RowFit>
              </ButtonLight>
            </RowBetween>
            <Divider />
            <Column
              gap="16px"
              style={{
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                padding: '12px',
                backgroundColor: 'var(--button-black)',
              }}
            >
              <RowBetween align="flex-start">
                <Column gap="4px">
                  <SimpleTooltip text={t`Active Range: Current active farming range`}>
                    <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                      <Trans>Avg APR</Trans>
                    </Text>
                  </SimpleTooltip>
                  <Text fontSize="28px" lineHeight="32px" color={theme.primary}>
                    132.23%
                  </Text>
                </Column>
                <Column gap="4px">
                  <Text fontSize="12px" lineHeight="16px" color={theme.primary} alignSelf="flex-end">
                    <Trans>Active Range ↗</Trans>
                  </Text>
                  {farm && (
                    <PriceVisualize
                      tickCurrent={farm?.ranges[activeRange].tickCurrent}
                      tickLower={farm?.ranges[activeRange].tickLower}
                      tickUpper={farm?.ranges[activeRange].tickUpper}
                      token0={farm.token0}
                      token1={farm.token1}
                    />
                  )}
                </Column>
              </RowBetween>
              <RowBetween>
                <Column gap="4px">
                  <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                    <Trans>Staked TVL</Trans>
                  </Text>
                  <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                    $12.54M
                  </Text>
                </Column>
                <Column gap="4px" style={{ alignItems: 'flex-end' }}>
                  <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                    <Trans>My Deposit</Trans>
                  </Text>
                  <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                    $230.23K
                  </Text>
                </Column>
              </RowBetween>
              <Divider />
              <Row gap="12px">
                {canUnstake && (
                  <UnstakeButton onClick={() => setShowUnstake(p => !p)}>
                    <RowFit gap="6px">{stakedPos?.length || 3} Positions Staked</RowFit>
                  </UnstakeButton>
                )}
                <ButtonLight disabled={!canStake} onClick={() => setShowStake(true)}>
                  <RowFit gap="6px">
                    <Plus size={16} />
                    Stake
                  </RowFit>
                </ButtonLight>
              </Row>
            </Column>
            <Row justify="center" marginTop="auto">
              <TextButtonPrimary fontSize="12px" onClick={handleFlip} width="fit-content">
                <AspectRatio size={16} />
                <Trans>{farm ? farm.ranges.length : 3} Ranges Available</Trans>
              </TextButtonPrimary>
            </Row>
          </FrontFace>

          <BackFace>
            <RowBetween>
              <RowFit gap="4px">
                <CurrencyLogo currency={inputToken} />
                <CurrencyLogo currency={outputToken} />
                <Text fontSize="16px" lineHeight="20px" color={theme.primary} marginLeft="4px">
                  {`${inputToken?.symbol} - ${outputToken?.symbol}`}
                </Text>
                <FeeBadge>FEE {farm?.pool?.fee ? (farm?.pool?.fee * 100) / ELASTIC_BASE_FEE_UNIT : 0.03}%</FeeBadge>
              </RowFit>
              <RowFit gap="8px">
                <IconButton>
                  <CopyHelper toCopy="test" />
                </IconButton>
                <IconButton>
                  <Share2 size={14} fill="currentcolor" />
                </IconButton>
              </RowFit>
            </RowBetween>
            <Ranges>
              <div style={{ overflowY: 'scroll', flex: 1 }}>
                <Column gap="12px">
                  {farm ? (
                    <>
                      {farm.ranges.map((r, index: number) => (
                        <RangeItem
                          active={activeRange === index}
                          key={r.id}
                          tickLower={r.tickLower}
                          tickUpper={r.tickUpper}
                          tickCurrent={r.tickCurrent}
                          onRangeClick={() => setActiveRange(index)}
                          token0={farm.token0}
                          token1={farm.token1}
                        />
                      ))}
                    </>
                  ) : (
                    <>
                      {/* TODO: Remove this later */}
                      <RangeItem active></RangeItem>
                      <RangeItem></RangeItem>
                      <RangeItem></RangeItem>
                    </>
                  )}
                </Column>
              </div>
              <Row justify="center" marginTop="auto">
                <TextButtonPrimary onClick={handleFlip}>
                  <Trans>Choose this range</Trans>
                </TextButtonPrimary>
              </Row>
            </Ranges>
          </BackFace>
        </WrapperInner>
        {canStake && (
          <StakeWithNFTsModal isOpen={showStake} onDismiss={() => setShowStake(false)} positions={depositedPos} />
        )}
        {canUnstake && (
          <UnstakeWithNFTsModal isOpen={showUnstake} onDismiss={() => setShowUnstake(false)} stakedPos={stakedPos} />
        )}
      </Wrapper>
    </FarmContext.Provider>
  )
}

export default React.memo(FarmCard)
