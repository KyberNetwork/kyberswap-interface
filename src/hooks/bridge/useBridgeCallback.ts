import { ChainId } from '@kyberswap/ks-sdk-core'
import { captureException } from '@sentry/react'
import { useCallback, useMemo } from 'react'
import { useSaveBridgeTxsMutation } from 'services/crossChain'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useBridgeContract, useSwapETHContract } from 'hooks/useContract'
import { useBridgeOutputValue, useBridgeState } from 'state/crossChain/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useCurrencyBalance, useNativeBalance } from 'state/wallet/hooks'
import { formatNumberWithPrecisionRange, isAddress } from 'utils'

export const captureExceptionCrossChain = (body: any, err: any, errName: string) => {
  const extraData = {
    body,
    status: undefined,
    response: undefined,
  }
  if (err?.response?.data) {
    extraData.status = err.response.status
    extraData.response = err.response.data
  }
  const error = new Error(`SendTxToKsSetting fail, srcTxHash = ${extraData.body.srcTxHash}`, { cause: err })
  error.name = errName
  captureException(error, { level: 'fatal', extra: { args: JSON.stringify(extraData, null, 2) } })
}

const NOT_APPLICABLE = {
  execute: async () => {
    //
  },
  inputError: false,
}

function useSendTxToKsSettingCallback() {
  const { account } = useActiveWeb3React()
  const [saveTxs] = useSaveBridgeTxsMutation()

  return useCallback(
    async (
      srcChainId: ChainId,
      dstChainId: ChainId,
      srcTxHash: string,
      srcTokenSymbol: string,
      dstTokenSymbol: string,
      srcAmount: string,
      dstAmount: string,
    ) => {
      const body = {
        walletAddress: account,
        srcChainId: srcChainId.toString(),
        dstChainId: dstChainId.toString(),
        srcTxHash,
        dstTxHash: '',
        srcTokenSymbol,
        dstTokenSymbol,
        srcAmount,
        dstAmount,
        status: 0,
      }
      try {
        await saveTxs(body).unwrap()
      } catch (err) {
        captureExceptionCrossChain(body, err, 'PostBridge')
      }
    },
    [account, saveTxs],
  )
}

const getTxsExtraInfo = ({
  tokenSymbolIn,
  tokenSymbolOut,
  tokenAmountIn,
  tokenAmountOut,
  tokenAddressIn,
  tokenAddressOut,
  fee,
  chainIdIn,
  chainIdOut,
}: {
  tokenSymbolIn: string
  tokenSymbolOut: string
  tokenAmountIn: string
  tokenAmountOut: string
  tokenAddressIn: string
  tokenAddressOut: string
  fee: string
  chainIdIn: ChainId
  chainIdOut: ChainId
}) => ({
  tokenSymbolIn,
  tokenSymbolOut,
  tokenAmountIn,
  tokenAmountOut,
  tokenAddressIn,
  tokenAddressOut,
  chainIdIn,
  chainIdOut,
  arbitrary: {
    from_token: tokenSymbolIn,
    to_token: tokenSymbolOut,
    bridge_fee: fee,
    from_network: NETWORKS_INFO[chainIdIn].name,
    to_network: NETWORKS_INFO[chainIdOut].name,
    trade_qty: tokenAmountIn,
  },
})

export default function useBridgeCallback(
  inputAmount: string | undefined,
  inputToken: string | undefined,
  routerToken: string | undefined,
  isNative: boolean,
  toAddress: string | undefined | null,
) {
  const { execute: onRouterSwap, inputError: wrapInputErrorBridge } = useRouterSwap(
    routerToken,
    inputToken,
    inputAmount,
    isNative,
  )
  const { execute: onBridgeSwap, inputError: wrapInputErrorCrossBridge } = useBridgeSwap(
    toAddress,
    inputToken,
    inputAmount,
  )
  return useMemo(() => {
    return {
      execute: async (useSwapMethods: string) => {
        const isBridge =
          useSwapMethods.includes('transfer') ||
          useSwapMethods.includes('sendTransaction') ||
          useSwapMethods.includes('Swapout')
        return isBridge ? onBridgeSwap() : onRouterSwap(useSwapMethods)
      },
      inputError: wrapInputErrorBridge || wrapInputErrorCrossBridge,
    }
  }, [onBridgeSwap, onRouterSwap, wrapInputErrorBridge, wrapInputErrorCrossBridge])
}

