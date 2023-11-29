import { Trans } from '@lingui/macro'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS, StyledInternalLink } from 'theme'

import { ButtonPrimaryWithHighlight } from './styleds'

const SText = styled(Text)``

const CreatePoolLink = styled(StyledInternalLink)`
  display: flex;
  gap: 4px;
  flex-direction: column;
  padding: 8px;
  border-radius: 8px;
  color: unset;
  text-decoration: none !important;
  &:hover {
    background-color: ${({ theme }) => theme.background};
  }

  & > ${SText}:first-child {
    font-size: 16px;
    font-weight: 500;
    line-height: 24px;
  }
  & > ${SText}:nth-child(2) {
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
  }
`

const DropdownIcon = styled(DropdownSVG)`
  transition: transform 300ms;
  width: 20px;
  height: 20px;
`

const CreatePoolsButton = ({ highlightCreateButton }: { highlightCreateButton: boolean }) => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const theme = useTheme()

  const links = (
    <Flex sx={{ gap: '4px' }} flexDirection="column">
      <CreatePoolLink to={APP_PATHS.ELASTIC_CREATE_POOL}>
        <SText color={theme.text}>
          <Trans>Elastic Position</Trans>
        </SText>
        <SText color={theme.subText}>
          <Trans>Create an Elastic Pool</Trans>
        </SText>
      </CreatePoolLink>
      <CreatePoolLink to={APP_PATHS.CLASSIC_CREATE_POOL}>
        <SText color={theme.text}>
          <Trans>Classic Position</Trans>
        </SText>
        <SText color={theme.subText}>
          <Trans>Create a Classic Pool</Trans>
        </SText>
      </CreatePoolLink>
    </Flex>
  )

  const button = (
    <ButtonPrimaryWithHighlight
      data-highlight={highlightCreateButton}
      sx={{ whiteSpace: 'nowrap', border: 'none !important', padding: '8px 16px !important' }}
    >
      <Flex sx={{ gap: '8px' }} alignItems="center">
        <Text>
          <Trans>Create Pool</Trans>
        </Text>{' '}
        <DropdownIcon />
      </Flex>
    </ButtonPrimaryWithHighlight>
  )

  return upToSmall ? (
    <MouseoverTooltip text={links} width="200px" padding="12px" placement="bottom" style={{ borderRadius: '16px' }}>
      {button}
    </MouseoverTooltip>
  ) : (
    <MouseoverTooltip text={links} width="200px" padding="12px" placement="bottom" style={{ borderRadius: '16px' }}>
      <Link to={APP_PATHS.ELASTIC_CREATE_POOL}>{button}</Link>
    </MouseoverTooltip>
  )
}

export default CreatePoolsButton
