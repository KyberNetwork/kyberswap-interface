import { Trans, t } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import { ReactComponent as LiquidityIcon } from 'assets/svg/liquidity_icon.svg'
import { TokenLogoWithChain } from 'components/Logo'
import Row from 'components/Row'
import Table, { TableColumn } from 'components/Table'
import useTheme from 'hooks/useTheme'
import { TokenAllocationChart } from 'pages/MyEarnings/EarningsBreakdownPanel'
import { Section } from 'pages/TrueSightV2/components'
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

const TokenCell = () => {
  return (
    <TokenLogoWithChain
      chainId={1}
      size={'24px'}
      tokenLogo="https://storage.googleapis.com/ks-setting-1d682dca/061620bb-15ab-4877-ae14-ea615e07a5291697781498049.png"
    />
  )
}

const columns: TableColumn[] = [
  { title: t`Token`, dataIndex: 'token', align: 'left', render: TokenCell },
  {
    title: t`Liquidity Score`,
    tooltip: (
      <Trans>
        Liquidity Score of a token refers to how easily that token can be bought or sold in the market without
        significantly impacting its price. Read more <ExternalLink href="/todo">here ↗</ExternalLink>
      </Trans>
    ),
    dataIndex: 'token',
    render: LiquidityScore,
  },
  {
    title: t`Balance`,
    dataIndex: 'balance',
    render: value => formatDisplayNumber(value, { style: 'currency', significantDigits: 6 }),
  },
  {
    title: t`Value`,
    dataIndex: 'token',
    render: value => formatDisplayNumber(value, { style: 'decimal', fractionDigits: 2 }),
  },
  {
    title: t`Asset Ratio`,
    align: 'right',
    dataIndex: 'token',
    render: value => formatDisplayNumber(value, { style: 'percent', fractionDigits: 2 }),
  },
]

const data = new Array(10).fill({ token: 123, balance: 111 })
export default function TokenAllocation() {
  const theme = useTheme()
  return (
    <Section
      title={
        <Text color={theme.subText}>
          <Trans>Token Allocation</Trans>
        </Text>
      }
    >
      <Row gap="16px" align="flex-start">
        <TokenAllocationChart
          style={{ background: 'transparent' }}
          {...{ data: [], isLoading: false, horizontalLayout: false, numberOfTokens: 14, totalUsd: 0, border: false }}
        />
        <Table data={data} columns={columns} style={{ flex: 1 }} totalItems={12} pageSize={6} />
      </Row>
    </Section>
  ) // todo update SectionWrapper can reuse
}
