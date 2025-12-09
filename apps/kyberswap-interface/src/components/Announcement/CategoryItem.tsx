import React from 'react'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
  font-size: 14px;
  padding: 16px 20px;
  gap: 14px;
  display: flex;
  align-items: center;
  cursor: pointer;
  :hover {
    background-color: ${({ theme }) => theme.buttonBlack};
  }
`

const IconWrapper = styled.div`
  background-color: ${({ theme }) => theme.white}1A;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const SubLine = styled.div<{ maxLine?: number }>`
  color: ${({ theme }) => theme.subText};
  display: -webkit-box;
  -webkit-line-clamp: ${({ maxLine }) => maxLine || 1};
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Counter = styled.div`
  background-color: ${({ theme }) => theme.green};
  color: ${({ theme }) => theme.black};
  font-size: 12px;
  font-weight: 500;
  min-width: 24px;
  height: 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
`

type Props = {
  title?: string
  icon?: React.ReactNode
  subLine1?: React.ReactNode
  subLine2?: React.ReactNode
  counter?: number
  style?: CSSProperties
  onClick?: () => void
}

export default function CategoryItem({ onClick, style, title, icon, subLine1, subLine2, counter }: Props) {
  const theme = useTheme()

  return (
    <Wrapper onClick={onClick} style={style}>
      <IconWrapper>{icon}</IconWrapper>
      <Flex flexDirection="column" style={{ flex: 1, gap: 2 }}>
        <Text color={theme.white} fontWeight={500}>
          {title}
        </Text>
        {!!subLine1 && (typeof subLine1 === 'string' ? <SubLine maxLine={2}>{subLine1}</SubLine> : subLine1)}
        {!!subLine2 && (typeof subLine2 === 'string' ? <SubLine>{subLine2}</SubLine> : subLine2)}
      </Flex>
      <Counter>{counter}</Counter>
    </Wrapper>
  )
}
