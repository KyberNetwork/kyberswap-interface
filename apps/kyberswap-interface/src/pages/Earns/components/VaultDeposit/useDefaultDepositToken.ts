import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema'
import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useVaultSupportedAssetsQuery } from 'services/vault'

import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'

/**
 * The asset the deposit form should open on: one of the vault's own deposit assets that the user
 * already holds, so someone holding WETH or stETH is not routed through a swap they do not need.
 * The vault's underlying wins when it is held, otherwise the first held asset in the API's order —
 * balances of different tokens are not comparable, so there is no "largest" to pick.
 *
 * Falls back to the chain's native token, which every vault accepts through the aggregator.
 *
 * `isReady` stays false while the reads are in flight, so the caller can wait instead of settling on
 * native and then moving the selection under the user.
 */
const useDefaultDepositToken = ({
  chainId,
  vaultId,
  underlyingAddress,
}: {
  chainId?: number
  vaultId?: string
  underlyingAddress?: string
}) => {
  const { account } = useActiveWeb3React()
  const { data: supportedAssets, isLoading: isLoadingAssets } = useVaultSupportedAssetsQuery(
    { chainId: chainId as number, vaultId: vaultId as string },
    { skip: !chainId || !vaultId },
  )

  // Vaults list native ETH among their deposit assets under the `0xEeee…` placeholder. There is no
  // contract there, so asking for its ERC-20 balance never resolves — it is dropped here and covered
  // by the native fallback below.
  const depositTokens = useMemo(() => {
    if (!chainId) return []
    return (supportedAssets || [])
      .filter(
        asset =>
          asset.supportsDeposit &&
          asset.isActive &&
          asset.assetAddress.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase(),
      )
      .map(asset => new Token(chainId, asset.assetAddress, asset.decimals, asset.symbol))
  }, [supportedAssets, chainId])

  const [balances, isLoadingBalances] = useTokenBalancesWithLoadingIndicator(depositTokens, chainId)

  return useMemo<{ token: Currency | undefined; isReady: boolean }>(() => {
    if (!chainId) return { token: undefined, isReady: false }

    const native = NativeCurrencies[chainId as keyof typeof NativeCurrencies]
    // Without a wallet there are no balances to weigh, so there is nothing to wait for.
    if (!account) return { token: native, isReady: true }
    // Wait on the reads themselves rather than on every key being present: one token that cannot be
    // read would otherwise hold the pick open forever.
    if (isLoadingAssets || isLoadingBalances) return { token: undefined, isReady: false }

    const held = depositTokens.filter(token => balances[token.address]?.greaterThan(0))
    const underlying = underlyingAddress?.toLowerCase()
    const preferred = held.find(token => token.address.toLowerCase() === underlying) ?? held[0]

    return { token: preferred ?? native, isReady: true }
  }, [account, chainId, isLoadingAssets, isLoadingBalances, depositTokens, balances, underlyingAddress])
}

export default useDefaultDepositToken
