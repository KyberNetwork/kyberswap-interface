import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ethers } from 'ethers'
import { rgba } from 'polished'
import { useCallback, useMemo, useState } from 'react'
import { Trash } from 'react-feather'
import { useGetTokenApprovalQuery } from 'services/portfolio'

import { ButtonAction } from 'components/Button'
import { CheckCircle } from 'components/Icons'
import Row, { RowFit } from 'components/Row'
import SearchInput from 'components/SearchInput'
import Table, { TableColumn } from 'components/Table'
import { ERC20_ABI } from 'constants/abis/erc20'
import { EMPTY_ARRAY } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { TokenCellWithWalletAddress } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/WalletInfo'
import { TokenAllowAnce } from 'pages/NotificationCenter/Portfolio/type'
import { Section } from 'pages/TrueSightV2/components'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils'
import { getSigningContract } from 'utils/getContract'
import getShortenAddress from 'utils/getShortenAddress'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'

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
  const { amount } = item
  const disabled = !amount || amount === '0'
  const color = disabled ? theme.border : theme.red
  return (
    <Row justify="flex-end">
      <ButtonAction
        disabled={disabled}
        onClick={() => revokeAllowance(item)}
        style={{
          backgroundColor: rgba(color, 0.2),
          color: color,
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

const getColumns = (revokeAllowance: (v: TokenAllowAnce) => void): TableColumn<TokenAllowAnce>[] => [
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
      value === ethers.constants.MaxUint256.toString()
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
    render: ({ item }) => <ActionButton item={item} revokeAllowance={revokeAllowance} />,
  },
]

export default function Allowances({ wallet, chainIds }: { wallet: string; chainIds: ChainId[] }) {
  const { data } = useGetTokenApprovalQuery({ address: wallet, chainIds }, { skip: !wallet })
  const theme = useTheme()

  const { chainId: currentChain } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const revokeAllowance = useCallback(
    async (data: TokenAllowAnce) => {
      const { chainId } = data
      const handleRevoke = async function ({ tokenAddress, spenderAddress, ownerAddress }: TokenAllowAnce) {
        try {
          if (!library) return
          const tokenContract = getSigningContract(tokenAddress, ERC20_ABI, library, ownerAddress)
          const tx = await tokenContract.approve(spenderAddress, ethers.constants.Zero)
          await tx.wait()
          // todo add transaction, loading
        } catch (error) {
          console.error('Error revoking allowance:', error)
        }
      }

      if (currentChain !== chainId) changeNetwork(chainId, () => handleRevoke(data)) // todo not work
      else handleRevoke(data)
    },
    [changeNetwork, currentChain, library],
  )

  const columns = useMemo(() => {
    return getColumns(revokeAllowance)
  }, [revokeAllowance])

  const [search, setSearch] = useState('')
  const searchDebounce = useDebounce(search, 500)
  const formatData = useMemo(() => {
    if (!data) return EMPTY_ARRAY
    return searchDebounce
      ? data.approvals.filter(
          e =>
            e.symbol.toLowerCase().includes(searchDebounce.toLowerCase()) ||
            e.tokenAddress.toLowerCase().includes(searchDebounce.toLowerCase()),
        )
      : data.approvals
  }, [data, searchDebounce])

  return (
    <Section
      title={
        <RowFit gap="4px" color={theme.subText} alignItems={'center'}>
          <CheckCircle size="14px" />
          <Trans>Token Allowances</Trans>
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
        columns={columns}
        data={formatData}
        totalItems={formatData.length}
        style={{ flex: 1, marginLeft: '-16px', marginRight: '-16px' }}
      />
    </Section>
  )
}
