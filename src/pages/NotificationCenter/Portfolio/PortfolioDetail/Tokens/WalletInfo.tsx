import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Flex, Text } from 'rebass'
import { useGetWalletsAllocationQuery } from 'services/portfolio'
import styled, { CSSProperties } from 'styled-components'

// import { ReactComponent as LiquidityIcon } from 'assets/svg/liquidity_icon.svg'
import { ButtonAction } from 'components/Button'
import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import Wallet from 'components/Icons/Wallet'
import LocalLoader from 'components/LocalLoader'
import { TokenLogoWithChain } from 'components/Logo'
import Row, { RowFit } from 'components/Row'
import Table, { TableColumn } from 'components/Table'
import { MouseoverTooltip } from 'components/Tooltip'
import { EMPTY_ARRAY } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import ActionPopup from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/ActionPopup'
// import { LiquidityScore } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/TokenAllocation'
import useFilterBalances from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/useFilterBalances'
import { PortfolioSection, SearchPortFolio } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/styled'
import { PORTFOLIO_POLLING_INTERVAL } from 'pages/NotificationCenter/Portfolio/const'
import { PortfolioWalletBalance } from 'pages/NotificationCenter/Portfolio/type'
import SmallKyberScoreMeter from 'pages/TrueSightV2/components/SmallKyberScoreMeter'
import { calculateValueToColor } from 'pages/TrueSightV2/utils'
import { ExternalLink } from 'theme'
import { getEtherscanLink, isSupportLimitOrder } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'
import { formatDisplayNumber } from 'utils/numbers'
import { navigateToLimitPage, navigateToSwapPage } from 'utils/redirect'

const WalletLabelWrapper = styled.div<{ color: string }>`
  display: flex;
  gap: 2px;
  background-color: ${({ color, theme }) => rgba(color === theme.text ? theme.subText : color, 0.2)};
  color: ${({ color }) => color};
  border-radius: 16px;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 4px;
  width: fit-content;
`

export const WalletLabel = ({
  color,
  walletAddress,
  chainId,
  tokenAddress,
}: {
  color: string
  walletAddress: string
  chainId: ChainId
  tokenAddress?: string
}) => {
  return (
    <WalletLabelWrapper color={color}>
      <Wallet size={12} />
      <ExternalLink
        href={
          tokenAddress
            ? `${getEtherscanLink(chainId, tokenAddress, 'token')}?a=${walletAddress}`
            : getEtherscanLink(chainId, walletAddress, 'address')
        }
      >
        <Text color={color}>{getShortenAddress(walletAddress || '')}</Text>
      </ExternalLink>
    </WalletLabelWrapper>
  )
}

export const TokenCellWithWalletAddress = ({
  item: { tokenAddress, chainId, logoUrl, walletAddress, symbol },
  walletColor,
  style,
}: {
  item: {
    logoUrl: string
    chainId: number
    walletAddress: string
    tokenAddress?: string
    symbol: string
  }
  walletColor?: string
  style?: CSSProperties
}) => {
  const theme = useTheme()
  return (
    <Row gap="14px" style={style}>
      <TokenLogoWithChain chainId={chainId} size={'36px'} tokenLogo={logoUrl} />
      <Column gap="4px">
        <Text fontWeight={'500'}>{symbol}</Text>
        <WalletLabel
          color={walletColor || theme.text}
          walletAddress={walletAddress}
          tokenAddress={tokenAddress}
          chainId={chainId}
        />
      </Column>
    </Row>
  )
}

export type DisplayField = { title: string; show: boolean; key: string }
const getDefaultFields = () => [
  { title: t`Price`, show: true, key: 'priceUsd' },
  { title: t`Amount`, show: true, key: 'amount' },
  { title: t`Value USD`, show: true, key: 'valueUsd' },
  { title: t`KyberScore`, show: true, key: 'kyberScore' },
]

