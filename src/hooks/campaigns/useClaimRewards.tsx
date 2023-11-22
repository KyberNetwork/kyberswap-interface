import { t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useCallback } from 'react'
import { useClaimRewardMutation } from 'services/reward'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify } from 'state/application/hooks'
import { friendlyError } from 'utils/errorMessage'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/sentry'

// todo danh later: update all (ex: campaign, ... ) use this hook
export default function useClaimRewards() {
  const { account, walletKey } = useActiveWeb3React()
  const { library } = useWeb3React()
  const notify = useNotify()
  const [claimReward] = useClaimRewardMutation()

  return useCallback(
    async (payload: { wallet: string; chainId: string; clientCode: string; ref: string }): Promise<string> => {
      if (!account || !library) throw new Error(t`Invalid claim`)

      try {
        const response: any = claimReward(payload).unwrap()
        if (response?.data?.code !== 200000) throw new Error(response?.data?.message)

        const rewardContractAddress = response.data.data.ContractAddress
        const encodedData = response.data.data.EncodedData
        const tx = await sendEVMTransaction({
          account,
          library,
          contractAddress: rewardContractAddress,
          encodedData,
          value: BigNumber.from(0),
          sentryInfo: {
            name: ErrorName.ClaimCampaignError,
            wallet: walletKey,
          },
        })
        if (!tx) throw new Error()
        return tx.hash as string
      } catch (error) {
        const message = friendlyError(error)
        console.error('Claim error:', { message, error })
        notify({
          title: t`Claim Error`,
          summary: message,
          type: NotificationType.ERROR,
        })
        throw error
      }
    },
    [account, library, notify, walletKey, claimReward],
  )
}
