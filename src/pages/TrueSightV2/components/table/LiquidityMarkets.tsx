import { t } from '@lingui/macro'
import { CSSProperties, useEffect, useMemo, useState } from 'react'
import { Text } from 'rebass'
import { useGetLiquidityMarketsQuery as useGetLiquidityMarketsCoingecko } from 'services/coingecko'
import styled, { DefaultTheme, css } from 'styled-components'

import { ButtonAction, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import Pagination from 'components/Pagination'
import Row, { RowBetween, RowFit } from 'components/Row'
import useCoingeckoAPI from 'hooks/useCoingeckoAPI'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useGetLiquidityMarketsQuery as useGetLiquidityMarketsCoinmarketcap } from 'pages/TrueSightV2/hooks/useCoinmarketcapData'
import useKyberAIAssetOverview from 'pages/TrueSightV2/hooks/useKyberAIAssetOverview'
import { ChartTab } from 'pages/TrueSightV2/types'
import { colorFundingRateText, formatShortNum, formatTokenPrice, navigateToSwapPage } from 'pages/TrueSightV2/utils'

import { LoadingHandleWrapper } from '.'

const TableTab = styled.div<{ active?: boolean }>`
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  padding: 12px 16px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  :hover {
    filter: brightness(1.2);
  }
  ${({ active, theme }) =>
    active
      ? css`
          background-color: ${theme.primary + '40'};
          color: ${theme.primary};
          border-color: ${theme.primary};
        `
      : css`
          color: ${theme.subText};
          background-color: ${theme.background};
        `}
`

enum LIQUIDITY_MARKETS_TYPE {
  COINMARKETCAP,
  COINGECKO,
}

const useLiquidityMarketsData = (activeTab: ChartTab, type?: LIQUIDITY_MARKETS_TYPE) => {
  const { data: assetOverview } = useKyberAIAssetOverview()
  const { data, isFetching: cmcFetching } = useGetLiquidityMarketsCoinmarketcap(
    {
      id: assetOverview?.cmcId,
      centerType: activeTab === ChartTab.First ? 'dex' : activeTab === ChartTab.Second ? 'cex' : 'all',
      category: activeTab === ChartTab.Third ? 'perpetual' : 'spot',
    },
    { skip: !assetOverview?.cmcId && type !== LIQUIDITY_MARKETS_TYPE.COINMARKETCAP },
  )

  const marketPairs = data?.data?.marketPairs || []

  const coingeckoAPI = useCoingeckoAPI()

  const { data: cgkData, isFetching: cgkFetching } = useGetLiquidityMarketsCoingecko(
    { coingeckoAPI, id: assetOverview?.cgkId },
    { skip: !assetOverview?.cgkId && type !== LIQUIDITY_MARKETS_TYPE.COINGECKO },
  )
  return {
    cmcData: marketPairs,
    cgkData: cgkData?.tickers || [],
    isFetching: type === LIQUIDITY_MARKETS_TYPE.COINMARKETCAP ? cmcFetching : cgkFetching,
    hasData: type === LIQUIDITY_MARKETS_TYPE.COINMARKETCAP ? !!marketPairs?.length : !!cgkData?.tickers?.length,
  }
}

