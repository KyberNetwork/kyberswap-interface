import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ethers } from 'ethers'
import { rgba } from 'polished'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Trash } from 'react-feather'
import { useLazyGetTokenApprovalQuery } from 'services/portfolio'

import { ButtonAction } from 'components/Button'
import { CheckCircle } from 'components/Icons'
import Loader from 'components/Loader'
import LocalLoader from 'components/LocalLoader'
import Row, { RowFit } from 'components/Row'
import Table, { TableColumn } from 'components/Table'
import { ERC20_ABI } from 'constants/abis/erc20'
import { EMPTY_ARRAY } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { TokenCellWithWalletAddress } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/WalletInfo'
import { PortfolioSection, SearchPortFolio } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/styled'
import { formatAllowance } from 'pages/NotificationCenter/Portfolio/helpers'
import { TokenAllowAnce } from 'pages/NotificationCenter/Portfolio/type'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils'
import { getSigningContract } from 'utils/getContract'
import getShortenAddress from 'utils/getShortenAddress'

const SpenderCell = ({ value, item }: { value: string; item: TokenAllowAnce }) => {
  return (
    <ExternalLink href={getEtherscanLink(item.chainId, value, 'address')}>
      {item['spenderName'] || getShortenAddress(value ?? '')}
    </ExternalLink>
  )
}

const ActionButton = ({
  item,
  revokeAllowance,
}: {
  item: TokenAllowAnce
  revokeAllowance: (v: TokenAllowAnce) => void
}) => {
  const theme = useTheme()
  const { amount, ownerAddress } = item
  const { account } = useActiveWeb3React()
  const [loading, setLoading] = useState(false)
  const onClick = async () => {
    setLoading(true)
    await revokeAllowance(item)
    setLoading(false)
  }

  const disabled = loading || !amount || amount === '0' || account?.toLowerCase() !== ownerAddress.toLowerCase()
  const color = disabled ? theme.border : theme.red
  return (
    <Row justify="flex-end">
      <ButtonAction
        disabled={disabled}
        onClick={onClick}
        style={{
          backgroundColor: rgba(color, 0.2),
          color: color,
          width: '32px',
          height: '32px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {loading ? <Loader /> : <Trash size={14} />}
      </ButtonAction>
    </Row>
  )
}

const getColumns = (revokeAllowance: (v: TokenAllowAnce) => void): TableColumn<TokenAllowAnce>[] => [
  {
    title: t`Asset`,
    dataIndex: 'token',
    align: 'left',
    render: ({ item }: { item: TokenAllowAnce }) => (
      <TokenCellWithWalletAddress item={{ ...item, logoUrl: item.logo, walletAddress: item.ownerAddress }} />
    ),
    sticky: true,
  },
  {
    title: t`Allowance`,
    dataIndex: 'amount',
    render: ({ value, item }) => formatAllowance(value, item.decimals),
  },
  {
    title: t`Authorized Spender`,
    dataIndex: 'spenderAddress',
    render: SpenderCell,
    style: isMobile ? { width: 200 } : undefined,
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
    render: ({ item }) => <ActionButton item={item} revokeAllowance={revokeAllowance} />,
    style: { width: 40 },
  },
]

const useFetchAllowance = ({ wallets, chainIds }: { wallets: string[]; chainIds: ChainId[] }) => {
  const [data, setData] = useState<TokenAllowAnce[]>([])
  const [fetchAllowance, { isFetching }] = useLazyGetTokenApprovalQuery()
  const loading = useShowLoadingAtLeastTime(isFetching, 300)
  const controller = useRef(new AbortController())

  const fetchData = useCallback(
    async function () {
      controller.current.abort()
      controller.current = new AbortController()
      const signal = controller.current.signal
      try {
        if (!wallets.length) {
          throw new Error('Empty addresses')
        }
        const resp = await Promise.all(wallets.map(address => fetchAllowance({ chainIds, address }).unwrap()))
        if (signal.aborted) return
        setData(resp.map(e => e.approvals).flat())
      } catch (error) {
        if (signal.aborted) return
        setData([])
      }
    },
    [chainIds, wallets, fetchAllowance],
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isFetching: loading, refetch: fetchData }
}
export default function Allowances({ walletAddresses, chainIds }: { walletAddresses: string[]; chainIds: ChainId[] }) {
  const { data, isFetching, refetch } = useFetchAllowance({ wallets: walletAddresses, chainIds })
  const theme = useTheme()

  const { chainId: currentChain } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const addTransactionWithType = useTransactionAdder()
  const revokeAllowance = useCallback(
    async (data: TokenAllowAnce) => {
      const { chainId } = data
      const handleRevoke = async function ({ tokenAddress, spenderAddress, ownerAddress, symbol }: TokenAllowAnce) {
        try {
          if (!library) return
          const tokenContract = getSigningContract(tokenAddress, ERC20_ABI, library, ownerAddress)
          const tx = await tokenContract.approve(spenderAddress, ethers.constants.Zero)
          addTransactionWithType({
            hash: tx.hash,
            type: TRANSACTION_TYPE.APPROVE,
            extraInfo: {
              tokenSymbol: symbol,
              tokenAddress,
              contract: spenderAddress,
            },
          })
          await tx.wait()
          refetch()
        } catch (error) {
          console.error('Error revoking allowance:', error)
        }
      }
      if (currentChain !== chainId) return changeNetwork(chainId, () => handleRevoke(data), undefined, true) // todo not work
      return handleRevoke(data)
    },
    [changeNetwork, currentChain, library, addTransactionWithType, refetch],
  )

  const columns = useMemo(() => {
    return getColumns(revokeAllowance)
  }, [revokeAllowance])

  const [search, setSearch] = useState('')
  const searchDebounce = useDebounce(search, 500)
  const formatData = useMemo(() => {
    if (!data) return EMPTY_ARRAY
    return searchDebounce
      ? data.filter(
          e =>
            e.symbol.toLowerCase().includes(searchDebounce.toLowerCase()) ||
            e.spenderName.toLowerCase().includes(searchDebounce.toLowerCase()) ||
            e.tokenAddress.toLowerCase() === searchDebounce.toLowerCase() ||
            e.spenderAddress.toLowerCase() === searchDebounce.toLowerCase(),
        )
      : data
  }, [data, searchDebounce])

  return (
    <PortfolioSection
      title={
        <RowFit gap="4px" color={theme.subText} alignItems={'center'}>
          <CheckCircle size="14px" />
          <Trans>Token Allowances</Trans>
        </RowFit>
      }
      contentStyle={{ padding: 0 }}
      actions={
        <SearchPortFolio onChange={setSearch} value={search} placeholder={t`Search by token symbol or token address`} />
      }
    >
      {isFetching ? <LocalLoader /> : <Table columns={columns} data={formatData} totalItems={formatData.length} />}
    </PortfolioSection>
  )
}