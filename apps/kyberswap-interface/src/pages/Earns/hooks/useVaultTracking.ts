import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { createContext, useCallback, useContext, useMemo } from 'react'
import { VaultApiDetailItem } from 'services/vault'

import { NETWORKS_INFO } from 'constants/networks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { UserVaultPosition, VaultInfo } from 'pages/Earns/ExploreVaults/types'
import { financialNumber } from 'pages/Earns/utils/vault'

/** The surface a vault flow was opened from. Every vault event carries it, so each funnel step splits by it. */
export type VaultTrackingSource = 'landing' | 'explore' | 'my_vaults' | 'details'

/** Set by the surface hosting a vault form, so the form and everything inside it report the same source. */
export const VaultTrackingSourceContext = createContext<VaultTrackingSource | undefined>(undefined)

/** Tags a vault approval's `Token Approval *` events. Module constants, so the approve callbacks stay stable. */
export const VAULT_DEPOSIT_APPROVAL_TRACKING = { source: 'vault_deposit' }
export const VAULT_WITHDRAW_APPROVAL_TRACKING = { source: 'vault_withdraw' }

/** What names a vault on its events, read from whichever shape the surface holds it in. */
export type VaultTrackingTarget = {
  vaultId: string
  name: string
  address: string
  provider: string
  chainId: number
  chainName?: string
}

export const vaultTargetFromDetail = (vault: VaultApiDetailItem): VaultTrackingTarget => ({
  vaultId: vault.vaultId,
  name: vault.name,
  address: vault.vaultAddress,
  provider: vault.provider?.name ?? '',
  chainId: vault.chain?.id ?? 0,
  chainName: vault.chain?.name,
})

export const vaultTargetFromInfo = (vault: VaultInfo): VaultTrackingTarget => ({
  vaultId: vault.id,
  name: vault.label,
  address: vault.vaultAddress,
  provider: vault.partner,
  chainId: vault.chainId,
  chainName: vault.chainName,
})

/** The chain as the swap events name it ("Ethereum"); the vault API spells it in lower case. */
export const getVaultTrackingChain = (target: VaultTrackingTarget) =>
  NETWORKS_INFO[target.chainId as ChainId]?.name ?? target.chainName ?? ''

export const getVaultTrackingProps = (target: VaultTrackingTarget, source?: VaultTrackingSource) => ({
  vault_id: target.vaultId,
  vault_name: target.name,
  vault_address: target.address,
  vault_provider: target.provider,
  chain: getVaultTrackingChain(target),
  source,
})

/** Token addresses as the swap events send them: the native placeholder reads `NATIVE`. */
export const toTrackingTokenAddress = (address: string) =>
  address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ? 'NATIVE' : address

export const getVaultApy = (vault: VaultApiDetailItem) => financialNumber(vault.stats?.canonicalMetrics?.apy7d)

export const getVaultTvlUsd = (vault: VaultApiDetailItem) =>
  financialNumber(vault.stats?.canonicalMetrics?.current?.tvl)

/**
 * Sends vault events with the vault and its source already filled in. The source defaults to the one
 * the hosting surface provides.
 */
export const useVaultTracking = (target: VaultTrackingTarget | undefined, source?: VaultTrackingSource) => {
  const { trackingHandler } = useTracking()
  const contextSource = useContext(VaultTrackingSourceContext)
  const resolvedSource = source ?? contextSource

  const props = useMemo(
    () => (target ? getVaultTrackingProps(target, resolvedSource) : undefined),
    [target, resolvedSource],
  )

  const track = useCallback(
    (type: TRACKING_EVENT_TYPE, payload?: Record<string, unknown>) => {
      if (!props) return
      trackingHandler(type, { ...props, ...payload })
    },
    [trackingHandler, props],
  )

  return { track, props, trackingHandler }
}

/** The clicks that open a vault flow from a card, where the vault is known by its list entry. */
export const useVaultCardTracking = (source: VaultTrackingSource) => {
  const { trackingHandler } = useTracking()

  const trackDepositClick = useCallback(
    (vault: VaultInfo) =>
      trackingHandler(TRACKING_EVENT_TYPE.VAULT_DEPOSIT_CLICKED, {
        ...getVaultTrackingProps(vaultTargetFromInfo(vault), source),
        vault_apy: vault.apy,
        vault_tvl_usd: vault.tvl,
      }),
    [trackingHandler, source],
  )

  const trackWithdrawClick = useCallback(
    (vault: UserVaultPosition) =>
      trackingHandler(TRACKING_EVENT_TYPE.VAULT_WITHDRAW_CLICKED, {
        ...getVaultTrackingProps(vaultTargetFromInfo(vault), source),
        share_balance_usd: vault.shareBalanceUsd,
        has_pending_withdrawal: Boolean(vault.pendingWithdrawal),
      }),
    [trackingHandler, source],
  )

  return { trackDepositClick, trackWithdrawClick }
}
