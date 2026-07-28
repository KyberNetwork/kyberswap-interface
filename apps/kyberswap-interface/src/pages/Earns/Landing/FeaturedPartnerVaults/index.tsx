import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVaultListQuery } from 'services/vault'

import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
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
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-1">
        <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
        <PositionSkeleton width={40} height={16} />
        <PositionSkeleton width={30} height={16} />
      </div>
      <PositionSkeleton width={80} height={20} />
    </div>
    <div className="flex w-full items-center justify-between">
      <PositionSkeleton width={120} height={18} />
      <PositionSkeleton width={72} height={24} />
    </div>
  </VaultCard>
)

const FeaturedPartnerVaults = ({ isLoading: parentLoading }: { isLoading?: boolean }) => {
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
                className="cursor-pointer"
              >
                <div className="flex w-full items-start justify-between">
                  <div className="flex items-center gap-1">
                    <TokenLogo src={vault.tokenIcon} alt={vault.token} size={24} />
                    <span className="text-base text-text">{vault.token}</span>
                    <span className="text-base text-subText">{vault.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-base text-subText">{t`APY`}</span>
                    <span className="text-lg font-medium leading-6 text-primary">
                      {formatDisplayNumber(vault.apy, { style: 'decimal', fractionDigits: 2 })}%
                    </span>
                  </div>
                </div>

                <div className="flex w-full items-center justify-between">
                  <VaultProtocolTag>
                    <TokenLogo src={vault.partnerLogo} alt={vault.partner} size={12} />
                    <span className="text-xs text-subText">
                      {t`managed by`} {vault.partner}
                    </span>
                  </VaultProtocolTag>
                  <VaultDepositButton onClick={e => e.stopPropagation()}>{t`+ Deposit`}</VaultDepositButton>
                </div>
              </VaultCard>
            )
          })}
    </PartnerVaultsList>
  )
}

export default FeaturedPartnerVaults
