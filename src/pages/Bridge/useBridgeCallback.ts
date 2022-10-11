import { useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useBridgeContract, useSwapBTCContract, useSwapETHContract } from 'hooks/useContract'
import { useBridgeState } from 'state/bridge/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance, useETHBalances } from 'state/wallet/hooks'
import { isAddress } from 'utils'

const NOT_APPLICABLE = {
  execute: async () => {
    //
  },
  inputError: false,
}

export function useBridgeCallback(
  routerToken: string | undefined,
  inputToken: string | undefined,
  typedValue: string | undefined,
  isNative: boolean,
) {
  const [{ tokenOut, tokenIn, chainIdOut, currencyIn }] = useBridgeState()
  const version = tokenOut?.type
  const { account, chainId } = useActiveWeb3React()
  const toAddress = account
  const bridgeContract = useBridgeContract(isAddress(routerToken), chainIdOut && isNaN(chainIdOut) ? 'V2' : '')
  const ethbalance = useETHBalances(account ? [account] : [])?.[account ?? '']
  const anybalance = useCurrencyBalance(account ?? undefined, currencyIn)
  const balance = isNative ? ethbalance : anybalance

  const inputAmount = useMemo(() => tryParseAmount(typedValue, currencyIn ?? undefined), [currencyIn, typedValue])

  return useMemo(() => {
    if (!bridgeContract || !chainId || !tokenIn || !toAddress || !chainIdOut) return NOT_APPLICABLE

    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)
    return {
      execute: async (useSwapMethods: string) => {
        if (!sufficientBalance || !inputAmount) return Promise.reject()
        const results: any = {}
        try {
          let promise
          const params = [inputToken, toAddress, tokenOut?.chainId, { value: `0x${inputAmount.quotient.toString(16)}` }]
          const params2 = [inputToken, toAddress, `0x${inputAmount.quotient.toString(16)}`, tokenOut?.chainId]
          if (useSwapMethods.includes('anySwapOutNative')) {
            promise = bridgeContract.anySwapOutNative(...params)
          } else if (useSwapMethods.includes('anySwapOutUnderlying')) {
            promise = bridgeContract.anySwapOutUnderlying(...params2)
          } else if (useSwapMethods.includes('anySwapOut')) {
            promise = bridgeContract.anySwapOut(...params2)
          }
          const txReceipt = promise ? await promise : Promise.reject('wrong method')
          if (txReceipt?.hash && account) {
            const data = {
              hash: txReceipt.hash.indexOf('0x') === 0 ? txReceipt.hash?.toLowerCase() : txReceipt.hash,
              chainId,
              selectChain: chainIdOut,
              account: account?.toLowerCase(),
              value: inputAmount.quotient.toString(),
              formatvalue: inputAmount?.toSignificant(6),
              to: toAddress.indexOf('0x') === 0 ? toAddress?.toLowerCase() : toAddress,
              symbol: tokenIn?.symbol,
              routerToken: routerToken,
              version: version,
            }
            console.log(data)
            //   recordsTxns(data)
            results.hash = txReceipt?.hash
          }
        } catch (error) {
          console.error('Could not swap', error)
        }
        return results
      },
      inputError: !sufficientBalance,
    }
  }, [
    bridgeContract,
    account,
    balance,
    chainId,
    inputAmount,
    inputToken,
    routerToken,
    tokenIn,
    toAddress,
    chainIdOut,
    version,
    tokenOut,
  ])
}

export function useCrossBridgeCallback(
  toAddress: string | undefined | null,
  inputToken: string | undefined,
  typedValue: string | undefined,
): { execute?: undefined | (() => Promise<void>); inputError?: boolean } {
  const [{ tokenOut, chainIdOut, tokenIn, currencyIn }] = useBridgeState()
  const txnsType = tokenOut?.type
  const pairid = tokenOut?.pairid
  const { chainId, account, library } = useActiveWeb3React()
  const tokenBalance = useCurrencyBalance(account ?? undefined, currencyIn)
  const ethBalance = useETHBalances(account ? [account] : [])?.[account ?? '']
  const balance = tokenIn && tokenIn?.tokenType !== 'NATIVE' ? tokenBalance : ethBalance
  const receiveAddress = account
  const inputAmount = useMemo(() => tryParseAmount(typedValue, currencyIn), [currencyIn, typedValue])
  const contractBTC = useSwapBTCContract(isAddress(inputToken) ? inputToken : undefined)
  const contractETH = useSwapETHContract(isAddress(inputToken) ? inputToken : undefined)
  return useMemo(() => {
    if (!chainId || !toAddress || !chainIdOut || !library || !receiveAddress) return NOT_APPLICABLE

    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    return {
      execute: async () => {
        if (!sufficientBalance || !inputAmount) return Promise.reject()
        try {
          let txReceipt: any
          if (txnsType === 'swapin') {
            if (isAddress(inputToken) && tokenIn?.tokenType !== 'NATIVE') {
              if (contractETH) {
                txReceipt = await contractETH.transfer(toAddress, `0x${inputAmount.quotient.toString(16)}`)
              } else {
                return
              }
            } else {
              const data: any = {
                from: account,
                to: toAddress,
                value: `0x${inputAmount.quotient.toString(16)}`,
              }
              const hash = await library.send('eth_sendTransaction', [data])
              txReceipt = hash && hash.toString().indexOf('0x') === 0 ? { hash } : ''
            }
          } else {
            if (chainIdOut && isNaN(chainIdOut)) {
              if (contractBTC) {
                txReceipt = await contractBTC.Swapout(`0x${inputAmount.quotient.toString(16)}`, toAddress)
              } else {
                return
              }
            } else {
              if (contractETH) {
                txReceipt = await contractETH.Swapout(`0x${inputAmount.quotient.toString(16)}`, toAddress)
              } else {
                return
              }
            }
          }
          const txData: any = { hash: txReceipt?.hash }
          if (txData.hash && account) {
            let srcChainID = chainId
            let destChainID = chainIdOut
            if (txnsType === 'swapout') {
              srcChainID = chainIdOut
              destChainID = chainId
            }

            const rdata = {
              hash: txData.hash,
              chainId: srcChainID,
              selectChain: destChainID,
              account: account?.toLowerCase(),
              value: inputAmount.quotient.toString(),
              formatvalue: inputAmount?.toSignificant(6),
              to: receiveAddress,
              symbol: '',
              version: txnsType,
              pairid: pairid,
            }
            console.log(rdata)

            // recordsTxns(rdata)
          }
        } catch (error) {
          console.log('Could not swapout', error)
        }
      },
      inputError: !sufficientBalance,
    }
  }, [
    chainId,
    contractBTC,
    contractETH,
    tokenIn,
    inputAmount,
    balance,
    txnsType,
    account,
    toAddress,
    inputToken,
    chainIdOut,
    pairid,
    library,
    receiveAddress,
  ])
}
