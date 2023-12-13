import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { useGetChainsAllocationQuery, useGetTokenAllocationQuery } from 'services/portfolio'
import styled, { css } from 'styled-components'

import { ReactComponent as LiquidityIcon } from 'assets/svg/liquidity_icon.svg'
import { DataEntry } from 'components/EarningPieChart'
import LocalLoader from 'components/LocalLoader'
import { NetworkLogo, TokenLogoWithChain } from 'components/Logo'
import Row from 'components/Row'
import Section from 'components/Section'
import Table, { TableColumn } from 'components/Table'
import { EMPTY_ARRAY } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTheme from 'hooks/useTheme'
import { TokenAllocationChart } from 'pages/MyEarnings/EarningsBreakdownPanel'
import useFilterBalances from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/useFilterBalances'
import { SECTION_STYLE } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/styled'
import { PORTFOLIO_POLLING_INTERVAL } from 'pages/NotificationCenter/Portfolio/const'
import { PortfolioChainBalance, PortfolioWalletBalance } from 'pages/NotificationCenter/Portfolio/type'
import { formatDisplayNumber } from 'utils/numbers'
import { isInEnum } from 'utils/string'
import { getProxyTokenLogo } from 'utils/tokenInfo'

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

const TokenCell = ({ item, shareMode }: { item: PortfolioWalletBalance; shareMode: boolean }) => {
  const theme = useTheme()
  return (
    <Row gap="8px">
      <TokenLogoWithChain
        chainId={item.chainId}
        size={'24px'}
        tokenLogo={shareMode ? getProxyTokenLogo(item.tokenLogo) : item.tokenLogo}
      />
      <Text fontSize={'14px'} fontWeight={'500'} color={theme.text}>
        {item.tokenSymbol}
      </Text>
    </Row>
  )
}

const getTokenColumns = (mobile: boolean, shareMode: boolean) => {
  const sticky = !shareMode && mobile
  const columnsTokens: TableColumn<PortfolioWalletBalance>[] = [
    {
      title: t`Token`,
      dataIndex: 'token',
      align: 'left',
      render: props => <TokenCell shareMode={shareMode} {...props} />,
      sticky,
    },
    // {
    //   title: t`Liquidity Score`,
    //   tooltip: (
    //     <Trans>
    //       Liquidity Score of a token refers to how easily that token can be bought or sold in the market without
    //       significantly impacting its price. Read more <ExternalLink href="/todo">here ↗</ExternalLink>
    //     </Trans>
    //   ),
    //   dataIndex: 'test',
    //   render: LiquidityScore,
    //   style: isMobile ? { width: 120 } : undefined,
    // },
    {
      title: t`Amount`,
      dataIndex: 'amount',
      render: ({ value }) => formatDisplayNumber(value, { style: 'decimal', significantDigits: 6 }),
      style: sticky ? { width: 100 } : undefined,
      align: 'left',
    },
    {
      title: t`Value`,
      dataIndex: 'valueUsd',
      render: ({ value }) => formatDisplayNumber(value, { style: 'currency', fractionDigits: 2 }),
      style: sticky ? { width: 100 } : undefined,
      align: 'left',
    },
    {
      title: shareMode ? t`Asset` : t`Asset Ratio`,
      align: 'right',
      dataIndex: 'percentage',
      render: ({ value }) =>
        value === '0' ? '<0.01%' : formatDisplayNumber(value / 100, { style: 'percent', fractionDigits: 2 }),
      style: sticky ? { width: 80 } : undefined,
    },
  ]
  const fieldShareMode = ['token', 'percentage', 'valueUsd']
  return shareMode ? columnsTokens.filter(el => fieldShareMode.includes(el.dataIndex)) : columnsTokens
}

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

const getChainColumns = (mobile: boolean, shareMode: boolean) => {
  const sticky = !shareMode && mobile
  const columnsChains: TableColumn<PortfolioChainBalance>[] = [
    { title: t`Chain`, dataIndex: 'token', align: 'left', render: ChainCell, sticky },
    {
      title: t`Value`,
      dataIndex: 'valueUsd',
      render: ({ value }) => formatDisplayNumber(value, { style: 'currency', fractionDigits: 2 }),
      style: sticky ? { width: 100 } : undefined,
    },
    {
      title: shareMode ? t`Asset` : t`Asset Ratio`,
      align: 'right',
      dataIndex: 'percentage',
      render: ({ value }) =>
        value === '0' ? '<0.01%' : formatDisplayNumber(value / 100, { style: 'percent', fractionDigits: 2 }),
      style: sticky ? { width: 80 } : undefined,
    },
  ]
  return columnsChains
}

