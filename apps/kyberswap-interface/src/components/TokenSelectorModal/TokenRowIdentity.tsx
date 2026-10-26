import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { type MouseEvent, type ReactNode } from 'react'
import { AlertTriangle, Info, Star } from 'react-feather'

import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import { HStack, Stack } from 'components/Stack'
import { getDisplayTokenInfo } from 'components/TokenSelectorModal/PinnedTokens'
import { AddressCopy, formatAgeBadge } from 'components/TokenSelectorModal/components'
import { MouseoverTooltip } from 'components/Tooltip'
import { cn } from 'utils/cn'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { isTokenNative } from 'utils/tokenInfo'

type Props = {
  currency: Currency
  isImport: boolean
  showFavoriteIcon: boolean
  canFavorite: boolean
  isFavorite?: boolean
  customName?: ReactNode
  addedAt?: number
  held?: boolean
  impersonator?: boolean
  showCopyAddress?: boolean
  showAddress?: boolean
  onToggleFavorite?: (event: MouseEvent, currency: Currency) => void
  onShowTokenInfo?: (token: Token) => void
}

export const TokenRowIdentity = ({
  currency,
  isImport,
  showFavoriteIcon,
  canFavorite,
  isFavorite,
  customName,
  addedAt,
  held,
  impersonator,
  showCopyAddress,
  showAddress,
  onToggleFavorite,
  onShowTokenInfo,
}: Props) => {
  const nativeCurrency = useCurrencyConvertedToNative(currency)
  const { symbol } = getDisplayTokenInfo(currency)
  const ageBadge = formatAgeBadge(addedAt)
  return (
    <HStack className={cn('min-w-0 flex-1 items-center gap-2', isImport && 'opacity-50')}>
      {showFavoriteIcon &&
        (canFavorite ? (
          <Star
            onClick={e => onToggleFavorite?.(e, currency)}
            data-active={isFavorite}
            data-testid="button-favorite-token"
            role="button"
            className="size-4 shrink-0 text-subText hover:text-primary data-[active=true]:fill-current data-[active=true]:text-primary"
          />
        ) : (
          <Star aria-hidden="true" className="invisible size-4 shrink-0" />
        ))}

      <div className="shrink-0">
        <CurrencyLogo currency={currency} size="24px" />
      </div>
      <Stack className="min-w-0 gap-0.5">
        <HStack className="min-w-0 items-center gap-1">
          <span
            title={currency.name}
            className="truncate text-xs font-medium text-text sm:text-sm"
            data-testid="token-symbol"
          >
            {customName || symbol}
          </span>
          {onShowTokenInfo && (
            <Info
              role="button"
              data-testid="button-token-info"
              onClick={e => {
                e.stopPropagation()
                onShowTokenInfo(currency.wrapped)
              }}
              size={14}
              className="shrink-0 text-subText hover:text-text"
            />
          )}
          {ageBadge && (
            <span
              className="shrink-0 rounded bg-blue/20 px-1 text-[10px] font-medium leading-4 text-blue"
              data-testid="token-age-badge"
            >
              {ageBadge}
            </span>
          )}
          {held && (
            <span
              className="shrink-0 rounded bg-primary-20 px-1 text-[10px] font-medium leading-4 text-primary"
              data-testid="token-held-badge"
            >
              <Trans>In wallet</Trans>
            </span>
          )}
          {impersonator && (
            <MouseoverTooltip
              placement="top"
              text={t`This token uses the symbol of a verified token but a different contract address. Check the address before selecting it.`}
            >
              <AlertTriangle size={14} className="shrink-0 text-warning" data-testid="token-impersonator-warning" />
            </MouseoverTooltip>
          )}
        </HStack>
        <HStack className="min-w-0 items-center gap-1 text-xs text-gray">
          <span title={nativeCurrency?.name} className="truncate" data-testid="token-name">
            {nativeCurrency?.name}
          </span>
          {showCopyAddress && !isTokenNative(currency) && (
            <span className="group relative flex shrink-0 items-center">
              <CopyHelper
                toCopy={currency.wrapped.address}
                size={14}
                margin="0"
                className="text-gray hover:text-text"
                data-testid="copy-token-address"
              />
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-[calc(100%+4px)] left-0 z-10 hidden whitespace-nowrap rounded bg-tableHeader px-1.5 py-0.5 font-mono text-[10px] font-medium text-text shadow-[0px_2px_8px_rgba(0,0,0,0.4)] group-hover:block"
              >
                {currency.wrapped.address}
              </span>
            </span>
          )}
          {showAddress && (
            <>
              <span className="shrink-0">•</span>
              {isTokenNative(currency) ? (
                <span className="shrink-0">
                  <Trans>Native</Trans>
                </span>
              ) : (
                <AddressCopy chainId={currency.chainId} address={currency.wrapped.address} />
              )}
            </>
          )}
        </HStack>
      </Stack>
    </HStack>
  )
}
