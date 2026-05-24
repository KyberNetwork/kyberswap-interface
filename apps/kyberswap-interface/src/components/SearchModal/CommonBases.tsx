import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Edit2, XCircle } from 'react-feather'

import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { AutoRow } from 'components/Row'
import { cn } from 'utils/cn'

import { getDisplayTokenInfo } from './CurrencyList'

const HEIGHT_THRESHOLD = 400

const BASE_WRAPPER_CLASS = cn(
  'relative flex cursor-pointer items-center gap-2 rounded-[10px] border border-border p-1.5',
  // Mobile-touch hover and selected state.
  '[@media(max-height:400px)]:gap-[5px] [@media(max-height:400px)]:px-[5px] [@media(max-height:400px)]:py-1',
  'data-[selected=true]:bg-primary-12',
  '[@media(hover:hover)]:hover:bg-buttonBlack [@media(hover:hover)]:hover:[&_.close-btn]:!block',
)

export default function CommonBases({
  onSelect,
  selectedCurrency,
  tokens = [],
  handleToggleFavorite,
}: {
  selectedCurrency?: Currency | null
  tokens: Currency[]
  onSelect: (currency: Currency) => void
  handleToggleFavorite: (e: React.MouseEvent, currency: Currency) => void
}) {
  const [isEditMode, setEditMode] = useState(false)
  const isHeightSmall = window.outerHeight < HEIGHT_THRESHOLD
  if (!tokens.length) return null
  return (
    <AutoColumn gap="md">
      <AutoRow gap="4px">
        {(tokens as Token[]).map((token: Token) => {
          const selected = selectedCurrency instanceof Token && selectedCurrency.address === token.address
          const { symbol } = getDisplayTokenInfo(token)
          return (
            <div
              data-testid="favorite-token"
              onClick={() => !selected && onSelect(token)}
              data-selected={selected}
              key={(token.address || token?.wrapped?.address) + token.symbol}
              className={BASE_WRAPPER_CLASS}
            >
              <CurrencyLogo currency={token} size={isHeightSmall ? '15px' : '20px'} />
              <div className="text-base font-medium [@media(max-height:400px)]:text-sm">{symbol}</div>
              <XCircle
                className={cn(
                  'close-btn absolute right-[-5px] top-[-5px] text-subText',
                  isEditMode ? 'block' : 'hidden',
                )}
                data-testid="close-btn"
                size={16}
                onClick={e => handleToggleFavorite(e, token)}
              />
            </div>
          )
        })}
        {isMobile && (
          <div
            className={BASE_WRAPPER_CLASS}
            style={{ width: isHeightSmall ? 28 : 35, padding: isHeightSmall ? 5 : 8 }}
            onClick={() => {
              setEditMode(prev => !prev)
            }}
          >
            <Edit2 size={isHeightSmall ? 14 : 16} className="text-subText" />
          </div>
        )}
      </AutoRow>
    </AutoColumn>
  )
}
