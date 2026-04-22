import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { useVaultListQuery } from 'services/vault'

import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import {
  PartnerVaultsList,
  VaultCard,
  VaultDepositButton,
  VaultProtocolTag,
} from 'pages/Earns/Landing/FeaturedPartnerVaults/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { toVaultInfo } from 'pages/Earns/utils/vault'
import { formatDisplayNumber } from 'utils/numbers'

const FEATURED_COUNT = 3

const VaultItemSkeleton = () => (
  <VaultCard>
    <Flex alignItems="center" justifyContent="space-between" width="100%">
      <Flex alignItems="center" sx={{ gap: '4px' }}>
        <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
        <PositionSkeleton width={40} height={16} />
        <PositionSkeleton width={30} height={16} />
      </Flex>
      <PositionSkeleton width={80} height={20} />
    </Flex>
    <Flex alignItems="center" justifyContent="space-between" width="100%">
      <PositionSkeleton width={120} height={18} />
      <PositionSkeleton width={72} height={24} />
    </Flex>
  </VaultCard>
)

const FeaturedPartnerVaults = ({ isLoading: parentLoading }: { isLoading?: boolean }) => {
  const theme = useTheme()
  const navigate = useNavigate()

  const { data, isLoading } = useVaultListQuery({
    pageSize: FEATURED_COUNT,
    sorts: 'apy7d:desc',
  })

  const vaults = useMemo(() => (data?.vaults || []).slice(0, FEATURED_COUNT).map(toVaultInfo), [data?.vaults])

  const loading = parentLoading || isLoading

  if (!loading && vaults.length === 0) return null

  return (
    <PartnerVaultsList>
      {loading
        ? Array.from({ length: FEATURED_COUNT }).map((_, i) => <VaultItemSkeleton key={i} />)
        : vaults.map(vault => {
            const goToDetail = () =>
              navigate(
                APP_PATHS.EARN_VAULT_DETAIL.replace(':chainId', String(vault.chainId)).replace(':vaultId', vault.id),
              )
            return (
              <VaultCard
                key={vault.id}
                role="button"
                tabIndex={0}
                onClick={goToDetail}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    goToDetail()
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <Flex alignItems="flex-start" justifyContent="space-between" width="100%">
                  <Flex alignItems="center" sx={{ gap: '4px' }}>
                    <TokenLogo src={vault.tokenIcon} alt={vault.token} size={24} />
                    <Text fontSize={16} color={theme.text}>
                      {vault.token}
                    </Text>
                    <Text fontSize={16} color={theme.subText}>
                      {vault.label}
                    </Text>
                  </Flex>

                  <Flex alignItems="center" sx={{ gap: '8px' }}>
                    <Text fontSize={16} color={theme.subText}>
                      {t`APY`}
                    </Text>
                    <Text fontSize={18} color={theme.primary} fontWeight={500} lineHeight="24px">
                      {formatDisplayNumber(vault.apy, { style: 'decimal', fractionDigits: 2 })}%
                    </Text>
                  </Flex>
                </Flex>

                <Flex alignItems="center" justifyContent="space-between" width="100%">
                  <VaultProtocolTag>
                    <TokenLogo src={vault.partnerLogo} alt={vault.partner} size={12} />
                    <Text fontSize={12} color={theme.subText}>
                      {t`managed by`} {vault.partner}
                    </Text>
                  </VaultProtocolTag>
                  <VaultDepositButton onClick={e => e.stopPropagation()}>{t`+ Deposit`}</VaultDepositButton>
                </Flex>
              </VaultCard>
            )
          })}
    </PartnerVaultsList>
  )
}

export default FeaturedPartnerVaults
