import { useCallback } from 'react'
import { useCreateOrderSignatureMutation } from 'services/limitOrder'

import { formatAmountOrder, getPayloadCreateOrder } from 'components/swapv2/LimitOrder/helpers'
import { CreateOrderParam } from 'components/swapv2/LimitOrder/types'
import { TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { formatSignature } from 'utils/transaction'
import { Address } from 'utils/viem'
import { signTypedDataRaw } from 'utils/walletClient'

export const useSignOrder = (setFlowState: React.Dispatch<React.SetStateAction<TransactionFlowState>> | undefined) => {
  const { account, chainId } = useActiveWeb3React()
  const [getMessageSignature] = useCreateOrderSignatureMutation()

  return useCallback(
    async (params: CreateOrderParam) => {
      const { currencyIn, currencyOut, inputAmount, outputAmount } = params
      if (!currencyIn || !currencyOut || !account) return { signature: '', salt: '' }

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

      const rawSignature = await signTypedDataRaw({
        chainId: chainId,
        account: account as Address,
        typedData: messagePayload,
      })
      return { signature: formatSignature(rawSignature), salt: messagePayload?.message?.salt }
    },
    [setFlowState, account, chainId, getMessageSignature],
  )
}