const useRenderLiquidityMarkets = (activeTab: ChartTab, type?: LIQUIDITY_MARKETS_TYPE) => {
  const tabs: Array<{ title: string; tabId: ChartTab }> = useMemo(() => {
    if (type === LIQUIDITY_MARKETS_TYPE.COINMARKETCAP) {
      return [
        { title: t`Decentralized Exchanges`, tabId: ChartTab.First },
        { title: t`Centralized Exchanges`, tabId: ChartTab.Second },
        { title: t`Perpetual Markets`, tabId: ChartTab.Third },
      ]
    }
    if (type === LIQUIDITY_MARKETS_TYPE.COINGECKO) {
      return [{ title: t`Spot Markets`, tabId: ChartTab.First }]
    }
    return []
  }, [type])

  const headers: Array<{ title: string; style?: CSSProperties }> = useMemo(() => {
    if (type === LIQUIDITY_MARKETS_TYPE.COINMARKETCAP) {
      if (activeTab === ChartTab.First) {
        return [
          { title: '#' },
          { title: t`Exchange` },
          { title: t`Token pair` },
          { title: t`Current price` },
          { title: t`24h volume` },
        ]
      }
      if (activeTab === ChartTab.Second) {
        return [
          { title: '#' },
          { title: t`Exchange` },
          { title: t`Token pair` },
          { title: t`Current price` },
          { title: t`24h volume` },
          { title: t`Action`, style: { textAlign: 'right' } },
        ]
      }
      if (activeTab === ChartTab.Third) {
        return [
          { title: '#' },
          { title: t`Exchange` },
          { title: t`Token pair` },
          { title: t`Current price` },
          { title: t`24h volume` },
          { title: t`Funding rate` },
        ]
      }
    }
    if (type === LIQUIDITY_MARKETS_TYPE.COINGECKO) {
      return [
        { title: '#' },
        { title: t`Exchange` },
        { title: t`Token pair` },
        { title: t`Current price` },
        { title: t`24h volume` },
        { title: t`Action`, style: { textAlign: 'right' } },
      ]
    }
    return []
  }, [type, activeTab])

  const renderCMCRow = (item: any, index: number, theme: DefaultTheme) => (
    <tr key={index}>
      <td>
        <Text color={theme.text}>{index + 1}</Text>
      </td>
      <td>
        <Row gap="12px">
          <img
            src={`https://s2.coinmarketcap.com/static/img/exchanges/64x64/${item.exchangeId}.png`}
            loading="lazy"
            alt="exchange logo"
            style={{ width: '36px', height: '36px' }}
          />
          <Text color={theme.text}>{item.exchangeName}</Text>
        </Row>
      </td>
      <td>
        <Text color={theme.text}>{item.marketPair}</Text>
      </td>
      <td>
        <Text color={theme.text}>${formatTokenPrice(item.price)}</Text>
      </td>
      <td>
        <Text color={theme.text}>${formatShortNum(item.volumeUsd)}</Text>
      </td>
      {activeTab === ChartTab.Second && (
        <td>
          {item.marketUrl && (
            <Row justify="flex-end">
              <ButtonAction
                as="a"
                href={item.marketUrl}
                target="_blank"
                color={theme.primary}
                style={{ padding: '6px' }}
              >
                <Icon id="open-link" size={16} />
              </ButtonAction>
            </Row>
          )}
        </td>
      )}
      {activeTab === ChartTab.Third && (
        <td>
          <Row>
            <Text color={colorFundingRateText(item.fundingRate * 100, theme)}>
              {item.fundingRate ? (item.fundingRate * 100).toFixed(2) + '%' : '--'}
            </Text>
          </Row>
        </td>
      )}
    </tr>
  )

  const renderCGKRow = (item: any, index: number, theme: DefaultTheme) => (
    <tr key={index}>
      <td>
        <Text color={theme.text}>{index + 1}</Text>
      </td>
      <td>
        <Row gap="12px">
          <img src={item.market.logo} loading="lazy" alt="exchange logo" style={{ width: '36px', height: '36px' }} />
          <Text color={theme.text}>{item.market.name}</Text>
        </Row>
      </td>
      <td>
        <Text color={theme.text} style={{ textTransform: 'uppercase' }}>
          {(item.base.startsWith('0X') ? item.coin_id : item.base) +
            '/' +
            (item.target.startsWith('0X') ? item.target_coin_id : item.target)}
        </Text>
      </td>
      <td>
        <Text color={theme.text}>${formatTokenPrice(item.converted_last.usd)}</Text>
      </td>
      <td>
        <Text color={theme.text}>${formatShortNum(item.converted_volume.usd)}</Text>
      </td>
      <td>
        <Row justify="flex-end">
          <ButtonAction as="a" href={item.trade_url} color={theme.primary} style={{ padding: '6px' }}>
            <Icon id="open-link" size={16} />
          </ButtonAction>
        </Row>
      </td>
    </tr>
  )

  return {
    tabs,
    headers,
    renderCMCRow,
    renderCGKRow,
  }
}

