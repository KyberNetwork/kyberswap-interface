import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { VaultApiDetailItem, useVaultSupportedAssetsQuery, useVaultWithdrawalRequestsQuery } from 'services/vault'

import { useActiveWeb3React } from 'hooks'
import WithdrawRequestList from 'pages/Earns/VaultDetail/WithdrawRequestList'
import { RequestsPanel } from 'pages/Earns/VaultDetail/styles'
import { VAULT_POLLING_INTERVAL } from 'pages/Earns/constants/vault'
import { useRefreshOnVaultTx } from 'pages/Earns/hooks/useRefreshOnVaultTx'
import { getWithdrawRequestsInProgress } from 'pages/Earns/utils/vault'
import { useTokenPrices } from 'state/tokenPrices/hooks'

/**
 * The withdrawals this wallet has asked the queue for, in a panel of their own beside the form
 * rather than inside it — they outlive the form, and a request made days ago is not part of filling
 * one in now.
 *
 * It reads the queries itself instead of taking them from the form: both are the same cache entry,
 * so this costs no extra request and spares the form a set of props it has no use for.
 */
const WithdrawRequestsPanel = ({ vault, onChanged }: { vault: VaultApiDetailItem; onChanged: () => void }) => {
  const { account } = useActiveWeb3React()
  const chainId = vault.chain?.id
  const hasTarget = Boolean(chainId && vault.vaultId && account)

  const { data: requestsData, refetch: refetchRequests } = useVaultWithdrawalRequestsQuery(
    { chainId: chainId as number, userAddress: (account || '').toLowerCase(), vaultId: vault.vaultId },
    // Requests move on the solver's clock rather than the user's: one matures, expires or is filled
    // with nothing happening on this page.
    { skip: !hasTarget, pollingInterval: VAULT_POLLING_INTERVAL },
  )

  const { data: supportedAssets } = useVaultSupportedAssetsQuery(
    { chainId: chainId as number, vaultId: vault.vaultId },
    { skip: !chainId || !vault.vaultId },
  )

  // A request is created or cancelled by a transaction, and the list only changes once that is
  // mined — the flow hands control back as soon as it is submitted.
  useRefreshOnVaultTx(refetchRequests)

  const requests = useMemo(() => getWithdrawRequestsInProgress(requestsData?.requests), [requestsData?.requests])

  /** The share token and every asset a request pays out in, for the figures beside the amounts. */
  const priceAddresses = useMemo(
    () =>
      Array.from(
        new Set(
          [vault.shareToken?.address, ...requests.map(request => request.assetOutAddress)]
            .filter((address): address is string => !!address)
            .map(address => address.toLowerCase()),
        ),
      ),
    [vault.shareToken?.address, requests],
  )
  const prices = useTokenPrices(priceAddresses, chainId as ChainId)

  if (!chainId || !requests.length) return null

  return (
    <RequestsPanel>
      <WithdrawRequestList
        chainId={chainId}
        requests={requests}
        assets={supportedAssets || []}
        shareToken={{
          address: vault.shareToken?.address,
          symbol: vault.shareToken?.symbol ?? '',
          decimals: vault.shareToken?.decimals ?? 18,
        }}
        prices={prices}
        onCancelled={() => {
          refetchRequests()
          onChanged()
        }}
      />
    </RequestsPanel>
  )
}

export default WithdrawRequestsPanel
