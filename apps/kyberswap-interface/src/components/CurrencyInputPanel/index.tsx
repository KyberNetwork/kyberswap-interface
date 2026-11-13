import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { type ComponentPropsWithRef, type ReactNode, useCallback, useState } from 'react'

import Card from 'components/Card'
import {
  AmountInputControls,
  type AmountShortcut,
  BalanceRow,
  InputRow,
} from 'components/CurrencyInputPanel/AmountInputControls'
import { CurrencySelect, CurrencySelectContent } from 'components/CurrencyInputPanel/CurrencySelect'
import { Stack } from 'components/Stack'
import TokenSelectorModal from 'components/TokenSelectorModal'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import type { Chain, NonEvmChain, NonEvmCurrency } from 'types/crossChain'
import { cn } from 'utils/cn'

const InputPanel = ({ hideInput, className, ...props }: ComponentPropsWithRef<'div'> & { hideInput?: boolean }) => (
  <div
    className={cn(
      'relative z-10 flex w-full flex-col flex-nowrap has-[[data-wallet-menu]]:z-30',
      hideInput ? 'rounded-lg bg-transparent' : 'rounded-[20px] bg-bg2',
      className,
    )}
    {...props}
  />
)

type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  hideInput: boolean
  error?: boolean
}

const Container = ({ className, hideInput, error, ...props }: ContainerProps) => (
  <div
    {...props}
    className={cn(
      'flex flex-col gap-3 rounded-2xl border border-transparent',
      hideInput ? 'bg-transparent' : 'bg-buttonBlack',
      'p-4',
      error && 'border-red',
      className,
    )}
  />
)

export { AmountShortcutChips, type AmountShortcut } from 'components/CurrencyInputPanel/AmountInputControls'
export type CurrencyInputPanelFooter = ReactNode | ((openTokenSelector: () => void) => ReactNode)

interface CurrencyInputPanelViewProps {
  value: string
  amountShortcuts?: AmountShortcut[]
  footer?: CurrencyInputPanelFooter
  onMax?: () => void
  onHalf?: () => void
  onUserInput?: (value: string) => void
  onFocus?: () => void
  label?: ReactNode
  positionLabel?: 'in' | 'out'
  chainSelectionMode?: 'wallet' | 'form'
  onSwitchCurrency?: () => void
  currency?: Currency | null
  disableCurrencySelect?: boolean
  hideBalance?: boolean
  hideInput?: boolean
  disabledInput?: boolean
  id: string
  dataTestId?: string
  customBalanceText?: string
  hideLogo?: boolean
  highlightCurrencySelect?: boolean
  fontSize?: string
  customCurrencySelect?: ReactNode
  estimatedUsd?: string
  maxCurrencySymbolLength?: number
  error?: boolean
  maxLength?: number
  currencyLoading?: boolean
  loadingText?: string
  selectClassName?: string
  balanceActionsEnabled?: boolean
  selectedCurrencyBalance?: CurrencyAmount<Currency>
  onSelectCurrency?: () => void
  children?: ReactNode
}

interface CurrencyInputPanelProps
  extends Omit<CurrencyInputPanelViewProps, 'selectedCurrencyBalance' | 'onSelectCurrency' | 'children'> {
  requireOracle?: boolean
  onClickSelect?: () => void
  onSelectNonEvmCurrency?: (chain: NonEvmChain, currency: NonEvmCurrency) => void
  onCurrencySelect?: (currency: Currency) => void
  otherCurrency?: Currency | null
  showPinnedTokens?: boolean
  selectorChain?: Chain
  customChainId?: ChainId
  trackingSource?: string
  /** Show the selected tokens' ERC-8056 balances in display units in the token selector. */
  scaleERC8056Balances?: boolean
}

