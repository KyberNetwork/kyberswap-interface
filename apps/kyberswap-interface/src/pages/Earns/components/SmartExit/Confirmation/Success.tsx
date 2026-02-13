import { Trans } from '@lingui/macro'
import { X } from 'react-feather'
import { useNavigate } from 'react-router'
import { Flex, Text } from 'rebass'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { CheckCircle } from 'components/Icons'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'

export default function Success({
  onDismiss,
  onCloseSmartExit,
}: {
  onDismiss: () => void
  onCloseSmartExit: () => void
}) {
  const theme = useTheme()
  const navigate = useNavigate()

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center">
        <div />
        <X onClick={onCloseSmartExit} />
      </Flex>

      <Flex justifyContent="center" alignItems="center" sx={{ gap: '8px' }} fontSize={20} fontWeight={500}>
        <CheckCircle color={theme.primary} size="20px" />

        <Text>
          <Trans>Condition saved</Trans>
        </Text>
      </Flex>

      <Text mt="24px" color={theme.subText} fontSize={14}>
        <Trans>Your Smart Exit condition has been created successfully.</Trans>
      </Text>

      <Flex sx={{ gap: '12px' }} mt="24px">
        <ButtonOutlined onClick={onDismiss} flex={1}>
          <Trans>Cancel</Trans>
        </ButtonOutlined>
        <ButtonPrimary
          flex={1}
          onClick={() => {
            onCloseSmartExit()
            navigate(APP_PATHS.EARN_SMART_EXIT)
          }}
        >
          <Trans>View All Condition(s)</Trans>
        </ButtonPrimary>
      </Flex>
    </>
  )
}
