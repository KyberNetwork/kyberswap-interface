import { ChainId } from '@kyberswap/ks-sdk-core'
import React, { useState } from 'react'
import { Star } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import {
  AssetToken,
  useAddFavoriteMutation,
  useMarketOverviewQuery,
  useRemoveFavoriteMutation,
} from 'services/marketOverview'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined } from 'components/Button'
import CopyHelper from 'components/Copy'
import Modal from 'components/Modal'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { shortenAddress } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import { TableRow } from './styles'
import useFilter from './useFilter'

export default function TableContent() {
  const theme = useTheme()
  const { filters } = useFilter()
  const { data, isLoading, refetch } = useMarketOverviewQuery(filters)
  const notify = useNotify()
  const [tokenToShowId, setShowTokenId] = useState<number | null>(null)

  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const tokens = data?.data.assets || []
  const [addFavorite] = useAddFavoriteMutation()
  const [removeFavorite] = useRemoveFavoriteMutation()

  if (!tokens.length && !isLoading) {
    return (
      <Text color={theme.subText} margin="3rem" marginTop="4rem" textAlign="center">
        No data found
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
      console.log(data)
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

    await (token.isFavorite ? removeFavorite : addFavorite)({
      user: account,
      assetIds: [token.id],
      message: msg,
      signature,
    })
      .then(res => {
        if ((res as any).error) {
          notify(
            {
              title: `${!token.isFavorite ? 'Add' : 'Remove'} failed`,
              summary: (res as any).error.data.message || 'Some thing went wrong',
              type: NotificationType.ERROR,
            },
            8000,
          )
        }
      })
      .catch(err => {
        // localStorage.removeItem(key)
        console.log(err)
        notify(
          {
            title: `${token.isFavorite ? 'Add' : 'Remove'} failed`,
            summary: err.message || 'Some thing went wrong',
            type: NotificationType.ERROR,
          },
          8000,
        )
      })

    refetch()
  }

  const tokenToShow = tokens.find(item => item.id === tokenToShowId)

  return (
    <>
      <Modal isOpen={!!tokenToShow} onDismiss={() => setShowTokenId(null)} width="100%" maxWidth="600px">
        {tokenToShow ? (
          <Flex width="100%" flexDirection="column" padding="2rem">
            <Flex alignItems="center" sx={{ gap: '6px' }}>
              <img
                src={tokenToShow.logoURL || 'https://i.imgur.com/b3I8QRs.jpeg'}
                width="24px"
                height="24px"
                alt=""
                style={{
                  borderRadius: '50%',
                }}
              />
              <Text fontSize={16}>{tokenToShow.symbol}</Text>
              <Text fontSize={14} color={theme.subText}>
                {tokenToShow.name}
              </Text>

              <Star
                size={16}
                color={tokenToShow.isFavorite ? theme.yellow1 : theme.subText}
                role="button"
                cursor="pointer"
                fill={tokenToShow.isFavorite ? theme.yellow1 : 'none'}
                onClick={() => toggleFavorite(tokenToShow)}
              />
            </Flex>

            <Box
              sx={{
                background: '#ffffff20',
                padding: '0.75rem 1rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: '1.5rem',
                height: 'fit-content',
                borderRadius: '1rem',
                marginTop: '1.25rem',
              }}
            >
              <div>
                <Text fontSize={12} color={theme.subText}>
                  Market cap
                </Text>
                <Text marginTop="4px">
                  {formatDisplayNumber(tokenToShow.marketCap, { style: 'currency', fractionDigits: 2 })}
                </Text>
              </div>
              <div>
                <Text fontSize={12} color={theme.subText}>
                  24h volume
                </Text>
                <Text marginTop="4px">
                  {formatDisplayNumber(tokenToShow.volume24h, { style: 'currency', fractionDigits: 2 })}
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
            <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 0.5fr 1fr' }} marginTop="1.5rem" marginBottom="8px">
              <div />
              <Text fontSize={12} color={theme.subText} textAlign="right">
                On-chain Price
              </Text>
              <div />
            </Box>

            {tokenToShow.tokens.map(token => {
              return (
                <Box
                  sx={{ display: 'grid', gridTemplateColumns: '1.2fr 0.5fr 1fr' }}
                  key={token.chainId}
                  marginBottom="1rem"
                  alignItems="center"
                >
                  <Flex sx={{ gap: '12px' }} alignItems="center">
                    <Box sx={{ position: 'relative' }}>
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
                    <div>
                      <Text>
                        {tokenToShow.symbol}{' '}
                        <Text as="span" color={theme.subText}>
                          {NETWORKS_INFO[token.chainId as ChainId].name}
                        </Text>
                      </Text>
                      <Text color={theme.subText} display="flex" marginTop="2px">
                        {shortenAddress(1, token.address)}
                        <CopyHelper toCopy={token.address} />
                      </Text>
                    </div>
                  </Flex>

                  <Text textAlign="right">
                    {token.price ? formatDisplayNumber(token.price, { style: 'currency', fractionDigits: 2 }) : '--'}
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

                    <ButtonOutlined
                      color={theme.primary}
                      style={{
                        width: 'fit-content',
                        padding: '4px 12px',
                      }}
                      onClick={() => {
                        window.open(
                          `/swap/${NETWORKS_INFO[token.chainId as ChainId].route}?outputCurrency=${
                            NativeCurrencies[token.chainId as ChainId].symbol
                          }&inputCurrency=${token.address}`,
                          '_blank',
                        )
                      }}
                    >
                      Sell
                    </ButtonOutlined>
                  </Flex>
                </Box>
              )
            })}
          </Flex>
        ) : null}
      </Modal>

      {tokens.map((item, idx) => {
        const token = item.tokens.find(t => +t.chainId === filters.chainId)
        return (
          <TableRow key={item.id + '-' + idx} role="button" onClick={() => setShowTokenId(item.id)}>
            <Flex
              sx={{ gap: '8px', borderRight: `1px solid ${theme.border}` }}
              alignItems="flex-start"
              padding="0.75rem 1rem"
            >
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
                <Text fontSize={16}>{item.symbol}</Text>
                <Text fontSize={14} color={theme.subText}>
                  {item.name}
                </Text>
              </div>
            </Flex>

            <Flex alignItems="center" justifyContent="flex-end">
              {!token?.price ? '--' : formatDisplayNumber(token.price, { style: 'currency', fractionDigits: 2 })}
            </Flex>

            <Flex alignItems="center" justifyContent="flex-end" color={getColor(token?.priceChange1h)}>
              {!token?.priceChange1h ? '--' : token.priceChange1h.toFixed(2)}
            </Flex>

            <Flex alignItems="center" justifyContent="flex-end" color={getColor(token?.priceChange24h)}>
              {!token?.priceChange24h ? '--' : token.priceChange24h.toFixed(2)}
            </Flex>

            <Flex
              alignItems="center"
              justifyContent="flex-end"
              padding="0.75rem 1.5rem 0.75rem"
              height="100%"
              sx={{ borderRight: `1px solid ${theme.border}` }}
              color={getColor(token?.priceChange7d)}
            >
              {!token?.priceChange7d ? '--' : token.priceChange7d.toFixed(2)}
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
              sx={{ borderRight: `1px solid ${theme.border}` }}
            >
              {formatDisplayNumber(item.marketCap, { style: 'currency', fractionDigits: 2 })}
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
                      `/swap/${NETWORKS_INFO[token.chainId as ChainId].route}?outputCurrency=${
                        NativeCurrencies[token.chainId as ChainId].symbol
                      }&inputCurrency=${token.address}`,
                      '_blank',
                    )
                }}
              >
                Sell
              </ButtonOutlined>

              <Star
                size={16}
                color={item.isFavorite ? theme.yellow1 : theme.subText}
                role="button"
                cursor="pointer"
                fill={item.isFavorite ? theme.yellow1 : 'none'}
                onClick={() => toggleFavorite(item)}
              />
            </Flex>
          </TableRow>
        )
      })}
    </>
  )
}
