import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useState } from 'react'
import { ExternalLink as ExternalLinkIcon, FileText } from 'react-feather'
import { Text } from 'rebass'
import { useGetTransactionsQuery } from 'services/portfolio'

import DefaultAvatar from 'assets/images/default_avatar.png'
import { ReactComponent as NftIcon } from 'assets/svg/nft_icon.svg'
import Badge, { BadgeVariant } from 'components/Badge'
import Column from 'components/Column'
import LocalLoader from 'components/LocalLoader'
import Logo from 'components/Logo'
import Row, { RowFit } from 'components/Row'
import SearchInput from 'components/SearchInput'
import Table, { TableColumn } from 'components/Table'
import { EMPTY_ARRAY } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import { TokenCellWithWalletAddress } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/WalletInfo'
import { formatAllowance } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/helpers'
import { TransactionHistory } from 'pages/NotificationCenter/Portfolio/type'
import { Section } from 'pages/TrueSightV2/components'
import { ExternalLink } from 'theme'
import { getEtherscanLink, isAddress } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'

const getTxsAction = ({
  contractInteraction = { methodName: '', contractName: '' },
  tokenTransfers = [],
  tokenApproval,
  to,
}: TransactionHistory) => {
  const { contractName, methodName } = contractInteraction
  switch (methodName) {
    case 'approve':
      return {
        type: tokenApproval?.amount === '0' ? t`Revoke` : t`Approve`,
        contract: tokenApproval?.spenderAddress,
        contractName,
      }
  }
  if (tokenTransfers.length > 1) return { type: methodName || t`Contract Interaction`, contract: to, contractName }
  if (tokenTransfers?.[0]) return { type: t`Receive`, contract: tokenTransfers[0].otherAddress, contractName }
  return { type: methodName, contractName }
}

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

const InteractionCell = ({ item }: { item: TransactionHistory }) => {
  const { contract = '', contractName } = getTxsAction(item)
  const { chain, tag } = item
  return (
    <Column gap="4px" alignItems={'center'}>
      <ExternalLink href={getEtherscanLink(chain.chainId, contract, 'address')}>
        {contractName || getShortenAddress(contract)}
      </ExternalLink>
      {tag === 'SCAM' && (
        <Badge variant={BadgeVariant.WARNING} style={{ width: 'fit-content', fontSize: 12 }}>
          <Trans>Spam tx</Trans>
        </Badge>
      )}
    </Column>
  )
}

const BalanceCell = ({ item: { tokenTransfers = [], tokenApproval, status } }: { item: TransactionHistory }) => {
  const logoStyle = { width: '20px', minWidth: '20px', height: '20px', borderRadius: '4px' }
  const theme = useTheme()
  return (
    <Column gap="6px">
      {status === 'failed' ? (
        <Badge variant={BadgeVariant.NEGATIVE} style={{ width: 'fit-content', fontSize: '14px' }}>
          <Trans>Failed</Trans>
        </Badge>
      ) : tokenApproval ? (
        <Row gap="4px">
          <Logo srcs={[tokenApproval.token.logo]} style={logoStyle} />{' '}
          {formatAllowance(tokenApproval.amount, tokenApproval.token.decimals)} {tokenApproval?.token?.symbol}
        </Row>
      ) : (
        tokenTransfers.map(({ token, historicalValueInUsd, amount }, i) => (
          <Row gap="4px" key={i}>
            {token.nftTokenId ? (
              <NftIcon style={{ width: '18px', minWidth: '18px', height: '18px' }} />
            ) : (
              <Logo srcs={[token.logo]} style={logoStyle} />
            )}
            {!amount.startsWith('-') && '+'}
            {formatDisplayNumber(uint256ToFraction(amount, token.decimals), {
              // todo
              style: 'decimal',
              fractionDigits: 4,
              allowDisplayNegative: true,
            })}{' '}
            {token.symbol}{' '}
            {historicalValueInUsd ? (
              <Text as="span" color={theme.subText}>
                (
                {formatDisplayNumber(historicalValueInUsd, {
                  style: 'currency',
                  fractionDigits: 6,
                  allowDisplayNegative: true,
                })}
                )
              </Text>
            ) : null}
          </Row>
        ))
      )}
    </Column>
  )
}

const columns: TableColumn<TransactionHistory>[] = [
  {
    title: t`Transaction`,
    dataIndex: 'token',
    align: 'left',
    render: ({ item }) => {
      const { walletAddress, chain } = item
      return (
        <TokenCellWithWalletAddress
          item={{
            walletAddress,
            chainId: chain?.chainId as ChainId,
            logoUrl: DefaultAvatar,
            symbol: getTxsAction(item).type,
          }}
        />
      )
    },
  },
  {
    title: t`Txs Hash`,
    dataIndex: 'txHash',
    render: TxsHashCell,
  },
  {
    title: t`Balance`,
    dataIndex: 'amount',
    align: 'left',
    render: BalanceCell,
  },
  {
    title: t`Interaction`,
    render: InteractionCell,
  },
  {
    title: t`Txs Fee`,
    render: GasFeeCell,
    align: 'right',
  },
]

const pageSize = 20
export default function Transactions({ chainIds, wallet }: { chainIds: ChainId[]; wallet: string }) {
  const theme = useTheme()
  const [search, setSearch] = useState('')
  const searchDebounce = useDebounce(search, 500)

  const isAddressSearch = searchDebounce && isAddress(ChainId.MAINNET, searchDebounce)
  const query = searchDebounce ? { [isAddressSearch ? 'tokenAddress' : 'tokenSymbol']: searchDebounce } : {}
  const { data, isFetching } = useGetTransactionsQuery({
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
      {isFetching ? (
        <LocalLoader />
      ) : (
        <Table
          templateColumn={`0.5fr repeat(4, 1fr)`}
          data={data?.data || EMPTY_ARRAY}
          columns={columns}
          style={{ flex: 1, marginLeft: '-16px', marginRight: '-16px' }}
          pageSize={pageSize}
          totalItems={pageSize}
        />
      )}
    </Section>
  )
}
