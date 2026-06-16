import { ChainId as SchemaChainId, Token as SchemaToken } from '@kyber/schema'
import TokenSelectorModal, { TOKEN_SELECT_MODE } from '@kyber/token-selector'
import { Trans } from '@lingui/macro'
import {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Plus, X } from 'react-feather'
import { useStore } from 'react-redux'

import Logo from 'components/Logo'
import { DUST_MAX_INPUTS_TOTAL } from 'constants/dustLiquidation'
import { ETHER_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useTokenBalance from 'hooks/useTokenBalance'
import { AppState } from 'state'
import { useWalletModalToggle } from 'state/application/hooks'
import { DustInput, DustToken } from 'state/dustLiquidation/actions'
import { useDustLiquidationActions, useDustLiquidationState } from 'state/dustLiquidation/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { getNativeTokenLogo } from 'utils'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

const Row = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center gap-3 rounded-2xl bg-buttonBlack px-4 py-3.5 transition-colors duration-150 hover:bg-buttonGray',
      className,
    )}
    {...rest}
  />
)

const TokenMeta = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex min-w-0 flex-col gap-0.5', className)} {...rest} />
)

const Symbol = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-sm font-medium leading-tight text-text', className)} {...rest} />
)

const BalanceRow = ({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-left text-xs leading-tight text-subText hover:text-primary',
      className,
    )}
    {...rest}
  />
)

const MaxBadge = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'rounded-full bg-primary-20 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-primary',
      className,
    )}
    {...rest}
  />
)

const AmountColumn = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex min-w-0 flex-1 flex-col items-end gap-0.5', className)} {...rest} />
)

const AmountInput = ({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      'w-full min-w-0 border-0 bg-transparent text-right text-lg font-medium leading-tight text-text outline-none placeholder:text-subText',
      className,
    )}
    {...rest}
  />
)

const AmountUsd = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-xs leading-tight text-subText', className)} {...rest} />
)

const RemoveButton = ({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'hover:bg-red1/10 flex cursor-pointer items-center rounded-lg border-0 bg-transparent p-1 text-subText hover:text-red1',
      className,
    )}
    {...rest}
  />
)

const AddButton = ({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-transparent px-3 py-2.5 text-sm font-medium text-primary hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...rest}
  />
)

const EmptyState = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-3 text-center text-[13px] text-subText', className)} {...rest} />
)

const sanitizeAmount = (raw: string): string => {
  // Allow digits and a single decimal separator
  const normalized = raw.replace(',', '.').replace(/[^\d.]/g, '')
  const parts = normalized.split('.')
  if (parts.length <= 1) return normalized
  return parts[0] + '.' + parts.slice(1).join('')
}