const ActionTitle = ({
  displayFields,
  onChangeDisplayField,
}: {
  displayFields: DisplayField[]
  onChangeDisplayField: (fields: DisplayField[]) => void
}) => {
  return (
    <Flex alignItems={'center'} sx={{ gap: '4px' }} justifyContent={'flex-end'}>
      Action <ActionPopup fields={displayFields} onChangeDisplayField={onChangeDisplayField} />
    </Flex>
  )
}

const ActionButton = ({ item: { tokenAddress, chainId } }: { item: PortfolioWalletBalance }) => {
  const theme = useTheme()
  return (
    <Row justify="flex-end" gap="8px">
      {isSupportLimitOrder(+chainId) && (
        <MouseoverTooltip text={t`Limit Order`} width="fit-content" placement="top">
          <ButtonAction
            style={{ backgroundColor: rgba(theme.subText, 0.2), padding: '6px', height: '26px', width: '26px' }}
            onClick={() => navigateToLimitPage({ chain: chainId, address: tokenAddress, input: true })}
          >
            <Icon id="chart" size={13} color={theme.subText} />
          </ButtonAction>
        </MouseoverTooltip>
      )}
      <MouseoverTooltip text={t`Swap`} width="fit-content" placement="top">
        <ButtonAction
          style={{ backgroundColor: rgba(theme.subText, 0.2), padding: '6px' }}
          onClick={() => {
            navigateToSwapPage({ chain: chainId, address: tokenAddress, input: true })
          }}
        >
          <Icon id="swap" size={14} color={theme.subText} />
        </ButtonAction>
      </MouseoverTooltip>
    </Row>
  )
}

const KyberScore = ({
  item: { kyberScore = 0, kyberScoreTag, priceUsd, kyberScoreCreatedAt = 0 },
}: {
  item: PortfolioWalletBalance
}) => {
  const theme = useTheme()
  return (
    <Column style={{ alignItems: 'center' }}>
      <SmallKyberScoreMeter
        disabledTooltip
        token={{ kyberScore, createdAt: kyberScoreCreatedAt, price: +priceUsd } as any}
      />
      <Text color={calculateValueToColor(kyberScore, theme)} fontSize="14px" fontWeight={500}>
        {kyberScoreTag || 'Not Applicable'}
      </Text>
    </Column>
  )
}

