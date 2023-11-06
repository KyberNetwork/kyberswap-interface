import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { useMemo } from 'react'
import { Trash } from 'react-feather'
import { useGetTokenApprovalQuery } from 'services/portfolio'

import { ButtonAction } from 'components/Button'
import { CheckCircle } from 'components/Icons'
import Row, { RowFit } from 'components/Row'
import Table, { TableColumn } from 'components/Table'
import { EMPTY_ARRAY } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { TokenCellWithWalletAddress } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/WalletInfo'
import { TokenAllowAnce } from 'pages/NotificationCenter/Portfolio/type'
import { Section } from 'pages/TrueSightV2/components'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'

const SpenderCell = ({ value, item }: { value: string; item: TokenAllowAnce }) => {
  return (
    <ExternalLink href={getEtherscanLink(item.chainId, value, 'address')}>
      {item['spenderName'] || getShortenAddress(value ?? '')}
    </ExternalLink>
  )
}

const ActionButton = ({ item: { tokenAddress, amount } }: { item: TokenAllowAnce }) => {
  const theme = useTheme()
  const onRevoke = () => {
    alert(tokenAddress)
  }
  return (
    <Row justify="flex-end">
      <ButtonAction
        disabled={!amount}
        onClick={onRevoke}
        style={{
          backgroundColor: rgba(theme.red, 0.2),
          color: theme.red,
          width: '32px',
          height: '32px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Trash size={14} />
      </ButtonAction>
    </Row>
  )
}

const columns: TableColumn[] = [
  {
    title: t`Asset`,
    dataIndex: 'token',
    align: 'left',
    render: ({ item }: { item: TokenAllowAnce }) => (
      <TokenCellWithWalletAddress item={{ ...item, logoUrl: item.logo, walletAddress: item.ownerAddress }} />
    ),
  },
  {
    title: t`Allowance`,
    dataIndex: 'amount',
    render: ({ value, item }) =>
      value.length > 3 * item.decimals // todo
        ? t`Unlimited`
        : formatDisplayNumber(uint256ToFraction(value, item.decimals), { style: 'decimal', significantDigits: 6 }), // todo uint256ToFraction
  },
  {
    title: t`Authorized Spender`,
    dataIndex: 'spenderAddress',
    render: SpenderCell,
  },
  {
    title: t`Last Updated`,
    dataIndex: 'lastUpdateTimestamp',
    render: ({ value }) => dayjs(+value * 1000).format('DD/MM/YYYY HH:mm:ss'),
  },
  {
    title: t`Revoke`,
    align: 'right',
    dataIndex: 'spenderAddress',
    render: ActionButton,
  },
]

export default function Allowances({ wallet }: { wallet: string }) {
  const { data } = useGetTokenApprovalQuery({ address: wallet }, { skip: !wallet })
  const theme = useTheme()
  const formatData = useMemo(() => {
    if (!data) return EMPTY_ARRAY
    return data.approvals
  }, [data])

  return (
    <Section
      title={
        <RowFit gap="4px" color={theme.subText} alignItems={'center'}>
          <CheckCircle size="14px" />
          <Trans>Token Allowances</Trans>
        </RowFit>
      }
    >
      <Table columns={columns} data={formatData} totalItems={formatData.length} />
    </Section>
  )
}
