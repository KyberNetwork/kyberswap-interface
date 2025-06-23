import { CSSProperties, ReactNode, useRef, useState } from 'react'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { AutoColumn } from 'components/Column'
import Divider from 'components/Divider'
import { RowBetween } from 'components/Row'

const Wrapper = styled(AutoColumn)`
  & * {
    transition: all ease-in-out 0.3s;
  }
`

const Header = styled(RowBetween)<{ $expanded: boolean }>`
  cursor: pointer;
  z-index: 1;
`

const Content = styled.div<{ $expanded: boolean; $height: number | undefined }>`
  max-height: 0;
  margin-top: 0;

  ${({ $expanded }) => ($expanded ? `opacity:1; max-height:500px;` : `opacity:0; max-height:0;`)}
  z-index: 0;
`
export default function ExpandableBox({
  expandedDefault = false,
  headerContent,
  expandContent,
  backgroundColor,
  border,
  borderRadius,
  padding = '12px',
  color,
  style,
  className,
  hasDivider = true,
  isExpanded: expandedProp,
  onChange,
}: {
  expandedDefault?: boolean
  headerContent?: ReactNode
  expandContent?: ReactNode
  backgroundColor?: string
  border?: string
  borderRadius?: string
  padding?: string
  color?: string
  style?: CSSProperties
  className?: string
  hasDivider?: boolean
  isExpanded?: boolean
  onChange?: (value: boolean) => void
}) {
  const [expanded, setExpanded] = useState(expandedDefault)
  const contentRef = useRef<HTMLDivElement>(null)
  const contentHeight = contentRef.current?.getBoundingClientRect().height

  const handleChange = () => {
    if (onChange && expandedProp !== undefined) {
      onChange(!expandedProp)
    } else {
      setExpanded(ex => !ex)
    }
  }

  const isExpanded = expandedProp !== undefined ? expandedProp : expanded
  return (
    <Wrapper
      style={{
        backgroundColor: backgroundColor || 'black',
        border: border || 'none',
        borderRadius: borderRadius || '8px',
        overflow: 'hidden',
        color: color,
        padding: padding,
        ...style,
      }}
      className={className}
    >
      <Header
        onClick={handleChange}
        $expanded={isExpanded}
        style={{
          backgroundColor: backgroundColor || 'black',
        }}
      >
        {headerContent || 'Header'} <DropdownSVG style={{ transform: isExpanded ? 'rotate(180deg)' : undefined }} />
      </Header>

      <Content ref={contentRef} $expanded={isExpanded} $height={contentHeight}>
        {hasDivider && (
          <Divider
            style={{
              margin: '16px 0',
              opacity: isExpanded ? '1' : '0',
            }}
          />
        )}
        {expandContent}
      </Content>
    </Wrapper>
  )
}
