import { Trans } from '@lingui/macro'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Text } from 'rebass'
import styled, { CSSProperties, css } from 'styled-components'

import { ReactComponent as NoDataIcon } from 'assets/svg/no-data.svg'
import Column from 'components/Column'
import Pagination from 'components/Pagination'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'

const TableHeader = styled.thead<{ column: number }>`
  padding: 16px 20px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  border-radius: 20px 20px 0 0;
  border-bottom: ${({ theme }) => `1px solid ${theme.border}`};
  text-align: right;
`
const TBody = styled.tbody``

const Thead = styled.th`
  text-transform: uppercase;
  color: ${({ theme }) => theme.subText};
  background-color: ${({ theme }) => theme.tableHeader};
  padding: 16px 20px;
`
const TRow = styled.tr`
  padding: 0px;
  border-bottom: ${({ theme }) => `1px solid ${theme.border}`};
`

export type TableColumn<T> = {
  title: ReactNode
  dataIndex?: string
  align?: 'left' | 'center' | 'right'
  tooltip?: ReactNode
  render?: (data: { value: any; item: T }) => ReactNode
  style?: CSSProperties
  sticky?: boolean
}

const TableWrapper = styled.table`
  border-collapse: collapse;
  ${isMobile &&
  css`
    [data-sticky='true'] {
      position: sticky;
      z-index: 2;
      left: 0;
    }
    [data-sticky='true']::before {
      box-shadow: inset 10px 0 8px -8px #00000099;
      position: absolute;
      top: 0;
      right: 0;
      bottom: -1px;
      width: 10px;
      transform: translate(100%);
      transition: box-shadow 0.5s;
      content: '';
      pointer-events: none;
    }
  `}
`

const Td = styled.td`
  background: ${({ theme }) => theme.buttonBlack};
  font-size: 14px;
  align-items: center;
  padding: 10px 20px;
  z-index: 0;
`
export default function Table<T>({
  data = [],
  columns = [],
  style,
  headerStyle,
  totalItems,
  pageSize = 10,
  onPageChange,
  pagination = true,
  rowStyle,
}: {
  data: T[]
  columns: TableColumn<T>[]
  style?: CSSProperties
  headerStyle?: CSSProperties
  totalItems: number
  pageSize?: number
  onPageChange?: (v: number) => void
  pagination?: boolean
  rowStyle?: (record: T, index: number) => CSSProperties | undefined
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const theme = useTheme()

  const onChangePageWrap = useCallback(
    (page: number) => {
      onPageChange?.(page)
      setCurrentPage(page)
    },
    [onPageChange],
  )

  const filterData = useMemo(() => {
    return data.length > pageSize ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize) : data
  }, [data, pageSize, currentPage])

  const defaultStyle = { width: columns.some(e => e.style) ? undefined : `${100 / columns.length}%` }

  return (
    <Column flex={1}>
      <Column flex={1} style={{ width: '100%', overflowX: 'scroll' }}>
        <TableWrapper style={style}>
          <TableHeader column={columns.length} style={headerStyle}>
            {columns.map(({ tooltip, title, align, style, sticky }, i) => (
              <Thead key={i} style={style} data-sticky={sticky}>
                <MouseoverTooltip
                  width="fit-content"
                  placement="top"
                  text={tooltip}
                  maxWidth={isMobile ? '90vw' : '400px'}
                >
                  <div
                    style={{
                      textAlign: align || 'center',
                      width: '100%',
                      ...style,
                    }}
                  >
                    {tooltip ? (
                      <Text as="span" sx={{ borderBottom: `1px dotted ${theme.border}` }}>
                        {title}
                      </Text>
                    ) : (
                      title
                    )}
                  </div>
                </MouseoverTooltip>
              </Thead>
            ))}
          </TableHeader>
          <TBody>
            {filterData.length
              ? filterData.map((item, i) => (
                  <TRow key={i} style={rowStyle?.(item, i)}>
                    {columns.map(({ dataIndex, align, render, style = defaultStyle, sticky }, j) => {
                      const value = item[dataIndex as keyof T]
                      let content = null
                      try {
                        content = render ? render({ value, item }) : (value as ReactNode)
                      } catch (error) {}
                      return (
                        <Td
                          data-sticky={sticky}
                          key={`${i}${j}`}
                          style={{
                            textAlign: align || 'center',
                            ...style,
                          }}
                        >
                          {content}
                        </Td>
                      )
                    })}
                  </TRow>
                ))
              : null}
          </TBody>
        </TableWrapper>
      </Column>
      {filterData.length === 0 && (
        <Row
          style={{
            width: '100%',
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            color: theme.subText,
            padding: '50px 0px',
          }}
        >
          <NoDataIcon />
          <Text fontSize={'14px'}>
            <Trans>No data found</Trans>
          </Text>
        </Row>
      )}
      {pagination && (
        <Pagination
          totalCount={totalItems}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={onChangePageWrap}
          style={{ background: 'transparent' }}
          hideWhen1Page={false}
        />
      )}
    </Column>
  )
}
