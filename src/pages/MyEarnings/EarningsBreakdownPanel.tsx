import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { ReactNode, memo, useEffect, useMemo, useState } from 'react'
import { Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import EarningPieChart, { DataEntry } from 'components/EarningPieChart'
import { fetchListTokenByAddresses } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { EarningsBreakdown } from 'types/myEarnings'
import { formatDisplayNumber } from 'utils/numbers'

type WrapperProps = { $columns: number; $border?: boolean }
const Wrapper = styled.div.attrs<WrapperProps>(({ $columns }) => ({
  'data-columns': $columns,
}))<WrapperProps>`
  width: 240px;
  flex: 0 0 240px;

  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 24px;
  background-color: ${({ theme }) => theme.buttonBlack};
  border: 1px solid ${({ theme, $border }) => ($border ? theme.border : 'transparent')};

  transition: all 500ms ease, background 0s, border 0s, color 0s;

  &[data-columns='2'] {
    width: 400px;
    flex: 0 0 400px;
  }
`

type Props = {
  isLoading?: boolean
  data?: EarningsBreakdown
  className?: string
  horizontalLayout?: boolean
}

type Token = {
  address: string
  chainId: ChainId
  logoUrl?: string
  symbol: string
  value: string
  percent: number
}
// todo move to other file
const TokenAllocationChartLocal = ({
  className,
  numberOfTokens,
  isLoading,
  horizontalLayout,
  totalUsd,
  data,
  title,
  border = true,
  style,
}: {
  className?: string
  numberOfTokens: number
  totalUsd: number
  isLoading?: boolean
  horizontalLayout?: boolean
  data: DataEntry[]
  title?: ReactNode
  border?: boolean
  style?: CSSProperties
}) => {
  const theme = useTheme()
  const totalColumn = horizontalLayout && numberOfTokens <= 6 ? 1 : numberOfTokens >= 4 ? 2 : 1
  return (
    <Wrapper className={className} $columns={totalColumn} $border={border} style={style}>
      {title && (
        <Text
          sx={{
            fontWeight: 500,
            fontSize: '14px',
            lineHeight: '20px',
            color: theme.subText,
          }}
        >
          {title}
        </Text>
      )}
      {isLoading || !data ? (
        <EarningPieChart horizontalLayout={horizontalLayout} isLoading totalColumn={totalColumn} />
      ) : (
        <EarningPieChart
          totalColumn={totalColumn}
          horizontalLayout={horizontalLayout}
          data={data}
          totalValue={formatDisplayNumber(totalUsd || 0, { style: 'currency', fractionDigits: 2 })}
        />
      )}
    </Wrapper>
  )
}
export const TokenAllocationChart = memo(TokenAllocationChartLocal)

const EarningsBreakdownPanel: React.FC<Props> = ({ isLoading, data, className, horizontalLayout }) => {
  const numberOfTokens = data?.breakdowns.length || 0
  const [tokens, setTokens] = useState<{ [chainId: string]: { [address: string]: WrappedTokenInfo } }>({})

  const missingTokensByChainId = useMemo(() => {
    return (
      data?.breakdowns
        .filter(item => (item.address && item.chainId ? item.symbol === '' : false))
        .reduce(
          (acc, cur) => {
            if (!cur.chainId || !cur.address) return acc
            if (acc[cur.chainId]) {
              acc[cur.chainId].push(cur as Token)
            } else acc[cur.chainId] = [cur as Token]
            return acc
          },
          {} as {
            [key: string]: Array<Token>
          },
        ) || {}
    )
  }, [data])

  useEffect(() => {
    const getData = async () => {
      const chainIds = Object.keys(missingTokensByChainId)
      const res = await Promise.all(
        chainIds.map(chain => {
          const missingTokens = missingTokensByChainId[chain].map(item => item.address)
          return fetchListTokenByAddresses(missingTokens, +chain)
        }),
      )

      setTokens(
        chainIds.reduce((acc, id, idx) => {
          acc[id] = res[idx].reduce(
            (ac, item: WrappedTokenInfo) => ({ ...ac, [item.address]: item }),
            {} as { [tokenAddress: string]: WrappedTokenInfo },
          )

          return acc
        }, {} as { [chainId: string]: { [address: string]: WrappedTokenInfo } }),
      )
    }

    getData()
  }, [missingTokensByChainId])

  const formatData = useMemo(() => {
    return (
      data?.breakdowns.map(item => ({
        ...item,
        logoUrl:
          item.chainId && item.address && !item.logoUrl ? tokens[item.chainId]?.[item.address]?.logoURI : item.logoUrl,
        symbol:
          item.chainId && item.address && !item.symbol
            ? tokens[item.chainId]?.[item.address]?.symbol || ''
            : item.symbol,
      })) || []
    )
  }, [data, tokens])

  return (
    <TokenAllocationChart
      {...{
        border: true,
        title: t`Tokens Breakdown`,
        numberOfTokens,
        isLoading,
        className,
        horizontalLayout,
        totalUsd: data?.totalValue || 0,
        data: formatData,
      }}
    />
  )
}

export default EarningsBreakdownPanel
