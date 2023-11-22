import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import { useGetChainsAllocationQuery, useGetTokenAllocationQuery } from 'services/portfolio'
import styled from 'styled-components'

import { ReactComponent as LiquidityIcon } from 'assets/svg/liquidity_icon.svg'
import { ButtonAction } from 'components/Button'
import { DataEntry } from 'components/EarningPieChart'
import Icon from 'components/Icons/Icon'
import LocalLoader from 'components/LocalLoader'
import { NetworkLogo, TokenLogoWithChain } from 'components/Logo'
import Row from 'components/Row'
import Table, { TableColumn } from 'components/Table'
import { EMPTY_ARRAY } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTheme from 'hooks/useTheme'
import { TokenAllocationChart } from 'pages/MyEarnings/EarningsBreakdownPanel'
import { PortfolioSection } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/styled'
import { PortfolioChainBalance, PortfolioWalletBalance } from 'pages/NotificationCenter/Portfolio/type'
import { ExternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export const LiquidityScore = () => {
  const theme = useTheme()
  return (
    <Flex alignItems={'center'} justifyContent={'center'} sx={{ gap: '6px' }} color={theme.primary}>
      <LiquidityIcon />
      <Trans>High Liquidity</Trans>
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
  { title: t`Token`, dataIndex: 'token', align: 'left', render: TokenCell },
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
  },
  {
    title: t`Balance`,
    dataIndex: 'amount',
    render: ({ value }) => formatDisplayNumber(value, { style: 'decimal', significantDigits: 6 }),
  },
  {
    title: t`Value`,
    dataIndex: 'valueUsd',
    render: ({ value }) => formatDisplayNumber(value, { style: 'currency', fractionDigits: 2 }),
  },
  {
    title: t`Asset Ratio`,
    align: 'right',
    dataIndex: 'percent',
    render: ({ value }) => formatDisplayNumber(value, { style: 'percent', fractionDigits: 2 }),
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
  { title: t`Token`, dataIndex: 'token', align: 'left', render: ChainCell },
  {
    title: t`Value`,
    dataIndex: 'valueUsd',
    render: ({ value }) => formatDisplayNumber(value, { style: 'currency', fractionDigits: 2 }),
  },
  {
    title: t`Asset Ratio`,
    align: 'right',
    dataIndex: 'percent',
    render: ({ value }) => formatDisplayNumber(value, { style: 'percent', fractionDigits: 2 }),
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
  TOKEN = `Token Allocation`,
  CHAIN = `Chain Allocation`,
  LIQUIDITY_SCORE = `Liquidity Score Ratio`,
}

export default function TokenAllocation({
  walletAddresses,
  chainIds,
}: {
  walletAddresses: string[]
  chainIds: ChainId[]
}) {
  const [tab, setTab] = useState<string>(AllocationTab.TOKEN)
  const isTokenTab = tab === AllocationTab.TOKEN
  const { data: dataTokens, isFetching: isFetchingTokens } = useGetTokenAllocationQuery(
    { walletAddresses, chainIds },
    { skip: !walletAddresses.length || !isTokenTab, refetchOnMountOrArgChange: true },
  )
  const { data: dataChains, isFetching: isFetchingChain } = useGetChainsAllocationQuery(
    { walletAddresses, chainIds },
    { skip: !walletAddresses.length, refetchOnMountOrArgChange: true },
  )
  const isFetching = useShowLoadingAtLeastTime(isFetchingTokens || isFetchingChain, 500)
  const data = isTokenTab ? dataTokens : dataChains

  const formatData: DataEntry[] = useMemo(() => {
    const data = isTokenTab ? dataTokens : dataChains
    if (!data?.balances?.length) return EMPTY_ARRAY
    if (isTokenTab) {
      const balances = dataTokens?.balances || EMPTY_ARRAY
      return balances?.map(el => {
        return {
          ...el,
          percent: +el.percentage,
          value: el.valueUsd,
          symbol: el.tokenSymbol,
          logoUrl: el.tokenLogo,
        }
      })
    }
    const balances: PortfolioChainBalance[] = dataChains?.balances || EMPTY_ARRAY
    return balances?.map(el => {
      return {
        ...el,
        percent: +el.percentage,
        value: el.valueUsd,
        symbol: NETWORKS_INFO[el.chainId].name,
        logoUrl: NETWORKS_INFO[el.chainId].icon,
      }
    })
  }, [dataTokens, dataChains, isTokenTab])

  return (
    <PortfolioSection
      tabs={[
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
      ]}
      activeTab={tab}
      onTabClick={setTab}
      actions={
        <ButtonAction>
          <Icon id="share" size={14} />
        </ButtonAction>
      }
    >
      <Content>
        <TokenAllocationChart
          {...{
            style: { background: 'transparent', minWidth: 380 },
            data: formatData,
            isLoading: isFetching,
            horizontalLayout: false,
            numberOfTokens: formatData.length,
            totalUsd: data?.totalUsd || 0,
            border: false,
            // column: 2,
          }}
        />
        {isFetching ? (
          <LocalLoader />
        ) : (
          <Table
            data={formatData}
            columns={(isTokenTab ? columns : columnsChains) as any} // todo
            style={{ flex: 1 }}
            totalItems={formatData.length}
            pageSize={6}
            pagination={{ hideWhenSinglePage: true }}
          /> // todo
        )}
      </Content>
    </PortfolioSection>
  )
}
