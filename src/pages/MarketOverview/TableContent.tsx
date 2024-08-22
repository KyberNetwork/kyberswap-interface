import { useEffect, useMemo, useRef, useState } from 'react'
import { Info, Star } from 'react-feather'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import {
  AssetToken,
  useAddFavoriteMutation,
  useGetPricesMutation,
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

  const [getPrices, { data: priceData }] = useGetPricesMutation()
  useEffect(() => {
    const i = setInterval(async () => {
      await getPrices(allTokenAddressByChain)
    }, 10_000)

    return () => clearInterval(i)
  }, [allTokenAddressByChain, getPrices])

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
      <Text color={theme.subText} margin="3rem" marginTop="4rem" textAlign="center">
        No data found
      </Text>
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
      msg = `Click sign to add favorite tokens at Kyberswap.com without logging in.\nThis request won’t trigger any blockchain transaction or cost any gas fee. Expires in 7 days. \n\nIssued at: ${issuedAt}`
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
              title: `${!isTokenFavorite ? 'Add' : 'Remove'} failed`,
              summary: (res as any).error.data.message || 'Some thing went wrong',
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
            title: `${!isTokenFavorite ? 'Add' : 'Remove'} failed`,
            summary: err.message || 'Some thing went wrong',
            type: NotificationType.ERROR,
          },
          8000,
        )
      })
  }

  const tokenToShow = tokens.find(item => item.id === tokenToShowId)

  const mobileHeader = (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', paddingY: '0.75rem' }}>
        <Text color={theme.subText} fontSize={14} height="100%">
          Name
        </Text>

        {showMarketInfo ? (
          <>
            <Flex
              justifyContent="flex-end"
              sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
              fontSize={14}
              color={theme.subText}
              role="button"
              onClick={() => updateSort('volume_24h', false)}
            >
              24h Volume
              <SortIcon sorted={sortCol === 'volume_24h' ? (sortDirection as Direction) : undefined} />
            </Flex>

            <Flex
              justifyContent="flex-end"
              sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
              fontSize={14}
              role="button"
              color={theme.subText}
              onClick={() => updateSort('market_cap', false)}
            >
              Market Cap
              <SortIcon sorted={sortCol === 'market_cap' ? (sortDirection as Direction) : undefined} />
            </Flex>
          </>
        ) : (
          <>
            <Flex alignItems="flex-end" flexDirection="column" fontSize={12}>
              <Flex
                color={theme.subText}
                justifyContent="flex-end"
                sx={{ gap: '4px', cursor: 'pointer' }}
                fontSize={14}
                role="button"
                onClick={() => updateSort(`price_${selectedPrice}`)}
              >
                {selectedPrice === 'buy' ? 'Buy' : 'Sell'} Price
                <Flex marginTop="3px">
                  <SortIcon
                    sorted={sortCol.startsWith(`price_${selectedPrice}`) ? (sortDirection as Direction) : undefined}
                  />
                </Flex>
              </Flex>
              <Flex
                sx={{ border: `1px solid ${theme.border}`, background: theme.buttonBlack, borderRadius: '999px' }}
                padding="1px"
                marginTop="8px"
                width="fit-content"
              >
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
              </Flex>
            </Flex>

            <Flex alignItems="flex-end" flexDirection="column" fontSize={12}>
              <Flex
                justifyContent="flex-end"
                sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                role="button"
                onClick={() => updateSort(`price_${selectedPrice}_change_${selectedSort}`)}
                color={theme.subText}
              >
                {selectedSort} Change
                <SortIcon
                  sorted={
                    sortCol.startsWith(`price_${selectedPrice}_change`) ? (sortDirection as Direction) : undefined
                  }
                />
              </Flex>

              <Flex
                sx={{ border: `1px solid ${theme.border}`, background: theme.buttonBlack, borderRadius: '999px' }}
                padding="1px"
                marginTop="8px"
                width="fit-content"
              >
                <TabItem
                  active={selectedSort === '1h'}
                  onClick={() => {
                    setSelectedSort('1h')
                    updateSort(`price_${selectedPrice}_change_1h`, true, true)
                  }}
                >
                  1h
                </TabItem>

                <TabItem
                  active={selectedSort === '24h'}
                  onClick={() => {
                    setSelectedSort('24h')
                    updateSort(`price_${selectedPrice}_change_24h`, true, true)
                  }}
                >
                  24h
                </TabItem>

                <TabItem
                  active={selectedSort === '7d'}
                  onClick={() => {
                    setSelectedSort('7d')
                    updateSort(`price_${selectedPrice}_change_7d`, true, true)
                  }}
                >
                  7d
                </TabItem>
              </Flex>
            </Flex>
          </>
        )}
      </Box>
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
            <Flex alignItems="center" justifyContent="flex-end">
              {item.volume24h ? formatDisplayNumber(item.volume24h, { style: 'currency', fractionDigits: 2 }) : '--'}
            </Flex>
            <Flex alignItems="center" justifyContent="flex-end" height="100%">
              {item.marketCap ? formatDisplayNumber(item.marketCap, { style: 'currency', fractionDigits: 2 }) : '--'}
            </Flex>
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
            <Flex alignItems="center" justifyContent="flex-end" color={getColor(priceChangeToDisplayOnMobile)}>
              <PriceChange priceChange={priceChangeToDisplayOnMobile} />
            </Flex>
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
            <Flex sx={{ gap: '8px' }} alignItems="flex-start" padding={upToMedium ? '0.75rem 0' : '0.75rem'}>
              <img
                src={item.logoURL || 'https://i.imgur.com/b3I8QRs.jpeg'}
                width="24px"
                height="24px"
                alt=""
                style={{
                  borderRadius: '50%',
                }}
              />
              <div>
                <Flex fontSize={16} alignItems="flex-end">
                  {item.symbol}
                  {quoteSymbol && (
                    <Text fontSize={14} color={theme.subText}>
                      /{quoteSymbol}
                    </Text>
                  )}
                </Flex>
                <Text fontSize={14} color={theme.subText} marginTop="2px">
                  {item.name}
                </Text>
              </div>
            </Flex>

            {upToMedium ? (
              mobileDisplay
            ) : (
              <>
                <Price price={+priceBuy} />

                <Flex
                  alignItems="center"
                  justifyContent="flex-end"
                  padding="0.75rem 1.5rem 0.75rem"
                  height="100%"
                  color={getColor(desktopBuyPriceChange)}
                >
                  <PriceChange priceChange={desktopBuyPriceChange} />
                </Flex>

                <Price price={+priceSell} />

                <Flex
                  alignItems="center"
                  justifyContent="flex-end"
                  padding="0.75rem 1.5rem 0.75rem"
                  height="100%"
                  color={getColor(desktopSellPriceChange)}
                >
                  <PriceChange priceChange={desktopSellPriceChange} />
                </Flex>

                {volAndMc}

                <Flex justifyContent="center" alignItems="center" sx={{ gap: '0.75rem' }}>
                  {/*
                  <ButtonOutlined
                    color={theme.primary}
                    style={{
                      width: 'fit-content',
                      padding: '4px 12px',
                    }}
                    onClick={e => {
                      e.stopPropagation()
                      if (token)
                        window.open(
                          `/swap/${NETWORKS_INFO[token.chainId as ChainId].route}?inputCurrency=${
                            NativeCurrencies[token.chainId as ChainId].symbol
                          }&outputCurrency=${token.address}`,
                          '_blank',
                        )
                    }}
                  >
                    Buy
                  </ButtonOutlined>
                  */}

                  <Info size={16} color={theme.subText} />

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
                </Flex>
              </>
            )}
          </TableRow>
        )
      })}
    </>
  )
}
