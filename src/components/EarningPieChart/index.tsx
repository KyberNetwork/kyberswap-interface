import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { darken, rgba } from 'polished'
import { useCallback, useMemo, useState } from 'react'
import { PieChart, pieChartDefaultProps } from 'react-minimal-pie-chart'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Logo, { NetworkLogo } from 'components/Logo'
import { EMPTY_ARRAY } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { Loading } from 'pages/ProAmmPool/ContentLoader'

const formatUSDValue = (v: string) => {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'compact',
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })

  return formatter.format(Number(v))
}

type WrapperProps = { $twoColumns?: boolean }
const LegendsWrapper = styled.div.attrs<WrapperProps>(({ $twoColumns }) => ({
  'data-two-columns': $twoColumns,
}))<WrapperProps>`
  display: grid;
  align-items: center;
  gap: 4px 16px;

  &[data-two-columns='true'] {
    grid-template-columns: repeat(2, auto);
  }
`

const LoadingSkeletonForLegends = () => {
  return (
    <LegendsWrapper>
      {Array(4)
        .fill(0)
        .map((_, i) => {
          return (
            <Flex
              key={i}
              sx={{
                alignItems: 'center',
                gap: '8px',
                width: '100%',
              }}
            >
              <Loading
                style={{
                  flex: 1,
                  height: '24px',
                  borderRadius: '4px',
                }}
              />
            </Flex>
          )
        })}
    </LegendsWrapper>
  )
}

type LegendProps = {
  logoUrl?: string
  chainId?: ChainId
  label: string
  value: string
  percent: number
  active?: boolean

  onMouseOver: () => void
  onMouseOut: () => void
}
const Legend: React.FC<LegendProps> = ({
  label,
  value,
  percent,
  logoUrl,
  chainId,
  active,
  onMouseOut,
  onMouseOver,
}) => {
  const theme = useTheme()
  return (
    <Flex
      sx={{
        flex: '0 0 fit-content',
        alignItems: 'center',
        gap: chainId ? '8px' : '4px',
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
          position: 'relative',
          flex: '0 0 14px',
          height: '14px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {logoUrl ? (
          <Logo srcs={[logoUrl]} style={{ width: 14, height: 14, borderRadius: '999px' }} />
        ) : (
          <Flex
            sx={{
              flex: '0 0 14px',
              height: '14px',
              borderRadius: '999px',
              background: theme.subText,
            }}
          />
        )}
        {chainId && (
          <NetworkLogo
            chainId={chainId}
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '10px',
              height: '10px',
            }}
          />
        )}
      </Flex>

      <Flex
        alignItems="center"
        sx={{
          gap: '4px',
        }}
      >
        <Text
          as="span"
          sx={{
            flex: '0 0 max-content',
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
            flex: '0 0 max-content',
            fontWeight: 500,
            fontSize: '12px',
            lineHeight: '16px',
            color: theme.subText,
            whiteSpace: 'nowrap',
          }}
        >
          {formatUSDValue(value)} ({percent.toFixed(2)}%)
        </Text>
      </Flex>
    </Flex>
  )
}

const COLORS = [
  '#2a9d8f',
  '#e9c46a',
  '#9b59b6',
  '#fca311',
  '#0086E7',
  '#3EC000',
  '#e76f51',
  '#219ebc',
  '#fee440',
  '#c0392b',
]

type DataEntry = {
  chainId?: ChainId
  logoUrl?: string
  symbol: string
  value: string
  percent: number
}

type Props = {
  className?: string

  isLoading?: boolean
  totalValue?: string
  data?: DataEntry[]
}

const customStyles: React.CSSProperties = { transition: 'all .3s', cursor: 'pointer' }

const LoadingData = [
  {
    title: t`loading`,
    value: 100,
    color: '#95a5a6',
  },
]

const EarningPieChart: React.FC<Props> = ({ data, totalValue = '', className, isLoading = false }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [isHoveringChart, setHoveringChart] = useState(false)

  const chartData = useMemo(() => {
    if (isLoading || !data) {
      return LoadingData
    }

    if (data.length === 0) {
      return [
        {
          title: 'empty',
          value: 100,
          color: '#95a5a6',
        },
      ]
    }

    return data.map((entry, i) => {
      const color = selectedIndex === i ? darken(0.15, COLORS[i]) : COLORS[i]

      return {
        title: entry.symbol,
        value: entry.percent,
        color,
      }
    })
  }, [data, selectedIndex, isLoading])

  const legendData: Array<DataEntry & { color: string }> = useMemo(() => {
    if (isLoading || !data) {
      return EMPTY_ARRAY
    }

    return data.map((entry, i) => {
      return {
        ...entry,
        color: COLORS[i],
      }
    })
  }, [data, isLoading])

  const handleMouseOver = useCallback(
    (_: any, index: number) => {
      if (isLoading) {
        return
      }

      if (index >= 0) {
        setHoveringChart(true)
        setSelectedIndex(index)
      }
    },
    [isLoading],
  )

  const handleMouseOut = useCallback(() => {
    setSelectedIndex(-1)
    setHoveringChart(false)
  }, [])

  return (
    <Flex
      className={className}
      sx={{
        flexDirection: 'column',
        minHeight: '300px',
      }}
    >
      <Flex
        sx={{
          position: 'relative',
          width: '100%',
          maxHeight: '200px',
          justifyContent: 'center',
        }}
      >
        <Flex
          sx={{
            width: '100%',
            maxWidth: '200px',
            maxHeight: '200px',
          }}
        >
          <PieChart
            key={String(isLoading)}
            data={chartData}
            lineWidth={20}
            radius={pieChartDefaultProps.radius - 10}
            segmentsStyle={isLoading ? undefined : customStyles}
            paddingAngle={isLoading || chartData.length < 2 ? 0 : 1}
            segmentsShift={index => (!isHoveringChart && index === selectedIndex && chartData.length >= 2 ? 2 : 0)}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
          />
        </Flex>

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

      {isLoading ? (
        <LoadingSkeletonForLegends />
      ) : (
        <LegendsWrapper $twoColumns={legendData.length > 5}>
          {legendData.map((entry, i) => {
            return (
              <Legend
                active={selectedIndex === i}
                key={i}
                chainId={entry.chainId}
                logoUrl={entry.logoUrl}
                label={entry.symbol}
                value={entry.value}
                percent={entry.percent}
                onMouseOver={() => setSelectedIndex(i)}
                onMouseOut={() => setSelectedIndex(-1)}
              />
            )
          })}
        </LegendsWrapper>
      )}
    </Flex>
  )
}

export default EarningPieChart
