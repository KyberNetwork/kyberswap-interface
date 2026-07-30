import type { Token } from '@kyber/schema'
import TokenSelectorModal, { TOKEN_SELECT_MODE } from '@kyber/token-selector'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'react-feather'
import type { CopyRunSummary } from 'services/copyTrading/types'

import { ButtonPrimary } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { ERC20_ABI } from 'constants/abis'
import { useActiveWeb3React } from 'hooks'
import { CopyTradeTxModal } from 'pages/CopyTrading/write/CopyTradeTxModal'
import { getCopyTradeContracts } from 'pages/CopyTrading/write/config'
import { useCopyTradeTx } from 'pages/CopyTrading/write/useCopyTradeTx'
import { useWalletModalToggle } from 'state/application/hooks'
import { encodeFunctionData, parseUnits } from 'utils/viem'

type AddCapitalModalProps = {
  isOpen: boolean
  onDismiss: () => void
  run: CopyRunSummary
  agentName?: string
}

const AddCapitalModal = ({ isOpen, onDismiss, run, agentName }: AddCapitalModalProps) => {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const { status, run: runTx, reset } = useCopyTradeTx()
  const [amount, setAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState<Token | undefined>(undefined)
  const [openTokenSelect, setOpenTokenSelect] = useState(false)

  const contracts = getCopyTradeContracts(run.chainId)
  // Defaults to the wallet's fixed quote token; the selector lets the user fund with another token.
  const defaultToken = useMemo<Token | undefined>(
    () =>
      contracts
        ? {
            address: contracts.quoteToken,
            symbol: contracts.quoteTokenSymbol,
            name: contracts.quoteTokenSymbol,
            decimals: contracts.quoteTokenDecimals,
            isStable: true,
          }
        : undefined,
    [contracts],
  )
  const token = selectedToken ?? defaultToken
  const symbol = token?.symbol || 'USDC'
  const numericAmount = Number(amount)
  const hasValidAmount = Number.isFinite(numericAmount) && numericAmount > 0
  const usdEstimate = numericAmount * (token?.price ?? 1)
  const canSubmit = !!account && hasValidAmount && !!token

  const dismiss = () => {
    reset()
    setAmount('')
    setSelectedToken(undefined)
    onDismiss()
  }

  const handleSubmit = () =>
    runTx([
      {
        label: `Depositing ${amount} ${symbol}`,
        build: () => {
          if (!token) throw new Error('Unsupported chain')
          const value = parseUnits(amount, token.decimals)
          // A non-quote token additionally needs a swap-in before it funds the wallet.
          return {
            to: token.address,
            data: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: 'transfer',
              args: [run.copyAccount, value],
            }),
          }
        },
      },
    ])

  return (
    <>
      {openTokenSelect &&
        createPortal(
          <TokenSelectorModal
            chainId={run.chainId as number}
            onClose={() => setOpenTokenSelect(false)}
            wallet={{ account, onConnectWallet: toggleWalletModal }}
            tokenOptions={{
              mode: TOKEN_SELECT_MODE.SELECT,
              selectedTokenAddress: token?.address,
              onTokenSelect: nextToken => {
                setSelectedToken(nextToken)
                setOpenTokenSelect(false)
              },
            }}
          />,
          document.body,
        )}
      <CopyTradeTxModal
        isOpen={isOpen}
        onDismiss={dismiss}
        status={status}
        title="Add Capital"
        successTitle="Capital added"
        successText={`Your ${symbol} was deposited into your Smart Contract Wallet.`}
        bypassFocusLock={openTokenSelect}
      >
        <Stack className="gap-4">
          <p className="text-sm text-subText">
            Deposit more into your copy wallet{agentName ? ` for ${agentName}` : ''}. Larger balances size up future
            copy trades.
          </p>
          <Stack className="gap-2 rounded-xl bg-white-04 px-4 py-3">
            <HStack className="items-center justify-between gap-3">
              <input
                inputMode="decimal"
                placeholder="0.0"
                value={amount}
                onChange={event => setAmount(event.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                className="w-full min-w-0 bg-transparent text-2xl font-medium text-text outline-none placeholder:text-subText"
              />
              <span className="shrink-0 text-base text-subText">~${usdEstimate.toLocaleString()}</span>
              <button
                type="button"
                onClick={() => setOpenTokenSelect(true)}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-white-04 px-4 py-2 text-lg text-white/70 transition-colors hover:brightness-125"
              >
                {token?.logo && <img src={token.logo} alt={symbol} className="size-5 rounded-full" />}
                {symbol}
                <ChevronDown size={16} />
              </button>
            </HStack>
          </Stack>
          <ButtonPrimary
            type="button"
            padding="12px"
            disabled={!!account && !canSubmit}
            onClick={account ? handleSubmit : toggleWalletModal}
          >
            {!account ? 'Connect wallet' : !token ? 'Unsupported chain' : 'Add Capital'}
          </ButtonPrimary>
        </Stack>
      </CopyTradeTxModal>
    </>
  )
}

export default AddCapitalModal
