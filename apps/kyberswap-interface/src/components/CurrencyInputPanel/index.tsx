import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { type CSSProperties, type ComponentPropsWithRef, type ReactNode, useCallback, useState } from 'react'

import { ReactComponent as Lock } from 'assets/svg/ic_lock.svg'
import Card from 'components/Card'
import {
  AmountInputControls,
  type AmountShortcut,
  BalanceRow,
  InputRow,
} from 'components/CurrencyInputPanel/AmountInputControls'
import { CurrencySelect, CurrencySelectContent } from 'components/CurrencyInputPanel/CurrencySelect'
import TokenSelectorModal from 'components/TokenSelectorModal'
import { useActiveWeb3React } from 'hooks'
import type { NonEvmChain, NonEvmCurrency } from 'pages/Swap/crossChain/adapters/types'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { cn } from 'utils/cn'
import { useCurrencyConvertedToNative } from 'utils/dmm'

const InputPanel = ({ hideInput, className, ...props }: ComponentPropsWithRef<'div'> & { hideInput?: boolean }) => (
  <div
    className={cn(
      'relative z-10 flex w-full flex-col flex-nowrap',
      hideInput ? 'rounded-lg bg-transparent' : 'rounded-[20px] bg-bg2',
      className,
    )}
    {...props}
  />
)

type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  hideInput: boolean
  error?: boolean
  $outline?: boolean
}

const Container = ({ className, hideInput, error, $outline, ...props }: ContainerProps) => (
  <div
    {...props}
    className={cn(
      'flex flex-col gap-3 rounded-2xl border border-transparent',
      hideInput ? 'bg-transparent' : 'bg-buttonBlack',
      'p-4',
      error ? 'border-red' : $outline ? 'border-border' : '',
      className,
    )}
  />
)

const PoolLockContent = () => (
  <div className="absolute z-20 flex size-full items-center justify-center rounded-lg bg-buttonGray">
    <div className="flex items-center gap-8 px-5 py-2">
      <div className="w-[26px] shrink-0">
        <Lock />
      </div>
      <span className="text-left text-xs leading-4">
        <Trans>
          The price of the pool is outside your selected price range and hence you can only deposit a single token. To
          see more options, update the price range.
        </Trans>
      </span>
    </div>
  </div>
)

export { AmountShortcutChips, type AmountShortcut } from 'components/CurrencyInputPanel/AmountInputControls'
export type CurrencyInputPanelFooter = ReactNode | ((openTokenSelector: () => void) => ReactNode)

interface CurrencyInputPanelProps {
  value: string
  amountShortcuts?: AmountShortcut[]
  footer?: CurrencyInputPanelFooter
  readOnlyInput?: boolean
  requireOracle?: boolean
  onMax?: () => void
  onHalf?: () => void
  onUserInput?: (value: string) => void
  onFocus?: () => void
  onClickSelect?: () => void
  positionMax?: 'inline' | 'top'
  label?: ReactNode
  positionLabel?: 'in' | 'out'
  chainSelectionMode?: 'wallet' | 'form'
  onSelectNonEvmCurrency?: (chain: NonEvmChain, currency: NonEvmCurrency) => void
  onCurrencySelect?: (currency: Currency) => void
  onSwitchCurrency?: () => void
  currency?: Currency | null
  disableCurrencySelect?: boolean
  hideBalance?: boolean
  hideInput?: boolean
  disabledInput?: boolean
  otherCurrency?: Currency | null
  id: string
  dataTestId?: string
  showPinnedTokens?: boolean
  customBalanceText?: string
  hideLogo?: boolean
  highlightCurrencySelect?: boolean
  fontSize?: string
  customCurrencySelect?: ReactNode
  estimatedUsd?: string
  isSwitchMode?: boolean
  locked?: boolean
  maxCurrencySymbolLength?: number
  error?: boolean
  maxLength?: number
  outline?: boolean
  filterWrap?: boolean
  currencyLoading?: boolean
  loadingText?: string
  lockIcon?: boolean
  tight?: boolean
  styleSelect?: CSSProperties
  selectClassName?: string
  customChainId?: ChainId
  trackingSource?: string
  /** Show the selected tokens' ERC-8056 balances in display units in the token selector. */
  scaleERC8056Balances?: boolean
  balanceActionsEnabled?: boolean
}

const CurrencyInputPanel = ({
  value,
  amountShortcuts,
  footer,
  readOnlyInput,
  requireOracle,
  error,
  onUserInput,
  onMax,
  onHalf,
  positionMax = 'inline',
  label = '',
  positionLabel = 'out',
  onCurrencySelect,
  chainSelectionMode,
  onSelectNonEvmCurrency,
  onSwitchCurrency,
  onFocus,
  onClickSelect,
  currency,
  disableCurrencySelect = false,
  hideBalance = false,
  hideInput = false,
  disabledInput = false,
  otherCurrency,
  id,
  dataTestId,
  showPinnedTokens,
  customBalanceText,
  hideLogo = false,
  highlightCurrencySelect = false,
  fontSize,
  customCurrencySelect,
  estimatedUsd,
  isSwitchMode = false,
  locked = false,
  maxCurrencySymbolLength,
  maxLength,
  outline,
  filterWrap,
  lockIcon = false, // lock when need approve
  tight: tightProp,
  currencyLoading,
  loadingText,
  styleSelect = {},
  selectClassName,
  customChainId,
  trackingSource,
  scaleERC8056Balances,
  balanceActionsEnabled,
}: CurrencyInputPanelProps) => {
  const tight = Boolean(tightProp && !currency)
  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useActiveWeb3React()

  const selectedCurrencyBalance = useCurrencyBalance(currency ?? undefined, customChainId)
  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const nativeCurrency = useCurrencyConvertedToNative(currency || undefined)

  const handleSelectCurrency = () => {
    if (disableCurrencySelect) return
    if (isSwitchMode) onSwitchCurrency?.()
    else setModalOpen(true)
    onClickSelect?.()
  }

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
        {locked && <PoolLockContent />}
        <Container hideInput={hideInput} error={error} $outline={outline}>
          {!hideBalance && (
            <BalanceRow
              amountShortcuts={amountShortcuts}
              balanceActionsEnabled={balanceActionsEnabled ?? !!(currency && account)}
              customBalanceText={customBalanceText}
              label={label}
              onHalf={onHalf}
              onMax={onMax}
              positionLabel={positionLabel}
              positionMax={positionMax}
              selectedCurrencyBalance={selectedCurrencyBalance}
            />
          )}

          <InputRow>
            {!hideInput && (
              <AmountInputControls
                balanceActionsEnabled={balanceActionsEnabled ?? !!(currency && account)}
                disabledInput={disabledInput}
                readOnlyInput={readOnlyInput}
                error={error}
                estimatedUsd={estimatedUsd}
                lockIcon={lockIcon}
                maxLength={maxLength}
                onFocus={onFocus}
                onMax={onMax}
                onUserInput={onUserInput}
                positionMax={positionMax}
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
                onClick={handleSelectCurrency}
                style={styleSelect}
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
                  nativeCurrency={nativeCurrency}
                  tight={tight}
                />
              </CurrencySelect>
            )}
          </InputRow>
          {typeof footer === 'function' ? footer(() => setModalOpen(true)) : footer}
        </Container>
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
            filterWrap={filterWrap}
            customChainId={customChainId}
            trackingSource={trackingSource}
            requireOracle={requireOracle}
          />
        )}
      </InputPanel>
    </div>
  )
}

export default CurrencyInputPanel
