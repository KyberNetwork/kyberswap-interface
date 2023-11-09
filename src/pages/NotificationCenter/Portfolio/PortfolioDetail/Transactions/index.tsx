import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useState } from 'react'
import { ExternalLink as ExternalLinkIcon, FileText } from 'react-feather'
import { Text } from 'rebass'
import { useGetTransactionsQuery } from 'services/portfolio'

import Column from 'components/Column'
import Row, { RowFit } from 'components/Row'
import SearchInput from 'components/SearchInput'
import Table, { TableColumn } from 'components/Table'
import { EMPTY_ARRAY } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import { TokenCellWithWalletAddress } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/WalletInfo'
import { TransactionHistory } from 'pages/NotificationCenter/Portfolio/type'
import { Section } from 'pages/TrueSightV2/components'
import { ExternalLink } from 'theme'
import { getEtherscanLink, isAddress } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'

const TxsHashCell = ({ item: { txHash, blockTime, chain } }: { item: TransactionHistory }) => {
  const theme = useTheme()
  return (
    <Column gap="4px" alignItems={'center'}>
      <ExternalLink href={getEtherscanLink(chain?.chainId, txHash, 'transaction')}>
        <Row alignItems={'center'} gap="4px">
          {getShortenAddress(txHash)} <ExternalLinkIcon size={14} />
        </Row>
      </ExternalLink>
      <Text color={theme.subText} fontSize={'12px'} fontWeight={'500'}>
        {dayjs(blockTime * 1000).format('DD/MM/YYYY HH:mm')}
      </Text>
    </Column>
  )
}

const GasFeeCell = ({ item: { gasPrice, chain, nativeTokenPrice, gasUsed } }: { item: TransactionHistory }) => {
  if (gasPrice === '0') return null
  const native = NativeCurrencies[chain?.chainId as ChainId]
  const totalGas = uint256ToFraction(gasPrice, native.decimals).multiply(gasUsed) // todo
  const usdValue = +totalGas.toSignificant(native.decimals) * nativeTokenPrice
  return (
    <>
      {totalGas.toSignificant(6)} {native.symbol} (
      {formatDisplayNumber(usdValue, { style: 'currency', fractionDigits: 2 })})
    </>
  )
}

const getAction = ({ contractInteraction, tokenTransfers = [], tokenApproval, to }: TransactionHistory) => {
  const methodName = contractInteraction?.methodName
  switch (methodName) {
    case 'approve':
      return { type: tokenApproval?.amount === '0' ? t`Revoke` : t`Approve`, contract: tokenApproval?.spenderAddress }
  }
  if (tokenTransfers.length > 1) return { type: t`Contract Interaction`, contract: to }
  if (tokenTransfers?.[0]) return { type: t`Receive`, contract: tokenTransfers[0].otherAddress }
  return { type: methodName }
}
const InteractionCell = ({ item }: { item: TransactionHistory }) => {
  const { type, contract = '' } = getAction(item)
  const { chain } = item
  return (
    <Column gap="4px">
      <Text sx={{ textTransform: 'capitalize' }}>{type}</Text>
      <ExternalLink href={getEtherscanLink(chain.chainId, contract, 'address')}>
        {getShortenAddress(contract)}
      </ExternalLink>
    </Column>
  )
}

const columns: TableColumn<TransactionHistory>[] = [
  {
    title: t`Transaction`,
    dataIndex: 'token',
    align: 'left',
    render: ({ item: { walletAddress, chain = {} } }) => (
      <TokenCellWithWalletAddress
        item={{ walletAddress, chainId: chain.chainId as ChainId, logoUrl: '', symbol: '' }}
      />
    ),
  },
  {
    title: t`Txs Hash`,
    dataIndex: 'txHash',
    render: TxsHashCell,
  },
  {
    title: t`Balance`,
    dataIndex: 'amount',
    render: ({}) => 123, //formatDisplayNumber(uint256ToFraction(value, item.decimals), { style: 'decimal', significantDigits: 6 }), // todo uint256ToFraction
  },
  {
    title: t`Interaction`,
    render: InteractionCell,
  },
  {
    title: t`Txs Fee`,
    render: GasFeeCell,
  },
]

const pageSize = 20
export default function Transactions({ chainIds, wallet }: { chainIds: ChainId[]; wallet: string }) {
  const theme = useTheme()
  const [search, setSearch] = useState('')
  const searchDebounce = useDebounce(search, 500)

  const isAddressSearch = searchDebounce && isAddress(ChainId.MAINNET, searchDebounce)
  const query = searchDebounce ? { [isAddressSearch ? 'tokenAddress' : 'tokenSymbol']: searchDebounce } : {}
  const { data } = useGetTransactionsQuery({
    chainIds,
    limit: pageSize,
    walletAddress: wallet,
    endTime: 0,
    ...query,
  })

  return (
    <Section
      title={
        <RowFit gap="4px" color={theme.subText}>
          <FileText size={16} />
          <Trans>Transactions</Trans>
        </RowFit>
      }
      actions={
        <SearchInput
          onChange={setSearch}
          value={search}
          placeholder={t`Search by token symbol or token address`}
          style={{
            width: 330,
            height: 32,
            backgroundColor: theme.buttonBlack,
            border: `1px solid ${theme.buttonGray}`,
          }}
        />
      }
    >
      <Table
        data={data?.data || EMPTY_ARRAY}
        columns={columns}
        style={{ flex: 1, marginLeft: '-16px', marginRight: '-16px' }}
        pageSize={pageSize}
        totalItems={pageSize}
      />
    </Section>
  )
}
