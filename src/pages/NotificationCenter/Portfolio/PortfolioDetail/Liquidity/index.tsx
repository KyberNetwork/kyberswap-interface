import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { formatUnits } from 'ethers/lib/utils'
import { rgba } from 'polished'
import { useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { useGetLiquidityPortfolioQuery } from 'services/portfolio'

import Badge, { BadgeVariant } from 'components/Badge'
import { ButtonAction } from 'components/Button'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import { DoubleLogoWithChain } from 'components/DoubleLogo'
import { MoneyBag } from 'components/Icons'
import Wallet from 'components/Icons/Wallet'
import LocalLoader from 'components/LocalLoader'
import Logo, { TokenLogoWithChain } from 'components/Logo'
import Row, { RowBetween, RowFit } from 'components/Row'
import SearchInput from 'components/SearchInput'
import Table, { TableColumn } from 'components/Table'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import ChevronIcon from 'pages/TrueSightV2/components/ChevronIcon'
import { MEDIA_WIDTHS } from 'theme'
import { formatUnitsToFixed } from 'utils/formatBalance'
import getShortenAddress from 'utils/getShortenAddress'
import { formatDisplayNumber } from 'utils/numbers'

import { LiquidityData } from '../../type'
import PositionDetailsModal from './PositionDetailsModal'

export default function Liquidity({ walletAddresses, chainIds }: { chainIds: ChainId[]; walletAddresses: string[] }) {
  const theme = useTheme()
  const [isOpenDetailModal, setIsOpenDetailModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<LiquidityData | null>(null)
  const { account } = useActiveWeb3React()
  //.. 0x3a96325a47e9fae32e72d5bd7401e58c6e5c423b use this address for testing purpose
  const { data, isLoading } = useGetLiquidityPortfolioQuery(
    {
      addresses: walletAddresses,
      chainIds: chainIds,
      quoteSymbols: 'usd',
      orderBy: 'liquidity',
      orderASC: false,
      positionStatus: 'open',
    },
    { skip: !account },
  )

  const columns: TableColumn<LiquidityData>[] = [
    {
      title: t`Pool | NFT ID`,
      render: ({ item }: { item: LiquidityData }) => {
        const token0 = item.balance.lpData.lpPoolData.token0
        const token1 = item.balance.lpData.lpPoolData.token1
        const amp = item.balance.lpData.lpPoolData.amp
        const fee = item.balance.lpData.lpPoolData.fee
        const isFarming =
          item.balance.lpData.lpPositionData?.totalFarmingReward &&
          item.balance.lpData.lpPositionData.totalFarmingReward > 0
        const isClassic = item.balance.project === 'KyberSwap' && item.balance.tokenType === 'ERC20'
        const isElastic = item.balance.project === 'KyberSwap' && item.balance.tokenType === 'ERC721'
        return (
          <Row gap="12px">
            <DoubleLogoWithChain logoUrl1={token0.logo} logoUrl2={token1.logo} chainUrl={item.chainLogo} />
            <Column gap="4px">
              <RowFit gap="2px" align="center">
                <Text fontSize="14px" lineHeight="20px" fontWeight={500}>
                  {token0.symbol} - {token1.symbol}
                </Text>
                <CopyHelper toCopy={item.balance.lpData.lpPoolData.poolAddress} color={theme.subText} size={12} />
              </RowFit>
              <RowFit fontSize="10px" lineHeight="14px" gap="4px" sx={{ '>div': { padding: '0px 4px' } }}>
                {isClassic ? <Badge variant={BadgeVariant.BLUE}>Classic</Badge> : null}
                {isElastic ? <Badge variant={BadgeVariant.BLUE}>Elastic</Badge> : null}
                {amp ? <Badge variant={BadgeVariant.WHITE}>AMP {amp}</Badge> : null}
                {fee ? <Badge variant={BadgeVariant.WHITE}>FEE {fee}%</Badge> : null}
                {isFarming ? (
                  <Badge variant={BadgeVariant.PRIMARY} style={{ padding: '2px 4px' }}>
                    <MoneyBag size={10} />
                  </Badge>
                ) : null}
              </RowFit>
              <RowFit
                gap="2px"
                color={item.balance.userAddress.toLowerCase() === account.toLowerCase() ? theme.primary : theme.subText}
              >
                <Wallet size={14} />
                <Text fontSize="10px" lineHeight="14px">
                  {getShortenAddress(item.balance.userAddress)}
                </Text>
              </RowFit>
            </Column>
          </Row>
        )
      },
      align: 'left',
      sticky: true,
      style: { width: isMobile ? 140 : undefined, paddingTop: 22, paddingBottom: 22 },
    },
    {
      title: t`Pool Tokens`,
      render: ({ item }: { item: LiquidityData }) => {
        const token0 = item.balance.underlying[0]
        const token1 = item.balance.underlying[1]
        return (
          <Column gap="6px">
            <Row gap="4px" justify="flex-end">
              <Logo srcs={[token0.token.logo]} style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
              <Text fontSize="14px" fontWeight={500}>
                {formatUnitsToFixed(token0.balance, token0.token.decimals, 4)} {token0.token.symbol}
              </Text>
            </Row>
            <Row gap="4px" justify="flex-end">
              <Logo srcs={[token1.token.logo]} style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
              <Text fontSize="14px" fontWeight={500}>
                {formatUnitsToFixed(token1.balance, token1.token.decimals, 4)} {token1.token.symbol}
              </Text>
            </Row>
          </Column>
        )
      },
      style: isMobile ? { width: 140 } : undefined,
      align: 'right',
    },
    {
      title: t`Fees & Rewards`,
      align: 'right',
      render: ({ item }: { item: LiquidityData }) => {
        return (
          <Column gap="6px">
            {item.balance.underlying
              .filter(item => item.assetType === 'reward')
              .map((item, index: number) => {
                return (
                  <Row gap="4px" justify="flex-end" key={index}>
                    <Logo srcs={[item.token.logo]} style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                    <Text fontSize="14px" fontWeight={500}>
                      {formatUnitsToFixed(item.balance, item.token.decimals, 4)} {item.token.symbol}
                    </Text>
                  </Row>
                )
              })}
          </Column>
        )
      },
      style: isMobile ? { width: 140 } : undefined,
    },
    {
      title: t`Current Value`,
      align: 'right',
      render: ({ item }: { item: LiquidityData }) => (
        <Text>
          {formatDisplayNumber(
            item.balance.underlying
              .filter(item => item.assetType === 'underlying')
              .map(item => item.quotes.usd.value)
              .reduce((a, b) => a + b),
            { style: 'currency', significantDigits: 4 },
          )}
        </Text>
      ),
      style: isMobile ? { width: 140 } : undefined,
    },
    {
      title: t`Profit & Loss`,
      align: 'right',
      render: ({ item }: { item: LiquidityData }) => {
        const pnl = item.balance.lpData.lpUniV2Data?.pnl || item.balance.lpData.lpPositionData?.pnl || 0
        return (
          <Text color={pnl > 0 ? theme.primary : pnl < 0 ? theme.red : theme.text}>
            {pnl
              ? formatDisplayNumber(pnl, { style: 'currency', fractionDigits: 2, allowDisplayNegative: true })
              : '--'}
          </Text>
        )
      },
      style: isMobile ? { width: 140 } : undefined,
    },
    {
      title: t`Action`,
      align: 'right',
      render: ({ item }: { item: LiquidityData }) => {
        return (
          <Row justify="flex-end">
            <ButtonAction
              onClick={() => {
                setIsOpenDetailModal(true)
                setSelectedPosition(item)
              }}
              style={{
                backgroundColor: rgba(theme.subText, 0.2),
                color: theme.subText,
                width: '32px',
                height: '32px',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M10.6667 1.52588e-05L1.33333 1.52588e-05C0.6 1.52588e-05 0 0.600015 0 1.33335L0 10.6667C0 11.4 0.6 12 1.33333 12L10.6667 12C11.4 12 12 11.4 12 10.6667L12 1.33335C12 0.600015 11.4 1.52588e-05 10.6667 1.52588e-05ZM7.04 2.35335C7.23333 2.16002 7.55333 2.16002 7.74667 2.35335L8.33333 2.94002L8.92 2.35335C9.11333 2.16002 9.43333 2.16002 9.62667 2.35335C9.82 2.54668 9.82 2.86668 9.62667 3.06002L9.04 3.64668L9.62667 4.23335C9.82 4.42668 9.82 4.74668 9.62667 4.94002C9.43333 5.13335 9.11333 5.13335 8.92 4.94002L8.33333 4.36002L7.74667 4.94668C7.55333 5.14002 7.23333 5.14002 7.04 4.94668C6.84667 4.75335 6.84667 4.43335 7.04 4.24002L7.62667 3.65335L7.04 3.06668C6.84 2.86668 6.84 2.54668 7.04 2.35335ZM2.66667 3.14668L5 3.14668C5.27333 3.14668 5.5 3.37335 5.5 3.64668C5.5 3.92002 5.27333 4.14668 5 4.14668L2.66667 4.14668C2.39333 4.14668 2.16667 3.92002 2.16667 3.64668C2.16667 3.37335 2.39333 3.14668 2.66667 3.14668ZM5.16667 8.66668H4.33333V9.50002C4.33333 9.77335 4.10667 10 3.83333 10C3.56 10 3.33333 9.77335 3.33333 9.50002V8.66668H2.5C2.22667 8.66668 2 8.44002 2 8.16668C2 7.89335 2.22667 7.66668 2.5 7.66668L3.33333 7.66668L3.33333 6.83335C3.33333 6.56002 3.56 6.33335 3.83333 6.33335C4.10667 6.33335 4.33333 6.56002 4.33333 6.83335V7.66668H5.16667C5.44 7.66668 5.66667 7.89335 5.66667 8.16668C5.66667 8.44002 5.44 8.66668 5.16667 8.66668ZM9.5 9.50002H7.16667C6.89333 9.50002 6.66667 9.27335 6.66667 9.00002C6.66667 8.72668 6.89333 8.50002 7.16667 8.50002H9.5C9.77333 8.50002 10 8.72668 10 9.00002C10 9.27335 9.77333 9.50002 9.5 9.50002ZM9.5 7.83335L7.16667 7.83335C6.89333 7.83335 6.66667 7.60668 6.66667 7.33335C6.66667 7.06002 6.89333 6.83335 7.16667 6.83335L9.5 6.83335C9.77333 6.83335 10 7.06002 10 7.33335C10 7.60668 9.77333 7.83335 9.5 7.83335Z"
                  fill="white"
                  fillOpacity="0.7"
                />
              </svg>
            </ButtonAction>
          </Row>
        )
      },
      style: isMobile ? { width: 140 } : undefined,
    },
  ]

  const formattedData = useMemo(() => {
    if (!data) return []
    const newData: Array<{ chainId: number; protocol: string; protocolLogo: string; data: Array<LiquidityData> }> = []

    data.data.forEach((item: LiquidityData) => {
      const dataIndex = newData.findIndex(t => t.chainId === item.chainId && t.protocol === item.balance.project)
      if (dataIndex < 0) {
        newData.push({
          chainId: item.chainId,
          protocol: item.balance.project,
          protocolLogo: item.balance.projectLogo,
          data: [item],
        })
      } else {
        newData[dataIndex].data.push(item)
      }
    })
    return newData.sort(a => (a.protocol === 'KyberSwap' ? -1 : 1))
  }, [data])

  return (
    <>
      {isLoading ? (
        <LocalLoader style={{ height: 300 }} />
      ) : (
        formattedData.map(item => {
          return (
            <ProtocolChainWrapper
              chainId={item.chainId}
              protocolName={item.protocol}
              protocolLogo={item.protocolLogo}
              data={item.data}
              key={`${item.chainId}-${item.protocol}`}
              columns={columns}
            />
          )
        })
      )}
      <PositionDetailsModal
        isOpen={isOpenDetailModal}
        position={selectedPosition}
        onClose={() => setIsOpenDetailModal(false)}
      />
    </>
  )
}

const ProtocolChainWrapper = ({
  protocolLogo,
  chainId,
  protocolName,
  data,
  columns,
}: {
  protocolLogo: string
  chainId: number
  protocolName: string
  data: Array<LiquidityData>
  columns: TableColumn<LiquidityData>[]
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [search, setSearch] = useState('')
  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const theme = useTheme()

  const filteredData = useMemo(() => {
    if (search === '') return data

    return data.filter(item => {
      const searchTerms = [
        item.chainName,
        item.balance.project,
        item.balance.tokenId,
        item.balance.userAddress,
        item.balance.web3ProjectAddress,
        item.balance.lpData.lpPoolData.token0.address,
        item.balance.lpData.lpPoolData.token0.symbol,
        item.balance.lpData.lpPoolData.token1.address,
        item.balance.lpData.lpPoolData.token1.symbol,
      ]

      return searchTerms.some(term => term.toLowerCase().includes(search.toLowerCase()))
    })
  }, [data, search])

  return (
    <Column
      sx={{
        margin: above768 ? '0px' : '0px -17px',
        borderRadius: above768 ? '20px' : 0,
        border: `1px solid ${theme.border}`,
        background: above768 ? 'linear-gradient(332deg, rgb(32 32 32) 0%, rgba(15, 15, 15, 1) 80%)' : theme.background,
        marginBottom: '36px',
        overflow: 'hidden',
      }}
    >
      <RowBetween padding="16px" gap="16px">
        <RowFit gap="12px" flexShrink={0}>
          <TokenLogoWithChain chainId={chainId} size={'36px'} tokenLogo={protocolLogo} />
          <Text>{protocolName}</Text>
        </RowFit>
        {above768 && (
          <SearchInput
            onChange={setSearch}
            value={search}
            placeholder={t`Search by token symbol or token address`}
            style={{
              width: '100%',
              height: 32,
              backgroundColor: theme.buttonBlack,
              border: `1px solid ${theme.buttonGray}`,
            }}
            clearable
          />
        )}
        <RowFit flexShrink={0}>
          <ButtonAction color={theme.white} style={{ padding: '8px' }} onClick={() => setIsExpanded(prev => !prev)}>
            <ChevronIcon color={theme.white} rotate={isExpanded ? '180deg' : '0deg'} />
          </ButtonAction>
        </RowFit>
      </RowBetween>
      {!above768 && (
        <Row padding="0 16px 16px 16px">
          <SearchInput
            onChange={setSearch}
            value={search}
            placeholder={t`Search by token symbol or token address`}
            style={{
              width: '100%',
              height: 32,
              backgroundColor: theme.buttonBlack,
              border: `1px solid ${theme.buttonGray}`,
            }}
            clearable
          />
        </Row>
      )}
      {isExpanded &&
        (above768 ? (
          <Table
            headerStyle={{ borderRadius: isMobile ? 0 : undefined }}
            data={filteredData}
            columns={columns}
            pageSize={10}
            pagination={{ hideWhenSinglePage: true }}
          />
        ) : (
          <>
            {filteredData.map(item => (
              <MobilePositionInfo position={item} key={`${item.chainId}-${item.balance.project}`} />
            ))}
          </>
        ))}
    </Column>
  )
}

const MobilePositionInfo = ({ position, onClick }: { position: LiquidityData; onClick?: () => void }) => {
  const theme = useTheme()
  const token0 = position.balance.lpData.lpPoolData.token0
  const token1 = position.balance.lpData.lpPoolData.token1
  const amp = position.balance.lpData.lpPoolData.amp
  const fee = position.balance.lpData.lpPoolData.fee
  const isFarming =
    position.balance.lpData.lpPositionData?.totalFarmingReward &&
    position.balance.lpData.lpPositionData.totalFarmingReward > 0
  const isClassic = position.balance.project === 'KyberSwap' && position.balance.tokenType === 'ERC20'
  const isElastic = position.balance.project === 'KyberSwap' && position.balance.tokenType === 'ERC721'
  const pnl = position.balance.lpData.lpUniV2Data?.pnl || position.balance.lpData.lpPositionData?.pnl || 0
  const hasRewards = position.balance.underlying.filter(i => i.assetType === 'reward').length > 0
  return (
    <Column
      gap="16px"
      padding="20px"
      sx={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.buttonBlack + '80' }}
    >
      <Column gap="2px">
        <Row gap="6px">
          <DoubleLogoWithChain
            size={20}
            chainSize={10}
            logoUrl1={token0.logo}
            logoUrl2={token1.logo}
            chainUrl={position.chainLogo}
          />
          <Text fontSize="14px" lineHeight="20px" fontWeight={500}>
            {token0.symbol} - {token1.symbol}
          </Text>
          <CopyHelper toCopy={position.balance.lpData.lpPoolData.poolAddress} color={theme.subText} size={14} />
        </Row>
        <RowBetween>
          <RowFit fontSize="10px" lineHeight="14px" gap="4px" sx={{ '>div': { padding: '0px 4px' } }}>
            {isClassic ? <Badge variant={BadgeVariant.BLUE}>Classic</Badge> : null}
            {isElastic ? <Badge variant={BadgeVariant.BLUE}>Elastic</Badge> : null}
            {amp ? <Badge variant={BadgeVariant.WHITE}>AMP {amp}</Badge> : null}
            {fee ? <Badge variant={BadgeVariant.WHITE}>FEE {fee}%</Badge> : null}
            {isFarming ? (
              <Badge variant={BadgeVariant.PRIMARY} style={{ padding: '2px 4px' }}>
                <MoneyBag size={10} />
              </Badge>
            ) : null}
          </RowFit>
          <RowFit gap="4px">
            <Wallet size={12} />
            <Text fontSize="10px">{getShortenAddress(position.balance.userAddress)}</Text>
          </RowFit>
        </RowBetween>
      </Column>
      <Column gap="6px">
        <RowBetween>
          <Text fontSize="12px">
            <Trans>Profit & Loss</Trans>
          </Text>
          <Text fontSize="14px" color={pnl > 0 ? theme.primary : pnl < 0 ? theme.red : theme.text}>
            {pnl
              ? formatDisplayNumber(pnl, { style: 'currency', fractionDigits: 2, allowDisplayNegative: true })
              : '--'}
          </Text>
        </RowBetween>
        <RowBetween>
          <Text fontSize="12px">
            <Trans>Current Value</Trans>
          </Text>
          <Text fontSize="14px">
            {formatDisplayNumber(
              position.balance.underlying
                .filter(item => item.assetType === 'underlying')
                .map(item => item.quotes.usd.value)
                .reduce((a, b) => a + b),
              { style: 'currency', significantDigits: 4 },
            )}
          </Text>
        </RowBetween>
      </Column>
      <Divider />
      <div style={{ display: 'grid', gridTemplateColumns: '0.4fr 0.3fr 0.3fr', gap: '12px' }}>
        <Text fontSize="12px" fontWeight={500} color={theme.subText}>
          <Trans>Pool Tokens</Trans>
        </Text>
        <Text fontSize="12px" fontWeight={500} color={theme.subText} textAlign="right">
          <Trans>Amount</Trans>
        </Text>
        <Text fontSize="12px" fontWeight={500} color={theme.subText} textAlign="right">
          <Trans>Value</Trans>
        </Text>
        <RowFit gap="4px">
          <Logo srcs={[token0.logo]} style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
          <Text fontSize="14px" lineHeight="20px">
            {token0.symbol}
          </Text>
        </RowFit>
        <Text fontSize="14px" textAlign="right">
          {formatDisplayNumber(formatUnits(position.balance.underlying[0].balance, token0.decimals), {
            style: 'decimal',
            fractionDigits: 4,
          })}
        </Text>
        <Text fontSize="14px" textAlign="right" color={theme.subText}>
          {formatDisplayNumber(position.balance.underlying[0].quotes.usd.value, {
            style: 'currency',
            fractionDigits: 2,
          })}
        </Text>
        <RowFit gap="4px">
          <Logo srcs={[token1.logo]} style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
          <Text fontSize="14px" lineHeight="20px">
            {token1.symbol}
          </Text>
        </RowFit>
        <Text fontSize="14px" textAlign="right">
          {formatDisplayNumber(formatUnits(position.balance.underlying[1].balance, token1.decimals), {
            style: 'decimal',
            fractionDigits: 4,
          })}
        </Text>
        <Text fontSize="14px" textAlign="right" color={theme.subText}>
          {formatDisplayNumber(position.balance.underlying[1].quotes.usd.value, {
            style: 'currency',
            fractionDigits: 2,
          })}
        </Text>
      </div>
      {hasRewards && (
        <>
          <Divider />
          <div style={{ display: 'grid', gridTemplateColumns: '0.4fr 0.3fr 0.3fr', gap: '12px' }}>
            <Text fontSize="12px" fontWeight={500} color={theme.subText}>
              <Trans>Rewards</Trans>
            </Text>
            <Text fontSize="12px" fontWeight={500} color={theme.subText} textAlign="right">
              <Trans>Amount</Trans>
            </Text>
            <Text fontSize="12px" fontWeight={500} color={theme.subText} textAlign="right">
              <Trans>Value</Trans>
            </Text>
            {position.balance.underlying
              .filter(i => i.assetType === 'reward')
              .map(item => {
                return (
                  <>
                    <RowFit gap="4px">
                      <Logo srcs={[item.token.logo]} style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                      <Text fontSize="14px" lineHeight="20px">
                        {item.token.symbol}
                      </Text>
                    </RowFit>
                    <Text fontSize="14px" textAlign="right">
                      {formatDisplayNumber(formatUnits(item.balance, item.token.decimals), {
                        style: 'decimal',
                        fractionDigits: 4,
                      })}
                    </Text>
                    <Text fontSize="14px" textAlign="right" color={theme.subText}>
                      {formatDisplayNumber(item.quotes.usd.value, {
                        style: 'currency',
                        fractionDigits: 2,
                      })}
                    </Text>
                  </>
                )
              })}
          </div>
        </>
      )}
      <Row justify="flex-end">
        <ButtonAction
          onClick={() => onClick?.()}
          style={{
            backgroundColor: rgba(theme.subText, 0.2),
            color: theme.subText,
            width: '32px',
            height: '32px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M10.6667 1.52588e-05L1.33333 1.52588e-05C0.6 1.52588e-05 0 0.600015 0 1.33335L0 10.6667C0 11.4 0.6 12 1.33333 12L10.6667 12C11.4 12 12 11.4 12 10.6667L12 1.33335C12 0.600015 11.4 1.52588e-05 10.6667 1.52588e-05ZM7.04 2.35335C7.23333 2.16002 7.55333 2.16002 7.74667 2.35335L8.33333 2.94002L8.92 2.35335C9.11333 2.16002 9.43333 2.16002 9.62667 2.35335C9.82 2.54668 9.82 2.86668 9.62667 3.06002L9.04 3.64668L9.62667 4.23335C9.82 4.42668 9.82 4.74668 9.62667 4.94002C9.43333 5.13335 9.11333 5.13335 8.92 4.94002L8.33333 4.36002L7.74667 4.94668C7.55333 5.14002 7.23333 5.14002 7.04 4.94668C6.84667 4.75335 6.84667 4.43335 7.04 4.24002L7.62667 3.65335L7.04 3.06668C6.84 2.86668 6.84 2.54668 7.04 2.35335ZM2.66667 3.14668L5 3.14668C5.27333 3.14668 5.5 3.37335 5.5 3.64668C5.5 3.92002 5.27333 4.14668 5 4.14668L2.66667 4.14668C2.39333 4.14668 2.16667 3.92002 2.16667 3.64668C2.16667 3.37335 2.39333 3.14668 2.66667 3.14668ZM5.16667 8.66668H4.33333V9.50002C4.33333 9.77335 4.10667 10 3.83333 10C3.56 10 3.33333 9.77335 3.33333 9.50002V8.66668H2.5C2.22667 8.66668 2 8.44002 2 8.16668C2 7.89335 2.22667 7.66668 2.5 7.66668L3.33333 7.66668L3.33333 6.83335C3.33333 6.56002 3.56 6.33335 3.83333 6.33335C4.10667 6.33335 4.33333 6.56002 4.33333 6.83335V7.66668H5.16667C5.44 7.66668 5.66667 7.89335 5.66667 8.16668C5.66667 8.44002 5.44 8.66668 5.16667 8.66668ZM9.5 9.50002H7.16667C6.89333 9.50002 6.66667 9.27335 6.66667 9.00002C6.66667 8.72668 6.89333 8.50002 7.16667 8.50002H9.5C9.77333 8.50002 10 8.72668 10 9.00002C10 9.27335 9.77333 9.50002 9.5 9.50002ZM9.5 7.83335L7.16667 7.83335C6.89333 7.83335 6.66667 7.60668 6.66667 7.33335C6.66667 7.06002 6.89333 6.83335 7.16667 6.83335L9.5 6.83335C9.77333 6.83335 10 7.06002 10 7.33335C10 7.60668 9.77333 7.83335 9.5 7.83335Z"
              fill="white"
              fillOpacity="0.7"
            />
          </svg>
        </ButtonAction>
      </Row>
    </Column>
  )
}
