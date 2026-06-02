import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined } from 'components/Button'
import { REWARD_SERVICE_API } from 'constants/env'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/transactionError'

const ClaimButton = ({ info }: { info: { ref: string; clientCode: string } }) => {
  const { account, chainId } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const [claiming, setIsClaiming] = useState(false)
  const notify = useNotify()
  const { changeNetwork } = useChangeNetwork()
  const [autoClaim, setAutoClaim] = useState(false)

  const addTransactionWithType = useTransactionAdder()

  const networkToSwitch = info.clientCode === 'arbitrum-stip' ? ChainId.ARBITRUM : ChainId.MAINNET
  const handleClaim = useCallback(async () => {
    if (!account) return
    if (chainId !== networkToSwitch) {
      changeNetwork(networkToSwitch)
      const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
      await sleep(2000)
      setAutoClaim(true)
      return
    }
    setIsClaiming(true)
    fetch(`${REWARD_SERVICE_API}/rewards/claim`, {
      method: 'POST',
      body: JSON.stringify({
        wallet: account,
        chainId: networkToSwitch.toString(),
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
              title: t`Claim failed`,
              summary: res?.message || t`Something went wrong`,
              type: NotificationType.ERROR,
            },
            5000,
          )
          return
        }

        sendEVMTransaction({
          account,
          contractAddress: res.data.ContractAddress,
          encodedData: res.data.EncodedData,
          value: 0n,
          errorInfo: { name: ErrorName.GasRefundClaimError, wallet: undefined },
          isSmartConnector,
          chainId,
        })
          .then(tx => {
            if (tx?.hash) {
              addTransactionWithType({
                hash: tx.hash,
                type: TRANSACTION_TYPE.CLAIM,
              })
            }
          })
          .catch(e => {
            notify(
              {
                title: t`Claim failed`,
                summary: e?.message || t`Something went wrong`,
                type: NotificationType.ERROR,
              },
              5000,
            )
          })
          .finally(() => {
            setIsClaiming(false)
          })
      })
  }, [
    chainId,
    changeNetwork,
    addTransactionWithType,
    info.ref,
    info.clientCode,
    notify,
    account,
    networkToSwitch,
    isSmartConnector,
  ])

  useEffect(() => {
    if (autoClaim && chainId === networkToSwitch) {
      handleClaim()
      setAutoClaim(false)
    }
  }, [chainId, autoClaim, handleClaim, networkToSwitch])

  return (
    <ButtonOutlined className="text-primary" width="88px" height="32px" onClick={handleClaim} disabled={claiming}>
      {claiming ? <Trans>Claiming</Trans> : <Trans>Claim</Trans>}
    </ButtonOutlined>
  )
}

export default ClaimButton
