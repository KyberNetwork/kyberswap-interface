import type { Token } from '@kyber/schema'
import TokenSelectorModal, { TOKEN_SELECT_MODE } from '@kyber/token-selector'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Briefcase, ChevronDown, Info } from 'react-feather'
import type { AgentCard, AgentProfile } from 'services/copyTrading/types'

import verifiedIcon from 'assets/images/copy-trading/verified.svg'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import InfoHelper from 'components/InfoHelper'
import { Center, HStack, Stack } from 'components/Stack'
import { ERC20_ABI } from 'constants/abis'
import { useActiveWeb3React } from 'hooks'
import { getAgentInitials } from 'pages/CopyTrading/helpers'
import { CopyTradeTxModal } from 'pages/CopyTrading/write/CopyTradeTxModal'
import { FOLLOWER_FACTORY_ABI } from 'pages/CopyTrading/write/abis'
import { COPY_TRADE_FEE_PCT, getCopyTradeContracts } from 'pages/CopyTrading/write/config'
import { useCopyTradeTx } from 'pages/CopyTrading/write/useCopyTradeTx'
import { useWalletModalToggle } from 'state/application/hooks'
import { shortenAddress } from 'utils/address'
import { cn } from 'utils/cn'
import { encodeFunctionData, parseUnits } from 'utils/viem'

export type SubscribeTarget = AgentCard | AgentProfile

type SubscribeModalProps = {
  isOpen: boolean
  onDismiss: () => void
  target: SubscribeTarget
}

// Stand-in for the connected wallet's available stablecoin balance. Replace with
// the on-chain balance read once the write path is wired to a real wallet.
const MOCK_AVAILABLE_BALANCE = 460568.25
const PRESETS = [25, 50, 75, 100]

const AgentHeader = ({ agent }: { agent: SubscribeTarget }) => {
  const address = agent.leaderAddress

  return (
    <HStack className="min-w-0 items-center gap-4">
      <Center className="size-12 shrink-0 rounded-full bg-buttonGray text-lg font-medium text-subText">
        {getAgentInitials(agent.displayName)}
      </Center>
      <Stack className="min-w-0 gap-1">
        <HStack className="min-w-0 items-center gap-1.5">
          <span className="truncate text-lg font-medium text-text">{agent.displayName}</span>
          {agent.isVerified && <img src={verifiedIcon} alt="Verified" className="size-5 shrink-0" />}
        </HStack>
        <HStack className="items-center gap-2 text-sm text-gray">
          <span>• {agent.modelName}</span>
          {address && (
            <>
              <span>•</span>
              <span>{shortenAddress(agent.chainId, address)}</span>
              <CopyHelper toCopy={address} margin="0" size={13} className="text-gray" />
            </>
          )}
        </HStack>
      </Stack>
    </HStack>
  )
}

const ReviewRow = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <HStack className="items-center justify-between text-sm">
    <HStack className="items-center gap-1 text-subText">
      {label}
      {hint && <InfoHelper margin={false} placement="top" size={14} text={hint} />}
    </HStack>
    <span className="font-medium text-text">{value}</span>
  </HStack>
)

