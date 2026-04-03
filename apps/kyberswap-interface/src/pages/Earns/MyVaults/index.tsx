import { t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { DefaultTheme } from 'styled-components'

import Search from 'components/Search'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { SAMPLE_USER_VAULTS, VAULT_CHAIN_OPTIONS } from 'pages/Earns/ExploreVaults/sampleData'
import {
  ApyTvlRow,
  CardFooterRow,
  CardHeader,
  DepositButton,
  Disclaimer,
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
import MultiSelectDropdownMenu from 'pages/Earns/components/DropdownMenu/MultiSelect'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { MEDIA_WIDTHS } from 'theme'
import { shortenHash } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

const formatTvl = (value: number) => formatDisplayNumber(value, { style: 'decimal', significantDigits: 3 })

const formatUsd = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 4 })

const formatBalance = (value: number, token: string) =>
  `${formatDisplayNumber(value, { style: 'decimal', significantDigits: 4 })} ${token}`

const getStatusConfig = (theme: DefaultTheme): Record<WithdrawalStatus, { label: string; color: string } | null> => ({
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
  const countdown = useCountdown(vault.processingTimeSeconds)
  const statusConfig = getStatusConfig(theme)[vault.withdrawalStatus]
  const isCompleted = vault.withdrawalStatus === WithdrawalStatus.COMPLETED

  return (
    <VaultCard>
      <CardHeader>
        <Flex alignItems="center" style={{ gap: '4px' }}>
          <TokenIconWrapper>
            <TokenLogo src={vault.tokenIcon} alt={vault.token} size={24} />
            <TokenLogo
              src={vault.chainIcon}
              alt={vault.chainName}
              size={12}
              style={{ position: 'absolute', bottom: -2, right: -4, borderRadius: 4, border: '1px solid #141414' }}
            />
          </TokenIconWrapper>
          <Text fontSize={16} color={theme.white2} style={{ marginLeft: '4px' }}>
            {vault.token}
          </Text>
          <Text fontSize={16} color={theme.gray}>
            {vault.label}
          </Text>
        </Flex>

        <Flex alignItems="center" style={{ gap: '12px' }}>
          <WithdrawButton $disabled={isWithdrawDisabled(vault.withdrawalStatus)}>{t`Withdraw`}</WithdrawButton>
          <DepositButton>{t`+ Deposit`}</DepositButton>
        </Flex>
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
            <Text color={theme.primary} fontWeight={400} fontSize={16}>
              {vault.apy.toFixed(2)}%
            </Text>
          </FooterMetric>
          <FooterMetric>
            <FooterMetricLabel>TVL</FooterMetricLabel>
            <Text color={theme.white2} fontSize={16}>
              {formatTvl(vault.tvl)}
            </Text>
          </FooterMetric>
        </ApyTvlRow>

        <CardFooterRow>
          <ProtocolTag>
            <img src={vault.partnerLogo} alt={vault.partner} width={16} height={16} style={{ borderRadius: '50%' }} />
            <span>{`managed by ${vault.partner}`}</span>
          </ProtocolTag>
          {statusConfig && <StatusBadge $color={statusConfig.color}>{statusConfig.label}</StatusBadge>}
        </CardFooterRow>
      </MyVaultFooter>
    </VaultCard>
  )
}

const MyVaultCardSkeleton = () => (
  <VaultCard style={{ gap: '12px' }}>
    <Flex alignItems="center" justifyContent="space-between" width="100%">
      <Flex alignItems="center" style={{ gap: '4px' }}>
        <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
        <PositionSkeleton width={40} height={18} />
        <PositionSkeleton width={30} height={18} />
      </Flex>
      <Flex alignItems="center" style={{ gap: '8px' }}>
        <PositionSkeleton width={72} height={28} />
        <PositionSkeleton width={80} height={28} />
      </Flex>
    </Flex>
    <Flex flexDirection="column" style={{ gap: '12px', flex: 1 }}>
      <Flex justifyContent="space-between">
        <PositionSkeleton width={80} height={16} />
        <PositionSkeleton width={100} height={16} />
      </Flex>
      <Flex justifyContent="space-between">
        <PositionSkeleton width={50} height={16} />
        <PositionSkeleton width={80} height={16} />
      </Flex>
      <Flex justifyContent="space-between">
        <PositionSkeleton width={100} height={16} />
        <PositionSkeleton width={120} height={16} />
      </Flex>
    </Flex>
    <Flex flexDirection="column" style={{ gap: '8px' }}>
      <Flex justifyContent="space-between">
        <PositionSkeleton width={80} height={16} />
        <PositionSkeleton width={80} height={16} />
      </Flex>
      <PositionSkeleton width={140} height={22} />
    </Flex>
  </VaultCard>
)

const MyVaults = () => {
  const [search, setSearch] = useState('')
  const [selectedChain, setSelectedChain] = useState('')
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const filteredVaults = useMemo(() => {
    let result = SAMPLE_USER_VAULTS

    if (selectedChain) {
      result = result.filter(v => v.chainId.toString() === selectedChain)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        v =>
          v.token.toLowerCase().includes(q) ||
          v.partner.toLowerCase().includes(q) ||
          v.chainName.toLowerCase().includes(q),
      )
    }

    return result
  }, [search, selectedChain])

  const chainLabel = useMemo(() => {
    const selected = VAULT_CHAIN_OPTIONS.find(c => c.value === selectedChain)
    return selected?.label || VAULT_CHAIN_OPTIONS[0].label
  }, [selectedChain])

  const isLoading = false

  return (
    <VaultPageWrapper>
      <VaultPageTitle>{t`My Vaults`}</VaultPageTitle>

      <FilterRow>
        <MultiSelectDropdownMenu
          alignLeft
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

      <VaultCardsGrid>
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <MyVaultCardSkeleton key={i} />)
          : filteredVaults.map(vault => <MyVaultCard key={vault.id} vault={vault} />)}
      </VaultCardsGrid>

      <Disclaimer>{t`Partner-managed vaults. Auto-compounding. Native withdrawals are not instant.`}</Disclaimer>
    </VaultPageWrapper>
  )
}

export default MyVaults
