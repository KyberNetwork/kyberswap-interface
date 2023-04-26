import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { commify, formatUnits } from 'ethers/lib/utils'
import { useContext, useEffect, useMemo, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useMemo } from 'react'
import { Text } from 'rebass'
import styled, { DefaultTheme, css } from 'styled-components'

import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import Pagination from 'components/Pagination'
import Row, { RowFit } from 'components/Row'
import { useTokenContractForReading } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import {
  useFundingRateQuery,
  useHolderListQuery,
  useLiveDexTradesQuery,
  useTokenDetailQuery,
} from 'pages/TrueSightV2/hooks/useKyberAIData'
import { testParams } from 'pages/TrueSightV2/pages/SingleToken'
import { TechnicalAnalysisContext } from 'pages/TrueSightV2/pages/TechnicalAnalysis'
import { IHolderList, KyberAITimeframe } from 'pages/TrueSightV2/types'
import { shortenAddress } from 'utils'

import { ContentWrapper } from '..'
import SmallKyberScoreMeter from '../SmallKyberScoreMeter'
import { TimeFrameLegend } from '../chart'

// import OHLCData from './../chart/candles.json'

const Table2 = styled.table`
  border-collapse: collapse;
  thead {
    height: 48px;
    font-size: 12px;
    line-height: 16px;
    font-weight: 500;
    color: ${({ theme }) => theme.subText};
    background: ${({ theme }) => theme.buttonGray};
    text-transform: uppercase;
    th {
      text-align: left;
      padding: 16px;
    }
  }

  tr {
    height: 72px;
    border-spacing: 1px;
    border-bottom: 1px solid ${({ theme }) => theme.border};
    td {
      padding: 16px;
    }
  }
`
const TableWrapper = styled(ContentWrapper)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
  padding: 0;
  font-size: 12px;
  border-radius: 6px;
  width: 100%;
`
const TableHeader = styled.div<{ gridTemplateColumns: string }>`
  display: grid;
  grid-template-columns: ${({ gridTemplateColumns }) => gridTemplateColumns};
  align-items: center;
  height: 48px;
  text-transform: uppercase;

  ${({ theme }) => css`
    background-color: ${theme.tableHeader};
    color: ${theme.subText};
  `};

  & > *:last-child {
    align-items: flex-end;
  }
`
const TableRow = styled(TableHeader)<{ height?: number }>`
  height: ${({ height }) => height || 72}px;
  font-size: 14px;
  text-transform: initial;
  ${({ theme }) => css`
    background-color: ${theme.background};
    color: ${theme.text};
    border-bottom: 1px solid ${theme.border};
  `};
`
const TableCell = styled.div`
  display: flex;
  flex-direction: column;
  padding: 6px 16px;
  gap: 4px;
`

const ActionButton = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  font-size: 12px;
  line-height: 16px;
  gap: 4px;
  cursor: pointer;
  ${({ theme, color }) => css`
    color: ${color || theme.primary};
  `}
  :hover {
    filter: brightness(0.9);
  }
  :active {
    filter: brightness(1.2);
  }
`

export const Top10HoldersTable = () => {
  const theme = useTheme()
  // const navigate = useNavigate()
  const { data } = useHolderListQuery({ address: '0xF9fbe825bfb2bf3e387af0dc18cac8d87f29dea8' })
  const { data: tokenInfo } = useTokenDetailQuery({
    chain: 'ethereum',
    address: '0xF9fbe825bfb2bf3e387af0dc18cac8d87f29dea8',
  })
  const [decimal, setDecimal] = useState(0)
  const tokenContract = useTokenContractForReading('0xf9fbe825bfb2bf3e387af0dc18cac8d87f29dea8', ChainId.MAINNET)

  useEffect(() => {
    tokenContract?.decimals().then((res: any) => {
      setDecimal(res)
    })
  }, [tokenContract])
  return (
    <Table2>
      <colgroup>
        <col style={{ width: '300px' }} />
        <col style={{ width: '300px' }} />
        <col style={{ width: '300px' }} />
        {/* <col style={{ width: '500px' }} /> */}
      </colgroup>
      <thead>
        <th>
          <Trans>Address</Trans>
        </th>
        <th>
          <Trans>Supply owned</Trans>
        </th>
        <th>
          <Trans>Amount held</Trans>
        </th>
        {/* <th>
          <Trans>Other tokens held</Trans>
        </th> */}
      </thead>
      <tbody>
        {decimal &&
          data?.slice(0, 10).map((item: IHolderList, i: number) => (
            <tr key={i}>
              <td>
                <Column gap="4px">
                  <Text fontSize="14px" lineHeight="20px" color={theme.text}>
                    {shortenAddress(1, item.address)}
                  </Text>
                  <RowFit gap="8px">
                    <ActionButton color={theme.subText}>
                      <Icon id="copy" size={16} /> Copy
                    </ActionButton>
                    <ActionButton color={theme.subText}>
                      <Icon id="open-link" size={16} /> Analyze
                    </ActionButton>
                  </RowFit>
                </Column>
              </td>
              <td>
                <Text fontSize="14px" lineHeight="20px" color={theme.text}>
                  {item.percentage.toPrecision(4)}%
                </Text>
              </td>
              <td>
                <Text fontSize="14px" lineHeight="20px" color={theme.text}>
                  {tokenInfo &&
                    item.quantity &&
                    commify(
                      formatUnits(BigNumber.from(item.quantity.toLocaleString('fullwide', { useGrouping: false })), 18),
                    )}
                </Text>
              </td>
            </tr>
          ))}
      </tbody>
    </Table2>
  )
}

