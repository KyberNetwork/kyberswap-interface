import { Trans } from '@lingui/macro'
import React from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'

import ToggleCollapse, { ToggleItemType } from 'components/Collapse'
import { MobileModalWrapper } from 'components/swapv2/styleds'
import useTheme from 'hooks/useTheme'

import { TOTAL_STEP } from './constant'

export default function TutorialMobile({
  stopTutorial,
  steps,
  isOpen,
}: {
  stopTutorial: () => void
  steps: ToggleItemType[]
  isOpen: boolean
}) {
  const theme = useTheme()
  return (
    <MobileModalWrapper
      isOpen={isOpen}
      onDismiss={stopTutorial}
      maxHeight={`${window.innerHeight}px`}
      borderRadius={'0px'}
    >
      <Flex
        flexDirection="column"
        alignItems="center"
        width="100%"
        style={{
          background: theme.buttonGray,
          overflow: 'auto',
        }}
      >
        <div style={{ marginBottom: '1rem', padding: '16px 16px 0px', width: '100%' }}>
          <Flex justifyContent="space-between" marginBottom="10px">
            <Text fontSize={16} fontWeight={500} color={theme.text}>
              <Trans>Welcome to KyberSwap!</Trans>
            </Text>
            <X color={theme.subText} size={24} onClick={stopTutorial} />
          </Flex>
          <Text fontSize={12} color={theme.subText}>
            {TOTAL_STEP} <Trans>easy ways to get started with KyberSwap</Trans>
          </Text>
        </div>
        <div style={{ width: '100%' }}>
          <ToggleCollapse
            data={steps}
            itemStyle={{ background: theme.buttonGray }}
            itemActiveStyle={{ background: theme.background }}
          ></ToggleCollapse>
        </div>
      </Flex>
    </MobileModalWrapper>
  )
}
