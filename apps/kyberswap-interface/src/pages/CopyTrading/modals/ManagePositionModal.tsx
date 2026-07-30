import { useState } from 'react'
import { ChevronDown } from 'react-feather'
import type { PositionSummary } from 'services/copyTrading/types'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import { formatUsd } from 'pages/CopyTrading/helpers'
import { CopyTradeTxModal } from 'pages/CopyTrading/write/CopyTradeTxModal'
import { FOLLOWER_ACCOUNT_ABI } from 'pages/CopyTrading/write/abis'
import { fetchUnalignedSellAuthorization } from 'pages/CopyTrading/write/mockSigner'
import { useCopyTradeTx } from 'pages/CopyTrading/write/useCopyTradeTx'
import { useWalletModalToggle } from 'state/application/hooks'
import { cn } from 'utils/cn'
import { encodeFunctionData, maxUint256 } from 'utils/viem'

export type ManagePositionMode = 'sell' | 'close'

type ManagePositionModalProps = {
  isOpen: boolean
  onDismiss: () => void
  position: PositionSummary
  mode: ManagePositionMode
}

const SELL_RATIOS = [25, 50, 100]
const SLIPPAGE_OPTIONS = [0.5, 1, 2]

const ManagePositionModal = ({ isOpen, onDismiss, position, mode }: ManagePositionModalProps) => {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const { status, run: runTx, reset } = useCopyTradeTx()
  const [ratio, setRatio] = useState(mode === 'close' ? 100 : 25)
  const [slippage, setSlippage] = useState(0.5)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const isClose = mode === 'close'
  const copyAccount = position.copyAccount

  const dismiss = () => {
    reset()
    setShowAdvanced(false)
    onDismiss()
  }

  const handleSell = () =>
    runTx([
      {
        label: `Selling ${ratio}% of ${position.token.symbol}`,
        build: async () => {
          if (!copyAccount) throw new Error('Missing wallet address')
          const auth = await fetchUnalignedSellAuthorization({
            chainId: position.chainId,
            copyAccount,
            positionId: position.positionId,
            sellRatioBps: ratio * 100,
            slippageBps: Math.round(slippage * 100),
          })
          return {
            to: copyAccount,
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
      },
    ])

  // Withdraws the account's available quote token (USDC) to the owner. The
  // contract's max-uint256 sentinel means "withdraw the full balance".
  const handleWithdraw = () =>
    runTx([
      {
        label: 'Withdrawing available USDC',
        build: () => {
          if (!copyAccount) throw new Error('Missing wallet address')
          if (!account) throw new Error('Wallet not connected')
          return {
            to: copyAccount,
            data: encodeFunctionData({
              abi: FOLLOWER_ACCOUNT_ABI,
              functionName: 'withdrawQuoteToken',
              args: [maxUint256, account],
            }),
          }
        },
      },
    ])

  return (
    <CopyTradeTxModal
      isOpen={isOpen}
      onDismiss={dismiss}
      status={status}
      title={isClose ? 'Close Position' : 'Manual Sell'}
      successTitle={isClose ? 'Position closed' : 'Sell submitted'}
      successText={`${position.token.symbol} · Trade ${position.tradeId}`}
    >
      <Stack className="gap-4">
        <Stack className="gap-1 rounded-xl bg-white-04 px-4 py-3 text-sm">
          <HStack className="items-center justify-between">
            <span className="text-subText">Position</span>
            <span className="font-medium text-text">
              {position.token.symbol} · {position.tradeId}
            </span>
          </HStack>
          <HStack className="items-center justify-between">
            <span className="text-subText">Value</span>
            <span className="font-medium text-text">{formatUsd(position.valueUsd)}</span>
          </HStack>
        </Stack>

        {!isClose && (
          <Stack className="gap-2">
            <span className="text-sm text-subText">Sell amount</span>
            <HStack className="gap-2">
              {SELL_RATIOS.map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRatio(value)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    ratio === value
                      ? 'border-primary bg-primary-12 text-primary'
                      : 'border-darkBorder text-subText hover:text-text',
                  )}
                >
                  {value === 100 ? 'All' : `${value}%`}
                </button>
              ))}
            </HStack>
          </Stack>
        )}

        <Stack className="gap-2">
          <span className="text-sm text-subText">Slippage tolerance</span>
          <HStack className="gap-2">
            {SLIPPAGE_OPTIONS.map(value => (
              <button
                key={value}
                type="button"
                onClick={() => setSlippage(value)}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  slippage === value
                    ? 'border-primary bg-primary-12 text-primary'
                    : 'border-darkBorder text-subText hover:text-text',
                )}
              >
                {value}%
              </button>
            ))}
          </HStack>
        </Stack>

        <ButtonPrimary
          type="button"
          padding="12px"
          disabled={!!account && !copyAccount}
          onClick={account ? handleSell : toggleWalletModal}
        >
          {!account
            ? 'Connect wallet'
            : !copyAccount
            ? 'Wallet unavailable'
            : isClose
            ? 'Close entire position'
            : `Sell ${ratio}%`}
        </ButtonPrimary>

        <Stack className="gap-2 border-t border-darkBorder pt-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(prev => !prev)}
            className="flex items-center gap-1 text-sm font-medium text-subText transition-colors hover:text-text"
          >
            Advanced
            <ChevronDown size={16} className={cn('transition-transform', showAdvanced && 'rotate-180')} />
          </button>
          {showAdvanced && (
            <Stack className="gap-2">
              <p className="text-xs text-subText">
                Withdraw the available USDC from your wallet without a swap. No cashback is returned. Token positions
                must be sold to exit.
              </p>
              <ButtonLight
                type="button"
                padding="10px 12px"
                disabled={!!account && !copyAccount}
                onClick={account ? handleWithdraw : toggleWalletModal}
              >
                {account ? 'Withdraw USDC' : 'Connect wallet'}
              </ButtonLight>
            </Stack>
          )}
        </Stack>
      </Stack>
    </CopyTradeTxModal>
  )
}

export default ManagePositionModal