const formatLevelValue = (value: number): string => {
  if (value > 1000) return (+value.toFixed(2)).toLocaleString()
  return value.toPrecision(5)
}

export const SupportResistanceLevel = () => {
  const theme = useTheme()
  const { SRLevels, currentPrice, resolution, setResolution } = useContext(TechnicalAnalysisContext)
  const [supports, resistances] = useMemo(() => {
    if (!SRLevels || !currentPrice) return []

    return [
      SRLevels?.filter(level => level.value < currentPrice).sort((a, b) => b.value - a.value),
      SRLevels?.filter(level => level.value > currentPrice).sort((a, b) => a.value - b.value),
    ]
  }, [SRLevels, currentPrice])
  const maxLength = Math.max(supports?.length || 0, resistances?.length || 0, 4)
  const gridTemplateColumns = '1fr ' + (Array(maxLength).fill('1fr').join(' ') || '')

  return (
    <TableWrapper>
      <TableHeader gridTemplateColumns={gridTemplateColumns}>
        <>
          <TableCell>Type</TableCell>
          <>
            {Array(maxLength)
              .fill('')
              .map((i, index) => (
                <TableCell key={index}>
                  {index === 0 && <Trans>Levels</Trans>}
                  {index === maxLength - 1 && (
                    <TimeFrameLegend
                      selected={resolution as KyberAITimeframe}
                      timeframes={[KyberAITimeframe.ONE_HOUR, KyberAITimeframe.FOUR_HOURS, KyberAITimeframe.ONE_DAY]}
                      onSelect={t => setResolution?.(t as string)}
                    />
                  )}
                </TableCell>
              ))}
          </>
        </>
      </TableHeader>
      <TableRow gridTemplateColumns={gridTemplateColumns}>
        <>
          <TableCell>
            <Text color={theme.primary}>Support</Text>
          </TableCell>
          {Array(maxLength)
            .fill('')
            .map((i, index) => (
              <TableCell key={index} style={{ alignItems: 'flex-start' }}>
                <Text color={theme.text}>
                  {supports?.[index] && currentPrice && `${formatLevelValue(supports[index].value)}`}
                </Text>
                <Text color={theme.apr} fontSize="12px">
                  {supports?.[index] && currentPrice
                    ? (((supports[index].value - currentPrice) / currentPrice) * 100).toFixed(2) + '%'
                    : '--'}
                </Text>
              </TableCell>
            ))}
        </>
      </TableRow>
      <TableRow gridTemplateColumns={gridTemplateColumns}>
        <>
          <TableCell>
            <Text color={theme.red}>Resistance</Text>
          </TableCell>
          {Array(maxLength)
            .fill('')
            .map((i, index) => (
              <TableCell key={index} style={{ alignItems: 'flex-start' }}>
                <Text color={theme.text}>
                  {resistances?.[index] && currentPrice && `${formatLevelValue(resistances[index].value)} `}
                </Text>
                <Text color={theme.red} fontSize="12px">
                  {resistances?.[index] && currentPrice
                    ? (((resistances[index].value - currentPrice) / currentPrice) * 100).toFixed(2) + '%'
                    : '--'}
                </Text>
              </TableCell>
            ))}
        </>
      </TableRow>
    </TableWrapper>
  )
}

function colorRateText(value: number, theme: DefaultTheme) {
  if (value > 0.015) return theme.red
  if (value > 0.005) return theme.text
  return theme.primary
}

