import { t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { useVaultPositionsQuery } from 'services/vault'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/earn/ic_earn_not_found.svg'
import MultiSelectDropdownMenu from 'components/DropdownMenu/MultiSelect'
import Search from 'components/Search'
import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { VAULT_CHAIN_OPTIONS } from 'pages/Earns/ExploreVaults/sampleData'
import {
  ApyTvlRow,
  CardFooterRow,
  CardHeader,
  DepositButton,
  Disclaimer,
  EmptyStateLink,
  EmptyStateSubtitle,
  EmptyStateTitle,
  EmptyStateWrapper,
  FilterRow,
  FooterMetric,
  FooterMetricLabel,
  InfoLabel,
  InfoRow,
  InfoValue,
  InfoValuePrimary,
  InfoValueSecondary,
  MyVaultCardBody,
  MyVaultFooter,
  ProtocolTag,
  StatusBadge,
  TokenIconWrapper,
  TxLink,
  VaultCard,
  VaultCardsGrid,
  VaultPageTitle,
  VaultPageWrapper,
  WithdrawButton,
} from 'pages/Earns/ExploreVaults/styles'
import { UserVaultPosition, WithdrawalStatus } from 'pages/Earns/ExploreVaults/types'
import { PositionAction as PositionActionBtn } from 'pages/Earns/PositionDetail/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { toUserVaultPosition } from 'pages/Earns/utils/vault'
import { useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { Colors } from 'theme/color'
import { shortenHash } from 'utils/address'
import { formatDisplayNumber } from 'utils/numbers'

const formatTvl = (value: number) => formatDisplayNumber(value, { style: 'decimal', significantDigits: 3 })

const formatUsd = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 4 })

const formatBalance = (value: number, token: string) =>
  `${formatDisplayNumber(value, { style: 'decimal', significantDigits: 4 })} ${token}`

const getStatusConfig = (theme: Colors): Record<WithdrawalStatus, { label: string; color: string } | null> => ({
  [WithdrawalStatus.NONE]: null,
  [WithdrawalStatus.REQUESTED]: { label: 'Requested', color: theme.blue3 },
  [WithdrawalStatus.PENDING]: { label: 'Pending', color: theme.warning },
  [WithdrawalStatus.COMPLETED]: { label: 'Completed', color: theme.primary },
})

const useCountdown = (totalSeconds: number) => {
  const [remaining, setRemaining] = useState(totalSeconds)

  useEffect(() => {
    if (totalSeconds <= 0) return
    setRemaining(totalSeconds)
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [totalSeconds])

  if (totalSeconds <= 0 || remaining <= 0) return '--'

  const d = Math.floor(remaining / 86400)
  const h = Math.floor((remaining % 86400) / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  const s = remaining % 60

  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0 || d > 0) parts.push(`${h}h`)
  parts.push(`${m}m`)
  parts.push(`${s}s`)

  return parts.join(' : ')
}

const isWithdrawDisabled = (status: WithdrawalStatus) =>
  status === WithdrawalStatus.REQUESTED || status === WithdrawalStatus.PENDING

const MyVaultCard = ({ vault }: { vault: UserVaultPosition }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const countdown = useCountdown(vault.processingTimeSeconds)
  const statusConfig = getStatusConfig(theme)[vault.withdrawalStatus]
  const isCompleted = vault.withdrawalStatus === WithdrawalStatus.COMPLETED

  const goToDetail = () =>
    navigate(APP_PATHS.EARN_VAULT_DETAIL.replace(':chainId', String(vault.chainId)).replace(':vaultId', vault.id))

  return (
    <VaultCard
      role="button"
      tabIndex={0}
      $clickable
      onClick={goToDetail}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          goToDetail()
        }
      }}
    >
      <CardHeader>
        <div className="flex items-center gap-1">
          <TokenIconWrapper>
            <TokenLogo src={vault.tokenIcon} alt={vault.token} size={24} />
            <TokenLogo
              src={vault.chainIcon}
              alt={vault.chainName}
              size={12}
              style={{ position: 'absolute', bottom: -2, right: -4, borderRadius: 4 }}
            />
          </TokenIconWrapper>
          <span className="ml-1 text-base text-white2">{vault.token}</span>
          <span className="text-base text-gray">{vault.label}</span>
        </div>

        <div className="flex items-center gap-3">
          <WithdrawButton
            type="button"
            $disabled={isWithdrawDisabled(vault.withdrawalStatus)}
            disabled={isWithdrawDisabled(vault.withdrawalStatus)}
            onClick={e => {
              e.stopPropagation()
              goToDetail()
            }}
          >
            {t`Withdraw`}
          </WithdrawButton>
          <DepositButton
            type="button"
            onClick={e => {
              e.stopPropagation()
              goToDetail()
            }}
          >
            {t`+ Deposit`}
          </DepositButton>
        </div>
      </CardHeader>

      <MyVaultCardBody>
        <InfoRow>
          <InfoLabel>{t`Your Balance`}</InfoLabel>
          <InfoValue>
            <InfoValuePrimary>
              <TokenLogo src={vault.tokenIcon} alt={vault.token} size={20} />
              {formatBalance(vault.balance, vault.token)}
            </InfoValuePrimary>
            <InfoValueSecondary>{formatUsd(vault.balanceUsd)}</InfoValueSecondary>
          </InfoValue>
        </InfoRow>

        <InfoRow>
          <InfoLabel>{t`Earned`}</InfoLabel>
          <InfoValue>
            <InfoValuePrimary>
              <TokenLogo src={vault.tokenIcon} alt={vault.token} size={20} />
              {formatBalance(vault.earned, vault.token)}
            </InfoValuePrimary>
            <InfoValueSecondary>{formatUsd(vault.earnedUsd)}</InfoValueSecondary>
          </InfoValue>
        </InfoRow>

        {isCompleted ? (
          <>
            {vault.completedAt && (
              <InfoRow>
                <InfoLabel>{t`Timestamp`}</InfoLabel>
                <InfoValue>
                  <InfoValuePrimary>{vault.completedAt}</InfoValuePrimary>
                </InfoValue>
              </InfoRow>
            )}
            {vault.txHash && (
              <InfoRow>
                <InfoLabel>{t`Txn`}</InfoLabel>
                <InfoValue>
                  <TxLink>{shortenHash(vault.txHash)}</TxLink>
                </InfoValue>
              </InfoRow>
            )}
          </>
        ) : vault.processingTimeSeconds > 0 ? (
          <InfoRow>
            <InfoLabel>{t`Processing Time`}</InfoLabel>
            <InfoValue>
              <InfoValuePrimary>{countdown}</InfoValuePrimary>
            </InfoValue>
          </InfoRow>
        ) : null}
      </MyVaultCardBody>

      <MyVaultFooter>
        <ApyTvlRow>
          <FooterMetric>
            <FooterMetricLabel>APY</FooterMetricLabel>
            <span className="text-base font-normal text-primary">{vault.apy.toFixed(2)}%</span>
          </FooterMetric>
          <FooterMetric>
            <FooterMetricLabel>TVL</FooterMetricLabel>
            <span className="text-base text-white2">{formatTvl(vault.tvl)}</span>
          </FooterMetric>
        </ApyTvlRow>

        <CardFooterRow>
          <ProtocolTag>
            <img src={vault.partnerLogo} alt={vault.partner} width={16} height={16} style={{ borderRadius: '50%' }} />
            <span>
              {t`managed by`} {vault.partner}
            </span>
          </ProtocolTag>
          {statusConfig && <StatusBadge $color={statusConfig.color}>{statusConfig.label}</StatusBadge>}
        </CardFooterRow>
      </MyVaultFooter>
    </VaultCard>
  )
}

