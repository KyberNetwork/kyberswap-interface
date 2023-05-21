import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { useNavigate, useParams } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { DefaultTheme, css } from 'styled-components'

import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import Icon from 'components/Icons/Icon'
import InfoHelper from 'components/InfoHelper'
import AnimatedLoader from 'components/Loader/AnimatedLoader'
import Pagination from 'components/Pagination'
import Row, { RowFit } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { NETWORK_TO_CHAINID } from 'pages/TrueSightV2/constants'
import {
  useAddToWatchlistMutation,
  useFundingRateQuery,
  useHolderListQuery,
  useLiveDexTradesQuery,
  useRemoveFromWatchlistMutation,
  useTokenDetailQuery,
} from 'pages/TrueSightV2/hooks/useKyberAIData'
import { defaultExplorePageToken } from 'pages/TrueSightV2/pages/SingleToken'
import { TechnicalAnalysisContext } from 'pages/TrueSightV2/pages/TechnicalAnalysis'
import { IHolderList, IKyberScoreChart, ILiveTrade, ITokenList, KyberAITimeframe } from 'pages/TrueSightV2/types'
import {
  calculateValueToColor,
  formatLocaleStringNum,
  formatTokenPrice,
  navigateToSwapPage,
} from 'pages/TrueSightV2/utils'
import { ExternalLink } from 'theme'
import { getEtherscanLink, shortenAddress } from 'utils'

import ChevronIcon from '../ChevronIcon'
import MultipleChainDropdown from '../MultipleChainDropdown'
import SimpleTooltip from '../SimpleTooltip'
import SmallKyberScoreMeter from '../SmallKyberScoreMeter'
import TokenChart from '../TokenChartSVG'
import { StarWithAnimation } from '../WatchlistStar'
import { TimeFrameLegend } from '../chart'

const TableWrapper = styled.table`
  border-collapse: collapse;
  border-radius: 6px;
  overflow: hidden;
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
    background-color: ${({ theme }) => theme.background};
    td {
      padding: 16px;
    }
  }
  tr:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.border};
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    border-radius: 0;
    margin: -16px;
  `}
`

const ActionButton = styled.div<{ color: string; hasBg?: boolean }>`
  display: flex;
  align-items: center;
  font-size: 12px;
  line-height: 16px;
  gap: 4px;
  padding: 6px;
  border-radius: 50%;
  background-color: ${({ theme, hasBg }) => (hasBg ? theme.subText + '32' : 'none')};
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

const StyledLoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`

const LoadingHandleWrapper = ({
  isLoading,
  hasData,
  children,
  height,
}: {
  isLoading: boolean
  hasData: boolean
  children: ReactNode
  height?: string
}) => {
  return (
    <TableWrapper>
      {!hasData ? (
        <>
          <StyledLoadingWrapper style={height ? { height } : undefined}>
            {isLoading ? (
              <AnimatedLoader />
            ) : (
              <Text fontSize="14px">
                <Trans>We couldn&apos;t find any information for this token</Trans>
              </Text>
            )}
          </StyledLoadingWrapper>
        </>
      ) : (
        <>{children}</>
      )}
    </TableWrapper>
  )
}

export const Top10HoldersTable = () => {
  const theme = useTheme()
  const { chain, address } = useParams()
  const { data, isLoading } = useHolderListQuery({ address, chain })
  const { data: tokenOverview } = useTokenDetailQuery({
    chain,
    address,
  })
  return (
    <LoadingHandleWrapper isLoading={isLoading} hasData={!!data && data.length > 0} height="400px">
      <colgroup>
        <col style={{ width: '300px', minWidth: '150px' }} />
        <col style={{ width: '300px' }} />
        <col style={{ width: '300px' }} />
        {/* <col style={{ width: '500px' }} /> */}
      </colgroup>
      <thead>
        <th style={{ position: 'sticky', zIndex: 2 }}>
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
        {data?.slice(0, 10).map((item: IHolderList, i: number) => (
          <tr key={i}>
            <td style={{ position: 'sticky', zIndex: 2 }}>
              <Column gap="4px">
                <Text fontSize="14px" lineHeight="20px" color={theme.text}>
                  {shortenAddress(1, item.address)}
                </Text>
                <RowFit gap="12px">
                  <ActionButton color={theme.subText} style={{ padding: '6px 0' }}>
                    <CopyHelper toCopy={item.address} text="Copy" />
                  </ActionButton>
                  <ActionButton
                    color={theme.subText}
                    style={{ padding: '6px 0' }}
                    onClick={() => {
                      chain &&
                        window.open(getEtherscanLink(NETWORK_TO_CHAINID[chain], item.address, 'address'), '_blank')
                    }}
                  >
                    <Icon id="open-link" size={16} /> Analyze
                  </ActionButton>
                </RowFit>
              </Column>
            </td>
            <td>
              <Text fontSize="14px" lineHeight="20px" color={theme.text}>
                {(item.percentage * 100).toPrecision(4)}%
              </Text>
            </td>
            <td>
              <Text fontSize="14px" lineHeight="20px" color={theme.text}>
                {tokenOverview &&
                  item.quantity &&
                  formatLocaleStringNum(
                    +formatUnits(
                      BigNumber.from(item.quantity.toLocaleString('fullwide', { useGrouping: false })),
                      tokenOverview.decimals,
                    ),
                    0,
                  )}
              </Text>
            </td>
          </tr>
        ))}
      </tbody>
    </LoadingHandleWrapper>
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

  return (
    <TableWrapper>
      <colgroup>
        <col width="300px" style={{ minWidth: '100px' }} />
        {Array(maxLength)
          .fill('')
          .map((_, index) => (
            <col key={index} width="300px" />
          ))}
      </colgroup>
      <thead>
        <>
          <th>Type</th>
          <>
            {Array(maxLength)
              .fill('')
              .map((i, index) => (
                <th key={index}>
                  {index === 0 && <Trans>Levels</Trans>}
                  {index === maxLength - 1 && (
                    <Row justify="flex-end">
                      <div style={{ width: '180px' }}>
                        <TimeFrameLegend
                          selected={resolution as KyberAITimeframe}
                          timeframes={[
                            KyberAITimeframe.ONE_HOUR,
                            KyberAITimeframe.FOUR_HOURS,
                            KyberAITimeframe.ONE_DAY,
                            KyberAITimeframe.FOUR_DAY,
                          ]}
                          onSelect={t => setResolution?.(t as string)}
                        />
                      </div>
                    </Row>
                  )}
                </th>
              ))}
          </>
        </>
      </thead>
      <tbody>
        <tr>
          <>
            <td>
              <Text color={theme.primary} fontSize="14px">
                Support
              </Text>
            </td>
            {Array(maxLength)
              .fill('')
              .map((i, index) => (
                <td key={index} style={{ alignItems: 'flex-start' }}>
                  <Text color={theme.text} fontSize="14px" lineHeight="20px">
                    {supports?.[index] && currentPrice && `${formatLevelValue(supports[index].value)}`}
                  </Text>
                  <Text color={theme.apr} fontSize="12px" lineHeight="16px">
                    {supports?.[index] && currentPrice
                      ? (((supports[index].value - currentPrice) / currentPrice) * 100).toFixed(2) + '%'
                      : '--'}
                  </Text>
                </td>
              ))}
          </>
        </tr>
        <tr>
          <>
            <td>
              <Text color={theme.red} fontSize="14px">
                Resistance
              </Text>
            </td>
            {Array(maxLength)
              .fill('')
              .map((i, index) => (
                <td key={index} style={{ alignItems: 'flex-start' }}>
                  <Text color={theme.text} fontSize="14px" lineHeight="20px">
                    {resistances?.[index] && currentPrice && `${formatLevelValue(resistances[index].value)} `}
                  </Text>
                  <Text color={theme.red} fontSize="12px" lineHeight="16px">
                    {resistances?.[index] && currentPrice
                      ? (((resistances[index].value - currentPrice) / currentPrice) * 100).toFixed(2) + '%'
                      : '--'}
                  </Text>
                </td>
              ))}
          </>
        </tr>
      </tbody>
    </TableWrapper>
  )
}

function colorRateText(value: number, theme: DefaultTheme) {
  if (value > 0.015) return theme.primary
  if (value > 0.005) return theme.text
  return theme.red
}

export const FundingRateTable = () => {
  const theme = useTheme()
  const { chain, address } = useParams()
  const { data, isLoading } = useFundingRateQuery({ address, chain })

  return (
    <LoadingHandleWrapper isLoading={isLoading} hasData={!!data && data.length > 0} height="200px">
      <colgroup>
        <col />
        {Array(data?.uMarginList?.length)
          .fill(1)
          .map((_, index) => (
            <col key={index} style={{ width: '150px' }} />
          ))}
      </colgroup>
      <thead>
        <th></th>
        {data?.uMarginList?.map((i: any) => (
          <th key={i.exchangeName}>
            <Row gap="4px">
              <img alt={i.exchangeName} src={i.exchangeLogo} style={{ height: '18px', width: '18px' }} />
              <Text color={theme.text}>{i.exchangeName}</Text>
            </Row>
          </th>
        ))}
      </thead>
      <tbody>
        <tr>
          <td>
            <Row gap="4px">
              <img alt={data?.symbol} src={data?.symbolLogo} style={{ height: '40px' }} />
              <Column gap="4px">
                <Text color={theme.text} fontSize="14px">
                  {data?.symbol}
                </Text>
              </Column>
            </Row>
          </td>
          {data?.uMarginList?.map((i: any) => (
            <td key={i.exchangeName}>
              <Text color={colorRateText(i.rate, theme)} fontSize="14px" lineHeight="20px" fontWeight={500}>
                {i.rate.toFixed(4)}%
              </Text>
            </td>
          ))}
        </tr>
      </tbody>
    </LoadingHandleWrapper>
  )
}

export const LiveDEXTrades = () => {
  const theme = useTheme()
  const [currentPage, setCurrentPage] = useState(1)
  const { chain, address } = useParams()
  const { data, isLoading } = useLiveDexTradesQuery({
    chain: chain || defaultExplorePageToken.chain,
    address: address || defaultExplorePageToken.address,
  })
  const { data: tokenOverview } = useTokenDetailQuery({
    chain: chain || defaultExplorePageToken.chain,
    address: address || defaultExplorePageToken.address,
  })

  return (
    <>
      <LoadingHandleWrapper isLoading={isLoading} hasData={!!data && data.length > 0}>
        <colgroup>
          <col width="50px" />
          <col width="100px" />
          <col width="200px" />
          <col width="260px" />
          <col width="200px" />
          <col width="100px" />
        </colgroup>
        <thead>
          <th>Date</th>
          <th>Type</th>
          <th>Price ($)</th>
          <th>Amount</th>
          <th>Trader</th>
          <th style={{ textAlign: 'right' }}>Transaction</th>
        </thead>
        <tbody style={{ fontSize: '14px', lineHeight: '20px' }}>
          {data?.slice((currentPage - 1) * 10, currentPage * 10 - 1).map((trade: ILiveTrade, i: number) => {
            const isBuy = trade.type === 'buy'
            return (
              <tr key={i}>
                <td>
                  <Text>{dayjs(trade.timestamp * 1000).format('DD/MM/YYYY')}</Text>
                  <Text fontSize={12} color={theme.subText}>
                    {dayjs(trade.timestamp * 1000).format('HH:mm:ss A')}
                  </Text>
                </td>
                <td>
                  <Text color={isBuy ? theme.primary : theme.red} style={{ textTransform: 'capitalize' }}>
                    {trade.type}
                  </Text>
                </td>
                <td>${formatLocaleStringNum(trade.price, 6)}</td>
                <td>
                  <Row gap="4px">
                    <img src={tokenOverview?.logo} width="16px" height="16px" style={{ borderRadius: '8px' }} />
                    <Text color={isBuy ? theme.primary : theme.red}>
                      {isBuy ? '+' : '-'} {formatLocaleStringNum(+trade.amountToken)} {tokenOverview?.symbol}
                    </Text>
                    {trade.price * +trade.amountToken > 100000 && (
                      <InfoHelper text={t`This transaction is higher than >$100k`} placement="top" />
                    )}
                  </Row>
                  <Text color={theme.subText} fontSize={12}>
                    ${formatLocaleStringNum(trade.price * +trade.amountToken)}{' '}
                  </Text>
                </td>
                <td>
                  <ExternalLink
                    href={chain ? getEtherscanLink(NETWORK_TO_CHAINID[chain], trade.trader, 'address') : '#'}
                  >
                    <Text color={theme.primary}>{shortenAddress(1, trade.trader)}</Text>
                  </ExternalLink>
                </td>
                <td>
                  <Row justify="flex-end" gap="8px">
                    <ActionButton color={theme.subText} hasBg>
                      <CopyHelper toCopy={trade.txn} style={{ marginLeft: 0 }} />
                    </ActionButton>
                    <ActionButton color={theme.subText} hasBg>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={chain ? getEtherscanLink(NETWORK_TO_CHAINID[chain], trade.txn, 'transaction') : '#'}
                      >
                        <Icon id="open-link" size={16} />
                      </a>
                    </ActionButton>
                  </Row>
                </td>
              </tr>
            )
          })}
        </tbody>
      </LoadingHandleWrapper>
      <Pagination
        currentPage={currentPage}
        pageSize={10}
        totalCount={data?.length || 10}
        onPageChange={page => setCurrentPage(page)}
      />
    </>
  )
}

const WidgetTableWrapper = styled(TableWrapper)`
  width: 100%;
  thead {
    th {
      padding: 8px 16px;
    }
  }
  tr {
    background-color: ${({ theme }) => theme.tableHeader};
    cursor: pointer;
    td {
      padding: 8px 16px;
    }
    :hover {
      background-color: ${({ theme }) => theme.background + '50'};
    }
  }
