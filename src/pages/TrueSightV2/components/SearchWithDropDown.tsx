import { Trans, t } from '@lingui/macro'
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useLocalStorage, useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css, keyframes } from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import History from 'components/Icons/History'
import Icon from 'components/Icons/Icon'
import Row, { RowFit } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

import { KYBERAI_LISTYPE_TO_MIXPANEL } from '../constants'
import { useLazySearchTokenQuery, useSearchTokenQuery, useTokenListQuery } from '../hooks/useKyberAIData'
import { ITokenList, ITokenSearchResult, KyberAIListType } from '../types'
import { formatTokenPrice } from '../utils'

const formatTokenType = (token: ITokenList): ITokenSearchResult => {
  return {
    assetId: token.asset_id,
    name: token.name,
    symbol: token.symbol,
    logo: token.tokens[0].logo,
    price: token.price,
    priceChange24h: token.percent_change_24h,
    kyberScore: {
      score: token.ks_3d?.[token.ks_3d.length - 1].kyber_score || 0,
      label: token.ks_3d?.[token.ks_3d.length - 1].tag || '',
    },
  }
}

const Wrapper = styled.div<{ wider?: boolean; expanded?: boolean }>`
  display: flex;
  position: relative;
  align-items: center;
  padding: 6px 12px;
  border-radius: 40px;
  transition: all 0.2s ease;
  background-color: ${({ theme }) => theme.buttonBlack};
  border: 1px solid ${({ theme }) => theme.border};
  z-index: 11;
  box-shadow: 0 0 6px 0px ${({ theme }) => theme.primary};

  cursor: pointer;
  :hover {
    filter: brightness(1.1);
    box-shadow: 0 0 6px 2px ${({ theme }) => theme.primary};
  }

  * {
    transition: all 0.2s ease;
  }

  width: 600px;

  ${({ expanded, theme }) =>
    expanded &&
    css`
      border-radius: 8px 8px 0 0;
      border-color: ${theme.tableHeader};
    `}
`
const Input = styled.input<{ expanded?: boolean }>`
  display: flex;
  align-items: center;
  white-space: nowrap;
  background: none;
  border: none;
  outline: none;
  text-overflow: ellipsis;
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  flex: 1;
  transition: all 0.2s ease;
  z-index: 2;
  min-width: 0;
  cursor: pointer;
  ::placeholder {
    color: ${({ theme, expanded }) => (expanded ? theme.border : theme.subText)};
  }
  :focus {
    cursor: text;
  }
`

const DropdownWrapper = styled.div<{ expanded?: boolean; height?: number }>`
  position: absolute;
  overflow: hidden;
  top: 0;
  left: 0;
  padding-top: 36px;
  width: 100%;
  background-color: ${({ theme }) => theme.background};
  z-index: 1;
  ${({ expanded, height, theme }) =>
    expanded
      ? css`
          max-height: ${height}px;
          border-radius: 8px;
          background-color: ${theme.tableHeader};
          box-shadow: 0 2px 4px 2px rgba(0, 0, 0, 0.2);
        `
      : css`
          max-height: 0px;
          border-radius: 40px;
        `}
`

const DropdownSection = styled.table`
  border-top: 1px solid ${({ theme }) => theme.border};
  padding: 10px;
  width: 100%;
  border-spacing: 0;
  th {
    font-size: 12px;
    line-height: 16px;
    font-weight: 400;
  }
  td,
  th {
    padding: 4px 6px;
  }
`

const DropdownItem = styled.tr`
  padding: 6px;
  background-color: ${({ theme }) => theme.tableHeader};
  height: 36px;
  :hover {
    filter: brightness(1.3);
  }
`

const ripple = keyframes`
  to {
    transform: scale(500);
    opacity: 0;
  }
`

const AnimationOnFocus = styled.div`
  position: absolute;
  right: 40px;
  top: 15px;
  height: 5px;
  width: 5px;
  transform: scale(0);
  background-color: ${({ theme }) => theme.subText};
  z-index: 1;
  border-radius: 50%;
  opacity: 0.2;
  animation: ${ripple} 0.6s linear;
`

