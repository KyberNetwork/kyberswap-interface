import { useMemo, useState } from 'react'
import copyTradingApi from 'services/copyTrading'
import type { CopyRunSummary } from 'services/copyTrading/types'

import { ButtonWarning } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { signedUsd } from 'pages/CopyTrading/helpers'
import { CopyTradeTxModal } from 'pages/CopyTrading/write/CopyTradeTxModal'
import { FOLLOWER_ACCOUNT_ABI } from 'pages/CopyTrading/write/abis'
import { FollowerPause } from 'pages/CopyTrading/write/config'
import { fetchUnalignedSellAuthorization } from 'pages/CopyTrading/write/mockSigner'
import { type CopyTxStep, useCopyTradeTx } from 'pages/CopyTrading/write/useCopyTradeTx'
import { useWalletModalToggle } from 'state/application/hooks'
import { cn } from 'utils/cn'
import { encodeFunctionData } from 'utils/viem'

type StopCopyModalProps = {
  isOpen: boolean
  onDismiss: () => void
  run: CopyRunSummary
  agentName?: string
}

const StopCopyModal = ({ isOpen, onDismiss, run, agentName }: StopCopyModalProps) => {
  const { account } = useActiveWeb3React()
  const { ownerAddress } = useCopyTradingContext()
  const toggleWalletModal = useWalletModalToggle()
  const { status, run: runTx, reset } = useCopyTradeTx()
  const { data: positionsData } = copyTradingApi.useGetCopyRunPositionsQuery(
    { ownerAddress: ownerAddress || '', copyRunId: run.copyRunId, status: 'open' },
    { skip: !isOpen || !ownerAddress },
  )
  const positions = useMemo(() => positionsData?.data || [], [positionsData])

  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [slippage, setSlippage] = useState(0.5)

  // Default every position to selected once the list loads.
  const isSelected = (id: string) => selected[id] ?? true
  const toggle = (id: string) => setSelected(prev => ({ ...prev, [id]: !isSelected(id) }))

  const selectedPositions = positions.filter(position => isSelected(position.positionId))

  const dismiss = () => {
    reset()
    setSelected({})
    onDismiss()
  }

  const handleStop = () => {
    const steps: CopyTxStep[] = [
      {
        label: 'Halting copy trades',
        build: () => ({
          to: run.copyAccount,
          data: encodeFunctionData({
            abi: FOLLOWER_ACCOUNT_ABI,
            functionName: 'updatePauseState',
            args: [FollowerPause.PAUSE_PERMANENTLY],
          }),
        }),
      },
      ...selectedPositions.map(position => ({
        label: `Selling ${position.token.symbol}`,
        build: async () => {
          const auth = await fetchUnalignedSellAuthorization({
            chainId: position.chainId,
            copyAccount: run.copyAccount,
            positionId: position.positionId,
            sellRatioBps: 10000,
            slippageBps: Math.round(slippage * 100),
          })
          return {
            to: run.copyAccount,
            data: encodeFunctionData({
              abi: FOLLOWER_ACCOUNT_ABI,
              functionName: 'executeFollowerUnalignedSell',
              args: [
                {
                  positionId: position.positionId,
                  swapper: auth.swapper,
                  encodedAmountIn: BigInt(auth.encodedAmountIn),
                  swapperData: auth.swapperData,
                  minQuoteTokenReceived: BigInt(auth.minQuoteTokenReceived),
                  deadline: BigInt(auth.deadline),
                  signature: auth.signature,
                },
              ],
            }),
          }
        },
      })),
    ]

    runTx(steps)
  }

  return (
    <CopyTradeTxModal
      isOpen={isOpen}
      onDismiss={dismiss}
      status={status}
      title={`Stop Copying${agentName ? ` ${agentName}` : ''}`}
      successTitle="Copy stopped"
      successText="Selected positions are being sold. Unchecked tokens stay in your wallet."
      width="480px"
    >
      <Stack className="gap-4">
        <span className="text-sm text-subText">Select positions to sell. Unchecked tokens stay in your wallet.</span>

        <Stack className="max-h-64 gap-1 overflow-y-auto">
          {positions.length ? (
            positions.map(position => {
              const negative = Number(position.unrealizedPnlUsd || 0) < 0
              return (
                <label
                  key={position.positionId}
                  className="flex cursor-pointer items-center gap-3 rounded-lg bg-white-04 px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={isSelected(position.positionId)}
                    onChange={() => toggle(position.positionId)}
                    className="size-4 shrink-0 accent-primary"
                  />
                  <HStack className="min-w-0 flex-1 items-center justify-between gap-2">
                    <Stack className="gap-0.5">
                      <span className="text-sm font-medium text-text">{position.token.symbol}</span>
                      <span className="text-xs text-subText">{position.tradeId}</span>
                    </Stack>
                    <span className={cn('text-sm font-medium', negative ? 'text-red' : 'text-primary')}>
                      {signedUsd(position.unrealizedPnlUsd)}
                    </span>
                  </HStack>
                </label>
              )
            })
          ) : (
            <span className="py-4 text-center text-sm text-subText">No open positions to sell.</span>
          )}
        </Stack>

        <HStack className="items-center justify-between">
          <span className="text-sm text-subText">Slippage tolerance</span>
          <HStack className="gap-2">
            {[0.5, 1, 2].map(value => (
              <button
                key={value}
                type="button"
                onClick={() => setSlippage(value)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  slippage === value
                    ? 'border-primary bg-primary-12 text-primary'
                    : 'border-darkBorder text-subText hover:text-text',
                )}
              >
                {value}%
              </button>
            ))}
          </HStack>
        </HStack>

        <ButtonWarning
          type="button"
          padding="12px"
          disabled={!!account && (!positions.length || !selectedPositions.length)}
          onClick={account ? handleStop : toggleWalletModal}
        >
          {!account ? 'Connect wallet' : `Stop & sell ${selectedPositions.length} selected`}
        </ButtonWarning>
      </Stack>
    </CopyTradeTxModal>
  )
}

export default StopCopyModal
