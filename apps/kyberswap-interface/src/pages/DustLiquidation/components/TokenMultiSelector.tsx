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
import { useActiveWeb3React } from 'hooks'
import useTokenBalance from 'hooks/useTokenBalance'
import { AppState } from 'state'
import { useWalletModalToggle } from 'state/application/hooks'
import { DustInput, DustToken } from 'state/dustLiquidation/actions'
import { useDustLiquidationActions, useDustLiquidationState } from 'state/dustLiquidation/hooks'
import { formatDisplayNumber } from 'utils/numbers'

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 12px;
  padding: 10px 12px;
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
`

const Balance = styled.button`
  background: transparent;
  border: 0;
  padding: 0;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  :hover {
    color: ${({ theme }) => theme.primary};
  }
`

const AmountInput = styled.input`
  flex: 1;
  background: transparent;
  border: 0;
  outline: none;
  color: ${({ theme }) => theme.text};
  font-size: 16px;
  text-align: right;
  min-width: 0;
  ::placeholder {
    color: ${({ theme }) => theme.subText};
  }
`

const RemoveButton = styled.button`
  background: transparent;
  border: 0;
  color: ${({ theme }) => theme.subText};
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  :hover {
    color: ${({ theme }) => theme.red1};
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

const TokenRow = ({ input }: { input: DustInput }) => {
  const { removeToken, updateAmount } = useDustLiquidationActions()
  const { value, decimals } = useTokenBalance(input.address)
  // One-shot guard: auto-fill to max only on first balance load. If the user clears
  // the input after that, we don't re-fill — their action wins.
  const autoFilledRef = useRef(false)

  const balanceDisplay = useMemo(() => {
    if (!value) return '0'
    try {
      const formatted = formatUnits(value, decimals)
      return formatDisplayNumber(formatted, { significantDigits: 6 })
    } catch {
      return '0'
    }
  }, [value, decimals])

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

  return (
    <Row>
      <Logo
        srcs={input.logo ? [input.logo] : []}
        alt={input.symbol}
        style={{ width: 24, height: 24, borderRadius: 999 }}
      />
      <TokenMeta>
        <Symbol>{input.symbol}</Symbol>
        <Balance type="button" onClick={onMax}>
          <Trans>Balance:</Trans> {balanceDisplay}
        </Balance>
      </TokenMeta>
      <AmountInput
        inputMode="decimal"
        placeholder="0.0"
        value={input.amount}
        onChange={e => updateAmount(input.address, sanitizeAmount(e.target.value))}
      />
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
        inputs.map(input => <TokenRow key={input.address} input={input} />)
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
            }}
          />,
          document.body,
        )}
    </Flex>
  )
}

export default TokenMultiSelector
