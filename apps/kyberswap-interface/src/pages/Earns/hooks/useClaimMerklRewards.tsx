import { t } from '@lingui/macro'
import { ethers } from 'ethers'
import { useCallback } from 'react'
import { MerklRewardsResponse, useFetchMerklChainRewardsMutation } from 'services/rewardMerkl'

import { NotificationType } from 'components/Announcement/type'
import MERKL_DISTRIBUTOR_ABI from 'constants/abis/merkl-distributor.json'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { submitTransaction } from 'pages/Earns/utils'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { formatDisplayNumber } from 'utils/numbers'

// Merkl distributor contract address - same across all EVM chains
const MERKL_DISTRIBUTOR_ADDRESS = '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae'

const useClaimMerklRewards = () => {
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const [fetchMerklChainRewards] = useFetchMerklChainRewardsMutation()

  const claimMerklRewards = useCallback(
    async (targetChainId: number, cachedChainRewards: MerklRewardsResponse | undefined) => {
      if (!library || !account) return

      // Pre-claim freshness fetch: hit Merkl one time for this specific chain to make sure the
      // amount + merkle proof we sign over is the latest available. The cached payload from the
      // background `useMerklRewardsQuery` may be up to ~5 min stale (keepUnusedDataFor=300), and
      // a stale proof against a newer Merkl root would revert on-chain.
      //
      // A successful fetch is authoritative — replace the cached payload with whatever Merkl
      // returned, even if it's empty or missing. That way the `!chainRewards?.rewards?.length`
      // guard below surfaces a clean "no claimable rewards" error instead of silently submitting
      // a tx with potentially-stale proofs. Only keep the cached fallback when the network call
      // itself fails, so a transient error still leaves the claim flow usable.
      let chainRewards: MerklRewardsResponse | undefined = cachedChainRewards
      try {
        const result = await fetchMerklChainRewards({ address: account, chainId: targetChainId }).unwrap()
        chainRewards = result.find(item => item.chain.id === targetChainId)
      } catch {
        // keep `cachedChainRewards` fallback
      }

      if (!chainRewards?.rewards?.length) {
        notify({
          title: t`Error`,
          type: NotificationType.ERROR,
          summary: t`No claimable rewards on this chain`,
        })
        return
      }

      const claimableRewards = chainRewards.rewards.filter(reward => {
        try {
          const claimable = BigInt(reward.amount) - BigInt(reward.claimed)
          return claimable > 0n && reward.proofs.length > 0
        } catch {
          return false
        }
      })

      if (!claimableRewards.length) {
        notify({
          title: t`Error`,
          type: NotificationType.ERROR,
          summary: t`No claimable rewards on this chain`,
        })
        return
      }

      const iface = new ethers.utils.Interface(MERKL_DISTRIBUTOR_ABI)

      const users = claimableRewards.map(() => account)
      const tokens = claimableRewards.map(r => r.token.address)
      const amounts = claimableRewards.map(r => r.amount)
      const proofs = claimableRewards.map(r => r.proofs)

      const calldata = iface.encodeFunctionData('claim', [users, tokens, amounts, proofs])

      const res = await submitTransaction({
        library,
        txData: {
          to: MERKL_DISTRIBUTOR_ADDRESS,
          data: calldata,
        },
        onError: (error: Error) => {
          notify({
            title: t`Error`,
            type: NotificationType.ERROR,
            summary: error.message,
          })
        },
      })

      const { txHash, error } = res
      if (!txHash || error) return undefined

      const summary = claimableRewards
        .map(r => {
          try {
            const totalBig = BigInt(r.amount)
            const claimedBig = BigInt(r.claimed)
            const claimableBig = totalBig - claimedBig
            const amount = Number(claimableBig) / 10 ** r.token.decimals
            return `${formatDisplayNumber(amount, { significantDigits: 4 })} ${r.token.symbol}`
          } catch {
            return r.token.symbol
          }
        })
        .join(', ')

      addTransactionWithType({
        type: TRANSACTION_TYPE.CLAIM_REWARD,
        hash: txHash,
        extraInfo: {
          summary: `Merkl rewards: ${summary}`,
        },
      })

      return txHash
    },
    [account, addTransactionWithType, fetchMerklChainRewards, library, notify],
  )

  return { claimMerklRewards }
}

export default useClaimMerklRewards
