import { Trans } from '@lingui/macro'
import { Star } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import { AssetToken } from 'services/marketOverview'

import useTheme from 'hooks/useTheme'
import { formatDisplayNumber } from 'utils/numbers'

import { Price, PriceChange } from './DetailModal'
import { MobileTableBottomRow, MobileTableRow as MobileTableRowWrapper } from './styles'

type Props = {
  item: AssetToken
  quoteSymbol?: string
  priceBuy: number | ''
  priceSell: number | ''
  buyChange?: number
  sellChange?: number
  volume24h?: string
  marketCap?: string
  onSelect?: () => void
  onToggleFavorite?: (item: AssetToken) => void
}

const MobileTableRow = ({
  item,
  quoteSymbol,
  priceBuy,
  priceSell,
  buyChange,
  sellChange,
  volume24h,
  marketCap,
  onSelect,
  onToggleFavorite,
}: Props) => {
  const theme = useTheme()

  const getColor = (value?: number) => {
    return !value ? undefined : value > 0 ? theme.green : theme.red1
  }

  return (
    <MobileTableRowWrapper role="button" onClick={onSelect}>
      <Flex alignItems="flex-start" justifyContent="space-between" sx={{ gap: '12px' }}>
        <Flex sx={{ gap: '8px' }} alignItems="flex-start">
          <img
            src={item.logoURL || 'https://i.imgur.com/b3I8QRs.jpeg'}
            width="24px"
            height="24px"
            alt=""
            style={{ borderRadius: '50%' }}
          />
          <Box>
            <Flex alignItems="flex-end">
              <Text fontSize={16}>{item.symbol}</Text>
              {quoteSymbol && (
                <Text fontSize={14} color={theme.subText}>
                  /{quoteSymbol}
                </Text>
              )}
            </Flex>
            <Text fontSize={14} color={theme.subText} marginTop="2px">
              {item.name}
            </Text>
          </Box>
        </Flex>
        <Star
          size={16}
          color={item.isFavorite ? theme.yellow1 : theme.subText}
          role="button"
          cursor="pointer"
          fill={item.isFavorite ? theme.yellow1 : 'none'}
          onClick={e => {
            e.stopPropagation()
            onToggleFavorite?.(item)
          }}
          aria-label={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        />
      </Flex>

      <MobileTableBottomRow>
        <Flex justifyContent="space-between" sx={{ gap: '12px' }}>
          <Text color={theme.subText}>
            <Trans>Buy Price</Trans>
          </Text>
          <Text>
            <Price price={+priceBuy} />
          </Text>
        </Flex>
        <Flex justifyContent="space-between" sx={{ gap: '12px' }}>
          <Text color={theme.subText}>
            <Trans>Sell Price</Trans>
          </Text>
          <Text>
            <Price price={+priceSell} />
          </Text>
        </Flex>
        <Flex justifyContent="space-between" sx={{ gap: '12px' }}>
          <Text color={theme.subText}>
            <Trans>Buy Change</Trans>
          </Text>
          <Flex color={getColor(buyChange)}>
            <PriceChange priceChange={buyChange} />
          </Flex>
        </Flex>
        <Flex justifyContent="space-between" sx={{ gap: '12px' }}>
          <Text color={theme.subText}>
            <Trans>Sell Change</Trans>
          </Text>
          <Flex color={getColor(sellChange)}>
            <PriceChange priceChange={sellChange} />
          </Flex>
        </Flex>
        <Flex justifyContent="space-between" sx={{ gap: '12px' }}>
          <Text color={theme.subText}>
            <Trans>24h Volume</Trans>
          </Text>
          <Text>{volume24h ? formatDisplayNumber(volume24h, { style: 'currency', fractionDigits: 2 }) : '--'}</Text>
        </Flex>
        <Flex justifyContent="space-between" sx={{ gap: '12px' }}>
          <Text color={theme.subText}>
            <Trans>Market Cap</Trans>
          </Text>
          <Text>{marketCap ? formatDisplayNumber(marketCap, { style: 'currency', fractionDigits: 2 }) : '--'}</Text>
        </Flex>
      </MobileTableBottomRow>
    </MobileTableRowWrapper>
  )
}

export default MobileTableRow
