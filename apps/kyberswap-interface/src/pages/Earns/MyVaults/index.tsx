import { t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { VaultPendingWithdrawalStatus, useVaultPositionsQuery } from 'services/vault'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/earn/ic_earn_not_found.svg'
import MultiSelectDropdownMenu from 'components/DropdownMenu/MultiSelect'
import SelectedOptionsLabel from 'components/DropdownMenu/SelectedOptionsLabel'
import Search from 'components/Search'
import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import {
  ApyTvlRow,
  CardActions,
  CardFooterRow,
  CardHeader,
  CardTitleLink,
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
  ProtocolTag,
  StatusBadge,
  TokenIconWrapper,
  VaultCard,
  VaultCardsGrid,
  VaultPageTitle,
  VaultPageWrapper,
  WithdrawButton,
} from 'pages/Earns/ExploreVaults/styles'
import { UserVaultPosition } from 'pages/Earns/ExploreVaults/types'
import { PositionAction as PositionActionBtn } from 'pages/Earns/PositionDetail/styles'
import AnimatedNumber from 'pages/Earns/components/AnimatedNumber'
import ValueSkeleton from 'pages/Earns/components/ValueSkeleton'
import VaultDepositModal from 'pages/Earns/components/VaultDeposit/VaultDepositModal'
import VaultWithdrawModal from 'pages/Earns/components/VaultWithdraw/VaultWithdrawModal'
import { VAULT_POLLING_INTERVAL } from 'pages/Earns/constants/vault'
import { VAULT_CHAIN_OPTIONS } from 'pages/Earns/constants/vaultFilters'
import { useRefreshOnVaultTx } from 'pages/Earns/hooks/useRefreshOnVaultTx'
import { buildVaultDetailPath, safeBigInt, toUserVaultPosition } from 'pages/Earns/utils/vault'
import { formatVaultApy, formatVaultTvl } from 'pages/Earns/utils/vaultFormat'
import { useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { Colors } from 'theme/color'
import { formatDisplayNumber } from 'utils/numbers'

const formatUsd = (value?: number) =>
  value === undefined ? '--' : formatDisplayNumber(value, { style: 'currency', significantDigits: 4 })

/** Earnings carry a sign: a NAV loss, or a USD return the token price moved against, is real. */
const formatSignedUsd = (value?: number) =>
  value === undefined
    ? '--'
    : formatDisplayNumber(value, { style: 'currency', significantDigits: 4, allowDisplayNegative: true })

const formatAmount = (value?: number) =>
  value === undefined ? '--' : formatDisplayNumber(value, { style: 'decimal', significantDigits: 4 })

const formatSignedAmount = (value?: number) =>
  value === undefined
    ? '--'
    : formatDisplayNumber(value, { style: 'decimal', significantDigits: 4, allowDisplayNegative: true })

const SEARCH_DEBOUNCE_MS = 300

/** Keyed by the wire names the position summary uses, which differ from the ones the request
 *  endpoints return. A status with no entry is not worth a badge. */
const getStatusConfig = (theme: Colors): Record<string, { label: string; color: string } | null> => ({
  [VaultPendingWithdrawalStatus.REQUESTED]: { label: 'Requested', color: theme.blue3 },
  [VaultPendingWithdrawalStatus.PENDING]: { label: 'Pending', color: theme.warning },
  [VaultPendingWithdrawalStatus.EXPIRED]: { label: 'Expired', color: theme.red },
  [VaultPendingWithdrawalStatus.COMPLETED]: { label: 'Completed', color: theme.subText },
})

const MyVaultCard = ({
  vault,
  onDeposit,
  onWithdraw,
  revealIndex,
}: {
  vault: UserVaultPosition
  onDeposit: (vault: UserVaultPosition) => void
  onWithdraw: (vault: UserVaultPosition) => void
  /** Position in the list, used to stagger the entrance; omitted when the card should just appear. */
  revealIndex?: number
}) => {
  const theme = useTheme()
  // The card carries the position's own summary of the queue; the full request list, with its
  // amounts and cancel actions, lives on the vault page and in the withdraw modal.
  const pending = vault.pendingWithdrawal
  const statusConfig = pending ? getStatusConfig(theme)[pending.status] ?? null : null
  const requestCount = pending?.count ?? 0
  // The shares the wallet still holds, which is what a withdrawal spends — not the card's underlying
  // equivalent, a figure the API leaves at zero whenever it cannot price the vault's asset.
  const hasShares = safeBigInt(vault.shareBalanceRaw) > 0n

  return (
    <VaultCard $clickable $revealIndex={revealIndex}>
      <CardHeader>
        <CardTitleLink
          to={buildVaultDetailPath(vault.chainId, vault.id)}
          // Tells the Earn sidebar which vault section this detail page belongs to.
          state={{ from: APP_PATHS.EARN_MY_VAULTS }}
          className="flex items-center gap-1"
        >
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
          <span className="text-base text-gray">{t`Yield`}</span>
        </CardTitleLink>

        <CardActions>
          <WithdrawButton type="button" $disabled={!hasShares} disabled={!hasShares} onClick={() => onWithdraw(vault)}>
            {t`Withdraw`}
          </WithdrawButton>
          <DepositButton type="button" onClick={() => onDeposit(vault)}>
            {t`+ Deposit`}
          </DepositButton>
        </CardActions>
      </CardHeader>

      <MyVaultCardBody>
        <InfoRow>
          <InfoLabel>{t`Your Balance`}</InfoLabel>
          <InfoValue>
            <InfoValuePrimary>
              <TokenLogo src={vault.tokenIcon} alt={vault.token} size={20} />
              <AnimatedNumber value={formatAmount(vault.balance)} />
              <span>{vault.token}</span>
            </InfoValuePrimary>
            <InfoValueSecondary>
              <AnimatedNumber value={formatUsd(vault.balanceUsd)} />
            </InfoValueSecondary>
          </InfoValue>
        </InfoRow>

        <InfoRow>
          <InfoLabel>{t`Earned`}</InfoLabel>
          <InfoValue>
            <InfoValuePrimary>
              <TokenLogo src={vault.tokenIcon} alt={vault.token} size={20} />
              <AnimatedNumber value={formatSignedAmount(vault.earned)} />
              <span>{vault.token}</span>
            </InfoValuePrimary>
            <InfoValueSecondary>
              <AnimatedNumber value={formatSignedUsd(vault.earnedUsd)} />
            </InfoValueSecondary>
          </InfoValue>
        </InfoRow>

        <ApyTvlRow>
          <FooterMetric>
            <FooterMetricLabel>APY</FooterMetricLabel>
            <span className="text-base font-normal text-primary">
              <AnimatedNumber value={formatVaultApy(vault.apy)} />
            </span>
          </FooterMetric>
          <FooterMetric>
            <FooterMetricLabel>TVL</FooterMetricLabel>
            <span className="text-base text-white2">
              <AnimatedNumber value={formatVaultTvl(vault.tvl)} />
            </span>
          </FooterMetric>
        </ApyTvlRow>

        {/* The card says how much is in flight; the badge below carries the status, and the vault
            page lists each request with the time it has left. */}
        {pending ? (
          <InfoRow>
            <InfoLabel>{t`Withdrawing`}</InfoLabel>
            <InfoValue>
              <InfoValuePrimary>{requestCount > 1 ? t`${requestCount} requests` : t`1 request`}</InfoValuePrimary>
            </InfoValue>
          </InfoRow>
        ) : null}

        <CardFooterRow>
          <ProtocolTag>
            {vault.partnerLogo ? (
              <img src={vault.partnerLogo} alt={vault.partner} width={16} height={16} style={{ borderRadius: '50%' }} />
            ) : null}
            <span>
              {t`managed by`} {vault.partner}
            </span>
          </ProtocolTag>
          {statusConfig && <StatusBadge $color={statusConfig.color}>{statusConfig.label}</StatusBadge>}
        </CardFooterRow>
      </MyVaultCardBody>
    </VaultCard>
  )
}

const MyVaultCardSkeleton = () => (
  <VaultCard>
    <CardHeader>
      <div className="flex items-center gap-1">
        <ValueSkeleton className="size-6 rounded-full" />
        <ValueSkeleton className="ml-1 h-6 w-12" />
        <ValueSkeleton className="h-6 w-8" />
      </div>
      {/* Narrow enough that the two of them stay on the title's line, as the real buttons do. */}
      <CardActions>
        <ValueSkeleton className="h-[34px] w-20 rounded-3xl" />
        <ValueSkeleton className="h-[34px] w-20 rounded-3xl" />
      </CardActions>
    </CardHeader>

    {/* Balance and Earned; a card with a request in flight adds a row between the metrics and the
        partner tag, which the column absorbs without moving the tag off the bottom. */}
    <MyVaultCardBody>
      {Array.from({ length: 2 }, (_, index) => (
        <InfoRow key={index}>
          <ValueSkeleton className="h-6 w-24" />
          <InfoValue>
            <ValueSkeleton className="h-6 w-32" />
            <ValueSkeleton className="h-6 w-20" />
          </InfoValue>
        </InfoRow>
      ))}

      <ApyTvlRow>
        <ValueSkeleton className="h-6 w-24" />
        <ValueSkeleton className="h-6 w-24" />
      </ApyTvlRow>
      <CardFooterRow>
        <ValueSkeleton className="h-6 w-40 rounded-lg" />
      </CardFooterRow>
    </MyVaultCardBody>
  </VaultCard>
)

const MyVaults = () => {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS)
  const [selectedChain, setSelectedChain] = useState('')
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const [depositVault, setDepositVault] = useState<UserVaultPosition | null>(null)
  const [withdrawVault, setWithdrawVault] = useState<UserVaultPosition | null>(null)

  const { data, isLoading, refetch } = useVaultPositionsQuery(
    {
      userAddress: (account || '').toLowerCase(),
      chainIds: selectedChain || undefined,
      keyword: debouncedSearch.trim() || undefined,
      pageSize: 100,
    },
    { skip: !account, pollingInterval: VAULT_POLLING_INTERVAL },
  )

  const filteredVaults = useMemo<UserVaultPosition[]>(
    () => (data?.positions || []).map(toUserVaultPosition),
    [data?.positions],
  )

  // The user's own transactions refresh at once rather than waiting for the next poll.
  useRefreshOnVaultTx(refetch)

  const showEmptyState = !account || (!isLoading && filteredVaults.length === 0)

  return (
    <VaultPageWrapper>
      <VaultPageTitle>{t`My Vaults`}</VaultPageTitle>

      <FilterRow>
        <MultiSelectDropdownMenu
          alignItems="flex-start"
          highlightOnSelect
          label={
            <SelectedOptionsLabel
              options={VAULT_CHAIN_OPTIONS}
              value={selectedChain}
              allLabel={VAULT_CHAIN_OPTIONS[0].label}
              manyLabel={count => t`Selected: ${count} chains`}
            />
          }
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
            : filteredVaults.map((vault, index) => (
                <MyVaultCard
                  key={vault.id}
                  vault={vault}
                  onDeposit={setDepositVault}
                  onWithdraw={setWithdrawVault}
                  revealIndex={index}
                />
              ))}
        </VaultCardsGrid>
      )}

      <Disclaimer>{t`Partner-managed vaults. Auto-compounding. Native withdrawals are not instant.`}</Disclaimer>

      <VaultDepositModal
        target={depositVault ? { chainId: depositVault.chainId, vaultId: depositVault.vaultId } : null}
        onClose={() => setDepositVault(null)}
        onDeposited={refetch}
      />

      <VaultWithdrawModal
        target={withdrawVault ? { chainId: withdrawVault.chainId, vaultId: withdrawVault.vaultId } : null}
        onClose={() => setWithdrawVault(null)}
        onWithdrawn={refetch}
      />
    </VaultPageWrapper>
  )
}

export default MyVaults
