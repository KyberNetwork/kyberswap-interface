import { ReactNode } from 'react'
import { Flex, Text } from 'rebass'
import styled, { css, keyframes } from 'styled-components'

import useTheme from 'hooks/useTheme'

const loadingShimmer = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
`

const Wrapper = styled.div<{ height: string; width: string; background?: string }>`
  border-radius: 999px;
  height: ${({ height }) => height};
  width: ${({ width }) => width};
  background: ${({ background }) => background || 'rgba(182, 182, 182, 0.2)'};
  position: relative;
`
const Bar = styled.div<{ percent: number; color?: string; loading?: boolean }>`
  border-radius: 999px;
  height: 100%;
  background: ${({ theme, color, loading }) => (loading ? theme.tableHeader : color || theme.primary)};
  width: ${({ percent, loading }) => (loading ? '100%' : percent + '%')};
  ${({ percent, loading }) => !loading && percent !== 0 && 'min-width: 8px;'};
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;

  ${({ loading, theme }) =>
    loading
      ? css`
          ::after {
            content: '';
            position: absolute;
            width: 40%;
            inset: 0;
            background: linear-gradient(90deg, transparent, ${theme.primary}, transparent);
            animation: ${loadingShimmer} 1.2s ease-in-out infinite;
          }
        `
      : ''}
`

export default function ProgressBar({
  label,
  value,
  percent = 0,
  color,
  valueColor,
  backgroundColor,
  labelColor,
  width,
  height = '6px',
  loading = false,
}: {
  label?: string
  value?: ReactNode
  percent?: number
  color?: string // bar color
  valueColor?: string
  backgroundColor?: string // deactive bar color
  labelColor?: string
  width?: string
  height?: string
  loading?: boolean
}) {
  const theme = useTheme()
  const normalizedPercent = Math.min(100, Math.max(0, percent))

  return (
    <Flex flexDirection={'column'} style={{ gap: 5 }}>
      {label && value ? (
        <Flex justifyContent={'space-between'} fontSize={12} color={labelColor || theme.subText} lineHeight={'normal'}>
          {label} <Text color={valueColor || theme.subText}>{value}</Text>
        </Flex>
      ) : null}
      <Wrapper height={height} width={width ?? 'unset'} background={backgroundColor}>
        <Bar loading={loading} percent={loading ? 0 : normalizedPercent < 0.5 ? 0 : normalizedPercent} color={color} />
      </Wrapper>
    </Flex>
  )
}
