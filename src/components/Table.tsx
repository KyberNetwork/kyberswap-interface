import { ReactNode } from 'react'
import { Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'

const TableHeader = styled.thead<{ column: number }>`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: ${({ column }) => `repeat(${column}, 1fr)`};
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
const TRow = styled.tr<{ column: number }>`
  padding: 10px 20px;
  display: grid;
  grid-template-columns: ${({ column }) => `repeat(${column}, 1fr)`};
  border-bottom: ${({ theme }) => `1px solid ${theme.border}`};
`

export type TableColumn = {
  title: string
  dataIndex: string
  align?: 'left' | 'center' | 'right'
  tooltip?: string
  render?: (item: any) => ReactNode
}
export default function Table<T>({
  data = [],
  columns = [],
  style,
}: {
  data: T[]
  columns: TableColumn[]
  style?: CSSProperties
}) {
  const theme = useTheme()
  return (
    <table style={style}>
      <TableHeader column={columns.length}>
        {columns.map(({ tooltip, title, align, dataIndex }) => (
          <Thead key={dataIndex || title}>
            <MouseoverTooltip width="fit-content" placement="top" text={tooltip}>
              <div
                style={{
                  textAlign: align || 'center',
                  width: '100%',
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
        {data.map((item, i) => (
          <TRow key={i} column={columns.length}>
            {columns.map(({ dataIndex, align, render }) => {
              const value = item[dataIndex as keyof T]
              return (
                <td key={typeof value === 'string' ? value : i} style={{ textAlign: align || 'center' }}>
                  {render ? render(item) : (value as ReactNode)}
                </td>
              )
            })}
          </TRow>
        ))}
      </TBody>
    </table>
  )
}
