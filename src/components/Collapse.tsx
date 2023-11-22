import React, { CSSProperties, ReactNode, useEffect, useState } from 'react'
import { ChevronDown } from 'react-feather'
import styled, { css } from 'styled-components'

const ItemWrapper = styled.div`
  position: relative;
  padding: 16px 24px;
  width: 100%;
  background: ${({ theme }) => theme.background};
`

const Header = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  cursor: pointer;
`

const ArrowWrapper = styled.div`
  width: 32px;
  height: 32px;

  display: flex;
  justify-content: center;
  align-items: center;

  color: ${({ theme }) => theme.text};

  svg {
    transition: all 150ms ease-in-out;
  }

  &[data-expanded='true'] {
    svg {
      transform: rotate(180deg);
    }
  }
`

const ContentWrapper = styled.div<{ $hasAnim?: boolean; $maxHeight?: string }>`
  width: 100%;
  overflow: hidden;
  ${({ $hasAnim, $maxHeight }) =>
    $hasAnim &&
    css`
      transition: max-height 500ms ease;
      max-height: ${$maxHeight};
    `};
  &[data-expanded='false'] {
    max-height: 0;
  }
`

type Props = {
  header: string | JSX.Element
  expandedOnMount?: boolean
  style?: CSSProperties
  activeStyle?: CSSProperties
  children: ReactNode
  onExpand?: () => void
  className?: string
  arrowComponent?: ReactNode
  headerStyle?: CSSProperties
  headerBorderRadius?: string
  arrowStyle?: CSSProperties
  animation?: boolean
  maxHeight?: string
}

export const CollapseItem: React.FC<Props> = ({
  header,
  arrowComponent,
  children,
  expandedOnMount = false,
  style = {},
  className,
  headerStyle,
  headerBorderRadius,
  arrowStyle,
  animation = false,
  maxHeight,
}) => {
  const [isExpanded, setExpanded] = useState(expandedOnMount)

  return (
    <ItemWrapper style={style} className={className}>
      <Header
        style={{
          ...headerStyle,
          ...(headerBorderRadius !== undefined
            ? { borderRadius: isExpanded ? `${headerBorderRadius} ${headerBorderRadius} 0 0` : headerBorderRadius }
            : {}),
        }}
        onClick={() => {
          setExpanded(e => !e)
        }}
      >
        {header}
        <ArrowWrapper data-expanded={isExpanded} style={arrowStyle}>
          {arrowComponent || <ChevronDown />}
        </ArrowWrapper>
      </Header>
      <ContentWrapper data-expanded={isExpanded} $hasAnim={animation} $maxHeight={maxHeight}>
        {children}
      </ContentWrapper>
    </ItemWrapper>
  )
}

export type ToggleItemType = { title: React.ReactNode; content: ReactNode | string; style?: CSSProperties }
// open one, close the others
const ToggleCollapse = ({
  data,
  itemActiveStyle,
  itemStyle,
  style,
  defaultExpand = 0,
}: {
  data: ToggleItemType[]
  itemActiveStyle?: CSSProperties
  itemStyle?: CSSProperties
  style?: CSSProperties
  defaultExpand?: number
}) => {
  const [expandedIndex, setExpandedIndex] = useState(defaultExpand)
  useEffect(() => {
    setExpandedIndex(defaultExpand)
  }, [defaultExpand])
  return (
    <div style={style}>
      {data.map((item, index) => {
        const isActive = expandedIndex === index
        return (
          <ItemWrapper key={index} style={{ ...itemStyle, ...item.style, ...(isActive ? itemActiveStyle : {}) }}>
            <Header
              onClick={() => {
                setExpandedIndex(isActive ? -1 : index)
              }}
            >
              {item.title}
              <ArrowWrapper data-expanded={isActive}>
                <ChevronDown />
              </ArrowWrapper>
            </Header>
            <ContentWrapper data-expanded={isActive}>{item.content}</ContentWrapper>
          </ItemWrapper>
        )
      })}
    </div>
  )
}

export default ToggleCollapse
