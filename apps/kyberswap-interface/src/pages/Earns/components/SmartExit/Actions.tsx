import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'

export default function Actions({
  onDismiss,
  onPreview,
  disabled,
  feeLoading,
}: {
  onDismiss: () => void
  onPreview: () => void
  disabled: boolean
  feeLoading: boolean
}) {
  return (
    <Flex sx={{ gap: '20px' }} mt="20px" justifyContent="center">
      <ButtonOutlined onClick={onDismiss} width="188px">
        <Text fontSize={14} lineHeight="20px">
          <Trans>Cancel</Trans>
        </Text>
      </ButtonOutlined>
      <ButtonPrimary width="188px" disabled={disabled} onClick={onPreview}>
        <Text fontSize={14} lineHeight="20px">
          {feeLoading ? <Trans>Estimating fee...</Trans> : <Trans>Preview</Trans>}
        </Text>
      </ButtonPrimary>
    </Flex>
  )
}