const SkeletonRows = ({ count }: { count?: number }) => {
  const theme = useTheme()
  return (
    <SkeletonTheme
      baseColor={theme.border}
      height="28px"
      borderRadius="12px"
      direction="ltr"
      duration={1}
      highlightColor={theme.tabActive}
    >
      {[
        ...Array(count || 5)
          .fill(0)
          .map((_, index) => (
            <tr key={index}>
              <td>
                <Skeleton></Skeleton>
              </td>
              <td>
                <Skeleton></Skeleton>
              </td>
              <td>
                <Skeleton></Skeleton>
              </td>
              <td>
                <Skeleton></Skeleton>
              </td>
            </tr>
          )),
      ]}
    </SkeletonTheme>
  )
}
const TokenItem = ({ token, onClick }: { token: ITokenSearchResult; onClick?: () => void }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  if (!token) return null
  return (
    <DropdownItem
      onClick={() => {
        onClick?.()
        navigate(`${APP_PATHS.KYBERAI_EXPLORE}/${token.assetId}`)
      }}
    >
      <td>
        <RowFit gap="10px">
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: '50%', overflow: 'hidden' }}>
              <img
                src={token.logo}
                alt={token.symbol}
                width={above768 ? '22px' : '18px'}
                height={above768 ? '22px' : '18px'}
                style={{ display: 'block' }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                borderRadius: '50%',
                border: `1px solid ${theme.background}`,
                backgroundColor: theme.tableHeader,
              }}
            >
              {/* <img
                src={NETWORK_IMAGE_URL[token.chain]}
                alt="eth"
                width={above768 ? '12px' : '10px'}
                height={above768 ? '12px' : '10px'}
                style={{ display: 'block' }}
              /> */}
            </div>
          </div>
          <Text fontSize={above768 ? '12px' : '10px'} color={theme.text}>
            {token.name} <span style={{ color: theme.subText }}>({token.symbol.toUpperCase()})</span>
          </Text>
        </RowFit>
      </td>
      <td style={{ textAlign: 'left' }}>
        <Text
          fontSize={above768 ? '12px' : '10px'}
          color={token.kyberScore ? (token.kyberScore?.score < 50 ? theme.red : theme.primary) : theme.subText}
        >
          {token.kyberScore?.score ? (
            <>
              {token.kyberScore?.score}
              <Text as="span" fontSize="10px" color={theme.subText}>
                /100
              </Text>
            </>
          ) : (
            <>--</>
          )}
        </Text>
      </td>
      <td style={{ textAlign: 'left' }}>
        <Text fontSize={above768 ? '12px' : '10px'} color={theme.text}>
          ${formatTokenPrice(token.price)}
        </Text>
      </td>
      <td style={{ textAlign: 'right' }}>
        <Text
          fontSize={above768 ? '12px' : '10px'}
          color={token.priceChange24h && token.priceChange24h < 0 ? theme.red : theme.primary}
        >
          {token.priceChange24h ? `${token.priceChange24h.toFixed(2)}%` : `--%`}
        </Text>
      </td>
    </DropdownItem>
  )
}

const SearchResultTableWrapper = ({ header, children }: { header?: ReactNode; children?: ReactNode }) => {
  return (
    <DropdownSection>
      <colgroup>
        <col style={{ width: '200px', minWidth: 'fit-content' }} />
        <col style={{ width: '100px', minWidth: 'auto' }} />
        <col style={{ width: '100px' }} />
        <col style={{ width: '60px' }} />
      </colgroup>
      <thead>
        <tr>
          <th>{header}</th>
          <th style={{ textAlign: 'left' }}>KyberScore</th>
          <th style={{ textAlign: 'left' }}>Price</th>
          <th style={{ textAlign: 'right' }}>24H</th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </DropdownSection>
  )
}

