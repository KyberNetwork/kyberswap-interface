import { MaxUint256 } from '@ethersproject/constants'
import { getCapabilities, sendCalls, waitForCallsStatus } from '@wagmi/core'
import { Contract } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { useCallback, useMemo, useState } from 'react'
import { DustSwapRouteApiResponse } from 'services/dustSwap'
import { encodeFunctionData, erc20Abi } from 'viem'
import { useConfig } from 'wagmi'

import ERC20_ABI from 'constants/abis/erc20.json'
import { ETHER_ADDRESS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useDustLiquidationState } from 'state/dustLiquidation/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE, TransactionExtraInfoDustSwap } from 'state/transactions/type'
import { calculateGasMargin } from 'utils'
import { friendlyError } from 'utils/errorMessage'

import useBuildDustRoute from './useBuildDustRoute'

export type ExecuteStatus = 'idle' | 'building' | 'approving' | 'submitting' | 'pending' | 'success' | 'error'

export type ExecutePath = 'atomic' | 'sequential'

type Result = {
  execute: () => Promise<void>
  status: ExecuteStatus
  error: string | null
  txHash: string | null
  path: ExecutePath | null
  // For UX feedback during sequential approvals.
  approvalProgress: { current: number; total: number } | null
  reset: () => void
}

const isNative = (addr: string) => addr.toLowerCase() === ETHER_ADDRESS.toLowerCase()

