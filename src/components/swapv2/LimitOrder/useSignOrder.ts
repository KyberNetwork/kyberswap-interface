import { useCallback } from 'react'
import { useCreateOrderSignatureMutation } from 'services/limitOrder'

import { formatAmountOrder, getPayloadCreateOrder } from 'components/swapv2/LimitOrder/helpers'
import { CreateOrderParam } from 'components/swapv2/LimitOrder/type'
import { TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { formatSignature } from 'utils/transaction'

export default function useSignOrder(
  setFlowState: React.Dispatch<React.SetStateAction<TransactionFlowState>> | undefined,
) {
  const { library } = useWeb3React()
  const { account } = useActiveWeb3React()
  const [getMessageSignature] = useCreateOrderSignatureMutation()

  return useCallback(
    async (params: CreateOrderParam) => {
      const { currencyIn, currencyOut, inputAmount, outputAmount, signature, salt } = params
      if (signature && salt) return { signature, salt }
      if (!library || !currencyIn || !currencyOut) return { signature: '', salt: '' }

      const payload = getPayloadCreateOrder(params)
      setFlowState?.({
        ...TRANSACTION_STATE_DEFAULT,
        showConfirm: true,
        attemptingTxn: true,
        pendingText: `Sign limit order: ${formatAmountOrder(inputAmount)} ${currencyIn.symbol} to ${formatAmountOrder(
          outputAmount,
        )} ${currencyOut.symbol}`,
      })
      const messagePayload = await getMessageSignature(payload).unwrap()

      const rawSignature = await library.send('eth_signTypedData_v4', [account, JSON.stringify(messagePayload)])
      return { signature: formatSignature(rawSignature), salt: messagePayload?.message?.salt }
    },
    [setFlowState, account, getMessageSignature, library],
  )
}
