import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import Icon from 'pages/Earns/Landing/Icon'
import { BorderWrapper, ButtonPrimaryStyled, CardWrapper } from 'pages/Earns/Landing/styles'
import { MEDIA_WIDTHS } from 'theme'

const Card = ({
  title,
  icon,
  desc,
  action,
}: {
  title: string
  icon: string
  desc: string
  action: { text: string; disabled?: boolean; onClick: () => void }
}) => {
  const theme = useTheme()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <BorderWrapper onClick={() => !action.disabled && action.onClick()}>
      <CardWrapper>
        <Flex
          flexDirection="column"
          width={upToSmall ? undefined : '80px'}
          alignItems="center"
          minWidth={upToSmall ? 'unset' : undefined}
        >
          {!upToSmall && <Box width="1px" height="36px" backgroundColor="#258166" />}
          <Icon icon={icon} size={upToSmall ? 'small' : 'medium'} customSize={upToSmall ? 48 : undefined} />
        </Flex>

        <Flex flexDirection="column" justifyContent="space-between" height="100%">
          <div>
            <Text fontSize={18} fontWeight={500} marginTop={upToSmall ? 0 : 28}>
              {title}
            </Text>
            <Text fontSize={upToMedium ? 14 : 16} color={theme.subText} marginTop="12px">
              {desc}
            </Text>
          </div>
          {(!upToSmall || !action.disabled) && (
            <ButtonPrimaryStyled disabled={action.disabled}>{action.text}</ButtonPrimaryStyled>
          )}
        </Flex>
      </CardWrapper>
    </BorderWrapper>
  )
}

export default Card