export const CurrencyInputPanelView = ({
  value,
  amountShortcuts,
  footer,
  error,
  onUserInput,
  onMax,
  onHalf,
  label = '',
  positionLabel = 'out',
  chainSelectionMode,
  onSwitchCurrency,
  onFocus,
  currency,
  disableCurrencySelect = false,
  hideBalance = false,
  hideInput = false,
  disabledInput = false,
  id,
  dataTestId,
  customBalanceText,
  hideLogo = false,
  highlightCurrencySelect = false,
  fontSize,
  customCurrencySelect,
  estimatedUsd,
  maxCurrencySymbolLength,
  maxLength,
  currencyLoading,
  loadingText,
  selectClassName,
  balanceActionsEnabled = false,
  selectedCurrencyBalance,
  onSelectCurrency,
  children,
}: CurrencyInputPanelViewProps) => {
  const isSwitchMode = !!onSwitchCurrency

  return (
    <div className="flex w-full flex-col gap-2">
      {label && positionLabel === 'out' && (
        <Card className="rounded-[20px] px-1 text-right">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-subText">{label}:</span>
          </div>
        </Card>
      )}
      <InputPanel id={id} hideInput={hideInput} data-testid={dataTestId}>
        <Container hideInput={hideInput} error={error}>
          {!hideBalance && (
            <BalanceRow
              amountShortcuts={amountShortcuts}
              balanceActionsEnabled={balanceActionsEnabled}
              customBalanceText={customBalanceText}
              label={label}
              onHalf={onHalf}
              onMax={onMax}
              positionLabel={positionLabel}
              selectedCurrencyBalance={selectedCurrencyBalance}
            />
          )}

          <Stack className="gap-2">
            <InputRow>
              {!hideInput && (
                <AmountInputControls
                  disabledInput={disabledInput}
                  error={error}
                  estimatedUsd={estimatedUsd}
                  maxLength={maxLength}
                  onFocus={onFocus}
                  onUserInput={onUserInput}
                  value={value}
                />
              )}

              {customCurrencySelect || (
                <CurrencySelect
                  isDisable={disableCurrencySelect}
                  hideInput={hideInput}
                  selected={!!currency || !!currencyLoading}
                  className={cn(
                    'open-currency-select-button',
                    highlightCurrencySelect && '!border-blue !bg-blue/20',
                    selectClassName,
                  )}
                  onClick={onSelectCurrency}
                >
                  <CurrencySelectContent
                    showChain={chainSelectionMode === 'form'}
                    currency={currency}
                    disableCurrencySelect={disableCurrencySelect}
                    fontSize={fontSize}
                    hideLogo={hideLogo}
                    isSwitchMode={isSwitchMode}
                    currencyLoading={currencyLoading}
                    loadingText={loadingText}
                    maxCurrencySymbolLength={maxCurrencySymbolLength}
                  />
                </CurrencySelect>
              )}
            </InputRow>
            {typeof footer === 'function' ? footer(() => onSelectCurrency?.()) : footer}
          </Stack>
        </Container>
        {children}
      </InputPanel>
    </div>
  )
}

/** Owns wallet reads and token selection; pending forms use the presentation-only view. */
const CurrencyInputPanel = (props: CurrencyInputPanelProps) => {
  const {
    currency,
    customChainId,
    disableCurrencySelect,
    onSwitchCurrency,
    onClickSelect,
    onCurrencySelect,
    chainSelectionMode,
    onSelectNonEvmCurrency,
    otherCurrency,
    scaleERC8056Balances,
    showPinnedTokens,
    selectorChain,
    trackingSource,
    requireOracle,
    ...viewProps
  } = props
  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(currency ?? undefined, customChainId)
  const balanceActionsEnabled = props.balanceActionsEnabled ?? !!(currency && account)
  const isSwitchMode = !!onSwitchCurrency

  const handleDismissSearch = useCallback(() => setModalOpen(false), [])
  const handleSelectCurrency = () => {
    if (disableCurrencySelect) return
    if (onSwitchCurrency) onSwitchCurrency()
    else setModalOpen(true)
    onClickSelect?.()
  }

  return (
    <CurrencyInputPanelView
      {...viewProps}
      currency={currency}
      disableCurrencySelect={disableCurrencySelect}
      onSwitchCurrency={onSwitchCurrency}
      chainSelectionMode={chainSelectionMode}
      selectedCurrencyBalance={selectedCurrencyBalance}
      balanceActionsEnabled={balanceActionsEnabled}
      onSelectCurrency={handleSelectCurrency}
    >
      {!disableCurrencySelect && !isSwitchMode && onCurrencySelect && (
        <TokenSelectorModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          chainSelectionMode={chainSelectionMode}
          onSelectNonEvmCurrency={onSelectNonEvmCurrency}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          scaleERC8056Balances={scaleERC8056Balances}
          showPinnedTokens={showPinnedTokens}
          customChainId={typeof selectorChain === 'number' ? selectorChain : customChainId}
          initialNonEvmChain={typeof selectorChain === 'string' ? selectorChain : undefined}
          trackingSource={trackingSource}
          requireOracle={requireOracle}
        />
      )}
    </CurrencyInputPanelView>
  )
}

export default CurrencyInputPanel