export const FundingRateTable = () => {
  const theme = useTheme()
  const { data, isLoading } = useFundingRateQuery({ tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' })

  const gridTemplateColumns = data?.uMarginList
    ? Array(data.uMarginList.length + 1)
        .fill('1fr')
        .join(' ')
    : '1fr 1fr 1fr 1fr 1fr 1fr'
  const hasNoData = !data && !isLoading
  return (
    <TableWrapper>
      {hasNoData ? (
        <Row height="200px" justify="center">
          <Text fontSize="14px">
            <Trans>We couldn&apos;t find any information on USDT</Trans>
          </Text>
        </Row>
      ) : (
        <>
          <TableHeader gridTemplateColumns={gridTemplateColumns}>
            <TableCell></TableCell>
            {data?.uMarginList?.map((i: any) => (
              <TableCell key={i.exchangeName}>
                <Row gap="4px">
                  <img alt={i.exchangeName} src={i.exchangeLogo} style={{ height: '18px', width: '18px' }} />
                  <Text color={theme.text}>{i.exchangeName}</Text>
                </Row>
              </TableCell>
            ))}

            <TableCell></TableCell>
          </TableHeader>
          <TableRow gridTemplateColumns={gridTemplateColumns} height={72}>
            <TableCell>
              <Row gap="4px">
                <img alt={data?.symbol} src={data?.symbolLogo} style={{ height: '20px' }} />
                <Text>{data?.symbol}</Text>
              </Row>
            </TableCell>
            {data?.uMarginList?.map((i: any) => (
              <TableCell key={i.exchangeName}>
                <Row gap="4px">
                  <Text color={colorRateText(i.rate, theme)} fontWeight={500} lineHeight="40px">
                    {i.rate.toFixed(4)}%
                  </Text>
                </Row>
              </TableCell>
            ))}
            <TableCell></TableCell>
          </TableRow>
        </>
      )}
    </TableWrapper>
  )
}

export const LiveDEXTrades = () => {
  const theme = useTheme()
  const { data } = useLiveDexTradesQuery({ chain: testParams.chain, tokenAddress: testParams.address })
  console.log('🚀 ~ file: index.tsx:377 ~ LiveDEXTrades ~ data:', data)
  const gridTemplateColumns = '1.4fr 1fr 1.2fr 2fr 2fr 1.5fr 1fr'

  return (
    <TableWrapper>
      <TableHeader gridTemplateColumns={gridTemplateColumns}>
        <TableCell>Date</TableCell>
        <TableCell>Type</TableCell>
        <TableCell>Price ($)</TableCell>
        <TableCell>Amount In</TableCell>
        <TableCell>Amount Out</TableCell>
        <TableCell>Trader</TableCell>
        <TableCell>Transaction</TableCell>
      </TableHeader>
      {[...Array(10)].map((_, i) => (
        <TableRow key={i} gridTemplateColumns={gridTemplateColumns}>
          <TableCell>
            <Text>16/10/2021</Text>
            <Text fontSize={12} color={theme.subText}>
              11:25:42 AM
            </Text>
          </TableCell>
          <TableCell>
            <Text color={theme.primary}>Buy</Text>
          </TableCell>
          <TableCell>$0.12345</TableCell>
          <TableCell>
            <Row>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15.7605 9.9353C14.6919 14.221 10.3507 16.8292 6.06401 15.7605C1.77905 14.692 -0.829473 10.351 0.239641 6.06559C1.30775 1.77938 5.64897 -0.829093 9.93442 0.239396C14.2209 1.30789 16.8292 5.64934 15.7605 9.9353Z"
                  fill="#F7931A"
                />
              </svg>{' '}
              <Text color={theme.primary}> + 232,232 BTC</Text>
            </Row>
            <Text color={theme.subText} fontSize={12}>
              $0.16
            </Text>
          </TableCell>
          <TableCell>
            <Row>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect width="16" height="16" fill="url(#pattern0)" />
                <defs>
                  <pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">
                    <use transform="scale(0.00460829)" />
                  </pattern>
                  <image id="image0_538_1271" width="217" height="217" />
                </defs>
              </svg>
              <Text color={theme.subText}>- 1,123,324.23 USDT</Text>
            </Row>
            <Text color={theme.subText} fontSize={12}>
              $0.16
            </Text>
          </TableCell>
          <TableCell>
            <Text color={theme.primary}>0x9E6A...3651</Text>
          </TableCell>
          <TableCell>
            <Row justify="flex-end" gap="8px">
              <ActionButton color={theme.subText}>
                <Icon id="copy" size={16} />
              </ActionButton>
              <ActionButton color={theme.subText}>
                <Icon id="open-link" size={16} />
              </ActionButton>
            </Row>
          </TableCell>
        </TableRow>
      ))}
      <Pagination currentPage={1} pageSize={10} totalCount={100} onPageChange={page => console.log(page)} />
    </TableWrapper>
  )
}

export const WidgetTable = () => {
  const theme = useTheme()
  const gridTemplateColumns = '1fr 1fr 1fr 1fr 0.6fr'

  return (
    <TableWrapper style={{ borderRadius: '0' }}>
      <TableHeader gridTemplateColumns={gridTemplateColumns} style={{ backgroundColor: theme.background }}>
        <TableCell>
          <Trans>Token</Trans>
        </TableCell>
        <TableCell>
          <Trans>Kyberscore</Trans>
        </TableCell>
        <TableCell>
          <Trans>Price | 24 Change</Trans>
        </TableCell>
        <TableCell>
          <Trans>Last 7 days</Trans>
        </TableCell>
        <TableCell>
          <Trans>Action</Trans>
        </TableCell>
      </TableHeader>
      {[...Array(5)].map((_, i) => (
        <TableRow
          key={i}
          gridTemplateColumns={gridTemplateColumns}
          height={64}
          style={{ backgroundColor: theme.tableHeader }}
        >
          <TableCell>
            <RowFit gap="6px">
              <Icon id="star" size={16} />
              <div style={{ position: 'relative', width: '24px', height: '24px' }}>
                <img
                  alt="tokenInList"
                  src="https://cryptologos.cc/logos/thumbs/kyber-network-crystal-v2.png?v=023"
                  width="24px"
                  height="24px"
                />
                <Row
                  justify="center"
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    backgroundColor: theme.background,
                    border: `2px solid ${theme.background}`,
                    width: '14px',
                    height: '14px',
                    borderRadius: '100%',
                  }}
                >
                  <Icon id="eth-mono" size={12} />
                </Row>
              </div>
              KNC
            </RowFit>
          </TableCell>
          <TableCell>
            <SmallKyberScoreMeter value={80} />
          </TableCell>
          <TableCell>
            <Column gap="4px">
              <Text color={theme.text} fontSize="14px" lineHeight="20px">
                $0.0000000401
              </Text>
              <Text color={theme.primary} fontSize="10px" lineHeight="12px">
                20%
              </Text>
            </Column>
          </TableCell>
          <TableCell>
            <svg width="141" height="43" viewBox="0 0 141 43" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M140 30.4609L138.131 35.8539L137.858 35.0721L136.792 35.9849L135.989 35.723C135.989 35.723 133.848 37.0911 133.046 37.222C132.244 37.353 130.639 34.6167 130.11 34.3548C129.572 34.0949 129.572 32.6623 129.572 32.6623L127.968 32.4668L127.431 31.945L126.099 33.1822L125.024 31.2277L121.816 41C121.816 41 120.484 39.4364 120.749 39.5029C119.682 37.5484 118.608 39.9583 118.608 39.9583L116.201 39.7628L115.936 37.8084L115.672 35.6585L114.597 35.9184L113.795 35.594C109.52 38.9165 111.388 33.7685 111.388 33.7685L106.576 15.592L106.046 16.1138L104.442 15.9829L102.565 17.351L100.961 17.2865L99.6294 20.2182L97.4878 20.4137L96.9503 21.5218L94.2793 23.4763C94.2793 23.4763 93.2125 22.1082 93.2125 22.0417C93.2125 21.9772 92.1376 21.3909 91.8729 21.3909C89.7313 22.9545 90.2687 21.3264 90.2687 21.3264L88.3998 17.351L87.0602 17.0266C87.0602 17.0266 85.9934 17.9374 85.7207 17.9374C81.1807 18.3947 81.4454 22.1727 81.4454 22.1727L80.3786 21.9127L79.5765 22.4991L77.6995 20.0873L75.8306 21.4554L73.1595 19.9583L72.0847 21.6508L70.7532 22.1727L69.4136 19.3719L67.0073 22.2372L62.1946 20.8046L60.5904 22.5636L58.4487 19.4364L56.3151 23.4099L53.1066 17.5465L52.3045 18.0038L48.2939 4.19164L47.2191 5.8197L43.4812 3.2144L41.0748 4.90892L38.1311 7.05883L35.1873 5.23336L32.7809 9.40418L31.1767 5.62425L29.3078 6.0816L26.0993 1L20.4845 11.0322L20.2687 11.4661L17.2768 17.5465L14.6058 14.8102C14.6058 14.8102 13.956 15.678 13.0015 15.6585C11.4133 15.6231 11.3973 14.1594 11.3973 14.1594L10.3216 15.463L8.71741 15.3966L6.04716 19.5009L4.17823 15.463L3.47237 16.9601L3.10259 17.7419L1.49836 16.6357L0.96976 18.1328H0"
                stroke="#31CB9E"
              />
            </svg>
          </TableCell>
          <TableCell>
            <ButtonLight height="28px" width="75px" padding="4px 8px">
              <RowFit gap="4px" fontSize="14px">
                <Icon id="swap" size={16} />
                Swap
              </RowFit>
            </ButtonLight>
          </TableCell>
        </TableRow>
      ))}
    </TableWrapper>
  )
}
