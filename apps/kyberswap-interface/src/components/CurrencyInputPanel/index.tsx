import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { CSSProperties, ReactNode, forwardRef, useCallback, useState } from 'react'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ReactComponent as Lock } from 'assets/svg/ic_lock.svg'
import { ReactComponent as SwitchIcon } from 'assets/svg/switch.svg'
import Card from 'components/Card'
import TokenInfo from 'components/CurrencyInputPanel/TokenInfo'
import CurrencyLogo from 'components/CurrencyLogo'
import Wallet from 'components/Icons/Wallet'
import { Input as NumericalInput } from 'components/NumericalInput'
import { RowFixed } from 'components/Row'
import TokenSelectorModal from 'components/TokenSelectorModal'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { cn } from 'utils/cn'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { shortString } from 'utils/string'

type CurrencySelectStyleProps = {
  tight?: boolean
  selected: boolean
  hideInput?: boolean
  isDisable?: boolean
}

export const InputRow = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-row flex-nowrap items-center', className)} {...props} />
  ),
)
InputRow.displayName = 'InputRow'

export const CurrencySelect = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & CurrencySelectStyleProps
>(({ tight, selected, hideInput, isDisable, className, children, ...rest }, ref) => {
  return (
    <button
      ref={ref}
      {...rest}
      className={cn(
        'flex select-none items-center rounded-full px-2 py-1.5 text-xl font-medium leading-[normal] outline-none',
        hideInput ? 'h-10 w-full bg-buttonBlack' : 'w-auto bg-background',
        selected ? 'border border-transparent text-subText' : 'border border-primary text-primary',
        !selected && 'shadow-[0px_6px_10px_rgba(0,0,0,0.075)]',
        isDisable ? 'cursor-default' : 'cursor-pointer',
        hideInput && !tight ? 'pr-2' : 'pr-0',
        !isDisable && 'hover:brightness-125 focus:brightness-125',
        className,
      )}
    >
      {children}
    </button>
  )
})
CurrencySelect.displayName = 'CurrencySelect'

export const Aligner = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('flex items-center justify-between', className)} {...props} />
)

export const InputPanel = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { hideInput?: boolean }>(
  ({ hideInput, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative z-10 flex w-full flex-col flex-nowrap',
        hideInput ? 'rounded-lg bg-transparent' : 'rounded-[20px] bg-bg2',
        className,
      )}
      {...props}
    />
  ),
)
InputPanel.displayName = 'InputPanel'

export const Container = ({
  className,
  selected,
  hideInput,
  error,
  $outline,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  selected: boolean
  hideInput: boolean
  error?: boolean
  $outline?: boolean
}) => (
  <div
    {...props}
    className={cn(
      'rounded-2xl border border-transparent',
      hideInput ? 'bg-transparent p-0' : 'bg-buttonBlack p-3',
      error ? 'border-red' : $outline ? 'border-border' : '',
      className,
    )}
  />
)

export const StyledTokenName = ({
  tight,
  active,
  fontSize,
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tight?: boolean; active?: boolean; fontSize?: string }) => (
  <span
    {...props}
    style={fontSize ? { fontSize, ...style } : style}
    className={cn(
      'max-w-[120px] truncate !leading-none',
      !tight && 'ml-2',
      !fontSize && (active ? 'text-xl' : 'text-base'),
      '[@media(max-width:420px)]:max-w-[76px] [@media(max-width:445px)]:max-w-[102px]',
      className,
    )}
  />
)

const StyledBalanceMax = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={cn(
      'cursor-pointer rounded-full border-none bg-subText-20 px-2 py-0.5 text-xs font-medium text-subText focus-visible:outline-none',
      className,
    )}
  />
)

const PoolLockContent = (
  <div className="absolute z-20 flex size-full items-center justify-center rounded-lg bg-buttonGray">
    <div className="flex gap-4 px-5">
      <div className="m-auto w-[26px]">
        <Lock />
      </div>
      <span className="px-4 py-2 text-left text-xs leading-4">
        <Trans>
          The price of the pool is outside your selected price range and hence you can only deposit a single token. To
          see more options, update the price range.
        </Trans>
      </span>
    </div>
  </div>
)

interface CurrencyInputPanelProps {
  value: string
  onMax: (() => void) | null
  onHalf: (() => void) | null
  onUserInput?: (value: string) => void
  onFocus?: () => void
  onClickSelect?: () => void
  positionMax?: 'inline' | 'top'
  label?: ReactNode
  positionLabel?: 'in' | 'out'
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
  loadingText?: string
  lockIcon?: boolean
  tight?: boolean
  styleSelect?: CSSProperties
  selectClassName?: string
  customChainId?: ChainId
  trackingSource?: string
}

