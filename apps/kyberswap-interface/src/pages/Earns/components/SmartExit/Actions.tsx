import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { MEDIA_WIDTHS } from 'theme'

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
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <Flex sx={{ gap: '20px' }} mt="20px" pb={upToSmall ? '20px' : '0'} justifyContent="center">
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