const useDustExecute = ({ route }: { route: DustSwapRouteApiResponse | undefined }): Result => {
  const config = useConfig()
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { inputs, outputToken, recipient } = useDustLiquidationState()
  const addTx = useTransactionAdder()
  const { build } = useBuildDustRoute()

  const [status, setStatus] = useState<ExecuteStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [path, setPath] = useState<ExecutePath | null>(null)
  const [approvalProgress, setApprovalProgress] = useState<{ current: number; total: number } | null>(null)

  const erc20Inputs = useMemo(
    () => inputs.filter(i => !isNative(i.address) && i.amount && Number(i.amount) > 0),
    [inputs],
  )

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
    setTxHash(null)
    setPath(null)
    setApprovalProgress(null)
  }, [])

  const makeExtraInfo = useCallback(
    (amountOut: string, amountOutUsd: string | undefined, routerAddress: string): TransactionExtraInfoDustSwap => ({
      tokensIn: inputs
        .filter(i => i.amount && Number(i.amount) > 0)
        .map(i => ({ address: i.address, symbol: i.symbol, amount: i.amount, logoUrl: i.logo })),
      tokenAddressOut: outputToken?.address || '',
      tokenSymbolOut: outputToken?.symbol || '',
      tokenAmountOut: amountOut,
      tokenLogoURLOut: outputToken?.logo,
      amountOutUsd,
      contract: routerAddress,
    }),
    [inputs, outputToken],
  )

  const execute = useCallback(async () => {
    if (!route?.data || !account || !outputToken || !library) {
      setError('Missing required state')
      setStatus('error')
      return
    }

    try {
      setError(null)
      setStatus('building')

      const built = await build({ route: route.data.route, recipient: recipient ?? account })
      const router = built.routerAddress as `0x${string}`

      // Approve MaxUint256 — saves the user from re-approving on a future dust pass.
      // The router enforces the exact pulled amount via the swap calldata.
      const maxApproval = BigInt(MaxUint256.toString())
      const approvalCalls = erc20Inputs.map(i => ({
        to: i.address as `0x${string}`,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [router, maxApproval],
        }),
      }))
      const swapCall = {
        to: router,
        data: built.callData as `0x${string}`,
        value: BigInt(built.value || '0'),
      }

      // Compute formatted output amount for the receipt — best effort.
      const outputAmountHuman = formatRawAmount(built.quoteAmountOut, outputToken.decimals)
      const extraInfo = makeExtraInfo(outputAmountHuman, built.amountOutUsd, router)

      // --- Path A: EIP-5792 atomic batch ---
      let atomicSupported = false
      try {
        // wagmi's chainId is tightly typed to the configured chains list; cast since
        // we already filtered by isDustSwapSupported upstream.
        const caps = await getCapabilities(config, {
          account: account as `0x${string}`,
          chainId: chainId as never,
        })
        const chainCaps = (caps as Record<number, { atomic?: { status?: string } }>)?.[chainId]
        const atomicStatus = chainCaps?.atomic?.status
        atomicSupported = atomicStatus === 'supported' || atomicStatus === 'ready'
      } catch {
        atomicSupported = false
      }

      if (atomicSupported) {
        setPath('atomic')
        setStatus('submitting')
        const { id } = await sendCalls(config, {
          account: account as `0x${string}`,
          chainId: chainId as never,
          calls: [...approvalCalls, swapCall],
          forceAtomic: true,
        })

        setStatus('pending')
        const statusResp = await waitForCallsStatus(config, { id, timeout: 120_000 })
        const receipt = statusResp.receipts?.[statusResp.receipts.length - 1]
        if (!receipt?.transactionHash) throw new Error('Bundle confirmed but no transaction hash returned')
        const hash = receipt.transactionHash as string
        setTxHash(hash)
        await addTx({ hash, type: TRANSACTION_TYPE.DUST_SWAP, extraInfo })
        setStatus('success')
        return
      }

      // --- Path C: sequential ---
      setPath('sequential')

      // Approvals one at a time, only for tokens with insufficient allowance.
      if (erc20Inputs.length > 0) {
        setStatus('approving')
        setApprovalProgress({ current: 0, total: erc20Inputs.length })
        const signer = library.getSigner(account)
        for (let i = 0; i < erc20Inputs.length; i++) {
          const input = erc20Inputs[i]
          const amount = parseUnits(input.amount, input.decimals)
          const tokenContract = new Contract(input.address, ERC20_ABI, signer)
          // Skip approvals where allowance already covers the swap amount.
          const allowance = await tokenContract.allowance(account, router)
          if (!allowance.lt(amount)) {
            setApprovalProgress({ current: i + 1, total: erc20Inputs.length })
            continue
          }
          // For tokens that require zero-reset (e.g. USDT) — set 0 first if currently non-zero.
          if (!allowance.isZero()) {
            const gasZero = await tokenContract.estimateGas.approve(router, 0)
            const txZero = await tokenContract.approve(router, 0, { gasLimit: calculateGasMargin(gasZero) })
            await txZero.wait()
          }
          const gas = await tokenContract.estimateGas.approve(router, MaxUint256)
          const txA = await tokenContract.approve(router, MaxUint256, { gasLimit: calculateGasMargin(gas) })
          await addTx({
            hash: txA.hash,
            type: TRANSACTION_TYPE.APPROVE,
            extraInfo: { tokenSymbol: input.symbol, tokenAddress: input.address, contract: router },
          })
          await txA.wait()
          setApprovalProgress({ current: i + 1, total: erc20Inputs.length })
        }
      }

      setStatus('submitting')
      const signer = library.getSigner(account)
      const swapTx = await signer.sendTransaction({
        to: router,
        data: built.callData,
        value: built.value || '0',
      })
      setTxHash(swapTx.hash)
      await addTx({ hash: swapTx.hash, type: TRANSACTION_TYPE.DUST_SWAP, extraInfo })
      setStatus('pending')
      await swapTx.wait()
      setStatus('success')
    } catch (e) {
      const msg = friendlyError(e)
      console.error('Dust execute error:', e)
      setError(msg)
      setStatus('error')
    }
  }, [route, account, outputToken, library, build, recipient, erc20Inputs, config, chainId, addTx, makeExtraInfo])

  return { execute, status, error, txHash, path, approvalProgress, reset }
}

const formatRawAmount = (raw: string, decimals: number): string => {
  try {
    if (!raw) return '0'
    const negative = raw.startsWith('-')
    const stripped = negative ? raw.slice(1) : raw
    if (decimals === 0) return (negative ? '-' : '') + stripped
    const padded = stripped.padStart(decimals + 1, '0')
    const integer = padded.slice(0, padded.length - decimals)
    const fractional = padded.slice(padded.length - decimals).replace(/0+$/, '')
    return (negative ? '-' : '') + (fractional ? `${integer}.${fractional}` : integer)
  } catch {
    return '0'
  }
}

export default useDustExecute
