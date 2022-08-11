import { Trans } from '@lingui/macro'
import React from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'

import ToggleCollapse, { ToggleItemType } from 'components/Collapse'
import { MobileModalWrapper } from 'components/swapv2/styleds'
import useTheme from 'hooks/useTheme'

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
    <MobileModalWrapper isOpen={isOpen} onDismiss={stopTutorial} maxHeight="100vh">
      <Flex
        flexDirection="column"
        alignItems="center"
        width="100%"
        style={{
          background: theme.buttonGray,
        }}
      >
        <Flex width="100%" padding="16px 16px 0px" marginBottom="1rem" justifyContent="space-between">
          <Text fontSize={16} fontWeight={500} color={theme.text}>
            <Trans>Welcome to KyberSwap!</Trans>
          </Text>
          <X color={theme.subText} size={24} onClick={stopTutorial} />
        </Flex>
        <div style={{ height: '100vh', width: '100%', overflow: 'auto' }}>
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
