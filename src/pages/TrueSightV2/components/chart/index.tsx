import React, { useRef, useState } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Icon from 'components/Icons/Icon'
import { RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'

import { SectionWrapper } from '..'
import HoldersPieChart from './HoldersPieChart'
import LineChart from './LineChart'
import SignedBarChart from './SignedBarChart'
import StackedBarChart from './StackedBarChart'

const ChartWrapper = styled(SectionWrapper)`
  padding: 10px 0;
  border-radius: 20px;
  height: 400px;
`

const LegendWrapper = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  z-index: 10;
  > * {
    cursor: pointer;
  }
`

const InflowLegend = ({ enabled, onClick }: { enabled?: boolean; onClick?: () => void }) => {
  const theme = useTheme()
  return (
    <RowFit gap="4px" style={{ cursor: 'pointer' }}>
      <div style={{ height: '16px', width: '16px', borderRadius: '8px', backgroundColor: theme.primary }} />
      <Text fontSize={12} fontWeight={500}>
        Inflow
      </Text>
    </RowFit>
  )
}
const ShortLegend = ({ enabled, onClick }: { enabled?: boolean; onClick?: () => void }) => {
  const theme = useTheme()
  return (
    <RowFit gap="4px" style={{ cursor: 'pointer' }}>
      <div style={{ height: '16px', width: '16px', borderRadius: '8px', backgroundColor: theme.primary }} />
      <Text fontSize={12} fontWeight={500}>
        Short
      </Text>
    </RowFit>
  )
}
const OutflowLegend = ({ enabled, onClick }: { enabled?: boolean; onClick?: () => void }) => {
  const theme = useTheme()
  return (
    <RowFit gap="4px" style={{ cursor: 'pointer' }}>
      <div style={{ height: '16px', width: '16px', borderRadius: '8px', backgroundColor: theme.red }} />
      <Text fontSize={12} fontWeight={500}>
        Outflow
      </Text>
    </RowFit>
  )
}
const LongLegend = ({ enabled, onClick }: { enabled?: boolean; onClick?: () => void }) => {
  const theme = useTheme()
  return (
    <RowFit gap="4px" style={{ cursor: 'pointer' }}>
      <div style={{ height: '16px', width: '16px', borderRadius: '8px', backgroundColor: theme.red }} />
      <Text fontSize={12} fontWeight={500}>
        Long
      </Text>
    </RowFit>
  )
}
const NetflowLegend = ({ enabled, onClick }: { enabled?: boolean; onClick?: () => void }) => {
  const theme = useTheme()
  return (
    <RowFit gap="4px" style={{ cursor: 'pointer' }}>
      <div style={{ height: '4px', width: '16px', borderRadius: '8px', backgroundColor: theme.primary }} />
      <Text fontSize={12} fontWeight={500}>
        Netflow
      </Text>
    </RowFit>
  )
}
const PriceLegend = ({ enabled, onClick }: { enabled?: boolean; onClick?: () => void }) => {
  const theme = useTheme()
  return (
    <RowFit gap="4px" style={{ cursor: 'pointer' }}>
      <div style={{ height: '4px', width: '16px', borderRadius: '8px', backgroundColor: theme.blue }} />
      <Text fontSize={12} fontWeight={500}>
        Netflow
      </Text>
    </RowFit>
  )
}

const TimeFrameWrapper = styled.div`
  height: 28px;
  border-radius: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  position: relative;
  background-color: ${({ theme }) => theme.buttonBlack};
  border: 2px solid ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
`
const Element = styled.div<{ active?: boolean }>`
  padding: 6px 12px;
  z-index: 2;
  ${({ active, theme }) => active && `color: ${theme.text};`}
  :hover {
    filter: brightness(1.2);
  }
`

const ActiveElement = styled.div<{ left?: number; width?: number }>`
  width: 40px;
  height: 24px;
  border-radius: 20px;
  position: absolute;
  left: 0;
  background-color: ${({ theme }) => theme.tableHeader};
  z-index: 1;
  transition: all 0.2s ease;
  :hover {
    filter: brightness(1.2);
  }

  ${({ left, width }) => css`
    transform: translateX(${left ?? 0}px);
    width: ${width || 40}px;
  `}
`

const TimeFrameLegend = ({ timeframes }: { timeframes: string[] }) => {
  const [selected, setSelected] = useState(timeframes[0])
  const refs = useRef<any>({})
  if (timeframes?.length < 1) return null
  return (
    <TimeFrameWrapper>
      {timeframes.map((t: string, index: number) => {
        return (
          <Element
            key={index}
            ref={el => {
              refs.current[t] = el
            }}
            onClick={() => setSelected(t)}
            active={selected === t}
          >
            {t}
          </Element>
        )
      })}
      <ActiveElement left={refs.current?.[selected]?.offsetLeft} />
    </TimeFrameWrapper>
  )
}

const FullscreenButton = () => {
  const theme = useTheme()
  return (
    <div style={{ color: theme.subText }}>
      <Icon id="fullscreen" />
    </div>
  )
}

export const NumberofTradesChart = () => {
  return (
    <ChartWrapper>
      <LegendWrapper>
        <InflowLegend />
        <OutflowLegend />
        <TimeFrameLegend timeframes={['1D', '7D', '1M', '3M']} />
        <FullscreenButton />
      </LegendWrapper>
      <StackedBarChart />
    </ChartWrapper>
  )
}
export const TradingVolumeChart = () => {
  return (
    <ChartWrapper>
      <LegendWrapper>
        <TimeFrameLegend timeframes={['1D', '7D', '1M', '3M']} />
        <FullscreenButton />
      </LegendWrapper>
      <LineChart />
    </ChartWrapper>
  )
}
export const NetflowToWhaleWallets = () => {
  return (
    <ChartWrapper>
      <LegendWrapper>
        <InflowLegend />
        <OutflowLegend />
        <NetflowLegend />
        <TimeFrameLegend timeframes={['1D', '7D', '1M', '3M']} />
        <FullscreenButton />
      </LegendWrapper>
      <StackedBarChart />
    </ChartWrapper>
  )
}
export const NetflowToCentralizedExchanges = () => {
  return (
    <ChartWrapper>
      <LegendWrapper>
        <InflowLegend />
        <OutflowLegend />
        <NetflowLegend />
        <TimeFrameLegend timeframes={['1D', '3D', '7D', '1M', '3M']} />
        <FullscreenButton />
      </LegendWrapper>
      <StackedBarChart />
    </ChartWrapper>
  )
}
export const NumberofTransfers = () => {
  return (
    <ChartWrapper>
      <LegendWrapper>
        <TimeFrameLegend timeframes={['1D', '7D', '1M', '3M']} />
        <FullscreenButton />
      </LegendWrapper>
      <LineChart />
    </ChartWrapper>
  )
}
export const NumberofHolders = () => {
  return (
    <ChartWrapper>
      <LegendWrapper>
        <TimeFrameLegend timeframes={['1D', '7D', '1M', '3M']} />
        <FullscreenButton />
      </LegendWrapper>
      <LineChart />
    </ChartWrapper>
  )
}

export const HoldersChartWrapper = () => {
  return (
    <ChartWrapper>
      <HoldersPieChart />
    </ChartWrapper>
  )
}

export const LiquidOnCentralizedExchanges = ({ style }: { style?: React.CSSProperties }) => {
  return (
    <ChartWrapper style={style}>
      <LegendWrapper>
        <ShortLegend />
        <LongLegend />
        <PriceLegend />
        <TimeFrameLegend timeframes={['1D', '7D', '1M']} />
        <FullscreenButton />
      </LegendWrapper>
      <SignedBarChart />
    </ChartWrapper>
  )
}