const PAGE_SIZE = 10

export default function LiquidityMarkets() {
  const theme = useTheme()
  const mixpanelHandler = useMixpanelKyberAI()
  const { data: assetOverview, chain, address } = useKyberAIAssetOverview()
  const [type, setType] = useState<LIQUIDITY_MARKETS_TYPE | undefined>()
  const [activeTab, setActiveTab] = useState<ChartTab>(ChartTab.First)
  const [page, setPage] = useState(1)

  const { cmcData, cgkData, isFetching, hasData } = useLiquidityMarketsData(activeTab, type)
  const { tabs, headers, renderCMCRow, renderCGKRow } = useRenderLiquidityMarkets(activeTab, type)

  useEffect(() => {
    if (assetOverview) {
      setActiveTab(ChartTab.First)
      if (assetOverview.cmcId) {
        setType(LIQUIDITY_MARKETS_TYPE.COINMARKETCAP)
      } else if (assetOverview.cgkId) {
        setType(LIQUIDITY_MARKETS_TYPE.COINGECKO)
      }
    }
  }, [assetOverview])

  return (
    <>
      <Column margin="0px -16px -16px -16px">
        <RowBetween>
          <RowFit>
            {tabs.map(tab => (
              <TableTab key={tab.tabId} active={activeTab === tab.tabId} onClick={() => setActiveTab(tab.tabId)}>
                {tab.title}
              </TableTab>
            ))}
          </RowFit>
          {type === LIQUIDITY_MARKETS_TYPE.COINMARKETCAP && activeTab === ChartTab.First && (
            <ButtonPrimary
              height={'36px'}
              width="fit-content"
              gap="4px"
              onClick={() => {
                mixpanelHandler(MIXPANEL_TYPE.KYBERAI_EXPLORING_SWAP_TOKEN_CLICK, {
                  token_name: assetOverview?.symbol?.toUpperCase(),
                  network: chain,
                })
                navigateToSwapPage({ address, chain })
              }}
              style={{ marginRight: '16px' }}
            >
              <RowFit gap="4px" style={{ whiteSpace: 'nowrap' }}>
                <Icon id="swap" size={16} />
                Swap {assetOverview?.symbol?.toUpperCase()}
              </RowFit>
            </ButtonPrimary>
          )}
        </RowBetween>

        <LoadingHandleWrapper
          isLoading={isFetching && !hasData}
          isFetching={isFetching && hasData}
          hasData={hasData}
          style={{ borderRadius: 0 }}
          minHeight="500px"
        >
          <colgroup>
            {new Array(headers.length).fill(0).map((_, index) => (
              <col key={index} style={{ width: index === 0 ? '50px' : 'unset' }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {headers.map((item, index) => (
                <th style={item.style} key={index}>
                  {item.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ fontSize: '14px', lineHeight: '20px' }}>
            {type === LIQUIDITY_MARKETS_TYPE.COINMARKETCAP
              ? cmcData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item: any, index: number) => {
                  return renderCMCRow(item, index + (page - 1) * PAGE_SIZE, theme)
                })
              : cgkData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item: any, index: number) => {
                  return renderCGKRow(item, index + (page - 1) * PAGE_SIZE, theme)
                })}
          </tbody>
        </LoadingHandleWrapper>
        <Pagination
          currentPage={page}
          onPageChange={setPage}
          pageSize={PAGE_SIZE}
          totalCount={type === LIQUIDITY_MARKETS_TYPE.COINMARKETCAP ? cmcData.length : cgkData.length}
        />
      </Column>
    </>
  )
}
