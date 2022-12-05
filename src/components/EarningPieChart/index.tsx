import { Trans, t } from '@lingui/macro'
import { darken, rgba } from 'polished'
import { useState } from 'react'
import { PieChart, pieChartDefaultProps } from 'react-minimal-pie-chart'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import { Loading } from 'pages/ProAmmPool/ContentLoader'

const LegendsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 16px;
`

type LegendProps = {
  color: string
  label: string
  value: string
  percent: number
  active?: boolean

  onMouseOver: () => void
  onMouseOut: () => void
}
const Legend: React.FC<LegendProps> = ({ color, label, value, percent, active, onMouseOut, onMouseOver }) => {
  const theme = useTheme()
  return (
    <Flex
      sx={{
        width: 'fit-content',
        alignItems: 'center',
        gap: '4px',
        padding: '4px',
        borderRadius: '4px',
        background: active ? rgba(theme.text4, 0.6) : undefined,
        cursor: 'pointer',
        transition: 'all .3s',
      }}
      onMouseOut={onMouseOut}
      onMouseOver={onMouseOver}
    >
      <Flex
        sx={{
          width: '12px',
          height: '12px',
          borderRadius: '999px',
          background: color,
        }}
      />

      <Text
        as="span"
        sx={{
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
          color: theme.text,
        }}
      >
        {label}:
      </Text>

      <Text
        as="span"
        sx={{
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
          color: theme.subText,
          whiteSpace: 'nowrap',
        }}
      >
        {value} ({percent}%)
      </Text>
    </Flex>
  )
}

const COLORS = [
  '#7C8FF3',
  '#FDA946',
  '#FF50F8',
  '#0086E7',
  '#FF9901',
  '#3EC000',
  '#F67272',
  '#9b59b6',
  '#e67e22',
  '#c0392b',
]

type DataEntry = {
  title: string
  value: string
  percent: number
}

type Props = {
  className?: string

  isLoading?: boolean
  totalValue?: string
  data?: DataEntry[]
}

const EmptyData: DataEntry[] = [
  {
    title: 'loading',
    value: t`loading...`,
    percent: 100,
  },
]

const EarningPieChart: React.FC<Props> = ({ data = EmptyData, totalValue = '', className, isLoading = false }) => {
  const [hovered, setHovered] = useState<number | undefined>(undefined)

  const chartData = data.map((entry, i) => {
    const color = hovered === i ? darken(0.3, COLORS[i]) : COLORS[i]

    return {
      title: entry.title,
      value: entry.percent,
      color,
    }
  })

  const legendData = data.map((entry, i) => {
    return {
      ...entry,
      color: COLORS[i],
    }
  })

  return (
    <Flex
      className={className}
      sx={{
        flexDirection: 'column',
      }}
    >
      <Flex
        sx={{
          width: '100%',
          position: 'relative',
        }}
      >
        <PieChart
          data={chartData}
          lineWidth={20}
          radius={pieChartDefaultProps.radius - 10}
          segmentsStyle={{ transition: 'stroke .3s', cursor: 'pointer' }}
          paddingAngle={isLoading ? 0 : 1}
          onMouseOver={(_, index) => {
            setHovered(index)
          }}
          onMouseOut={() => {
            setHovered(undefined)
          }}
        />

        <Text
          as="span"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate3d(-50%, -50%, 0)',
            fontWeight: 500,
            fontSize: '24px',
            lineHeight: '28px',
          }}
        >
          {isLoading ? <Trans>loading...</Trans> : totalValue}
        </Text>
      </Flex>

      <LegendsWrapper>
        {isLoading
          ? Array(5)
              .fill(0)
              .map((_, i) => {
                return (
                  <Loading
                    key={i}
                    style={{
                      width: '100%',
                      height: '24px',
                      borderRadius: '4px',
                    }}
                  />
                )
              })
          : legendData.map((entry, i) => {
              return (
                <Legend
                  active={hovered === i}
                  key={i}
                  color={entry.color}
                  label={entry.title}
                  value={entry.value}
                  percent={entry.percent}
                  onMouseOver={() => setHovered(i)}
                  onMouseOut={() => setHovered(undefined)}
                />
              )
            })}
      </LegendsWrapper>
    </Flex>
  )
}

export default EarningPieChart
