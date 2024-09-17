import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { useEffect, useState } from 'react'
import { Star, X } from 'react-feather'
import { useMedia, usePreviousDistinct } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { AssetToken, useGetQuoteByChainQuery } from 'services/marketOverview'
import styled from 'styled-components'

import { ButtonEmpty, ButtonOutlined } from 'components/Button'
import CopyHelper from 'components/Copy'
import Modal from 'components/Modal'
import { ETHER_ADDRESS } from 'constants/index'
import { MAINNET_NETWORKS } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import { ContentChangable, TabItem } from './styles'
import useFilter from './useFilter'

const Disclaimer = styled.div`
  font-size: 12px;
  font-style: italic;
  margin-top: 1rem;
`

// () => setShowTokenId(null)
export default function DetailModal({
  tokenToShow,
  onDismiss,
  toggleFavorite,
  latestPrices,
}: {
  tokenToShow: AssetToken
  onDismiss: () => void
  toggleFavorite: (tk: AssetToken) => void
  latestPrices: {
    current: undefined | { data: { [chainId: string]: { [address: string]: { PriceBuy: number; PriceSell: number } } } }
  }
}) {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { data: quoteData } = useGetQuoteByChainQuery()
  const [selectedPrice, setSelectedPrice] = useState<'buy' | 'sell'>('buy')
  const { filters } = useFilter()
  const selectedChainId = filters.chainId

  return (
    <Modal isOpen={!!tokenToShow} onDismiss={onDismiss} width="100%" maxWidth="600px">
      {tokenToShow ? (
        <Flex width="100%" flexDirection="column" padding={upToSmall ? '1rem' : '2rem'}>
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

            <ButtonEmpty onClick={onDismiss} width="fit-content" style={{ padding: 0 }}>
              <X color={theme.text} />
            </ButtonEmpty>
          </Flex>

          <Box
            sx={{
              background: '#ffffff20',
              padding: '0.75rem 1rem',
              display: 'grid',
              gridTemplateColumns: upToSmall ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
              gap: upToSmall ? '0.75rem' : '1.5rem',
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
          {!upToSmall ? (
            <Box
              sx={{ display: 'grid', gridTemplateColumns: `1fr ${upToSmall ? '100px 80px' : '0.75fr  0.75fr 0.75fr'}` }}
              marginTop="1.5rem"
              marginBottom="8px"
            >
              <div />
              <Text fontSize={12} color={theme.subText} textAlign="right">
                Buy Price
              </Text>
              <Text fontSize={12} color={theme.subText} textAlign="right">
                Sell Price
              </Text>
              <div />
            </Box>
          ) : (
            <>
              <Flex alignItems="center" marginY="8px" justifyContent="flex-end" sx={{ gap: '12px' }}>
                <Text fontSize={12} color={theme.subText} textAlign="right">
                  On-chain Price
                </Text>
                <Flex
                  sx={{ border: `1px solid ${theme.border}`, background: theme.buttonBlack, borderRadius: '999px' }}
                  padding="1px"
                  width="fit-content"
                >
                  <TabItem
                    active={selectedPrice === 'buy'}
                    onClick={() => {
                      setSelectedPrice('buy')
                    }}
                  >
                    Buy
                  </TabItem>

                  <TabItem
                    active={selectedPrice === 'sell'}
                    onClick={() => {
                      setSelectedPrice('sell')
                    }}
                  >
                    Sell
                  </TabItem>
                </Flex>
              </Flex>
            </>
          )}

          {tokenToShow.tokens
            .filter(token => MAINNET_NETWORKS.includes(+token.chainId))
            .sort((a, b) => {
              if (selectedChainId) {
                if (+a.chainId === +selectedChainId) return -1
                if (+b.chainId === +selectedChainId) return 1
              }
              return b.priceBuy - a.priceBuy
            })
            .map(token => {
              const quoteSymbol = quoteData?.data?.onchainPrice?.usdQuoteTokenByChainId?.[token.chainId]?.symbol
              const address =
                token.address.toLowerCase() === ETHER_ADDRESS.toLowerCase()
                  ? WETH[token.chainId as ChainId].address
                  : token.address

              const price = token
                ? latestPrices.current?.data?.[token.chainId]?.[token.address]?.[
                    selectedPrice === 'buy' ? 'PriceBuy' : 'PriceSell'
                  ] || (selectedPrice === 'buy' ? token.priceBuy : token.priceSell)
                : ''

              return (
                <Box
                  key={token.chainId}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: `1fr ${upToSmall ? '100px 80px' : '0.75fr 0.75fr 0.75fr'}`,
                  }}
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

                  {upToSmall ? (
                    <Text textAlign="right">
                      <Price price={+price} />
                    </Text>
                  ) : (
                    <>
                      <Text textAlign="right">
                        <Price price={+token.priceBuy} />
                      </Text>

                      <Text textAlign="right">
                        <Price price={+token.priceSell} />
                      </Text>
                    </>
                  )}

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
                      Swap
                    </ButtonOutlined>
                  </Flex>
                </Box>
              )
            })}
          <Disclaimer>Grouping selection across chains is sourced from Coingecko and CoinMarketCap</Disclaimer>
        </Flex>
      ) : null}
    </Modal>
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
      {!priceChange
        ? '--'
        : `${priceChange < 0 ? '-' : ''}${formatDisplayNumber(Math.abs(priceChange), {
            style: 'decimal',
            fractionDigits: 2,
          })}%`}
    </ContentChangable>
  )
}
