import { useCallback } from 'react'
import { useCreateOrderSignatureMutation } from 'services/limitOrder'

import { getPayloadCreateOrder } from 'components/LimitOrder/helpers'
import { CreateOrderParams } from 'components/LimitOrder/types'
import { useActiveWeb3React } from 'hooks'
import { formatSignature } from 'utils/transaction'
import { Address } from 'utils/viem'
import { signTypedDataRaw } from 'utils/walletClient'

export const useSignOrder = () => {
  const { account, chainId } = useActiveWeb3React()
  const [getMessageSignature] = useCreateOrderSignatureMutation()

  return useCallback(
    async (params: CreateOrderParams) => {
      const { currencyIn, currencyOut } = params
      if (!currencyIn || !currencyOut || !account) return { signature: '', salt: '' }

      const payload = getPayloadCreateOrder(params)
      const messagePayload = await getMessageSignature(payload).unwrap()

      const rawSignature = await signTypedDataRaw({
        chainId: chainId,
        account: account as Address,
        typedData: messagePayload,
      })
      return { signature: formatSignature(rawSignature), salt: messagePayload?.message?.salt }
    },
    [account, chainId, getMessageSignature],
  )
}
