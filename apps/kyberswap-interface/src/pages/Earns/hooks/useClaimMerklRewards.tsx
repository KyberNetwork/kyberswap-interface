import { t } from '@lingui/macro'
import { ethers } from 'ethers'
import { useCallback } from 'react'
import { useLazyMerklRewardsQuery } from 'services/rewardMerkl'

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
    [account, addTransactionWithType, fetchMerklRewards, library, notify],
  )

  return { claimMerklRewards }
}

export default useClaimMerklRewards