const MyVaultCardSkeleton = () => (
  <VaultCard className="gap-3">
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-1">
        <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
        <PositionSkeleton width={40} height={18} />
        <PositionSkeleton width={30} height={18} />
      </div>
      <div className="flex items-center gap-2">
        <PositionSkeleton width={72} height={28} />
        <PositionSkeleton width={80} height={28} />
      </div>
    </div>
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex justify-between">
        <PositionSkeleton width={80} height={16} />
        <PositionSkeleton width={100} height={16} />
      </div>
      <div className="flex justify-between">
        <PositionSkeleton width={50} height={16} />
        <PositionSkeleton width={80} height={16} />
      </div>
      <div className="flex justify-between">
        <PositionSkeleton width={100} height={16} />
        <PositionSkeleton width={120} height={16} />
      </div>
    </div>
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <PositionSkeleton width={80} height={16} />
        <PositionSkeleton width={80} height={16} />
      </div>
      <PositionSkeleton width={140} height={22} />
    </div>
  </VaultCard>
)

const MyVaults = () => {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const [search, setSearch] = useState('')
  const [selectedChain, setSelectedChain] = useState('')
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { data, isLoading } = useVaultPositionsQuery(
    {
      userAddress: (account || '').toLowerCase(),
      chainIds: selectedChain || undefined,
      keyword: search.trim() || undefined,
      pageSize: 100,
    },
    { skip: !account },
  )

  const filteredVaults = useMemo<UserVaultPosition[]>(
    () => (data?.positions || []).map(toUserVaultPosition),
    [data?.positions],
  )

  const chainLabel = useMemo(() => {
    const selected = VAULT_CHAIN_OPTIONS.find(c => c.value === selectedChain)
    return selected?.label || VAULT_CHAIN_OPTIONS[0].label
  }, [selectedChain])

  const showEmptyState = !account || (!isLoading && filteredVaults.length === 0)

  return (
    <VaultPageWrapper>
      <VaultPageTitle>{t`My Vaults`}</VaultPageTitle>

      <FilterRow>
        <MultiSelectDropdownMenu
          alignItems="flex-start"
          highlightOnSelect
          label={chainLabel}
          options={VAULT_CHAIN_OPTIONS}
          value={selectedChain}
          onChange={value => setSelectedChain(value.toString())}
        />

        <Search
          placeholder={t`Search by token or vaults`}
          searchValue={search}
          onSearch={setSearch}
          style={{ height: '36px', width: upToSmall ? '100%' : '400px' }}
        />
      </FilterRow>

      {showEmptyState ? (
        <EmptyStateWrapper>
          <IconEarnNotFound />
          <EmptyStateTitle>{t`You don't have any vault positions yet`}</EmptyStateTitle>
          <EmptyStateSubtitle>
            <EmptyStateLink as={Link} to={APP_PATHS.EARN_VAULTS}>
              {t`Explore Vaults to get started`}
            </EmptyStateLink>
          </EmptyStateSubtitle>
          {!account && <PositionActionBtn onClick={toggleWalletModal}>{t`Connect Wallet`}</PositionActionBtn>}
        </EmptyStateWrapper>
      ) : (
        <VaultCardsGrid>
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <MyVaultCardSkeleton key={i} />)
            : filteredVaults.map(vault => <MyVaultCard key={vault.id} vault={vault} />)}
        </VaultCardsGrid>
      )}

      <Disclaimer>{t`Partner-managed vaults. Auto-compounding. Native withdrawals are not instant.`}</Disclaimer>
    </VaultPageWrapper>
  )
}

export default MyVaults
