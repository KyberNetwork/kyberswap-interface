import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Edit2, XCircle } from 'react-feather'

import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { AutoRow } from 'components/Row'
import { HStack } from 'components/Stack'
import { cn } from 'utils/cn'
import { isTokenNative } from 'utils/tokenInfo'

const HEIGHT_THRESHOLD = 400

const BASE_WRAPPER_CLASS = cn(
  'group/pinned-token relative cursor-pointer items-center gap-1 rounded-xl bg-white-04 px-2 py-1',
  'data-[selected=true]:bg-primary-20',
  '[@media(hover:hover)]:hover:bg-white-08 [@media(hover:hover)]:data-[selected=true]:hover:bg-primary-25',
)

type PinnedTokensProps = {
  selectedCurrency?: Currency | null
  tokens: Currency[]
  onSelect?: (currency: Currency) => void
  onToggleFavorite?: (event: React.MouseEvent, currency: Currency) => void
}

export const PinnedTokens = ({ onSelect, selectedCurrency, tokens = [], onToggleFavorite }: PinnedTokensProps) => {
  const [isEditMode, setEditMode] = useState(false)
  const isHeightSmall = window.outerHeight < HEIGHT_THRESHOLD
  if (!tokens.length) return null
  return (
    <AutoColumn className="gap-3">
      <AutoRow className="gap-2">
        {(tokens as Token[]).map((token: Token) => {
          const selected = selectedCurrency instanceof Token && selectedCurrency.address === token.address
          const { symbol } = getDisplayTokenInfo(token)
          return (
            <HStack
              data-testid="favorite-token"
              onClick={() => !selected && onSelect?.(token)}
              data-selected={selected}
              key={(token.address || token?.wrapped?.address) + token.symbol}
              className={BASE_WRAPPER_CLASS}
            >
              <CurrencyLogo currency={token} size="16px" />
              <div className="text-sm font-normal uppercase leading-normal text-text">{symbol}</div>
              <XCircle
                className={cn(
                  'absolute right-[-5px] top-[-5px] z-10 hidden rounded-full bg-buttonGray text-subText',
                  '[@media(hover:hover)]:hover:text-text',
                  isEditMode ? 'block' : '[@media(hover:hover)]:group-hover/pinned-token:block',
                )}
                data-testid="close-btn"
                size={16}
                onClick={event => onToggleFavorite?.(event, token)}
              />
            </HStack>
          )
        })}
        {isMobile && (
          <HStack
            className={BASE_WRAPPER_CLASS}
            style={{ width: isHeightSmall ? 28 : 35, padding: isHeightSmall ? 5 : 8 }}
            onClick={() => {
              setEditMode(prev => !prev)
            }}
          >
            <Edit2 size={isHeightSmall ? 14 : 16} className="text-subText" />
          </HStack>
        )}
      </AutoRow>
    </AutoColumn>
  )
}

export const getDisplayTokenInfo = (currency: Currency) => {
  return {
    symbol: isTokenNative(currency) ? currency.symbol : currency?.wrapped?.symbol || currency.symbol,
  }
}