`

const WidgetTokenRow = ({ token, onClick }: { token: ITokenList; onClick?: () => void }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { account } = useActiveWeb3React()

  const latestKyberScore: IKyberScoreChart | undefined = token?.ks_3d?.[token.ks_3d.length - 1]
  const hasMutipleChain = token?.tokens?.length > 1

  const [showMenu, setShowMenu] = useState(false)
  const [showSwapMenu, setShowSwapMenu] = useState(false)
  const [menuLeft, setMenuLeft] = useState<number | undefined>(undefined)
  const [isWatched, setIsWatched] = useState(false)
  const [loadingStar, setLoadingStar] = useState(false)
  const [addToWatchlist] = useAddToWatchlistMutation()
  const [removeFromWatchlist] = useRemoveFromWatchlistMutation()

  const rowRef = useRef<HTMLTableRowElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(rowRef, () => setShowMenu(false))
  useOnClickOutside(rowRef, () => setShowSwapMenu(false))

  const handleRowClick = (e: any) => {
    if (hasMutipleChain) {
      const left = e.clientX - (rowRef.current?.getBoundingClientRect()?.left || 0)
      const rowWidth = rowRef.current?.getBoundingClientRect()?.width || 0
      const menuWidth = menuRef.current?.getBoundingClientRect()?.width || 0
      if (left !== undefined) {
        setMenuLeft(Math.min(left, rowWidth - menuWidth))
        setShowMenu(true)
      }
    } else {
      navigate(`${APP_PATHS.KYBERAI_EXPLORE}/${token.tokens[0].chain}/${token.tokens[0].address}`)
      onClick?.()
    }
  }

  const handleSwapClick = (e: any) => {
    e.stopPropagation()
    if (hasMutipleChain) {
      const left =
        e.clientX -
        (rowRef.current?.getBoundingClientRect()?.left || 0) -
        (menuRef.current?.getBoundingClientRect()?.width || 0)
      setShowSwapMenu(true)
      setMenuLeft(left)
    } else {
      navigateToSwapPage({ address: token.tokens[0].address, chain: token.tokens[0].chain })
    }
  }

  const handleSwapNavigateClick = (chain: string, address: string) => {
    navigateToSwapPage({ address, chain })
  }

  const handleWatchlistClick = (e: any) => {
    e.stopPropagation()
    if (!account) return
    setLoadingStar(true)
    if (isWatched) {
      Promise.all(
        token.tokens.map(t => removeFromWatchlist({ wallet: account, tokenAddress: t.address, chain: t.chain })),
      ).then(() => {
        setIsWatched(false)
        setLoadingStar(false)
      })
    } else {
      Promise.all(
        token.tokens.map(t => addToWatchlist({ wallet: account, tokenAddress: t.address, chain: t.chain })),
      ).then(() => {
        setIsWatched(true)
        setLoadingStar(false)
      })
    }
  }

  useEffect(() => {
    setIsWatched(token.isWatched)
  }, [token.isWatched])

  return (
    <tr onClick={handleRowClick} style={{ position: 'relative' }} ref={rowRef}>
      <td>
        <RowFit gap="6px">
          <SimpleTooltip text={t`Add to watchlist`}>
            <StarWithAnimation watched={isWatched} loading={loadingStar} onClick={handleWatchlistClick} />
          </SimpleTooltip>
          <Row gap="8px" style={{ position: 'relative', width: '24px', height: '24px' }}>
            <img
              alt="tokenInList"
              src={token.tokens[0].logo}
              width="24px"
              height="24px"
              style={{ borderRadius: '12px' }}
            />
            <Column gap="4px" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
              <Text style={{ textTransform: 'uppercase' }}>{token.symbol}</Text>{' '}
              <RowFit gap="6px" color={theme.text}>
                {token.tokens.map(item => {
                  if (item.chain === 'ethereum') return <Icon id="eth-mono" size={12} title="Ethereum" />
                  if (item.chain === 'bsc') return <Icon id="bnb-mono" size={12} title="Binance" />
                  if (item.chain === 'avalanche') return <Icon id="ava-mono" size={12} title="Avalanche" />
                  if (item.chain === 'polygon') return <Icon id="matic-mono" size={12} title="Polygon" />
                  if (item.chain === 'arbitrum') return <Icon id="arbitrum-mono" size={12} title="Arbitrum" />
                  if (item.chain === 'fantom') return <Icon id="fantom-mono" size={12} title="Fantom" />
                  if (item.chain === 'optimism') return <Icon id="optimism-mono" size={12} title="Optimism" />
                  return <></>
                })}
              </RowFit>
            </Column>
          </Row>
        </RowFit>
      </td>
      <td>
        <Column style={{ alignItems: 'center', width: '110px' }}>
          <SmallKyberScoreMeter data={latestKyberScore} tokenName={token.symbol} />
          <Text
            color={calculateValueToColor(latestKyberScore?.kyber_score || 0, theme)}
            fontSize="14px"
            fontWeight={500}
          >
            {latestKyberScore?.tag || t`Not Available`}
          </Text>
        </Column>
      </td>
      <td>
        <Column gap="4px" style={{ textAlign: 'left' }}>
          <Text color={theme.text} fontSize="14px" lineHeight="20px">
            ${formatTokenPrice(token.price)}
          </Text>
          <Text fontSize="10px" lineHeight="12px" color={token.percent_change_24h > 0 ? theme.primary : theme.red}>
            <Row gap="2px">
              <ChevronIcon
                rotate={token.percent_change_24h > 0 ? '180deg' : '0deg'}
                color={token.percent_change_24h > 0 ? theme.primary : theme.red}
              />
              {Math.abs(token.percent_change_24h).toFixed(2)}%
            </Row>
          </Text>
        </Column>
      </td>
      <td>
        <TokenChart data={token['7daysprice']} index={token.tokens[0].address} />
      </td>
      <td>
        <Row justifyContent="flex-end">
          <ButtonLight height="28px" width="75px" padding="4px 8px" onClick={handleSwapClick}>
            <RowFit gap="4px" fontSize="14px">
              <Icon id="swap" size={16} />
              Swap
            </RowFit>
          </ButtonLight>
        </Row>
      </td>
      {hasMutipleChain && (
        <>
          <MultipleChainDropdown
            ref={menuRef}
            show={showMenu}
            menuLeft={menuLeft}
            tokens={token?.tokens}
            onChainClick={(chain, address) => {
              onClick?.()
              navigate(`${APP_PATHS.KYBERAI_EXPLORE}/${chain}/${address}`)
            }}
          />
          <MultipleChainDropdown
            show={showSwapMenu}
            menuLeft={menuLeft}
            tokens={token?.tokens}
            onChainClick={handleSwapNavigateClick}
          />
        </>
      )}
    </tr>
  )
}
export const WidgetTable = ({
  data,
  isLoading,
  isError,
  onRowClick,
}: {
  data?: ITokenList[]
  isLoading: boolean
  isError: boolean
  onRowClick?: () => void
}) => {
  const theme = useTheme()
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'scroll' }}>
      <WidgetTableWrapper style={{ borderRadius: '0' }}>
        <colgroup>
          <col style={{ width: '220px' }} />
          <col style={{ width: '160px' }} />
          <col style={{ width: '200px' }} />
          <col style={{ width: '130px' }} />
          <col style={{ width: '80px' }} />
        </colgroup>
        <thead style={{ backgroundColor: theme.background }}>
          <th>
            <Trans>Token</Trans>
          </th>
          <th>
            <Trans>Kyberscore</Trans>
          </th>
          <th>
            <Trans>Price | 24 Change</Trans>
          </th>
          <th>
            <Trans>Last 7 days</Trans>
          </th>
          <th style={{ textAlign: 'right' }}>
            <Trans>Action</Trans>
          </th>
        </thead>
        {isLoading ? (
          <tbody>
            <SkeletonTheme
              baseColor={theme.border}
              height="32px"
              borderRadius="8px"
              direction="ltr"
              duration={1.5}
              highlightColor={theme.tabActive}
            >
              {[
                ...Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <tr key={index} style={{ backgroundColor: theme.tableHeader, height: '72px' }}>
                      <td>
                        <Skeleton></Skeleton>
                      </td>
                      <td>
                        <Skeleton></Skeleton>
                      </td>
                      <td>
                        <Skeleton></Skeleton>
                      </td>
                      <td>
                        <Skeleton></Skeleton>
                      </td>
                      <td>
                        <Skeleton></Skeleton>
                      </td>
                    </tr>
                  )),
              ]}
            </SkeletonTheme>
          </tbody>
        ) : isError ? (
          <>
            <tbody>
              <tr style={{ height: '300px' }}>
                <td colSpan={5}>
                  <Row align="center" justify="center" height="70%">
                    <Trans>There was an error. Please try again later.</Trans>
                  </Row>
                </td>
              </tr>
            </tbody>
          </>
        ) : (
          <tbody>
            {data?.map((token, i) => {
              return <WidgetTokenRow token={token} key={i} onClick={onRowClick} />
            })}
          </tbody>
        )}
      </WidgetTableWrapper>
    </div>
  )
}

export const LiveTradesInShareModalTable = ({ data }: { data: Array<ILiveTrade> }) => {
  const theme = useTheme()
  const { chain, address } = useParams()
  const { data: tokenOverview } = useTokenDetailQuery({
    chain,
    address,
  })

  return (
    <TableWrapper style={{ flex: 1 }}>
      <colgroup>
        <col />
        <col />
        <col />
        <col />
      </colgroup>
      <thead>
        <th>Date</th>
        <th>Address</th>
        <th>Price ($)</th>
        <th style={{ textAlign: 'right', padding: '6px' }}>Amount</th>
      </thead>
      <tbody>
        {data?.map((trade, i) => {
          const isBuy = trade.type === 'buy'
          return (
            <tr key={trade.txn} style={{ height: '64px' }}>
              <td>
                <Text fontSize={14}>{dayjs(trade.timestamp * 1000).format('DD/MM/YYYY')}</Text>
                <Text fontSize={12} color={theme.subText}>
                  {dayjs(trade.timestamp * 1000).format('HH:mm:ss A')}
                </Text>
              </td>
              <td>
                <Text fontSize={14}>{shortenAddress(1, trade.trader)}</Text>
              </td>
              <td>
                <Text fontSize={14}>${formatTokenPrice(trade.price)}</Text>
              </td>
              <td style={{ padding: '6px', textAlign: 'right' }}>
                <Row gap="4px">
                  <img src={tokenOverview?.logo} width="16px" height="16px" style={{ borderRadius: '8px' }} />
                  <Text fontSize={14} color={isBuy ? theme.primary : theme.red}>
                    {isBuy ? '+' : '-'} {formatLocaleStringNum(+trade.amountToken)} {tokenOverview?.symbol}
                  </Text>
                  {trade.price * +trade.amountToken > 100000 && (
                    <InfoHelper text={t`This transaction is higher than >$100k`} placement="top" />
                  )}
                </Row>
                <Text color={theme.subText} fontSize={12} textAlign="right">
                  ${formatLocaleStringNum(trade.price * +trade.amountToken)}{' '}
                </Text>
              </td>
            </tr>
          )
        })}
      </tbody>
    </TableWrapper>
  )
}
