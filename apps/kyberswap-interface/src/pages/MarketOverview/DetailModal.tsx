import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Star, X } from 'react-feather'
import { useMedia, usePreviousDistinct } from 'react-use'
import { AssetToken, useGetQuoteByChainQuery } from 'services/tokenCatalog'

import { ButtonEmpty, ButtonOutlined } from 'components/Button'
import CopyHelper from 'components/Copy'
import Modal from 'components/Modal'
import { ETHER_ADDRESS } from 'constants/index'
import { MAINNET_NETWORKS } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { ContentChangable, TabItem } from 'pages/MarketOverview/styles'
import useFilter from 'pages/MarketOverview/useFilter'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils/address'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

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

  const rowGridClass = upToSmall ? 'grid-cols-[1fr_100px_80px]' : 'grid-cols-[1fr_0.75fr_0.75fr_0.75fr]'

  return (
    <Modal isOpen={!!tokenToShow} onDismiss={onDismiss} width="100%" maxWidth="600px">
      {tokenToShow ? (
        <div className={cn('flex w-full flex-col', upToSmall ? 'p-4' : 'p-8')}>
          <div className="flex justify-between gap-1">
            <div className="flex flex-1 items-center gap-1.5">
              <img
                src={tokenToShow.logoURL || 'https://i.imgur.com/b3I8QRs.jpeg'}
                width="24px"
                height="24px"
                alt=""
                className="rounded-full"
              />
              <span className="min-w-max text-base">{tokenToShow.symbol}</span>
              <span className="truncate text-sm text-subText">{tokenToShow.name}</span>

              <Star
                size={16}
                color={tokenToShow.isFavorite ? theme.yellow1 : theme.subText}
                role="button"
                cursor="pointer"
                fill={tokenToShow.isFavorite ? theme.yellow1 : 'none'}
                onClick={() => toggleFavorite(tokenToShow)}
                className="min-w-4"
              />
            </div>

            <ButtonEmpty onClick={onDismiss} width="fit-content" className="p-0">
              <X className="text-text" />
            </ButtonEmpty>
          </div>

          <div
            className={cn(
              'mt-5 grid h-fit rounded-2xl bg-white-08 px-4 py-3',
              upToSmall ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-6',
            )}
          >
            <div>
              <span className="text-xs text-subText">
                <Trans>Market Cap</Trans>
              </span>
              <div className="mt-1">
                {tokenToShow.marketCap
                  ? formatDisplayNumber(tokenToShow.marketCap, { style: 'currency', fractionDigits: 2 })
                  : '--'}
              </div>
            </div>
            <div>
              <span className="text-xs text-subText">
                <Trans>24h Volume</Trans>
              </span>
              <div className="mt-1">
                {tokenToShow.volume24h
                  ? formatDisplayNumber(tokenToShow.volume24h, { style: 'currency', fractionDigits: 2 })
                  : '--'}
              </div>
            </div>

            <div>
              <span className="text-xs text-subText">
                <Trans>All Time Low</Trans>
              </span>
              <div className="mt-1">
                {formatDisplayNumber(tokenToShow.allTimeLow, { style: 'currency', fractionDigits: 2 })}
              </div>
            </div>
            <div>
              <span className="text-xs text-subText">
                <Trans>All Time High</Trans>
              </span>
              <div className="mt-1">
                {formatDisplayNumber(tokenToShow.allTimeHigh, { style: 'currency', fractionDigits: 2 })}
              </div>
            </div>
          </div>
          {!upToSmall ? (
            <div className={cn('mb-2 mt-6 grid', rowGridClass)}>
              <div />
              <span className="text-right text-xs text-subText">
                <Trans>Buy Price</Trans>
              </span>
              <span className="text-right text-xs text-subText">
                <Trans>Sell Price</Trans>
              </span>
              <div />
            </div>
          ) : (
            <div className="my-2 flex items-center justify-end gap-3">
              <span className="text-right text-xs text-subText">
                <Trans>On-chain Price</Trans>
              </span>
              <div className="flex w-fit rounded-full border border-border bg-buttonBlack p-px">
                <TabItem
                  active={selectedPrice === 'buy'}
                  onClick={() => {
                    setSelectedPrice('buy')
                  }}
                >
                  <Trans>Buy</Trans>
                </TabItem>

                <TabItem
                  active={selectedPrice === 'sell'}
                  onClick={() => {
                    setSelectedPrice('sell')
                  }}
                >
                  <Trans>Sell</Trans>
                </TabItem>
              </div>
            </div>
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
                <div key={token.chainId} className={cn('mb-4 grid items-center', rowGridClass)}>
                  <div className="flex items-center gap-3">
                    <div className="relative w-8">
                      <img
                        src={tokenToShow.logoURL || 'https://i.imgur.com/b3I8QRs.jpeg'}
                        width="32px"
                        height="32px"
                        alt=""
                        className="rounded-full"
                      />

                      <img
                        src={NETWORKS_INFO[token.chainId as ChainId].icon}
                        alt=""
                        width="16px"
                        height="16px"
                        className="absolute -right-2 bottom-0"
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center text-base">
                        {tokenToShow.symbol}{' '}
                        {quoteSymbol && <span className="truncate text-sm text-subText">/{quoteSymbol}</span>}
                      </div>
                      <div className="mt-0.5 flex text-xs text-subText">
                        {shortenAddress(1, address)}
                        <CopyHelper toCopy={address} />
                      </div>
                    </div>
                  </div>

                  {upToSmall ? (
                    <div className="text-right">
                      <Price price={+price} />
                    </div>
                  ) : (
                    <>
                      <div className="text-right">
                        <Price price={+token.priceBuy} />
                      </div>

                      <div className="text-right">
                        <Price price={+token.priceSell} />
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <ButtonOutlined
                      className="w-fit px-3 py-1 text-primary"
                      onClick={() => {
                        window.open(
                          `/swap/${NETWORKS_INFO[token.chainId as ChainId].route}?inputCurrency=${
                            NativeCurrencies[token.chainId as ChainId].symbol
                          }&outputCurrency=${token.address}`,
                          '_blank',
                        )
                      }}
                    >
                      <Trans>Swap</Trans>
                    </ButtonOutlined>
                  </div>
                </div>
              )
            })}
          <div className="mt-4 text-xs italic">
            <Trans>Grouping selection across chains is sourced from Coingecko and CoinMarketCap</Trans>
          </div>
        </div>
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
