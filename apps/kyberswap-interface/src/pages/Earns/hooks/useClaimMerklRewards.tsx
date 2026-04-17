import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { ethers } from 'ethers'
import { useCallback } from 'react'
import { useLazyMerklRewardsQuery } from 'services/rewardMerkl'

import { NotificationType } from 'components/Announcement/type'
import MERKL_DISTRIBUTOR_ABI from 'constants/abis/merkl-distributor.json'
import { MULTICALL_ABI } from 'constants/multicall'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { MERKL_DISTRIBUTOR_ADDRESS } from 'pages/Earns/constants/merkl'
import { submitTransaction } from 'pages/Earns/utils'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { getReadingContractWithCustomChain } from 'utils/getContract'
import { formatDisplayNumber } from 'utils/numbers'

const useClaimMerklRewards = () => {
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const [fetchMerklRewards] = useLazyMerklRewardsQuery()

  const claimMerklRewards = useCallback(
    async (targetChainId: number) => {
      if (!library || !account) return

      // Always fetch fresh data right before claiming to get the latest merkle root & proofs
      const { data } = await fetchMerklRewards({
        address: account,
        chainId: String(targetChainId),
      })

      const chainRewards = data?.find(item => item.chain.id === targetChainId)
      if (!chainRewards?.rewards?.length) {
        notify({
          title: t`Error`,
          type: NotificationType.ERROR,
          summary: t`No claimable rewards on this chain`,
        })
        return
      }

      const apiClaimable = chainRewards.rewards.filter(reward => {
        try {
          const claimable = BigInt(reward.amount) - BigInt(reward.claimed)
          return claimable > 0n && reward.proofs.length > 0
        } catch {
          return false
        }
      })

      if (!apiClaimable.length) {
        notify({
          title: t`Error`,
          type: NotificationType.ERROR,
          summary: t`No claimable rewards on this chain`,
        })
        return
      }

      // On-chain check: the Merkl distributor tracks the claimed amount per (user, token) on-chain.
      // The API's `claimed` field may lag behind, so we read it directly from the contract to avoid
      // submitting no-op claim transactions where cumulative amount <= on-chain claimed.
      const distributorIface = new ethers.utils.Interface(MERKL_DISTRIBUTOR_ABI)
      const multicallAddr = NETWORKS_INFO[targetChainId as ChainId]?.multicall

      let onChainClaimed: bigint[] = apiClaimable.map(() => 0n)
      if (multicallAddr) {
        try {
          const multicall = getReadingContractWithCustomChain(multicallAddr, MULTICALL_ABI, targetChainId as ChainId)
          const calls = apiClaimable.map(reward => ({
            target: MERKL_DISTRIBUTOR_ADDRESS,
            callData: distributorIface.encodeFunctionData('claimed', [account, reward.token.address]),
          }))
          const returnData: Array<{ success: boolean; returnData: string }> = await multicall.callStatic.tryAggregate(
            false,
            calls,
          )
          onChainClaimed = returnData.map(item => {
            if (!item.success || !item.returnData || item.returnData === '0x') return 0n
            try {
              const decoded = distributorIface.decodeFunctionResult('claimed', item.returnData)
              return BigInt(decoded[0].toString())
            } catch {
              return 0n
            }
          })
        } catch {
          notify({
            title: t`Error`,
            type: NotificationType.ERROR,
            summary: t`Failed to verify on-chain claimed amounts`,
          })
          return
        }
      }

      const claimableRewards = apiClaimable.filter((reward, idx) => {
        try {
          return BigInt(reward.amount) > onChainClaimed[idx]
        } catch {
          return false
        }
      })

      if (!claimableRewards.length) {
        notify({
          title: t`Info`,
          type: NotificationType.WARNING,
          summary: t`All Merkl rewards on this chain have already been claimed on-chain. Data may take some time to refresh.`,
        })
        return
      }

      const users = claimableRewards.map(() => account)
      const tokens = claimableRewards.map(r => r.token.address)
      const amounts = claimableRewards.map(r => r.amount)
      const proofs = claimableRewards.map(r => r.proofs)

      const calldata = distributorIface.encodeFunctionData('claim', [users, tokens, amounts, proofs])

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
    [account, addTransactionWithType, fetchMerklRewards, library, notify],
  )

  return { claimMerklRewards }
}

export default useClaimMerklRewards
