import { Trans, t } from '@lingui/macro'

import Wallet from 'components/Icons/Wallet'
import { RowFit } from 'components/Row'
import Table, { TableColumn } from 'components/Table'
import useTheme from 'hooks/useTheme'
import { Section } from 'pages/TrueSightV2/components'

const columns: TableColumn[] = [
  { title: t`Token`, dataIndex: 'token', align: 'left' },
  { title: t`Amount`, tooltip: t`todo`, dataIndex: 'token' },
  { title: t`Price`, dataIndex: 'balance' },
  { title: t`Real Value`, dataIndex: 'token' },
  { title: t`Liquidity Score`, align: 'right', dataIndex: 'token', render: () => 'test' },
  { title: t`24H Volatility Score`, align: 'right', dataIndex: 'token', render: () => 'test' },
  { title: t`KyberScore`, align: 'right', dataIndex: 'token', render: () => 'test' },
  { title: t`Action`, align: 'right', dataIndex: 'token', render: () => 'test' },
]
export default function WalletInfo() {
  const theme = useTheme()
  return (
    <Section
      title={
        <RowFit gap="4px" color={theme.subText}>
          <Wallet />
          <Trans>Wallet</Trans>
        </RowFit>
      }
    >
      <Table data={new Array(10).fill({ token: 123, balance: 111 })} columns={columns} style={{ flex: 1 }} />
    </Section>
  ) // todo update SectionWrapper can reuse
}
