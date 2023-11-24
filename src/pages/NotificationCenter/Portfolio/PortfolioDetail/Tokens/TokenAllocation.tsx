import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetChainsAllocationQuery, useGetTokenAllocationQuery } from 'services/portfolio'
import styled from 'styled-components'

import { ReactComponent as LiquidityIcon } from 'assets/svg/liquidity_icon.svg'
import { DataEntry } from 'components/EarningPieChart'
import LocalLoader from 'components/LocalLoader'
import { NetworkLogo, TokenLogoWithChain } from 'components/Logo'
import Row from 'components/Row'
import Table, { TableColumn } from 'components/Table'
import { EMPTY_ARRAY } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTheme from 'hooks/useTheme'
import { TokenAllocationChart } from 'pages/MyEarnings/EarningsBreakdownPanel'
import useFilterBalances from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/useFilterBalances'
import { PortfolioSection } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/styled'
import { PORTFOLIO_POLLING_INTERVAL } from 'pages/NotificationCenter/Portfolio/const'
import { PortfolioChainBalance, PortfolioWalletBalance } from 'pages/NotificationCenter/Portfolio/type'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export const LiquidityScore = () => {
  const theme = useTheme()
  return (
    <Flex
      alignItems={'center'}
      justifyContent={'center'}
      sx={{ gap: '6px', whiteSpace: 'nowrap' }}
      color={theme.primary}
    >
      <LiquidityIcon />
      <Trans>Test Test</Trans>
    </Flex>
  )
}

const TokenCell = ({ item }: { item: PortfolioWalletBalance }) => {
  const theme = useTheme()
  return (
    <Row gap="8px">
      <TokenLogoWithChain chainId={item.chainId} size={'24px'} tokenLogo={item.tokenLogo} />
      <Text fontSize={'14px'} fontWeight={'500'} color={theme.text}>
        {item.tokenSymbol}
      </Text>
    </Row>
  )
}

const columns: TableColumn<PortfolioWalletBalance>[] = [
  { title: t`Token`, dataIndex: 'token', align: 'left', render: TokenCell, sticky: true },
  {
    title: t`Liquidity Score`,
    tooltip: (
      <Trans>
        Liquidity Score of a token refers to how easily that token can be bought or sold in the market without
        significantly impacting its price. Read more <ExternalLink href="/todo">here ↗</ExternalLink>
      </Trans>
    ),
    dataIndex: 'test',
    render: LiquidityScore,
    style: isMobile ? { width: 120 } : undefined,
  },
  {
    title: t`Balance`,
    dataIndex: 'amount',
    render: ({ value }) => formatDisplayNumber(value, { style: 'decimal', significantDigits: 6 }),
    style: isMobile ? { width: 100 } : undefined,
  },
  {
    title: t`Value`,
    dataIndex: 'valueUsd',
    render: ({ value }) => formatDisplayNumber(value, { style: 'currency', fractionDigits: 2 }),
    style: isMobile ? { width: 100 } : undefined,
  },
  {
    title: t`Asset Ratio`,
    align: 'right',
    dataIndex: 'percentage',
    render: ({ value }) => formatDisplayNumber(value / 100, { style: 'percent', fractionDigits: 2 }),
    style: isMobile ? { width: 80 } : undefined,
  },
]

const ChainCell = ({ item: { chainId } }: { item: PortfolioChainBalance }) => {
  const theme = useTheme()
  return (
    <Row gap="8px">
      <NetworkLogo chainId={chainId} style={{ width: '24px' }} />
      <Text fontSize={'14px'} fontWeight={'500'} color={theme.text}>
        {NETWORKS_INFO[chainId].name}
      </Text>
    </Row>
  )
}
const columnsChains: TableColumn<PortfolioChainBalance>[] = [
  { title: t`Chain`, dataIndex: 'token', align: 'left', render: ChainCell, sticky: true },
  {
    title: t`Value`,
    dataIndex: 'valueUsd',
    render: ({ value }) => formatDisplayNumber(value, { style: 'currency', fractionDigits: 2 }),
    style: isMobile ? { width: 100 } : undefined,
  },
  {
    title: t`Asset Ratio`,
    align: 'right',
    dataIndex: 'percentage',
    render: ({ value }) => formatDisplayNumber(value / 100, { style: 'percent', fractionDigits: 2 }),
    style: isMobile ? { width: 80 } : undefined,
  },
]

const Content = styled(Row)`
  gap: 16px;
  align-items: flex-start;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: center;
  `}
`

enum AllocationTab {
  TOKEN = `Token Distribution`,
  CHAIN = `Chain Distribution`,
  LIQUIDITY_SCORE = `Liquidity Score Ratio`,
}

const tabs = [
  {
    title: AllocationTab.TOKEN,
    type: AllocationTab.TOKEN,
  },
  {
    title: AllocationTab.CHAIN,
    type: AllocationTab.CHAIN,
  },
  // {
  //   title: AllocationTab.LIQUIDITY_SCORE,
  //   type: AllocationTab.LIQUIDITY_SCORE,
  // },
]

export default function TokenAllocation({
  walletAddresses,
  chainIds,
}: {
  walletAddresses: string[]
  chainIds: ChainId[]
}) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const [tab, setTab] = useState<string>(AllocationTab.TOKEN)
  const isTokenTab = tab === AllocationTab.TOKEN

  const {
    data: dataTokens,
    isLoading: isLoadingTokens,
    isFetching: isFetchingTokens,
  } = useGetTokenAllocationQuery(
    { walletAddresses, chainIds },
    {
      skip: !walletAddresses.length || !isTokenTab,
      refetchOnMountOrArgChange: true,
      pollingInterval: PORTFOLIO_POLLING_INTERVAL,
    },
  )
  const {
    data: dataChains,
    isLoading: isLoadingChain,
    isFetching: isFetchingchains,
  } = useGetChainsAllocationQuery(
    { walletAddresses, chainIds },
    {
      skip: !walletAddresses.length || tab !== AllocationTab.CHAIN,
      refetchOnMountOrArgChange: true,
      pollingInterval: PORTFOLIO_POLLING_INTERVAL,
    },
  )

  const isLoading = useShowLoadingAtLeastTime(isLoadingTokens || isLoadingChain, 400)
  const isFetching = useShowLoadingAtLeastTime(isFetchingTokens || isFetchingchains, 400)

  const data = isTokenTab ? dataTokens : dataChains

  const filterBalance = useFilterBalances()

  const { chartData, tableData }: { chartData: DataEntry[]; tableData: DataEntry[] } = useMemo(() => {
    return filterBalance(data?.balances || EMPTY_ARRAY)
  }, [data, filterBalance])

  return (
    <PortfolioSection
      tabs={tabs}
      activeTab={tab}
      onTabClick={setTab}
      contentStyle={upToSmall ? { padding: 0 } : undefined}
    >
      <Content>
        <TokenAllocationChart
          {...{
            style: { background: 'transparent', minWidth: 380 },
            data: chartData,
            isLoading: isFetching,
            horizontalLayout: upToSmall,
            numberOfTokens: chartData.length,
            totalUsd: data?.totalUsd || 0,
            border: false,
          }}
        />
        {isLoading ? (
          <LocalLoader />
        ) : (
          <Table
            data={tableData}
            columns={(isTokenTab ? columns : columnsChains) as any} // todo
            style={{ flex: 1, overflowX: 'auto', width: '100%' }}
            totalItems={tableData.length}
            pageSize={6}
            pagination={{ hideWhenSinglePage: true }}
          /> // todo
        )}
      </Content>
    </PortfolioSection>
  )
}