const getColumns = (displayFields: DisplayField[], onChangeDisplayField: (fields: DisplayField[]) => void) => {
  return [
    {
      title: t`Token`,
      align: 'left',
      render: ({
        item: { tokenLogo, tokenSymbol, chainId, walletAddress, tokenAddress },
      }: {
        item: PortfolioWalletBalance
      }) => (
        <TokenCellWithWalletAddress
          item={{ logoUrl: tokenLogo, symbol: tokenSymbol, walletAddress, chainId, tokenAddress }}
        />
      ),
      sticky: true,
      style: isMobile ? { width: 140 } : undefined,
    },
    {
      title: t`Amount`,
      dataIndex: 'amount',
      render: ({ value }: { value: string }) => formatDisplayNumber(value, { style: 'decimal', significantDigits: 6 }),
      style: isMobile ? { width: 120 } : undefined,
      align: 'left',
    },
    {
      title: t`Price`,
      dataIndex: 'priceUsd',
      render: ({ value }: { value: string }) => formatDisplayNumber(value, { style: 'currency', significantDigits: 6 }),
      align: 'left',
      style: isMobile ? { width: 120 } : undefined,
    },
    {
      title: t`Value`,
      dataIndex: 'valueUsd',
      render: ({ value }: { value: string }) => formatDisplayNumber(value, { style: 'currency', fractionDigits: 2 }),
      style: isMobile ? { width: 120 } : undefined,
      align: 'left',
      tooltip: (
        <Trans>
          This is the real value you will receive if you were to sell your asset (considers price impact). Read more{' '}
          <ExternalLink href="/todo">here ↗</ExternalLink>
        </Trans>
      ),
    },
    // {
    //   title: t`Liquidity Score`,
    //   dataIndex: 'token',
    //   render: LiquidityScore,
    //   tooltip: (
    //     <Trans>
    //       Liquidity Score of a token refers to how easily that token can be bought or sold in the market without
    //       significantly impacting its price. Read more <ExternalLink href="/todo">here ↗</ExternalLink>
    //     </Trans>
    //   ),
    //   style: isMobile ? { width: 120 } : undefined,
    // },
    // {
    //   title: t`24H Volatility Score`,
    //   dataIndex: 'token',
    //   render: () => 'test',
    //   tooltip: (
    //     <Trans>
    //       Volatility score measures the price volatility of the token. Find out more about the score{' '}
    //       <ExternalLink href="/todo">here ↗</ExternalLink>
    //     </Trans>
    //   ),
    //   style: isMobile ? { width: 120 } : undefined,
    // },
    {
      title: t`KyberScore`,
      dataIndex: 'kyberScore',
      render: KyberScore,
      tooltip: (
        <Trans>
          KyberScore uses AI to measure the upcoming trend of a token (bullish or bearish) by taking into account
          multiple on-chain and off-chain indicators. The score ranges from 0 to 100. The higher the score, the more
          bullish the token in the short-term. Read more{' '}
          <ExternalLink href="https://docs.kyberswap.com/kyberswap-solutions/kyberai/kyberscore">here ↗</ExternalLink>
        </Trans>
      ),
      style: isMobile ? { width: 120 } : undefined,
    },
    {
      title: <ActionTitle displayFields={displayFields} onChangeDisplayField={onChangeDisplayField} />,
      align: 'right',
      render: ActionButton,
    },
  ].filter(el =>
    displayFields.some(field => (el.dataIndex ? field.key === el.dataIndex && field.show : true)),
  ) as TableColumn<PortfolioWalletBalance>[]
}

export default function WalletInfo({ walletAddresses, chainIds }: { walletAddresses: string[]; chainIds: ChainId[] }) {
  const theme = useTheme()
  const { data, isFetching } = useGetWalletsAllocationQuery(
    { walletAddresses, chainIds },
    { skip: !walletAddresses.length, refetchOnMountOrArgChange: true, pollingInterval: PORTFOLIO_POLLING_INTERVAL },
  )

  const [displayFields, setDisplayFields] = useState(getDefaultFields())
  const onChangeDisplayField = useCallback((fields: DisplayField[]) => {
    setDisplayFields(fields)
  }, [])
  const columns = useMemo(() => {
    return getColumns(displayFields, onChangeDisplayField)
  }, [displayFields, onChangeDisplayField])

  const [search, setSearch] = useState('')
  const searchDebounce = useDebounce(search, 500)

  const filterBalance = useFilterBalances()
  const formatData = useMemo(() => {
    if (!data?.balances?.length) return EMPTY_ARRAY
    const list = data.balances
    return searchDebounce
      ? list.filter(
          e =>
            e.tokenSymbol.toLowerCase().includes(searchDebounce.toLowerCase()) ||
            e.tokenAddress.toLowerCase().includes(searchDebounce.toLowerCase()),
        )
      : filterBalance(list).tableData
  }, [data, searchDebounce, filterBalance])

  return (
    <PortfolioSection
      title={
        <RowFit gap="4px" color={theme.subText}>
          <Wallet />
          <Trans>Wallet</Trans>
        </RowFit>
      }
      contentStyle={{ padding: 0 }}
      actions={
        <SearchPortFolio onChange={setSearch} value={search} placeholder={t`Search by token symbol or token address`} />
      }
    >
      {isFetching ? (
        <LocalLoader style={{ height: 300 }} />
      ) : (
        <Table data={formatData} columns={columns} totalItems={formatData.length} pageSize={isMobile ? 10 : 20} />
      )}
    </PortfolioSection>
  )
}
