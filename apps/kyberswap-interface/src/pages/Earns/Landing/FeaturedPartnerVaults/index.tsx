import { t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { useVaultListQuery } from 'services/vault'

import TokenLogo from 'components/TokenLogo'
import { CardTitleLink } from 'pages/Earns/ExploreVaults/styles'
import {
  PartnerVaultsList,
  VaultCard,
  VaultDepositButton,
  VaultProtocolTag,
} from 'pages/Earns/Landing/FeaturedPartnerVaults/styles'
import ValueSkeleton from 'pages/Earns/components/ValueSkeleton'
import VaultDepositModal from 'pages/Earns/components/VaultDeposit/VaultDepositModal'
import { buildVaultDetailPath, toVaultInfo } from 'pages/Earns/utils/vault'
import { formatDisplayNumber } from 'utils/numbers'

const FEATURED_COUNT = 3

const VaultItemSkeleton = () => (
  <VaultCard>
    <div className="flex w-full items-start justify-between">
      <div className="flex items-center gap-1">
        <ValueSkeleton className="size-6 rounded-full" />
        <ValueSkeleton className="h-6 w-12" />
        <ValueSkeleton className="h-6 w-9" />
      </div>
      <ValueSkeleton className="h-6 w-20" />
    </div>
    <div className="flex w-full items-center justify-between">
      <ValueSkeleton className="h-4 w-32 rounded-lg" />
      <ValueSkeleton className="h-6 w-20 rounded-3xl" />
    </div>
  </VaultCard>
)

const FeaturedPartnerVaults = ({ isLoading: parentLoading }: { isLoading?: boolean }) => {
  const [depositVault, setDepositVault] = useState<{ chainId: number; vaultId: string } | null>(null)

  const { data, isLoading } = useVaultListQuery({
    pageSize: FEATURED_COUNT,
    sorts: 'apy7d:desc',
  })

  const vaults = useMemo(() => (data?.vaults || []).slice(0, FEATURED_COUNT).map(toVaultInfo), [data?.vaults])

  const loading = parentLoading || isLoading

  if (!loading && vaults.length === 0) return null

  return (
    <>
      <PartnerVaultsList>
        {loading
          ? Array.from({ length: FEATURED_COUNT }).map((_, i) => <VaultItemSkeleton key={i} />)
          : vaults.map(vault => {
              return (
                <VaultCard key={vault.id} className="cursor-pointer">
                  <div className="flex w-full items-start justify-between">
                    <CardTitleLink
                      to={buildVaultDetailPath(vault.chainId, vault.id)}
                      className="flex items-center gap-1"
                    >
                      <TokenLogo src={vault.tokenIcon} alt={vault.token} size={24} />
                      <span className="text-base text-text">{vault.token}</span>
                      <span className="text-base text-subText">{t`Yield`}</span>
                    </CardTitleLink>

                    <div className="flex items-center gap-2">
                      <span className="text-base text-subText">{t`APY`}</span>
                      <span className="text-lg font-medium leading-6 text-primary">
                        {vault.apy === undefined
                          ? '--'
                          : `${formatDisplayNumber(vault.apy, { style: 'decimal', fractionDigits: 2 })}%`}
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
                    <VaultDepositButton onClick={() => setDepositVault({ chainId: vault.chainId, vaultId: vault.id })}>
                      {t`+ Deposit`}
                    </VaultDepositButton>
                  </div>
                </VaultCard>
              )
            })}
      </PartnerVaultsList>

      <VaultDepositModal target={depositVault} onClose={() => setDepositVault(null)} />
    </>
  )
}

export default FeaturedPartnerVaults
