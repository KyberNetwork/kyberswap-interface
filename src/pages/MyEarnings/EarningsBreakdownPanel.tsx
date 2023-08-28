import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { formatUSDValue } from 'components/EarningAreaChart/utils'
import EarningPieChart from 'components/EarningPieChart'
import { fetchListTokenByAddresses } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { EarningsBreakdown } from 'types/myEarnings'

type WrapperProps = { $columns: 1 | 2 }
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
  border: 1px solid ${({ theme }) => theme.border};

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
const EarningsBreakdownPanel: React.FC<Props> = ({ isLoading, data, className, horizontalLayout }) => {
  const theme = useTheme()

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

  return (
    <Wrapper className={className} $columns={numberOfTokens > 5 ? 2 : 1}>
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <Flex
          sx={{
            width: '100%',
            justifyContent: 'space-between',
          }}
        >
          <Text
            sx={{
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: theme.subText,
            }}
          >
            <Trans>Tokens Breakdown</Trans>
          </Text>
        </Flex>
      </Flex>

      {isLoading || !data ? (
        <EarningPieChart horizontalLayout={horizontalLayout} isLoading />
      ) : (
        <EarningPieChart
          horizontalLayout={horizontalLayout}
          data={data.breakdowns.map(item => ({
            ...item,
            logoUrl:
              item.chainId && item.address && !item.logoUrl
                ? tokens[item.chainId]?.[item.address]?.logoURI
                : item.logoUrl,
            symbol:
              item.chainId && item.address && !item.symbol
                ? tokens[item.chainId]?.[item.address]?.symbol || ''
                : item.symbol,
          }))}
          totalValue={formatUSDValue(data.totalValue, true)}
        />
      )}
    </Wrapper>
  )
}

export default EarningsBreakdownPanel