const formatUsd = (n: number): string => {
  if (!Number.isFinite(n) || n <= 0) return '-'
  if (n < 0.01) return '<$0.01'
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: n >= 1000 ? 0 : 2 })}`
}

const TokenRow = ({ input, price }: { input: DustInput; price?: number }) => {
  const { chainId } = useActiveWeb3React()
  const { removeToken, updateAmount } = useDustLiquidationActions()
  const { value, decimals } = useTokenBalance(input.address)
  // One-shot guard: auto-fill to max only on first balance load. If the user clears
  // the input after that, we don't re-fill — their action wins.
  const autoFilledRef = useRef(false)

  const isNative = input.address.toLowerCase() === ETHER_ADDRESS.toLowerCase()
  const logoSrcs = useMemo(() => {
    const srcs: string[] = []
    if (isNative) {
      const native = getNativeTokenLogo(chainId)
      if (native) srcs.push(native)
    }
    if (input.logo) srcs.push(input.logo)
    return srcs
  }, [isNative, chainId, input.logo])

  const balanceDisplay = useMemo(() => {
    if (!value) return '0'
    try {
      const formatted = formatUnits(value, decimals)
      return formatDisplayNumber(formatted, { significantDigits: 6 })
    } catch {
      return '0'
    }
  }, [value, decimals])

  const amountUsd = useMemo(() => {
    if (!price || price <= 0 || !input.amount) return undefined
    const n = Number(input.amount)
    if (!Number.isFinite(n) || n <= 0) return undefined
    return n * price
  }, [price, input.amount])

  useEffect(() => {
    if (autoFilledRef.current) return
    // If the row was added with an existing amount (e.g., re-added after a remove),
    // honor it and stop auto-filling.
    if (input.amount) {
      autoFilledRef.current = true
      return
    }
    if (!value || value === 0n) return
    try {
      updateAmount(input.address, formatUnits(value, decimals))
      autoFilledRef.current = true
    } catch {
      /* swallow */
    }
  }, [value, decimals, input.address, input.amount, updateAmount])

  const onMax = useCallback(() => {
    if (!value || value === 0n) return
    try {
      updateAmount(input.address, formatUnits(value, decimals))
    } catch {
      /* swallow */
    }
  }, [value, decimals, input.address, updateAmount])

  const hasBalance = !!value && value !== 0n

  return (
    <Row>
      <Logo srcs={logoSrcs} alt={input.symbol} style={{ width: 28, height: 28, borderRadius: 999 }} />
      <TokenMeta>
        <Symbol>{input.symbol}</Symbol>
        <BalanceRow type="button" onClick={onMax} disabled={!hasBalance}>
          <Trans>Balance:</Trans> {balanceDisplay}
          {hasBalance && <MaxBadge>Max</MaxBadge>}
        </BalanceRow>
      </TokenMeta>
      <AmountColumn>
        <AmountInput
          inputMode="decimal"
          placeholder="0.0"
          value={input.amount}
          onChange={e => updateAmount(input.address, sanitizeAmount(e.target.value))}
        />
        {amountUsd !== undefined && <AmountUsd>≈ {formatUsd(amountUsd)}</AmountUsd>}
      </AmountColumn>
      <RemoveButton type="button" onClick={() => removeToken(input.address)} aria-label="Remove token">
        <X size={16} />
      </RemoveButton>
    </Row>
  )
}

const toDustToken = (t: SchemaToken): DustToken => ({
  address: t.address,
  symbol: t.symbol,
  decimals: t.decimals,
  logo: t.logo,
})

const TokenMultiSelector = () => {
  const { account, chainId } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const { inputs } = useDustLiquidationState()
  const { replace } = useDustLiquidationActions()
  const store = useStore<AppState>()
  const [showModal, setShowModal] = useState(false)

  // Pull prices for every token on the chain so the modal can show USD per row
  // (it's the same dataset the modal renders), and so each selected From-row
  // can compute amount × price. The price hook batches into chunks of 100 and
  // caches in redux, so subsequent renders are free.
  const allTokens = useAllTokens(true)
  const allTokenAddresses = useMemo(() => Object.keys(allTokens), [allTokens])
  const tokenPrices = useTokenPrices(allTokenAddresses, chainId)

  const modalTokensIn: SchemaToken[] = useMemo(
    () =>
      inputs.map(i => ({
        address: i.address,
        symbol: i.symbol,
        name: i.symbol,
        decimals: i.decimals,
        logo: i.logo,
      })),
    [inputs],
  )

  const modalAmountsIn = useMemo(() => inputs.map(i => i.amount || '0').join(','), [inputs])

  // The modal calls setTokensIn and setAmountsIn synchronously on Save. Reading from the
  // store here (not from `inputs` closure) ensures the second callback sees the state
  // updated by the first — otherwise the amount-sync below would clobber the just-added
  // tokens with an empty list and "saving tokens" would appear to do nothing.
  const onTokensChanged = useCallback(
    (nextTokens: SchemaToken[]) => {
      const current = store.getState().dustLiquidation.inputs
      const prev = new Map(current.map(i => [i.address.toLowerCase(), i]))
      const next: DustInput[] = nextTokens.map(t => {
        const existing = prev.get(t.address.toLowerCase())
        return existing ? { ...existing, ...toDustToken(t) } : { ...toDustToken(t), amount: '' }
      })
      replace(next)
    },
    [replace, store],
  )

  const onAmountsChanged = useCallback(
    (joined: string) => {
      const arr = joined.split(',')
      const current = store.getState().dustLiquidation.inputs
      const next: DustInput[] = current.map((input, idx) => ({
        ...input,
        amount: arr[idx] && arr[idx] !== '0' ? arr[idx] : input.amount,
      }))
      replace(next)
    },
    [replace, store],
  )

  return (
    <div className="flex flex-col gap-2">
      {inputs.length === 0 ? (
        <EmptyState>
          <Trans>No tokens selected. Add tokens below.</Trans>
        </EmptyState>
      ) : (
        inputs.map(input => (
          <TokenRow key={input.address} input={input} price={tokenPrices[input.address.toLowerCase()]} />
        ))
      )}

      <AddButton type="button" onClick={() => setShowModal(true)} disabled={inputs.length >= DUST_MAX_INPUTS_TOTAL}>
        <Plus size={16} />
        <Trans>Add Token{inputs.length > 0 ? 's' : ''}</Trans>
      </AddButton>

      {showModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <TokenSelectorModal
            chainId={chainId as unknown as SchemaChainId}
            onClose={() => setShowModal(false)}
            wallet={{ account, onConnectWallet: toggleWalletModal }}
            tokenOptions={{
              mode: TOKEN_SELECT_MODE.ADD,
              tokensIn: modalTokensIn,
              amountsIn: modalAmountsIn,
              setTokensIn: onTokensChanged,
              setAmountsIn: onAmountsChanged,
              maxTokens: DUST_MAX_INPUTS_TOTAL,
              tokenPrices,
            }}
          />,
          document.body,
        )}
    </div>
  )
}

export default TokenMultiSelector
