import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { type ComponentPropsWithRef } from 'react'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ReactComponent as SwitchIcon } from 'assets/svg/switch.svg'
import TokenInfo from 'components/CurrencyInputPanel/TokenInfo'
import CurrencyLogo from 'components/CurrencyLogo'
import Skeleton from 'components/Skeleton'
import { HStack } from 'components/Stack'
import { NETWORKS_INFO } from 'constants/networks'
import { cn } from 'utils/cn'
import { shortString } from 'utils/string'
import { getCurrencyDisplaySymbol } from 'utils/tokenInfo'

type CurrencySelectStyleProps = {
  selected: boolean
  hideInput?: boolean
  isDisable?: boolean
}

type CurrencySelectProps = ComponentPropsWithRef<'button'> & CurrencySelectStyleProps

export const CurrencySelect = ({
  selected,
  hideInput,
  isDisable,
  className,
  children,
  ...rest
}: CurrencySelectProps) => {
  return (
    <button
      {...rest}
      className={cn(
        'flex min-h-[38px] select-none items-center rounded-full px-2 text-xl font-medium leading-[normal] outline-none',
        hideInput ? 'w-full bg-buttonBlack' : 'w-auto bg-background',
        selected ? 'border border-transparent text-subText' : 'border border-border-primary text-primary',
        !selected && 'shadow-[0px_6px_10px_rgba(0,0,0,0.075)]',
        isDisable ? 'cursor-default' : 'cursor-pointer',
        !isDisable && 'hover:brightness-110 focus:brightness-110',
        className,
      )}
    >
      {children}
    </button>
  )
}

export const Aligner = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('flex items-center justify-between', className)} {...props} />
)

type TokenNameProps = React.HTMLAttributes<HTMLSpanElement> & {
  active?: boolean
  fontSize?: string
}

export const StyledTokenName = ({ active, fontSize, className, style, ...props }: TokenNameProps) => (
  <span
    {...props}
    style={fontSize ? { fontSize, ...style } : style}
    className={cn(
      'max-w-[120px] truncate !leading-none',
      !fontSize && (active ? 'text-xl' : 'text-base'),
      '[@media(max-width:420px)]:max-w-[76px] [@media(max-width:445px)]:max-w-[102px]',
      className,
    )}
  />
)

type CurrencySelectContentProps = {
  showChain?: boolean
  currency?: Currency | null
  disableCurrencySelect: boolean
  fontSize?: string
  hideLogo: boolean
  isSwitchMode: boolean
  currencyLoading?: boolean
  loadingText?: string
  maxCurrencySymbolLength?: number
  nativeCurrency?: Currency
  tight: boolean
}

/** Renders caller-owned token resolution state; loading is distinct from an empty selection. */
export const CurrencySelectContent = ({
  showChain,
  currency,
  disableCurrencySelect,
  fontSize,
  hideLogo,
  isSwitchMode,
  currencyLoading,
  loadingText,
  maxCurrencySymbolLength,
  nativeCurrency,
  tight,
}: CurrencySelectContentProps) => {
  if (currencyLoading && !currency) {
    return (
      <Aligner className="gap-2" role="status" aria-label="Loading token" aria-busy="true">
        <Skeleton width={hideLogo ? 64 : 92} height={20} />
      </Aligner>
    )
  }
  const currencySymbol = getCurrencyDisplaySymbol(nativeCurrency)
  const displaySymbol =
    currencySymbol && maxCurrencySymbolLength ? shortString(currencySymbol, maxCurrencySymbolLength) : currencySymbol

  return (
    <Aligner className="gap-1">
      <HStack className="w-fit items-center gap-2">
        {currency && !hideLogo ? (
          <div className="relative shrink-0">
            <CurrencyLogo currency={currency} size="20px" />
            {showChain && (
              <img
                src={NETWORKS_INFO[currency.chainId].icon}
                alt={NETWORKS_INFO[currency.chainId].name}
                title={NETWORKS_INFO[currency.chainId].name}
                className="absolute -bottom-1 -right-1 size-3 rounded border border-background"
              />
            )}
          </div>
        ) : null}
        <StyledTokenName
          className="token-symbol-container"
          data-testid="token-symbol-container"
          active={Boolean(currency && getCurrencyDisplaySymbol(currency))}
          fontSize={tight ? '14px' : fontSize}
        >
          {displaySymbol || loadingText || <Trans>Select a token</Trans>}
        </StyledTokenName>
      </HStack>

      {!!nativeCurrency && <TokenInfo token={nativeCurrency.wrapped} isNativeToken={nativeCurrency.isNative} />}
      {!disableCurrencySelect && !isSwitchMode && (
        <DropdownSVG width={16} height={24} viewBox="4 0 16 24" className="shrink-0" />
      )}
      {!disableCurrencySelect && isSwitchMode && (
        <SwitchIcon className={cn('h-[35%] [&_path]:stroke-current', currency ? 'text-subText' : 'text-primary')} />
      )}
    </Aligner>
  )
}