const SubscribeModal = ({ isOpen, onDismiss, target }: SubscribeModalProps) => {
  const { account, chainId } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const { status, run: runTx, reset } = useCopyTradeTx()
  const [step, setStep] = useState<'configure' | 'review'>('configure')
  const [amount, setAmount] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [selectedToken, setSelectedToken] = useState<Token | undefined>(undefined)
  const [openTokenSelect, setOpenTokenSelect] = useState(false)

  const contracts = getCopyTradeContracts(chainId)
  // Defaults to the chain's fixed quote token; the selector lets the user fund with another token.
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

  const dismiss = () => {
    reset()
    setStep('configure')
    setAmount('')
    setAgreed(false)
    setSelectedToken(undefined)
    onDismiss()
  }

  const applyPreset = (pct: number) => setAmount(String(Math.floor((MOCK_AVAILABLE_BALANCE * pct) / 100)))
  const isPresetActive = (pct: number) =>
    amount !== '' && numericAmount === Math.floor((MOCK_AVAILABLE_BALANCE * pct) / 100)

  const handleSubmit = () =>
    runTx([
      {
        label: 'Creating your Smart Contract Wallet',
        build: () => {
          if (!contracts) throw new Error('Unsupported chain')
          if (!account) throw new Error('Wallet not connected')
          const owner = account
          const salt = `0x${'0'.repeat(64)}`
          return {
            to: contracts.factory,
            data: encodeFunctionData({
              abi: FOLLOWER_FACTORY_ABI,
              functionName: 'createFollowerAccount',
              args: [{ owner, leader: target.leaderAddress || owner, initialKSSigners: [], salt }],
            }),
          }
        },
      },
      {
        label: `Depositing ${amount} ${symbol}`,
        build: () => {
          if (!contracts || !token) throw new Error('Unsupported chain')
          const value = parseUnits(amount, token.decimals)
          // Real flow funds the account address emitted by CreateFollowerAccount /
          // precomputed via CREATE2; a non-quote token additionally needs a swap-in.
          return {
            to: token.address,
            data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'transfer', args: [contracts.factory, value] }),
          }
        },
      },
    ])

  return (
    <>
      {openTokenSelect &&
        chainId &&
        createPortal(
          <TokenSelectorModal
            chainId={chainId as number}
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
        title={<AgentHeader agent={target} />}
        successTitle={`You're now copying ${target.displayName}`}
        successText="New trades will be mirrored automatically from this moment."
        width="460px"
        bypassFocusLock={openTokenSelect}
      >
        {step === 'configure' ? (
          <Stack className="gap-4">
            <span className="text-base text-text">Allocate Capital</span>
            <Stack className="gap-4 rounded-xl bg-white-04 px-4 py-3">
              <HStack className="items-center justify-between">
                <HStack className="items-center gap-1">
                  {PRESETS.map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => applyPreset(pct)}
                      className={cn(
                        'rounded-lg px-3 py-1 text-xs font-medium text-gray transition-colors hover:text-subText',
                        isPresetActive(pct) && 'bg-white-08 text-white/70',
                      )}
                    >
                      {pct}%
                    </button>
                  ))}
                </HStack>
                <HStack className="items-center gap-1 text-sm text-subText">
                  <Briefcase size={14} />
                  <span>{MOCK_AVAILABLE_BALANCE.toLocaleString()}</span>
                </HStack>
              </HStack>
              <HStack className="items-center justify-between gap-3">
                <input
                  inputMode="decimal"
                  placeholder="0.0"
                  value={amount}
                  onChange={event => setAmount(event.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                  className="w-full min-w-0 bg-transparent text-2xl font-medium text-white outline-none placeholder:text-subText"
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

            <p className="text-sm text-white2">
              You will follow new trades from this moment. Your P&L may differ from the agent&apos;s stats until open
              positions close.
            </p>

            <HStack className="items-start gap-2.5 rounded-xl bg-blue/[0.08] p-3 text-blue2">
              <Info size={16} className="mt-0.5 shrink-0" />
              <span className="text-xs italic">
                Earlier subscribers get executed before later ones. Price may vary slightly across executions.
              </span>
            </HStack>

            <ButtonPrimary type="button" padding="12px" disabled={!hasValidAmount} onClick={() => setStep('review')}>
              Next →
            </ButtonPrimary>
          </Stack>
        ) : (
          <Stack className="gap-4">
            <span className="text-base text-text">Review Details</span>
            <Stack className="gap-2 rounded-xl bg-white-04 px-4 py-3">
              <ReviewRow label="Allocated Capital" value={`${amount} ${symbol}`} />
              <ReviewRow
                label="Max Price Deviation"
                value="1% (default)"
                hint="The maximum permitted price difference between the agent's execution price and your copy trade. Transactions exceeding the threshold are not executed."
              />
              <ReviewRow
                label="Performance Fee"
                value={`${COPY_TRADE_FEE_PCT}% of profits`}
                hint={`A fee of ${COPY_TRADE_FEE_PCT}% is charged when your position opens. If the trade closes at a loss, the fee is fully refunded. You only pay when you profit.`}
              />
            </Stack>

            <label className="flex cursor-pointer items-start gap-2 text-sm text-subText">
              <input
                type="checkbox"
                checked={agreed}
                onChange={event => setAgreed(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span>
                I understand the trading risks, fees, and execution mechanics of AI Copy Trading. Past performance does
                not guarantee future results.
              </span>
            </label>

            <HStack className="gap-3">
              <div className="w-full flex-1">
                <ButtonLight type="button" padding="12px" onClick={() => setStep('configure')}>
                  <HStack className="items-center justify-center gap-1">
                    <ArrowLeft size={16} />
                    Back
                  </HStack>
                </ButtonLight>
              </div>
              <div className="w-full flex-[2]">
                <ButtonPrimary
                  type="button"
                  padding="12px"
                  disabled={!!account && (!agreed || !contracts)}
                  onClick={account ? handleSubmit : toggleWalletModal}
                  className={cn(!!account && (!agreed || !contracts) && 'opacity-60')}
                >
                  {!account ? 'Connect wallet' : !contracts ? 'Unsupported chain' : 'Start Copying'}
                </ButtonPrimary>
              </div>
            </HStack>
          </Stack>
        )}
      </CopyTradeTxModal>
    </>
  )
}

export default SubscribeModal
