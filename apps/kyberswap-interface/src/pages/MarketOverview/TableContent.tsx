import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Info, Star } from 'react-feather'
import { useMedia } from 'react-use'
import {
  AssetToken,
  useAddFavoriteMutation,
  useGetPricesQuery,
  useGetQuoteByChainQuery,
  useMarketOverviewQuery,
  useRemoveFavoriteMutation,
} from 'services/tokenCatalog'

import { NotificationType } from 'components/Announcement/type'
import { TableCell, TableHeader } from 'components/Listing/Table'
import MarketListSkeleton from 'components/RouteFallback/MarketListSkeleton'
import SegmentedControl from 'components/SegmentedControl'
import { Center, HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import DetailModal, { Price, PriceChange } from 'pages/MarketOverview/DetailModal'
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'
import { MarketTableRow } from 'pages/MarketOverview/styles'
import useFilter from 'pages/MarketOverview/useFilter'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'
import { Address } from 'utils/viem'
import { getGatedWalletClient } from 'utils/walletClient'

const PRICE_SIDE_OPTIONS = [
  { label: 'Buy', value: 'buy' },
  { label: 'Sell', value: 'sell' },
] as const

const PRICE_CHANGE_WINDOW_OPTIONS = [
  { label: '1H', value: '1h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
] as const

const MOBILE_SORT_HEADER_CLASS_NAME =
  'cursor-pointer items-center justify-end gap-1 text-sm text-subText hover:text-text hover:[&_svg_path]:stroke-text'

export default function TableContent({
  showMarketInfo,
  buyPriceSelectedField,
  sellPriceSelectedField,
}: {
  showMarketInfo: boolean
  buyPriceSelectedField: string
  sellPriceSelectedField: string
}) {
  const theme = useTheme()
  const { filters, updateFilters } = useFilter()
  const { data, isLoading } = useMarketOverviewQuery(filters)
  const notify = useNotify()
  const { data: quoteData } = useGetQuoteByChainQuery()

  const [tokenToShowId, setShowTokenId] = useState<number | null>(null)

  const [sortCol, sortDirection] = (filters.sort || '').split(' ')

  const { account, chainId } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const tokensFromApi = useMemo(() => data?.data.assets || [], [data])
  const [tokens, setTokens] = useState<AssetToken[]>(() => JSON.parse(JSON.stringify(tokensFromApi)))
  useEffect(() => {
    setTokens(JSON.parse(JSON.stringify(tokensFromApi)))
  }, [tokensFromApi])

  const allTokenAddressByChain = useMemo(
    () =>
      tokensFromApi.reduce((tokenByChain, token) => {
        token.tokens.forEach(item => {
          if (tokenByChain[item.chainId]) {
            tokenByChain[item.chainId] = [...new Set([...tokenByChain[item.chainId], item.address])]
          } else {
            tokenByChain[item.chainId] = [item.address]
          }
        })

        return tokenByChain
      }, {} as { [chainId: number]: string[] }),
    [tokensFromApi],
  )

  const shouldFetchPrices = Object.keys(allTokenAddressByChain).length > 0

  const { data: priceData } = useGetPricesQuery(allTokenAddressByChain, {
    pollingInterval: 10_000,
    skip: !shouldFetchPrices,
  })

  // filter undefined, keep last value
  const latestPrices = useRef(priceData)
  useEffect(() => {
    if (priceData) latestPrices.current = priceData
  }, [priceData])

  const [addFavorite] = useAddFavoriteMutation()
  const [removeFavorite] = useRemoveFavoriteMutation()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const [selectedSort, setSelectedSort] = useState<(typeof PRICE_CHANGE_WINDOW_OPTIONS)[number]['value']>('24h')
  const [selectedPrice, setSelectedPrice] = useState<(typeof PRICE_SIDE_OPTIONS)[number]['value']>('buy')

  if (!tokens.length && !isLoading) {
    return (
      <Center className="min-h-32 text-center text-subText">
        <Trans>No data found</Trans>
      </Center>
    )
  }

  const updateSort = (col: string, appendChain = true, keepDirection = false) => {
    const c = appendChain ? `${col}-${filters.chainId}` : col
    // desc -> acs -> none
    let newDirection: Direction | '' = keepDirection ? (sortDirection as Direction) : Direction.DESC
    if (sortCol === c && !keepDirection) {
      if (sortDirection === Direction.DESC) newDirection = Direction.ASC
      else if (sortDirection === Direction.ASC) newDirection = ''
    }
    updateFilters('sort', newDirection ? `${c} ${newDirection}` : '')
  }

  const getColor = (value?: number) => {
    return !value ? undefined : value > 0 ? theme.green : theme.red1
  }

  const toggleFavorite = async (token: AssetToken) => {
    if (!account) {
      toggleWalletModal()
      return
    }

    let signature = ''
    let msg = ''

    const key = `marketoverview_${account}`
    try {
      const data = JSON.parse(localStorage.getItem(key) || '')
      if (data.issuedAt) {
        const expire = new Date(data.issuedAt)
        expire.setDate(expire.getDate() + 7)
        const now = new Date()
        if (expire > now) {
          signature = data.signature
          msg = data.msg
        }
      }
    } catch {
      //
    }
    if (!signature) {
      const issuedAt = new Date().toISOString()
      msg = t`Click sign to add favorite tokens at KyberSwap.com without logging in.\nThis request won’t trigger any blockchain transaction or cost any gas fee. Expires in 7 days.\n\nIssued at: ${issuedAt}`
      const walletClient = await getGatedWalletClient({ chainId: chainId })
      if (!walletClient) throw new Error('Wallet client unavailable')
      signature = await walletClient.signMessage({
        account: account as Address,
        message: msg,
      })
      localStorage.setItem(
        key,
        JSON.stringify({
          signature,
          msg,
          issuedAt,
        }),
      )
    }

    const isTokenFavorite = token.isFavorite
    await (isTokenFavorite ? removeFavorite : addFavorite)({
      user: account,
      assetIds: [token.id],
      message: msg,
      signature,
    })
      .then(res => {
        if ((res as any).error) {
          notify(
            {
              title: !isTokenFavorite ? t`Add failed` : t`Remove failed`,
              summary: (res as any).error?.data?.message || t`Something went wrong`,
              type: NotificationType.ERROR,
            },
            8000,
          )
        } else {
          let newTokens = tokens.map(item => {
            if (item.id === token.id) item.isFavorite = !isTokenFavorite
            return item
          })
          if (filters.isFavorite) newTokens = newTokens.filter(item => item.isFavorite)
          setTokens(newTokens)
        }
      })
      .catch(err => {
        // localStorage.removeItem(key)
        console.log(err)
        notify(
          {
            title: !isTokenFavorite ? t`Add failed` : t`Remove failed`,
            summary: err.message || t`Something went wrong`,
            type: NotificationType.ERROR,
          },
          8000,
        )
      })
  }

  const tokenToShow = tokens.find(item => item.id === tokenToShowId)

  const mobileHeader = (
    <TableHeader className="grid-cols-3 md:hidden">
      <TableCell className="flex-row text-sm">
        <span>
          <Trans>Name</Trans>
        </span>
      </TableCell>

      {showMarketInfo ? (
        <>
          <TableCell
            className="cursor-pointer flex-row items-center justify-end gap-1 text-sm hover:text-text hover:[&_svg_path]:stroke-text"
            role="button"
            onClick={() => updateSort('volume_24h', false)}
          >
            <Trans>24h Volume</Trans>
            <SortIcon sorted={sortCol === 'volume_24h' ? (sortDirection as Direction) : undefined} />
          </TableCell>

          <TableCell
            className="cursor-pointer flex-row items-center justify-end gap-1 text-sm hover:text-text hover:[&_svg_path]:stroke-text"
            role="button"
            onClick={() => updateSort('market_cap', false)}
          >
            <Trans>Market Cap</Trans>
            <SortIcon sorted={sortCol === 'market_cap' ? (sortDirection as Direction) : undefined} />
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className="items-end text-xs">
            <HStack
              className={MOBILE_SORT_HEADER_CLASS_NAME}
              role="button"
              onClick={() => updateSort(`price_${selectedPrice}`)}
            >
              {selectedPrice === 'buy' ? <Trans>Buy Price</Trans> : <Trans>Sell Price</Trans>}
              <SortIcon
                sorted={sortCol.startsWith(`price_${selectedPrice}`) ? (sortDirection as Direction) : undefined}
              />
            </HStack>
            <SegmentedControl
              onChange={value => {
                setSelectedPrice(value)
                if (sortCol.startsWith(`price_${value === 'buy' ? 'sell' : 'buy'}`)) {
                  updateFilters('sort', `price_${value}-${filters.chainId} ${sortDirection}`)
                }
              }}
              options={PRICE_SIDE_OPTIONS}
              size="xs"
              value={selectedPrice}
            />
          </TableCell>

          <TableCell className="items-end text-xs">
            <HStack
              className={MOBILE_SORT_HEADER_CLASS_NAME}
              role="button"
              onClick={() => updateSort(`price_${selectedPrice}_change_${selectedSort}`)}
            >
              {selectedSort} {t`Change`}
              <SortIcon
                sorted={sortCol.startsWith(`price_${selectedPrice}_change`) ? (sortDirection as Direction) : undefined}
              />
            </HStack>

            <SegmentedControl
              onChange={value => {
                setSelectedSort(value)
                updateSort(`price_${selectedPrice}_change_${value}`, true, true)
              }}
              options={PRICE_CHANGE_WINDOW_OPTIONS}
              size="xs"
              value={selectedSort}
            />
          </TableCell>
        </>
      )}
    </TableHeader>
  )

  return (
    <>
      {tokenToShow && (
        <DetailModal
          onDismiss={() => setShowTokenId(null)}
          tokenToShow={tokenToShow}
          toggleFavorite={toggleFavorite}
          latestPrices={latestPrices}
        />
      )}
      {upToMedium && mobileHeader}

      {isLoading && !tokens.length && <MarketListSkeleton />}

      <Stack className="max-md:gap-2 max-md:py-2">
        {tokens.map((item, idx) => {
          const token = item.tokens.find(t => +t.chainId === filters.chainId)
          const priceBuy = token
            ? latestPrices.current?.data?.[token.chainId]?.[token.address]?.PriceBuy || token.priceBuy
            : ''
          const priceSell = token
            ? latestPrices.current?.data?.[token.chainId]?.[token.address]?.PriceSell || token.priceSell
            : ''

          const quoteSymbol = quoteData?.data?.onchainPrice?.usdQuoteTokenByChainId?.[filters.chainId || 1]?.symbol

          const priceBuyChange1h =
            token?.priceBuyChange1h && priceBuy
              ? ((100 + token.priceBuyChange1h) * priceBuy) / token.priceBuy - 100
              : token?.priceBuyChange1h

          const priceBuyChange24h =
            token?.priceBuyChange24h !== undefined && priceBuy
              ? ((100 + token.priceBuyChange24h) * priceBuy) / token.priceBuy - 100
              : token?.priceBuyChange24h

          const priceBuyChange7d =
            token?.priceBuyChange7d !== undefined && priceBuy
              ? ((100 + token.priceBuyChange7d) * priceBuy) / token.priceBuy - 100
              : token?.priceBuyChange7d

          const priceSellChange1h =
            token?.priceSellChange1h && priceSell
              ? ((100 + token.priceSellChange1h) * priceSell) / token.priceSell - 100
              : token?.priceSellChange1h

          const priceSellChange24h =
            token?.priceSellChange24h !== undefined && priceSell
              ? ((100 + token.priceSellChange24h) * priceSell) / token.priceSell - 100
              : token?.priceSellChange24h

          const priceSellChange7d =
            token?.priceSellChange7d !== undefined && priceSell
              ? ((100 + token.priceSellChange7d) * priceSell) / token.priceSell - 100
              : token?.priceBuyChange7d

          const volAndMc = (
            <>
              <TableCell className="items-end justify-center">
                {item.volume24h ? formatDisplayNumber(item.volume24h, { style: 'currency', fractionDigits: 2 }) : '--'}
              </TableCell>
              <TableCell className="items-end justify-center">
                {item.marketCap ? formatDisplayNumber(item.marketCap, { style: 'currency', fractionDigits: 2 }) : '--'}
              </TableCell>
            </>
          )

          let priceChangeToDisplayOnMobile
          if (selectedPrice === 'buy') {
            if (selectedSort === '1h') priceChangeToDisplayOnMobile = priceBuyChange1h
            else if (selectedSort === '24h') priceChangeToDisplayOnMobile = priceBuyChange24h
            else priceChangeToDisplayOnMobile = priceBuyChange7d
          } else {
            if (selectedSort === '1h') priceChangeToDisplayOnMobile = priceSellChange1h
            else if (selectedSort === '24h') priceChangeToDisplayOnMobile = priceSellChange24h
            else priceChangeToDisplayOnMobile = priceSellChange7d
          }

          const mobileDisplay = showMarketInfo ? (
            volAndMc
          ) : (
            <>
              <TableCell className="items-end justify-center">
                <Price price={selectedPrice === 'buy' ? +priceBuy : +priceSell} />
              </TableCell>
              <TableCell className="items-end justify-center" style={{ color: getColor(priceChangeToDisplayOnMobile) }}>
                <PriceChange priceChange={priceChangeToDisplayOnMobile} />
              </TableCell>
            </>
          )

          const desktopBuyPriceChange =
            buyPriceSelectedField === '1h'
              ? priceBuyChange1h
              : buyPriceSelectedField === '24h'
              ? priceBuyChange24h
              : priceBuyChange7d

          const desktopSellPriceChange =
            sellPriceSelectedField === '1h'
              ? priceSellChange1h
              : sellPriceSelectedField === '24h'
              ? priceSellChange24h
              : priceSellChange7d

          return (
            <MarketTableRow
              key={item.id + '-' + idx}
              role="button"
              onClick={() => setShowTokenId(item.id)}
              className="animate-[fadeInUp_0.3s_ease-out_both] motion-reduce:animate-none max-md:rounded-xl max-md:bg-background/80"
              style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
            >
              <TableCell className="flex-row gap-2">
                <img
                  src={item.logoURL || 'https://i.imgur.com/b3I8QRs.jpeg'}
                  width="24px"
                  height="24px"
                  alt=""
                  className="rounded-full"
                />
                <Stack className="gap-0.5">
                  <HStack className="items-end text-base text-text">
                    {item.symbol}
                    {quoteSymbol && <span className="text-sm text-subText">/{quoteSymbol}</span>}
                  </HStack>
                  <span className="text-sm text-subText">{item.name}</span>
                </Stack>
              </TableCell>

              {upToMedium ? (
                mobileDisplay
              ) : (
                <>
                  <TableCell className="items-end justify-center">
                    <Price price={+priceBuy} />
                  </TableCell>

                  <TableCell className="items-end justify-center" style={{ color: getColor(desktopBuyPriceChange) }}>
                    <PriceChange priceChange={desktopBuyPriceChange} />
                  </TableCell>

                  <TableCell className="items-end justify-center">
                    <Price price={+priceSell} />
                  </TableCell>

                  <TableCell className="items-end justify-center" style={{ color: getColor(desktopSellPriceChange) }}>
                    <PriceChange priceChange={desktopSellPriceChange} />
                  </TableCell>

                  {volAndMc}

                  <TableCell className="flex-row items-center justify-center gap-3">
                    <Info size={16} className="cursor-pointer hover:brightness-125" />

                    <Star
                      size={16}
                      color={item.isFavorite ? theme.yellow1 : theme.subText}
                      role="button"
                      className="cursor-pointer hover:brightness-125"
                      fill={item.isFavorite ? theme.yellow1 : 'none'}
                      onClick={e => {
                        e.stopPropagation()
                        toggleFavorite(item)
                      }}
                    />
                  </TableCell>
                </>
              )}
            </MarketTableRow>
          )
        })}
      </Stack>
    </>
  )
}