let checkedNewData = false
const SearchWithDropdown = () => {
  const theme = useTheme()
  const mixpanelHandler = useMixpanelKyberAI()
  const [searchParams] = useSearchParams()
  const { pathname } = useLocation()

  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const [height, setHeight] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const debouncedSearch = useDebounce(search, 1000)
  const { data: searchResult, isFetching } = useSearchTokenQuery(
    { q: debouncedSearch, size: 10 },
    { skip: debouncedSearch === '' },
  )
  const [history, setHistory] = useLocalStorage<Array<ITokenSearchResult>>('kyberai-search-history')
  const saveToHistory = (token: ITokenSearchResult) => {
    if (!(history && history.findIndex(t => t.assetId === token.assetId) >= 0)) {
      setHistory([token, ...(history || [])].slice(0, 3))
    }
  }

  const [getTokenData] = useLazySearchTokenQuery()
  useEffect(() => {
    if (history && !checkedNewData) {
      const fetchHistoryTokenInfo = async () => {
        const results = await Promise.all(
          history.map(t => {
            return getTokenData({ q: t.assetId, size: 1 }, true).unwrap()
          }),
        )
        setHistory(results.map(res => res[0]))
        checkedNewData = true
      }
      fetchHistoryTokenInfo()
    }
  }, [history, getTokenData, setHistory])

  const listType = (searchParams.get('listType') as KyberAIListType) || KyberAIListType.BULLISH

  const { data: top5bullish, isLoading: isBullishLoading } = useTokenListQuery({
    type: KyberAIListType.BULLISH,
    page: 1,
    pageSize: 5,
  })

  const { data: top5bearish, isLoading: isBearishLoading } = useTokenListQuery({
    type: KyberAIListType.BEARISH,
    page: 1,
    pageSize: 5,
  })

  const haveSearchResult = debouncedSearch !== '' && searchResult && searchResult.length > 0 && !isFetching
  const noSearchResult = debouncedSearch !== '' && searchResult && searchResult.length === 0 && !isFetching
  const isLoading = isFetching && search === debouncedSearch
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)

  useOnClickOutside(wrapperRef, () => setExpanded(false))
  useEffect(() => {
    if (!inputRef.current) return
    const inputEl = inputRef.current
    const onFocus = () => {
      setExpanded(true)
    }
    inputEl.addEventListener('focusin', onFocus)
    return () => {
      inputEl.removeEventListener('focusin', onFocus)
    }
  }, [])

  const handleXClick = useCallback((e: any) => {
    setSearch('')
    e.stopPropagation()
  }, [])

  useEffect(() => {
    if (!dropdownRef.current) return
    const resizeObserver = new MutationObserver(() => {
      dropdownRef.current?.scrollHeight && setHeight(dropdownRef.current?.scrollHeight)
    })
    resizeObserver.observe(dropdownRef.current, {
      childList: true,
      subtree: true,
    })
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const DropdownContent = () => (
    <div ref={contentRef} style={{ height: 'fit-content' }}>
      {isLoading ? (
        <>
          <SearchResultTableWrapper>
            <SkeletonRows />
          </SearchResultTableWrapper>
        </>
      ) : haveSearchResult ? (
        <>
          <SearchResultTableWrapper>
            {searchResult.map(item => (
              <TokenItem
                key={item.assetId}
                token={item}
                onClick={() => {
                  setExpanded(false)
                  saveToHistory(item)
                  mixpanelHandler(MIXPANEL_TYPE.KYBERAI_SEARCH_TOKEN_SUCCESS, {
                    token_name: item.symbol?.toUpperCase(),
                    source: pathname.includes(APP_PATHS.KYBERAI_EXPLORE)
                      ? 'explore'
                      : KYBERAI_LISTYPE_TO_MIXPANEL[listType],
                    search_term: search,
                  })
                }}
              />
            ))}
          </SearchResultTableWrapper>
        </>
      ) : noSearchResult ? (
        <>
          <Row justify="center" height="360px">
            <Text
              fontSize={above768 ? '14px' : '12px'}
              lineHeight={above768 ? '20px' : '16px'}
              maxWidth="75%"
              textAlign="center"
            >
              <Trans>
                Oops, we couldnt find your token! We will regularly add new tokens that have achieved a certain trading
                volume
              </Trans>
            </Text>
          </Row>
        </>
      ) : (
        <>
          {history && (
            <SearchResultTableWrapper
              header={
                <RowFit color={theme.subText} gap="4px">
                  <History />
                  <Text fontSize="12px">Search History</Text>
                </RowFit>
              }
            >
              {history.slice(0, 3).map((item, index) => (
                <TokenItem key={index} token={item} onClick={() => setExpanded(false)} />
              ))}
            </SearchResultTableWrapper>
          )}
          <SearchResultTableWrapper
            header={
              <RowFit color={theme.subText} gap="4px">
                <Icon id="bullish" size={16} />
                <Text fontSize="12px">Bullish Tokens</Text>
              </RowFit>
            }
          >
            {isBullishLoading ? (
              <SkeletonRows count={3} />
            ) : (
              top5bullish?.data?.slice(0, 3).map((item, index) => (
                <TokenItem
                  key={index}
                  token={formatTokenType(item)}
                  onClick={() => {
                    setExpanded(false)
                    saveToHistory(formatTokenType(item))
                    mixpanelHandler(MIXPANEL_TYPE.KYBERAI_SEARCH_TOKEN_SUCCESS, {
                      token_name: item.symbol?.toUpperCase(),
                      source: pathname.includes(APP_PATHS.KYBERAI_EXPLORE)
                        ? 'explore'
                        : KYBERAI_LISTYPE_TO_MIXPANEL[listType],
                      token_type: 'bullish',
                    })
                  }}
                />
              ))
            )}
          </SearchResultTableWrapper>
          <SearchResultTableWrapper
            header={
              <RowFit color={theme.subText} gap="4px">
                <Icon id="bearish" size={16} />
                <Text fontSize="12px">Bearish Tokens</Text>
              </RowFit>
            }
          >
            {isBearishLoading ? (
              <SkeletonRows count={3} />
            ) : (
              top5bearish?.data?.slice(0, 3).map((item, index) => (
                <TokenItem
                  key={index}
                  token={formatTokenType(item)}
                  onClick={() => {
                    setExpanded(false)
                    saveToHistory(formatTokenType(item))
                    mixpanelHandler(MIXPANEL_TYPE.KYBERAI_SEARCH_TOKEN_SUCCESS, {
                      token_name: item.symbol?.toUpperCase(),
                      source: pathname.includes(APP_PATHS.KYBERAI_EXPLORE)
                        ? 'explore'
                        : KYBERAI_LISTYPE_TO_MIXPANEL[listType],
                      token_type: 'bearish',
                    })
                  }}
                />
              ))
            )}
          </SearchResultTableWrapper>
        </>
      )}
    </div>
  )

  return (
    <>
      <Wrapper ref={wrapperRef} onClick={() => !expanded && inputRef.current?.focus()} expanded={expanded}>
        <Input
          type="text"
          id="kyberai-search"
          placeholder={t`Search by token name, symbol or contract address`}
          value={search}
          onChange={e => {
            setSearch(e.target.value)
          }}
          autoComplete="off"
          ref={inputRef}
        />
        <RowFit style={{ zIndex: 2 }}>
          {search && (
            <ButtonEmpty onClick={handleXClick} style={{ padding: '2px 4px', width: 'max-content' }}>
              <X color={theme.subText} size={14} style={{ minWidth: '14px' }} />
            </ButtonEmpty>
          )}
          <RowFit fontSize="14px" lineHeight={above768 ? '20px' : '16px'} fontWeight={500} gap="4px">
            <Icon id="search" size={24} />
            <Trans>Ape Smart!</Trans>
          </RowFit>
        </RowFit>
        <DropdownWrapper expanded={expanded} ref={dropdownRef} height={height}>
          <DropdownContent />
          {expanded && <AnimationOnFocus />}
        </DropdownWrapper>
      </Wrapper>
    </>
  )
}

export default React.memo(SearchWithDropdown)
