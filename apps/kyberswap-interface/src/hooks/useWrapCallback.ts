import { ChainId, Currency, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { WETH_ABI } from 'constants/abis'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { friendlyError } from 'utils/errorMessage'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/transactionError'
import { encodeFunctionData } from 'utils/viem'

export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP,
}

const NOT_APPLICABLE = { wrapType: WrapType.NOT_APPLICABLE }
/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
export default function useWrapCallback(
  inputCurrency: Currency | undefined | null,
  outputCurrency: Currency | undefined | null,
  typedValue: string | undefined,
  forceWrap = false,
  customChainId?: ChainId,
): {
  wrapType: WrapType
  execute?: undefined | (() => Promise<string | undefined>)
  inputError?: string
  allowUnwrap?: boolean
} {
  const { chainId: walletChainId, account } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const chainId = customChainId || walletChainId
  const wethAddress = WETH[chainId]?.address
  const balance = useCurrencyBalance(inputCurrency ?? undefined, chainId)
  // we can always parse the amount typed as the input currency, since wrapping is 1:1
  const inputAmount = useMemo(() => tryParseAmount(typedValue, inputCurrency ?? undefined), [inputCurrency, typedValue])
  const addTransactionWithType = useTransactionAdder()
  const notify = useNotify()

  return useMemo(() => {
    // Detect wrap/unwrap independently of wallet connection so the UI shows the 1:1 wrap
    // immediately and skips the aggregator route path even before an account connects; only
    // `execute` (which sends the transaction) requires an account.
    if (!wethAddress || !inputCurrency || !outputCurrency) return NOT_APPLICABLE

    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    const nativeTokenSymbol = NativeCurrencies[chainId].symbol

    if ((inputCurrency.isNative && WETH[chainId].equals(outputCurrency)) || (forceWrap && inputCurrency.isNative)) {
      return {
        wrapType: WrapType.WRAP,
        execute:
          account && sufficientBalance && inputAmount
            ? async () => {
                try {
                  const txReceipt = await sendEVMTransaction({
                    account,
                    contractAddress: wethAddress,
                    encodedData: encodeFunctionData({
                      abi: WETH_ABI,
                      functionName: 'deposit',
                    }),
                    value: BigInt(inputAmount.quotient.toString()),
                    errorInfo: { name: ErrorName.SwapError, wallet: undefined },
                    isSmartConnector,
                    chainId,
                  })
                  const hash = txReceipt?.hash
                  if (hash) {
                    const tokenAmount = inputAmount.toSignificant(6)
                    addTransactionWithType({
                      hash,
                      type: TRANSACTION_TYPE.WRAP_TOKEN,
                      extraInfo: {
                        tokenAmountIn: tokenAmount,
                        tokenAmountOut: tokenAmount,
                        tokenSymbolIn: nativeTokenSymbol ?? '',
                        tokenSymbolOut: WETH[chainId].symbol ?? '',
                        tokenAddressIn: WETH[chainId].address,
                        tokenAddressOut: WETH[chainId].address,
                      },
                    })
                    return hash
                  }
                  throw new Error()
                } catch (error) {
                  const message = friendlyError(error)
                  console.error('Wrap error:', { message, error })
                  notify(
                    {
                      title: t`Wrap Error`,
                      summary: message,
                      type: NotificationType.ERROR,
                    },
                    8000,
                  )
                  return
                }
              }
            : undefined,
        inputError: !typedValue
          ? t`Enter an amount`
          : sufficientBalance
          ? undefined
          : t`Insufficient ${nativeTokenSymbol} balance`,
      }
    }
    if (WETH[chainId].equals(inputCurrency) && outputCurrency.isNative) {
      return {
        wrapType: WrapType.UNWRAP,
        execute:
          account && sufficientBalance && inputAmount
            ? async () => {
                try {
                  const txReceipt = await sendEVMTransaction({
                    account,
                    contractAddress: wethAddress,
                    encodedData: encodeFunctionData({
                      abi: WETH_ABI,
                      functionName: 'withdraw',
                      args: [BigInt(inputAmount.quotient.toString())],
                    }),
                    value: 0n,
                    errorInfo: { name: ErrorName.SwapError, wallet: undefined },
                    isSmartConnector,
                    chainId,
                  })
                  const hash = txReceipt?.hash
                  if (hash) {
                    const tokenAmount = inputAmount.toSignificant(6)
                    addTransactionWithType({
                      hash,
                      type: TRANSACTION_TYPE.UNWRAP_TOKEN,
                      extraInfo: {
                        tokenAmountIn: tokenAmount,
                        tokenAmountOut: tokenAmount,
                        tokenSymbolIn: WETH[chainId].symbol ?? '',
                        tokenSymbolOut: nativeTokenSymbol ?? '',
                        tokenAddressIn: WETH[chainId].address,
                        tokenAddressOut: WETH[chainId].address,
                      },
                    })
                    return hash
                  }
                  throw new Error()
                } catch (error) {
                  const message = friendlyError(error)
                  console.error('Unwrap error:', { message, error })
                  notify(
                    {
                      title: t`Unwrap Error`,
                      summary: message,
                      type: NotificationType.ERROR,
                    },
                    8000,
                  )
                  return
                }
              }
            : undefined,
        inputError: !typedValue
          ? t`Enter an amount`
          : sufficientBalance
          ? undefined
          : t`Insufficient W${nativeTokenSymbol} balance`,
      }
    }
    return NOT_APPLICABLE
  }, [
    wethAddress,
    chainId,
    inputCurrency,
    outputCurrency,
    inputAmount,
    balance,
    typedValue,
    addTransactionWithType,
    forceWrap,
    notify,
    account,
    isSmartConnector,
  ])
}
