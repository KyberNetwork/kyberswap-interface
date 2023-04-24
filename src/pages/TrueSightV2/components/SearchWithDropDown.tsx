import { Trans, t } from '@lingui/macro'
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css, keyframes } from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import Column from 'components/Column'
import History from 'components/Icons/History'
import Icon from 'components/Icons/Icon'
import SearchIcon from 'components/Icons/Search'
import Logo from 'components/Logo'
import Row, { RowFit } from 'components/Row'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

import { useSearchTokenQuery } from '../hooks/useKyberAIData'
import { ITokenSearchResult } from '../types'

const Wrapper = styled.div<{ wider?: boolean; expanded?: boolean }>`
  display: flex;
  position: relative;
  align-items: center;
  padding: 6px 12px;
  border-radius: 40px;
  transition: all 0.2s ease;
  background-color: ${({ theme }) => theme.buttonBlack};
  border: 1px solid ${({ theme }) => theme.border};
  z-index: 10;
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
  height: 28px;

  :hover {
    filter: brightness(1.3);
  }
`

interface SearchProps {
  searchValue: string
  onSearch: (newSearchValue: string) => void
  allowClear?: boolean
  minWidth?: string
  style?: React.CSSProperties
}

const MWrapper = styled.div<{ expanded?: boolean; wider?: boolean; width?: number }>`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  padding: 10px;
  background-color: ${({ theme }) => theme.tableHeader};
  position: relative;
  transition: all 0.5s ease;
  left: 0;
`
const HiddenWrapper = styled.div<{ expanded?: boolean; width?: number; left?: number; top?: number; height?: number }>`
  position: fixed;
  height: 36px;
  width: 36px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.tableHeader};
  left: ${({ left }) => left || 0}px;
  top: ${({ top }) => top || 0}px;
  z-index: 20;
  border-radius: 18px;
  visibility: hidden;
  transition: all 0.4s ease;
  transition-delay: 0.3s;

  ${({ expanded, width, height }) =>
    expanded &&
    css`
      width: ${width}px;
      height: ${height || 400}px;
      left: 0px;
      border-radius: 8px;
      visibility: visible;
    `}
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

const TokenItem = ({ token }: { token: ITokenSearchResult }) => {
  const theme = useTheme()
  return (
    <DropdownItem>
      <td>
        <RowFit gap="6px">
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: '50%', overflow: 'hidden' }}>
              <Logo
                srcs={[token.logo]}
                style={{ width: '16px', height: '16px', background: 'white', display: 'block' }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                borderRadius: '50%',
                border: `1px solid ${theme.background}`,
              }}
            >
              <img
                src="https://icons.iconarchive.com/icons/cjdowner/cryptocurrency-flat/512/Ethereum-ETH-icon.png"
                alt="eth"
                width="8px"
                height="8px"
                style={{ display: 'block' }}
              />
            </div>
          </div>
          <Text fontSize="12px" color={theme.text}>
            {`${token.name}(${token.symbol.toUpperCase()})`}
          </Text>
        </RowFit>
      </td>
      <td style={{ textAlign: 'left' }}>
        <Text fontSize="12px" color={token.kyberScore && token.kyberScore.score < 50 ? theme.red : theme.primary}>
          <>
            {token.kyberScore.score}
            <Text as="span" fontSize="10px" color={theme.subText}>
              /100
            </Text>
          </>
        </Text>
      </td>
      <td style={{ textAlign: 'left' }}>
        <Text fontSize="12px" color={theme.text}>
          ${token.price}
        </Text>
      </td>
      <td style={{ textAlign: 'right' }}>
        <Text fontSize="12px" color={token.priceChange24h && token.priceChange24h < 0 ? theme.red : theme.primary}>
          {token.priceChange24h ? `${(token.priceChange24h / token.price).toFixed(2)}%` : `--%`}
        </Text>
      </td>
    </DropdownItem>
  )
}

const MobileWrapper = ({
  expanded,
  onClick,
  children,
}: {
  expanded: boolean
  onClick: () => void
  children: ReactNode
}) => {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [top, setTop] = useState(0)
  const left = ref.current?.offsetLeft || 0
  useEffect(() => {
    setTop(ref.current?.getBoundingClientRect().top || 0)
    function updateTop() {
      setTop(ref.current?.getBoundingClientRect().top || 0)
    }
    window.addEventListener('scroll', updateTop)
    return () => window.removeEventListener('scroll', updateTop)
  }, [])

  const contentHeight = contentRef.current?.scrollHeight
  return (
    <MWrapper onClick={onClick} expanded={expanded} wider={expanded} ref={ref} width={window.innerWidth}>
      <RowFit>
        <SearchIcon color={theme.subText} size={16} />
      </RowFit>
      <HiddenWrapper
        ref={contentRef}
        expanded={expanded}
        width={window.innerWidth}
        left={left}
        top={top}
        height={contentHeight}
      >
        {children}
      </HiddenWrapper>
    </MWrapper>
  )
}

const SearchWithDropdown = ({ searchValue, onSearch }: SearchProps) => {
  console.log(
    '🚀 ~ file: SearchWithDropDown.tsx:293 ~ SearchWithDropdown ~ searchValue, onSearch:',
    searchValue,
    onSearch,
  )
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const [height, setHeight] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(search, 1000)
  const { data: searchResult } = useSearchTokenQuery({ q: debouncedSearch })

  const haveSearchResult = search !== '' && searchResult && searchResult.length > 0
  const noSearchResult = search !== '' && searchResult && searchResult.length === 0
  // const loading = isFetching
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)

  useOnClickOutside(wrapperRef, () => setExpanded(false))
  useEffect(() => {
    if (!inputRef.current) return
    const inputEl = inputRef.current
    const onFocus = () => {
      setTimeout(() => {
        setExpanded(true)
      }, 200)
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

  const SampleItem = ({ score, percent }: { score?: number; percent?: number }) => (
    <DropdownItem onClick={() => setSearch('ETH')}>
      <td>
        <RowFit gap="6px">
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: '50%', overflow: 'hidden' }}>
              <Logo
                srcs={['https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg?v=024']}
                style={{ width: '16px', height: '16px', background: 'white', display: 'block' }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                borderRadius: '50%',
                border: `1px solid ${theme.background}`,
              }}
            >
              <img
                src="https://icons.iconarchive.com/icons/cjdowner/cryptocurrency-flat/512/Ethereum-ETH-icon.png"
                alt="eth"
                width="8px"
                height="8px"
                style={{ display: 'block' }}
              />
            </div>
          </div>
          <Text fontSize="12px" color={theme.text}>
            BTC(Bitcoin)
          </Text>
        </RowFit>
      </td>
      <td style={{ textAlign: 'left' }}>
        <Text fontSize="12px" color={score && score < 50 ? theme.red : theme.primary}>
          {score || 80}
          <Text as="span" fontSize="10px" color={theme.subText}>
            /100
          </Text>
        </Text>
      </td>
      <td style={{ textAlign: 'left' }}>
        <Text fontSize="12px" color={theme.text}>
          $0.000000004234
        </Text>
      </td>
      <td style={{ textAlign: 'right' }}>
        <Text fontSize="12px" color={percent && percent < 0 ? theme.red : theme.primary}>
          {percent ? `${percent}%` : `+20%`}
        </Text>
      </td>
    </DropdownItem>
  )

  useEffect(() => {
    if (!contentRef.current) return
    const resizeObserver = new ResizeObserver(() => {
      dropdownRef.current?.scrollHeight && setHeight(dropdownRef.current?.scrollHeight)
    })
    resizeObserver.observe(contentRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  const DropdownContent = () => (
    <div ref={contentRef}>
      {haveSearchResult ? (
        <>
          <DropdownSection>
            <colgroup>
              <col style={{ width: '160px' }} />
              <col style={{ width: '100px', minWidth: 'auto' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '60px' }} />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <RowFit color={theme.subText} gap="4px">
                    <History />
                    <Text fontSize="12px">Search History</Text>
                  </RowFit>
                </th>
                <th style={{ textAlign: 'left' }}>KyberScore</th>
                <th style={{ textAlign: 'left' }}>Price</th>
                <th style={{ textAlign: 'right' }}>24H</th>
              </tr>
            </thead>
            <tbody>
              {searchResult.map(item => (
                <TokenItem key={item.address} token={item} />
              ))}
            </tbody>
          </DropdownSection>
        </>
      ) : noSearchResult ? (
        <>
          <Row justify="center" height="360px">
            <Text fontSize="14px" lineHeight="20px" maxWidth="75%">
              <Trans>
                Oops, we couldnt find your token! We will regularly add new tokens that have achieved a certain trading
                volume
              </Trans>
            </Text>
          </Row>
        </>
      ) : (
        <>
          <DropdownSection>
            <colgroup>
              <col style={{ width: '160px' }} />
              <col style={{ width: '100px', minWidth: 'auto' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '60px' }} />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <RowFit color={theme.subText} gap="4px">
                    <History />
                    <Text fontSize="12px">Search History</Text>
                  </RowFit>
                </th>
                <th style={{ textAlign: 'left' }}>KyberScore</th>
                <th style={{ textAlign: 'left' }}>Price</th>
                <th style={{ textAlign: 'right' }}>24H</th>
              </tr>
            </thead>
            <tbody>
              <SampleItem />
              <SampleItem />
              <SampleItem />
            </tbody>
          </DropdownSection>
          <DropdownSection>
            <colgroup>
              <col style={{ width: '160px' }} />
              <col style={{ width: '100px', minWidth: 'auto' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '60px' }} />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <RowFit color={theme.subText} gap="4px">
                    <Icon id="bullish" size={16} />
                    <Text fontSize="12px">Bullish Tokens</Text>
                  </RowFit>
                </th>
                <th style={{ textAlign: 'left' }}>KyberScore</th>
                <th style={{ textAlign: 'left' }}>Price</th>
                <th style={{ textAlign: 'right' }}>24H</th>
              </tr>
            </thead>
            <tbody>
              <SampleItem />
              <SampleItem />
              <SampleItem />
            </tbody>
          </DropdownSection>
          <DropdownSection>
            <colgroup>
              <col style={{ width: '160px' }} />
              <col style={{ width: '100px', minWidth: 'auto' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '60px' }} />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <RowFit color={theme.subText} gap="4px">
                    <Icon id="bearish" size={16} />
                    <Text fontSize="12px">Bearish Tokens</Text>
                  </RowFit>
                </th>
                <th style={{ textAlign: 'left' }}>KyberScore</th>
                <th style={{ textAlign: 'left' }}>Price</th>
                <th style={{ textAlign: 'right' }}>24H</th>
              </tr>
            </thead>
            <tbody>
              <SampleItem score={-20} percent={-20} />
              <SampleItem score={-20} percent={-20} />
              <SampleItem score={-20} percent={-20} />
            </tbody>
          </DropdownSection>
        </>
      )}
    </div>
  )

  if (!above768) {
    return (
      <MobileWrapper expanded={expanded} onClick={() => setExpanded(true)}>
        <Row padding="10px" gap="4px">
          <SearchIcon color={expanded ? theme.border : theme.subText} size={16} />
          {expanded && (
            <>
              <Input
                type="text"
                placeholder={expanded ? t`Search by token name or contract address` : t`Search`}
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                }}
                expanded={expanded}
              />
              <ButtonEmpty onClick={handleXClick} style={{ padding: '2px 4px', width: 'max-content' }}>
                <X color={theme.subText} size={14} style={{ minWidth: '14px' }} />
              </ButtonEmpty>
            </>
          )}
        </Row>
        <Column>
          <DropdownContent />
        </Column>
      </MobileWrapper>
    )
  }
  return (
    <>
      <Wrapper ref={wrapperRef} onClick={() => inputRef.current?.focus()} expanded={expanded}>
        {above768 && (
          <Input
            type="text"
            placeholder={t`Search by token name or contract address`}
            value={search}
            onChange={e => {
              setSearch(e.target.value)
            }}
            ref={inputRef}
          />
        )}
        <RowFit style={{ zIndex: 2 }}>
          {search && (
            <ButtonEmpty onClick={handleXClick} style={{ padding: '2px 4px', width: 'max-content' }}>
              <X color={theme.subText} size={14} style={{ minWidth: '14px' }} />
            </ButtonEmpty>
          )}
          <RowFit fontSize="14px" lineHeight="20px" fontWeight={500} gap="4px">
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
