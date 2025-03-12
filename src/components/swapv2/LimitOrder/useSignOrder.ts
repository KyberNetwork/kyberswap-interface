import { useCallback } from 'react'

import { formatAmountOrder } from 'components/swapv2/LimitOrder/helpers'
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

  return useCallback(
    async (params: CreateOrderParam) => {
      const { currencyIn, currencyOut, inputAmount, outputAmount, signature, salt } = params
      if (signature && salt) return { signature, salt }
      if (!library || !currencyIn || !currencyOut) return { signature: '', salt: '' }

      //const payload = getPayloadCreateOrder(params)
      setFlowState?.({
        ...TRANSACTION_STATE_DEFAULT,
        showConfirm: true,
        attemptingTxn: true,
        pendingText: `Sign limit order: ${formatAmountOrder(inputAmount)} ${currencyIn.symbol} to ${formatAmountOrder(
          outputAmount,
        )} ${currencyOut.symbol}`,
      })
      const messagePayload = {
        domain: {
          chainId: '137',
          name: 'Kyber DSLO Protocol',
          verifyingContract: '0x433d9e8e851384ac790bc1ea080d14ffa2f00fad',
          version: '1',
        },
        message: {
          allowedSender: '0x0000000000000000000000000000000000000000',
          feeConfig: '1462489442518004848126352538305912624934614310555618',
          getMakerAmount: '0x012345ab',
          getTakerAmount: '0x456789cd',
          interaction: '0x',
          maker: '0xd1e3da602283b4cc4ade3481eabe24f5ab965968',
          makerAsset: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
          makerAssetData: '0x',
          makingAmount: '2500000000000000080',
          predicate: '0xa1b2c3d4',
          receiver: '0xd1e3da602283b4cc4ade3481eabe24f5ab965968',
          salt: '252343078750797124971760715644762518073',
          takerAsset: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
          takerAssetData: '0x',
          takingAmount: '0005000000000000000000',
        },
        primaryType: 'Order',
        types: {
          DSOrder: [
            {
              name: 'orderHash',
              type: 'bytes32',
            },
            {
              name: 'opExpireTime',
              type: 'uint32',
            },
          ],
          EIP712Domain: [
            {
              name: 'name',
              type: 'string',
            },
            {
              name: 'version',
              type: 'string',
            },
            {
              name: 'chainId',
              type: 'uint256',
            },
            {
              name: 'verifyingContract',
              type: 'address',
            },
          ],
          Order: [
            {
              name: 'salt',
              type: 'uint256',
            },
            {
              name: 'makerAsset',
              type: 'address',
            },
            {
              name: 'takerAsset',
              type: 'address',
            },
            {
              name: 'maker',
              type: 'address',
            },
            {
              name: 'receiver',
              type: 'address',
            },
            {
              name: 'allowedSender',
              type: 'address',
            },
            {
              name: 'makingAmount',
              type: 'uint256',
            },
            {
              name: 'takingAmount',
              type: 'uint256',
            },
            {
              name: 'feeConfig',
              type: 'uint256',
            },
            {
              name: 'makerAssetData',
              type: 'bytes',
            },
            {
              name: 'takerAssetData',
              type: 'bytes',
            },
            {
              name: 'getMakerAmount',
              type: 'bytes',
            },
            {
              name: 'getTakerAmount',
              type: 'bytes',
            },
            {
              name: 'predicate',
              type: 'bytes',
            },
            {
              name: 'interaction',
              type: 'bytes',
            },
          ],
        },
      }

      const rawSignature = await library.send('eth_signTypedData_v4', [account, JSON.stringify(messagePayload)])
      return { signature: formatSignature(rawSignature), salt: messagePayload?.message?.salt }
    },
    [setFlowState, account, library],
  )
}
