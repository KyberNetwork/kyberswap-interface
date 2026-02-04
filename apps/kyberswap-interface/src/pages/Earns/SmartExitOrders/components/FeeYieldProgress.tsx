import { Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import { formatDisplayNumber } from 'utils/numbers'

const FeeYieldProgressWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6.5px;
  width: 100%;
`

const FeeYieldProgressBar = styled.div`
  height: 4px;
  width: 100%;
  background: ${({ theme }) => theme.border};
  border-radius: 4px;
  position: relative;
  overflow: hidden;
`

const FeeYieldProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${({ $progress }) => Math.min($progress, 100)}%;
  background: ${({ theme }) => theme.primary};
  border-radius: 4px;
  transition: width 0.3s ease;
`

type FeeYieldProgressProps = {
  targetYield: number
  currentYield: number | undefined
}

const FeeYieldProgress = ({ targetYield, currentYield }: FeeYieldProgressProps) => {
  const theme = useTheme()
  const progress = currentYield !== undefined ? (currentYield / targetYield) * 100 : 0
  const displayCurrentYield = currentYield !== undefined ? Number(currentYield.toFixed(2)) : 0

  return (
    <FeeYieldProgressWrapper>
      <Text color={theme.subText} fontSize="12px" textAlign="right">
        The{' '}
        <Text as="span" color={theme.text}>
          fee yield ≥ {formatDisplayNumber(targetYield, { significantDigits: 4 })}%
        </Text>
      </Text>
      <Text fontSize="12px" color={theme.subText} textAlign="right" mt="3px">
        <Text as="span" color={theme.text}>
          {displayCurrentYield}%
        </Text>{' '}
        / {formatDisplayNumber(targetYield, { significantDigits: 4 })}%
      </Text>
      <FeeYieldProgressBar>
        <FeeYieldProgressFill $progress={progress} />
      </FeeYieldProgressBar>
    </FeeYieldProgressWrapper>
  )
}

export default FeeYieldProgress
