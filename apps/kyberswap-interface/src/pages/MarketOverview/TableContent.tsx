import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Info, Star } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import {
  AssetToken,
  useAddFavoriteMutation,
  useGetPricesQuery,
  useGetQuoteByChainQuery,
  useMarketOverviewQuery,
  useRemoveFavoriteMutation,
} from 'services/marketOverview'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import DetailModal, { Price, PriceChange } from './DetailModal'
import MobileTableRow from './MobileTableRow'
import { TableRow } from './styles'
import useFilter from './useFilter'

export default function TableContent({
  buyPriceSelectedField,
  sellPriceSelectedField,
}: {
  buyPriceSelectedField: string
  sellPriceSelectedField: string
}) {
  const theme = useTheme()
  const { filters } = useFilter()
  const { data, isLoading } = useMarketOverviewQuery(filters)
  const notify = useNotify()
  const { data: quoteData } = useGetQuoteByChainQuery()

  const [tokenToShowId, setShowTokenId] = useState<number | null>(null)

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

  if (!tokens.length && !isLoading) {
    return (
      <Text color={theme.subText} margin="3rem" marginTop="4rem" textAlign="center">
        <Trans>No data found</Trans>
      </Text>
    )
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
      {tokens.map(item => {
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

        if (upToMedium) {
          return (
            <MobileTableRow
              key={item.id}
              item={item}
              quoteSymbol={quoteSymbol}
              priceBuy={priceBuy}
              priceSell={priceSell}
              volume24h={item.volume24h}
              marketCap={item.marketCap}
              onSelect={() => setShowTokenId(item.id)}
              onToggleFavorite={toggleFavorite}
            />
          )
        }

        return (
          <TableRow key={item.id} role="button" onClick={() => setShowTokenId(item.id)}>
            <Flex sx={{ gap: '8px' }} alignItems="flex-start">
              <img
                src={item.logoURL || 'https://i.imgur.com/b3I8QRs.jpeg'}
                width="24px"
                height="24px"
                alt=""
                style={{ borderRadius: '50%' }}
              />
              <div>
                <Flex alignItems="flex-end">
                  <Text fontSize={16} color="white">
                    {item.symbol}
                  </Text>
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

            <>
              <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '4px' }}>
                <Flex alignItems="center" sx={{ gap: '6px' }}>
                  <Text fontSize={12} color={theme.subText}>
                    <Trans>Buy</Trans>
                  </Text>
                  <Price price={+priceBuy} />
                </Flex>
                <Flex alignItems="center" sx={{ gap: '6px' }}>
                  <Text fontSize={12} color={theme.subText}>
                    <Trans>Sell</Trans>
                  </Text>
                  <Price price={+priceSell} />
                </Flex>
              </Flex>

              <Flex alignItems="center" justifyContent="flex-end" height="100%" color={getColor(desktopBuyPriceChange)}>
                <PriceChange priceChange={desktopBuyPriceChange} />
              </Flex>

              <Flex
                alignItems="center"
                justifyContent="flex-end"
                height="100%"
                color={getColor(desktopSellPriceChange)}
              >
                <PriceChange priceChange={desktopSellPriceChange} />
              </Flex>

              {volAndMc}

              <Flex justifyContent="center" alignItems="center" sx={{ gap: '0.75rem' }}>
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
          </TableRow>
        )
      })}
    </>
  )
}
