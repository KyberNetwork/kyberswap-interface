import { Trans, t } from '@lingui/macro'
import { Text } from 'rebass'

import Row from 'components/Row'
import Table, { TableColumn } from 'components/Table'
import useTheme from 'hooks/useTheme'
import { TokenAllocationChart } from 'pages/MyEarnings/EarningsBreakdownPanel'
import { Section } from 'pages/TrueSightV2/components'

const columns: TableColumn[] = [
  { title: t`Token`, dataIndex: 'token', align: 'left' },
  { title: t`Liquidity Score`, tooltip: t`todo`, dataIndex: 'token' },
  { title: t`Balance`, dataIndex: 'balance' },
  { title: t`Value`, dataIndex: 'token' },
  { title: t`Asset Ratio`, align: 'right', dataIndex: 'token', render: () => 'test' },
]
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
          {...{ data: [], isLoading: false, horizontalLayout: false, numberOfTokens: 14, totalUsd: 0, border: false }}
        />
        <Table data={new Array(10).fill({ token: 123, balance: 111 })} columns={columns} style={{ flex: 1 }} />
      </Row>
    </Section>
  ) // todo update SectionWrapper can reuse
}
