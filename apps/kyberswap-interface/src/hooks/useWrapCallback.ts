import { ChainId, Currency, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useMemo } from 'react'

import { NotificationType } from 'components/Announcement/type'
import WETH_ABI from 'constants/abis/weth.json'
import { NativeCurrencies } from 'constants/tokens'
import { useNotify } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { usePaymentToken } from 'state/user/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { calculateGasMargin } from 'utils'
import { friendlyError } from 'utils/errorMessage'
import { paymasterExecute } from 'utils/sendTransaction'

import { useActiveWeb3React } from './index'
import { useWETHContract } from './useContract'

export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP,
}

const WETHInterface = new Interface(WETH_ABI)

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
  const [paymentToken] = usePaymentToken()
  const chainId = customChainId || walletChainId
  const wethContract = useWETHContract(chainId)
  const balance = useCurrencyBalance(inputCurrency ?? undefined, chainId)
  // we can always parse the amount typed as the input currency, since wrapping is 1:1
  const inputAmount = useMemo(() => tryParseAmount(typedValue, inputCurrency ?? undefined), [inputCurrency, typedValue])
  const addTransactionWithType = useTransactionAdder()
  const notify = useNotify()

  return useMemo(() => {
    if (!wethContract || !inputCurrency || !outputCurrency) return NOT_APPLICABLE

    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    const nativeTokenSymbol = NativeCurrencies[chainId].symbol

    if ((inputCurrency.isNative && WETH[chainId].equals(outputCurrency)) || (forceWrap && inputCurrency.isNative)) {
      return {
        wrapType: WrapType.WRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  let hash: string | undefined
                  if (wethContract) {
                    const estimateGas = await wethContract.estimateGas.deposit({
                      value: `0x${inputAmount.quotient.toString(16)}`,
                    })
                    const txReceipt = await (paymentToken?.address
                      ? paymasterExecute(
                          paymentToken.address,
                          {
                            from: account,
                            to: WETH[chainId].address,
                            value: BigNumber.from(inputAmount.quotient.toString()),
                            data: WETHInterface.encodeFunctionData('deposit'),
                          },
                          calculateGasMargin(estimateGas).toNumber(),
                        )
                      : wethContract.deposit({
                          value: `0x${inputAmount.quotient.toString(16)}`,
                          gasLimit: calculateGasMargin(estimateGas),
                        }))
                    hash = txReceipt?.hash
                  }
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
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  let hash: string | undefined
                  if (wethContract) {
                    const estimateGas = await wethContract.estimateGas.withdraw(
                      `0x${inputAmount.quotient.toString(16)}`,
                    )
                    const txReceipt = await (paymentToken?.address
                      ? paymasterExecute(
                          paymentToken.address,
                          {
                            from: account,
                            to: WETH[chainId].address,
                            data: WETHInterface.encodeFunctionData('withdraw', [
                              BigNumber.from(inputAmount.quotient.toString()),
                            ]),
                          },
                          calculateGasMargin(estimateGas).toNumber(),
                        )
                      : wethContract.withdraw(`0x${inputAmount.quotient.toString(16)}`, {
                          gasLimit: calculateGasMargin(estimateGas),
                        }))
                    hash = txReceipt.hash
                  }
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
    wethContract,
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
    paymentToken?.address,
  ])
}
