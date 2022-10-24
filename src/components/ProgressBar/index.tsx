import { ReactNode } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'

const Wrapper = styled.div<{ height: string }>`
  border-radius: 999px;
  height: ${({ height }) => height};
  background: rgba(182, 182, 182, 0.2);
  position: relative;
`
const Bar = styled.div<{ percent: number; color?: string }>`
  border-radius: 999px;
  height: 100%;
  background: ${({ theme, color }) => color || theme.primary};
  width: ${({ percent }) => percent}%;
  position: absolute;
  left: 0;
  top: 0;
`

export default function ProgressBar({
  percent,
  color,
  valueColor,
  title,
  value,
  height = '6px',
  labelColor,
}: {
  title: string
  value?: ReactNode
  percent: number
  color?: string // bar color
  valueColor?: string
  labelColor?: string
  height?: string
}) {
  const theme = useTheme()
  return (
    <Flex flexDirection={'column'} style={{ gap: 5 }}>
      <Flex justifyContent={'space-between'} fontSize={12} color={labelColor || theme.subText} lineHeight={'normal'}>
        {title} <Text color={valueColor || theme.subText}>{value}</Text>
      </Flex>
      <Wrapper height={height}>
        <Bar percent={Math.min(100, percent)} color={color} />
      </Wrapper>
    </Flex>
  )
}
