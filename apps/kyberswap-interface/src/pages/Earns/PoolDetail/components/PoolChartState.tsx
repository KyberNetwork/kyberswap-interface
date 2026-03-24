import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Text } from 'rebass'
import styled from 'styled-components'

import { Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'

const DEFAULT_CHART_HEIGHT = 360

export const PoolChartWrapper = styled.div<{ $height?: number }>`
  width: 100%;
  height: ${({ $height }) => $height ?? DEFAULT_CHART_HEIGHT}px;
`

type PoolChartSkeletonProps = {
  height?: number
}

type PoolChartMessageProps = {
  height?: number
  message: string
}

type PoolChartStateProps = {
  children: ReactNode
  emptyMessage?: string
  errorMessage?: string
  height?: number
  isEmpty?: boolean
  isError?: boolean
  isLoading?: boolean
}

const PoolChartStateLayout = ({
  children,
  gap,
  height = DEFAULT_CHART_HEIGHT,
}: {
  children: ReactNode
  gap: number
  height?: number
}) => {
  const theme = useTheme()

  return (
    <Stack
      align="center"
      border={`1px dashed ${theme.border}`}
      borderRadius={16}
      gap={gap}
      height={height}
      justify="center"
      p="20px"
      textAlign="center"
      width="100%"
    >
      {children}
    </Stack>
  )
}

export const PoolChartSkeleton = ({ height = DEFAULT_CHART_HEIGHT }: PoolChartSkeletonProps) => {
  return (
    <PoolChartStateLayout gap={12} height={height}>
      <Skeleton height={height} width="100%" />
    </PoolChartStateLayout>
  )
}

const PoolChartMessage = ({ height = DEFAULT_CHART_HEIGHT, message }: PoolChartMessageProps) => {
  const theme = useTheme()

  return (
    <PoolChartStateLayout gap={8} height={height}>
      <Text color={theme.text} fontSize={14} fontWeight={500}>
        {message}
      </Text>
    </PoolChartStateLayout>
  )
}

const PoolChartState = ({
  children,
  emptyMessage,
  errorMessage,
  height = DEFAULT_CHART_HEIGHT,
  isEmpty,
  isError,
  isLoading,
}: PoolChartStateProps) => {
  if (isLoading) {
    return <PoolChartSkeleton height={height} />
  }

  if (isError && errorMessage) {
    return <PoolChartMessage height={height} message={errorMessage} />
  }

  if (isEmpty && emptyMessage) {
    return <PoolChartMessage height={height} message={emptyMessage} />
  }

  return children
}

export default PoolChartState
