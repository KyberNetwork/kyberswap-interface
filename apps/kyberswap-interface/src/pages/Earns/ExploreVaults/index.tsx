import { t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import Search from 'components/Search'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { ApyBarChart, TvlLineChart } from 'pages/Earns/ExploreVaults/MiniCharts'
import { SAMPLE_VAULTS, VAULT_CHAIN_OPTIONS } from 'pages/Earns/ExploreVaults/sampleData'
import {
  ApyValue,
  CardBody,
  CardFooter,
  CardHeader,
  ChartWrapper,
  DepositButton,
  Disclaimer,
  FilterRow,
  MetricLabel,
  MetricRow,
  ProtocolTag,
  TokenIconWrapper,
  TvlValue,
  VaultCard,
  VaultCardsGrid,
  VaultPageTitle,
  VaultPageWrapper,
  ViewPositionButton,
} from 'pages/Earns/ExploreVaults/styles'
import { VaultInfo } from 'pages/Earns/ExploreVaults/types'
import MultiSelectDropdownMenu from 'pages/Earns/components/DropdownMenu/MultiSelect'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const formatTvl = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 3 })

/** IDs of vaults user has deposited into (mock) */
const USER_DEPOSITED_VAULT_IDS = new Set(['eth-yield-mainnet'])

const ExploreVaultCard = ({ vault }: { vault: VaultInfo }) => {
  const theme = useTheme()
  const hasPosition = USER_DEPOSITED_VAULT_IDS.has(vault.id)

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
              style={{ position: 'absolute', bottom: -2, right: -4 }}
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
          {hasPosition && <ViewPositionButton>{t`View Position`}</ViewPositionButton>}
          <DepositButton $disabled={vault.disabled}>{t`+ Deposit`}</DepositButton>
        </Flex>
      </CardHeader>

      <CardBody>
        <Flex flexDirection="column" style={{ gap: '4px' }}>
          <MetricRow>
            <MetricLabel>APY</MetricLabel>
            <ApyValue>{vault.apy.toFixed(2)}%</ApyValue>
          </MetricRow>
          <ChartWrapper $height={28}>
            <ApyBarChart data={vault.apyHistory} height={28} />
          </ChartWrapper>
        </Flex>

        <Flex flexDirection="column" style={{ gap: '16px' }}>
          <MetricRow>
            <MetricLabel>TVL</MetricLabel>
            <TvlValue>{formatTvl(vault.tvl)}</TvlValue>
          </MetricRow>
          <ChartWrapper $height={49}>
            <TvlLineChart data={vault.tvlHistory} height={49} />
          </ChartWrapper>
        </Flex>

        <CardFooter>
          <ProtocolTag>
            <img src={vault.partnerLogo} alt={vault.partner} width={16} height={16} style={{ borderRadius: '50%' }} />
            <span>{`managed by ${vault.partner}`}</span>
          </ProtocolTag>
        </CardFooter>
      </CardBody>
    </VaultCard>
  )
}

const ExploreVaultCardSkeleton = () => (
  <VaultCard style={{ gap: '16px' }}>
    <Flex alignItems="center" justifyContent="space-between" width="100%">
      <Flex alignItems="center" style={{ gap: '4px' }}>
        <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
        <PositionSkeleton width={40} height={18} />
        <PositionSkeleton width={30} height={18} />
      </Flex>
      <PositionSkeleton width={80} height={28} />
    </Flex>
    <Flex flexDirection="column" style={{ gap: '4px' }}>
      <Flex alignItems="flex-end" style={{ gap: '8px' }}>
        <PositionSkeleton width={30} height={16} />
        <PositionSkeleton width={80} height={32} />
      </Flex>
      <PositionSkeleton width="100%" height={28} />
    </Flex>
    <Flex flexDirection="column" style={{ gap: '16px' }}>
      <Flex alignItems="flex-end" style={{ gap: '8px' }}>
        <PositionSkeleton width={30} height={16} />
        <PositionSkeleton width={60} height={24} />
      </Flex>
      <PositionSkeleton width="100%" height={49} />
    </Flex>
    <PositionSkeleton width={140} height={22} />
  </VaultCard>
)

const ExploreVaults = () => {
  const [search, setSearch] = useState('')
  const [selectedChain, setSelectedChain] = useState('')
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const filteredVaults = useMemo(() => {
    let result = SAMPLE_VAULTS

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
      <VaultPageTitle>{t`Explore`}</VaultPageTitle>

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
          ? Array.from({ length: 6 }).map((_, i) => <ExploreVaultCardSkeleton key={i} />)
          : filteredVaults.map(vault => <ExploreVaultCard key={vault.id} vault={vault} />)}
      </VaultCardsGrid>

      <Disclaimer>{t`Partner-managed vaults. Auto-compounding. Native withdrawals are not instant.`}</Disclaimer>
    </VaultPageWrapper>
  )
}

export default ExploreVaults
