import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import React, { useCallback, useRef, useState } from 'react'
import { Minus, Plus, Share2 } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import bgimg from 'assets/images/card-background-2.png'
import { ButtonLight, TextButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import { Swap } from 'components/Icons'
import AspectRatio from 'components/Icons/AspectRatio'
import Harvest from 'components/Icons/Harvest'
import Row, { RowBetween, RowFit, RowWrap } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { ElasticFarmV2 } from 'state/farms/elasticv2/types'
import { getFormattedTimeFromSecond } from 'utils/formatTime'

import PriceVisualize from './PriceVisualize'
import StakeWithNFTsModal, { NFTItem } from './StakeWithNFTsModal'
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
  overflow: hidden;
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
  position: absolute;
  overflow: hidden;
  padding: 16px;
  width: 100%;
  height: 100%;
  top: 100%;
  left: 70%;
  background-color: var(--button-black);
  border-radius: 24px;
  z-index: 2;
  gap: 16px;
  overflow-y: scroll;
  transform: scale(0.7);
  opacity: 0;
  transition: all 0.3s ease;

  &.show {
    top: 0;
    left: 0;
    transform: scale(1);
    opacity: 1;
  }
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

const UnstakeButton = styled(ButtonLight)`
  color: var(--red);
  background-color: var(--red-alpha-30);
  :hover {
    background-color: var(--red-alpha-30);
    opacity: 0.9;
  }
  &:active {
    box-shadow: 0 0 0 1pt var(--red-alpha-30);
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

const RangeItem = ({ active, onRangeClick }: { active?: boolean; onRangeClick?: () => void }) => {
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
          <PriceVisualize />
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
  farm?: ElasticFarmV2
}) {
  const theme = useTheme()
  const [showStake, setShowStake] = useState(false)
  const [showUnstake, setShowUnstake] = useState(false)
  const wrapperInnerRef = useRef<HTMLDivElement>(null)
  const rangesRef = useRef<HTMLDivElement>(null)

  const handleFlip = useCallback(() => {
    wrapperInnerRef.current?.classList.toggle('rotate')
  }, [])
  const handleToggleRanges = useCallback(() => {
    rangesRef.current?.classList.toggle('show')
  }, [])

  const currentTimestamp = Math.floor(Date.now() / 1000)

  return (
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
              <FeeBadge>FEE {farm?.pool?.fee ? farm?.pool?.fee / 1000 : 0.03}%</FeeBadge>
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
              </RowFit>
            </Column>
            <ButtonLight width="fit-content" disabled={!hasRewards}>
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
                <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                  <Trans>Avg APR</Trans>
                </Text>
                <Text fontSize="28px" lineHeight="32px" color={theme.primary}>
                  132.23%
                </Text>
              </Column>
              <Column gap="4px">
                <Text fontSize="12px" lineHeight="16px" color={theme.primary} alignSelf="flex-end">
                  <Trans>Active Range ↗</Trans>
                </Text>
                <PriceVisualize />
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
              {hasUnstake && (
                <UnstakeButton color={theme.red} onClick={() => setShowUnstake(p => !p)}>
                  <RowFit gap="6px">
                    <Minus size={16} />
                    Unstake
                  </RowFit>
                </UnstakeButton>
              )}
              <ButtonLight disabled={!enableStake} onClick={() => setShowStake(true)}>
                <RowFit gap="6px">
                  <Plus size={16} />
                  Stake
                </RowFit>
              </ButtonLight>
            </Row>
          </Column>
          <RowBetween marginTop="auto">
            <TextButtonPrimary fontSize="12px" onClick={handleFlip} disabled={!hasPositions}>
              <Swap rotate={90} size={16} />
              <Trans>View Positions</Trans>
            </TextButtonPrimary>
            <TextButtonPrimary fontSize="12px" onClick={handleToggleRanges}>
              <AspectRatio size={16} />
              <Trans>3 Ranges Available</Trans>
            </TextButtonPrimary>
          </RowBetween>
          <Ranges ref={rangesRef}>
            <div style={{ overflowY: 'scroll', flex: 1 }}>
              <Column gap="12px">
                <RangeItem active></RangeItem>
                <RangeItem></RangeItem>
                <RangeItem></RangeItem>
              </Column>
            </div>
            <Row justify="center">
              <TextButtonPrimary onClick={handleToggleRanges}>
                <Trans>Choose this range</Trans>
              </TextButtonPrimary>
            </Row>
          </Ranges>
        </FrontFace>

        {hasPositions && (
          <BackFace>
            <RowBetween>
              <RowFit>
                <CurrencyLogo currency={inputToken} />
                <CurrencyLogo currency={outputToken} />
                <Text fontSize="16px" lineHeight="20px" color={theme.primary} marginLeft="4px">
                  {`${inputToken?.symbol} - ${outputToken?.symbol}`}
                </Text>
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
            <Column style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '12px' }} gap="16px">
              <RowBetween>
                <Text fontSize="12px" lineHeight="16px" color="var(--primary)">
                  <Trans>Active Range ↗</Trans>
                </Text>
                <RowFit>
                  <Text fontSize="12px" lineHeight="16px" color="var(--subtext)">
                    <Trans>My Pools ↗</Trans>
                  </Text>
                </RowFit>
              </RowBetween>
              <PriceVisualize />
              <Text fontSize="12px" lineHeight="16px" color="var(--subtext)">
                <Trans>My Positions</Trans>
              </Text>
              <RowWrap gap="12px" itemsInRow={2}>
                <NFTItem />
                <NFTItem />
                <NFTItem />
                <NFTItem />
              </RowWrap>
            </Column>
            <RowBetween marginTop="auto">
              <TextButtonPrimary fontSize="12px" onClick={handleFlip}>
                <Swap rotate={90} size={16} />
                <Trans>View Farm</Trans>
              </TextButtonPrimary>
              <TextButtonPrimary fontSize="12px" onClick={handleToggleRanges}>
                <AspectRatio size={16} />
                <Trans>3 Ranges Available</Trans>
              </TextButtonPrimary>
            </RowBetween>
          </BackFace>
        )}
      </WrapperInner>
      {enableStake && <StakeWithNFTsModal isOpen={showStake} onDismiss={() => setShowStake(false)} />}
      {hasUnstake && <UnstakeWithNFTsModal isOpen={showUnstake} onDismiss={() => setShowUnstake(false)} />}
    </Wrapper>
  )
}

export default React.memo(FarmCard)