export default function CurrencyInputPanel({
  value,
  error,
  onUserInput,
  onMax,
  onHalf,
  positionMax = 'inline',
  label = '',
  positionLabel = 'out',
  onCurrencySelect,
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
  loadingText,
  styleSelect = {},
  selectClassName,
  customChainId,
  trackingSource,
}: CurrencyInputPanelProps) {
  const tight = Boolean(tightProp && !currency)
  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useActiveWeb3React()

  const selectedCurrencyBalance = useCurrencyBalance(currency ?? undefined, customChainId)
  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const nativeCurrency = useCurrencyConvertedToNative(currency || undefined)

  return (
    <div className="w-full">
      {label && positionLabel === 'out' && (
        <Card className="rounded-[20px] px-1 pb-2 text-right">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-subText">{label}:</span>
          </div>
        </Card>
      )}
      <InputPanel id={id} hideInput={hideInput} data-testid={dataTestId}>
        {locked && PoolLockContent}
        <Container hideInput={hideInput} selected={disableCurrencySelect} error={error} $outline={outline}>
          {!hideBalance && (
            <div className="mb-3 flex min-h-5 items-center justify-between text-xs">
              {label && positionLabel === 'in' ? (
                label
              ) : (onMax || onHalf) && positionMax === 'top' && currency && account ? (
                <div className="flex items-center gap-1">
                  {onMax && (
                    <StyledBalanceMax onClick={onMax}>
                      <Trans>Max</Trans>
                    </StyledBalanceMax>
                  )}
                  {onHalf && (
                    <StyledBalanceMax onClick={onHalf}>
                      <Trans>Half</Trans>
                    </StyledBalanceMax>
                  )}
                </div>
              ) : (
                <div />
              )}
              <div onClick={onMax ?? undefined} className={cn('flex items-center', onMax && 'cursor-pointer')}>
                <Wallet className="text-subText" />
                <span className="ml-1 font-medium text-subText" data-testid="balance">
                  {customBalanceText || selectedCurrencyBalance?.toSignificant(10) || 0}
                </span>
              </div>
            </div>
          )}
          <InputRow>
            {!hideInput && (
              <>
                <NumericalInput
                  error={error}
                  className="token-amount-input"
                  data-testid="token-amount-input"
                  value={value}
                  disabled={disabledInput}
                  maxLength={maxLength}
                  onUserInput={onUserInput}
                  onFocus={onFocus}
                />
                {estimatedUsd ? (
                  <span className="mr-2 text-sm font-medium text-border">~{estimatedUsd}</span>
                ) : (
                  account &&
                  currency &&
                  onMax &&
                  positionMax === 'inline' && (
                    <StyledBalanceMax onClick={onMax ?? undefined}>
                      <Trans>MAX</Trans>
                    </StyledBalanceMax>
                  )
                )}
                {lockIcon && <Lock className="mr-2 h-4 text-subText" />}
              </>
            )}
            {customCurrencySelect || (
              <CurrencySelect
                isDisable={disableCurrencySelect}
                hideInput={hideInput}
                selected={!!currency}
                className={cn('open-currency-select-button', selectClassName)}
                onClick={() => {
                  if (disableCurrencySelect) return
                  if (!isSwitchMode) {
                    setModalOpen(true)
                  } else if (isSwitchMode && onSwitchCurrency) {
                    onSwitchCurrency()
                  }
                  onClickSelect?.()
                }}
                tight={tight}
                style={styleSelect}
              >
                <Aligner>
                  <RowFixed>
                    {currency && !hideLogo ? <CurrencyLogo currency={currency} size={'20px'} /> : null}
                    <StyledTokenName
                      tight={tight}
                      className={cn('token-symbol-container', disableCurrencySelect ? 'pr-2' : 'pr-0')}
                      data-testid="token-symbol-container"
                      active={Boolean(currency && currency.symbol)}
                      fontSize={tight ? '14px' : fontSize}
                    >
                      {(nativeCurrency?.symbol && maxCurrencySymbolLength
                        ? shortString(nativeCurrency.symbol, maxCurrencySymbolLength)
                        : nativeCurrency?.symbol) ||
                        loadingText || <Trans>Select a token</Trans>}
                    </StyledTokenName>
                  </RowFixed>
                  {!!nativeCurrency && (
                    <TokenInfo token={nativeCurrency.wrapped} isNativeToken={nativeCurrency.isNative} />
                  )}
                  {!disableCurrencySelect && !isSwitchMode && <DropdownSVG className={cn(tight && '-ml-2')} />}
                  {!disableCurrencySelect && isSwitchMode && (
                    <SwitchIcon
                      className={cn('h-[35%] [&_path]:stroke-current', currency ? 'text-subText' : 'text-primary')}
                    />
                  )}
                </Aligner>
              </CurrencySelect>
            )}
          </InputRow>
        </Container>
        {!disableCurrencySelect && !isSwitchMode && onCurrencySelect && (
          <TokenSelectorModal
            isOpen={modalOpen}
            onDismiss={handleDismissSearch}
            onCurrencySelect={onCurrencySelect}
            selectedCurrency={currency}
            otherSelectedCurrency={otherCurrency}
            showPinnedTokens={showPinnedTokens}
            filterWrap={filterWrap}
            customChainId={customChainId}
            trackingSource={trackingSource}
          />
        )}
      </InputPanel>
    </div>
  )
}
