import { t } from '@lingui/macro'
import { Currency, WETH, TokenAmount, ChainId, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { useMemo, useState, useEffect } from 'react'
import { calculateGasMargin } from 'utils'
import { tryParseAmount } from '../state/swap/hooks'
import { useTransactionAdder } from '../state/transactions/hooks'
import { useCurrencyBalance } from '../state/wallet/hooks'
import { useActiveWeb3React } from './index'
import { useWETHContract, useWstETHContract } from './useContract'
import { nativeOnChain } from 'constants/tokens'
import { stETH_ADDRESS, wstETH_ADDRESS } from 'constants/index'
import { BigNumber } from 'ethers'
import { useApproveCallback, ApprovalState } from './useApproveCallback'

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
): {
  wrapType: WrapType
  execute?: undefined | (() => Promise<void>)
  inputError?: string
  outputAmount?: CurrencyAmount<Currency>
  approval?: ApprovalState
} {
  const { chainId, account } = useActiveWeb3React()
  const wethContract = useWETHContract()
  const wstETHContract = useWstETHContract()

  const balance = useCurrencyBalance(account ?? undefined, inputCurrency ?? undefined)
  // we can always parse the amount typed as the input currency, since wrapping is 1:1
  const inputAmount = useMemo(() => tryParseAmount(typedValue, inputCurrency ?? undefined), [inputCurrency, typedValue])
  const addTransactionWithType = useTransactionAdder()

  const isWrapLido =
    chainId === ChainId.MAINNET &&
    wstETHContract &&
    inputCurrency?.wrapped.address === stETH_ADDRESS &&
    outputCurrency?.wrapped.address === wstETH_ADDRESS

  const [approval, approvalCallback] = useApproveCallback(inputAmount, wstETH_ADDRESS)

  const isUnWrapLido =
    chainId === ChainId.MAINNET &&
    wstETHContract &&
    inputCurrency?.wrapped.address === wstETH_ADDRESS &&
    outputCurrency?.wrapped.address === stETH_ADDRESS

  const [amountOut, setAmountOut] = useState<TokenAmount | undefined>()

  useEffect(() => {
    if (!wstETHContract) return

    if (!inputAmount) setAmountOut(undefined)

    if (isWrapLido && inputAmount && outputCurrency) {
      wstETHContract.getWstETHByStETH(inputAmount.quotient.toString()).then((res: BigNumber) => {
        setAmountOut(TokenAmount.fromRawAmount(outputCurrency.wrapped, res.toString()))
      })
    }

    if (isUnWrapLido && inputAmount && outputCurrency) {
      wstETHContract.getStETHByWstETH(inputAmount.quotient.toString()).then((res: BigNumber) => {
        setAmountOut(TokenAmount.fromRawAmount(outputCurrency.wrapped, res.toString()))
      })
    }
  }, [wstETHContract, isWrapLido, isUnWrapLido, inputAmount, outputCurrency])

  return useMemo(() => {
    if (!wethContract || !chainId || !inputCurrency || !outputCurrency) return NOT_APPLICABLE

    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    const nativeTokenSymbol = nativeOnChain(chainId).symbol

    if (isWrapLido && wstETHContract) {
      return {
        wrapType: WrapType.WRAP,
        approval,
        outputAmount: amountOut,
        inputError: !typedValue
          ? t`Enter an amount`
          : sufficientBalance
          ? undefined
          : t`Insufficient ${inputCurrency?.symbol} balance`,
        execute:
          sufficientBalance && inputAmount
            ? approval === ApprovalState.NOT_APPROVED
              ? approvalCallback
              : async () => {
                  const estimateGas = await wstETHContract?.estimateGas.wrap(inputAmount?.quotient.toString())

                  const txReceipt = await wstETHContract?.wrap(inputAmount?.quotient.toString(), {
                    gasLimit: calculateGasMargin(estimateGas),
                  })

                  addTransactionWithType(txReceipt, {
                    type: 'Wrap',
                    summary: `${inputAmount?.toSignificant(6)} ${inputCurrency?.symbol} to ${amountOut?.toSignificant(
                      6,
                    )} ${outputCurrency?.symbol}`,
                  })
                }
            : undefined,
      }
    }

    if (isUnWrapLido && wstETHContract) {
      return {
        wrapType: WrapType.UNWRAP,
        outputAmount: amountOut,
        inputError: !typedValue
          ? t`Enter an amount`
          : sufficientBalance
          ? undefined
          : t`Insufficient ${inputCurrency?.symbol} balance`,

        execute:
          sufficientBalance && inputAmount
            ? async () => {
                const estimateGas = await wstETHContract?.estimateGas.unwrap(inputAmount?.quotient.toString())

                const txReceipt = await wstETHContract?.unwrap(inputAmount?.quotient.toString(), {
                  gasLimit: calculateGasMargin(estimateGas),
                })

                addTransactionWithType(txReceipt, {
                  type: 'Unwrap',
                  summary: `${inputAmount?.toSignificant(6)} ${inputCurrency?.symbol} to ${amountOut?.toSignificant(
                    6,
                  )} ${outputCurrency?.symbol}`,
                })
              }
            : undefined,
      }
    }

    if (inputCurrency.isNative && WETH[chainId].equals(outputCurrency)) {
      return {
        wrapType: WrapType.WRAP,
        outputAmount: TokenAmount.fromRawAmount(WETH[chainId], inputAmount?.quotient.toString() || 0),
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const estimateGas = await wethContract.estimateGas.deposit({
                    value: `0x${inputAmount.quotient.toString(16)}`,
                  })
                  const txReceipt = await wethContract.deposit({
                    value: `0x${inputAmount.quotient.toString(16)}`,
                    gasLimit: calculateGasMargin(estimateGas),
                  })
                  addTransactionWithType(txReceipt, {
                    type: 'Wrap',
                    summary: `${inputAmount.toSignificant(6)} ${nativeTokenSymbol} to ${inputAmount.toSignificant(
                      6,
                    )} W${nativeTokenSymbol}`,
                  })
                } catch (error) {
                  console.error('Could not deposit', error)
                }
              }
            : undefined,
        inputError: !typedValue
          ? t`Enter an amount`
          : sufficientBalance
          ? undefined
          : t`Insufficient ${nativeOnChain(chainId).symbol} balance`,
      }
    }
    if (WETH[chainId].equals(inputCurrency) && outputCurrency.isNative) {
      return {
        wrapType: WrapType.UNWRAP,
        outputAmount: CurrencyAmount.fromRawAmount(nativeOnChain(chainId), inputAmount?.quotient.toString() || 0),
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const estimateGas = await wethContract.estimateGas.withdraw(`0x${inputAmount.quotient.toString(16)}`)
                  const txReceipt = await wethContract.withdraw(`0x${inputAmount.quotient.toString(16)}`, {
                    gasLimit: calculateGasMargin(estimateGas),
                  })
                  addTransactionWithType(txReceipt, {
                    type: 'Unwrap',
                    summary: `${inputAmount.toSignificant(6)} W${nativeTokenSymbol} to ${inputAmount.toSignificant(
                      6,
                    )} ${nativeTokenSymbol}`,
                  })
                } catch (error) {
                  console.error('Could not withdraw', error)
                }
              }
            : undefined,
        inputError: !typedValue
          ? t`Enter an amount`
          : sufficientBalance
          ? undefined
          : t`Insufficient W${nativeOnChain(chainId).symbol} balance`,
      }
    }
    return NOT_APPLICABLE
  }, [
    approval,
    approvalCallback,
    isWrapLido,
    isUnWrapLido,
    amountOut,
    wstETHContract,
    wethContract,
    chainId,
    inputCurrency,
    outputCurrency,
    inputAmount,
    balance,
    addTransactionWithType,
    typedValue,
  ])
}