function useRouterSwap(
  routerToken: string | undefined,
  inputToken: string | undefined,
  typedValue: string | undefined,
  isNative: boolean,
) {
  const [{ tokenInfoIn, chainIdOut, currencyIn, currencyOut }] = useBridgeState()
  const outputInfo = useBridgeOutputValue(typedValue ?? '0')
  const { account, chainId } = useActiveWeb3React()
  const bridgeContract = useBridgeContract(isAddress(chainId, routerToken))

  const ethBalance = useNativeBalance()
  const anyBalance = useCurrencyBalance(currencyIn)
  const balance = isNative ? ethBalance : anyBalance

  const inputAmount = useMemo(() => tryParseAmount(typedValue, currencyIn ?? undefined), [currencyIn, typedValue])
  const addTransactionWithType = useTransactionAdder()
  const sendTxToKsSetting = useSendTxToKsSettingCallback()

  return useMemo(() => {
    if (!bridgeContract || !tokenInfoIn || !account || !chainIdOut) return NOT_APPLICABLE

    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)
    return {
      execute: async (useSwapMethods: string) => {
        let txHash = ''
        try {
          if (!sufficientBalance || !inputAmount) return Promise.reject('insufficient Balance')
          let promise
          const params = [inputToken, account, `0x${inputAmount.quotient.toString(16)}`, currencyOut?.chainId]
          if (useSwapMethods.includes('anySwapOutNative')) {
            promise = bridgeContract.anySwapOutNative(inputToken, account, currencyOut?.chainId, {
              value: `0x${inputAmount.quotient.toString(16)}`,
            })
          } else if (useSwapMethods.includes('anySwapOutUnderlying')) {
            promise = bridgeContract.anySwapOutUnderlying(...params)
          } else if (useSwapMethods.includes('anySwapOut')) {
            promise = bridgeContract.anySwapOut(...params)
          }

          let txReceipt
          if (promise) {
            window.onbeforeunload = () => ''
            txReceipt = await promise
          } else {
            return Promise.reject('router wrong method')
          }

          txHash = txReceipt?.hash

          if (txHash) {
            const inputAmountStr = inputAmount.toSignificant(6)
            const outputAmountStr = formatNumberWithPrecisionRange(parseFloat(outputInfo.outputAmount.toString()), 0, 6)
            const tokenSymbolIn = currencyIn?.symbol ?? ''
            const tokenSymbolOut = currencyOut?.symbol ?? ''
            addTransactionWithType({
              hash: txHash,
              type: TRANSACTION_TYPE.BRIDGE,
              extraInfo: getTxsExtraInfo({
                tokenAddressIn: currencyIn?.address ?? '',
                tokenAddressOut: currencyOut?.address ?? '',
                tokenSymbolIn: tokenSymbolIn,
                tokenSymbolOut: tokenSymbolOut,
                tokenAmountIn: inputAmountStr,
                tokenAmountOut: outputAmountStr,
                chainIdIn: chainId,
                chainIdOut,
                fee: outputInfo.fee + '',
              }),
            })
            sendTxToKsSetting(
              chainId,
              chainIdOut,
              txHash,
              tokenSymbolIn,
              tokenSymbolOut,
              inputAmountStr,
              outputInfo?.outputAmount?.toString() ?? '',
            )
          }
          return txHash ?? ''
        } catch (error) {
          console.error('Could not swap', error)
          return Promise.reject(error || 'router unknown error')
        } finally {
          window.onbeforeunload = null
        }
      },
      inputError: !sufficientBalance,
    }
  }, [
    bridgeContract,
    chainId,
    tokenInfoIn,
    account,
    chainIdOut,
    inputAmount,
    balance,
    inputToken,
    outputInfo.outputAmount,
    outputInfo.fee,
    currencyOut,
    sendTxToKsSetting,
    addTransactionWithType,
    currencyIn,
  ])
}

