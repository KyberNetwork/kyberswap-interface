import { ChainId as SchemaChainId, Token as SchemaToken } from '@kyber/schema'
import TokenSelectorModal, { TOKEN_SELECT_MODE } from '@kyber/token-selector'
import { Trans } from '@lingui/macro'
import { formatUnits } from 'ethers/lib/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X } from 'react-feather'
import { useStore } from 'react-redux'
import { Flex } from 'rebass'
import styled from 'styled-components'

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
import { formatDisplayNumber } from 'utils/numbers'

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 16px;
  padding: 14px 16px;
  transition: background 120ms ease;
  :hover {
    background: ${({ theme }) => theme.buttonGray};
  }
`

const TokenMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

const Symbol = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
`

const BalanceRow = styled.button`
  background: transparent;
  border: 0;
  padding: 0;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  line-height: 1.2;
  :hover {
    color: ${({ theme }) => theme.primary};
  }
`

const MaxBadge = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: ${({ theme }) => theme.primary};
  background: ${({ theme }) => theme.primary}22;
  padding: 1px 6px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const AmountColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 0;
  gap: 2px;
`

const AmountInput = styled.input`
  background: transparent;
  border: 0;
  outline: none;
  color: ${({ theme }) => theme.text};
  font-size: 18px;
  font-weight: 500;
  text-align: right;
  min-width: 0;
  width: 100%;
  line-height: 1.2;
  ::placeholder {
    color: ${({ theme }) => theme.subText};
  }
`

const AmountUsd = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  line-height: 1.2;
`

const RemoveButton = styled.button`
  background: transparent;
  border: 0;
  color: ${({ theme }) => theme.subText};
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: 8px;
  :hover {
    color: ${({ theme }) => theme.red1};
    background: ${({ theme }) => theme.red1}1a;
  }
`

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px dashed ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.primary};
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  width: 100%;
  justify-content: center;
  :hover {
    filter: brightness(1.12);
  }
  :disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const EmptyState = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.subText};
  font-size: 13px;
  padding: 12px;
`

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
    if (!value || value.isZero()) return
    try {
      updateAmount(input.address, formatUnits(value, decimals))
      autoFilledRef.current = true
    } catch {
      /* swallow */
    }
  }, [value, decimals, input.address, input.amount, updateAmount])

  const onMax = useCallback(() => {
    if (!value || value.isZero()) return
    try {
      updateAmount(input.address, formatUnits(value, decimals))
    } catch {
      /* swallow */
    }
  }, [value, decimals, input.address, updateAmount])

  const hasBalance = !!value && !value.isZero()

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
    <Flex flexDirection="column" sx={{ gap: '8px' }}>
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
    </Flex>
  )
}

export default TokenMultiSelector
