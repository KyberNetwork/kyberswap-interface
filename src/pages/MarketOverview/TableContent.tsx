import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Star, X } from 'react-feather'
import { useMedia, usePreviousDistinct } from 'react-use'
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
import { ButtonEmpty, ButtonOutlined } from 'components/Button'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import Modal from 'components/Modal'
import { ETHER_ADDRESS } from 'constants/index'
import { MAINNET_NETWORKS } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import SortIcon, { Direction } from './SortIcon'
import { ContentChangable, TableRow } from './styles'
import useFilter from './useFilter'

export default function TableContent({ showMarketInfo }: { showMarketInfo: boolean }) {
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

  return (
    <>
      <Modal isOpen={!!tokenToShow} onDismiss={() => setShowTokenId(null)} width="100%" maxWidth="600px">
        {tokenToShow ? (
          <Flex width="100%" flexDirection="column" padding={upToMedium ? '1rem' : '2rem'}>
            <Flex justifyContent="space-between" sx={{ gap: '4px' }}>
              <Flex alignItems="center" sx={{ gap: '6px' }} flex="1">
                <img
                  src={tokenToShow.logoURL || 'https://i.imgur.com/b3I8QRs.jpeg'}
                  width="24px"
                  height="24px"
                  alt=""
                  style={{
                    borderRadius: '50%',
                  }}
                />
                <Text fontSize={16} minWidth="max-content">
                  {tokenToShow.symbol} {}
                </Text>
                <Text
                  fontSize={14}
                  color={theme.subText}
                  sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
                >
                  {tokenToShow.name}
                </Text>

                <Star
                  size={16}
                  color={tokenToShow.isFavorite ? theme.yellow1 : theme.subText}
                  role="button"
                  cursor="pointer"
                  fill={tokenToShow.isFavorite ? theme.yellow1 : 'none'}
                  onClick={() => toggleFavorite(tokenToShow)}
                  style={{ minWidth: '16px' }}
                />
              </Flex>

              <ButtonEmpty onClick={() => setShowTokenId(null)} width="fit-content" style={{ padding: 0 }}>
                <X color={theme.text} />
              </ButtonEmpty>
            </Flex>

            <Box
              sx={{
                background: '#ffffff20',
                padding: '0.75rem 1rem',
                display: 'grid',
                gridTemplateColumns: upToMedium ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
                gap: upToMedium ? '0.75rem' : '1.5rem',
                height: 'fit-content',
                borderRadius: '1rem',
                marginTop: '1.25rem',
              }}
            >
              <div>
                <Text fontSize={12} color={theme.subText}>
                  Market Cap
                </Text>
                <Text marginTop="4px">
                  {tokenToShow.marketCap
                    ? formatDisplayNumber(tokenToShow.marketCap, { style: 'currency', fractionDigits: 2 })
                    : '--'}
                </Text>
              </div>
              <div>
                <Text fontSize={12} color={theme.subText}>
                  24h Volume
                </Text>
                <Text marginTop="4px">
                  {tokenToShow.volume24h
                    ? formatDisplayNumber(tokenToShow.volume24h, { style: 'currency', fractionDigits: 2 })
                    : '--'}
                </Text>
              </div>

              <div>
                <Text fontSize={12} color={theme.subText}>
                  All Time Low
                </Text>
                <Text marginTop="4px">
                  {formatDisplayNumber(tokenToShow.allTimeLow, { style: 'currency', fractionDigits: 2 })}
                </Text>
              </div>
              <div>
                <Text fontSize={12} color={theme.subText}>
                  All Time High
                </Text>
                <Text marginTop="4px">
                  {formatDisplayNumber(tokenToShow.allTimeHigh, { style: 'currency', fractionDigits: 2 })}
                </Text>
              </div>
            </Box>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: `1fr ${upToMedium ? '100px 80px' : '0.75fr  0.75fr'}` }}
              marginTop="1.5rem"
              marginBottom="8px"
            >
              <div />
              <Text fontSize={12} color={theme.subText} textAlign="right">
                On-chain Price
              </Text>
              <div />
            </Box>

            {tokenToShow.tokens
              .filter(token => MAINNET_NETWORKS.includes(+token.chainId))
              .sort((a, b) => b.price - a.price)
              .map(token => {
                const quoteSymbol = quoteData?.data?.onchainPrice?.usdQuoteTokenByChainId?.[token.chainId]?.symbol
                const address =
                  token.address.toLowerCase() === ETHER_ADDRESS.toLowerCase()
                    ? WETH[token.chainId as ChainId].address
                    : token.address

                const price = token ? latestPrices.current?.data?.[token.chainId]?.[token.address] || token.price : ''

                return (
                  <Box
                    key={token.chainId}
                    sx={{ display: 'grid', gridTemplateColumns: `1fr ${upToMedium ? '100px 80px' : '0.75fr 0.75fr'}` }}
                    marginBottom="1rem"
                    alignItems="center"
                  >
                    <Flex sx={{ gap: '12px' }} alignItems="center">
                      <Box sx={{ position: 'relative' }} width="32px">
                        <img
                          src={tokenToShow.logoURL || 'https://i.imgur.com/b3I8QRs.jpeg'}
                          width="32px"
                          height="32px"
                          alt=""
                          style={{
                            borderRadius: '50%',
                          }}
                        />

                        <img
                          src={NETWORKS_INFO[token.chainId as ChainId].icon}
                          alt=""
                          width="16px"
                          height="16px"
                          style={{ position: 'absolute', right: '-8px', bottom: 0 }}
                        />
                      </Box>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <Flex alignItems="center" fontSize={16}>
                          {tokenToShow.symbol}{' '}
                          {quoteSymbol && (
                            <Text
                              as="span"
                              color={theme.subText}
                              fontSize={14}
                              sx={{
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                              }}
                            >
                              /{quoteSymbol}
                            </Text>
                          )}
                        </Flex>
                        <Text color={theme.subText} display="flex" marginTop="2px" fontSize="12px">
                          {shortenAddress(1, address)}
                          <CopyHelper toCopy={address} />
                        </Text>
                      </div>
                    </Flex>

                    <Text textAlign="right">
                      <Price price={+price} />
                    </Text>

                    <Flex sx={{ gap: '12px' }} alignItems="center" justifyContent="flex-end">
                      <ButtonOutlined
                        color={theme.primary}
                        style={{
                          width: 'fit-content',
                          padding: '4px 12px',
                        }}
                        onClick={() => {
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
                    </Flex>
                  </Box>
                )
              })}
          </Flex>
        ) : null}
      </Modal>

      {upToMedium && (
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
                  Market cap
                  <SortIcon sorted={sortCol === 'market_cap' ? (sortDirection as Direction) : undefined} />
                </Flex>
              </>
            ) : (
              <>
                <Flex
                  color={theme.subText}
                  justifyContent="flex-end"
                  sx={{ gap: '4px', cursor: 'pointer' }}
                  fontSize={14}
                  role="button"
                  onClick={() => updateSort('price')}
                >
                  Price
                  <Flex marginTop="3px">
                    <SortIcon sorted={sortCol.startsWith('price-') ? (sortDirection as Direction) : undefined} />
                  </Flex>
                </Flex>

                <Flex alignItems="flex-end" flexDirection="column" fontSize={12}>
                  <Flex
                    justifyContent="flex-end"
                    sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                    role="button"
                    onClick={() => updateSort(`price_change_${selectedSort}`)}
                    color={theme.subText}
                  >
                    {selectedSort} Change
                    <SortIcon sorted={sortCol.startsWith('price_change') ? (sortDirection as Direction) : undefined} />
                  </Flex>

                  <Flex
                    sx={{ border: `1px solid ${theme.border}`, background: theme.buttonBlack, borderRadius: '999px' }}
                    padding="1px"
                    marginTop="8px"
                    width="fit-content"
                  >
                    <Flex
                      padding="4px 8px"
                      alignItems="center"
                      sx={{
                        borderRadius: '999px',
                        background: selectedSort === '1h' ? theme.tabActive : 'transparent',
                      }}
                      color={selectedSort === '1h' ? theme.text : theme.subText}
                      onClick={() => {
                        setSelectedSort('1h')
                        updateSort('price_change_1h', true, true)
                      }}
                    >
                      1h
                    </Flex>

                    <Flex
                      padding="4px 8px"
                      alignItems="center"
                      sx={{
                        borderRadius: '999px',
                        background: selectedSort === '24h' ? theme.tabActive : 'transparent',
                      }}
                      color={selectedSort === '24h' ? theme.text : theme.subText}
                      onClick={() => {
                        setSelectedSort('24h')
                        updateSort('price_change_24h', true, true)
                      }}
                    >
                      24h
                    </Flex>

                    <Flex
                      padding="4px 8px"
                      alignItems="center"
                      sx={{
                        borderRadius: '999px',
                        background: selectedSort === '7d' ? theme.tabActive : 'transparent',
                      }}
                      color={selectedSort === '7d' ? theme.text : theme.subText}
                      onClick={() => {
                        setSelectedSort('7d')
                        updateSort('price_change_7d', true, true)
                      }}
                    >
                      7d
                    </Flex>
                  </Flex>
                </Flex>
              </>
            )}
          </Box>
          <Divider />
        </>
      )}

      {tokens.map((item, idx) => {
        const token = item.tokens.find(t => +t.chainId === filters.chainId)
        const price = token ? latestPrices.current?.data?.[token.chainId]?.[token.address] || token.price : ''
        const quoteSymbol = quoteData?.data?.onchainPrice?.usdQuoteTokenByChainId?.[filters.chainId || 1]?.symbol
        const priceChange1h =
          token?.priceChange1h && price
            ? ((100 + token.priceChange1h) * price) / token.price - 100
            : token?.priceChange1h

        const priceChange24h =
          token?.priceChange24h !== undefined && price
            ? ((100 + token.priceChange24h) * price) / token.price - 100
            : token?.priceChange24h

        const priceChange7d =
          token?.priceChange7d !== undefined && price
            ? ((100 + token.priceChange7d) * price) / token.price - 100
            : token?.priceChange7d

        const priceChange =
          selectedSort === '1h' ? priceChange1h : selectedSort === '24h' ? priceChange24h : priceChange7d

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

            {showMarketInfo ? (
              <>
                <Flex alignItems="center" justifyContent="flex-end">
                  {item.volume24h
                    ? formatDisplayNumber(item.volume24h, { style: 'currency', fractionDigits: 2 })
                    : '--'}
                </Flex>
                <Flex alignItems="center" justifyContent="flex-end" height="100%">
                  {item.marketCap
                    ? formatDisplayNumber(item.marketCap, { style: 'currency', fractionDigits: 2 })
                    : '--'}
                </Flex>
              </>
            ) : (
              <>
                <Price price={+price} />
                <Flex
                  alignItems="center"
                  justifyContent="flex-end"
                  color={getColor(priceChange)}
                  title={priceChange?.toString()}
                >
                  <PriceChange priceChange={priceChange} />
                </Flex>
              </>
            )}

            {!upToMedium && (
              <>
                <Flex
                  alignItems="center"
                  justifyContent="flex-end"
                  color={getColor(priceChange24h)}
                  title={priceChange24h?.toString()}
                >
                  <PriceChange priceChange={priceChange24h} />
                </Flex>

                <Flex
                  alignItems="center"
                  justifyContent="flex-end"
                  padding="0.75rem 1.5rem 0.75rem"
                  height="100%"
                  color={getColor(priceChange7d)}
                  title={priceChange7d?.toString()}
                >
                  <PriceChange priceChange={priceChange7d} />
                </Flex>

                <Flex alignItems="center" justifyContent="flex-end" padding="0.75rem" height="100%">
                  {formatDisplayNumber(item.volume24h, { style: 'currency', fractionDigits: 2 })}
                </Flex>
                <Flex
                  alignItems="center"
                  justifyContent="flex-end"
                  height="100%"
                  padding="0.75rem"
                  paddingRight="1.5rem"
                >
                  {item.marketCap
                    ? formatDisplayNumber(item.marketCap, { style: 'currency', fractionDigits: 2 })
                    : '--'}
                </Flex>

                <Flex justifyContent="center" alignItems="center" sx={{ gap: '0.75rem' }}>
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

export const Price = ({ price }: { price: number }) => {
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    setAnimate(true)
    setTimeout(() => setAnimate(false), 1200)
  }, [price])

  const lastPrice = usePreviousDistinct(price)

  return (
    <ContentChangable animate={!!lastPrice && animate} up={!!lastPrice && price - lastPrice >= 0}>
      {!price ? '--' : formatDisplayNumber(price, { fractionDigits: 2, significantDigits: 7 })}
    </ContentChangable>
  )
}

export const PriceChange = ({ priceChange }: { priceChange: number | undefined }) => {
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    setAnimate(true)
    setTimeout(() => setAnimate(false), 1200)
  }, [priceChange])

  const lastPriceChange = usePreviousDistinct(priceChange)

  return (
    <ContentChangable
      animate={!!lastPriceChange && animate}
      up={!!lastPriceChange && !!priceChange && priceChange - lastPriceChange >= 0}
    >
      {!priceChange ? '--' : priceChange.toFixed(2) + '%'}
    </ContentChangable>
  )
}