function useBridgeSwap(
  toAddress: string | undefined | null,
  inputToken: string | undefined,
  typedValue: string | undefined,
) {
  const [{ tokenInfoOut, chainIdOut, tokenInfoIn, currencyIn, currencyOut }] = useBridgeState()
  const addTransactionWithType = useTransactionAdder()
  const outputInfo = useBridgeOutputValue(typedValue ?? '0')
  const { chainId, account } = useActiveWeb3React()
  const { library } = useWeb3React()

  const tokenBalance = useCurrencyBalance(currencyIn)
  const ethBalance = useNativeBalance()
  const balance = tokenInfoIn && tokenInfoIn?.tokenType !== 'NATIVE' ? tokenBalance : ethBalance

  const inputAmount = useMemo(() => tryParseAmount(typedValue, currencyIn), [currencyIn, typedValue])
  const contractETH = useSwapETHContract(isAddress(chainId, inputToken) ? inputToken : undefined)
  const sendTxToKsSetting = useSendTxToKsSettingCallback()

  return useMemo(() => {
    if (!toAddress || !chainIdOut || !library || !account) return NOT_APPLICABLE

    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    return {
      execute: async () => {
        try {
          if (!sufficientBalance || !inputAmount) return Promise.reject('insufficient balance')
          let txReceipt
          if (tokenInfoOut?.type === 'swapin') {
            if (isAddress(chainId, inputToken) && tokenInfoIn?.tokenType !== 'NATIVE') {
              if (contractETH) {
                txReceipt = await contractETH.transfer(toAddress, `0x${inputAmount.quotient.toString(16)}`)
              } else {
                return Promise.reject('not found contractETH')
              }
            } else {
              const data = {
                from: account,
                to: toAddress,
                value: `0x${inputAmount.quotient.toString(16)}`,
              }
              const hash = await library.send('eth_sendTransaction', [data])
              txReceipt = hash && hash.toString().indexOf('0x') === 0 ? { hash } : ''
            }
          } else {
            if (contractETH) {
              txReceipt = await contractETH.Swapout(`0x${inputAmount.quotient.toString(16)}`, toAddress)
            } else {
              return Promise.reject('not found contractETH')
            }
          }
          const txHash = txReceipt?.hash
          if (txHash) {
            const inputAmountStr = inputAmount.toSignificant(6)
            const outputAmountStr = formatNumberWithPrecisionRange(parseFloat(outputInfo.outputAmount.toString()), 0, 6)
            const tokenSymbolIn = currencyIn?.symbol ?? ''
            const tokenSymbolOut = currencyOut?.symbol ?? ''
            addTransactionWithType({
              hash: txHash,
              type: TRANSACTION_TYPE.BRIDGE,
              extraInfo: getTxsExtraInfo({
                tokenAddressIn: currencyIn?.address ?? '',
                tokenAddressOut: currencyOut?.address ?? '',
                tokenSymbolIn: tokenSymbolIn,
                tokenSymbolOut: tokenSymbolOut,
                tokenAmountIn: inputAmountStr,
                tokenAmountOut: outputAmountStr,
                chainIdIn: chainId,
                chainIdOut,
                fee: outputInfo.fee + '',
              }),
            })
            sendTxToKsSetting(
              chainId,
              chainIdOut,
              txHash,
              tokenSymbolIn,
              tokenSymbolOut,
              inputAmountStr,
              outputInfo?.outputAmount?.toString() ?? '',
            )
          }
          return txHash ?? ''
        } catch (error) {
          console.log('Could not swapout', error)
          return Promise.reject(error || 'bridge unknown error')
        }
      },
      inputError: !sufficientBalance,
    }
  }, [
    chainId,
    toAddress,
    chainIdOut,
    library,
    account,
    inputAmount,
    balance,
    tokenInfoOut?.type,
    inputToken,
    tokenInfoIn?.tokenType,
    contractETH,
    outputInfo.outputAmount,
    outputInfo.fee,
    currencyOut,
    sendTxToKsSetting,
    addTransactionWithType,
    currencyIn,
  ])
}
