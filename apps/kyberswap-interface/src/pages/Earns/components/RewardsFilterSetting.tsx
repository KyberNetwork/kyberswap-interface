import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import ClaimThresholdControl from 'components/ClaimThresholdControl'
import { formatThresholdValue } from 'components/ClaimThresholdControl/CustomClaimThresholdInput'
import useTheme from 'hooks/useTheme'

import PositionStatusControl, { POSITION_STATUS_OPTIONS, PositionStatus } from './PositionStatusControl'

const DropdownIcon = styled.div`
  height: 16px;
  color: ${({ theme }) => theme.subText};
  transition: all 0.2s ease-in-out;

  &[data-flip='true'] {
    transform: rotate(180deg);
  }
`

const Expandable = styled(Flex)<{ height: number; isOpen: boolean }>`
  flex-direction: column;
  gap: 12px;
  padding-top: ${({ isOpen }) => (isOpen ? '12px' : '0')};
  overflow: hidden;
  height: ${({ height, isOpen }) => (isOpen ? `${height}px` : '0')};
  transition: height 0.2s ease-in-out, padding 0.2s ease-in-out;

  ${({ theme, isOpen }) => theme.mediaWidth.upToSmall`
    min-height: ${isOpen ? 'fit-content' : '0'};
  `}
`

type Props = {
  thresholdValue?: number
  positionStatus?: PositionStatus
  onThresholdChange?: (value: number) => void
  onPositionStatusChange?: (value: PositionStatus) => void
}

export const RewardsFilterSetting = ({
  thresholdValue,
  positionStatus,
  onThresholdChange,
  onPositionStatusChange,
}: Props) => {
  const theme = useTheme()
  const [thresholdExpanded, setThresholdExpanded] = useState(false)
  const [statusExpanded, setStatusExpanded] = useState(false)

  const thresholdDisplayValue = formatThresholdValue(thresholdValue)
  const isExpanded = statusExpanded || thresholdExpanded

  return (
    <Flex sx={{ flexDirection: 'column' }}>
      <Flex sx={{ alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <Flex
          sx={{ alignItems: 'center', gap: '4px', cursor: 'pointer' }}
          onClick={() => {
            setStatusExpanded(val => {
              const next = !val
              if (next) setThresholdExpanded(false)
              return next
            })
          }}
        >
          <Text fontSize={14} color={theme.subText}>
            <Trans>Position Status</Trans>
          </Text>
          <Text fontSize={14} color={theme.text}>
            {POSITION_STATUS_OPTIONS.find(option => option.value === positionStatus)?.label || ''}
          </Text>
          <DropdownIcon data-flip={statusExpanded}>
            <ChevronDown width={16} height={16} />
          </DropdownIcon>
        </Flex>

        <Flex
          sx={{ alignItems: 'center', gap: '4px', cursor: 'pointer' }}
          onClick={() => {
            setThresholdExpanded(prev => {
              const next = !prev
              if (next) setStatusExpanded(false)
              return next
            })
          }}
        >
          <Text fontSize={14} color={theme.subText}>
            <Trans>Claim threshold</Trans>
          </Text>
          <Text fontSize={14} color={theme.text}>
            {thresholdDisplayValue}
          </Text>
          <DropdownIcon data-flip={thresholdExpanded}>
            <ChevronDown width={16} height={16} />
          </DropdownIcon>
        </Flex>
      </Flex>

      <Expandable height={statusExpanded ? 48 : thresholdExpanded ? 88 : 0} isOpen={isExpanded}>
        {statusExpanded && <PositionStatusControl value={positionStatus} onChange={onPositionStatusChange} />}
        {thresholdExpanded && (
          <>
            <Text fontSize={12} color={theme.subText}>
              <Trans>
                Only position with rewards above this estimated value will be included in the claim. Others will remain
                unclaimed.
              </Trans>
            </Text>
            <ClaimThresholdControl value={thresholdValue} onChange={onThresholdChange} />
          </>
        )}
      </Expandable>
    </Flex>
  )
}

export default RewardsFilterSetting
