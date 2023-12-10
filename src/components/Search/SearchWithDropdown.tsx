import React, { ReactNode, memo, useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { CSSProperties, css, keyframes } from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import Icon from 'components/Icons/Icon'
import Row, { RowFit } from 'components/Row'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

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

type TableColumn = { align: string; label: string; style: CSSProperties }

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

const SearchResultTableWrapper = ({
  header,
  children,
  columns,
  searching,
}: {
  header?: ReactNode
  children?: ReactNode
  columns: TableColumn[]
  searching?: boolean
}) => {
  return (
    <DropdownSection>
      <colgroup>
        <col style={{ width: '200px', minWidth: 'fit-content' }} />
        {columns.map(col => (
          <col style={col.style} key={col.label} />
        ))}
      </colgroup>
      {!searching && (
        <thead>
          <tr>
            <th>{header}</th>
            {columns.map(col => (
              <th key={col.label} style={{ textAlign: col.align as CSSProperties['textAlign'] }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>{children}</tbody>
    </DropdownSection>
  )
}

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

export type SearchSection = {
  items: ReactNode[] | JSX.Element[]
  title?: ReactNode
  loading?: boolean
  show?: boolean
}

const SearchWithDropdown = ({
  placeholder,
  sections,
  value: search,
  onChange: setSearch,
  id,
  searchIcon,
  searching,
  noSearchResult,
  noResultText,
  expanded,
  setExpanded,
  columns,
  style,
}: {
  placeholder: string
  id?: string
  sections: SearchSection[]
  value: string
  onChange: (value: string) => void
  searchIcon?: ReactNode
  searching: boolean
  noSearchResult: boolean
  noResultText: ReactNode
  expanded: boolean
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>
  columns: TableColumn[]
  style?: CSSProperties
}) => {
  const theme = useTheme()

  const [height, setHeight] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
  }, [setExpanded])

  const handleXClick = useCallback(
    (e: any) => {
      setSearch('')
      e.stopPropagation()
    },
    [setSearch],
  )

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

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        // cmd+k or ctrl+k
        e.preventDefault()
        setExpanded(v => !v)
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('keydown', onKeydown)
    }
  }, [setExpanded])

  return (
    <Wrapper ref={wrapperRef} onClick={() => !expanded && inputRef.current?.focus()} expanded={expanded} style={style}>
      <Input
        type="text"
        id={id}
        placeholder={placeholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
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
          {searchIcon || <Icon id="search" size={24} />}
        </RowFit>
      </RowFit>
      <DropdownWrapper expanded={expanded} ref={dropdownRef} height={height}>
        <div style={{ height: 'fit-content' }}>
          {searching ? (
            <SearchResultTableWrapper columns={columns} searching={searching}>
              <SkeletonRows />
            </SearchResultTableWrapper>
          ) : noSearchResult ? (
            <Row justify="center" height="360px">
              <Text
                color={theme.subText}
                fontSize={above768 ? '14px' : '12px'}
                lineHeight={above768 ? '20px' : '16px'}
                maxWidth="75%"
                textAlign="center"
              >
                {noResultText}
              </Text>
            </Row>
          ) : (
            sections.map((el, i) =>
              el.show === false ? null : (
                <SearchResultTableWrapper header={el.title} key={i} columns={columns}>
                  {el.loading ? <SkeletonRows count={3} /> : el.items}
                </SearchResultTableWrapper>
              ),
            )
          )}
        </div>
        {expanded && <AnimationOnFocus />}
      </DropdownWrapper>
    </Wrapper>
  )
}

export default memo(SearchWithDropdown)