const Content = styled(Row)<{ mobile: boolean }>`
  gap: 16px;
  align-items: flex-start;
  ${({ mobile }) =>
    mobile &&
    css`
      flex-direction: column;
      align-items: center;
    `}
`

export enum AllocationTab {
  TOKEN = `token`,
  CHAIN = `chain`,
  // LIQUIDITY_SCORE = `liquidity-score`,
}

const getMapTitle = () => ({
  [AllocationTab.TOKEN]: t`Token Distribution`,
  [AllocationTab.CHAIN]: t`Chain Distribution`,
  // [AllocationTab.LIQUIDITY_SCORE]: t`Liquidity Score`,
})

const tabs = Object.keys(getMapTitle()).map(key => ({ title: getMapTitle()[key], type: key }))

export default function TokenAllocation({
  walletAddresses,
  chainIds,
  shareMode,
  mobile,
  defaultTab,
  totalUsd,
  isAllChain,
}: {
  walletAddresses: string[]
  chainIds: ChainId[]
  shareMode?: boolean
  mobile?: boolean
  defaultTab?: AllocationTab
  totalUsd: number
  isAllChain: boolean
}) {
  const [params, setParams] = useSearchParams()
  const type = params.get('type') || AllocationTab.TOKEN
  const [tab, setTab] = useState<AllocationTab>(
    defaultTab || (isInEnum(type, AllocationTab) ? type : AllocationTab.TOKEN),
  )
  const isTokenTab = tab === AllocationTab.TOKEN

  const onChangeTab = useCallback(
    (tab: AllocationTab) => {
      setTab(tab)
      params.set('type', tab)
      setParams(params)
    },
    [setParams, params],
  )

  const {
    data: dataTokens,
    isLoading: isLoadingTokens,
    isFetching: isFetchingTokens,
  } = useGetTokenAllocationQuery(
    { walletAddresses, chainIds },
    {
      skip: !walletAddresses.length || !isTokenTab,
      refetchOnMountOrArgChange: !shareMode,
      pollingInterval: shareMode ? undefined : PORTFOLIO_POLLING_INTERVAL,
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
      refetchOnMountOrArgChange: !shareMode,
      pollingInterval: shareMode ? undefined : PORTFOLIO_POLLING_INTERVAL,
    },
  )

  const isLoading = useShowLoadingAtLeastTime(isLoadingTokens || isLoadingChain, 400)
  const isFetching = useShowLoadingAtLeastTime(isFetchingTokens || isFetchingchains, 400)

  const data = isTokenTab ? dataTokens : dataChains

  const filterBalance = useFilterBalances()

  const { chartData, tableData }: { chartData: DataEntry[]; tableData: DataEntry[] } = useMemo(() => {
    return filterBalance(data?.balances || EMPTY_ARRAY)
  }, [data, filterBalance])

  const tableColumns = useMemo(() => {
    return isTokenTab ? getTokenColumns(!!mobile, !!shareMode) : getChainColumns(!!mobile, !!shareMode)
  }, [isTokenTab, shareMode, mobile])

  const sectionProps = shareMode
    ? {
        title: getMapTitle()[tab],
        style: mobile
          ? { width: '100%', flex: 1, background: 'transparent', border: 'none' }
          : { width: '100%', flex: 1 },
        showHeader: !mobile,
      }
    : {
        tabs,
        activeTab: tab,
        onTabClick: onChangeTab,
        style: SECTION_STYLE,
      }
  return (
    <Section<AllocationTab> {...sectionProps} contentStyle={mobile ? { padding: 0 } : undefined}>
      <Content mobile={!!mobile}>
        <TokenAllocationChart
          {...{
            style: { background: 'transparent', minWidth: 380 },
            data: chartData,
            isLoading: isFetching,
            horizontalLayout: mobile,
            numberOfTokens: chartData.length,
            totalUsd: (isAllChain ? totalUsd : data?.totalUsd) || 0,
            border: false,
            shareMode,
          }}
        />
        {isLoading ? (
          <LocalLoader />
        ) : (
          <Table
            data={tableData}
            columns={tableColumns as any} // todo
            style={{ flex: 1, overflowX: 'auto', width: '100%', background: mobile ? undefined : 'transparent' }}
            totalItems={tableData.length}
            pageSize={6}
            pagination={{ hideWhenSinglePage: true, show: !shareMode }}
          />
        )}
      </Content>
    </Section>
  )
}
