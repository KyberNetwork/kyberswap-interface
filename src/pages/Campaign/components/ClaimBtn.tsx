import { ChainId } from '@kyberswap/ks-sdk-core'
import { BigNumber } from 'ethers'
import { useCallback, useEffect, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined } from 'components/Button'
import { REWARD_SERVICE_API } from 'constants/env'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { calculateGasMargin } from 'utils'

const ClaimBtn = ({ info }: { info: { ref: string; clientCode: string } }) => {
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()
  const [claiming, setIsClaiming] = useState(false)
  const notify = useNotify()
  const { library } = useWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const [autoClaim, setAutoClaim] = useState(false)

  const addTransactionWithType = useTransactionAdder()

  const handleClaim = useCallback(() => {
    if (!account) return
    if (chainId !== ChainId.ARBITRUM) {
      changeNetwork(ChainId.ARBITRUM)
      setAutoClaim(true)
      return
    }
    setIsClaiming(true)
    fetch(`${REWARD_SERVICE_API}/rewards/claim`, {
      method: 'POST',
      body: JSON.stringify({
        wallet: account,
        chainId: '42161',
        clientCode: info.clientCode,
        ref: info.ref,
      }),
    })
      .then(res => res.json())
      .then(res => {
        if (!res?.data?.EncodedData) {
          setIsClaiming(false)
          notify(
            {
              title: 'Claim failed',
              summary: res?.message || 'Something went wrong',
              type: NotificationType.ERROR,
            },
            5000,
          )
          return
        }

        library
          ?.getSigner()
          .estimateGas({
            to: res.data.ContractAddress,
            data: res.data.EncodedData,
          })
          .then(async (estimate: BigNumber) => {
            const sendTxRes = await library.getSigner().sendTransaction({
              to: res.data.ContractAddress,
              data: res.data.EncodedData,
              gasLimit: calculateGasMargin(estimate),
            })

            addTransactionWithType({
              hash: sendTxRes.hash,
              type: TRANSACTION_TYPE.CLAIM,
            })
          })
          .catch(e => {
            notify(
              {
                title: 'Claim failed',
                summary: e?.message || 'Something went wrong',
                type: NotificationType.ERROR,
              },
              5000,
            )
          })
          .finally(() => {
            setIsClaiming(false)
          })
      })
  }, [chainId, library, changeNetwork, addTransactionWithType, info.ref, info.clientCode, notify, account])

  useEffect(() => {
    if (autoClaim && chainId === ChainId.ARBITRUM) {
      handleClaim()
      setAutoClaim(false)
    }
  }, [chainId, autoClaim, handleClaim])

  return (
    <ButtonOutlined color={theme.primary} width="88px" height="32px" onClick={handleClaim} disabled={claiming}>
      {claiming ? 'Claiming' : 'Claim'}
    </ButtonOutlined>
  )
}

export default ClaimBtn
