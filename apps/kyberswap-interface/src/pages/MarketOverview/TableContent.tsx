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
} from 'services/marketOverview'

import { NotificationType } from 'components/Announcement/type'
import Divider from 'components/Divider'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import DetailModal, { Price, PriceChange } from './DetailModal'
import SortIcon, { Direction } from './SortIcon'
import { TabItem, TableRow } from './styles'
import useFilter from './useFilter'

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

  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
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

  const [selectedSort, setSelectedSort] = useState('24h')
  const [selectedPrice, setSelectedPrice] = useState<'buy' | 'sell'>('buy')

  if (!tokens.length && !isLoading) {
    return (
      <p className="m-12 mt-16 text-center text-subText">
        <Trans>No data found</Trans>
      </p>
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
      signature = await library?.send('personal_sign', [`0x${Buffer.from(msg, 'utf8').toString('hex')}`, account])
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
    <>
      <div className="grid grid-cols-3 py-3">
        <p className="h-full text-[14px] text-subText">
          <Trans>Name</Trans>
        </p>

        {showMarketInfo ? (
          <>
            <div
              className="flex cursor-pointer items-center justify-end gap-1 text-[14px] text-subText"
              role="button"
              onClick={() => updateSort('volume_24h', false)}
            >
              <Trans>24h Volume</Trans>
              <SortIcon sorted={sortCol === 'volume_24h' ? (sortDirection as Direction) : undefined} />
            </div>

            <div
              className="flex cursor-pointer items-center justify-end gap-1 text-[14px] text-subText"
              role="button"
              onClick={() => updateSort('market_cap', false)}
            >
              <Trans>Market Cap</Trans>
              <SortIcon sorted={sortCol === 'market_cap' ? (sortDirection as Direction) : undefined} />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-end text-[12px]">
              <div
                className="flex cursor-pointer justify-end gap-1 text-[14px] text-subText"
                role="button"
                onClick={() => updateSort(`price_${selectedPrice}`)}
              >
                {selectedPrice === 'buy' ? <Trans>Buy Price</Trans> : <Trans>Sell Price</Trans>}
                <div className="mt-[3px] flex">
                  <SortIcon
                    sorted={sortCol.startsWith(`price_${selectedPrice}`) ? (sortDirection as Direction) : undefined}
                  />
                </div>
              </div>
              <div className="mt-2 flex w-fit rounded-[999px] border border-solid border-border bg-buttonBlack p-px">
                <TabItem
                  active={selectedPrice === 'buy'}
                  onClick={() => {
                    setSelectedPrice('buy')
                    if (sortCol.startsWith('price_sell'))
                      updateFilters('sort', `price_buy-${filters.chainId} ${sortDirection}`)
                  }}
                >
                  Buy
                </TabItem>

                <TabItem
                  active={selectedPrice === 'sell'}
                  onClick={() => {
                    setSelectedPrice('sell')
                    if (sortCol.startsWith('price_buy'))
                      updateFilters('sort', `price_sell-${filters.chainId} ${sortDirection}`)
                  }}
                >
                  Sell
                </TabItem>
              </div>
            </div>

            <div className="flex flex-col items-end text-[12px]">
              <div
                className="flex cursor-pointer items-center justify-end gap-1 text-subText"
                role="button"
                onClick={() => updateSort(`price_${selectedPrice}_change_${selectedSort}`)}
              >
                {selectedSort} {t`Change`}
                <SortIcon
                  sorted={
                    sortCol.startsWith(`price_${selectedPrice}_change`) ? (sortDirection as Direction) : undefined
                  }
                />
              </div>

              <div className="mt-2 flex w-fit rounded-[999px] border border-solid border-border bg-buttonBlack p-px">
                <TabItem
                  active={selectedSort === '1h'}
                  onClick={() => {
                    setSelectedSort('1h')
                    updateSort(`price_${selectedPrice}_change_1h`, true, true)
                  }}
                >
                  <Trans>1H</Trans>
                </TabItem>

                <TabItem
                  active={selectedSort === '24h'}
                  onClick={() => {
                    setSelectedSort('24h')
                    updateSort(`price_${selectedPrice}_change_24h`, true, true)
                  }}
                >
                  <Trans>24H</Trans>
                </TabItem>

                <TabItem
                  active={selectedSort === '7d'}
                  onClick={() => {
                    setSelectedSort('7d')
                    updateSort(`price_${selectedPrice}_change_7d`, true, true)
                  }}
                >
                  <Trans>7D</Trans>
                </TabItem>
              </div>
            </div>
          </>
        )}
      </div>
      <Divider />
    </>
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
            <div className="flex items-center justify-end">
              {item.volume24h ? formatDisplayNumber(item.volume24h, { style: 'currency', fractionDigits: 2 }) : '--'}
            </div>
            <div className="flex h-full items-center justify-end">
              {item.marketCap ? formatDisplayNumber(item.marketCap, { style: 'currency', fractionDigits: 2 }) : '--'}
            </div>
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
            <Price price={selectedPrice === 'buy' ? +priceBuy : +priceSell} />
            <div className="flex items-center justify-end" style={{ color: getColor(priceChangeToDisplayOnMobile) }}>
              <PriceChange priceChange={priceChangeToDisplayOnMobile} />
            </div>
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
          <TableRow key={item.id + '-' + idx} role="button" onClick={() => setShowTokenId(item.id)}>
            <div className={`flex items-start gap-2 ${upToMedium ? 'py-3' : 'p-3'}`}>
              <img
                src={item.logoURL || 'https://i.imgur.com/b3I8QRs.jpeg'}
                width="24px"
                height="24px"
                alt=""
                className="rounded-full"
              />
              <div>
                <div className="flex items-end text-[16px]">
                  {item.symbol}
                  {quoteSymbol && <span className="text-[14px] text-subText">/{quoteSymbol}</span>}
                </div>
                <p className="mt-0.5 text-[14px] text-subText">{item.name}</p>
              </div>
            </div>

            {upToMedium ? (
              mobileDisplay
            ) : (
              <>
                <Price price={+priceBuy} />

                <div
                  className="flex h-full items-center justify-end px-6 py-3"
                  style={{ color: getColor(desktopBuyPriceChange) }}
                >
                  <PriceChange priceChange={desktopBuyPriceChange} />
                </div>

                <Price price={+priceSell} />

                <div
                  className="flex h-full items-center justify-end px-6 py-3"
                  style={{ color: getColor(desktopSellPriceChange) }}
                >
                  <PriceChange priceChange={desktopSellPriceChange} />
                </div>

                {volAndMc}

                <div className="flex items-center justify-center gap-3">
                  <Info size={16} className="text-subText" />

                  <Star
                    size={16}
                    color={item.isFavorite ? theme.yellow1 : theme.subText}
                    role="button"
                    cursor="pointer"
                    fill={item.isFavorite ? theme.yellow1 : 'none'}
                    onClick={e => {
                      e.stopPropagation()
                      toggleFavorite(item)
                    }}
                  />
                </div>
              </>
            )}
          </TableRow>
        )
      })}
    </>
  )
}
