import { ReactNode, useCallback, useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import Pagination from 'components/Pagination'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'

const TableHeader = styled.thead<{ column: number; templateColumn?: string }>`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: ${({ templateColumn }) => templateColumn};
  padding: 16px 20px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  background-color: ${({ theme }) => theme.tableHeader};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  z-index: 1;
  border-bottom: ${({ theme }) => `1px solid ${theme.border}`};
  text-align: right;
`
const TBody = styled.tbody``

const Thead = styled.th`
  text-transform: uppercase;
  color: ${({ theme }) => theme.subText};
`
const TRow = styled.tr<{ templateColumn: string }>`
  padding: 10px 20px;
  display: grid;
  grid-template-columns: ${({ templateColumn }) => templateColumn};
  border-bottom: ${({ theme }) => `1px solid ${theme.border}`};
`

export type TableColumn<T> = {
  title: ReactNode
  dataIndex?: string
  align?: 'left' | 'center' | 'right'
  tooltip?: ReactNode
  render?: (data: { value: any; item: T }) => ReactNode // todo
  style?: CSSProperties
}
export default function Table<T>({
  data = [],
  columns = [],
  style,
  totalItems,
  pageSize = 10,
  onPageChange,
  templateColumn,
}: {
  data: T[]
  columns: TableColumn<T>[]
  style?: CSSProperties
  totalItems: number
  pageSize?: number
  onPageChange?: (v: number) => void
  templateColumn?: string
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

  const templateColumnStr = templateColumn || `repeat(${columns.length}, 1fr)`
  return (
    <table style={style}>
      <TableHeader column={columns.length} templateColumn={templateColumnStr}>
        {columns.map(({ tooltip, title, align, style }, i) => (
          <Thead key={i}>
            <MouseoverTooltip width="fit-content" placement="top" text={tooltip} maxWidth={isMobile ? '90vw' : '400px'}>
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
        {filterData.map((item, i) => (
          <TRow key={i} templateColumn={templateColumnStr}>
            {columns.map(({ dataIndex, align, render, style }) => {
              const value = item[dataIndex as keyof T]
              let content = null
              try {
                content = render ? render({ value, item }) : (value as ReactNode)
              } catch (error) {}
              return (
                <td
                  key={typeof value === 'string' ? value : i}
                  style={{
                    textAlign: align || 'center',
                    fontSize: '14px',
                    display: 'grid',
                    alignItems: 'center',
                    ...style,
                  }}
                >
                  {content}
                </td>
              )
            })}
          </TRow>
        ))}
      </TBody>
      {totalItems > pageSize && (
        <Pagination
          totalCount={totalItems}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={onChangePageWrap}
          style={{ background: 'transparent' }}
        />
      )}
    </table>
  )
}
